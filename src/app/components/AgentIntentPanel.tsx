import { useState } from "react";
import { Bot, ExternalLink, ChevronRight } from "lucide-react";

interface Message {
  role: "agent" | "human";
  at: string;
  body: string;
}

interface AgentIntentPanelProps {
  comments: Message[];
  guidance?: string[];
  onAddComment?: (body: string) => void;
}

const DEFAULT_GUIDANCE = [
  "Ensure PR tests pass before merging",
  "Review security warnings highlighted by agents",
];

export function AgentIntentPanel({ comments, guidance = DEFAULT_GUIDANCE, onAddComment }: AgentIntentPanelProps) {
  const [replyText, setReplyText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    if (onAddComment) {
      onAddComment(replyText);
      setReplyText("");
    }
  };

  // Helper to format date string to relative time
  const formatTime = (at: string) => {
    const diffMs = new Date().getTime() - new Date(at).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(at).toLocaleDateString();
  };

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
        {comments.map((comment, i) => {
          const isAgent = comment.role === "agent";
          const color = isAgent ? "#388bfd" : "#a371f7";
          const isWarning = comment.body.includes("⚠") || comment.body.toLowerCase().includes("warning");

          return (
            <div key={i} className="flex gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: color + "25", border: `1px solid ${color}40` }}
              >
                <span style={{ fontSize: "8px", fontWeight: 700, color }}>
                  {isAgent ? "AG" : "HR"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span style={{ fontSize: "11px", fontWeight: 600, color }}>
                    {isAgent ? "AIVCS Agent" : "Human Reviewer"}
                  </span>
                  <span style={{ fontSize: "10px" }} className="text-muted-foreground">
                    {formatTime(comment.at)}
                  </span>
                </div>
                <div
                  className="rounded p-2"
                  style={{
                    fontSize: "11px",
                    lineHeight: "1.5",
                    color: "#c9d1d9",
                    backgroundColor: isWarning ? "rgba(248,81,73,0.08)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isWarning ? "rgba(248,81,73,0.2)" : "rgba(48,54,61,0.8)"}`,
                  }}
                >
                  {comment.body}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply Composer */}
      {onAddComment && (
        <form onSubmit={handleSubmit} className="border-t border-border p-2 shrink-0 flex gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Reply as human..."
            className="flex-1 px-2.5 py-1 rounded border border-border bg-background text-foreground text-[11px] outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="px-3 py-1 rounded bg-primary text-primary-foreground font-semibold hover:bg-primary/95 transition-colors text-[11px]"
          >
            Reply
          </button>
        </form>
      )}

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
