import { Shield } from "lucide-react";

interface ActivityItem {
  id: string;
  kind: string;
  at: string;
  actor: string;
  subject: string;
  summary: string;
}

interface AuditTrailProps {
  items: ActivityItem[];
}

const statusColor: Record<string, string> = {
  "ci.passed": "#3fb950",
  "pr.merged": "#3fb950",
  "ci.failed": "#f85149",
  "pr.commented": "#d29922",
  "pr.opened": "#388bfd",
  "branch.opened": "#8b949e",
};

export function AuditTrail({ items }: AuditTrailProps) {
  // Helper to format ISO timestamp to time (HH:MM)
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    } catch {
      return "00:00";
    }
  };

  return (
    <div className="flex flex-col rounded border border-border bg-card overflow-hidden h-full">
      <div className="px-3 py-2 border-b border-border flex items-center gap-2 shrink-0">
        <Shield size={12} className="text-muted-foreground" />
        <span style={{ fontSize: "11px", fontWeight: 600 }} className="text-foreground">Audit Trail / Timeline</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="relative">
          <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />
          <div className="space-y-2">
            {items.map((evt) => {
              const color = statusColor[evt.kind] || "#8b949e";
              return (
                <div key={evt.id} className="flex items-start gap-2 pl-1 group">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 mt-1 z-10 border border-card"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "#8b949e" }}>
                        {formatTime(evt.at)}
                      </span>
                      <span style={{ fontSize: "11px", color: "#e6edf3" }}>{evt.actor}</span>
                      <span style={{ fontSize: "11px", color: "#8b949e" }}>{evt.summary}</span>
                      <span style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: color }}>
                        {evt.subject}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
