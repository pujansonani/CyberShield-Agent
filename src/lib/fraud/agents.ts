/**
 * Agentic deep-investigation path. Reuses the CyberShield agent roles:
 * Detection → Investigation → Risk Analysis → Response (+ Monitoring).
 *
 * Findings are structured and evidence-based; no hidden chain-of-thought
 * is exposed. Every response action is simulated.
 */
import { matchPolicy } from "./policies";
import type {
  AgentRun,
  Incident,
  ResponseRecord,
  RiskAssessment,
  RiskFactor,
  Transaction,
} from "./types";
import { inr, severityFor, type Thresholds } from "./types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let incidentSeq = 1041;

export type PipelineEmit = (incident: Incident) => void;

function blank(id: AgentRun["id"], name: string, input: string): AgentRun {
  return { id, name, status: "PENDING", input, output: [] };
}

export function createIncident(txn: Transaction): Incident {
  return {
    id: `INC-${++incidentSeq}`,
    txnId: txn.id,
    createdAt: Date.now(),
    severity: txn.severity,
    score: txn.score,
    status: "UNDER_INVESTIGATION",
    findings: [],
    responses: [],
    agents: [
      blank("detection", "Detection Agent", `${txn.id} • fast-path score ${(txn.score * 100).toFixed(0)}%`),
      blank("investigation", "Investigation Agent", "Validated suspicious event + customer context"),
      blank("risk", "Risk Analysis Agent", "Detection score + investigation evidence"),
      blank("response", "Response Agent", "Risk assessment + security policy set"),
      blank("monitoring", "Monitoring Agent", "Pipeline telemetry"),
    ],
  };
}

/**
 * Runs the agent pipeline, emitting an updated incident after every step so
 * the UI can render live progress.
 */
