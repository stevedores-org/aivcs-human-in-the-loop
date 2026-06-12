import { Shield, Loader2, AlertCircle } from "lucide-react";
import type { Activity } from "../../lib/api/types";

interface AuditTrailProps {
  items: Activity[] | null;
  isLoading: boolean;
  error: Error | null;
}

const kindColor: Record<string, string> = {
  "ci.failed": "#f85149",     // Red
  "ci.passed": "#3fb950",     // Green
  "pr.merged": "#a371f7",     // Purple
  "pr.opened": "#388bfd",     // Blue
  "branch.opened": "#58a6ff",  // Light Blue
  "pr.commented": "#d29922",  // Orange/Yellow
};

// Helper to format ISO time to HH:MM format
function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "--:--";
  }
}

// Clean actor name display (e.g. human:email -> email)
function cleanActor(actor: string): string {
  return actor.replace(/^(agent|human):/, "");
}

export function AuditTrail({ items, isLoading, error }: AuditTrailProps) {
  const activities = items ?? [];

  return (
    <div className="flex flex-col rounded border border-border bg-card overflow-hidden h-full">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Shield size={12} className="text-muted-foreground" />
          <span style={{ fontSize: "11px", fontWeight: 600 }} className="text-foreground">
            Audit Trail / Timeline
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading && (
          <div className="flex items-center justify-center py-6 h-full">
            <Loader2 size={16} className="animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center gap-1.5 py-6 text-red-400 text-xs h-full text-center p-2">
            <AlertCircle size={14} />
            <span>Failed to load activity logs</span>
          </div>
        )}

        {!isLoading && !error && activities.length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No activity logs found.
          </div>
        )}

        {!isLoading && !error && activities.length > 0 && (
          <div className="relative">
            <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />
            <div className="space-y-1.5">
              {activities.slice(0, 15).map((evt) => {
                const color = kindColor[evt.kind] ?? "#8b949e";
                return (
                  <div key={evt.id} className="flex items-start gap-2 pl-1 group">
                    <div
                      className="w-2 h-2 rounded-full shrink-0 mt-1.5 z-10 border border-card"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          style={{
                            fontSize: "10px",
                            fontFamily: "'JetBrains Mono', monospace",
                            color: "#8b949e",
                          }}
                        >
                          {formatTime(evt.at)}
                        </span>
                        <span style={{ fontSize: "11px", color: "#e6edf3" }} className="font-medium">
                          {cleanActor(evt.actor)}
                        </span>
                        <span style={{ fontSize: "11px", color: "#8b949e" }}>
                          {evt.summary}
                        </span>
                        <span
                          style={{
                            fontSize: "10px",
                            fontFamily: "'JetBrains Mono', monospace",
                            color: color,
                          }}
                        >
                          {evt.subject}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
