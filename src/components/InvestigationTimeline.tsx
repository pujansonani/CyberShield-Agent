import { CheckCircle2, Loader2, AlertTriangle, Circle } from "lucide-react";

export type TimelineAgent = {
  id: string;
  name: string;
  status: "pending" | "running" | "done" | "error";
  steps: string[];
  startedAt?: number;
  endedAt?: number;
};

function dur(a?: number, b?: number) {
  if (!a || !b) return null;
  return `${((b - a) / 1000).toFixed(1)}s`;
}

export function InvestigationTimeline({ agents }: { agents: TimelineAgent[] }) {
  const total = agents.length;
  const done = agents.filter((a) => a.status === "done" || a.status === "error").length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="glass-strong rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-display font-semibold text-sm">AI Investigation Progress</h3>
        <span className="ml-auto text-[11px] font-mono text-muted-foreground">
          {done}/{total} agents
        </span>
      </div>
      <div className="h-1 rounded-full bg-white/5 overflow-hidden mb-5">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: "var(--gradient-primary)" }}
        />
      </div>

      <ol className="relative">
        {agents.map((a, i) => {
          const active = a.status === "running";
          const complete = a.status === "done";
          const failed = a.status === "error";
          const color = failed ? "#FDA4AF" : complete ? "#6EE7B7" : active ? "#5EE7FF" : "rgba(255,255,255,.25)";
          return (
            <li key={a.id} className="relative pl-8 pb-5 last:pb-0">
              {i < agents.length - 1 && (
                <span
                  className="absolute left-[9px] top-6 bottom-0 w-px"
                  style={{ background: complete ? "rgba(110,231,183,.35)" : "rgba(255,255,255,.08)" }}
                />
              )}
              <span className="absolute left-0 top-1 flex size-[19px] items-center justify-center">
                {active && (
                  <span
                    className="absolute inset-0 rounded-full animate-pulse-ring"
                    style={{ background: "rgba(94,231,255,.25)" }}
                  />
                )}
                {complete ? (
                  <CheckCircle2 className="size-[18px]" style={{ color }} />
                ) : failed ? (
                  <AlertTriangle className="size-[17px]" style={{ color }} />
                ) : active ? (
                  <Loader2 className="size-[17px] animate-spin" style={{ color }} />
                ) : (
                  <Circle className="size-[15px]" style={{ color }} />
                )}
              </span>

              <div className="flex items-baseline gap-2">
                <p
                  className="text-sm font-medium"
                  style={{ color: a.status === "pending" ? "var(--muted-foreground)" : undefined }}
                >
                  {a.name}
                </p>
                {dur(a.startedAt, a.endedAt) && (
                  <span className="text-[10px] font-mono text-muted-foreground">{dur(a.startedAt, a.endedAt)}</span>
                )}
              </div>

              {a.steps.length > 0 && a.status !== "pending" && (
                <ul className="mt-1.5 space-y-1">
                  {a.steps.map((s, si) => (
                    <li key={si} className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                      <span
                        className="size-1 rounded-full shrink-0"
                        style={{ background: complete ? "#6EE7B7" : "#5EE7FF" }}
                      />
                      <span className={complete ? "line-through/0" : ""}>{s}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
