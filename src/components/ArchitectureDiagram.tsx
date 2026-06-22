import { useState } from "react";
import {
  Search, Globe, Bug, ShieldAlert, FileCheck2, FileText, Cpu,
} from "lucide-react";

const AGENTS = [
  { id: "detect", name: "Threat Detection", desc: "Identifies phishing, malware, suspicious URLs", icon: Search, color: "var(--cyber-cyan)", angle: -90 },
  { id: "intel", name: "Threat Intelligence", desc: "Collects external threat intelligence feeds", icon: Globe, color: "var(--cyber-blue)", angle: -30 },
  { id: "malware", name: "Malware Analysis", desc: "Examines files and attack patterns", icon: Bug, color: "var(--cyber-purple)", angle: 30 },
  { id: "response", name: "Incident Response", desc: "Generates mitigation strategies", icon: ShieldAlert, color: "var(--cyber-pink)", angle: 90 },
  { id: "compliance", name: "Compliance", desc: "Maps findings to security frameworks", icon: FileCheck2, color: "var(--cyber-purple)", angle: 150 },
  { id: "report", name: "Reporting", desc: "Creates executive and technical reports", icon: FileText, color: "var(--cyber-blue)", angle: 210 },
];

export function ArchitectureDiagram() {
  const [active, setActive] = useState<string | null>(null);
  const size = 640;
  const cx = size / 2;
  const cy = size / 2;
  const R = 230;

  const nodes = AGENTS.map(a => {
    const rad = (a.angle * Math.PI) / 180;
    return { ...a, x: cx + R * Math.cos(rad), y: cy + R * Math.sin(rad) };
  });

  return (
    <div className="relative mx-auto w-full max-w-[680px] aspect-square">
      {/* glow */}
      <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full blur-3xl opacity-50"
        style={{ background: "radial-gradient(circle, var(--cyber-blue), transparent 60%)" }} />

      <svg viewBox={`0 0 ${size} ${size}`} className="relative w-full h-full">
        <defs>
          <radialGradient id="hubGrad" cx="50%" cy="50%">
            <stop offset="0%" stopColor="oklch(0.85 0.18 200)" />
            <stop offset="60%" stopColor="oklch(0.65 0.24 295)" />
            <stop offset="100%" stopColor="oklch(0.3 0.1 280)" />
          </radialGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.7 0.2 255)" stopOpacity="0.1" />
            <stop offset="50%" stopColor="oklch(0.85 0.18 200)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="oklch(0.65 0.24 295)" stopOpacity="0.1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* orbit rings */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="oklch(1 0 0 / 0.06)" strokeDasharray="2 6" />
        <circle cx={cx} cy={cy} r={R - 60} fill="none" stroke="oklch(1 0 0 / 0.04)" />
        <circle cx={cx} cy={cy} r={R + 40} fill="none" stroke="oklch(1 0 0 / 0.04)" />

        {/* connection lines + packets */}
        {nodes.map((n, i) => {
          const id = `path-${i}`;
          const d = `M ${cx} ${cy} L ${n.x} ${n.y}`;
          const isActive = active === n.id || active === null;
          return (
            <g key={n.id} opacity={isActive ? 1 : 0.25} style={{ transition: "opacity .3s" }}>
              <path id={id} d={d} stroke="url(#lineGrad)" strokeWidth="1.5" fill="none" />
              <path d={d} stroke={n.color} strokeWidth="1" fill="none" className="animate-dash" opacity="0.6" />
              {/* packets */}
              <circle r="3" fill={n.color} filter="url(#glow)">
                <animateMotion dur={`${3 + i * 0.3}s`} repeatCount="indefinite" path={d} />
              </circle>
              <circle r="2" fill="white" opacity="0.9">
                <animateMotion dur={`${3 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.4}s`} path={`M ${n.x} ${n.y} L ${cx} ${cy}`} />
              </circle>
            </g>
          );
        })}

        {/* hub */}
        <g>
          <circle cx={cx} cy={cy} r="70" fill="url(#hubGrad)" filter="url(#glow)" />
          <circle cx={cx} cy={cy} r="70" fill="none" stroke="oklch(1 0 0 / 0.3)" strokeWidth="1" />
          <circle cx={cx} cy={cy} r="90" fill="none" stroke="oklch(0.85 0.18 200 / 0.4)" strokeDasharray="3 6">
            <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur="20s" repeatCount="indefinite" />
          </circle>
          <foreignObject x={cx - 60} y={cy - 36} width="120" height="72">
            <div className="flex flex-col items-center justify-center text-center h-full text-white">
              <Cpu className="size-6 mb-1" />
              <div className="text-[11px] font-mono uppercase tracking-widest opacity-80">Orchestrator</div>
              <div className="text-sm font-semibold">CyberShield AI</div>
            </div>
          </foreignObject>
        </g>

        {/* agent nodes */}
        {nodes.map((n) => {
          const isActive = active === n.id;
          return (
            <g key={n.id} onMouseEnter={() => setActive(n.id)} onMouseLeave={() => setActive(null)} style={{ cursor: "pointer" }}>
              <circle cx={n.x} cy={n.y} r="44" fill="oklch(0.12 0.02 265 / 0.9)" stroke={n.color} strokeWidth={isActive ? 2 : 1} filter="url(#glow)" />
              {isActive && <circle cx={n.x} cy={n.y} r="44" fill="none" stroke={n.color} className="animate-pulse-ring" />}
              <foreignObject x={n.x - 40} y={n.y - 28} width="80" height="56">
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <n.icon className="size-5 mb-1" style={{ color: n.color }} />
                  <div className="text-[10px] font-semibold leading-tight text-foreground">{n.name}</div>
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>

      {/* tooltip / detail */}
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 glass-strong rounded-xl px-5 py-3 min-w-[280px] text-center transition-all"
        style={{ opacity: active ? 1 : 0.6 }}>
        {active ? (
          <>
            <div className="text-xs font-mono uppercase tracking-widest text-cyber-cyan">Agent</div>
            <div className="text-sm font-semibold mt-0.5">{AGENTS.find(a => a.id === active)?.name} Agent</div>
            <div className="text-xs text-muted-foreground mt-1">{AGENTS.find(a => a.id === active)?.desc}</div>
          </>
        ) : (
          <div className="text-xs text-muted-foreground font-mono">Hover an agent to inspect its role</div>
        )}
      </div>
    </div>
  );
}
