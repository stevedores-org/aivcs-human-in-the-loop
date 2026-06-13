import { useState } from "react";
import { Bot, ExternalLink, ChevronRight, Loader2, Send } from "lucide-react";
import type { IntentThread, Message } from "../../lib/api/types";
import { toast } from "sonner";

interface AgentIntentPanelProps {
  intentThread: IntentThread | null;
  isLoading: boolean;
  error: Error | null;
  onAddComment: (body: string) => Promise<unknown>;
  isAddingComment: boolean;
}

const guidance = [
  "Ensure PR, it is configured",
  "Review security policy for PRs in progress",
];

// Helper to format timestamps nicely
function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "recent";
  }
}

// Helper to resolve comment metadata based on sender role and body content
function resolveMessageMeta(msg: Message) {
  if (msg.role === "human") {
    return {
      name: "Jane Taylor (You)",
      avatar: "JT",
      color: "#a371f7",
      type: "human",
    };
  }

  // Agent categorization
  const body = msg.body.toLowerCase();
  if (body.includes("security") || body.includes("warn") || body.includes("⚠")) {
    return {
      name: "SecurityAgent-3",
      avatar: "S3",
      color: "#f85149",
      type: "warning",
    };
  }
  if (body.includes("policy") || body.includes("approve")) {
    return {
      name: "PolicyAgent-1",
      avatar: "PA",
      color: "#d29922",
      type: "comment",
    };
  }
  if (body.includes("guillermo")) {
    return {
      name: "Guillermo Ramirez (Auth)",
      avatar: "GR",
      color: "#3fb950",
      type: "comment",
    };
  }
  return {
    name: "Optimizer-7 (Agent)",
    avatar: "O7",
    color: "#388bfd",
    type: "analysis",
  };
}

export function AgentIntentPanel({
  intentThread,
  isLoading,
  error,
  onAddComment,
  isAddingComment,
}: AgentIntentPanelProps) {
  const [commentBody, setCommentBody] = useState("");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim() || isAddingComment) return;

    try {
      await onAddComment(commentBody.trim());
      setCommentBody("");
      toast.success("Comment posted successfully", {
        description: "Your supervisor feedback was added to the intent thread.",
      });
    } catch (err) {
      toast.error("Failed to post comment", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  return (
    <div className="flex flex-col rounded border border-border bg-card overflow-hidden h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={13} className="text-primary" />
          <span style={{ fontSize: "12px", fontWeight: 600 }} className="text-foreground">
            Agent Intent
          </span>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <ExternalLink size={11} />
        </button>
      </div>

      {/* Comments thread */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-primary h-5 w-5" />
          </div>
        )}

        {error && (
          <div className="text-center py-4 text-xs text-red-400">
            Failed to load comments: {error.message}
          </div>
        )}

        {!isLoading && !error && (!intentThread || intentThread.thread.length === 0) && (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No intent log entries.
          </div>
        )}

        {!isLoading &&
          !error &&
          intentThread?.thread.map((comment, i) => {
            const meta = resolveMessageMeta(comment);
            return (
              <div key={i} className="flex gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    backgroundColor: meta.color + "25",
                    border: `1px solid ${meta.color}40`,
                  }}
                >
                  <span style={{ fontSize: "8px", fontWeight: 700, color: meta.color }}>
                    {meta.avatar}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span style={{ fontSize: "11px", fontWeight: 600, color: meta.color }}>
                      {meta.name}
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
                      backgroundColor:
                        meta.type === "warning"
                          ? "rgba(248,81,73,0.08)"
                          : "rgba(255,255,255,0.04)",
                      border: `1px solid ${
                        meta.type === "warning"
                          ? "rgba(248,81,73,0.2)"
                          : "rgba(48,54,61,0.8)"
                      }`,
                    }}
                  >
                    {comment.body}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Supervisor Reply Composer */}
      <form onSubmit={handleSend} className="border-t border-border p-2 shrink-0 bg-secondary/30">
        <div className="flex gap-1.5 items-end">
          <textarea
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="Reply as supervisor..."
            rows={2}
            className="flex-1 bg-background text-foreground placeholder:text-muted-foreground border border-border rounded px-2.5 py-1.5 text-[11px] outline-none resize-none focus:border-primary transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!commentBody.trim() || isAddingComment}
            className="px-2.5 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center shrink-0 cursor-pointer h-9 w-9"
          >
            {isAddingComment ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Send size={12} />
            )}
          </button>
        </div>
      </form>

      {/* Agent Guidance */}
      <div className="border-t border-border p-2 shrink-0 bg-secondary/50">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
            className="text-muted-foreground"
          >
            Agent Guidance
          </span>
        </div>
        {guidance.map((item, i) => (
          <div key={i} className="flex items-start gap-1.5 py-0.5 group cursor-pointer">
            <ChevronRight
              size={10}
              className="text-muted-foreground mt-0.5 group-hover:text-primary transition-colors shrink-0"
            />
            <span
              style={{ fontSize: "11px" }}
              className="text-muted-foreground group-hover:text-foreground transition-colors"
            >
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
