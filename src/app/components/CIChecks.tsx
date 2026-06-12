import { CheckCircle, XCircle, Clock, Activity } from "lucide-react";

const checks = [
  { name: "Unit Tests", status: "pass", duration: "1m 23s" },
  { name: "Integration Tests", status: "pass", duration: "3m 47s" },
  { name: "Security Scan", status: "pass", duration: "0m 52s" },
  { name: "Policy Check", status: "pass", duration: "0m 15s" },
  { name: "Build (prod)", status: "fail", duration: "2m 11s" },
  { name: "Deploy Preview", status: "pending", duration: "—" },
];

const recentActivity = [
  { user: "Jane Taylor", action: "approved #381", time: "1m ago", avatar: "JT", color: "#a371f7" },
  { user: "Optimizer-7", action: "opened PR #382", time: "4m ago", avatar: "O7", color: "#388bfd" },
  { user: "SecurityAgent-3", action: "flagged commit d4e5f", time: "8m ago", avatar: "S3", color: "#f85149" },
  { user: "Guillermo R.", action: "merged #376", time: "12m ago", avatar: "GR", color: "#3fb950" },
];

export function CIChecks() {
  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      {/* CI Checks */}
      <div className="flex flex-col rounded border border-border bg-card overflow-hidden flex-1 min-h-0">
        <div className="px-3 py-2 border-b border-border flex items-center gap-2 shrink-0">
          <Activity size={12} className="text-muted-foreground" />
          <span style={{ fontSize: "11px", fontWeight: 600 }} className="text-foreground">CI Checks</span>
          <span className="ml-auto text-muted-foreground" style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace" }}>5/6 passed</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {checks.map((check) => (
            <div key={check.name} className="flex items-center gap-2 py-0.5">
              {check.status === "pass" ? (
                <CheckCircle size={12} className="text-green-400 shrink-0" />
              ) : check.status === "fail" ? (
                <XCircle size={12} className="text-red-400 shrink-0" />
              ) : (
                <Clock size={12} className="text-amber-400 shrink-0" />
              )}
              <span style={{ fontSize: "11px" }} className="flex-1 text-foreground">{check.name}</span>
              <span style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace" }} className="text-muted-foreground">{check.duration}</span>
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
          {recentActivity.map((item) => (
            <div key={`${item.user}-${item.action}-${item.time}`} className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: item.color + "25", border: `1px solid ${item.color}40` }}
              >
                <span style={{ fontSize: "7px", fontWeight: 700, color: item.color }}>{item.avatar}</span>
              </div>
              <div className="flex-1 min-w-0">
                <span style={{ fontSize: "11px" }} className="text-foreground">{item.user} </span>
                <span style={{ fontSize: "11px" }} className="text-muted-foreground">{item.action}</span>
              </div>
              <span style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace" }} className="text-muted-foreground shrink-0">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
