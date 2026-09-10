/**
 * Policy-driven response engine. Every financial action is SIMULATED.
 */
import type { ResponseAction, RiskFactor, Severity } from "./types";

export type Policy = {
  id: string;
  name: string;
  action: ResponseAction;
  matches: (ctx: { severity: Severity; score: number; factors: RiskFactor[] }) => boolean;
  note: string;
};

const has = (factors: RiskFactor[], label: string) => factors.some((f) => f.label.startsWith(label));

export const POLICIES: Policy[] = [
  {
    id: "P-001",
    name: "CRITICAL + HIGH VELOCITY + GEO ANOMALY",
    action: "HOLD",
    matches: ({ severity, factors }) =>
      severity === "CRITICAL" && has(factors, "High transaction velocity") && has(factors, "Geographic inconsistency"),
    note: "Simulated transaction hold and analyst escalation created.",
  },
  {
    id: "P-002",
    name: "CRITICAL SEVERITY — ANY PATTERN",
    action: "HOLD",
    matches: ({ severity }) => severity === "CRITICAL",
    note: "Simulated hold pending analyst review.",
  },
  {
    id: "P-003",
    name: "HIGH SEVERITY + NEW DEVICE",
    action: "ESCALATE",
    matches: ({ severity, factors }) => severity === "HIGH" && has(factors, "New / unrecognised device"),
    note: "Escalated to the fraud analyst queue for verification.",
  },
  {
    id: "P-004",
    name: "HIGH SEVERITY — GENERAL",
    action: "FLAG",
    matches: ({ severity }) => severity === "HIGH",
    note: "Flagged for monitoring; customer journey uninterrupted.",
  },
  {
    id: "P-005",
    name: "MEDIUM SEVERITY — WATCHLIST",
    action: "FLAG",
    matches: ({ severity }) => severity === "MEDIUM",
    note: "Added to the behavioural watchlist.",
  },
  {
    id: "P-999",
    name: "DEFAULT — FAST PATH APPROVE",
    action: "APPROVE",
    matches: () => true,
    note: "No policy breach; approved on the fast path.",
  },
];

export function matchPolicy(ctx: { severity: Severity; score: number; factors: RiskFactor[] }) {
  const policy = POLICIES.find((p) => p.matches(ctx)) ?? POLICIES[POLICIES.length - 1]!;
  return policy;
}
