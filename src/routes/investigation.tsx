import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Shield, ArrowLeft, Send, Loader2, CheckCircle2, AlertTriangle,
  Radar, Eye, Bug, Gauge, FileCheck2, FileText, Brain, Sparkles,
  Download, History, LogIn,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { exportInvestigationPdf } from "@/lib/pdf-report";

export const Route = createFileRoute("/investigation")({
  head: () => ({
    meta: [
      { title: "Live Investigation — CyberShield AI" },
      { name: "description", content: "Watch 7 autonomous AI agents collaboratively investigate a cyber threat in real time." },
      { property: "og:title", content: "CyberShield AI — Live Multi-Agent Investigation" },
      { property: "og:description", content: "Real-time multi-agent threat investigation powered by autonomous AI collaboration." },
    ],
  }),
  component: InvestigationPage,
});

type Kind = "email" | "url" | "domain" | "ip" | "file";

type AgentState = {
  id: string;
  name: string;
  role: string;
  color: string;
  status: "pending" | "running" | "done" | "error";
  findings?: Record<string, unknown>;
  error?: string;
};

type LogEntry =
  | { kind: "orchestrator"; text: string; ts: number }
  | { kind: "started"; agentId: string; name: string; ts: number }
  | { kind: "completed"; agentId: string; name: string; ts: number }
  | { kind: "message"; from: string; to: string; text: string; ts: number }
  | { kind: "verdict"; text: string; ts: number }
  | { kind: "error"; text: string; ts: number };

const AGENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  detection: Radar,
  intel: Eye,
  malware: Bug,
  risk: Gauge,
  compliance: FileCheck2,
  report: FileText,
};

const COLOR_MAP: Record<string, { bg: string; text: string; ring: string }> = {
  cyan:    { bg: "rgba(94,231,255,.10)",  text: "#5EE7FF", ring: "rgba(94,231,255,.35)" },
  violet:  { bg: "rgba(167,139,250,.10)", text: "#C4B5FD", ring: "rgba(167,139,250,.35)" },
  rose:    { bg: "rgba(251,113,133,.10)", text: "#FDA4AF", ring: "rgba(251,113,133,.35)" },
  amber:   { bg: "rgba(251,191,36,.10)",  text: "#FCD34D", ring: "rgba(251,191,36,.35)" },
  emerald: { bg: "rgba(52,211,153,.10)",  text: "#6EE7B7", ring: "rgba(52,211,153,.35)" },
  sky:     { bg: "rgba(56,189,248,.10)",  text: "#7DD3FC", ring: "rgba(56,189,248,.35)" },
};

const INITIAL_AGENTS: AgentState[] = [
  { id: "detection",  name: "Threat Detection",    role: "Surface IoCs & patterns",      color: "cyan",    status: "pending" },
  { id: "intel",      name: "Threat Intelligence", role: "Reputation & external intel",  color: "violet",  status: "pending" },
  { id: "malware",    name: "Malware Analysis",    role: "Payload & behavior",           color: "rose",    status: "pending" },
  { id: "risk",       name: "Risk Assessment",     role: "Aggregate severity & impact",  color: "amber",   status: "pending" },
  { id: "compliance", name: "Compliance",          role: "GDPR / ISO / NIST / SOC2",     color: "emerald", status: "pending" },
  { id: "report",     name: "Report Generation",   role: "Executive synthesis",          color: "sky",     status: "pending" },
];

const SAMPLES: Record<Kind, string> = {
  email: "From: support@paypa1-secure.com\nSubject: URGENT: Verify your account within 24h or it will be suspended\n\nDear customer, click http://paypa1-secure.com/verify?token=abc to confirm your identity. Failure to comply will result in account closure.",
  url:   "http://paypa1-secure.com/verify?token=abc123",
  domain:"paypa1-secure.com",
  ip:    "185.220.101.47",
  file:  "invoice_q4_2026.pdf.exe (12.4 MB, SHA256: 3f7c…b91d)",
};

