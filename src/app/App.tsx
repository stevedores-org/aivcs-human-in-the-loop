import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar, Tooltip as RTooltip } from "recharts"
import {
  LayoutDashboard, FolderOpen, Bot, GitBranch, GitPullRequest,
  Eye, ListChecks, Shield, Settings, Bell, ChevronDown, ExternalLink,
  Send, CheckCircle, XCircle, Clock, Search, Activity, GitMerge,
  Zap, ChevronRight, RefreshCw, Cpu, ArrowUpRight,
  Star, Package
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────
type NavItem = "dashboard"|"repos"|"agents"|"branches"|"pulls"|"reviews"|"approvals"|"audit"|"settings"
type CIStatus = "pass"|"fail"|"running"|"pending"
type AgentStatus = "running"|"idle"|"error"
type ActivityType = "push"|"approve"|"pr"|"merge"|"fail"|"branch"|"spawn"
type PRStatus = "open"|"merged"|"closed"

interface Message    { role:"agent"|"supervisor"; name:string; time:string; content:string }
interface CICheck    { name:string; status:CIStatus; duration:string }
interface Agent      { id:string; status:AgentStatus; branch:string; task:string; commits:number; uptime:string }
interface Repo       { name:string; lang:string; agents:number; branches:number; prs:number; lastActivity:string; stars:number }
interface Branch     { name:string; type:"main"|"feature"|"fix"; agent:string|null; ahead:number; ciStatus:CIStatus; lastCommit:string; protected:boolean }
interface PR         { num:number; title:string; agent:string; branch:string; status:PRStatus; ci:CIStatus; approvals:number; needed:number; age:string }
interface AuditEvent { time:string; action:string; agent:string; type:ActivityType }
interface DiffLine   { type:"file"|"hunk"|"context"|"added"|"removed"; content:string; lineOld?:number; lineNew?:number }

// ─── Mock Data ────────────────────────────────────────────────────────────────
const DIFF_LINES: DiffLine[] = [
  { type:"file",    content:"--- a/services/checkout_service.py" },
  { type:"file",    content:"+++ b/services/checkout_service.py" },
  { type:"hunk",    content:"@@ -42,8 +42,20 @@ class CheckoutService:" },
  { type:"context", content:'    """Handles cart checkout and payment validation."""', lineOld:42, lineNew:42 },
  { type:"context", content:"", lineOld:43, lineNew:43 },
  { type:"removed", content:"    def validate_token(self, token):", lineOld:44 },
  { type:"removed", content:"        return jwt.decode(token, self.secret, algorithms=['HS256'])", lineOld:45 },
  { type:"added",   content:"    def validate_token(self, token, expiry_buffer: int = 300):", lineNew:44 },
  { type:"added",   content:"        payload = jwt.decode(token, self.secret, algorithms=['HS256'])", lineNew:45 },
  { type:"added",   content:"        if payload['exp'] - time.time() < expiry_buffer:", lineNew:46 },
  { type:"added",   content:"            payload = self._refresh_token(payload, token)", lineNew:47 },
  { type:"added",   content:"        return payload", lineNew:48 },
  { type:"context", content:"", lineOld:46, lineNew:49 },
  { type:"added",   content:"    def _refresh_token(self, payload: dict, cart_id: str) -> dict:", lineNew:50 },
  { type:"added",   content:'        """Extend token validity by 1h near expiry. Logs to audit trail."""', lineNew:51 },
  { type:"added",   content:"        new_payload = {**payload, 'exp': int(time.time()) + 3600}", lineNew:52 },
  { type:"added",   content:"        self.audit.log('token_refreshed', subject=payload['sub'], cart_id=cart_id)", lineNew:53 },
  { type:"added",   content:"        return jwt.encode(new_payload, self.secret, algorithm='HS256')", lineNew:54 },
  { type:"context", content:"", lineOld:47, lineNew:55 },
  { type:"context", content:"    def process_checkout(self, cart_id: str, user_id: str) -> dict:", lineOld:48, lineNew:56 },
  { type:"context", content:"        auth = self.validate_token(request.headers.get('Authorization'))", lineOld:49, lineNew:57 },
]

const INIT_MESSAGES: Message[] = [
  { role:"agent", name:"agent-charlie", time:"9m ago",    content:"Branch fix/token-expiry created from main. Working on AIVCS-234: checkout auth failures near token expiry boundary." },
  { role:"agent", name:"agent-charlie", time:"4m ago",    content:"PR #47 ready for review. Changed validate_token to accept expiry_buffer (default 300s). _refresh_token logs audit with cart_id for full traceability." },
  { role:"supervisor", name:"Jane Taylor", time:"2m ago", content:"Good. The audit log with cart_id is exactly right. Add unit tests for both sides of the 5-minute boundary — before and at the threshold." },
  { role:"agent", name:"agent-charlie", time:"just now",  content:"Understood. Adding test_validate_token_near_expiry and test_validate_token_at_boundary to tests/test_checkout_service.py. Pushing next." },
]

const CI_CHECKS: CICheck[] = [
  { name:"test / unit",          status:"pass",    duration:"1m 12s" },
  { name:"test / integration",   status:"pass",    duration:"3m 40s" },
  { name:"lint / ruff",          status:"pass",    duration:"18s"    },
  { name:"security / bandit",    status:"fail",    duration:"22s"    },
  { name:"build / dockworker.ai",status:"running", duration:"…"      },
]

const AGENTS: Agent[] = [
  { id:"agent-alpha",   status:"running", branch:"feature/ai-checkout",   task:"Refactoring search index module",          commits:8,  uptime:"2h 14m" },
  { id:"agent-beta",    status:"running", branch:"feature/payments-v2",    task:"Adding Stripe webhook retry handler",      commits:3,  uptime:"45m"    },
  { id:"agent-charlie", status:"running", branch:"fix/token-expiry",        task:"Token refresh boundary implementation",    commits:4,  uptime:"1h 02m" },
  { id:"agent-delta",   status:"idle",    branch:"—",                       task:"Awaiting task assignment from scheduler",  commits:0,  uptime:"30m"    },
  { id:"agent-epsilon", status:"running", branch:"fix/rate-limiter",        task:"Tuning rate limit window parameters",      commits:12, uptime:"3h 05m" },
  { id:"agent-zeta",    status:"error",   branch:"feature/cache-layer",     task:"Blocked: missing Redis config secret",     commits:1,  uptime:"0m"     },
  { id:"agent-eta",     status:"running", branch:"feature/webhooks",        task:"Implementing exponential backoff retry",   commits:6,  uptime:"1h 30m" },
  { id:"agent-theta",   status:"running", branch:"feature/logging",         task:"Structured log format — OpenTelemetry",   commits:3,  uptime:"55m"    },
]

const SPARKLINES: Record<string, {v:number}[]> = {
  "agent-alpha":   [{v:3},{v:5},{v:4},{v:8},{v:6},{v:9},{v:7},{v:11},{v:9},{v:12}],
  "agent-beta":    [{v:1},{v:2},{v:3},{v:2},{v:4},{v:3},{v:2},{v:3},{v:4},{v:3}],
  "agent-charlie": [{v:2},{v:4},{v:3},{v:5},{v:4},{v:6},{v:5},{v:7},{v:6},{v:4}],
  "agent-delta":   [{v:0},{v:0},{v:1},{v:0},{v:0},{v:0},{v:1},{v:0},{v:0},{v:0}],
  "agent-epsilon": [{v:5},{v:8},{v:7},{v:10},{v:9},{v:12},{v:11},{v:13},{v:12},{v:14}],
  "agent-zeta":    [{v:2},{v:3},{v:1},{v:2},{v:0},{v:0},{v:0},{v:0},{v:0},{v:0}],
  "agent-eta":     [{v:3},{v:4},{v:5},{v:4},{v:6},{v:5},{v:7},{v:6},{v:5},{v:6}],
  "agent-theta":   [{v:1},{v:2},{v:3},{v:2},{v:3},{v:4},{v:3},{v:3},{v:4},{v:3}],
}

const REPOS: Repo[] = [
  { name:"aivcs-api",             lang:"Go",     agents:3, branches:8,  prs:12, lastActivity:"2m ago",  stars:47 },
  { name:"lornu-ai-data-fabric",  lang:"Rust",   agents:2, branches:5,  prs:4,  lastActivity:"8m ago",  stars:31 },
  { name:"checkout-service",      lang:"Python", agents:1, branches:3,  prs:2,  lastActivity:"1m ago",  stars:12 },
  { name:"auth-gateway",          lang:"Go",     agents:0, branches:2,  prs:1,  lastActivity:"1h ago",  stars:24 },
  { name:"notification-service",  lang:"TypeScript", agents:1, branches:4, prs:3, lastActivity:"15m ago", stars:8 },
  { name:"analytics-pipeline",    lang:"Python", agents:1, branches:2,  prs:1,  lastActivity:"32m ago", stars:19 },
]

const BRANCHES: Branch[] = [
  { name:"main",                type:"main",    agent:null,         ahead:0,  ciStatus:"pass",    lastCommit:"1h ago",  protected:true  },
  { name:"feature/ai-checkout", type:"feature", agent:"agent-alpha",   ahead:9,  ciStatus:"pass",    lastCommit:"2m ago",  protected:false },
  { name:"feature/payments-v2", type:"feature", agent:"agent-beta",    ahead:3,  ciStatus:"pass",    lastCommit:"45m ago", protected:false },
  { name:"fix/token-expiry",    type:"fix",     agent:"agent-charlie",  ahead:4,  ciStatus:"fail",    lastCommit:"4m ago",  protected:false },
  { name:"feature/search-refactor",type:"feature",agent:"agent-delta",  ahead:7,  ciStatus:"pass",    lastCommit:"30m ago", protected:false },
  { name:"fix/rate-limiter",    type:"fix",     agent:"agent-epsilon",  ahead:2,  ciStatus:"running", lastCommit:"10m ago", protected:false },
  { name:"feature/cache-layer", type:"feature", agent:"agent-zeta",     ahead:1,  ciStatus:"pending", lastCommit:"1h ago",  protected:false },
  { name:"feature/webhooks",    type:"feature", agent:"agent-eta",      ahead:5,  ciStatus:"pass",    lastCommit:"20m ago", protected:false },
  { name:"feature/logging",     type:"feature", agent:"agent-theta",    ahead:3,  ciStatus:"pass",    lastCommit:"55m ago", protected:false },
]

const PULL_REQUESTS: PR[] = [
  { num:47, title:"Fix token expiry boundary failures in checkout",    agent:"agent-charlie", branch:"fix/token-expiry",         status:"open",   ci:"fail",    approvals:0, needed:2, age:"1h"  },
  { num:46, title:"Refactor search index for vector embeddings",       agent:"agent-delta",   branch:"feature/search-refactor",  status:"open",   ci:"pass",    approvals:1, needed:2, age:"2h"  },
  { num:44, title:"Rate limiter: sliding window with Redis",           agent:"agent-epsilon", branch:"fix/rate-limiter",         status:"open",   ci:"running", approvals:0, needed:2, age:"30m" },
  { num:43, title:"Structured log format — OpenTelemetry traces",      agent:"agent-theta",   branch:"feature/logging",          status:"open",   ci:"pass",    approvals:2, needed:2, age:"55m" },
  { num:42, title:"Add Stripe webhook retry + idempotency key",        agent:"agent-beta",    branch:"feature/payments-v2",      status:"merged", ci:"pass",    approvals:2, needed:2, age:"3h"  },
  { num:41, title:"Initial AI checkout service scaffold",              agent:"agent-alpha",   branch:"feature/ai-checkout",      status:"open",   ci:"pass",    approvals:1, needed:2, age:"4h"  },
]

const AUDIT_EVENTS: AuditEvent[] = [
  { time:"09:54", action:"Commit b4c3d2 pushed — add audit log arg",           agent:"agent-charlie", type:"push"   },
  { time:"09:42", action:"PR #47 opened against main",                         agent:"agent-charlie", type:"pr"     },
  { time:"09:38", action:"Commit a3b2c3 — validate_token refactor",            agent:"agent-charlie", type:"push"   },
  { time:"09:31", action:"Branch fix/token-expiry created from main",          agent:"agent-charlie", type:"branch" },
  { time:"09:20", action:"PR #43 approved by Jane Taylor",                     agent:"system",        type:"approve"},
  { time:"09:15", action:"Task AIVCS-234 assigned by scheduler",               agent:"system",        type:"spawn"  },
  { time:"09:08", action:"agent-epsilon pushed 4 commits to fix/rate-limiter", agent:"agent-epsilon", type:"push"   },
  { time:"08:55", action:"agent-charlie spawned",                              agent:"system",        type:"spawn"  },
  { time:"08:40", action:"PR #42 merged to main — Stripe webhook retry",       agent:"system",        type:"merge"  },
  { time:"08:30", action:"agent-beta pushed to feature/payments-v2",           agent:"agent-beta",    type:"push"   },
]

const AUDIT_HOURLY = [
  {h:"06",v:1},{h:"07",v:3},{h:"08",v:7},{h:"09",v:14},{h:"10",v:5},{h:"11",v:2},
]

const ACTIVITY: {time:string;text:string;type:ActivityType}[] = [
  { time:"just now", text:"agent-charlie pushed to fix/token-expiry",                type:"push"    },
  { time:"3m ago",   text:"PR #45 approved by Jane Taylor → merge queue",            type:"approve" },
  { time:"7m ago",   text:"agent-delta opened PR #46: refactor search index",        type:"pr"      },
  { time:"14m ago",  text:"PR #43 merged to main via queue",                         type:"merge"   },
  { time:"21m ago",  text:"CI failed on feature/search-refactor: bandit violation",  type:"fail"    },
]

const NAV_ITEMS = [
  { id:"dashboard" as NavItem, label:"Dashboard",     icon:LayoutDashboard },
  { id:"repos"     as NavItem, label:"Repositories",  icon:FolderOpen      },
  { id:"agents"    as NavItem, label:"Agents",        icon:Bot             },
  { id:"branches"  as NavItem, label:"Branches",      icon:GitBranch       },
  { id:"pulls"     as NavItem, label:"Pull Requests", icon:GitPullRequest,  badge:3 },
  { id:"reviews"   as NavItem, label:"Reviews",       icon:Eye             },
  { id:"approvals" as NavItem, label:"Approvals",     icon:ListChecks,      badge:2 },
  { id:"audit"     as NavItem, label:"Audit Trail",   icon:Shield          },
  { id:"settings"  as NavItem, label:"Settings",      icon:Settings        },
]

// ─── Shared Primitives ────────────────────────────────────────────────────────
function CIIcon({ status, size = "sm" }: { status: CIStatus; size?: "sm"|"xs" }) {
  const w = size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5"
  if (status === "pass")    return <CheckCircle className={`${w} text-emerald-400 shrink-0`} />
  if (status === "fail")    return <XCircle     className={`${w} text-red-400 shrink-0`} />
  if (status === "running") return <RefreshCw   className={`${w} text-blue-400 shrink-0 animate-spin`} />
  return                           <Clock       className={`${w} text-slate-500 shrink-0`} />
}

function StatusPip({ status }: { status: AgentStatus }) {
  const map = { running:"bg-emerald-400 shadow-[0_0_8px_#22c55e60]", idle:"bg-slate-500", error:"bg-red-400 shadow-[0_0_8px_#ef444460]" }
  return <div className={`w-2 h-2 rounded-full shrink-0 ${map[status]} ${status==="running"?"animate-pulse":""}`} />
}

function CIBadge({ status }: { status: CIStatus }) {
  const map: Record<CIStatus, string> = {
    pass:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    fail:    "bg-red-500/10 text-red-400 border-red-500/20",
    running: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    pending: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  }
  const label = { pass:"passing", fail:"failed", running:"running", pending:"pending" }
  return <span className={`text-[10px] font-mono border rounded px-1.5 py-px ${map[status]}`}>{label[status]}</span>
}

function BranchPill({ type, name }: { type: "main"|"feature"|"fix"; name: string }) {
  const map = { main:"bg-blue-500/10 text-blue-300", feature:"bg-purple-500/10 text-purple-300", fix:"bg-amber-500/10 text-amber-300" }
  return (
    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${map[type]} truncate max-w-[140px]`}>{name}</span>
  )
}

function LangBadge({ lang }: { lang: string }) {
  const map: Record<string, string> = {
    Go:"bg-sky-500/15 text-sky-300", Rust:"bg-orange-500/15 text-orange-300",
    Python:"bg-yellow-500/15 text-yellow-300", TypeScript:"bg-blue-400/15 text-blue-300",
  }
  return <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${map[lang]??""}`}>{lang}</span>
}

function Fade({ children, k }: { children: React.ReactNode; k: string }) {
  return (
    <motion.div
      key={k}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="flex flex-col h-full"
    >
      {children}
    </motion.div>
  )
}

// ─── Branch Graph ─────────────────────────────────────────────────────────────
function BranchGraph() {
  const xs = [50, 130, 210, 290, 370, 440]
  const yM = 28, yF = 66, yFx = 104
  return (
    <svg width="490" height="130" className="overflow-visible select-none">
      <line x1={xs[0]} y1={yM} x2={xs[5]} y2={yM} stroke="#4f85f6" strokeWidth="1.5" />
      <path d={`M${xs[1]} ${yM} C${xs[1]+18} ${yM} ${xs[2]-18} ${yF} ${xs[2]} ${yF} L${xs[4]} ${yF}`}
        fill="none" stroke="#a855f7" strokeWidth="1.5" />
      <path d={`M${xs[4]} ${yF} C${xs[4]+18} ${yF} ${xs[5]-18} ${yM} ${xs[5]} ${yM}`}
        fill="none" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="5 3" />
      <path d={`M${xs[3]} ${yF} C${xs[3]+14} ${yF} ${xs[4]-14} ${yFx} ${xs[4]} ${yFx}`}
        fill="none" stroke="#f59e0b" strokeWidth="1.5" />
      {[xs[0],xs[1],xs[2],xs[3]].map((x,i) => (
        <circle key={i} cx={x} cy={yM} r="4.5" fill="#080c17" stroke="#4f85f6" strokeWidth="1.5" />
      ))}
      <circle cx={xs[5]} cy={yM} r="5.5" fill="#4f85f6" stroke="#4f85f6" strokeWidth="1.5" />
      {[xs[2],xs[3],xs[4]].map((x,i) => (
        <circle key={i} cx={x} cy={yF} r="4.5" fill="#080c17" stroke="#a855f7" strokeWidth="1.5" />
      ))}
      {[xs[4]].map((x,i) => (
        <circle key={i} cx={x} cy={yFx} r="4.5" fill="#080c17" stroke="#f59e0b" strokeWidth="1.5" />
      ))}
      {["a1b2c3","d4e5f6","g7h8i9","j0k1l2","HEAD"].map((sha,i) => (
        <text key={sha} x={[xs[0],xs[1],xs[2],xs[3],xs[5]][i]} y={yM-14} textAnchor="middle"
          fill="#2d4060" fontSize="9" fontFamily="JetBrains Mono,monospace">{sha}</text>
      ))}
      <text x={xs[5]+10} y={yM+4}     fill="#4f85f6" fontSize="9" fontFamily="JetBrains Mono,monospace">main</text>
      <text x={xs[4]-58} y={yF-10}    fill="#a855f7" fontSize="9" fontFamily="JetBrains Mono,monospace">feature/ai-checkout</text>
      <text x={xs[4]+8}  y={yFx+4}    fill="#f59e0b" fontSize="9" fontFamily="JetBrains Mono,monospace">fix/token-expiry</text>
    </svg>
  )
}

// ─── Views ────────────────────────────────────────────────────────────────────
function DashboardView() {
  const [messages, setMessages] = useState<Message[]>(INIT_MESSAGES)
  const [reply, setReply]       = useState("")
  const endRef                  = useRef<HTMLDivElement>(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }) }, [messages])
  const send = () => {
    if (!reply.trim()) return
    setMessages(p => [...p, { role:"supervisor", name:"Jane Taylor", time:"just now", content:reply.trim() }])
    setReply("")
  }

  return (
    <Fade k="dashboard">
      {/* Insight strip */}
      <div className="flex items-center gap-6 px-5 py-2.5 border-b border-border bg-muted/10 shrink-0 text-xs">
        {[
          ["PR #47", "fix/token-expiry → main"],
          ["+18 / −2", "lines changed"],
          ["1 file", "checkout_service.py"],
          ["3 commits", "last hour"],
          ["1h open", "since 09:31"],
        ].map(([val, label]) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="font-semibold text-foreground/90">{val}</span>
            <span className="text-[10px] text-muted-foreground/60">{label}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button className="text-[11px] px-3 h-6 rounded border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors">Request Changes</button>
          <button className="text-[11px] px-3 h-6 rounded bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25 transition-colors font-medium">Approve</button>
        </div>
      </div>

      {/* Main content row */}
      <div className="flex flex-1 overflow-hidden">
        {/* Diff viewer */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-[#070b15] shrink-0">
            <GitBranch className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-mono text-amber-300">fix/token-expiry</span>
            <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
            <span className="text-xs font-mono text-muted-foreground">PR #47</span>
            <span className="text-xs text-muted-foreground/60 ml-1.5">Fix token expiry boundary failures</span>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[11px] font-mono text-emerald-400">+18</span>
              <span className="text-[11px] font-mono text-red-400">−2</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto text-[11px]" style={{ fontFamily:"JetBrains Mono,monospace" }}>
            {DIFF_LINES.map((line, i) => {
              const isFile    = line.type === "file"
              const isHunk    = line.type === "hunk"
              const isAdded   = line.type === "added"
              const isRemoved = line.type === "removed"
              return (
                <div key={i} className={`flex leading-[1.6] ${
                  isFile?"bg-muted/15 text-muted-foreground/50":
                  isHunk?"bg-blue-500/6 text-blue-400/70":
                  isAdded?"bg-emerald-500/7 hover:bg-emerald-500/12":
                  isRemoved?"bg-red-500/7 hover:bg-red-500/12":
                  "hover:bg-white/[0.02]"} transition-colors`}
                >
                  <span className="w-10 text-right pr-2 text-muted-foreground/20 shrink-0 border-r border-border/20 select-none py-px">{line.lineOld??""}</span>
                  <span className="w-10 text-right pr-2 text-muted-foreground/20 shrink-0 border-r border-border/20 select-none py-px">{line.lineNew??""}</span>
                  <span className={`w-5 text-center shrink-0 select-none py-px ${isAdded?"text-emerald-400":isRemoved?"text-red-400":"text-muted-foreground/20"}`}>
                    {isAdded?"+":isRemoved?"−":" "}
                  </span>
                  <span className={`flex-1 pl-1 py-px whitespace-pre overflow-hidden ${
                    isAdded?"text-emerald-200":isRemoved?"text-red-200":
                    isHunk?"text-blue-400/70":isFile?"text-muted-foreground/50":"text-foreground/75"}`}>{line.content}</span>
                </div>
              )
            })}
          </div>
          {/* Bottom panels */}
          <div className="grid grid-cols-2 border-t border-border shrink-0" style={{height:188}}>
            <div className="border-r border-border flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-[#070b15] shrink-0">
                <Shield className="w-3 h-3 text-muted-foreground/50" />
                <span className="text-[11px] text-muted-foreground/80 font-medium">Audit Trail</span>
              </div>
              <div className="overflow-y-auto flex-1 py-0.5">
                {AUDIT_EVENTS.slice(0,6).map((ev, i) => (
                  <div key={i} className="flex items-start gap-2 px-3 py-1.5 hover:bg-white/[0.02] transition-colors">
                    <span className="text-[10px] font-mono text-muted-foreground/35 w-9 shrink-0 mt-px">{ev.time}</span>
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      ev.type==="push"?"bg-blue-400":ev.type==="pr"?"bg-purple-400":
                      ev.type==="branch"?"bg-amber-400":ev.type==="approve"?"bg-emerald-400":"bg-slate-500"}`} />
                    <div>
                      <div className="text-[11px] text-foreground/70">{ev.action}</div>
                      <div className="text-[10px] font-mono text-muted-foreground/40">{ev.agent}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-[#070b15] shrink-0">
                <Activity className="w-3 h-3 text-muted-foreground/50" />
                <span className="text-[11px] text-muted-foreground/80 font-medium">Branch Graph</span>
              </div>
              <div className="flex-1 flex items-center px-3 overflow-x-auto">
                <BranchGraph />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Agent Intent */}
        <div className="w-72 flex flex-col overflow-hidden shrink-0">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border shrink-0">
            <Bot className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span className="text-xs font-medium">Agent Intent</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground/30 ml-auto hover:text-foreground cursor-pointer transition-colors" />
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={`rounded-lg p-3 text-[11px] ${
                msg.role==="agent"
                  ?"bg-white/[0.03] border border-white/[0.06]"
                  :"bg-primary/6 border border-primary/15"}`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center font-bold shrink-0 ${
                    msg.role==="agent"?"bg-amber-500/15 text-amber-400":"bg-primary/15 text-primary"}`}
                    style={{fontSize:"8px"}}>
                    {msg.role==="agent"?"A":"S"}
                  </div>
                  <span className="font-mono text-muted-foreground/70 text-[10px]">{msg.name}</span>
                  <span className="text-muted-foreground/35 ml-auto text-[10px]">{msg.time}</span>
                </div>
                <p className="text-foreground/70 leading-relaxed">{msg.content}</p>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="border-t border-border p-2.5 shrink-0">
            <div className="flex gap-1.5 items-end">
              <textarea
                value={reply} onChange={e=>setReply(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()} }}
                placeholder="Reply as supervisor…" rows={2}
                className="flex-1 bg-white/[0.03] border border-border/50 rounded-lg px-2.5 py-2 text-[11px] placeholder:text-muted-foreground/35 outline-none focus:border-primary/30 resize-none text-foreground transition-colors"
              />
              <button onClick={send} className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white hover:bg-primary/80 transition-all hover:scale-105 active:scale-95 shrink-0">
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="border-t border-border px-4 py-3 shrink-0 space-y-3">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-3 h-3 text-amber-400" />
                <span className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground/50">Agent Guidance</span>
              </div>
              <div className="space-y-1.5">
                {["Ensure PR test coverage ≥ 80%","Review security policy for PRs in progress","Audit log must capture cart_id"].map((g,i)=>(
                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground/65">
                    <ChevronRight className="w-3 h-3 shrink-0 mt-px text-muted-foreground/25" />{g}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Activity className="w-3 h-3 text-muted-foreground/50" />
                <span className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground/50">CI Checks</span>
              </div>
              <div className="space-y-1.5">
                {CI_CHECKS.map((c,i)=>(
                  <div key={i} className="flex items-center gap-2">
                    <CIIcon status={c.status} />
                    <span className="flex-1 text-[11px] font-mono text-foreground/65 truncate">{c.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground/35">{c.duration}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Clock className="w-3 h-3 text-muted-foreground/50" />
                <span className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground/50">Recent Activity</span>
              </div>
              <div className="space-y-1.5">
                {ACTIVITY.map((item,i)=>(
                  <div key={i} className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      {push:"bg-blue-400",approve:"bg-emerald-400",pr:"bg-purple-400",merge:"bg-indigo-400",fail:"bg-red-400",branch:"bg-amber-400",spawn:"bg-slate-400"}[item.type]}`} />
                    <p className="text-[11px] text-muted-foreground/60 leading-snug">{item.text}<span className="ml-1 text-muted-foreground/35 font-mono text-[10px]">{item.time}</span></p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fade>
  )
}

// ─── Agents View ──────────────────────────────────────────────────────────────
function AgentsView() {
  const statusColor: Record<AgentStatus,string> = {
    running:"text-emerald-400", idle:"text-slate-400", error:"text-red-400"
  }
  return (
    <Fade k="agents">
      <div className="p-5 border-b border-border shrink-0 flex items-center gap-4">
        <div>
          <h1 className="text-base font-semibold">Agents</h1>
          <p className="text-xs text-muted-foreground mt-0.5">6 running · 1 idle · 1 error</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Active Corp Workspace</span>
          <button className="text-xs px-3 h-7 rounded bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors">+ Spawn Agent</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
          {AGENTS.map(agent => (
            <div key={agent.id} className="rounded-xl border border-border/60 bg-card/60 p-4 hover:border-border hover:bg-card transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <StatusPip status={agent.status} />
                  <span className="text-sm font-mono font-medium text-foreground/90">{agent.id}</span>
                </div>
                <span className={`text-[10px] font-mono uppercase tracking-wider ${statusColor[agent.status]}`}>
                  {agent.status}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground/80 leading-relaxed mb-3 min-h-[2.5rem]">{agent.task}</p>
              {agent.branch !== "—" && (
                <div className="mb-3">
                  <BranchPill type={agent.branch.startsWith("fix")?"fix":"feature"} name={agent.branch} />
                </div>
              )}
              <div className="flex items-end justify-between gap-3">
                <div className="flex gap-3 text-[10px] text-muted-foreground/60 font-mono">
                  <span><span className="text-foreground/70">{agent.commits}</span> commits</span>
                  <span>{agent.uptime}</span>
                </div>
                <div className="w-20 h-7 opacity-70 group-hover:opacity-100 transition-opacity">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={SPARKLINES[agent.id]??[]} margin={{top:0,right:0,left:0,bottom:0}}>
                      <Area type="monotone" dataKey="v"
                        stroke={agent.status==="error"?"#ef4444":agent.status==="idle"?"#64748b":"#4f85f6"}
                        fill={agent.status==="error"?"#ef444420":agent.status==="idle"?"#64748b20":"#4f85f620"}
                        strokeWidth={1.5} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Fade>
  )
}

// ─── Repositories View ────────────────────────────────────────────────────────
function RepositoriesView() {
  return (
    <Fade k="repos">
      <div className="p-5 border-b border-border shrink-0 flex items-center gap-4">
        <div>
          <h1 className="text-base font-semibold">Repositories</h1>
          <p className="text-xs text-muted-foreground mt-0.5">6 repositories · 8 active agents</p>
        </div>
        <div className="flex items-center gap-2 ml-auto bg-muted/40 border border-border/50 rounded-lg px-2.5 h-8 w-56">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none flex-1" placeholder="Filter repositories…" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-1 gap-2">
          {REPOS.map(repo => (
            <div key={repo.name} className="flex items-center gap-4 rounded-xl border border-border/50 bg-card/40 px-5 py-4 hover:border-border hover:bg-card/70 transition-all cursor-pointer group">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-primary/70" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium font-mono text-foreground/90 group-hover:text-foreground transition-colors">{repo.name}</span>
                    <LangBadge lang={repo.lang} />
                  </div>
                  <div className="text-[10px] text-muted-foreground/50 mt-0.5">Last activity {repo.lastActivity}</div>
                </div>
              </div>
              <div className="flex items-center gap-6 shrink-0">
                <Metric label="Agents"   value={repo.agents}   color={repo.agents>0?"text-emerald-400":"text-muted-foreground"} />
                <Metric label="Branches" value={repo.branches} />
                <Metric label="Open PRs" value={repo.prs}      color={repo.prs>0?"text-amber-400":"text-muted-foreground"} />
                <div className="flex items-center gap-1 text-muted-foreground/50 text-xs w-12 justify-end">
                  <Star className="w-3 h-3" />
                  <span className="font-mono">{repo.stars}</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Fade>
  )
}
function Metric({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="text-center w-16">
      <div className={`text-sm font-bold ${color??"text-foreground/80"}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground/45">{label}</div>
    </div>
  )
}

// ─── Branches View ────────────────────────────────────────────────────────────
function BranchesView() {
  return (
    <Fade k="branches">
      <div className="p-5 border-b border-border shrink-0 flex items-center gap-4">
        <div>
          <h1 className="text-base font-semibold">Branches</h1>
          <p className="text-xs text-muted-foreground mt-0.5">9 branches · 7 with active agents</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/10 text-muted-foreground/50 text-[10px] uppercase tracking-wider font-mono">
              <th className="text-left px-5 py-2.5 font-normal">Branch</th>
              <th className="text-left px-3 py-2.5 font-normal">Agent</th>
              <th className="text-center px-3 py-2.5 font-normal">Ahead</th>
              <th className="text-left px-3 py-2.5 font-normal">CI</th>
              <th className="text-left px-3 py-2.5 font-normal">Last Commit</th>
              <th className="px-5 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {BRANCHES.map(b => (
              <tr key={b.name} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <BranchPill type={b.type} name={b.name} />
                    {b.protected && <span className="text-[9px] font-mono text-muted-foreground/40 border border-border/40 rounded px-1">protected</span>}
                  </div>
                </td>
                <td className="px-3 py-3 font-mono text-muted-foreground/60 text-[11px]">
                  {b.agent ?? <span className="text-muted-foreground/30">—</span>}
                </td>
                <td className="px-3 py-3 text-center">
                  {b.ahead > 0
                    ? <span className="font-mono text-[11px] text-foreground/70">+{b.ahead}</span>
                    : <span className="text-muted-foreground/30">—</span>}
                </td>
                <td className="px-3 py-3"><CIBadge status={b.ciStatus} /></td>
                <td className="px-3 py-3 text-muted-foreground/50 text-[11px]">{b.lastCommit}</td>
                <td className="px-5 py-3 text-right">
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors inline-block" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Fade>
  )
}

// ─── Pull Requests View ───────────────────────────────────────────────────────
function PullRequestsView() {
  const [filter, setFilter] = useState<"all"|"open"|"merged">("all")
  const filtered = PULL_REQUESTS.filter(pr => filter==="all" ? true : pr.status===filter)

  return (
    <Fade k="pulls">
      <div className="px-5 py-3.5 border-b border-border shrink-0 flex items-center gap-4">
        <h1 className="text-base font-semibold">Pull Requests</h1>
        <div className="flex items-center gap-1 ml-4 p-0.5 bg-muted/30 rounded-lg border border-border/40">
          {(["all","open","merged"] as const).map(f => (
            <button key={f} onClick={()=>setFilter(f)}
              className={`text-[11px] px-3 h-6 rounded-md capitalize transition-all ${
                filter===f?"bg-muted text-foreground shadow-sm":"text-muted-foreground hover:text-foreground"}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span>{filtered.filter(p=>p.status==="open").length} open</span>
          <span className="text-muted-foreground/30">·</span>
          <span>{filtered.filter(p=>p.status==="merged").length} merged</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-border/40">
        {filtered.map(pr => (
          <div key={pr.num} className="flex items-start gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer group">
            <div className="mt-0.5">
              <CIIcon status={pr.ci} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3 mb-1.5">
                <span className="text-xs font-mono text-muted-foreground/50 shrink-0 mt-px">#{pr.num}</span>
                <span className="text-sm text-foreground/85 group-hover:text-foreground transition-colors font-medium leading-snug">{pr.title}</span>
              </div>
              <div className="flex items-center gap-3 ml-7">
                <BranchPill type={pr.branch.startsWith("fix")?"fix":"feature"} name={pr.branch} />
                <span className="text-[10px] font-mono text-muted-foreground/45">{pr.agent}</span>
                <span className="text-[10px] text-muted-foreground/35">{pr.age} ago</span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {pr.status==="merged"
                ? <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">merged</span>
                : (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                    <CheckCircle className={`w-3.5 h-3.5 ${pr.approvals>=pr.needed?"text-emerald-400":"text-muted-foreground/30"}`} />
                    <span className="font-mono">{pr.approvals}/{pr.needed}</span>
                  </div>
                )
              }
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </Fade>
  )
}

// ─── Audit Trail View ─────────────────────────────────────────────────────────
function AuditTrailView() {
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const types = ["all","push","pr","branch","approve","merge","spawn"]
  const filtered = typeFilter==="all" ? AUDIT_EVENTS : AUDIT_EVENTS.filter(e=>e.type===typeFilter)

  return (
    <Fade k="audit">
      <div className="px-5 py-3.5 border-b border-border shrink-0">
        <div className="flex items-center gap-4 mb-3">
          <h1 className="text-base font-semibold">Audit Trail</h1>
          <span className="text-xs text-muted-foreground/60">{AUDIT_EVENTS.length} events today</span>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {types.map(t => (
            <button key={t} onClick={()=>setTypeFilter(t)}
              className={`text-[11px] font-mono px-2.5 h-6 rounded-md capitalize transition-all border ${
                typeFilter===t
                  ?"bg-primary/10 border-primary/25 text-primary"
                  :"border-border/40 text-muted-foreground/60 hover:text-foreground hover:border-border/70"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      {/* Activity chart */}
      <div className="px-5 py-3 border-b border-border shrink-0 flex items-center gap-4">
        <div className="flex-1 h-14">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={AUDIT_HOURLY} margin={{top:4,right:0,left:0,bottom:0}}>
              <Bar dataKey="v" fill="#4f85f640" radius={[3,3,0,0]} />
              <RTooltip
                contentStyle={{ background:"#0d1527", border:"1px solid rgba(79,133,246,0.15)", borderRadius:8, fontSize:11, fontFamily:"JetBrains Mono,monospace" }}
                labelStyle={{ color:"#5b7299" }}
                itemStyle={{ color:"#4f85f6" }}
                labelFormatter={(l)=>`${l}:00`}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="text-[10px] text-muted-foreground/50 font-mono text-right shrink-0">
          <div>activity</div>
          <div>by hour</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="relative">
          <div className="absolute left-[5.25rem] top-0 bottom-0 w-px bg-border/40" />
          {filtered.map((ev, i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors group">
              <span className="text-[10px] font-mono text-muted-foreground/35 w-12 shrink-0 mt-1">{ev.time}</span>
              <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 z-10 ring-2 ring-background ${
                ev.type==="push"?"bg-blue-400":ev.type==="pr"?"bg-purple-400":
                ev.type==="branch"?"bg-amber-400":ev.type==="approve"?"bg-emerald-400":
                ev.type==="merge"?"bg-indigo-400":"bg-slate-500"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-foreground/75 group-hover:text-foreground/90 transition-colors">{ev.action}</p>
                <span className="text-[10px] font-mono text-muted-foreground/40">{ev.agent}</span>
              </div>
              <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${
                ev.type==="push"?"bg-blue-500/10 text-blue-400/70":
                ev.type==="pr"?"bg-purple-500/10 text-purple-400/70":
                ev.type==="branch"?"bg-amber-500/10 text-amber-400/70":
                ev.type==="approve"?"bg-emerald-500/10 text-emerald-400/70":
                ev.type==="merge"?"bg-indigo-500/10 text-indigo-400/70":
                "bg-slate-500/10 text-slate-400/70"}`}>{ev.type}</span>
            </div>
          ))}
        </div>
      </div>
    </Fade>
  )
}

// ─── Placeholder View ─────────────────────────────────────────────────────────
function PlaceholderView({ label }: { label: string }) {
  return (
    <Fade k={label}>
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 p-10">
        <div className="w-12 h-12 rounded-2xl border border-border/50 bg-muted/20 flex items-center justify-center">
          <Zap className="w-5 h-5 text-muted-foreground/40" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground/60">{label}</p>
          <p className="text-xs text-muted-foreground/40 mt-1">Coming in the next sprint</p>
        </div>
      </div>
    </Fade>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeNav, setActiveNav] = useState<NavItem>("dashboard")

  const STATS = [
    { icon:Cpu,         value:"8",  label:"Active Agents",     sub:"running",           color:"text-blue-400",   bg:"bg-blue-500/10"   },
    { icon:Eye,         value:"4",  label:"Open Reviews",      sub:"pending",           color:"text-amber-400",  bg:"bg-amber-500/10"  },
    { icon:CheckCircle, value:"3",  label:"Approved",          sub:"charlie · pending", color:"text-emerald-400",bg:"bg-emerald-500/10"},
    { icon:GitMerge,    value:"12", label:"Merge Queue",       sub:"Alpha",             color:"text-purple-400", bg:"bg-purple-500/10" },
  ]

  function renderView() {
    switch(activeNav) {
      case "dashboard": return <DashboardView />
      case "agents":    return <AgentsView />
      case "repos":     return <RepositoriesView />
      case "branches":  return <BranchesView />
      case "pulls":     return <PullRequestsView />
      case "audit":     return <AuditTrailView />
      default:          return <PlaceholderView label={NAV_ITEMS.find(n=>n.id===activeNav)?.label??activeNav} />
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden" style={{fontFamily:"Inter,system-ui,sans-serif"}}>

      {/* ── Top Nav ─── */}
      <header className="h-11 flex items-center gap-3 px-4 border-b border-border shrink-0" style={{background:"linear-gradient(to right, #060a14 0%, #080c17 100%)"}}>
        <div className="flex items-center gap-2 w-44 shrink-0">
          <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
            <GitBranch className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-foreground/90">AIVCS</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" title="System live" />
        </div>
        <div className="flex-1 max-w-sm flex items-center gap-2 bg-white/[0.03] border border-border/50 rounded-lg px-2.5 h-7">
          <Search className="w-3 h-3 text-muted-foreground/50 shrink-0" />
          <input className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 outline-none flex-1 min-w-0" placeholder="Search repositories, agents, commits…" />
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-foreground border border-border/40 rounded-lg px-2.5 h-7 transition-colors hover:bg-white/[0.03]">
            Active Corp Workspace <ChevronDown className="w-3 h-3" />
          </button>
          <button className="relative w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-muted-foreground/60 hover:text-foreground transition-colors">
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
          </button>
          <button className="flex items-center gap-2 text-xs hover:bg-white/[0.03] rounded-lg px-2 h-7 transition-colors">
            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold" style={{fontSize:"9px"}}>JT</div>
            <span className="text-muted-foreground/70">Jane Taylor</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground/40" />
          </button>
        </div>
      </header>

      {/* ── Body ─── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ─── */}
        <aside className="w-48 border-r border-border flex flex-col py-2 shrink-0 overflow-y-auto" style={{background:"#060a14"}}>
          <nav className="flex flex-col gap-0.5 px-2">
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={()=>setActiveNav(item.id)}
                className={`relative flex items-center gap-2 px-2.5 h-7 text-xs rounded-lg transition-all ${
                  activeNav===item.id
                    ?"bg-primary/10 text-primary font-medium"
                    :"text-muted-foreground/70 hover:text-foreground hover:bg-white/[0.03]"}`}
              >
                {activeNav===item.id && (
                  <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-primary" />
                )}
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-mono bg-muted/50 text-muted-foreground/70 rounded-md px-1 py-px">{item.badge}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="mt-auto px-2 pb-2 pt-4">
            <div className="text-[9px] font-mono tracking-[0.15em] uppercase text-muted-foreground/35 mb-2 px-1">Human-in-the-Loop</div>
            <div className="rounded-lg border border-border/50 bg-white/[0.02] p-2.5">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 mb-2">
                <Bot className="w-3 h-3" />
                <span className="font-mono truncate flex-1">ai/checkout/service</span>
                <ChevronDown className="w-3 h-3 shrink-0" />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#22c55e50]" />
                <span className="text-[10px] text-emerald-400">active</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main ─── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Stats */}
          <div className="grid grid-cols-4 border-b border-border shrink-0">
            {STATS.map((s,i) => (
              <button key={i} onClick={()=>setActiveNav(i===2?"approvals":i===0?"agents":i===1?"reviews":"pulls")}
                className={`flex items-center gap-3 px-5 py-3.5 ${i<3?"border-r border-border":""} hover:bg-white/[0.02] transition-colors cursor-pointer text-left`}>
                <div className={`p-1.5 rounded-lg ${s.bg} shrink-0`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight">{s.value}</span>
                    <span className="text-xs text-muted-foreground/70">{s.label}</span>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground/45 mt-0.5">{s.sub}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Routed view */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              {renderView()}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}
