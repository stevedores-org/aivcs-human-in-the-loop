import {
  LayoutDashboard,
  GitBranch,
  Bot,
  GitPullRequest,
  GitMerge,
  CheckSquare,
  ClipboardList,
  Settings,
  Users,
  ChevronDown,
  Cpu,
  Loader2,
} from "lucide-react";
import type { Branch } from "../../lib/api/types";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: GitBranch, label: "Repositories" },
  { icon: Bot, label: "Agents" },
  { icon: GitBranch, label: "Branches" },
  { icon: GitPullRequest, label: "Pull Requests", badge: "3" },
  { icon: CheckSquare, label: "Reviews" },
  { icon: GitMerge, label: "Approvals", badge: "2" },
  { icon: ClipboardList, label: "Audit Trail" },
  { icon: Settings, label: "Settings" },
];

interface SidebarProps {
  branches: Branch[] | null;
  activeBranchName?: string;
  onSelectBranch?: (name: string) => void;
  isLoading?: boolean;
  error?: Error | null;
}

export function Sidebar({
  branches,
  activeBranchName,
  onSelectBranch,
  isLoading,
  error,
}: SidebarProps) {
  const activeBranches = branches?.filter((b) => b.status === "active") ?? [];

  return (
    <aside className="w-[200px] shrink-0 flex flex-col border-r border-border bg-sidebar h-full overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <div className="w-7 h-7 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Cpu size={14} className="text-primary" />
        </div>
        <span
          className="text-foreground"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          AIVCS
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2">
        {navItems.map(({ icon: Icon, label, active, badge }) => (
          <button
            key={label}
            className={`w-full flex items-center gap-2.5 px-4 py-1.5 text-left transition-colors ${
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            }`}
            style={{ fontSize: "12px" }}
          >
            <Icon size={14} className={active ? "text-primary" : ""} />
            <span className="flex-1">{label}</span>
            {badge && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px] bg-primary/20 text-primary"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {badge}
              </span>
            )}
          </button>
        ))}

        {/* Human-in-the-loop section */}
        <div className="mt-4 px-4">
          <div
            className="flex items-center gap-1 text-muted-foreground mb-1"
            style={{
              fontSize: "10px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <Users size={10} />
            <span>Human-in-the-loop</span>
          </div>

          {isLoading && (
            <div className="flex items-center gap-1.5 py-1 pl-2 text-muted-foreground">
              <Loader2 size={10} className="animate-spin" />
              <span style={{ fontSize: "10px" }}>Loading...</span>
            </div>
          )}

          {error && (
            <div className="py-1 pl-2 text-red-400" style={{ fontSize: "10px" }}>
              Error loading tasks
            </div>
          )}

          {!isLoading && !error && activeBranches.length === 0 && (
            <div className="py-1 pl-2 text-muted-foreground" style={{ fontSize: "11px" }}>
              No active tasks
            </div>
          )}

          {!isLoading &&
            !error &&
            activeBranches.map((b) => {
              const isSelected = activeBranchName === b.name;
              return (
                <div
                  key={b.id}
                  onClick={() => onSelectBranch?.(b.name)}
                  className={`flex items-center gap-2 py-1 pl-2 rounded cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/30"
                  }`}
                  style={{ fontSize: "11px" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="truncate">{b.name}</span>
                </div>
              );
            })}
        </div>

        {/* Agent service entry */}
        <div className="mt-3 mx-3 rounded border border-border bg-secondary p-2">
          <div
            className="flex items-center justify-between text-muted-foreground"
            style={{ fontSize: "10px" }}
          >
            <span>ai/checkout/service</span>
            <ChevronDown size={10} />
          </div>
          <div className="mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span style={{ fontSize: "10px", color: "#3fb950" }}>active</span>
          </div>
        </div>
      </nav>
    </aside>
  );
}
