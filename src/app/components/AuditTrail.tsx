import { Shield } from "lucide-react";

const auditEvents = [
  { time: "14:23", actor: "Optimizer-7", action: "Pushed commit", target: "a3f891b", status: "success" },
  { time: "14:20", actor: "SecurityAgent-3", action: "Security scan", target: "passed", status: "success" },
  { time: "14:18", actor: "Jane Taylor", action: "Requested review", target: "#379", status: "info" },
  { time: "14:15", actor: "CI/CD Pipeline", action: "Build failed", target: "step 3/7", status: "error" },
  { time: "14:12", actor: "Optimizer-7", action: "Opened PR", target: "#379", status: "success" },
  { time: "14:08", actor: "CI/CD Pipeline", action: "Tests passed", target: "47/47", status: "success" },
  { time: "14:05", actor: "PolicyAgent-1", action: "Approved policy", target: "auth-rules", status: "success" },
];

const statusColor: Record<string, string> = {
  success: "#3fb950",
  error: "#f85149",
  warning: "#d29922",
  info: "#388bfd",
};

export function AuditTrail() {
  return (
    <div className="flex flex-col rounded border border-border bg-card overflow-hidden h-full">
      <div className="px-3 py-2 border-b border-border flex items-center gap-2 shrink-0">
        <Shield size={12} className="text-muted-foreground" />
        <span style={{ fontSize: "11px", fontWeight: 600 }} className="text-foreground">Audit Trail / Timeline</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="relative">
          <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />
          <div className="space-y-1">
            {auditEvents.map((evt, i) => (
              <div key={i} className="flex items-start gap-2 pl-1 group">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0 mt-1 z-10 border border-card"
                  style={{ backgroundColor: statusColor[evt.status] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "#8b949e" }}>{evt.time}</span>
                    <span style={{ fontSize: "11px", color: "#e6edf3" }}>{evt.actor}</span>
                    <span style={{ fontSize: "11px", color: "#8b949e" }}>{evt.action}</span>
                    <span style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: statusColor[evt.status] }}>{evt.target}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
