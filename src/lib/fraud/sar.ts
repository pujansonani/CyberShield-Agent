/**
 * Suspicious Activity Report DRAFT generation — PROPOSED FEATURE.
 * Output always requires human review. Nothing is submitted anywhere,
 * and this is not a regulatory reporting system.
 */
import type { Incident, SarDraft, Transaction } from "./types";
import { inr } from "./types";

let sarSeq = 4100;

export function buildSarDraft(incident: Incident, txn: Transaction): SarDraft {
  const indicators = incident.findings.map((f) => `${f.level} — ${f.label}: ${f.detail}`);
  const patterns = Array.from(new Set(incident.findings.map((f) => f.label)));

  const transactionSummary = `${txn.id} for ${inr(txn.amount)} ${txn.currency} at ${txn.merchant} (${txn.category}), originating from ${txn.location} on device ${txn.deviceId} / session ${txn.sessionId} at ${new Date(txn.ts).toISOString()}.`;

  const investigationSummary = incident.agents
    .flatMap((a) => a.output.map((line) => `${a.name}: ${line}`))
    .slice(0, 12)
    .join("\n");

  const narrative = [
    `On ${new Date(txn.ts).toUTCString()}, automated monitoring flagged ${txn.id} attributed to customer ${txn.customerId}.`,
    `The transaction totalled ${inr(txn.amount)} against a behavioural baseline of ${inr(txn.baselineAmount)}, representing a ${(txn.amount / Math.max(txn.baselineAmount, 1)).toFixed(1)}× deviation.`,
    `Detection scoring returned ${(incident.score * 100).toFixed(0)}% anomaly likelihood, classified ${incident.severity}.`,
    `Agentic investigation corroborated ${incident.findings.length} independent risk indicators, principally: ${patterns.slice(0, 4).join(", ")}.`,
    `A ${incident.responses[incident.responses.length - 1]?.action ?? "HOLD"} response was applied under policy "${incident.responses[incident.responses.length - 1]?.policy ?? "n/a"}" (simulated).`,
    `This draft is generated from synthetic prototype data and requires analyst verification before any use.`,
  ].join(" ");

  return {
    id: `SAR-${++sarSeq}`,
    createdAt: Date.now(),
    incidentId: incident.id,
    status: "DRAFT",
    subject: `${txn.id} — customer ${txn.customerId}`,
    indicators,
    transactionSummary,
    investigationSummary,
    evidence: incident.agents.flatMap((a) => a.output),
    riskClassification: `${incident.severity} (score ${(incident.score * 100).toFixed(0)}%)`,
    patterns,
    recommendedAction: incident.risk?.recommended ?? "ESCALATE",
    narrative,
  };
}

export function sarToText(sar: SarDraft): string {
  return [
    `SAR DRAFT ${sar.id} — REQUIRES HUMAN REVIEW`,
    `Generated: ${new Date(sar.createdAt).toISOString()}`,
    `Incident: ${sar.incidentId}`,
    "",
    `SUBJECT TRANSACTION`,
    sar.subject,
    "",
    `TRANSACTION SUMMARY`,
    sar.transactionSummary,
    "",
    `SUSPICIOUS ACTIVITY INDICATORS`,
    ...sar.indicators.map((i) => `- ${i}`),
    "",
    `INVESTIGATION SUMMARY`,
    sar.investigationSummary,
    "",
    `SUPPORTING EVIDENCE`,
    ...sar.evidence.map((e) => `- ${e}`),
    "",
    `RISK CLASSIFICATION`,
    sar.riskClassification,
    "",
    `DETECTED PATTERNS`,
    ...sar.patterns.map((p) => `- ${p}`),
    "",
    `RECOMMENDED ACTION`,
    sar.recommendedAction,
    "",
    `NARRATIVE`,
    sar.narrative,
    "",
    `DISCLAIMER: Synthetic prototype data. Not a regulatory filing.`,
  ].join("\n");
}