function InvestigationPage() {
  const [kind, setKind] = useState<Kind>("email");
  const [indicator, setIndicator] = useState(SAMPLES.email);
  const [running, setRunning] = useState(false);
  const [agents, setAgents] = useState<AgentState[]>(INITIAL_AGENTS);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [verdict, setVerdict] = useState<Record<string, unknown> | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [saved, setSaved] = useState<{ id: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(0);
  const agentsRef = useRef<AgentState[]>(INITIAL_AGENTS);
  const logRef = useRef<LogEntry[]>([]);

  useEffect(() => { agentsRef.current = agents; }, [agents]);
  useEffect(() => { logRef.current = log; }, [log]);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  function reset() {
    setAgents(INITIAL_AGENTS.map((a) => ({ ...a, status: "pending", findings: undefined, error: undefined })));
    setLog([]);
    setVerdict(null);
    setSaved(null);
  }

  async function persistInvestigation(verdictData: Record<string, unknown>) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const agentFindings: Record<string, unknown> = {};
    for (const a of agentsRef.current) {
      if (a.findings) agentFindings[a.id] = a.findings;
    }
    const payload = {
      user_id: u.user.id,
      indicator,
      kind,
      verdict: String(verdictData.verdict ?? "unknown"),
      severity: String(verdictData.severity ?? agentFindings.risk && (agentFindings.risk as Record<string, unknown>).final_severity ?? "info"),
      confidence: Number(verdictData.confidence ?? 0.7),
      executive_summary: String(verdictData.executive_summary ?? ""),
      findings: { ...verdictData, agents: agentFindings },
      agent_log: logRef.current,
      duration_ms: Date.now() - startTimeRef.current,
    };
    const { data, error } = await supabase.from("investigations").insert(payload as never).select("id").single();
    if (!error && data) setSaved({ id: data.id });
  }

  async function start() {
    if (running || !indicator.trim()) return;
    reset();
    setRunning(true);
    startTimeRef.current = Date.now();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/investigate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ indicator, kind }),
        signal: ac.signal,
      });

      if (!res.ok || !res.body) {
        setLog((l) => [...l, { kind: "error", text: `HTTP ${res.status}`, ts: Date.now() }]);
        setRunning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            handleEvent(ev);
          } catch {/* ignore */}
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setLog((l) => [...l, { kind: "error", text: (err as Error).message, ts: Date.now() }]);
      }
    } finally {
      setRunning(false);
    }
  }

  function stop() {
    abortRef.current?.abort();
    setRunning(false);
  }

  function handleEvent(ev: { type: string; [k: string]: unknown }) {
    const ts = Date.now();
    if (ev.type === "orchestrator") {
      setLog((l) => [...l, { kind: "orchestrator", text: String(ev.message), ts }]);
    } else if (ev.type === "agent_started") {
      const id = String(ev.agentId);
      setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, status: "running" } : a)));
      setLog((l) => [...l, { kind: "started", agentId: id, name: String(ev.name), ts }]);
    } else if (ev.type === "agent_completed") {
      const id = String(ev.agentId);
      const findings = ev.findings as Record<string, unknown>;
      setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, status: "done", findings } : a)));
      setLog((l) => [...l, { kind: "completed", agentId: id, name: String(ev.name), ts }]);
      if (id === "report") {
        setVerdict(findings);
        setLog((l) => [...l, { kind: "verdict", text: String((findings.executive_summary as string) ?? ""), ts }]);
        // Persist for signed-in analysts (RLS scopes to their user_id)
        void persistInvestigation(findings);
      }
    } else if (ev.type === "agent_message") {
      setLog((l) => [...l, { kind: "message", from: String(ev.from), to: String(ev.to), text: String(ev.text), ts }]);
    } else if (ev.type === "agent_error") {
      const id = String(ev.agentId);
      setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, status: "error", error: String(ev.message) } : a)));
      setLog((l) => [...l, { kind: "error", text: `${id}: ${String(ev.message)}`, ts }]);
    } else if (ev.type === "error") {
      setLog((l) => [...l, { kind: "error", text: String(ev.message), ts }]);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 inset-x-0 z-50">
        <div className="mx-auto mt-4 max-w-7xl px-4">
          <div className="glass-strong rounded-2xl flex items-center justify-between px-5 py-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
                <Shield className="size-4 text-white" />
              </div>
              <span className="font-display font-semibold tracking-tight">CyberShield AI</span>
            </Link>
            <div className="flex items-center gap-4">
              {signedIn ? (
                <Link to="/history" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
                  <History className="size-4" /> History
                </Link>
              ) : (
                <Link to="/auth" search={{ redirect: "/investigation" }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
                  <LogIn className="size-4" /> Sign in to save
                </Link>
              )}
              <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
                <ArrowLeft className="size-4" /> Overview
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-28 pb-20">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 mb-3">
            <span className="size-1.5 rounded-full animate-pulse" style={{ background: "var(--cyber-cyan)" }} />
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Live SOC · Multi-Agent</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tighter">
            <span className="text-gradient">Autonomous Investigation</span>
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Submit a suspicious indicator. Seven specialist agents will collaboratively investigate, share findings, and reach a unified verdict — live.
          </p>
        </div>

        {/* Input panel */}
        <div className="glass-strong rounded-2xl p-5 mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {(["email", "url", "domain", "ip", "file"] as Kind[]).map((k) => (
              <button
                key={k}
                onClick={() => { setKind(k); setIndicator(SAMPLES[k]); }}
                disabled={running}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition ${
                  kind === k ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                style={kind === k ? { background: "var(--gradient-primary)", color: "white", boxShadow: "var(--shadow-glow)" } : { background: "rgba(255,255,255,.04)" }}
              >
                {k}
              </button>
            ))}
            <button
              onClick={() => setIndicator(SAMPLES[kind])}
              disabled={running}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <Sparkles className="size-3" /> Load sample
            </button>
          </div>

          <textarea
            value={indicator}
            onChange={(e) => setIndicator(e.target.value)}
            disabled={running}
            rows={kind === "email" ? 5 : 2}
            placeholder="Paste suspicious content here..."
            className="w-full resize-none bg-black/30 border border-white/5 rounded-xl p-3 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
          />

          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Agents will use prior findings as shared context — true multi-agent collaboration.
            </p>
            {running ? (
              <button onClick={stop} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 transition">
                <Loader2 className="size-4 animate-spin" /> Stop investigation
              </button>
            ) : (
              <button onClick={start} className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium"
                style={{ background: "var(--gradient-primary)", color: "white", boxShadow: "var(--shadow-glow)" }}>
                <Send className="size-4" /> Launch investigation
              </button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          {/* Agent grid */}
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              {agents.map((a) => {
                const Icon = AGENT_ICONS[a.id] ?? Brain;
                const c = COLOR_MAP[a.color] ?? COLOR_MAP.cyan;
                return (
                  <div
                    key={a.id}
                    className="glass rounded-xl p-4 relative overflow-hidden transition-all"
                    style={{
                      borderColor: a.status === "running" ? c.ring : undefined,
                      boxShadow: a.status === "running" ? `0 0 0 1px ${c.ring}, 0 0 40px -10px ${c.ring}` : undefined,
                    }}
                  >
                    {a.status === "running" && (
                      <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden">
                        <div className="h-full w-1/3 animate-[slide_1.4s_linear_infinite]" style={{ background: c.text }} />
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: c.bg, color: c.text }}>
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-sm truncate">{a.name}</h3>
                          <AgentStatusBadge status={a.status} color={c} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{a.role}</p>

                        {a.findings && (
                          <div className="mt-3 space-y-1.5">
                            {Object.entries(a.findings).slice(0, 4).map(([k, v]) => (
                              <div key={k} className="text-[11px] font-mono">
                                <span className="text-muted-foreground">{k}:</span>{" "}
                                <span className="text-foreground/90">{formatVal(v)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {a.error && (
                          <p className="text-[11px] text-rose-300 mt-2 font-mono">{a.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Verdict */}
            {verdict && (
              <div className="glass-strong rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 size-60 rounded-full blur-3xl opacity-40"
                  style={{ background: verdictColor(verdict.verdict as string) }} />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-10 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
                      <Shield className="size-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Final Verdict</p>
                      <h2 className="text-2xl font-display font-bold capitalize">{String(verdict.verdict)}</h2>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">{String(verdict.executive_summary ?? "")}</p>

                  {Array.isArray(verdict.ioc_list) && verdict.ioc_list.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">IoCs</p>
                      <div className="flex flex-wrap gap-1.5">
                        {verdict.ioc_list.map((ioc, i) => (
                          <span key={i} className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10">{String(ioc)}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {Array.isArray(verdict.remediation_steps) && verdict.remediation_steps.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">Remediation</p>
                      <ol className="space-y-1 text-sm">
                        {verdict.remediation_steps.map((s, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-cyan-300 font-mono">{i + 1}.</span>
                            <span className="text-foreground/85">{String(s)}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Live log */}
          <div className="glass rounded-2xl p-4 h-fit lg:sticky lg:top-24">
            <div className="flex items-center gap-2 mb-3 px-1">
              <Brain className="size-4 text-cyan-300" />
              <h3 className="font-display font-semibold text-sm">Agent Communication</h3>
              <span className="ml-auto text-[11px] font-mono text-muted-foreground">{log.length} events</span>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {log.length === 0 && (
                <p className="text-xs text-muted-foreground italic px-1">Awaiting investigation...</p>
              )}
              {log.map((l, i) => <LogLine key={i} entry={l} />)}
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}

function AgentStatusBadge({ status, color }: { status: AgentState["status"]; color: { text: string; bg: string } }) {
  if (status === "pending") return <span className="text-[10px] font-mono uppercase text-muted-foreground">queued</span>;
  if (status === "running")
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase" style={{ color: color.text }}>
        <Loader2 className="size-3 animate-spin" /> working
      </span>
    );
  if (status === "done")
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-emerald-300">
        <CheckCircle2 className="size-3" /> done
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-rose-300">
      <AlertTriangle className="size-3" /> error
    </span>
  );
}

function LogLine({ entry }: { entry: LogEntry }) {
  const time = new Date(entry.ts).toLocaleTimeString([], { hour12: false });
  if (entry.kind === "orchestrator")
    return <Line time={time} dot="#5EE7FF" label="ORCH" text={entry.text} />;
  if (entry.kind === "started")
    return <Line time={time} dot="#FCD34D" label={entry.agentId.toUpperCase()} text={`${entry.name} started`} />;
  if (entry.kind === "completed")
    return <Line time={time} dot="#6EE7B7" label={entry.agentId.toUpperCase()} text={`${entry.name} completed analysis`} />;
  if (entry.kind === "message")
    return <Line time={time} dot="#C4B5FD" label={`${entry.from} → ${entry.to}`} text={entry.text} />;
  if (entry.kind === "verdict")
    return <Line time={time} dot="#5EE7FF" label="VERDICT" text={entry.text.slice(0, 140)} />;
  return <Line time={time} dot="#FDA4AF" label="ERROR" text={entry.text} />;
}

function Line({ time, dot, label, text }: { time: string; dot: string; label: string; text: string }) {
  return (
    <div className="flex gap-2 text-xs font-mono leading-relaxed px-1 py-1 rounded hover:bg-white/[0.02]">
      <span className="text-muted-foreground/60 shrink-0">{time}</span>
      <span className="size-1.5 rounded-full mt-1.5 shrink-0" style={{ background: dot }} />
      <span className="text-foreground/60 shrink-0">{label}</span>
      <span className="text-foreground/85 break-words">{text}</span>
    </div>
  );
}

function formatVal(v: unknown): string {
  if (v == null) return "—";
  if (Array.isArray(v)) return v.slice(0, 3).map(String).join(", ") + (v.length > 3 ? "…" : "");
  if (typeof v === "object") return JSON.stringify(v).slice(0, 60);
  const s = String(v);
  return s.length > 80 ? s.slice(0, 80) + "…" : s;
}

function verdictColor(verdict?: string) {
  if (verdict === "malicious") return "rgba(244,63,94,.5)";
  if (verdict === "suspicious") return "rgba(251,191,36,.5)";
  return "rgba(52,211,153,.5)";
}
