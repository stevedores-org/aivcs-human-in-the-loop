import { CheckCircle, XCircle, Clock, Activity as ActivityIcon, Loader2, AlertCircle } from "lucide-react";
import type { CiCheck, Activity } from "../../lib/api/types";

interface CIChecksProps {
  checks: CiCheck[] | null;
  isLoadingChecks: boolean;
  errorChecks: Error | null;
  activities: Activity[] | null;
  isLoadingActivities: boolean;
  errorActivities: Error | null;
}

const actorColor: Record<string, string> = {
  librarian: "#388bfd",
  codex: "#a371f7",
  dependabot: "#58a6ff",
  security: "#f85149",
  human: "#3fb950",
};

function resolveActorColorAndAvatar(actor: string) {
  const clean = actor.replace(/^(agent|human):/, "").toLowerCase();
  let avatar = "U";
  let color = "#8b949e";

  if (clean.includes("librarian")) {
    avatar = "L";
    color = actorColor.librarian;
  } else if (clean.includes("codex")) {
    avatar = "C";
    color = actorColor.codex;
  } else if (clean.includes("dependabot")) {
    avatar = "D";
    color = actorColor.dependabot;
  } else if (clean.includes("security")) {
    avatar = "S";
    color = actorColor.security;
  } else if (clean.includes("@") || clean.includes("jane") || clean.includes("human")) {
    avatar = "H";
    color = actorColor.human;
  }

  return { avatar, color };
}

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "1m ago";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  } catch {
    return "recent";
  }
}

export function CIChecks({
  checks,
  isLoadingChecks,
  errorChecks,
  activities,
  isLoadingActivities,
  errorActivities,
}: CIChecksProps) {
  const checkItems = checks ?? [];
  const recentActivities = activities?.slice(0, 4) ?? [];

  const passedChecksCount = checkItems.filter((c) => c.conclusion === "success").length;

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      {/* CI Checks */}
      <div className="flex flex-col rounded border border-border bg-card overflow-hidden flex-1 min-h-0">
        <div className="px-3 py-2 border-b border-border flex items-center gap-2 shrink-0">
          <ActivityIcon size={12} className="text-muted-foreground" />
          <span style={{ fontSize: "11px", fontWeight: 600 }} className="text-foreground">
            CI Checks
          </span>
          {!isLoadingChecks && !errorChecks && checkItems.length > 0 && (
            <span
              className="ml-auto text-muted-foreground"
              style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace" }}
            >
              {passedChecksCount}/{checkItems.length} passed
            </span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoadingChecks && (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={12} className="animate-spin text-primary" />
            </div>
          )}

          {errorChecks && (
            <div className="text-red-400 text-[10px] text-center py-2 flex items-center justify-center gap-1">
              <AlertCircle size={10} />
              <span>Failed to load checks</span>
            </div>
          )}

          {!isLoadingChecks && !errorChecks && checkItems.length === 0 && (
            <div className="text-muted-foreground text-[10px] text-center py-4">
              No checks reported.
            </div>
          )}

          {!isLoadingChecks &&
            !errorChecks &&
            checkItems.map((check) => (
              <div key={check.name} className="flex items-center gap-2 py-0.5">
                {check.status === "completed" ? (
                  check.conclusion === "success" ? (
                    <CheckCircle size={12} className="text-green-400 shrink-0" />
                  ) : (
                    <XCircle size={12} className="text-red-400 shrink-0" />
                  )
                ) : (
                  <Clock size={12} className="text-amber-400 shrink-0" />
                )}
                <span style={{ fontSize: "11px" }} className="flex-1 text-foreground truncate">
                  {check.name}
                </span>
                <span
                  style={{ fontSize: "9px", fontFamily: "'JetBrains Mono', monospace" }}
                  className="text-muted-foreground capitalize"
                >
                  {check.status === "completed"
                    ? check.conclusion ?? "completed"
                    : check.status.replace("_", " ")}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="flex flex-col rounded border border-border bg-card overflow-hidden flex-1 min-h-0">
        <div className="px-3 py-2 border-b border-border flex items-center gap-2 shrink-0">
          <Clock size={12} className="text-muted-foreground" />
          <span style={{ fontSize: "11px", fontWeight: 600 }} className="text-foreground">
            Recent Activity
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {isLoadingActivities && (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={12} className="animate-spin text-primary" />
            </div>
          )}

          {errorActivities && (
            <div className="text-red-400 text-[10px] text-center py-2 flex items-center justify-center gap-1">
              <AlertCircle size={10} />
              <span>Failed to load activity</span>
            </div>
          )}

          {!isLoadingActivities && !errorActivities && recentActivities.length === 0 && (
            <div className="text-muted-foreground text-[10px] text-center py-4">
              No recent activity.
            </div>
          )}

          {!isLoadingActivities &&
            !errorActivities &&
            recentActivities.map((item, i) => {
              const { avatar, color } = resolveActorColorAndAvatar(item.actor);
              return (
                <div key={item.id} className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: color + "15",
                      borderColor: color + "30",
                    }}
                  >
                    <span style={{ fontSize: "7px", fontWeight: 700, color }}>
                      {avatar}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span style={{ fontSize: "11px", color: "#e6edf3" }} className="font-medium truncate block sm:inline">
                      {item.actor.replace(/^(agent|human):/, "")}{" "}
                    </span>
                    <span style={{ fontSize: "11px" }} className="text-muted-foreground">
                      {item.summary.toLowerCase() === "pushed commit" ? "pushed a commit" : item.summary.toLowerCase()}
                    </span>
                  </div>
                  <span
                    style={{ fontSize: "9px", fontFamily: "'JetBrains Mono', monospace" }}
                    className="text-muted-foreground shrink-0"
                  >
                    {formatRelativeTime(item.at)}
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
