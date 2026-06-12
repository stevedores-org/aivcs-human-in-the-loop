import { GitPullRequest, ChevronDown, GitMerge, Flag, XCircle, Bot } from "lucide-react";

interface PullRequest {
  id: string;
  number: number;
  title: string;
  base: string;
  head: string;
  status: string;
  agent_intent: string;
  ci_summary: { total: number; succeeded: number; failed: number; pending: number };
}

interface DiffFile {
  path: string;
  additions: number;
  deletions: number;
  patch: string;
}

interface PRDiffPanelProps {
  pr: PullRequest;
  diff: { files: DiffFile[] };
}

export function PRDiffPanel({ pr, diff }: PRDiffPanelProps) {
  // Parse patch text to lines for visual diffing
  const parsePatch = (patch: string) => {
    const lines = patch.split("\n");
    let lineOld = 1;
    let lineNew = 1;

    return lines.map((line) => {
      if (line.startsWith("@@")) {
        const match = line.match(/@@\s+-(\d+),?\d*\s+\+(\d+),?\d*\s+@@/);
        if (match) {
          lineOld = parseInt(match[1], 10);
          lineNew = parseInt(match[2], 10);
        }
        return { type: "header", lineOld: "", lineNew: "", content: line };
      } else if (line.startsWith("+")) {
        const content = line.substring(1);
        const res = { type: "added", lineOld: "", lineNew: lineNew.toString(), content };
        lineNew++;
        return res;
      } else if (line.startsWith("-")) {
        const content = line.substring(1);
        const res = { type: "removed", lineOld: lineOld.toString(), lineNew: "", content };
        lineOld++;
        return res;
      } else {
        const content = line.startsWith(" ") ? line.substring(1) : line;
        const res = { type: "context", lineOld: lineOld.toString(), lineNew: lineNew.toString(), content };
        lineOld++;
        lineNew++;
        return res;
      }
    });
  };

  const file = diff.files[0] || { path: "unknown", additions: 0, deletions: 0, patch: "" };
  const diffLines = parsePatch(file.patch);

  return (
    <div className="flex flex-col rounded border border-border bg-card overflow-hidden h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border flex items-start justify-between gap-2 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <GitPullRequest size={13} className="text-green-400 shrink-0" />
            <span style={{ fontSize: "12px", fontWeight: 600 }} className="text-foreground">Full Request #{pr.number}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-400/10 text-green-400 border border-green-400/20 capitalize">
              {pr.status}
            </span>
          </div>
          <div className="text-muted-foreground mt-0.5" style={{ fontSize: "11px" }}>{pr.title}</div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground shrink-0" style={{ fontSize: "11px" }}>
          <Bot size={11} />
          <span>Agent: Optimizer-7</span>
          <ChevronDown size={11} />
        </div>
      </div>

      {/* File path bar */}
      <div className="px-3 py-1.5 border-b border-border bg-secondary flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px" }}>
          <span className="text-muted-foreground">{file.path.substring(0, file.path.lastIndexOf("/") + 1)}</span>
          <span className="text-foreground">{file.path.substring(file.path.lastIndexOf("/") + 1)}</span>
        </div>
        <div className="flex items-center gap-2" style={{ fontSize: "10px" }}>
          <span className="text-green-400">+{file.additions}</span>
          <span className="text-red-400">−{file.deletions}</span>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>1/1 · 1/3</span>
          </div>
        </div>
      </div>

      {/* Diff */}
      <div className="flex-1 overflow-y-auto" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px" }}>
        {diffLines.map((line, i) => (
          <div
            key={i}
            className={`flex items-start ${
              line.type === "removed"
                ? "bg-red-500/10 border-l-2 border-red-500/60"
                : line.type === "added"
                ? "bg-green-500/10 border-l-2 border-green-500/60"
                : line.type === "header"
                ? "bg-secondary/40 text-muted-foreground"
                : "border-l-2 border-transparent"
            }`}
          >
            <span className="select-none w-8 text-right pr-2 py-0.5 shrink-0" style={{ color: "#484f58" }}>
              {line.lineOld}
            </span>
            <span className="select-none w-8 text-right pr-3 py-0.5 shrink-0" style={{ color: "#484f58" }}>
              {line.lineNew}
            </span>
            <span className="select-none w-3 py-0.5 shrink-0" style={{ color: line.type === "removed" ? "#f85149" : line.type === "added" ? "#3fb950" : "transparent" }}>
              {line.type === "removed" ? "−" : line.type === "added" ? "+" : " "}
            </span>
            <span
              className="py-0.5 whitespace-pre leading-relaxed flex-1"
              style={{
                color: line.type === "removed" ? "#ffa198" : line.type === "added" ? "#7ee787" : line.type === "header" ? "#8b949e" : "#c9d1d9",
              }}
            >
              {line.content || " "}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="px-3 py-2 border-t border-border flex items-center gap-2 shrink-0 flex-wrap">
        <button className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" style={{ fontSize: "11px" }}>
          <XCircle size={11} />
          Request Changes
        </button>
        <button className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors" style={{ fontSize: "11px" }}>
          <GitMerge size={11} />
          Approve
        </button>
        <button className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors" style={{ fontSize: "11px" }}>
          <GitMerge size={11} />
          Merge
        </button>
        <button className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors" style={{ fontSize: "11px" }}>
          <Flag size={11} />
          Flag for Review
        </button>
      </div>
    </div>
  );
}
