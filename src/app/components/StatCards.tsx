import { Bot, GitPullRequest, CheckCircle, GitMerge } from "lucide-react";

export interface StatCardItem {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}

const defaultStats: StatCardItem[] = [
  {
    label: "Active Agents",
    value: "8",
    sub: "running",
    icon: Bot,
    color: "#388bfd",
    bg: "rgba(56,139,253,0.1)",
    border: "rgba(56,139,253,0.25)",
  },
  {
    label: "Open Reviews",
    value: "4",
    sub: "pending",
    icon: GitPullRequest,
    color: "#d29922",
    bg: "rgba(210,153,34,0.1)",
    border: "rgba(210,153,34,0.25)",
  },
  {
    label: "Approved Requests",
    value: "3",
    sub: "charlie pending",
    icon: CheckCircle,
    color: "#3fb950",
    bg: "rgba(63,185,80,0.1)",
    border: "rgba(63,185,80,0.25)",
  },
  {
    label: "Merge Queue",
    value: "12",
    sub: "Alpha",
    icon: GitMerge,
    color: "#a371f7",
    bg: "rgba(163,113,247,0.1)",
    border: "rgba(163,113,247,0.25)",
  },
];

interface StatCardsProps {
  stats?: StatCardItem[];
}

export function StatCards({ stats = defaultStats }: StatCardsProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map(({ label, value, sub, icon: Icon, color, bg, border }) => (
        <div
          key={label}
          className="rounded border p-3 flex items-start gap-3"
          style={{ backgroundColor: bg, borderColor: border }}
        >
          <div
            className="w-8 h-8 rounded flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon size={15} style={{ color }} />
          </div>
          <div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "22px",
                fontWeight: 700,
                color,
                lineHeight: 1,
              }}
            >
              {value}
            </div>
            <div className="text-muted-foreground mt-0.5" style={{ fontSize: "11px" }}>
              {label}
            </div>
            <div style={{ fontSize: "10px", color: color + "aa" }} className="mt-0.5">
              {sub}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
