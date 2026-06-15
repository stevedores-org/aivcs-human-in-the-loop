import { useState } from "react";
import {
  GitPullRequest,
  ChevronDown,
  GitMerge,
  Flag,
  XCircle,
  Bot,
  Loader2,
  FileCode,
} from "lucide-react";
import type { PullRequest, PullRequestDiff } from "../../lib/api/types";
import { toast } from "sonner";

interface PRDiffPanelProps {
  pullRequest: PullRequest | null;
  diff: PullRequestDiff | null;
  isLoading: boolean;
  error: Error | null;
}

interface DiffLine {
  type: "context" | "added" | "removed" | "header";
  lineOld: string;
  lineNew: string;
  content: string;
}

// Parses unified diff patches into structured lines for display.
function parsePatch(patch: string): DiffLine[] {
  if (!patch) return [];
  const lines = patch.split("\n");
  const result: DiffLine[] = [];
  let lineOld = 1;
  let lineNew = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip empty trailing split
    if (i === lines.length - 1 && line === "") continue;

    if (line.startsWith("@@")) {
      const match = line.match(/^@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/);
      if (match) {
        lineOld = Number.parseInt(match[1], 10);
        lineNew = Number.parseInt(match[2], 10);
      }
      result.push({
        type: "header",
        lineOld: "...",
        lineNew: "...",
        content: line,
      });
    } else if (line.startsWith("+")) {
      result.push({
        type: "added",
        lineOld: "",
        lineNew: String(lineNew++),
        content: line.slice(1),
      });
    } else if (line.startsWith("-")) {
      result.push({
        type: "removed",
        lineOld: String(lineOld++),
        lineNew: "",
        content: line.slice(1),
      });
    } else {
      const content = line.startsWith(" ") ? line.slice(1) : line;
      result.push({
        type: "context",
        lineOld: String(lineOld++),
        lineNew: String(lineNew++),
        content,
      });
    }
  }
  return result;
}

