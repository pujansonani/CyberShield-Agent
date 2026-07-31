import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type Body = {
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
  jsonShape: string;
};

const AGENTS: AgentDef[] = [
  {
    id: "detection",
    name: "Threat Detection Agent",
    role: "Surface-level threat indicators",
    color: "cyan",
    systemPrompt:
      "You are the Threat Detection Agent in an autonomous SOC. Inspect the indicator for phishing language, suspicious patterns, header anomalies, lookalike domains, and obvious IoCs. Be terse, technical, and confident.",
    jsonShape: `{
  "indicators": [string],          // up to 6 specific IoCs you spotted
  "patterns_observed": [string],   // up to 5 phishing/social-eng patterns
  "initial_severity": "info"|"low"|"medium"|"high"|"critical",
  "confidence": number,            // 0..1
  "reasoning": string              // <= 300 chars
}`,
  },
  {
    id: "intel",
    name: "Threat Intelligence Agent",
    role: "Reputation & external intel",
    color: "violet",
    systemPrompt:
      "You are the Threat Intelligence Agent. Based on the indicator type, infer what VirusTotal / AbuseIPDB / WHOIS would plausibly surface (domain age, hosting ASN, prior abuse reports, known TTP overlap). Be plausible and specific.",
    jsonShape: `{
  "reputation_score": number,      // 0..100, lower = worse
  "known_threat_actor": string,    // or "Unknown"
  "ttp_overlap": [string],         // up to 5 MITRE ATT&CK TTPs
  "sources_cited": [string],       // e.g. ["VirusTotal","AbuseIPDB","WHOIS"]
  "virustotal": { "status": "safe"|"suspicious"|"malicious", "reputation_score": number, "detection_ratio": string },
  "abuseipdb": { "confidence_score": number, "blacklisted": boolean, "reported_activity": string },
  "whois": { "domain_age": string, "registrar": string, "country": string, "registration_date": string },
  "ssl": { "status": string, "issuer": string, "expiration_date": string },
  "reasoning": string
}`,
  },
  {
    id: "malware",
    name: "Malware Analysis Agent",
    role: "Payload & behavior analysis",
    color: "rose",
    systemPrompt:
      "You are the Malware Analysis Agent. If the indicator could deliver a payload, hypothesize family, behavior, persistence, and C2. If clearly no payload, say so and lower risk.",
    jsonShape: `{
  "payload_present": boolean,
  "suspected_family": string,
  "behaviors": [string],
  "mitre_techniques": [string],    // e.g. ["T1566.002","T1059.001"]
  "risk_score": number,            // 0..100
  "reasoning": string
}`,
  },
  {
    id: "risk",
    name: "Risk Assessment Agent",
    role: "Aggregate severity & impact",
    color: "amber",
    systemPrompt:
      "You are the Risk Assessment Agent. You have findings from Detection, Intelligence, and Malware agents. Reconcile them, weigh confidence, and produce a unified risk picture for the business.",
    jsonShape: `{
  "overall_risk": "info"|"low"|"medium"|"high"|"critical",
  "threat_score": number,          // 0..100
  "business_impact": string,
  "affected_assets": [string],
  "reasoning": string
}`,
  },
  {
    id: "compliance",
    name: "Compliance Agent",
    role: "Regulatory mapping",
    color: "emerald",
    systemPrompt:
      "You are the Compliance Agent. Map the threat to GDPR, ISO 27001, NIST CSF, and SOC2 controls. List relevant clauses/controls and any notification obligations.",
    jsonShape: `{
  "gdpr_impact": string,
  "iso_27001_controls": [string],
  "nist_csf_functions": [string],  // Identify/Protect/Detect/Respond/Recover
  "soc2_criteria": [string],
  "notification_required": boolean,
  "reasoning": string
}`,
  },
  {
    id: "report",
    name: "Report Generation Agent",
    role: "Executive synthesis",
    color: "sky",
    systemPrompt:
      "You are the Report Generation Agent. Synthesize all prior agent findings into an executive verdict, indicators of compromise list, and prioritized remediation steps.",
    jsonShape: `{
  "verdict": "benign"|"suspicious"|"malicious",
  "executive_summary": string,     // 2-3 sentences
  "ioc_list": [string],
  "remediation_steps": [string],   // up to 6, prioritized
  "confidence": number             // 0..1
}`,
  },
];

const AGENT_STEPS: Record<string, string[]> = {
  detection: ["Parsing submitted artifact", "Extracting headers, URLs and IoCs", "Scoring phishing & anomaly patterns"],
  intel: ["Querying VirusTotal reputation", "Checking AbuseIPDB reports", "Resolving WHOIS & SSL records"],
  malware: ["Hypothesising payload family", "Mapping behavioural indicators", "Correlating MITRE ATT&CK techniques"],
  risk: ["Reconciling agent findings", "Weighting confidence & blast radius", "Computing unified threat score"],
  compliance: ["Mapping GDPR obligations", "Checking ISO 27001 / NIST CSF controls", "Evaluating notification duties"],
  report: ["Aggregating evidence chain", "Drafting executive summary", "Prioritising remediation steps"],
};

function sse(controller: ReadableStreamDefaultController, event: object) {
  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`));
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const match = candidate.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("no JSON object found");
  return JSON.parse(match[0]);
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
  const order: string[] = [];

  for (const agent of AGENTS) {
    sse(controller, {
      type: "agent_started",
      agentId: agent.id,
      name: agent.name,
      role: agent.role,
      color: agent.color,
    });

    for (const step of AGENT_STEPS[agent.id] ?? []) {
      sse(controller, { type: "agent_step", agentId: agent.id, step });
    }



    const priorContext =
      Object.keys(findings).length > 0
        ? `\n\nPrior agent findings (collaborate; do not contradict without justification):\n${JSON.stringify(findings, null, 2)}`
        : "";

    const userPrompt = `INVESTIGATION TARGET
- type: ${body.kind}
- indicator: ${body.indicator}
- analyst_context: ${body.context ?? "(none)"}
${priorContext}

Return ONLY a single JSON object matching exactly this shape (no prose, no markdown):
${agent.jsonShape}`;

    try {
      const { text } = await generateText({
        model,
        system: agent.systemPrompt,
        prompt: userPrompt,
      });

      let parsed: Record<string, unknown>;
      try {
        parsed = extractJson(text) as Record<string, unknown>;
      } catch {
        parsed = { reasoning: text.slice(0, 400) };
      }

      findings[agent.id] = parsed;

      sse(controller, {
        type: "agent_completed",
        agentId: agent.id,
        name: agent.name,
        findings: parsed,
      });

      const prev = order[order.length - 1];
      if (prev) {
        sse(controller, {
          type: "agent_message",
          from: agent.id,
          to: prev,
          text: `Incorporated ${prev} findings into ${agent.id} analysis.`,
        });
      }
      order.push(agent.id);
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
