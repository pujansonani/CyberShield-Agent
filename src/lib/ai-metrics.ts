export type MetricsAgentLike = {
  id: string;
  status: "pending" | "running" | "done" | "error";
  findings?: Record<string, unknown>;
  startedAt?: number;
  endedAt?: number;
};

export type AiMetrics = {
  tokens: number;
  apiCalls: number;
  intelApis: number;
  costInr: number;
  energyKwh: number;
  co2Grams: number;
  agentsDone: number;
  activeAgentId: string | null;
};

const CHARS_PER_TOKEN = 4;
const PROMPT_TOKENS_PER_AGENT = 420; // system + shape + prior-context overhead
const INR_PER_1K_TOKENS = 0.026;
const KWH_PER_1K_TOKENS = 0.00042;
const G_CO2_PER_KWH = 465;

/** Deterministic, transparent estimates derived from real agent activity. */
export function computeAiMetrics(agents: MetricsAgentLike[]): AiMetrics {
  let tokens = 0;
  let apiCalls = 0;
  let agentsDone = 0;

  for (const a of agents) {
    if (a.status === "running") {
      tokens += PROMPT_TOKENS_PER_AGENT;
      apiCalls += 1;
    }
    if (a.status === "done" || a.status === "error") {
      apiCalls += 1;
      agentsDone += 1;
      const out = a.findings ? JSON.stringify(a.findings).length : 0;
      tokens += PROMPT_TOKENS_PER_AGENT + Math.round(out / CHARS_PER_TOKEN);
    }
  }

  const intelAgent = agents.find((a) => a.id === "intel");
  const intelApis = intelAgent && intelAgent.status !== "pending" ? 4 : 0;

  const energyKwh = (tokens / 1000) * KWH_PER_1K_TOKENS;

  return {
    tokens,
    apiCalls: apiCalls + intelApis,
    intelApis,
    costInr: (tokens / 1000) * INR_PER_1K_TOKENS,
    energyKwh,
    co2Grams: energyKwh * G_CO2_PER_KWH,
    agentsDone,
    activeAgentId: agents.find((a) => a.status === "running")?.id ?? null,
  };
}

export const AI_FACTS = [
  "Every AI request consumes electricity and computational resources.",
  "Efficient prompting reduces token usage and carbon emissions.",
  "Multi-agent systems reduce unnecessary computation by assigning specialized tasks.",
  "Caching threat-intelligence API results improves both speed and sustainability.",
  "Shorter, structured outputs (like JSON) cost fewer tokens than long prose.",
];

export function nextFactIndex(): number {
  try {
    const n = Number(localStorage.getItem("cs_fact_index") ?? "0") + 1;
    localStorage.setItem("cs_fact_index", String(n));
    return n % AI_FACTS.length;
  } catch {
    return Math.floor(Math.random() * AI_FACTS.length);
  }
}
