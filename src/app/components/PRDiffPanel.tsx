import { GitPullRequest, ChevronDown, GitMerge, Flag, XCircle, Bot } from "lucide-react";

const diffLines = [
  { type: "context", lineOld: "1", lineNew: "1", content: "import jwt from 'jsonwebtoken';" },
  { type: "context", lineOld: "2", lineNew: "2", content: "import bcrypt from 'bcryptjs';" },
  { type: "context", lineOld: "3", lineNew: "3", content: "" },
  { type: "removed", lineOld: "4", lineNew: "", content: "export class AuthService {" },
  { type: "removed", lineOld: "5", lineNew: "", content: "  private secretKey: string = process.env.JWT_SECRET;" },
  { type: "removed", lineOld: "6", lineNew: "", content: "  private tokenExpiry: string = '24h';" },
  { type: "added", lineOld: "", lineNew: "4", content: "export class AuthService implements IAuthService {" },
  { type: "added", lineOld: "", lineNew: "5", content: "  private readonly config: AuthConfig;" },
  { type: "added", lineOld: "", lineNew: "6", content: "  private readonly tokenService: TokenService;" },
  { type: "context", lineOld: "7", lineNew: "7", content: "" },
  { type: "removed", lineOld: "8", lineNew: "", content: "  async validateUser(username: string, password: string) {" },
  { type: "removed", lineOld: "9", lineNew: "", content: "    const user = await db.users.findOne({ username });" },
  { type: "removed", lineOld: "10", lineNew: "", content: "    if (!user) return null;" },
  { type: "added", lineOld: "", lineNew: "8", content: "  async validateUser(credentials: UserCredentials): Promise<AuthResult> {" },
  { type: "added", lineOld: "", lineNew: "9", content: "    const user = await this.userRepository.findByUsername(" },
  { type: "added", lineOld: "", lineNew: "10", content: "      credentials.username," },
  { type: "added", lineOld: "", lineNew: "11", content: "    );" },
  { type: "context", lineOld: "11", lineNew: "12", content: "    const isValid = await bcrypt.compare(" },
  { type: "context", lineOld: "12", lineNew: "13", content: "      password, user.passwordHash" },
  { type: "context", lineOld: "13", lineNew: "14", content: "    );" },
];

export function PRDiffPanel() {
  return (
    <div className="flex flex-col rounded border border-border bg-card overflow-hidden h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border flex items-start justify-between gap-2 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <GitPullRequest size={13} className="text-green-400 shrink-0" />
            <span style={{ fontSize: "12px", fontWeight: 600 }} className="text-foreground">Full Request #379</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-400/10 text-green-400 border border-green-400/20">Open</span>
          </div>
          <div className="text-muted-foreground mt-0.5" style={{ fontSize: "11px" }}>Refactor Authentication Service</div>
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
          <span className="text-muted-foreground">src/services/</span>
          <span className="text-foreground">AuthService.ts</span>
        </div>
        <div className="flex items-center gap-2" style={{ fontSize: "10px" }}>
          <span className="text-green-400">+14</span>
          <span className="text-red-400">−6</span>
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
            key={`${i}-${line.lineOld}-${line.lineNew}`}
            className={`flex items-start ${
              line.type === "removed"
                ? "bg-red-500/10 border-l-2 border-red-500/60"
                : line.type === "added"
                ? "bg-green-500/10 border-l-2 border-green-500/60"
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
                color: line.type === "removed" ? "#ffa198" : line.type === "added" ? "#7ee787" : "#c9d1d9",
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
