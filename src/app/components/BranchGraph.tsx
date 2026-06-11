import { GitBranch } from "lucide-react";

const branches = [
  { name: "main", commits: ["C1", "C2", "C3", "C4", "C5"], color: "#388bfd", y: 40 },
  { name: "feature/auth-refactor", commits: ["C2", "C3", "C4"], color: "#a371f7", y: 80, from: 1, to: 4 },
  { name: "fix/token-expiry", commits: ["C3", "C4"], color: "#3fb950", y: 120, from: 2, to: 4 },
];

const commitLabels: Record<string, { msg: string; sha: string }> = {
  C1: { msg: "chore: deps update", sha: "a1b2c3" },
  C2: { msg: "feat: extract IAuthService", sha: "d4e5f6" },
  C3: { msg: "refactor: DI pattern", sha: "g7h8i9" },
  C4: { msg: "fix: token validation", sha: "j0k1l2" },
  C5: { msg: "merge: auth-refactor", sha: "m3n4o5" },
};

const positions: Record<string, number> = { C1: 40, C2: 120, C3: 200, C4: 280, C5: 360 };
const branchColors = ["#388bfd", "#a371f7", "#3fb950"];

export function BranchGraph() {
  const svgWidth = 400;
  const svgHeight = 150;

  return (
    <div className="flex flex-col rounded border border-border bg-card overflow-hidden h-full">
      <div className="px-3 py-2 border-b border-border flex items-center gap-2 shrink-0">
        <GitBranch size={12} className="text-muted-foreground" />
        <span style={{ fontSize: "11px", fontWeight: 600 }} className="text-foreground">Branch Graph</span>
      </div>
      <div className="flex-1 overflow-hidden p-2">
        <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="xMidYMid meet">
          {/* Main branch line */}
          <line x1="20" y1="40" x2="380" y2="40" stroke="#388bfd" strokeWidth="1.5" strokeOpacity="0.6" />
          {/* feature/auth-refactor */}
          <path d={`M ${positions["C2"]} 40 Q ${positions["C2"]+10} 80 ${positions["C2"]+20} 80 L ${positions["C4"]-10} 80 Q ${positions["C4"]} 80 ${positions["C4"]} 40`}
            fill="none" stroke="#a371f7" strokeWidth="1.5" strokeOpacity="0.6" />
          {/* fix/token-expiry */}
          <path d={`M ${positions["C3"]} 40 Q ${positions["C3"]+10} 110 ${positions["C3"]+20} 110 L ${positions["C4"]-10} 110 Q ${positions["C4"]} 110 ${positions["C4"]} 40`}
            fill="none" stroke="#3fb950" strokeWidth="1.5" strokeOpacity="0.6" />

          {/* Commits on main */}
          {["C1", "C2", "C3", "C4", "C5"].map((c) => (
            <g key={c}>
              <circle cx={positions[c]} cy={40} r={5} fill="#0d1117" stroke="#388bfd" strokeWidth="1.5" />
              <text x={positions[c]} y={28} textAnchor="middle" fill="#484f58" fontSize="8" fontFamily="JetBrains Mono, monospace">{commitLabels[c]?.sha}</text>
            </g>
          ))}

          {/* Commits on feature branch */}
          {["C2", "C3", "C4"].map((c) => (
            <circle key={`f-${c}`} cx={positions[c]} cy={80} r={4} fill="#0d1117" stroke="#a371f7" strokeWidth="1.5" />
          ))}

          {/* Commits on fix branch */}
          {["C3", "C4"].map((c) => (
            <circle key={`fix-${c}`} cx={positions[c]} cy={110} r={4} fill="#0d1117" stroke="#3fb950" strokeWidth="1.5" />
          ))}

          {/* Branch labels */}
          <text x="22" y="36" fill="#388bfd" fontSize="9" fontFamily="JetBrains Mono, monospace">main</text>
          <text x={positions["C2"] + 25} y="83" fill="#a371f7" fontSize="9" fontFamily="JetBrains Mono, monospace">feature/auth-refactor</text>
          <text x={positions["C3"] + 25} y="113" fill="#3fb950" fontSize="9" fontFamily="JetBrains Mono, monospace">fix/token-expiry</text>
        </svg>
      </div>
    </div>
  );
}
