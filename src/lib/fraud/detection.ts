/**
 * Fast-path fraud / anomaly detection.
 *
 * NOTE: this is a configurable RULE ENSEMBLE with a simulated ML blend
 * (logistic squash over weighted signals). No trained XGBoost / scikit-learn
 * model is connected in this prototype. `scoreTransaction` is the single
 * integration point — swap its body for a real model call later.
 */
import {
  type RiskFactor,
  type Severity,
  type Thresholds,
  type Transaction,
  severityFor,
} from "./types";

export type DetectionInput = Omit<
  Transaction,
  "score" | "severity" | "factors" | "path" | "status" | "detectionLatencyMs"
>;

export type DetectionResult = {
  score: number;
  severity: Severity;
  factors: RiskFactor[];
  latencyMs: number;
  engine: "RULE_ENSEMBLE+SIMULATED_ML";
};

export type SignalWeights = {
  amount: number;
  velocity: number;
  geo: number;
  device: number;
  time: number;
  behaviour: number;
  repeated: number;
  merchantRisk: number;
};

export const DEFAULT_WEIGHTS: SignalWeights = {
  amount: 1.5,
  velocity: 1.4,
  geo: 1.3,
  device: 0.9,
  time: 0.5,
  behaviour: 1.2,
  repeated: 0.6,
  merchantRisk: 0.7,
};

const HIGH_RISK_CATEGORIES = new Set(["Crypto Exchange", "Jewellery", "Gaming", "Digital Goods"]);

function logistic(x: number) {
  return 1 / (1 + Math.exp(-x));
}

export function scoreTransaction(
  txn: DetectionInput,
  thresholds: Thresholds,
  weights: SignalWeights = DEFAULT_WEIGHTS,
): DetectionResult {
  const t0 = performance.now();
  const factors: RiskFactor[] = [];
  let z = -3.1; // bias so ordinary traffic lands near zero

  const ratio = txn.amount / Math.max(txn.baselineAmount, 1);
  if (ratio >= 3) {
    const level: Severity = ratio >= 10 ? "HIGH" : "MEDIUM";
    z += weights.amount * Math.min(ratio / 10, 1.6);
    factors.push({
      label: "Unusual transaction amount",
      level,
      weight: weights.amount,
      detail: `${ratio.toFixed(1)}× the customer's typical ticket size`,
    });
  }

  if (txn.velocity >= 5) {
    z += weights.velocity * Math.min(txn.velocity / 12, 1.5);
    factors.push({
      label: "High transaction velocity",
      level: txn.velocity >= 9 ? "HIGH" : "MEDIUM",
      weight: weights.velocity,
      detail: `${txn.velocity} transactions in the trailing 10-minute window`,
    });
  }

  if (txn.geoInconsistent) {
    z += weights.geo;
    factors.push({
      label: "Geographic inconsistency",
      level: "HIGH",
      weight: weights.geo,
      detail: `Origin ${txn.location} is inconsistent with recent activity`,
    });
  }

  if (txn.newDevice) {
    z += weights.device;
    factors.push({
      label: "New / unrecognised device",
      level: "MEDIUM",
      weight: weights.device,
      detail: `Device ${txn.deviceId} first seen on this session`,
    });
  }

  if (txn.offHours) {
    z += weights.time;
    factors.push({
      label: "Unusual transaction time",
      level: "LOW",
      weight: weights.time,
      detail: "Outside the customer's normal activity hours",
    });
  }

  if (ratio >= 4 && txn.velocity >= 4) {
    z += weights.behaviour;
    factors.push({
      label: "Behavioural deviation",
      level: "HIGH",
      weight: weights.behaviour,
      detail: "Spending pattern diverges from the established profile",
    });
  }

  if (txn.repeated) {
    z += weights.repeated;
    factors.push({
      label: "Repeated transaction pattern",
      level: "MEDIUM",
      weight: weights.repeated,
      detail: "Near-identical amounts repeated in quick succession",
    });
  }

  if (HIGH_RISK_CATEGORIES.has(txn.category) && ratio >= 2) {
    z += weights.merchantRisk;
    factors.push({
      label: "High-risk merchant category",
      level: "MEDIUM",
      weight: weights.merchantRisk,
      detail: `${txn.category} with elevated ticket size`,
    });
  }

  const score = Math.min(0.99, Math.max(0.01, logistic(z)));
  return {
    score,
    severity: severityFor(score, thresholds),
    factors,
    latencyMs: Math.max(1, Math.round((performance.now() - t0) * 100) / 100),
    engine: "RULE_ENSEMBLE+SIMULATED_ML",
  };
}
