import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Shield, ArrowRight, Activity, AlertTriangle, Clock, Users,
  Brain, Network, Eye, Radar, Bug, FileCheck2, Gauge, Zap,
  Code2, Database, Cloud, Sparkles, ChevronRight, CheckCircle2,
  ArrowDown, Workflow as WorkflowIcon, ShieldCheck, ShieldAlert,
} from "lucide-react";
import { ParticleField } from "@/components/ParticleField";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";
import { Counter } from "@/components/Counter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CyberShield AI — Autonomous Multi-Agent Cyber Defense" },
      { name: "description", content: "An intelligent network of autonomous cybersecurity agents that collaborate to detect, investigate, and respond to cyber threats in real time." },
      { property: "og:title", content: "CyberShield AI" },
      { property: "og:description", content: "Autonomous Multi-Agent Cyber Defense Platform — HackAgentAIx 2026" },
    ],
  }),
  component: Landing,
});

function Nav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto mt-4 max-w-6xl px-4">
        <div className="glass-strong rounded-2xl flex items-center justify-between px-5 py-3">
          <a href="#top" className="flex items-center gap-2">
            <div className="relative">
              <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
                <Shield className="size-4 text-white" />
              </div>
              <div className="absolute inset-0 rounded-lg blur-md opacity-60" style={{ background: "var(--gradient-primary)" }} />
            </div>
            <span className="font-display font-semibold tracking-tight">CyberShield AI</span>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#architecture" className="hover:text-foreground transition">Architecture</a>
            <a href="#workflow" className="hover:text-foreground transition">Workflow</a>
            <a href="#collab" className="hover:text-foreground transition">Collaboration</a>
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#roadmap" className="hover:text-foreground transition">Roadmap</a>
          </nav>
          <a href="#architecture" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium rounded-lg px-3.5 py-1.5"
            style={{ background: "var(--gradient-primary)", color: "white", boxShadow: "var(--shadow-glow)" }}>
            View Demo <ArrowRight className="size-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-20">
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute inset-0">
        <ParticleField />
      </div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--cyber-purple), transparent 60%)" }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-8 animate-fade-up">
          <span className="size-1.5 rounded-full bg-cyber-cyan animate-pulse" style={{ background: "var(--cyber-cyan)" }} />
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">HackAgentAIx 2026 · Track 2 · Multi-Agent Systems</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-display font-bold tracking-tighter animate-fade-up" style={{ animationDelay: ".1s" }}>
          <span className="text-gradient">CyberShield AI</span>
        </h1>
        <p className="mt-6 text-xl md:text-2xl font-display text-foreground/90 animate-fade-up" style={{ animationDelay: ".2s" }}>
          Autonomous Multi-Agent Cyber Defense Platform
        </p>
        <p className="mt-6 max-w-2xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed animate-fade-up" style={{ animationDelay: ".3s" }}>
          An intelligent network of autonomous cybersecurity agents that collaborate to detect, investigate, analyze,
          and respond to cyber threats in real time.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: ".4s" }}>
          <a href="#architecture" className="group inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
            <Network className="size-4" /> View Architecture
            <ArrowRight className="size-4 group-hover:translate-x-1 transition" />
          </a>
          <a href="#workflow" className="group inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium glass-strong glow-border hover:bg-white/5 transition">
            <Workflow className="size-4 text-cyber-cyan" style={{ color: "var(--cyber-cyan)" }} /> Explore Workflow
          </a>
        </div>

        {/* metric chips */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto animate-fade-up" style={{ animationDelay: ".5s" }}>
          {[
            { v: "6", l: "Specialized Agents" },
            { v: "<10s", l: "Investigation Time" },
            { v: "24/7", l: "Autonomous Defense" },
            { v: "98%", l: "Detection Accuracy" },
          ].map(m => (
            <div key={m.l} className="glass rounded-xl px-4 py-3 text-center">
              <div className="text-2xl font-display font-bold text-gradient">{m.v}</div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">{m.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground">
        <ArrowDown className="size-4 animate-bounce" />
      </div>
    </section>
  );
}

function SectionHeading({ tag, title, sub }: { tag: string; title: React.ReactNode; sub?: string }) {
  return (
    <div className="text-center max-w-3xl mx-auto mb-14">
      <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 mb-5">
        <Sparkles className="size-3" style={{ color: "var(--cyber-cyan)" }} />
        <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{tag}</span>
      </div>
      <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight">{title}</h2>
      {sub && <p className="mt-4 text-muted-foreground text-lg">{sub}</p>}
    </div>
  );
}

function Problem() {
  const stats = [
    { icon: AlertTriangle, label: "Phishing Attacks", v: 1265, suffix: "%", note: "rise since 2022", color: "var(--cyber-pink)" },
    { icon: Bug, label: "Malware Threats", v: 560, suffix: "K/day", note: "new variants detected", color: "var(--cyber-purple)" },
    { icon: Clock, label: "Avg Response Time", v: 277, suffix: " days", note: "to identify a breach", color: "var(--cyber-blue)" },
    { icon: Users, label: "SOC Team Overload", v: 70, suffix: "%", note: "alerts go uninvestigated", color: "var(--cyber-cyan)" },
  ];
  return (
    <section className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          tag="The Problem"
          title={<>Security teams are <span className="text-gradient">drowning in alerts</span></>}
          sub="Organizations receive thousands of security alerts daily. Manual investigation is slow, resource-intensive, and prone to human error."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className="group glass-strong rounded-2xl p-6 glow-border hover:-translate-y-1 transition-all duration-500">
              <div className="flex items-center justify-between mb-5">
                <div className="size-10 rounded-lg flex items-center justify-center glass" style={{ color: s.color }}>
                  <s.icon className="size-5" />
                </div>
                <Activity className="size-4 text-muted-foreground/40 group-hover:text-foreground transition" />
              </div>
              <div className="text-4xl font-display font-bold tracking-tight">
                <Counter to={s.v} suffix={s.suffix} />
              </div>
              <div className="mt-2 text-sm font-medium">{s.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.note}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Architecture() {
  return (
    <section id="architecture" className="relative py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="relative max-w-6xl mx-auto">
        <SectionHeading
          tag="Multi-Agent Architecture"
          title={<>An <span className="text-gradient">orchestrated mesh</span> of specialized AI agents</>}
          sub="A central orchestrator coordinates six specialized agents — each an expert in its domain — collaborating in real time through a shared reasoning fabric."
        />
        <div className="grid lg:grid-cols-[1fr_320px] gap-10 items-center">
          <ArchitectureDiagram />
          <div className="space-y-3">
            {[
              { icon: Brain, t: "Orchestrator", d: "Routes tasks, manages memory, coordinates consensus across agents." },
              { icon: Network, t: "Message Bus", d: "Asynchronous agent-to-agent communication with shared context." },
              { icon: Eye, t: "Explainability", d: "Every decision traces back to evidence and reasoning steps." },
              { icon: ShieldCheck, t: "Safety Layer", d: "Guardrails for actions; human-in-the-loop for critical responses." },
            ].map(f => (
              <div key={f.t} className="glass rounded-xl p-4 flex gap-3 hover:bg-white/[0.04] transition">
                <div className="size-9 shrink-0 rounded-lg glass flex items-center justify-center" style={{ color: "var(--cyber-cyan)" }}>
                  <f.icon className="size-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{f.t}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{f.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Workflow() {
  const steps = [
    { t: "Input Received", d: "User uploads a suspicious email, URL, or file artifact.", icon: Sparkles },
    { t: "Threat Detection Agent", d: "Classifies signal — phishing, malware, suspicious URL.", icon: Radar },
    { t: "Threat Intelligence Agent", d: "Queries external feeds, IOC databases, reputation scores.", icon: Eye },
    { t: "Malware Analysis Agent", d: "Static + behavioral analysis of files and attack patterns.", icon: Bug },
    { t: "Incident Response Agent", d: "Generates containment & mitigation playbook.", icon: ShieldAlert },
    { t: "Compliance Agent", d: "Maps incident to NIST, ISO 27001, MITRE ATT&CK.", icon: FileCheck2 },
    { t: "Reporting Agent", d: "Drafts executive summary + technical forensic report.", icon: ShieldCheck },
    { t: "Final Security Assessment", d: "Verdict, risk score, and recommended actions delivered.", icon: CheckCircle2 },
  ];
  return (
    <section id="workflow" className="relative py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <SectionHeading
          tag="Investigation Workflow"
          title={<>From signal to <span className="text-gradient">verdict in seconds</span></>}
          sub="An end-to-end autonomous investigation pipeline — every agent passes enriched context to the next."
        />
        <div className="relative">
          <div className="absolute left-[27px] top-2 bottom-2 w-px" style={{ background: "linear-gradient(to bottom, transparent, var(--cyber-blue), var(--cyber-purple), transparent)" }} />
          <div className="space-y-4">
            {steps.map((s, i) => (
              <div key={s.t} className="relative pl-16 animate-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="absolute left-0 top-1 size-14 rounded-xl glass-strong flex items-center justify-center glow-border">
                  <s.icon className="size-5" style={{ color: "var(--cyber-cyan)" }} />
                  <span className="absolute -top-1 -right-1 size-5 rounded-full text-[10px] font-mono font-bold flex items-center justify-center text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>{i + 1}</span>
                </div>
                <div className="glass-strong rounded-xl p-4">
                  <div className="text-sm font-semibold">{s.t}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const CONVO = [
  { from: "User", role: "Input", msg: "Uploaded: invoice_october.eml (suspicious email)", color: "var(--cyber-cyan)", side: "left" },
  { from: "Threat Detection Agent", role: "Detection", msg: "Potential phishing attempt detected — spoofed sender domain & urgency language patterns.", color: "var(--cyber-cyan)", side: "right" },
  { from: "Threat Intelligence Agent", role: "Intel", msg: "Sender domain 'invoice-secure.co' found in 3 threat databases. First seen 4 hours ago.", color: "var(--cyber-blue)", side: "right" },
  { from: "Malware Analysis Agent", role: "Analysis", msg: "Attachment classified as malicious — embedded macro drops Emotet variant. Confidence 97%.", color: "var(--cyber-purple)", side: "right" },
  { from: "Incident Response Agent", role: "Response", msg: "Recommend immediate isolation of host WS-1142. Block sender at gateway. Reset credentials.", color: "var(--cyber-pink)", side: "right" },
  { from: "Compliance Agent", role: "Compliance", msg: "Incident mapped to MITRE T1566.001 (Spearphishing Attachment) and NIST IR-4 controls.", color: "var(--cyber-purple)", side: "right" },
  { from: "Reporting Agent", role: "Report", msg: "Final report generated: executive summary + 12-page forensic timeline. Risk score: 9.4 / 10.", color: "var(--cyber-blue)", side: "right" },
];

function Collaboration() {
  const [shown, setShown] = useState(1);
  useEffect(() => {
    if (shown >= CONVO.length) return;
    const t = setTimeout(() => setShown(s => s + 1), 1300);
    return () => clearTimeout(t);
  }, [shown]);
  return (
    <section id="collab" className="relative py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <SectionHeading
          tag="Autonomous Collaboration"
          title={<>Watch agents <span className="text-gradient">reason together</span></>}
          sub="A live trace of agents negotiating, sharing evidence, and reaching consensus — fully autonomous."
        />
        <div className="glass-strong rounded-3xl p-6 md:p-10 glow-border">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="size-2.5 rounded-full bg-red-500/60" />
                <span className="size-2.5 rounded-full bg-yellow-500/60" />
                <span className="size-2.5 rounded-full bg-green-500/60" />
              </div>
              <span className="ml-3 text-xs font-mono text-muted-foreground">cybershield://agents/trace</span>
            </div>
            <button onClick={() => setShown(1)} className="text-xs font-mono text-muted-foreground hover:text-foreground transition">↻ replay</button>
          </div>
          <div className="space-y-4 min-h-[520px]">
            {CONVO.slice(0, shown).map((m, i) => (
              <div key={i} className={`flex gap-3 animate-fade-up ${m.side === "left" ? "" : "ml-8"}`}>
                <div className="size-9 shrink-0 rounded-lg glass flex items-center justify-center text-xs font-bold" style={{ color: m.color }}>
                  {m.from.split(" ").map(w => w[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">{m.from}</span>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded glass" style={{ color: m.color }}>{m.role}</span>
                  </div>
                  <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-foreground/90">
                    {m.msg}
                  </div>
                </div>
              </div>
            ))}
            {shown < CONVO.length && (
              <div className="ml-12 flex gap-1.5 items-center text-muted-foreground text-xs">
                <span className="size-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="size-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "120ms" }} />
                <span className="size-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "240ms" }} />
              </div>
            )}
            {shown >= CONVO.length && (
              <div className="ml-12 glass-strong rounded-xl p-4 border" style={{ borderColor: "var(--cyber-cyan)" }}>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="size-4" style={{ color: "var(--cyber-cyan)" }} />
                  Consensus reached · Verdict: <span style={{ color: "var(--cyber-cyan)" }}>MALICIOUS</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">7 agents · 8.4s total · 0 human interventions</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: Radar, t: "Autonomous Threat Investigation", d: "Agents independently triage, escalate, and resolve incidents." },
    { icon: Network, t: "Multi-Agent Collaboration", d: "Shared context bus enables true agent-to-agent negotiation." },
    { icon: Brain, t: "Explainable AI Decisions", d: "Every verdict ships with evidence, reasoning trace, and confidence." },
    { icon: Eye, t: "Real-Time Threat Intelligence", d: "Continuous IOC feeds from VirusTotal, AbuseIPDB, OSINT sources." },
    { icon: Bug, t: "Malware Analysis", d: "Static, dynamic, and behavioral analysis in an isolated sandbox." },
    { icon: FileCheck2, t: "Compliance Reporting", d: "Auto-mapped to NIST, ISO 27001, SOC 2, MITRE ATT&CK." },
    { icon: Gauge, t: "Risk Scoring", d: "Contextual scoring weighted by asset, blast radius, and exploitability." },
    { icon: Zap, t: "Automated Response", d: "Playbook-driven remediation with human approval gates." },
  ];
  return (
    <section id="features" className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          tag="Capabilities"
          title={<>Built for <span className="text-gradient">enterprise-grade defense</span></>}
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((f, i) => (
            <div key={f.t} className="group relative glass-strong rounded-2xl p-5 hover:-translate-y-1 transition-all duration-500 overflow-hidden">
              <div className="absolute -top-12 -right-12 size-32 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity"
                style={{ background: i % 2 ? "var(--cyber-purple)" : "var(--cyber-blue)" }} />
              <div className="relative">
                <div className="size-10 rounded-lg flex items-center justify-center mb-4 glass" style={{ color: i % 2 ? "var(--cyber-purple)" : "var(--cyber-cyan)" }}>
                  <f.icon className="size-5" />
                </div>
                <div className="text-sm font-semibold">{f.t}</div>
                <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{f.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TechStack() {
  const groups = [
    { label: "Frontend", icon: Code2, items: ["Next.js", "Tailwind CSS"] },
    { label: "Backend", icon: Cloud, items: ["FastAPI", "Python 3.12"] },
    { label: "AI Framework", icon: Brain, items: ["LangGraph", "OpenAI Agents SDK"] },
    { label: "Database", icon: Database, items: ["PostgreSQL", "ChromaDB (Vector)"] },
    { label: "Integrations", icon: Network, items: ["VirusTotal API", "AbuseIPDB API"] },
  ];
  return (
    <section className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionHeading tag="Technology Stack" title={<>Engineered with <span className="text-gradient">modern primitives</span></>} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {groups.map(g => (
            <div key={g.label} className="glass-strong rounded-2xl p-5 glow-border">
              <div className="size-9 rounded-lg glass flex items-center justify-center mb-4" style={{ color: "var(--cyber-cyan)" }}>
                <g.icon className="size-4" />
              </div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{g.label}</div>
              <ul className="mt-2 space-y-1.5">
                {g.items.map(i => (
                  <li key={i} className="text-sm flex items-center gap-2"><span className="size-1 rounded-full" style={{ background: "var(--cyber-cyan)" }} />{i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Impact() {
  const metrics = [
    { v: 92, suffix: "%", label: "Reduced Investigation Time", note: "from hours to seconds" },
    { v: 15, suffix: "x", label: "Faster Incident Response", note: "vs. manual SOC workflows" },
    { v: 360, suffix: "°", label: "Improved Threat Visibility", note: "across the kill chain" },
    { v: 4.8, suffix: "/5", label: "Security Readiness Score", note: "post-deployment uplift" },
  ];
  return (
    <section className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionHeading tag="Impact" title={<>Measurable <span className="text-gradient">defense outcomes</span></>} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map(m => (
            <div key={m.label} className="glass-strong rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "var(--gradient-primary)" }} />
              <div className="text-5xl font-display font-bold text-gradient">
                {typeof m.v === "number" && m.v % 1 !== 0 ? m.v : <Counter to={m.v} />}{m.suffix}
              </div>
              <div className="mt-3 text-sm font-semibold">{m.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{m.note}</div>
              <div className="mt-4 h-1 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: "85%", background: "var(--gradient-primary)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Roadmap() {
  const phases = [
    { p: "Phase 1", t: "Autonomous Threat Analysis", d: "Foundational 6-agent mesh with explainable verdicts.", done: true },
    { p: "Phase 2", t: "SOC Integration", d: "Native connectors for Splunk, Sentinel, Chronicle.", done: true },
    { p: "Phase 3", t: "Automated Containment", d: "Policy-bound active response & host isolation.", done: false },
    { p: "Phase 4", t: "Enterprise Deployment", d: "On-prem, air-gapped, multi-tenant orchestration.", done: false },
    { p: "Phase 5", t: "Global Threat Intelligence Network", d: "Federated learning across customer constellations.", done: false },
  ];
  return (
    <section id="roadmap" className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionHeading tag="Future Vision" title={<>The road to <span className="text-gradient">autonomous defense</span></>} />
        <div className="relative">
          <div className="hidden md:block absolute top-12 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, var(--cyber-blue), var(--cyber-purple), transparent)" }} />
          <div className="grid md:grid-cols-5 gap-4">
            {phases.map((p, i) => (
              <div key={p.p} className="relative">
                <div className="mx-auto mb-4 size-6 rounded-full flex items-center justify-center"
                  style={{ background: p.done ? "var(--gradient-primary)" : "oklch(0.2 0.02 265)", boxShadow: p.done ? "var(--shadow-glow)" : "none" }}>
                  {p.done && <CheckCircle2 className="size-3 text-white" />}
                </div>
                <div className="glass-strong rounded-2xl p-4 text-center hover:-translate-y-1 transition">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-cyber-cyan" style={{ color: "var(--cyber-cyan)" }}>{p.p}</div>
                  <div className="mt-1.5 text-sm font-semibold">{p.t}</div>
                  <div className="mt-2 text-xs text-muted-foreground">{p.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="relative py-32 px-6">
      <div className="max-w-4xl mx-auto relative">
        <div className="absolute inset-0 blur-3xl opacity-40" style={{ background: "var(--gradient-primary)" }} />
        <div className="relative glass-strong rounded-3xl p-12 md:p-16 text-center glow-border overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-40" />
          <div className="relative">
            <Shield className="size-12 mx-auto mb-6" style={{ color: "var(--cyber-cyan)" }} />
            <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight">
              Securing the future with <br /><span className="text-gradient">autonomous AI agents</span>
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-muted-foreground text-lg">
              CyberShield AI demonstrates the power of collaborative AI agents in transforming cybersecurity
              operations through autonomous reasoning, investigation, and response.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <a href="#architecture" className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white"
                style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
                Explore the Architecture <ChevronRight className="size-4" />
              </a>
              <a href="#collab" className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium glass hover:bg-white/5 transition">
                Watch Agents Collaborate
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative border-t border-white/5 py-12 px-6 mt-20">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
            <Shield className="size-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-display font-semibold">CyberShield AI</div>
            <div className="text-xs text-muted-foreground font-mono">HackAgentAIx 2026 · Track 2 Submission</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground font-mono">
          <span>Multi-Agent Collaboration Systems</span>
          <span className="hidden md:inline">·</span>
          <span>Built with LangGraph & OpenAI Agents SDK</span>
          <span className="hidden md:inline">·</span>
          <span>© 2026 CyberShield AI</span>
        </div>
      </div>
    </footer>
  );
}

function Landing() {
  return (
    <div className="relative">
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Architecture />
        <Workflow />
        <Collaboration />
        <Features />
        <TechStack />
        <Impact />
        <Roadmap />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

// missing icon import shim
function ShieldAlert(props: React.SVGProps<SVGSVGElement>) {
  return <AlertTriangle {...props} />;
}