export function PRDiffPanel({
  pullRequest,
  diff,
  isLoading,
  error,
}: PRDiffPanelProps) {
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);

  const files = diff?.files ?? [];
  const activeFile = files[selectedFileIdx];
  const diffLines = activeFile ? parsePatch(activeFile.patch) : [];

  const handleAction = (actionName: string) => {
    toast.success(`Action Executed: ${actionName} for PR #${pullRequest?.number ?? ""}`, {
      description: `Successfully triggered ${actionName.toLowerCase()} flow.`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col rounded border border-border bg-card overflow-hidden h-full items-center justify-center p-6 min-h-60">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <span className="text-sm text-muted-foreground">Loading pull request diff...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col rounded border border-border bg-card overflow-hidden h-full items-center justify-center p-6 min-h-60 text-center">
        <XCircle className="h-8 w-8 text-red-500 mb-2" />
        <h3 className="text-sm font-semibold text-foreground">Failed to load diff</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">{error.message}</p>
      </div>
    );
  }

  if (!pullRequest) {
    return (
      <div className="flex flex-col rounded border border-border bg-card overflow-hidden h-full items-center justify-center p-6 min-h-60 text-center">
        <FileCode className="h-8 w-8 text-muted-foreground mb-2" />
        <h3 className="text-sm font-semibold text-foreground">No Pull Request Selected</h3>
        <p className="text-xs text-muted-foreground mt-1">Please select an active PR to view diffs.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded border border-border bg-card overflow-hidden h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border flex items-start justify-between gap-2 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <GitPullRequest size={13} className="text-green-400 shrink-0" />
            <span style={{ fontSize: "12px", fontWeight: 600 }} className="text-foreground">
              Full Request #{pullRequest.number}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-400/10 text-green-400 border border-green-400/20 capitalize">
              {pullRequest.status}
            </span>
          </div>
          <div className="text-muted-foreground mt-0.5 truncate max-w-md sm:max-w-lg" style={{ fontSize: "11px" }}>
            {pullRequest.title}
          </div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground shrink-0" style={{ fontSize: "11px" }}>
          <Bot size={11} />
          <span>Agent: Optimizer-7</span>
          <ChevronDown size={11} />
        </div>
      </div>

      {/* File path selector / bar */}
      {files.length > 0 ? (
        <div className="px-3 py-1.5 border-b border-border bg-secondary flex items-center justify-between shrink-0">
          {files.length > 1 ? (
            <div className="relative inline-block text-left">
              <select
                value={selectedFileIdx}
                onChange={(e) => setSelectedFileIdx(Number(e.target.value))}
                className="bg-background text-foreground border border-border rounded px-2 py-0.5 pr-6 outline-none cursor-pointer text-[10px] font-mono appearance-none"
              >
                {files.map((file, idx) => (
                  <option key={file.path} value={idx}>
                    {file.path}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={10}
                className="absolute right-2 top-1.5 text-muted-foreground pointer-events-none"
              />
            </div>
          ) : (
            <div
              className="flex items-center gap-1"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px" }}
            >
              <span className="text-muted-foreground">
                {activeFile.path.substring(0, activeFile.path.lastIndexOf("/") + 1)}
              </span>
              <span className="text-foreground">
                {activeFile.path.substring(activeFile.path.lastIndexOf("/") + 1)}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2" style={{ fontSize: "10px" }}>
            <span className="text-green-400">+{activeFile?.additions ?? 0}</span>
            <span className="text-red-400">−{activeFile?.deletions ?? 0}</span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {selectedFileIdx + 1}/{files.length}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-3 py-1.5 border-b border-border bg-secondary text-muted-foreground text-center text-[11px] shrink-0">
          No files changed in this pull request.
        </div>
      )}

      {/* Diff Code Area */}
      <div className="flex-1 overflow-y-auto" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px" }}>
        {diffLines.length > 0 ? (
          diffLines.map((line, i) => (
            <div
              key={`${i}-${line.lineOld}-${line.lineNew}`}
              className={`flex items-start ${
                line.type === "removed"
                  ? "bg-red-500/10 border-l-2 border-red-500/60"
                  : line.type === "added"
                  ? "bg-green-500/10 border-l-2 border-green-500/60"
                  : line.type === "header"
                  ? "bg-blue-500/5 text-[#58a6ff] border-l-2 border-[#58a6ff]/30 font-semibold"
                  : "border-l-2 border-transparent"
              }`}
            >
              <span className="select-none w-8 text-right pr-2 py-0.5 shrink-0" style={{ color: "#484f58" }}>
                {line.lineOld}
              </span>
              <span className="select-none w-8 text-right pr-3 py-0.5 shrink-0" style={{ color: "#484f58" }}>
                {line.lineNew}
              </span>
              <span
                className="select-none w-3 py-0.5 shrink-0"
                style={{
                  color:
                    line.type === "removed"
                      ? "#f85149"
                      : line.type === "added"
                      ? "#3fb950"
                      : "transparent",
                }}
              >
                {line.type === "removed" ? "−" : line.type === "added" ? "+" : " "}
              </span>
              <span
                className="py-0.5 whitespace-pre leading-relaxed flex-1"
                style={{
                  color:
                    line.type === "removed"
                      ? "#ffa198"
                      : line.type === "added"
                      ? "#7ee787"
                      : line.type === "header"
                      ? "#58a6ff"
                      : "#c9d1d9",
                }}
              >
                {line.content || " "}
              </span>
            </div>
          ))
        ) : (
          <div className="text-muted-foreground p-4 text-center">
            {activeFile ? "Empty file patch" : "No diff preview available"}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-3 py-2 border-t border-border flex items-center gap-2 shrink-0 flex-wrap">
        <button
          onClick={() => handleAction("Request Changes")}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
          style={{ fontSize: "11px" }}
        >
          <XCircle size={11} />
          Request Changes
        </button>
        <button
          onClick={() => handleAction("Approve")}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors cursor-pointer"
          style={{ fontSize: "11px" }}
        >
          <GitMerge size={11} />
          Approve
        </button>
        <button
          onClick={() => handleAction("Merge")}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
          style={{ fontSize: "11px" }}
        >
          <GitMerge size={11} />
          Merge
        </button>
        <button
          onClick={() => handleAction("Flag")}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer"
          style={{ fontSize: "11px" }}
        >
          <Flag size={11} />
          Flag for Review
        </button>
      </div>
    </div>
  );
}
