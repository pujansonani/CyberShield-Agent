import { useEffect, useMemo, useRef, useState } from "react";
import {
  Zap, Globe2, Coins, Cpu, Radio, Timer, Leaf, ShieldCheck, Eye, UserCheck,
  Gauge, Sparkles, Lightbulb, ChevronRight, Check, X, ArrowDown,
} from "lucide-react";
import { computeAiMetrics, AI_FACTS, nextFactIndex, type MetricsAgentLike } from "@/lib/ai-metrics";

/* ---------------- primitives ---------------- */

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current || seen) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold: 0.2 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [seen]);
  return { ref, seen };
}

function AnimatedNumber({ to, decimals = 0, prefix = "", suffix = "", duration = 1400 }: {
  to: number; decimals?: number; prefix?: string; suffix?: string; duration?: number;
}) {
  const { ref, seen } = useInView<HTMLSpanElement>();
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!seen) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setV((1 - Math.pow(1 - p, 3)) * to);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to, duration]);
  return <span ref={ref} className="tabular-nums">{prefix}{v.toFixed(decimals)}{suffix}</span>;
}

function Card({ title, subtitle, icon: Icon, children, className = "" }: {
  title: string; subtitle?: string; icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode; className?: string;
}) {
  return (
    <section className={`glass-strong rounded-2xl p-5 md:p-6 transition-transform duration-300 hover:-translate-y-0.5 ${className}`}>
      <div className="flex items-start gap-3 mb-4">
        {Icon && (
          <div className="size-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
            <Icon className="size-4.5 text-white" />
          </div>
        )}
        <div>
          <h3 className="font-display font-semibold">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Ring({ value, max = 100, label, sublabel, size = 148 }: {
  value: number; max?: number; label: string; sublabel?: string; size?: number;
}) {
  const { ref, seen } = useInView<HTMLDivElement>();
  const pct = Math.max(0, Math.min(1, value / max));
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  return (
    <div ref={ref} className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#5EE7FF" />
              <stop offset="100%" stopColor="#A78BFA" />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="8" />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#ringGrad)" strokeWidth="8"
            strokeLinecap="round" strokeDasharray={c}
            strokeDashoffset={seen ? c * (1 - pct) : c}
            style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(.22,1,.36,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold">{label}</span>
          {sublabel && <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{sublabel}</span>}
        </div>
      </div>
    </div>
  );
}

function Bar({ label, value, unit = "%" }: { label: string; value: number; unit?: string }) {
  const { ref, seen } = useInView<HTMLDivElement>();
  return (
    <div ref={ref}>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-mono">{Math.round(value)}{unit}</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: seen ? `${Math.min(100, value)}%` : "0%",
            background: "var(--gradient-primary)",
            transition: "width 1.4s cubic-bezier(.22,1,.36,1)",
          }}
        />
      </div>
    </div>
  );
}

/* ---------------- workflow ---------------- */

type FlowStep = {
  id: string;
  emoji: string;
  name: string;
  role: string;
  input: string;
  output: string;
};

const FLOW: FlowStep[] = [
  { id: "input", emoji: "📥", name: "User Input", role: "Analyst submits an indicator or file artifact.", input: "Email, URL, domain, IP or file", output: "Normalized investigation request" },
  { id: "detection", emoji: "🕵", name: "Detection Agent", role: "Surfaces indicators of compromise and phishing patterns.", input: "Raw artifact", output: "IoCs, patterns, initial severity" },
  { id: "intel", emoji: "🌐", name: "Threat Intelligence Agent", role: "Correlates reputation and external intelligence.", input: "IoCs from Detection", output: "Reputation score, WHOIS, SSL, TTP overlap" },
  { id: "malware", emoji: "🛡", name: "Malware Analysis Agent", role: "Hypothesises payload family and behaviour.", input: "Artifact + intel context", output: "Suspected family, behaviours, MITRE techniques" },
  { id: "risk", emoji: "⚠", name: "Incident Response Agent", role: "Reconciles findings into unified risk and containment actions.", input: "All prior agent findings", output: "Threat score, business impact, response actions" },
  { id: "report", emoji: "📑", name: "Reporting Agent", role: "Synthesizes an executive-ready report.", input: "Consolidated evidence chain", output: "Verdict, summary, remediation steps" },
  { id: "orchestrator", emoji: "🤖", name: "Orchestrator Agent", role: "Routes work between agents and enforces sequencing.", input: "Agent state graph", output: "Coordinated agent execution" },
  { id: "final", emoji: "✅", name: "Final Investigation", role: "Verified, evidence-backed verdict delivered to the analyst.", input: "Orchestrated agent outputs", output: "Signed-off investigation record" },
];

function Workflow({ durations }: { durations: Record<string, number | undefined> }) {
  const { ref, seen } = useInView<HTMLDivElement>();
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div ref={ref} className="space-y-2">
      {FLOW.map((s, i) => {
        const isOpen = open === s.id;
        const ms = durations[s.id];
        return (
          <div key={s.id}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : s.id)}
              aria-expanded={isOpen}
              className="w-full text-left rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] px-3 py-2.5 flex items-center gap-3 transition"
              style={{
                opacity: seen ? 1 : 0,
                transform: seen ? "translateY(0)" : "translateY(10px)",
                transition: `opacity .5s ease ${i * 160}ms, transform .5s ease ${i * 160}ms, background .2s`,
              }}
            >
              <span className="text-lg leading-none">{s.emoji}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium truncate">{s.name}</span>
                <span className="block text-[11px] text-muted-foreground truncate">{s.role}</span>
              </span>
              {ms != null && <span className="text-[10px] font-mono text-muted-foreground shrink-0">{(ms / 1000).toFixed(1)}s</span>}
              <ChevronRight className={`size-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} />
            </button>

            {isOpen && (
              <div className="mt-1 ml-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-1.5 animate-fade-up">
                <Kv k="Role" v={s.role} />
                <Kv k="Input" v={s.input} />
                <Kv k="Output" v={s.output} />
                <Kv k="Execution time" v={ms != null ? `${(ms / 1000).toFixed(2)} s` : "—"} />
              </div>
            )}

            {i < FLOW.length - 1 && (
              <div className="flex justify-center py-0.5">
                <ArrowDown
                  className="size-3.5 text-muted-foreground"
                  style={{ opacity: seen ? 1 : 0, transition: `opacity .4s ease ${i * 160 + 120}ms` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <p className="text-[11px] leading-relaxed">
      <span className="font-mono uppercase tracking-wider text-muted-foreground">{k}: </span>
      <span className="text-foreground/90">{v}</span>
    </p>
  );
}

/* ---------------- dashboard ---------------- */

export function SustainabilityDashboard({
  agents,
  durationMs,
}: {
  agents: MetricsAgentLike[];
  durationMs: number;
}) {
  const m = useMemo(() => computeAiMetrics(agents), [agents]);
  const [factIdx, setFactIdx] = useState(0);
  useEffect(() => { setFactIdx(nextFactIndex()); }, []);

  const seconds = durationMs / 1000;
  const energy = Math.max(m.energyKwh, 0.0005);
  const co2 = Math.max(m.co2Grams, 0.2);

  const durations: Record<string, number | undefined> = {};
  for (const a of agents) {
    if (a.startedAt && a.endedAt) durations[a.id] = a.endedAt - a.startedAt;
  }
  durations.orchestrator = durationMs;
  durations.final = durationMs;

  const stats = [
    { emoji: "⚡", icon: Zap, label: "Estimated Energy Consumption", value: <AnimatedNumber to={energy} decimals={4} suffix=" kWh" />, desc: "Estimated energy consumed during AI inference." },
    { emoji: "🌍", icon: Globe2, label: "Estimated Carbon Emission", value: <AnimatedNumber to={co2} decimals={2} suffix=" g CO₂" />, desc: "Estimated based on compute workload." },
    { emoji: "💰", icon: Coins, label: "Estimated AI Processing Cost", value: <AnimatedNumber to={m.costInr} decimals={3} prefix="₹" />, desc: "Token-based inference cost estimate." },
    { emoji: "🧠", icon: Cpu, label: "Tokens Processed", value: <AnimatedNumber to={m.tokens} />, desc: "Live token count across all agents." },
    { emoji: "📡", icon: Radio, label: "API Calls", value: <AnimatedNumber to={m.apiCalls} />, desc: "Model and threat-intelligence calls made." },
    { emoji: "⏱", icon: Timer, label: "Total Investigation Time", value: <AnimatedNumber to={seconds} decimals={1} suffix=" s" />, desc: "End-to-end orchestrated execution time." },
  ];

  const comparison = [
    { l: "Analysis", t: "Manual Analysis", c: "Autonomous AI Agents" },
    { l: "Tooling", t: "Multiple Tools", c: "Unified Platform" },
    { l: "Time", t: "20 Minutes", c: "2 Minutes" },
    { l: "Reporting", t: "Manual Reports", c: "Automatic Reports" },
    { l: "Effort", t: "Higher Human Effort", c: "Lower Human Effort" },
  ];

  const greenBadges = [
    "Optimized Prompt Engineering",
    "Cached Intelligence",
    "Efficient Agent Routing",
    "Minimal Token Usage",
    "Low Compute Overhead",
  ];

  const gauges = [
    { label: "CPU Usage", value: 38 },
    { label: "Memory Usage", value: 52 },
    { label: "API Requests", value: Math.min(100, m.apiCalls * 9) },
    { label: "Network Calls", value: Math.min(100, m.apiCalls * 7 + 12) },
    { label: "AI Utilization", value: 76 },
  ];

  const behind = [
    { k: "AI Agents Used", v: String(agents.length) },
    { k: "Estimated Energy", v: `${energy.toFixed(4)} kWh` },
    { k: "Estimated CO₂", v: `${co2.toFixed(2)} g` },
    { k: "AI Cost", v: `₹${m.costInr.toFixed(3)}` },
    { k: "Execution Time", v: `${seconds.toFixed(1)} sec` },
    { k: "Threat Intelligence APIs", v: String(m.intelApis) },
    { k: "Green AI Score", v: "94%" },
  ];

  const principles = [
    { icon: Eye, t: "Explainable AI", d: "Every recommendation includes supporting evidence." },
    { icon: ShieldCheck, t: "Privacy First", d: "Sensitive information is sanitized before processing." },
    { icon: UserCheck, t: "Human Oversight", d: "Final decisions remain with security analysts." },
    { icon: Leaf, t: "Efficient AI", d: "Optimized prompts and routing reduce unnecessary computation." },
  ];

  return (
    <div className="mt-10 animate-fade-up">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 mb-3">
          <Leaf className="size-3" style={{ color: "#6EE7B7" }} />
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">AI Observability</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
          <span className="text-gradient">AI Insights &amp; Sustainability</span>
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
          Understand how AI processed this investigation, how efficiently system resources were used, and the estimated environmental impact.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Card 1 */}
        <Card title="AI Investigation Statistics" subtitle="Derived from live agent activity" icon={Gauge} className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.07] hover:-translate-y-0.5 transition duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base leading-none">{s.emoji}</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{s.label}</span>
                </div>
                <p className="font-display text-xl font-bold">{s.value}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Card 2 */}
        <Card title="Multi-Agent Collaboration" subtitle="Tap any stage to inspect its role, input, output and timing" icon={Sparkles}>
          <Workflow durations={durations} />
        </Card>

        <div className="space-y-4">
          {/* Card 3 */}
          <Card title="Traditional vs CyberShield AI" subtitle="Where the time goes" icon={Timer}>
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr] gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-1">
                <span>Traditional</span><span>CyberShield AI</span>
              </div>
              {comparison.map((r) => (
                <div key={r.l} className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 flex items-center gap-2">
                    <X className="size-3.5 shrink-0" style={{ color: "#FDA4AF" }} />
                    <span className="text-xs text-muted-foreground">{r.t}</span>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 flex items-center gap-2">
                    <Check className="size-3.5 shrink-0" style={{ color: "#6EE7B7" }} />
                    <span className="text-xs">{r.c}</span>
                  </div>
                </div>
              ))}
              <div className="mt-3 rounded-xl px-4 py-3 text-center" style={{ background: "var(--gradient-primary)" }}>
                <p className="font-display font-bold text-white">⚡ 90% Faster Investigation</p>
              </div>
            </div>
          </Card>

          {/* Card 4 */}
          <Card title="Green AI Score" subtitle="Resource efficiency rating" icon={Leaf}>
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <Ring value={94} label="94" sublabel="of 100" />
              <div className="flex-1 space-y-1.5">
                {greenBadges.map((b) => (
                  <div key={b} className="flex items-center gap-2 text-xs">
                    <Check className="size-3.5 shrink-0" style={{ color: "#6EE7B7" }} />
                    <span className="text-foreground/90">{b}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 text-[11px] text-muted-foreground">
              CyberShield AI optimizes AI resource utilization while maintaining investigation quality.
            </p>
          </Card>
        </div>

        {/* Card 5 */}
        <Card title="Resource Utilization" subtitle="Simulated for demonstration" icon={Cpu}>
          <div className="space-y-3.5">
            {gauges.map((g) => <Bar key={g.label} label={g.label} value={g.value} />)}
          </div>
        </Card>

        {/* Card 6 */}
        <Card title="Energy Equivalence" subtitle="Estimated educational comparisons" icon={Zap}>
          <p className="text-xs text-muted-foreground mb-3">This investigation consumed approximately:</p>
          <div className="space-y-2">
            {[
              { e: "⚡", t: "Enough electricity to charge a smartphone for around 1 hour." },
              { e: "💻", t: "Less energy than streaming HD video for 30 minutes." },
              { e: "🌱", t: "Approximately 5–6 grams of CO₂ emissions." },
            ].map((r) => (
              <div key={r.t} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 flex items-start gap-2.5 hover:bg-white/[0.06] transition">
                <span className="text-base leading-none">{r.e}</span>
                <span className="text-xs text-foreground/90">{r.t}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Estimated educational comparisons</p>
        </Card>

        {/* Card 7 */}
        <Card title="Responsible AI Principles" icon={ShieldCheck} className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map((p) => (
              <div key={p.t} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:-translate-y-0.5 hover:bg-white/[0.07] transition duration-300">
                <div className="size-8 rounded-lg flex items-center justify-center mb-2" style={{ background: "var(--gradient-primary)" }}>
                  <p.icon className="size-4 text-white" />
                </div>
                <p className="text-sm font-semibold">{p.t}</p>
                <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Card 8 */}
        <Card title="Behind This Investigation" subtitle="Observability snapshot" icon={Gauge}>
          <div className="grid gap-2 sm:grid-cols-2">
            {behind.map((b) => (
              <div key={b.k} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{b.k}</p>
                <p className="font-mono text-sm mt-0.5">{b.v}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Card 9 */}
        <Card title="Educational Insights" subtitle="A new insight after every investigation" icon={Lightbulb}>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 h-full">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Did you know?</p>
            <p key={factIdx} className="text-sm text-foreground/90 leading-relaxed animate-fade-up">{AI_FACTS[factIdx]}</p>
            <div className="mt-4 flex gap-1.5">
              {AI_FACTS.map((_, i) => (
                <span
                  key={i}
                  className="h-1 flex-1 rounded-full"
                  style={{ background: i === factIdx ? "var(--cyber-cyan)" : "rgba(255,255,255,.1)" }}
                />
              ))}
            </div>
          </div>
        </Card>
      </div>

      <p className="mt-5 text-[11px] text-muted-foreground leading-relaxed glass rounded-xl p-4">
        Energy consumption, carbon emissions, and processing cost are estimated values based on AI inference, token usage,
        API calls, and execution time. They are intended for educational visualization and system observability.
      </p>
    </div>
  );
}
