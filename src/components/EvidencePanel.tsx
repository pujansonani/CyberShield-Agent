import { Globe, ShieldCheck, Server, Lock, Crosshair, ScrollText } from "lucide-react";

type Obj = Record<string, unknown>;

const str = (v: unknown, fallback = "—") =>
  v === undefined || v === null || v === "" ? fallback : String(v);

function statusTone(s: string) {
  const v = s.toLowerCase();
  if (v.includes("malicious") || v.includes("blacklist") || v.includes("expired") || v.includes("invalid"))
    return { text: "#FDA4AF", bg: "rgba(251,113,133,.12)" };
  if (v.includes("suspicious") || v.includes("warn")) return { text: "#FCD34D", bg: "rgba(251,191,36,.12)" };
  if (v.includes("safe") || v.includes("valid") || v.includes("clean")) return { text: "#6EE7B7", bg: "rgba(52,211,153,.12)" };
  return { text: "#7DD3FC", bg: "rgba(56,189,248,.12)" };
}

function Card({
  icon: Icon,
  title,
  badge,
  rows,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  badge?: string;
  rows: [string, string][];
}) {
  const tone = statusTone(badge ?? "");
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2.5">
        <Icon className="size-4 text-cyan-300" />
        <h4 className="text-sm font-semibold">{title}</h4>
        {badge && (
          <span
            className="ml-auto text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: tone.bg, color: tone.text }}
          >
            {badge}
          </span>
        )}
      </div>
      <dl className="space-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="flex gap-2 text-[11px] font-mono">
            <dt className="text-muted-foreground shrink-0">{k}</dt>
            <dd className="text-foreground/90 break-all ml-auto text-right">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function ConfidenceMeter({ value, verdict }: { value: number; verdict?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  const color =
    verdict === "malicious" ? "#FDA4AF" : verdict === "suspicious" ? "#FCD34D" : "#6EE7B7";
  const r = 42;
  const c = 2 * Math.PI * r;
  const label = pct >= 85 ? "Very high" : pct >= 70 ? "High" : pct >= 50 ? "Moderate" : "Low";

  return (
    <div className="glass rounded-xl p-4 flex items-center gap-4">
      <div className="relative size-[104px] shrink-0">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (c * pct) / 100}
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-xl font-bold" style={{ color }}>
            {pct}%
          </span>
          <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">conf</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Agent Consensus</p>
        <p className="text-sm font-semibold mt-0.5">{label} confidence</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          Aggregated across all specialist agents after cross-validating their findings.
        </p>
      </div>
    </div>
  );
}

export function EvidencePanel({
  intel,
  malware,
  compliance,
}: {
  intel?: Obj;
  malware?: Obj;
  compliance?: Obj;
}) {
  if (!intel && !malware && !compliance) return null;

  const vt = (intel?.virustotal ?? {}) as Obj;
  const abuse = (intel?.abuseipdb ?? {}) as Obj;
  const whois = (intel?.whois ?? {}) as Obj;
  const ssl = (intel?.ssl ?? {}) as Obj;
  const mitre = [
    ...((malware?.mitre_techniques as unknown[]) ?? []),
    ...((intel?.ttp_overlap as unknown[]) ?? []),
  ].map(String);
  const sources = ((intel?.sources_cited as unknown[]) ?? []).map(String);

  return (
    <div className="glass-strong rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <ScrollText className="size-4 text-cyan-300" />
        <h3 className="font-display font-semibold text-sm">Evidence &amp; Threat Intelligence</h3>
        {sources.length > 0 && (
          <span className="ml-auto text-[10px] font-mono text-muted-foreground">
            {sources.length} sources cited
          </span>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {intel && (
          <Card
            icon={ShieldCheck}
            title="VirusTotal"
            badge={str(vt.status, "unknown")}
            rows={[
              ["Reputation", str(vt.reputation_score ?? intel.reputation_score)],
              ["Detections", str(vt.detection_ratio)],
            ]}
          />
        )}
        {intel && (
          <Card
            icon={Server}
            title="AbuseIPDB"
            badge={abuse.blacklisted ? "blacklisted" : "not listed"}
            rows={[
              ["Abuse score", str(abuse.confidence_score)],
              ["Activity", str(abuse.reported_activity)],
            ]}
          />
        )}
        {intel && (
          <Card
            icon={Globe}
            title="WHOIS"
            rows={[
              ["Domain age", str(whois.domain_age)],
              ["Registrar", str(whois.registrar)],
              ["Country", str(whois.country)],
              ["Registered", str(whois.registration_date)],
            ]}
          />
        )}
        {intel && (
          <Card
            icon={Lock}
            title="SSL Certificate"
            badge={str(ssl.status, "unknown")}
            rows={[
              ["Issuer", str(ssl.issuer)],
              ["Expires", str(ssl.expiration_date)],
            ]}
          />
        )}
      </div>

      {mitre.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Crosshair className="size-3" /> MITRE ATT&amp;CK mapping
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(new Set(mitre)).map((t) => (
              <span
                key={t}
                className="text-[11px] font-mono px-2 py-0.5 rounded border"
                style={{ background: "rgba(167,139,250,.10)", borderColor: "rgba(167,139,250,.3)", color: "#C4B5FD" }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {compliance && (
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <Card
            icon={ScrollText}
            title="Regulatory Exposure"
            badge={compliance.notification_required ? "notification required" : "no notification"}
            rows={[
              ["GDPR", str(compliance.gdpr_impact).slice(0, 70)],
              ["ISO 27001", ((compliance.iso_27001_controls as unknown[]) ?? []).map(String).slice(0, 3).join(", ") || "—"],
              ["NIST CSF", ((compliance.nist_csf_functions as unknown[]) ?? []).map(String).slice(0, 4).join(", ") || "—"],
            ]}
          />
          {sources.length > 0 && (
            <Card icon={Globe} title="Sources Cited" rows={sources.map((s, i) => [`#${i + 1}`, s] as [string, string])} />
          )}
        </div>
      )}
    </div>
  );
}
