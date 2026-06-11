import { Bot, ExternalLink, ChevronRight } from "lucide-react";

const agentComments = [
  {
    agent: "Optimizer-7 (Agent)",
    time: "2m ago",
    avatar: "O7",
    color: "#388bfd",
    message: "Refactored AuthService to implement dependency injection pattern. Extracted TokenService for better separation of concerns. All 47 existing tests pass.",
    type: "analysis",
  },
  {
    agent: "Jane Taylor (You)",
    time: "5m ago",
    avatar: "JT",
    color: "#a371f7",
    message: "LGTM on the interface extraction. Can you also add rate limiting to the validateUser method? We've had issues with brute force attempts.",
    type: "human",
  },
  {
    agent: "SecurityAgent-3",
    time: "8m ago",
    avatar: "S3",
    color: "#f85149",
    message: "⚠ Detected hardcoded JWT_SECRET fallback in line 5. Recommend using environment validation at startup instead of runtime fallback.",
    type: "warning",
  },
  {
    agent: "Guillermo Ramirez (Auth)",
    time: "12m ago",
    avatar: "GR",
    color: "#3fb950",
    message: "Following the AuthConfig pattern. Make sure the TokenService is properly injected in the DI container — see bootstrap.ts line 42.",
    type: "comment",
  },
];

const guidance = [
  "Ensure PR, it is configured",
  "Review security policy for PRs in progress",
];

export function AgentIntentPanel() {
  return (
    <div className="flex flex-col rounded border border-border bg-card overflow-hidden h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={13} className="text-primary" />
          <span style={{ fontSize: "12px", fontWeight: 600 }} className="text-foreground">Agent Intent</span>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <ExternalLink size={11} />
        </button>
      </div>

      {/* Comments thread */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {agentComments.map((comment, i) => (
          <div key={i} className="flex gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ backgroundColor: comment.color + "25", border: `1px solid ${comment.color}40` }}
            >
              <span style={{ fontSize: "8px", fontWeight: 700, color: comment.color }}>{comment.avatar}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span style={{ fontSize: "11px", fontWeight: 600, color: comment.color }}>{comment.agent}</span>
                <span style={{ fontSize: "10px" }} className="text-muted-foreground">{comment.time}</span>
              </div>
              <div
                className="rounded p-2"
                style={{
                  fontSize: "11px",
                  lineHeight: "1.5",
                  color: "#c9d1d9",
                  backgroundColor: comment.type === "warning" ? "rgba(248,81,73,0.08)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${comment.type === "warning" ? "rgba(248,81,73,0.2)" : "rgba(48,54,61,0.8)"}`,
                }}
              >
                {comment.message}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Agent Guidance */}
      <div className="border-t border-border p-2 shrink-0">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }} className="text-muted-foreground">Agent Guidance</span>
        </div>
        {guidance.map((item, i) => (
          <div key={i} className="flex items-start gap-1.5 py-0.5 group cursor-pointer">
            <ChevronRight size={10} className="text-muted-foreground mt-0.5 group-hover:text-primary transition-colors shrink-0" />
            <span style={{ fontSize: "11px" }} className="text-muted-foreground group-hover:text-foreground transition-colors">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
