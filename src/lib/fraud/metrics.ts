/**
 * SOC metrics derived from live simulation state, plus a clearly-labelled
 * DEMO / SIMULATED benchmark table for the performance evaluation page.
 */
import type { Incident, Transaction } from "./types";

export type SocMetrics = {
  totalTransactions: number;
  tps: number;
  activeAlerts: number;
  criticalIncidents: number;
  detectionRate: number;
  avgDetectionLatencyMs: number;
  avgAgentLatencyMs: number;
  streamLagMs: number;
  health: "ONLINE" | "WARNING" | "ERROR";
  bySeverity: Record<string, number>;
  byRegion: Array<{ region: string; count: number; suspicious: number }>;
  scoreBuckets: number[];
  volumeSeries: number[];
  fraudSeries: number[];
};

export function computeSocMetrics(txns: Transaction[], incidents: Incident[]): SocMetrics {
  const now = Date.now();
  const last10s = txns.filter((t) => now - t.ts < 10_000);
  const suspicious = txns.filter((t) => t.path === "DEEP");
  const doneIncidents = incidents.filter((i) => i.investigationMs);

  const bySeverity: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  for (const t of txns) bySeverity[t.severity] = (bySeverity[t.severity] ?? 0) + 1;

  const regionMap = new Map<string, { count: number; suspicious: number }>();
  for (const t of txns) {
    const e = regionMap.get(t.location) ?? { count: 0, suspicious: 0 };
    e.count += 1;
    if (t.path === "DEEP") e.suspicious += 1;
    regionMap.set(t.location, e);
  }

  const scoreBuckets = new Array(10).fill(0) as number[];
  for (const t of txns) scoreBuckets[Math.min(9, Math.floor(t.score * 10))]! += 1;

  // 20 buckets of 3 seconds
  const volumeSeries = new Array(20).fill(0) as number[];
  const fraudSeries = new Array(20).fill(0) as number[];
  for (const t of txns) {
    const idx = 19 - Math.floor((now - t.ts) / 3000);
    if (idx >= 0 && idx < 20) {
      volumeSeries[idx]! += 1;
      if (t.path === "DEEP") fraudSeries[idx]! += 1;
    }
  }

  const avgDet = txns.length ? txns.reduce((s, t) => s + t.detectionLatencyMs, 0) / txns.length : 0;
  const avgAgent = doneIncidents.length
    ? doneIncidents.reduce((s, i) => s + (i.investigationMs ?? 0), 0) / doneIncidents.length
    : 0;

  return {
    totalTransactions: txns.length,
    tps: last10s.length / 10,
    activeAlerts: txns.filter((t) => t.status === "FLAGGED" || t.status === "HOLD" || t.status === "ESCALATED").length,
    criticalIncidents: incidents.filter((i) => i.severity === "CRITICAL").length,
    detectionRate: txns.length ? suspicious.length / txns.length : 0,
    avgDetectionLatencyMs: avgDet,
    avgAgentLatencyMs: avgAgent,
    streamLagMs: Math.round(4 + Math.random() * 12),
    health: incidents.some((i) => i.agents.some((a) => a.status === "ERROR")) ? "WARNING" : "ONLINE",
    bySeverity,
    byRegion: [...regionMap.entries()]
      .map(([region, v]) => ({ region, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    scoreBuckets,
    volumeSeries,
    fraudSeries,
  };
}

export type BenchRow = { metric: string; mlOnly: string; cybershield: string; better: "cybershield" | "mlOnly" | "tie" };

/** DEMO / SIMULATED values — placeholders until real benchmarking is run. */
export const DEMO_BENCHMARKS: BenchRow[] = [
  { metric: "Precision", mlOnly: "0.71", cybershield: "0.89", better: "cybershield" },
  { metric: "Recall", mlOnly: "0.78", cybershield: "0.86", better: "cybershield" },
  { metric: "F1 Score", mlOnly: "0.74", cybershield: "0.87", better: "cybershield" },
  { metric: "False Positive Rate", mlOnly: "0.19", cybershield: "0.07", better: "cybershield" },
  { metric: "Throughput (txn/s, sim)", mlOnly: "420", cybershield: "395", better: "mlOnly" },
  { metric: "Detection Latency", mlOnly: "~8 ms", cybershield: "~9 ms", better: "tie" },
  { metric: "Investigation Time", mlOnly: "manual (minutes)", cybershield: "~2.5 s (agentic)", better: "cybershield" },
  { metric: "Agent Response Latency", mlOnly: "n/a", cybershield: "~0.9 s", better: "cybershield" },
  { metric: "End-to-End Latency", mlOnly: "~8 ms (alert only)", cybershield: "~2.6 s (alert + decision)", better: "mlOnly" },
  { metric: "Stream Lag", mlOnly: "~10 ms", cybershield: "~12 ms", better: "tie" },
  { metric: "Recovery Time", mlOnly: "n/a", cybershield: "~1.4 s", better: "cybershield" },
];
