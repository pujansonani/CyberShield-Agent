import jsPDF from "jspdf";

type ReportInput = {
  id?: string;
  indicator: string;
  kind: string;
  verdict: string | null;
  severity: string | null;
  confidence: number | null;
  executive_summary: string | null;
  findings: Record<string, unknown>;
  duration_ms?: number | null;
  created_at?: string;
};

export function exportInvestigationPdf(r: ReportInput) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 48;
  let y = M;

  const line = (text: string, opts: { size?: number; bold?: boolean; color?: [number, number, number]; mt?: number } = {}) => {
    const { size = 10, bold = false, color = [30, 41, 59], mt = 0 } = opts;
    if (mt) y += mt;
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const wrapped = doc.splitTextToSize(text, W - M * 2);
    for (const w of wrapped) {
      if (y > 780) { doc.addPage(); y = M; }
      doc.text(w, M, y);
      y += size * 1.35;
    }
  };

  const rule = () => { y += 6; doc.setDrawColor(220); doc.line(M, y, W - M, y); y += 10; };

  // Header band
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 96, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("CyberShield AI", M, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text("Autonomous Multi-Agent Cyber Defense — Forensic Report", M, 62);
  doc.setFontSize(8);
  doc.text(`Generated ${new Date().toLocaleString()}`, M, 78);
  y = 130;

  // Verdict block
  const sev = (r.severity ?? "info").toLowerCase();
  const sevColor: [number, number, number] =
    sev === "critical" ? [220, 38, 38] :
    sev === "high"     ? [234, 88, 12] :
    sev === "medium"   ? [202, 138, 4] :
    sev === "low"      ? [14, 165, 233] :
                         [100, 116, 139];

  doc.setFillColor(...sevColor);
  doc.roundedRect(M, y, 90, 26, 4, 4, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(sev.toUpperCase(), M + 12, y + 17);

  const verdict = (r.verdict ?? "unknown").toUpperCase();
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.text(`VERDICT: ${verdict}`, M + 105, y + 18);
  y += 50;

  // Meta
  line(`Indicator type: ${r.kind}`, { size: 10, color: [100, 116, 139] });
  line(`Confidence: ${Math.round((r.confidence ?? 0) * 100)}%`, { size: 10, color: [100, 116, 139] });
  if (r.duration_ms) line(`Analysis time: ${(r.duration_ms / 1000).toFixed(1)}s`, { size: 10, color: [100, 116, 139] });
  if (r.created_at) line(`Investigated: ${new Date(r.created_at).toLocaleString()}`, { size: 10, color: [100, 116, 139] });
  rule();

  // Indicator
  line("INDICATOR UNDER INVESTIGATION", { size: 9, bold: true, color: [100, 116, 139], mt: 4 });
  line(r.indicator, { size: 10 });
  rule();

  // Executive summary
  if (r.executive_summary) {
    line("EXECUTIVE SUMMARY", { size: 9, bold: true, color: [100, 116, 139] });
    line(r.executive_summary, { size: 11 });
    rule();
  }

  // IoCs
  const iocs = Array.isArray(r.findings?.ioc_list) ? (r.findings.ioc_list as unknown[]) : [];
  if (iocs.length) {
    line("INDICATORS OF COMPROMISE (IoCs)", { size: 9, bold: true, color: [100, 116, 139] });
    iocs.forEach((ioc) => line(`• ${String(ioc)}`, { size: 10 }));
    rule();
  }

  // Remediation
  const rem = Array.isArray(r.findings?.remediation_steps) ? (r.findings.remediation_steps as unknown[]) : [];
  if (rem.length) {
    line("REMEDIATION STEPS", { size: 9, bold: true, color: [100, 116, 139] });
    rem.forEach((s, i) => line(`${i + 1}. ${String(s)}`, { size: 10 }));
    rule();
  }

  // Agent findings
  line("AGENT FINDINGS", { size: 9, bold: true, color: [100, 116, 139] });
  const agentBlocks = (r.findings?.agents as Record<string, Record<string, unknown>> | undefined) ?? {};
  for (const [agentId, data] of Object.entries(agentBlocks)) {
    line(agentLabel(agentId), { size: 11, bold: true, mt: 6 });
    for (const [k, v] of Object.entries(data)) {
      if (k === "reasoning") continue;
      line(`${k}: ${formatVal(v)}`, { size: 9, color: [71, 85, 105] });
    }
    if (typeof data.reasoning === "string") {
      line(`reasoning: ${data.reasoning}`, { size: 9, color: [71, 85, 105] });
    }
  }

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`CyberShield AI · Confidential SOC Report · Page ${i} of ${pages}`, M, 820);
  }

  const slug = r.indicator.replace(/[^a-z0-9]+/gi, "_").slice(0, 40);
  doc.save(`cybershield_${slug || "report"}.pdf`);
}

function agentLabel(id: string) {
  return ({
    detection: "Threat Detection Agent",
    intel: "Threat Intelligence Agent",
    malware: "Malware Analysis Agent",
    risk: "Risk Assessment Agent",
    compliance: "Compliance Agent",
    report: "Report Generation Agent",
  } as Record<string, string>)[id] ?? id;
}

function formatVal(v: unknown): string {
  if (v == null) return "—";
  if (Array.isArray(v)) return v.map(String).join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
