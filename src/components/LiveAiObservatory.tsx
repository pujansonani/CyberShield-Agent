import { useEffect, useState } from "react";
import { Activity, Cpu, Coins, Clock, Zap } from "lucide-react";
import { computeAiMetrics, type MetricsAgentLike } from "@/lib/ai-metrics";

export function LiveAiObservatory({
  agents,
  running,
  startedAt,
  agentNames,
}: {
  agents: MetricsAgentLike[];
  running: boolean;
  startedAt: number;
  agentNames: Record<string, string>;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [running]);

  const m = computeAiMetrics(agents);
  const elapsed = startedAt ? Math.max(0, (running ? now : Math.max(...agents.map((a) => a.endedAt ?? 0), startedAt)) - startedAt) : 0;
  const active = m.activeAgentId ? agentNames[m.activeAgentId] ?? m.activeAgentId : running ? "Orchestrator" : m.agentsDone > 0 ? "Idle — run complete" : "Standing by";

  const rows: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }[] = [
    { icon: Cpu, label: "Tokens consumed", value: m.tokens.toLocaleString() },
    { icon: Activity, label: "API calls", value: String(m.apiCalls) },
    { icon: Coins, label: "Est. cost", value: `₹${m.costInr.toFixed(3)}` },
    { icon: Clock, label: "Elapsed", value: `${(elapsed / 1000).toFixed(1)}s` },
  ];

  return (
    <div className="glass-strong rounded-2xl p-5 relative overflow-hidden">
      <div
        className="absolute -top-16 -right-16 size-40 rounded-full blur-3xl opacity-40"
        style={{ background: "var(--gradient-primary)" }}
      />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="size-4" style={{ color: "var(--cyber-cyan)" }} />
          <h3 className="font-display font-semibold text-sm">Live AI Observatory</h3>
          <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <span
              className={`size-1.5 rounded-full ${running ? "animate-pulse" : ""}`}
              style={{ background: running ? "var(--cyber-cyan)" : "rgba(255,255,255,.25)" }}
            />
            {running ? "streaming" : "idle"}
          </span>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 mb-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Active agent</p>
          <p className="text-sm font-medium truncate">{active}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {rows.map((r) => (
            <div key={r.label} className="rounded-xl bg-white/[0.03] border border-white/10 p-2.5 hover:bg-white/[0.06] transition">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <r.icon className="size-3" />
                <span className="text-[10px] uppercase tracking-wider">{r.label}</span>
              </div>
              <p className="mt-1 font-mono text-sm tabular-nums">{r.value}</p>
            </div>
          ))}
        </div>

        <p className="mt-3 text-[10px] text-muted-foreground leading-relaxed">
          Token, cost and energy figures are estimates derived from live agent activity.
        </p>
      </div>
    </div>
  );
}
