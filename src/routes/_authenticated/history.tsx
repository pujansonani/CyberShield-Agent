import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, ArrowLeft, FileText, Trash2, Download, AlertTriangle, CheckCircle2, Loader2, LogOut, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { exportInvestigationPdf } from "@/lib/pdf-report";
import logoAsset from "@/assets/cyberguard-logo.png.asset.json";

type Row = {
  id: string;
  indicator: string;
  kind: string;
  verdict: string | null;
  severity: string | null;
  confidence: number | null;
  executive_summary: string | null;
  findings: Record<string, unknown>;
  agent_log: unknown[];
  duration_ms: number | null;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Investigation History — CyberShield AI" },
      { name: "description", content: "Your past autonomous multi-agent threat investigations and forensic reports." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    const { data: u } = await supabase.auth.getUser();
    setEmail(u.user?.email ?? "");
    const { data, error } = await supabase
      .from("investigations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) { setError(error.message); return; }
    setRows((data ?? []) as Row[]);
  }

  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    setRows((r) => r?.filter((x) => x.id !== id) ?? null);
    await supabase.from("investigations").delete().eq("id", id);
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  const stats = computeStats(rows ?? []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 inset-x-0 z-50">
        <div className="mx-auto mt-4 max-w-7xl px-4">
          <div className="glass-strong rounded-2xl flex items-center justify-between px-5 py-3">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoAsset.url} alt="CyberGuard Agents" className="h-8 w-auto rounded-md" />
              <span className="font-display font-semibold tracking-tight">CyberShield AI</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/investigation" className="text-sm text-muted-foreground hover:text-foreground transition hidden sm:inline">New investigation</Link>
              <span className="text-xs font-mono text-muted-foreground hidden md:inline">{email}</span>
              <button onClick={signOut} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <LogOut className="size-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-28 pb-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 mb-3">
              <span className="size-1.5 rounded-full" style={{ background: "var(--cyber-cyan)" }} />
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">SOC Console</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tighter">
              <span className="text-gradient">Investigation History</span>
            </h1>
            <p className="mt-2 text-muted-foreground">Forensic record of every multi-agent threat analysis you've run.</p>
          </div>
          <Link to="/investigation"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
            style={{ background: "var(--gradient-primary)", color: "white", boxShadow: "var(--shadow-glow)" }}>
            <Activity className="size-4" /> Launch new investigation
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard label="Total" value={String(stats.total)} accent="cyan" />
          <StatCard label="Critical / High" value={String(stats.high)} accent="rose" />
          <StatCard label="Avg confidence" value={`${stats.avgConfidence}%`} accent="violet" />
          <StatCard label="Avg analysis time" value={`${stats.avgDuration}s`} accent="emerald" />
        </div>

        {error && (
          <div className="glass rounded-xl p-4 mb-4 text-sm text-rose-300 font-mono">{error}</div>
        )}

        {rows === null && (
          <div className="text-center py-16 text-muted-foreground"><Loader2 className="size-6 animate-spin mx-auto" /></div>
        )}

        {rows && rows.length === 0 && (
          <div className="glass-strong rounded-2xl p-12 text-center">
            <FileText className="size-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-display font-semibold text-lg">No investigations yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Launch your first multi-agent investigation to see it here.</p>
            <Link to="/investigation" className="mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
              style={{ background: "var(--gradient-primary)", color: "white" }}>
              <ArrowLeft className="size-4 rotate-180" /> Start investigating
            </Link>
          </div>
        )}

        {rows && rows.length > 0 && (
          <div className="space-y-3">
            {rows.map((r) => <HistoryRow key={r.id} row={r} onDelete={remove} />)}
          </div>
        )}
      </main>
    </div>
  );
}

function HistoryRow({ row, onDelete }: { row: Row; onDelete: (id: string) => void }) {
  const sev = (row.severity ?? "info").toLowerCase();
  const sevColor =
    sev === "critical" ? { bg: "rgba(244,63,94,.12)", fg: "#FDA4AF" } :
    sev === "high" ?     { bg: "rgba(251,146,60,.12)", fg: "#FDBA74" } :
    sev === "medium" ?   { bg: "rgba(251,191,36,.12)", fg: "#FCD34D" } :
    sev === "low" ?      { bg: "rgba(94,231,255,.12)", fg: "#5EE7FF" } :
                         { bg: "rgba(148,163,184,.12)", fg: "#94A3B8" };

  const verdict = (row.verdict ?? "unknown").toLowerCase();
  const VerdictIcon = verdict === "malicious" || verdict === "suspicious" ? AlertTriangle : CheckCircle2;

  return (
    <details className="glass rounded-xl overflow-hidden group">
      <summary className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/[.02] list-none">
        <div className="size-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: sevColor.bg, color: sevColor.fg }}>
          <VerdictIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-1.5 py-0.5 rounded bg-white/5 border border-white/10">{row.kind}</span>
            <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: sevColor.bg, color: sevColor.fg }}>{sev}</span>
            <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</span>
          </div>
          <p className="mt-1 text-sm font-mono truncate text-foreground/90">{row.indicator.split("\n")[0]}</p>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-xs text-muted-foreground">Confidence</p>
          <p className="font-display font-semibold text-lg">{Math.round((row.confidence ?? 0) * 100)}%</p>
        </div>
      </summary>

      <div className="px-4 pb-4 pt-1 border-t border-white/5">
        {row.executive_summary && (
          <p className="text-sm text-foreground/85 leading-relaxed mt-3">{row.executive_summary}</p>
        )}
        <div className="mt-4 flex gap-2 flex-wrap">
          <button onClick={() => exportInvestigationPdf(row)}
            className="inline-flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 transition">
            <Download className="size-3.5" /> Export PDF report
          </button>
          <button onClick={() => onDelete(row.id)}
            className="inline-flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-200 hover:bg-rose-500/20 transition ml-auto">
            <Trash2 className="size-3.5" /> Delete
          </button>
        </div>
      </div>
    </details>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: "cyan" | "rose" | "violet" | "emerald" }) {
  const colors = {
    cyan:    "#5EE7FF",
    rose:    "#FDA4AF",
    violet:  "#C4B5FD",
    emerald: "#6EE7B7",
  };
  return (
    <div className="glass rounded-xl p-4">
      <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-display font-bold text-2xl mt-1" style={{ color: colors[accent] }}>{value}</p>
    </div>
  );
}

function computeStats(rows: Row[]) {
  if (rows.length === 0) return { total: 0, high: 0, avgConfidence: 0, avgDuration: 0 };
  const high = rows.filter((r) => ["critical", "high"].includes((r.severity ?? "").toLowerCase())).length;
  const avgConfidence = Math.round((rows.reduce((s, r) => s + (r.confidence ?? 0), 0) / rows.length) * 100);
  const avgDuration = +(rows.reduce((s, r) => s + (r.duration_ms ?? 0), 0) / rows.length / 1000).toFixed(1);
  return { total: rows.length, high, avgConfidence, avgDuration };
}
