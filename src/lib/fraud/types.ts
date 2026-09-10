/**
 * CyberShield — Fraud & Anomaly Detection domain model.
 * All data here is SYNTHETIC. No real banking, PII, or monetary actions.
 */

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TxnStatus = "APPROVED" | "FLAGGED" | "HOLD" | "ESCALATED" | "INCIDENT";

export type AgentStatus = "PENDING" | "PROCESSING" | "DONE" | "WARNING" | "ERROR";

export type ProcessingPath = "FAST" | "DEEP";

export type ScenarioId =
  | "NORMAL"
  | "SUSPICIOUS"
  | "HIGH_VELOCITY"
  | "GEO_ANOMALY"
  | "UNUSUAL_AMOUNT"
  | "NEW_DEVICE"
  | "COMBINED_FRAUD";

export type Transaction = {
  id: string;
  ts: number;
  amount: number;
  currency: "INR";
  customerId: string;
  merchant: string;
  category: string;
  location: string;
  deviceId: string;
  ip: string;
  sessionId: string;
  /** transactions by this customer in the trailing 10 min window */
  velocity: number;
  /** customer's typical ticket size (synthetic profile) */
  baselineAmount: number;
  newDevice: boolean;
  geoInconsistent: boolean;
  offHours: boolean;
  repeated: boolean;
  scenario: ScenarioId;
  /** detection output */
  score: number;
  severity: Severity;
  factors: RiskFactor[];
  path: ProcessingPath;
  status: TxnStatus;
  detectionLatencyMs: number;
  incidentId?: string;
};

export type RiskFactor = {
  label: string;
  level: Severity;
  weight: number;
  detail: string;
};

export type AgentRun = {
  id: "detection" | "investigation" | "risk" | "response" | "monitoring";
  name: string;
  status: AgentStatus;
  startedAt?: number;
  endedAt?: number;
  input: string;
  output: string[];
};

export type RiskAssessment = {
  score: number;
  severity: Severity;
  factors: RiskFactor[];
  explanation: string;
  recommended: ResponseAction;
};

export type ResponseAction = "APPROVE" | "FLAG" | "HOLD" | "ESCALATE" | "CREATE_INCIDENT";

export type ResponseRecord = {
  action: ResponseAction;
  policy: string;
  simulated: true;
  at: number;
  by: "RESPONSE_AGENT" | "ANALYST";
  note: string;
};

export type SarDraft = {
  id: string;
  createdAt: number;
  incidentId: string;
  status: "DRAFT" | "MARKED_FOR_REVIEW";
  subject: string;
  indicators: string[];
  transactionSummary: string;
  investigationSummary: string;
  evidence: string[];
  riskClassification: string;
  patterns: string[];
  recommendedAction: string;
  narrative: string;
};

export type Incident = {
  id: string;
  txnId: string;
  createdAt: number;
  severity: Severity;
  score: number;
  status: "UNDER_INVESTIGATION" | "AWAITING_ANALYST" | "CONTAINED_SIMULATED" | "CLOSED";
  agents: AgentRun[];
  findings: RiskFactor[];
  risk?: RiskAssessment;
  responses: ResponseRecord[];
  sar?: SarDraft;
  investigationMs?: number;
};

export type Thresholds = {
  low: number;
  medium: number;
  high: number;
  critical: number;
  /** score at or above which the deep agentic path is triggered */
  deepPath: number;
};

export const DEFAULT_THRESHOLDS: Thresholds = {
  low: 0,
  medium: 0.35,
  high: 0.6,
  critical: 0.85,
  deepPath: 0.6,
};

export const SEVERITY_COLOR: Record<Severity, string> = {
  LOW: "#6EE7B7",
  MEDIUM: "#FCD34D",
  HIGH: "#FDBA74",
  CRITICAL: "#FDA4AF",
};

export function severityFor(score: number, t: Thresholds): Severity {
  if (score >= t.critical) return "CRITICAL";
  if (score >= t.high) return "HIGH";
  if (score >= t.medium) return "MEDIUM";
  return "LOW";
}

export function inr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export function clockTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-GB", { hour12: false });
}
