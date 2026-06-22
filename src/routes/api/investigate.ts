import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
  indicator: string;
  kind: "email" | "url" | "domain" | "ip" | "file";
  context?: string;
};

type AgentDef = {
  id: string;
  name: string;
  role: string;
  color: string;
  systemPrompt: string;
  schema: z.ZodTypeAny;
};

const AGENTS: AgentDef[] = [
  {
    id: "detection",
    name: "Threat Detection Agent",
    role: "Surface-level threat indicators",
    color: "cyan",
    systemPrompt:
      "You are the Threat Detection Agent in an autonomous SOC. Inspect the indicator for phishing language, suspicious patterns, header anomalies, lookalike domains, and obvious IoCs. Be terse, technical, and confident. Output strict JSON.",
    schema: z.object({
      indicators: z.array(z.string()).max(6),
      patterns_observed: z.array(z.string()).max(5),
      initial_severity: z.enum(["info", "low", "medium", "high", "critical"]),
      confidence: z.number().min(0).max(1),
      reasoning: z.string().max(400),
    }),
  },
  {
    id: "intel",
    name: "Threat Intelligence Agent",
    role: "Reputation & external intel",
    color: "violet",
    systemPrompt:
      "You are the Threat Intelligence Agent. Based on the indicator type, infer what VirusTotal / AbuseIPDB / WHOIS would likely surface (domain age, hosting ASN, prior abuse reports, known TTP overlap). Be plausible and specific. Output strict JSON.",
    schema: z.object({
      reputation_score: z.number().min(0).max(100),
      known_threat_actor: z.string().max(80),
      ttp_overlap: z.array(z.string()).max(5),
      sources_cited: z.array(z.string()).max(4),
      reasoning: z.string().max(400),
    }),
  },
  {
    id: "malware",
    name: "Malware Analysis Agent",
    role: "Payload & behavior analysis",
    color: "rose",
    systemPrompt:
      "You are the Malware Analysis Agent. If the indicator could deliver a payload, hypothesize family, behavior, persistence, and C2. If clearly no payload, say so and lower risk. Output strict JSON.",
    schema: z.object({
      payload_present: z.boolean(),
      suspected_family: z.string().max(60),
      behaviors: z.array(z.string()).max(5),
      mitre_techniques: z.array(z.string()).max(5),
      risk_score: z.number().min(0).max(100),
      reasoning: z.string().max(400),
    }),
  },
  {
    id: "risk",
    name: "Risk Assessment Agent",
    role: "Aggregate severity & impact",
    color: "amber",
    systemPrompt:
      "You are the Risk Assessment Agent. You have findings from Detection, Intelligence, and Malware agents. Reconcile them, weigh confidence, and produce a unified risk picture for the business. Output strict JSON.",
    schema: z.object({
      overall_risk: z.enum(["info", "low", "medium", "high", "critical"]),
      threat_score: z.number().min(0).max(100),
      business_impact: z.string().max(300),
      affected_assets: z.array(z.string()).max(5),
      reasoning: z.string().max(400),
    }),
  },
  {
    id: "compliance",
    name: "Compliance Agent",
    role: "Regulatory mapping",
    color: "emerald",
    systemPrompt:
      "You are the Compliance Agent. Map the threat to GDPR, ISO 27001, NIST CSF, and SOC2 controls. List relevant clauses/controls and any notification obligations. Output strict JSON.",
    schema: z.object({
      gdpr_impact: z.string().max(200),
      iso_27001_controls: z.array(z.string()).max(5),
      nist_csf_functions: z.array(z.string()).max(5),
      soc2_criteria: z.array(z.string()).max(5),
      notification_required: z.boolean(),
      reasoning: z.string().max(300),
    }),
  },
  {
    id: "report",
    name: "Report Generation Agent",
    role: "Executive synthesis",
    color: "sky",
    systemPrompt:
      "You are the Report Generation Agent. Synthesize all prior agent findings into an executive verdict, indicators of compromise list, and prioritized remediation steps. Output strict JSON.",
    schema: z.object({
      executive_summary: z.string().max(500),
      verdict: z.enum(["benign", "suspicious", "malicious"]),
      ioc_list: z.array(z.string()).max(8),
      remediation_steps: z.array(z.string()).max(6),
      confidence: z.number().min(0).max(1),
    }),
  },
];

function sse(controller: ReadableStreamDefaultController, event: object) {
  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`));
}

async function runInvestigation(body: Body, controller: ReadableStreamDefaultController) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) {
    sse(controller, { type: "error", message: "Missing LOVABLE_API_KEY" });
    controller.close();
    return;
  }
  const gateway = createLovableAiGatewayProvider(key);
  const model = gateway("google/gemini-3-flash-preview");

  sse(controller, {
    type: "orchestrator",
    message: `Orchestrator received ${body.kind} indicator. Spawning ${AGENTS.length} specialist agents.`,
  });

  const findings: Record<string, unknown> = {};

  for (const agent of AGENTS) {
    sse(controller, { type: "agent_started", agentId: agent.id, name: agent.name, role: agent.role, color: agent.color });

    const priorContext =
      Object.keys(findings).length > 0
        ? `\n\nPrior agent findings (collaborate, do not contradict without reason):\n${JSON.stringify(findings, null, 2)}`
        : "";

    const userPrompt = `Investigation target:
- type: ${body.kind}
- indicator: ${body.indicator}
- analyst_context: ${body.context ?? "(none provided)"}
${priorContext}`;

    try {
      const { text } = await generateText({
        model,
        system: agent.systemPrompt,
        prompt: userPrompt,
        experimental_output: Output.object({ schema: agent.schema }),
      });

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        parsed = match ? JSON.parse(match[0]) : { reasoning: text };
      }

      findings[agent.id] = parsed;

      sse(controller, {
        type: "agent_completed",
        agentId: agent.id,
        name: agent.name,
        findings: parsed,
      });

      const lastKey = Object.keys(findings).slice(-2, -1)[0];
      if (lastKey) {
        sse(controller, {
          type: "agent_message",
          from: agent.id,
          to: lastKey,
          text: `Acknowledged your findings. Incorporating into ${agent.id} analysis.`,
        });
      }
    } catch (err) {
      sse(controller, {
        type: "agent_error",
        agentId: agent.id,
        message: err instanceof Error ? err.message : "Agent failed",
      });
    }
  }

  sse(controller, { type: "done", findings });
  controller.close();
}

export const Route = createFileRoute("/api/investigate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        if (!body.indicator || !body.kind) {
          return new Response("indicator and kind are required", { status: 400 });
        }

        const stream = new ReadableStream({
          async start(controller) {
            try {
              await runInvestigation(body, controller);
            } catch (err) {
              sse(controller, {
                type: "error",
                message: err instanceof Error ? err.message : "Unknown error",
              });
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "content-type": "text/event-stream",
            "cache-control": "no-cache, no-transform",
            connection: "keep-alive",
          },
        });
      },
    },
  },
});