export async function runAgentPipeline(
  incident: Incident,
  txn: Transaction,
  history: Transaction[],
  thresholds: Thresholds,
  emit: PipelineEmit,
  speed = 1,
): Promise<Incident> {
  const inc: Incident = { ...incident };
  const started = Date.now();
  const step = async (ms: number) => sleep(Math.max(60, ms / speed));

  const set = (id: AgentRun["id"], patch: Partial<AgentRun>) => {
    inc.agents = inc.agents.map((a) => (a.id === id ? { ...a, ...patch } : a));
    emit({ ...inc, agents: [...inc.agents] });
  };
  const push = (id: AgentRun["id"], line: string) => {
    inc.agents = inc.agents.map((a) => (a.id === id ? { ...a, output: [...a.output, line] } : a));
    emit({ ...inc, agents: [...inc.agents] });
  };

  // ── Detection Agent ────────────────────────────────────────────────
  set("detection", { status: "PROCESSING", startedAt: Date.now() });
  await step(320);
  push("detection", `Suspicious transaction detected — score ${(txn.score * 100).toFixed(0)}% (${txn.severity})`);
  await step(200);
  push("detection", `Trigger reason: ${txn.factors.map((f) => f.label).slice(0, 3).join(", ") || "threshold breach"}`);
  push("detection", `Deep investigation required (threshold ${(thresholds.deepPath * 100).toFixed(0)}%) — handing off`);
  set("detection", { status: "DONE", endedAt: Date.now() });

  // ── Investigation Agent ────────────────────────────────────────────
  set("investigation", { status: "PROCESSING", startedAt: Date.now() });
  const custHistory = history.filter((t) => t.customerId === txn.customerId && t.id !== txn.id);
  const avg = custHistory.length
    ? custHistory.reduce((s, t) => s + t.amount, 0) / custHistory.length
    : txn.baselineAmount;

  await step(360);
  push("investigation", `Reviewed ${custHistory.length} prior transactions for ${txn.customerId} (avg ${inr(avg)})`);
  await step(280);
  push("investigation", `Velocity check: ${txn.velocity} txns / 10 min window`);
  await step(240);
  push("investigation", `Geographic pattern: current ${txn.location}${txn.geoInconsistent ? " — inconsistent with prior region" : " — consistent"}`);
  await step(220);
  push("investigation", `Device / session: ${txn.deviceId} • ${txn.sessionId}${txn.newDevice ? " (first seen)" : " (known)"}`);
  await step(200);
  push("investigation", `Merchant pattern: ${txn.merchant} — ${txn.category}`);
  push("investigation", `Amount deviation: ${(txn.amount / Math.max(avg, 1)).toFixed(1)}× behavioural baseline`);

  const findings: RiskFactor[] = [...txn.factors];
  if (custHistory.length >= 3 && txn.amount > avg * 4) {
    findings.push({
      label: "Spending pattern change",
      level: "HIGH",
      weight: 1.1,
      detail: `Current ${inr(txn.amount)} vs recent average ${inr(avg)}`,
    });
  }
  const related = history.filter((t) => t.customerId === txn.customerId && t.score >= thresholds.high && t.id !== txn.id);
  if (related.length) {
    findings.push({
      label: "Related suspicious events",
      level: "MEDIUM",
      weight: 0.8,
      detail: `${related.length} earlier high-risk transaction(s) on the same customer`,
    });
  }
  inc.findings = findings;
  set("investigation", { status: "DONE", endedAt: Date.now() });

  // ── Risk Analysis Agent ────────────────────────────────────────────
  set("risk", { status: "PROCESSING", startedAt: Date.now() });
  await step(340);
  const evidenceWeight = findings.reduce((s, f) => s + f.weight * (f.level === "HIGH" ? 1 : f.level === "MEDIUM" ? 0.6 : 0.3), 0);
  const combined = Math.min(0.99, txn.score * 0.6 + Math.min(evidenceWeight / 6, 1) * 0.4);
  const severity = severityFor(combined, thresholds);
  push("risk", `Combined detection score (${(txn.score * 100).toFixed(0)}%) with ${findings.length} evidence items`);
  await step(240);
  push("risk", `Unified risk score ${(combined * 100).toFixed(0)}% — classified ${severity}`);

  const policy = matchPolicy({ severity, score: combined, factors: findings });
  const risk: RiskAssessment = {
    score: combined,
    severity,
    factors: findings,
    explanation: `Detection signals and investigation evidence agree on ${severity.toLowerCase()} risk. Dominant drivers: ${findings
      .slice(0, 3)
      .map((f) => f.label.toLowerCase())
      .join(", ")}.`,
    recommended: policy.action,
  };
  inc.risk = risk;
  inc.severity = severity;
  inc.score = combined;
  push("risk", `Recommended decision: ${policy.action}`);
  set("risk", { status: "DONE", endedAt: Date.now() });

  // ── Response Agent ─────────────────────────────────────────────────
  set("response", { status: "PROCESSING", startedAt: Date.now() });
  await step(300);
  push("response", `Matched policy ${policy.id} — ${policy.name}`);
  await step(220);
  const record: ResponseRecord = {
    action: policy.action,
    policy: `${policy.id} — ${policy.name}`,
    simulated: true,
    at: Date.now(),
    by: "RESPONSE_AGENT",
    note: policy.note,
  };
  inc.responses = [...inc.responses, record];
  push("response", `${policy.action === "HOLD" ? "SIMULATED TRANSACTION HOLD" : policy.action} applied — ${policy.note}`);
  if (policy.action === "HOLD" || policy.action === "ESCALATE") {
    push("response", "Analyst escalation created");
    inc.status = policy.action === "HOLD" ? "CONTAINED_SIMULATED" : "AWAITING_ANALYST";
  } else {
    inc.status = "AWAITING_ANALYST";
  }
  set("response", { status: "DONE", endedAt: Date.now() });

  // ── Monitoring Agent ───────────────────────────────────────────────
  inc.investigationMs = Date.now() - started;
  set("monitoring", {
    status: "DONE",
    startedAt: started,
    endedAt: Date.now(),
    output: [
      `Agent pipeline completed in ${(inc.investigationMs / 1000).toFixed(2)}s`,
      `Detection latency ${txn.detectionLatencyMs.toFixed(2)}ms • 0 failed operations`,
      "Service health: ONLINE",
    ],
  });

  emit({ ...inc });
  return inc;
}
