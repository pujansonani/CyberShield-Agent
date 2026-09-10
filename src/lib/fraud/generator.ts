/**
 * Synthetic transaction generator. Demo data only — never real accounts.
 */
import type { ScenarioId, Transaction } from "./types";

const CITIES = ["Pune", "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai", "Jaipur"];
const FAR_CITIES = ["Lagos", "Kyiv", "Ho Chi Minh City", "Bucharest", "Manila"];
const MERCHANTS: Array<[string, string]> = [
  ["QuickMart", "Grocery"],
  ["VoltEdge Electronics", "Electronics"],
  ["FuelPoint", "Fuel"],
  ["MetroRide", "Transport"],
  ["StreamPlus", "Digital Goods"],
  ["GoldLine Jewellers", "Jewellery"],
  ["CryptoBridge", "Crypto Exchange"],
  ["AeroFly Travel", "Travel"],
  ["MediCare Pharmacy", "Pharmacy"],
  ["GameVault", "Gaming"],
];

let seq = 92830;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}
function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export type GeneratorContext = {
  /** trailing transactions used for velocity + baseline context */
  history: Transaction[];
};

/** Build one synthetic transaction for the given scenario. */
export function generateTransaction(scenario: ScenarioId, ctx: GeneratorContext): Omit<
  Transaction,
  "score" | "severity" | "factors" | "path" | "status" | "detectionLatencyMs"
> {
  const id = `TXN-${++seq}`;
  const ts = Date.now();
  const [merchant, category] = pick(MERCHANTS);
  const customerId = `CUST-${Math.floor(rand(1000, 1999))}`;
  const baselineAmount = Math.round(rand(900, 6500));
  const recent = ctx.history.filter((t) => ts - t.ts < 10 * 60_000);

  const base = {
    id,
    ts,
    currency: "INR" as const,
    customerId,
    merchant,
    category,
    baselineAmount,
    sessionId: `SES-${Math.floor(rand(10000, 99999))}`,
    ip: `${Math.floor(rand(14, 220))}.${Math.floor(rand(0, 255))}.${Math.floor(rand(0, 255))}.${Math.floor(rand(1, 254))}`,
    deviceId: `DEV-${Math.floor(rand(1000, 4999))}`,
    location: pick(CITIES),
    velocity: recent.filter((t) => t.customerId === customerId).length + 1,
    newDevice: Math.random() < 0.12,
    geoInconsistent: false,
    offHours: new Date(ts).getHours() >= 1 && new Date(ts).getHours() <= 5,
    repeated: false,
    scenario,
  };

  switch (scenario) {
    case "NORMAL":
      return { ...base, amount: Math.round(baselineAmount * rand(0.4, 1.6)) };
    case "SUSPICIOUS":
      return {
        ...base,
        amount: Math.round(baselineAmount * rand(4, 8)),
        newDevice: true,
        velocity: base.velocity + 3,
      };
    case "HIGH_VELOCITY":
      return {
        ...base,
        amount: Math.round(baselineAmount * rand(3, 6)),
        velocity: Math.floor(rand(9, 16)),
        repeated: true,
      };
    case "GEO_ANOMALY":
      return {
        ...base,
        amount: Math.round(baselineAmount * rand(2, 5)),
        location: pick(FAR_CITIES),
        geoInconsistent: true,
      };
    case "UNUSUAL_AMOUNT":
      return { ...base, amount: Math.round(baselineAmount * rand(12, 22)) };
    case "NEW_DEVICE":
      return {
        ...base,
        amount: Math.round(baselineAmount * rand(5, 9)),
        newDevice: true,
        deviceId: `DEV-${Math.floor(rand(8000, 8999))}`,
      };
    case "COMBINED_FRAUD":
      return {
        ...base,
        amount: Math.round(baselineAmount * rand(14, 26)),
        velocity: Math.floor(rand(11, 18)),
        location: pick(FAR_CITIES),
        geoInconsistent: true,
        newDevice: true,
        repeated: true,
        offHours: true,
        merchant: "CryptoBridge",
        category: "Crypto Exchange",
        deviceId: `DEV-${Math.floor(rand(9000, 9999))}`,
      };
  }
}

export const SCENARIOS: Array<{ id: ScenarioId; label: string; description: string }> = [
  { id: "HIGH_VELOCITY", label: "Scenario 1 — High Velocity", description: "Multiple high-value transactions inside a short window." },
  { id: "GEO_ANOMALY", label: "Scenario 2 — Geographic Anomaly", description: "Impossible travel between consecutive transactions." },
  { id: "UNUSUAL_AMOUNT", label: "Scenario 3 — Unusual Amount", description: "Ticket size far outside the customer's normal range." },
  { id: "NEW_DEVICE", label: "Scenario 4 — New Device", description: "High-value payment from an unrecognised device." },
  { id: "COMBINED_FRAUD", label: "Scenario 5 — Combined Fraud", description: "Amount + velocity + geo + new device + behavioural drift." },
];
