import { CheckCircle, XCircle, Clock, Activity as ActivityIcon } from "lucide-react";

interface CiCheck {
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion: "success" | "failure" | "neutral" | "cancelled" | "timed_out" | "action_required" | "skipped" | null;
  url: string;
}

interface ActivityItem {
  id: string;
  kind: string;
  at: string;
  actor: string;
  subject: string;
  summary: string;
}

interface CIChecksProps {
  checks: CiCheck[];
  activity: ActivityItem[];
}

export function CIChecks({ checks, activity }: CIChecksProps) {
  const passedCount = checks.filter((c) => c.status === "completed" && c.conclusion === "success").length;

  const getStatusIcon = (check: CiCheck) => {
    if (check.status === "completed") {
      if (check.conclusion === "success") {
        return <CheckCircle size={12} className="text-green-400 shrink-0" />;
      } else {
        return <XCircle size={12} className="text-red-400 shrink-0" />;
      }
    }
    return <Clock size={12} className="text-amber-400 shrink-0" />;
  };

  // Helper to format ISO timestamp to time relative string
  const formatTime = (isoString: string) => {
    try {
      const diffMs = new Date().getTime() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return new Date(isoString).toLocaleDateString();
    } catch {
      return "—";
    }
  };

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      {/* CI Checks */}
      <div className="flex flex-col rounded border border-border bg-card overflow-hidden flex-1 min-h-0">
        <div className="px-3 py-2 border-b border-border flex items-center gap-2 shrink-0">
          <ActivityIcon size={12} className="text-muted-foreground" />
          <span style={{ fontSize: "11px", fontWeight: 600 }} className="text-foreground">CI Checks</span>
          <span className="ml-auto text-muted-foreground" style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace" }}>
            {passedCount}/{checks.length} passed
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {checks.map((check) => (
            <div key={check.name} className="flex items-center gap-2 py-0.5">
              {getStatusIcon(check)}
              <span style={{ fontSize: "11px" }} className="flex-1 text-foreground">
                {check.name}
              </span>
              <a
                href={check.url}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: "9px", fontFamily: "'JetBrains Mono', monospace" }}
                className="text-primary hover:underline shrink-0"
              >
                details
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="flex flex-col rounded border border-border bg-card overflow-hidden flex-1 min-h-0">
        <div className="px-3 py-2 border-b border-border flex items-center gap-2 shrink-0">
          <Clock size={12} className="text-muted-foreground" />
          <span style={{ fontSize: "11px", fontWeight: 600 }} className="text-foreground">Recent Activity</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {activity.slice(0, 5).map((item) => {
            const avatar = item.actor.substring(0, 2).toUpperCase();
            return (
              <div key={item.id} className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-primary/10 border border-primary/20"
                >
                  <span style={{ fontSize: "7px", fontWeight: 700, color: "#388bfd" }}>{avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span style={{ fontSize: "11px" }} className="text-foreground">{item.actor} </span>
                  <span style={{ fontSize: "11px" }} className="text-muted-foreground">{item.summary}</span>
                </div>
                <span style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace" }} className="text-muted-foreground shrink-0">
                  {formatTime(item.at)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
