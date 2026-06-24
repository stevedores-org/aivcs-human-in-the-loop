import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { AreaChart, Area, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import {
  LayoutDashboard, PlaySquare, Eye, Zap, GitBranch, ShieldAlert,
  Gauge, Settings, BookOpen, ChevronDown, Bell, Search, Send,
  CheckCircle, XCircle, Clock, Cpu, ChevronRight,
  RefreshCw, Sliders, ArrowUpRight, Play, Pause, Flame,
  Terminal, History, Sparkles, AlertCircle, Check
} from "lucide-react"
import { useAuth } from "../lib/auth/AuthProvider"
import { useRuntimeConfig } from "../lib/config/ConfigProvider"
import { LoginGate } from "./components/LoginGate"

// ─── Types ────────────────────────────────────────────────────────────────────
type NavItem = "dashboard" | "runs" | "visual" | "chaos" | "versioning" | "reviews" | "performance" | "settings" | "docs"
type CIStatus = "pass" | "fail" | "running" | "pending"
type TestType = "visual" | "chaos" | "unit" | "perf"
type MutantStatus = "killed" | "survived" | "timeout"

interface TestRun {
  id: string
  name: string
  target: string
  type: TestType
  status: CIStatus
  duration: string
  agent: string
  assertions: string
  failureDetail?: string
  progress: number // 0 to 100
  stages: { name: string; status: "done" | "active" | "todo" }[]
}

interface Mutant {
  id: string
  file: string
  line: number
  original: string
  mutated: string
  status: MutantStatus
  killedBy?: string
}

interface Message {
  role: "agent" | "supervisor"
  name: string
  time: string
  content: string
  codeSnippet?: string
}

interface AIVCSCommit {
  sha: string
  message: string
  author: string
  time: string
  passRate: number
  totalTests: number
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const INITIAL_RUNS: TestRun[] = [
  {
    id: "TR-8942",
    name: "visual-checkout-e2e",
    target: "fix/token-expiry",
    type: "visual",
    status: "fail",
    duration: "4m 12s",
    agent: "agent-visual",
    assertions: "42 / 43 passed",
    failureDetail: "Visual mismatch (1.42% delta) detected in checkout payment screen",
    progress: 100,
    stages: [
      { name: "Sandbox Ingest", status: "done" },
      { name: "AI Gen Selectors", status: "done" },
      { name: "Browser Run", status: "done" },
      { name: "Image Analysis", status: "done" },
      { name: "Complete", status: "done" }
    ]
  },
  {
    id: "TR-8941",
    name: "stripe-idempotency-chaos",
    target: "main",
    type: "chaos",
    status: "pass",
    duration: "5m 18s",
    agent: "agent-chaos",
    assertions: "120 / 120 killed",
    progress: 100,
    stages: [
      { name: "Parse Code", status: "done" },
      { name: "Inject Mutants", status: "done" },
      { name: "Run Test Suite", status: "done" },
      { name: "Audit Survivals", status: "done" },
      { name: "Complete", status: "done" }
    ]
  },
  {
    id: "TR-8940",
    name: "api-concurrency-audit",
    target: "fix/rate-limiter",
    type: "unit",
    status: "running",
    duration: "2m 45s",
    agent: "agent-regression",
    assertions: "87 / 95 tests",
    progress: 72,
    stages: [
      { name: "Sandbox Ingest", status: "done" },
      { name: "AI Gen Selectors", status: "done" },
      { name: "Browser Run", status: "active" },
      { name: "Image Analysis", status: "todo" },
      { name: "Complete", status: "todo" }
    ]
  },
  {
    id: "TR-8939",
    name: "checkout-vitals-profiler",
    target: "feature/ai-checkout",
    type: "perf",
    status: "pass",
    duration: "1m 35s",
    agent: "agent-performance",
    assertions: "Core Web Vitals Optimal",
    progress: 100,
    stages: [
      { name: "Launch Browser", status: "done" },
      { name: "Throttle Network", status: "done" },
      { name: "Capture Metrics", status: "done" },
      { name: "Verify Threshold", status: "done" },
      { name: "Complete", status: "done" }
    ]
  },
  {
    id: "TR-8938",
    name: "auth-gateway-regression",
    target: "feature/payments-v2",
    type: "unit",
    status: "pass",
    duration: "3m 10s",
    agent: "agent-regression",
    assertions: "145 / 145 passed",
    progress: 100,
    stages: [
      { name: "Sandbox Ingest", status: "done" },
      { name: "AI Gen Selectors", status: "done" },
      { name: "Browser Run", status: "done" },
      { name: "Image Analysis", status: "done" },
      { name: "Complete", status: "done" }
    ]
  }
]

const MUTANTS: Mutant[] = [
  {
    id: "MUT-001",
    file: "services/checkout_service.py",
    line: 44,
    original: "if payload['exp'] - time.time() < expiry_buffer:",
    mutated: "if payload['exp'] - time.time() <= expiry_buffer:",
    status: "killed",
    killedBy: "test_validate_token_at_boundary"
  },
  {
    id: "MUT-002",
    file: "services/checkout_service.py",
    line: 52,
    original: "new_payload = {**payload, 'exp': int(time.time()) + 3600}",
    mutated: "new_payload = {**payload, 'exp': int(time.time()) + 1800}",
    status: "killed",
    killedBy: "test_validate_token_expiry_duration"
  },
  {
    id: "MUT-003",
    file: "services/checkout_service.py",
    line: 53,
    original: "self.audit.log('token_refreshed', subject=payload['sub'], cart_id=cart_id)",
    mutated: "# self.audit.log('token_refreshed', subject=payload['sub'], cart_id=cart_id)",
    status: "survived",
    killedBy: undefined
  },
  {
    id: "MUT-004",
    file: "services/payment_gateway.py",
    line: 112,
    original: "return hashlib.sha256(f'{user_id}:{amount}'.encode()).hexdigest()",
    mutated: "return uuid.uuid4().hex",
    status: "killed",
    killedBy: "test_stripe_idempotency_replay"
  }
]

const INITIAL_MESSAGES: Message[] = [
  {
    role: "agent",
    name: "agent-chaos",
    time: "10m ago",
    content: "I executed mutation test suite stripe-idempotency-chaos against your main branch. I found 1 Survived mutant (test coverage gap) in services/checkout_service.py:L53."
  },
  {
    role: "agent",
    name: "agent-chaos",
    time: "9m ago",
    content: "Mutant MUT-003 commented out self.audit.log, but all existing checkout unit tests still passed. This indicates we are not asserting that audit logs are successfully created near token expiry boundaries."
  },
  {
    role: "supervisor",
    name: "Jane Taylor",
    time: "7m ago",
    content: "Good catch. We definitely need an audit log assertion there. Can you write a mock test to verify the audit logger is triggered during validation?"
  },
  {
    role: "agent",
    name: "agent-chaos",
    time: "just now",
    content: "Understood. I have generated test_checkout_logs_audit_trail to assert that self.audit.log is called with the correct cart_id and sub payload. Review the code snippet below:",
    codeSnippet: `def test_checkout_logs_audit_trail(self):
    mock_audit = MagicMock()
    service = CheckoutService(audit=mock_audit)
    token = service.generate_token(sub="user_942", exp=time.time() + 10)
    
    # Trigger token validation near expiry boundary
    payload = service.validate_token(token, expiry_buffer=300)
    
    # Assert audit log was successfully called with parameters
    mock_audit.log.assert_called_once_with(
        'token_refreshed',
        subject="user_942",
        cart_id=ANY
    )`
  }
]

const AIVCS_COMMITS: AIVCSCommit[] = [
  { sha: "a1b2c3d", message: "feat(auth): add OIDC dynamic client PKCE login flow", author: "agent-visual", time: "1h ago", passRate: 98.2, totalTests: 154 },
  { sha: "b4c3d2e", message: "fix(checkout): enforce token expiry check on cart updates", author: "agent-regression", time: "2h ago", passRate: 92.1, totalTests: 154 },
  { sha: "c5d4e3f", message: "perf(redis): leverage clustered cache for webhooks", author: "agent-performance", time: "4h ago", passRate: 100, totalTests: 148 },
  { sha: "d6e5f4g", message: "chore(ci): run visual checks on pull requests", author: "system", time: "1d ago", passRate: 96.5, totalTests: 148 }
]

/*
const AUDIT_LOGS = [
  { time: "15:42:01", event: "Test run TR-8942 failed visual validation", type: "error", agent: "agent-visual" },
  { time: "15:39:12", event: "Visual regression analysis comparing baseline 1.2.0 vs candidate 1.2.1 complete", type: "info", agent: "agent-visual" },
  { time: "15:31:45", event: "Mutant MUT-003 (comment out audit.log) survived validation checks", type: "warning", agent: "agent-chaos" },
  { time: "15:28:10", event: "Injected 4 artificial mutations in checkout_service.py", type: "info", agent: "agent-chaos" },
  { time: "15:15:30", event: "Performance vitals check triggered for feature/ai-checkout", type: "info", agent: "agent-performance" },
  { time: "14:50:22", event: "AIVCS checkpoint a1b2c3d visual tests successfully run", type: "success", agent: "system" }
]
*/

const CHART_DATA_TEST_RUNS = [
  { name: "Mon", pass: 92, fail: 8, chaos: 85 },
  { name: "Tue", pass: 94, fail: 6, chaos: 87 },
  { name: "Wed", pass: 91, fail: 9, chaos: 88 },
  { name: "Thu", pass: 96, fail: 4, chaos: 92 },
  { name: "Fri", pass: 95, fail: 5, chaos: 94 },
  { name: "Sat", pass: 98, fail: 2, chaos: 96 },
  { name: "Sun", pass: 97, fail: 3, chaos: 96 }
]

// ─── Shared Primitives ────────────────────────────────────────────────────────
function StatusIcon({ status, size = "sm" }: { status: CIStatus; size?: "sm" | "xs" | "lg" }) {
  const w = size === "lg" ? "w-6 h-6" : size === "xs" ? "w-3 h-3" : "w-4 h-4"
  if (status === "pass") return <CheckCircle className={`${w} text-emerald-400 shrink-0`} />
  if (status === "fail") return <XCircle className={`${w} text-rose-400 shrink-0`} />
  if (status === "running") return <RefreshCw className={`${w} text-blue-400 shrink-0 animate-spin`} />
  return <Clock className={`${w} text-slate-500 shrink-0`} />
}

function StatusBadge({ status }: { status: CIStatus }) {
  const map: Record<CIStatus, string> = {
    pass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    fail: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    running: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    pending: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  }
  const label = { pass: "passing", fail: "failed", running: "running", pending: "pending" }
  return <span className={`text-[10px] font-mono border rounded px-1.5 py-0.5 uppercase tracking-wide ${map[status]}`}>{label[status]}</span>
}

function TestTypeBadge({ type }: { type: TestType }) {
  const map: Record<TestType, string> = {
    visual: "bg-purple-500/10 text-purple-300 border-purple-500/20",
    chaos: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    unit: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    perf: "bg-sky-500/10 text-sky-300 border-sky-500/20"
  }
  return <span className={`text-[10px] font-mono border rounded px-1.5 py-0.5 capitalize ${map[type]}`}>{type}</span>
}

function Fade({ children, k }: { children: React.ReactNode; k: string }) {
  return (
    <motion.div
      key={k}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="flex flex-col h-full overflow-hidden"
    >
      {children}
    </motion.div>
  )
}

// ─── Component Views ──────────────────────────────────────────────────────────

// 1. Dashboard / Overview
function DashboardView({ setView, setSelectedRun }: { setView: (v: NavItem) => void; setSelectedRun: (r: TestRun) => void }) {
  return (
    <Fade k="dashboard">
      <div className="p-5 border-b border-border shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold">Test Overview & Telemetry</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time health of your codebases monitored by visual & chaos agents.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest mr-2">System Status:</span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE SIMULATOR ACTIVE
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Main Chart and Quick Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Chart Card */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card/40 p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-foreground/90 uppercase tracking-wider">Test Suite Performance</h3>
                <p className="text-[11px] text-muted-foreground">Historical pass rates and mutant kill metrics.</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground/75">
                <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-primary/80" /> Pass Rate</div>
                <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500/80" /> Chaos Kill Score</div>
              </div>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CHART_DATA_TEST_RUNS} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPass" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f85f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4f85f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorChaos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#5b7299" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#5b7299" fontSize={9} domain={[60, 100]} tickLine={false} axisLine={false} />
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(79, 133, 246, 0.05)" vertical={false} />
                  <RTooltip
                    contentStyle={{ background: "#0d1527", border: "1px solid rgba(79,133,246,0.15)", borderRadius: 8, fontSize: 11, fontFamily: "JetBrains Mono,monospace" }}
                    labelStyle={{ color: "#5b7299" }}
                  />
                  <Area type="monotone" dataKey="pass" stroke="#4f85f6" fillOpacity={1} fill="url(#colorPass)" strokeWidth={2} name="Pass Rate %" />
                  <Area type="monotone" dataKey="chaos" stroke="#f59e0b" fillOpacity={1} fill="url(#colorChaos)" strokeWidth={1.5} name="Mutant Kill Score %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="rounded-xl border border-border bg-card/40 p-4 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-semibold text-foreground/90 uppercase tracking-wider mb-2.5">Platform Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">96.8% Pass Rate</div>
                    <div className="text-[10px] text-muted-foreground">Across all registered codebases</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/15 flex items-center justify-center shrink-0">
                    <Flame className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">97.5% Mutation Resiliency</div>
                    <div className="text-[10px] text-muted-foreground">120 mutants generated, 117 killed</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center shrink-0">
                    <Cpu className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">4 Active QA Agents</div>
                    <div className="text-[10px] text-muted-foreground">Validating sandbox deployments</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border/50 pt-3 mt-3">
              <div className="flex justify-between items-center text-[11px] mb-1.5">
                <span className="text-muted-foreground">Active visual regression delta</span>
                <span className="font-mono text-rose-400 font-semibold">1.42%</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div className="bg-rose-400 h-full rounded-full" style={{ width: "35%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Test Executions Summary & Failure Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Active / Recent Runs */}
          <div className="rounded-xl border border-border bg-card/40 p-4 flex flex-col overflow-hidden min-h-[300px]">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="text-xs font-semibold text-foreground/90 uppercase tracking-wider">Recent Executions</h3>
              <button onClick={() => setView("runs")} className="text-[10px] font-mono text-primary flex items-center gap-0.5 hover:underline">
                View all runs <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {INITIAL_RUNS.map(run => (
                <div
                  key={run.id}
                  onClick={() => { setSelectedRun(run); setView("runs") }}
                  className="flex items-center gap-3 rounded-lg border border-border/50 bg-slate-950/30 p-2.5 hover:border-border hover:bg-slate-950/70 cursor-pointer transition-all group"
                >
                  <StatusIcon status={run.status} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-medium truncate text-foreground/90">{run.name}</span>
                      <TestTypeBadge type={run.type} />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      <span className="font-mono">{run.id}</span>
                      <span>·</span>
                      <span>{run.duration}</span>
                      <span>·</span>
                      <span className="truncate">{run.target}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-mono font-medium text-foreground">{run.assertions}</span>
                    <ArrowUpRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary transition-colors ml-1 inline" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Visual Comparison Preview */}
          <div className="rounded-xl border border-border bg-card/40 p-4 flex flex-col justify-between min-h-[300px]">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="text-xs font-semibold text-foreground/90 uppercase tracking-wider">Active Regression Mismatch</h3>
              <button onClick={() => setView("visual")} className="text-[10px] font-mono text-primary flex items-center gap-0.5 hover:underline">
                Launch Sandbox <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {/* Mock Visual comparison image rendering */}
            <div className="flex-1 rounded-lg border border-border/40 bg-slate-950 overflow-hidden relative flex flex-col justify-between p-2 min-h-[160px]">
              <div className="flex items-center justify-between border-b border-border/30 pb-1.5 mb-1.5">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-[10px] font-mono text-rose-400 font-semibold">1.42% visual drift</span>
                </div>
                <span className="text-[9px] font-mono text-muted-foreground">file:///checkout_service.py/CheckoutPage</span>
              </div>

              {/* Side-by-Side Comparison Mockups inside CSS */}
              <div className="grid grid-cols-2 gap-2 flex-1 items-center">
                <div className="h-full border border-border/20 rounded bg-slate-900/50 flex flex-col relative overflow-hidden">
                  <div className="absolute top-1 left-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-mono px-1 rounded">BASELINE</div>
                  <div className="flex-1 flex flex-col items-center justify-center p-3 scale-[0.85]">
                    <div className="w-20 bg-slate-800 h-2.5 rounded mb-1.5" />
                    <div className="w-16 bg-slate-800 h-2 rounded mb-3" />
                    <div className="w-20 bg-primary h-6 rounded-md flex items-center justify-center text-[8px] font-semibold text-white">Checkout</div>
                  </div>
                </div>
                <div className="h-full border border-rose-500/30 rounded bg-slate-900/50 flex flex-col relative overflow-hidden">
                  <div className="absolute top-1 left-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[8px] font-mono px-1 rounded">CANDIDATE</div>
                  <div className="flex-1 flex flex-col items-center justify-center p-3 scale-[0.85] relative">
                    <div className="w-20 bg-slate-800 h-2.5 rounded mb-1.5" />
                    <div className="w-16 bg-slate-800 h-2 rounded mb-3" />
                    {/* Displaced, colored button */}
                    <div className="w-20 bg-purple-600 h-6 rounded-md flex items-center justify-center text-[8px] font-semibold text-white relative shadow-[0_0_10px_rgba(168,85,247,0.3)] animate-pulse">
                      Checkout
                      <span className="absolute -inset-0.5 border border-dashed border-rose-500 rounded-md" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border/50 pt-2.5 mt-2.5 shrink-0 flex items-center justify-between">
              <div className="text-[10px] text-muted-foreground flex flex-col">
                <span>Detected in checkout payment screen</span>
                <span className="font-mono text-[9px] text-muted-foreground/50 mt-px">TR-8942 · fix/token-expiry</span>
              </div>
              <button onClick={() => setView("reviews")} className="text-[10px] h-6 rounded bg-rose-500/15 border border-rose-500/25 text-rose-400 hover:bg-rose-500/25 transition-colors font-medium px-2.5">
                Resolve Failure
              </button>
            </div>
          </div>
        </div>
      </div>
    </Fade>
  )
}

// 2. Test Runs View
function TestRunsView({ runs, onSelectRun, selectedRun }: { runs: TestRun[]; onSelectRun: (r: TestRun) => void; selectedRun: TestRun | null }) {
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const filtered = runs.filter(run => {
    const typeMatch = filterType === "all" || run.type === filterType
    const statusMatch = filterStatus === "all" || run.status === filterStatus
    return typeMatch && statusMatch
  })

  const activeRun = selectedRun || runs[0]

  return (
    <Fade k="runs">
      <div className="p-5 border-b border-border shrink-0 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-base font-semibold">Test Executions</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Browse history and real-time outputs of automated test runs.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Type filter */}
          <div className="flex items-center gap-1 bg-slate-900 border border-border/50 rounded-lg p-0.5 h-8">
            {["all", "visual", "chaos", "unit", "perf"].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`text-[10px] px-2 h-6 font-mono rounded capitalize transition-all ${filterType === t ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-slate-900 border border-border/50 rounded-lg p-0.5 h-8">
            {["all", "pass", "fail", "running"].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`text-[10px] px-2.5 h-6 font-mono rounded capitalize transition-all ${filterStatus === s ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Executions List Table */}
        <div className="flex-1 overflow-y-auto border-r border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/10 text-muted-foreground/50 text-[10px] uppercase tracking-wider font-mono">
                <th className="text-left px-4 py-2.5 font-normal">Execution</th>
                <th className="text-left px-3 py-2.5 font-normal">Target</th>
                <th className="text-left px-3 py-2.5 font-normal">Type</th>
                <th className="text-left px-3 py-2.5 font-normal">Status</th>
                <th className="text-left px-3 py-2.5 font-normal">Duration</th>
                <th className="text-right px-4 py-2.5 font-normal">Assertions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map(run => (
                <tr
                  key={run.id}
                  onClick={() => onSelectRun(run)}
                  className={`hover:bg-white/[0.02] cursor-pointer transition-colors ${activeRun.id === run.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StatusIcon status={run.status} size="sm" />
                      <div>
                        <div className="font-semibold text-foreground/90">{run.name}</div>
                        <div className="font-mono text-[9px] text-muted-foreground mt-0.5">{run.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono text-muted-foreground/60 text-[11px] truncate max-w-[120px]">{run.target}</td>
                  <td className="px-3 py-3"><TestTypeBadge type={run.type} /></td>
                  <td className="px-3 py-3"><StatusBadge status={run.status} /></td>
                  <td className="px-3 py-3 font-mono text-muted-foreground/50 text-[11px]">{run.duration}</td>
                  <td className="px-4 py-3 text-right font-mono text-[11px] text-foreground/80">{run.assertions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Run Details Panel */}
        <div className="w-80 shrink-0 bg-slate-950/20 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-[#070b15] shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted-foreground uppercase">{activeRun.id}</span>
              <span className="text-[10px] font-mono text-muted-foreground/35">·</span>
              <span className="text-[10px] text-muted-foreground">by {activeRun.agent}</span>
            </div>
            <h2 className="text-sm font-semibold mt-1 text-foreground">{activeRun.name}</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Flow progress chart */}
            <div>
              <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/50 mb-2">Automation Pipeline</div>
              <div className="space-y-3 relative pl-4">
                <div className="absolute left-[7px] top-1.5 bottom-1.5 w-px bg-border/40" />
                {activeRun.stages.map((stage, i) => (
                  <div key={i} className="flex items-start gap-3 relative">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      stage.status === "done" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" :
                      stage.status === "active" ? "bg-blue-500/10 border border-blue-500/30 text-blue-400 animate-pulse" :
                      "bg-slate-900 border border-border/20 text-muted-foreground/40"}`}
                      style={{ fontSize: "7px" }}
                    >
                      {stage.status === "done" ? <Check className="w-2 h-2" /> : i + 1}
                    </div>
                    <div>
                      <div className={`text-[11px] font-medium ${stage.status === "todo" ? "text-muted-foreground/40" : "text-foreground/80"}`}>{stage.name}</div>
                      <div className="text-[9px] font-mono text-muted-foreground/40">{stage.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Run Assertions / Failure info */}
            {activeRun.failureDetail && (
              <div className="rounded-lg border border-rose-500/15 bg-rose-500/5 p-3">
                <div className="flex items-center gap-1.5 mb-1.5 text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">Assertion Failure</span>
                </div>
                <p className="text-[11px] text-rose-300/80 leading-relaxed font-mono">{activeRun.failureDetail}</p>
              </div>
            )}

            {/* Configuration Parameters */}
            <div className="rounded-lg border border-border/50 bg-slate-950/40 p-3 space-y-2">
              <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/50">Run Context</div>
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[10px] font-mono">
                <div className="text-muted-foreground/50">Base Codebase</div>
                <div className="text-foreground/75 truncate text-right">aivcs-api</div>
                <div className="text-muted-foreground/50">Environment</div>
                <div className="text-foreground/75 text-right">sandbox-eu-west</div>
                <div className="text-muted-foreground/50">Trigger Type</div>
                <div className="text-foreground/75 text-right">AIVCS Webhook</div>
                <div className="text-muted-foreground/50">Timeout cap</div>
                <div className="text-foreground/75 text-right">600s</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fade>
  )
}

// 3. Visual Sandbox / Browser Recording View
function VisualSandboxView() {
  const [sliderVal, setSliderVal] = useState<number>(50)
  const [playBackActive, setPlayBackActive] = useState<boolean>(true)
  const [currentLogLine, setCurrentLogLine] = useState<number>(4)

  const BROWSER_LOGS = [
    "[PLAYWRIGHT] Initializing Chromium sandbox target-pool-01...",
    "[PLAYWRIGHT] Navigating to http://localhost:5173/checkout...",
    "[PLAYWRIGHT] Action: Filling 'Card Number' input with mock metadata...",
    "[PLAYWRIGHT] Action: Clicking 'Checkout Now' action trigger...",
    "[VISUAL-AGENT] capturing canvas layout snapshot at checkout_summary...",
    "[VISUAL-AGENT] Comparing snapshot_v120.png against snapshot_v121.png...",
    "[VISUAL-AGENT] MISMATCH FOUND! 1.42% delta. Shift detected in CheckoutButton.",
    "[VISUAL-AGENT] Diagnostic: CheckoutButton color altered from #4f85f6 to #7c3aed.",
    "[PLAYWRIGHT] Recording visual artifact. Retrying assertion..."
  ]

  useEffect(() => {
    if (!playBackActive) return
    const interval = setInterval(() => {
      setCurrentLogLine(p => (p + 1) % (BROWSER_LOGS.length + 1))
    }, 2500)
    return () => clearInterval(interval)
  }, [playBackActive])

  return (
    <Fade k="visual">
      <div className="p-5 border-b border-border shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold">Visual Sandbox</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Compare layout screenshots side-by-side with a pixel-diff slider.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPlayBackActive(!playBackActive)}
            className="flex items-center gap-1.5 px-3 h-7 rounded bg-[#111e35] border border-border/50 text-xs font-medium text-foreground hover:bg-slate-900 transition-colors"
          >
            {playBackActive ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            {playBackActive ? "Pause Logging" : "Resume Logging"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Pixel Comparison Slider & Controls */}
        <div className="flex-1 p-5 flex flex-col gap-4 overflow-y-auto">
          {/* Interactive Screen Slider Box */}
          <div className="flex-1 min-h-[250px] max-h-[400px] border border-border bg-slate-950 rounded-xl overflow-hidden relative flex items-center justify-center p-4">
            <div className="w-full max-w-md aspect-[1.6/1] bg-card border border-border/40 rounded-lg relative overflow-hidden flex flex-col">
              {/* Browser bar */}
              <div className="h-6 bg-[#060a14] border-b border-border/30 flex items-center px-3 gap-1.5 shrink-0 select-none">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <div className="bg-slate-900 text-[8px] font-mono text-muted-foreground/60 rounded px-2 py-0.5 flex-1 mx-4 text-center">http://aivcs.io/sandbox/checkout</div>
              </div>

              {/* Slider Canvas Arena */}
              <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-slate-950">
                {/* 1. Baseline underneath */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 select-none scale-[0.9]">
                  <div className="w-32 bg-slate-800 h-3 rounded mb-2" />
                  <div className="w-24 bg-slate-800 h-2.5 rounded mb-5" />
                  <div className="w-32 bg-primary h-8 rounded-lg flex items-center justify-center text-[10px] font-semibold text-white">Checkout ($12.00)</div>
                </div>

                {/* 2. Candidate clipped on top based on sliderVal */}
                <div
                  className="absolute inset-y-0 left-0 right-0 flex flex-col items-center justify-center p-4 select-none scale-[0.9] border-r border-rose-500 bg-slate-950/95 overflow-hidden"
                  style={{ width: `${sliderVal}%` }}
                >
                  <div className="w-44 flex flex-col items-center justify-center shrink-0">
                    <div className="w-32 bg-slate-800 h-3 rounded mb-2" />
                    <div className="w-24 bg-slate-800 h-2.5 rounded mb-5" />
                    {/* Altered component button */}
                    <div className="w-32 bg-purple-600 h-8 rounded-lg flex items-center justify-center text-[10px] font-semibold text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] relative">
                      Checkout ($12.00)
                      <span className="absolute -inset-0.5 border border-dashed border-rose-500 rounded-lg" />
                    </div>
                  </div>
                </div>

                {/* Label Badges */}
                <div className="absolute top-2 left-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-mono px-1 rounded z-10">BASELINE v1.2.0</div>
                <div className="absolute top-2 right-2 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[8px] font-mono px-1 rounded z-10">CANDIDATE v1.2.1</div>
              </div>
            </div>
          </div>

          {/* Slider input control */}
          <div className="rounded-xl border border-border bg-card/20 p-4 space-y-3 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground/80 flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5 text-primary" /> Visual Slider</span>
              <span className="font-mono text-muted-foreground">{sliderVal}% Split</span>
            </div>
            <input
              type="range" min="0" max="100" value={sliderVal} onChange={e => setSliderVal(Number(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed text-center">Swipe left and right to inspect the precise structural difference. The candidate button is shifted and styled with purple background.</p>
          </div>
        </div>

        {/* Right: Sandbox Terminal logs */}
        <div className="w-80 shrink-0 bg-slate-950/20 border-l border-border flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-[#070b15] shrink-0 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold">Sandbox Execution Logs</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-2 bg-[#050810] text-muted-foreground">
            {BROWSER_LOGS.slice(0, currentLogLine).map((log, i) => (
              <div
                key={i}
                className={`leading-relaxed ${
                  log.includes("MISMATCH") ? "text-rose-400" :
                  log.includes("Diagnostic") ? "text-purple-300" :
                  log.includes("PLAYWRIGHT") ? "text-sky-400/80" : "text-muted-foreground/60"}`}
              >
                <span className="text-muted-foreground/20 mr-1.5 select-none">{i + 1}</span>
                {log}
              </div>
            ))}
            <div className="w-1.5 h-3.5 bg-primary/60 inline-block animate-pulse ml-0.5" />
          </div>
        </div>
      </div>
    </Fade>
  )
}

// 4. Chaos Mutation Hub View
function ChaosMutationView() {
  const [selectedMutant, setSelectedMutant] = useState<Mutant>(MUTANTS[2])
  const [filter, setFilter] = useState<string>("all")

  const filtered = filter === "all" ? MUTANTS : MUTANTS.filter(m => m.status === filter)

  return (
    <Fade k="chaos">
      <div className="p-5 border-b border-border shrink-0 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-base font-semibold">Chaos & Mutation Hub</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Chaos agents inject synthetic faults into code to verify test suite assertion strength.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mutant filter buttons */}
          <div className="flex items-center gap-1 bg-slate-900 border border-border/50 rounded-lg p-0.5 h-8">
            {["all", "killed", "survived"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[10px] px-2.5 h-6 font-mono rounded capitalize transition-all ${filter === f ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Mutants List */}
        <div className="flex-1 overflow-y-auto border-r border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/10 text-muted-foreground/50 text-[10px] uppercase tracking-wider font-mono">
                <th className="text-left px-4 py-2.5 font-normal">Mutant ID</th>
                <th className="text-left px-3 py-2.5 font-normal">Target File</th>
                <th className="text-center px-3 py-2.5 font-normal">Line</th>
                <th className="text-left px-3 py-2.5 font-normal">Mutation Type</th>
                <th className="text-left px-3 py-2.5 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map(mutant => (
                <tr
                  key={mutant.id}
                  onClick={() => setSelectedMutant(mutant)}
                  className={`hover:bg-white/[0.02] cursor-pointer transition-colors ${selectedMutant.id === mutant.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                >
                  <td className="px-4 py-3 font-mono font-medium text-foreground/80">{mutant.id}</td>
                  <td className="px-3 py-3 font-mono text-[11px] text-muted-foreground/60">{mutant.file}</td>
                  <td className="px-3 py-3 text-center font-mono text-muted-foreground/50">{mutant.line}</td>
                  <td className="px-3 py-3 text-muted-foreground/80">
                    {mutant.mutated.startsWith("#") ? "Deletion Mutation" : "Conditional Boundary Shift"}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                      mutant.status === "killed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}>
                      {mutant.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Mutation diff comparator */}
        <div className="w-80 shrink-0 bg-slate-950/20 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-[#070b15] shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-muted-foreground uppercase">{selectedMutant.id}</span>
              <span className={`text-[10px] font-mono uppercase font-semibold ${selectedMutant.status === "killed" ? "text-emerald-400" : "text-rose-400 animate-pulse"}`}>
                {selectedMutant.status}
              </span>
            </div>
            <h2 className="text-xs font-mono text-muted-foreground/80 truncate mt-1">{selectedMutant.file} : L{selectedMutant.line}</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Diff Arena */}
            <div className="space-y-2">
              <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/50">Abstract Syntax Tree Mutation</div>
              <div className="rounded-lg border border-border/40 bg-slate-950 overflow-hidden font-mono text-[10px] p-2.5 space-y-2 leading-relaxed">
                <div className="bg-rose-500/10 text-rose-300 p-1.5 rounded border border-rose-500/25">
                  <span className="text-rose-500/50 mr-1.5 select-none">-</span>
                  {selectedMutant.original}
                </div>
                <div className="bg-emerald-500/10 text-emerald-300 p-1.5 rounded border border-emerald-500/25">
                  <span className="text-emerald-500/50 mr-1.5 select-none">+</span>
                  {selectedMutant.mutated}
                </div>
              </div>
            </div>

            {/* Audit / Resiliency Diagnostic */}
            <div className="space-y-2">
              <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/50">Chaos Diagnosis</div>
              <div className="rounded-lg border border-border bg-card/40 p-3 space-y-2.5">
                {selectedMutant.status === "killed" ? (
                  <>
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <CheckCircle className="w-4 h-4" />
                      <span>Resilient test coverage</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                      This mutation was caught and killed by the test <span className="font-mono text-foreground">{selectedMutant.killedBy}</span>. The test suite successfully detected the modification. No action required.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
                      <AlertCircle className="w-4 h-4" />
                      <span>Coverage Vulnerability</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                      This mutation <span className="text-foreground">survived</span>. Commenting out the audit logger did not trigger any unit test failures, leaving a silent regression gap in our compliance logging logic.
                    </p>
                    <div className="border-t border-border/40 pt-2.5 mt-2 flex justify-end">
                      <button className="text-[10px] h-6 rounded bg-rose-500/15 border border-rose-500/25 text-rose-400 hover:bg-rose-500/25 transition-colors font-medium px-2.5">
                        Ask Agent to Write Test
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fade>
  )
}

// 5. AIVCS Test Versioning View
function AIVCSTestVersioningView() {
  const [activeBranch, setActiveBranch] = useState<string>("main")
  const [timeTraveling, setTimeTraveling] = useState<boolean>(false)
  const [targetCommit, setTargetCommit] = useState<string | null>(null)

  const triggerTimeTravel = (sha: string) => {
    setTimeTraveling(true)
    setTargetCommit(sha)
    setTimeout(() => {
      setTimeTraveling(false)
      setTargetCommit(null)
    }, 2500)
  }

  return (
    <Fade k="versioning">
      <div className="p-5 border-b border-border shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold">AIVCS Versioning Controls</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Check out, snapshot, and run regression tests against any historical commit.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Select Branch:</span>
          <select
            value={activeBranch} onChange={e => setActiveBranch(e.target.value)}
            className="bg-[#111e35] border border-border/50 text-xs text-foreground px-2.5 py-1 rounded outline-none"
          >
            <option value="main">main (HEAD)</option>
            <option value="develop">develop</option>
            <option value="fix/token-expiry">fix/token-expiry</option>
            <option value="feature/ai-checkout">feature/ai-checkout</option>
          </select>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Commit snapshots history */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50">Checkpoint Snapshots Timeline</div>
          <div className="space-y-3 relative pl-6">
            <div className="absolute left-[9px] top-1.5 bottom-1.5 w-px bg-border/40" />
            {AIVCS_COMMITS.map(commit => (
              <div key={commit.sha} className="flex items-start gap-3 relative">
                <div className="w-5 h-5 rounded-full bg-slate-950 border border-border/60 flex items-center justify-center shrink-0 z-10">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
                <div className="flex-1 rounded-xl border border-border/50 bg-card/30 hover:bg-card/70 hover:border-border p-3.5 transition-all flex items-center justify-between group">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-primary">{commit.sha}</span>
                      <span className="text-[10px] text-muted-foreground/50">{commit.time}</span>
                      <span className="text-[10px] text-muted-foreground/50">·</span>
                      <span className="text-[10px] font-mono text-muted-foreground/70">{commit.author}</span>
                    </div>
                    <p className="text-xs text-foreground/80 mt-1 leading-relaxed">{commit.message}</p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-4">
                    <div>
                      <div className="text-xs font-mono font-semibold text-emerald-400">{commit.passRate}% pass</div>
                      <div className="text-[10px] text-muted-foreground">{commit.totalTests} tests</div>
                    </div>
                    <button
                      onClick={() => triggerTimeTravel(commit.sha)}
                      className="text-[10px] font-mono px-2.5 py-1 rounded bg-primary/10 border border-primary/20 text-primary hover:bg-primary/25 transition-all flex items-center gap-1"
                    >
                      <History className="w-3 h-3" /> Time Travel Run
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right time travel simulator loading screen overlay */}
        {timeTraveling && (
          <div className="absolute inset-0 bg-background/90 z-50 flex flex-col items-center justify-center text-center p-10">
            <div className="w-16 h-16 rounded-2xl border border-border bg-card/60 flex items-center justify-center mb-4 relative">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              <History className="w-4 h-4 text-primary absolute bottom-1 right-1" />
            </div>
            <h2 className="text-base font-semibold text-foreground">Time Traveling Execution Sandbox</h2>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">Re-provisioning Nix flake environment for checkpoint <span className="font-mono text-primary font-bold">{targetCommit}</span>. Running 154 unit regression checks...</p>
            <div className="w-48 bg-slate-900 h-1.5 rounded-full overflow-hidden mt-4">
              <div className="bg-primary h-full rounded-full animate-[progress_2.5s_ease-out_infinite]" style={{ width: "100%" }} />
            </div>
          </div>
        )}
      </div>
    </Fade>
  )
}

// 6. Reviews (Human-In-The-Loop) View
function ReviewsView() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [reply, setReply] = useState("")
  const [mutantResolved, setMutantResolved] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const send = () => {
    if (!reply.trim()) return
    setMessages(p => [...p, { role: "supervisor", name: "Jane Taylor", time: "just now", content: reply.trim() }])
    setReply("")

    // Simulated agent response
    setTimeout(() => {
      setMessages(p => [
        ...p,
        {
          role: "agent",
          name: "agent-chaos",
          time: "just now",
          content: "Test suite successfully generated and committed! The audit test asserts both parameters correctly. The mutant MUT-003 is now KILLED. Retrying chaos mutation runs...",
        }
      ])
      setMutantResolved(true)
    }, 2000)
  }

  return (
    <Fade k="reviews">
      <div className="p-5 border-b border-border shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold">Human-In-The-Loop Resolver</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Approve agent-generated code patches and fill test coverage gaps.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Unresolved Vulnerabilities:</span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${mutantResolved ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
            {mutantResolved ? "0 GAPS" : "1 ACTIVE GAP (MUT-003)"}
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Code comparator / Mutant visual review */}
        <div className="flex-1 p-5 flex flex-col gap-4 overflow-y-auto">
          <div className="rounded-xl border border-border bg-card/40 p-4 space-y-3 flex flex-col">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                <span className="text-xs font-semibold">Survived Mutant: Deletion of compliance audit logs</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">services/checkout_service.py : L53</span>
            </div>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Commenting out the line <span className="font-mono bg-slate-900 px-1 py-0.5 rounded text-foreground">self.audit.log(...)</span> during validation didn't fail any tests. This represents a high-risk compliance gap where token refreshes could silently fail to log events to our audit trails.
            </p>

            <div className="rounded-lg border border-border/40 bg-slate-950 overflow-hidden font-mono text-[10px] p-2.5 space-y-2 leading-relaxed mt-2">
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground/40 mb-1">AST Mutation Code Modification</div>
              <div className="bg-rose-500/10 text-rose-300 p-1.5 rounded border border-rose-500/25">
                <span className="text-rose-500/50 mr-1.5 select-none">-</span>
                self.audit.log('token_refreshed', subject=payload['sub'], cart_id=cart_id)
              </div>
              <div className="bg-emerald-500/10 text-emerald-300 p-1.5 rounded border border-emerald-500/25">
                <span className="text-emerald-500/50 mr-1.5 select-none">+</span>
                # self.audit.log('token_refreshed', subject=payload['sub'], cart_id=cart_id)
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border/40 pt-3 mt-3">
              <span className="text-[10px] text-muted-foreground/60">Generate and run tests automatically to seal this loophole.</span>
              <button
                disabled={mutantResolved}
                onClick={() => {
                  setMessages(p => [
                    ...p,
                    { role: "supervisor", name: "Jane Taylor", time: "just now", content: "Seal this coverage gap. Commit the generated test to AIVCS branch fix/token-expiry." }
                  ])
                  setTimeout(() => {
                    setMessages(p => [
                      ...p,
                      {
                        role: "agent",
                        name: "agent-chaos",
                        time: "just now",
                        content: "Test suite successfully generated and committed! The audit test asserts both parameters correctly. The mutant MUT-003 is now KILLED. Retrying chaos mutation runs...",
                      }
                    ])
                    setMutantResolved(true)
                  }, 2000)
                }}
                className={`text-xs px-3 h-7 rounded font-semibold transition-all ${
                  mutantResolved
                    ? "bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary/80"}`}
              >
                {mutantResolved ? "Gap Sealed successfully" : "Approve & Commit generated test"}
              </button>
            </div>
          </div>
        </div>

        {/* Right chat logs pane */}
        <div className="w-80 shrink-0 bg-slate-950/20 border-l border-border flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-[#070b15] shrink-0 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold">Co-Pilot Test Generator</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-lg p-3 text-[11px] ${
                  msg.role === "agent" ? "bg-white/[0.03] border border-white/[0.06]" : "bg-primary/6 border border-primary/15"}`}
              >
                <div className="flex items-center gap-1.5 mb-2 select-none">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center font-bold shrink-0 ${
                    msg.role === "agent" ? "bg-amber-500/15 text-amber-400" : "bg-primary/15 text-primary"}`}
                    style={{ fontSize: "8px" }}
                  >
                    {msg.role === "agent" ? "A" : "S"}
                  </div>
                  <span className="font-mono text-muted-foreground/70 text-[10px]">{msg.name}</span>
                  <span className="text-muted-foreground/35 ml-auto text-[10px]">{msg.time}</span>
                </div>
                <p className="text-foreground/70 leading-relaxed">{msg.content}</p>
                {msg.codeSnippet && (
                  <pre className="mt-2.5 p-2 rounded bg-slate-950 font-mono text-[9px] text-sky-300 border border-border/40 overflow-x-auto leading-relaxed">
                    {msg.codeSnippet}
                  </pre>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="border-t border-border p-2.5 shrink-0">
            <div className="flex gap-1.5 items-end">
              <textarea
                value={reply} onChange={e => setReply(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Instruct agent to write tests…" rows={2}
                className="flex-1 bg-white/[0.03] border border-border/50 rounded-lg px-2.5 py-2 text-[11px] placeholder:text-muted-foreground/35 outline-none focus:border-primary/30 resize-none text-foreground transition-colors"
              />
              <button onClick={send} className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white hover:bg-primary/80 transition-all hover:scale-105 active:scale-95 shrink-0">
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Fade>
  )
}

// 7. Performance & Vitals Audit View
function PerformanceAuditView() {
  const CWV_METRICS = [
    { name: "Largest Contentful Paint (LCP)", candidate: 1.2, baseline: 2.4, unit: "s", target: "under 2.5s", rating: "optimal" },
    { name: "Interaction to Next Paint (INP)", candidate: 80, baseline: 190, unit: "ms", target: "under 200ms", rating: "optimal" },
    { name: "Cumulative Layout Shift (CLS)", candidate: 0.01, baseline: 0.12, unit: "", target: "under 0.10", rating: "optimal" }
  ]

  return (
    <Fade k="performance">
      <div className="p-5 border-b border-border shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold">Performance & Web Vitals Audit</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Automated visual agents audit web page performance against Core Web Vitals targets.</p>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">Target Domain: aivcs.io</div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Core Web Vitals comparative bars */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {CWV_METRICS.map(metric => (
            <div key={metric.name} className="rounded-xl border border-border bg-card/40 p-4 flex flex-col justify-between h-40">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono tracking-wide uppercase text-muted-foreground/50">Core Web Vital</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-semibold">{metric.rating}</span>
                </div>
                <h3 className="text-xs font-semibold text-foreground/90 mt-1.5 leading-snug">{metric.name}</h3>
              </div>

              <div className="space-y-2 mt-4">
                {/* Candidate score */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-muted-foreground">Candidate branch (v1.2.1)</span>
                    <span className="text-emerald-400 font-semibold">{metric.candidate}{metric.unit}</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${Math.min(100, (metric.candidate / (metric.baseline + 1)) * 100)}%` }} />
                  </div>
                </div>

                {/* Baseline score */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-muted-foreground">Production main (v1.2.0)</span>
                    <span className="text-slate-400 font-semibold">{metric.baseline}{metric.unit}</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                    <div className="bg-slate-400 h-full rounded-full" style={{ width: "80%" }} />
                  </div>
                </div>
              </div>

              <div className="border-t border-border/40 pt-2 mt-2 flex justify-between text-[9px] font-mono text-muted-foreground/50">
                <span>Objective: {metric.target}</span>
                <span className="text-emerald-400/80 font-semibold">Improved!</span>
              </div>
            </div>
          ))}
        </div>

        {/* Diagnostic Waterfalls or Logs */}
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <h3 className="text-xs font-semibold text-foreground/90 uppercase tracking-wider mb-2.5">Asset Loading Audits</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between rounded-lg border border-border/40 bg-slate-950/30 p-2.5 font-mono text-[11px]">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Next.js bundle footprint compression optimal</span>
              </div>
              <span className="text-muted-foreground/60">-140KB saved</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/40 bg-slate-950/30 p-2.5 font-mono text-[11px]">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Asset Fetch Priority enforced for CheckoutHeroImage</span>
              </div>
              <span className="text-muted-foreground/60">-1.2s LCP reduction</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/40 bg-slate-950/30 p-2.5 font-mono text-[11px]">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Preconnect rules injected for stripe.com webhook origins</span>
              </div>
              <span className="text-muted-foreground/60">-110ms DNS lookup</span>
            </div>
          </div>
        </div>
      </div>
    </Fade>
  )
}

// ─── Placeholder View ─────────────────────────────────────────────────────────
function PlaceholderView({ label }: { label: string }) {
  return (
    <Fade k={label}>
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 p-10 select-none">
        <div className="w-12 h-12 rounded-2xl border border-border/50 bg-muted/20 flex items-center justify-center">
          <Settings className="w-5 h-5 text-muted-foreground/40" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground/60">{label}</p>
          <p className="text-xs text-muted-foreground/40 mt-1">Configurable variables and testing webhooks coming soon</p>
        </div>
      </div>
    </Fade>
  )
}

function ApiDocsView() {
  return (
    <Fade k="docs">
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 p-10 select-none">
        <div className="w-12 h-12 rounded-2xl border border-border/50 bg-muted/20 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-muted-foreground/40" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground/60">TestForge API Guides</p>
          <p className="text-xs text-muted-foreground/40 mt-1">Full developer endpoints, webhooks, and sandbox hooks.</p>
        </div>
      </div>
    </Fade>
  )
}

// ─── App Container ────────────────────────────────────────────────────────────
export default function App() {
  const { config } = useRuntimeConfig()
  const { isAuthenticated, isLoading, userLabel, user, logout } = useAuth()

  const displayLabel = userLabel ?? "Jane Taylor"
  const avatarUrl = user?.picture
  const initials = userLabel
    ? userLabel.split(/[@.\s]/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join("") || "U"
    : "JT"
  const [activeNav, setActiveNav] = useState<NavItem>("dashboard")
  const [runs] = useState<TestRun[]>(INITIAL_RUNS)
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(INITIAL_RUNS[0])

  const NAV_ITEMS = [
    { id: "dashboard" as NavItem, label: "Test Overview", icon: LayoutDashboard },
    { id: "runs" as NavItem, label: "Executions History", icon: PlaySquare, badge: runs.filter(r => r.status === "running").length },
    { id: "visual" as NavItem, label: "Visual Sandbox", icon: Eye },
    { id: "chaos" as NavItem, label: "Chaos & Mutation", icon: Flame },
    { id: "versioning" as NavItem, label: "AIVCS Snapshots", icon: GitBranch },
    { id: "reviews" as NavItem, label: "Review Failures", icon: ShieldAlert, badge: 1 },
    { id: "performance" as NavItem, label: "Performance Audit", icon: Gauge },
    { id: "docs" as NavItem, label: "Platform Docs", icon: BookOpen },
    { id: "settings" as NavItem, label: "Settings", icon: Settings },
  ]

  const STATS = [
    { icon: Cpu, value: "4", label: "Automated QA Agents", sub: "agent-visual · active", color: "text-blue-400", bg: "bg-blue-500/10" },
    { icon: Eye, value: "1.42%", label: "Visual Drift Delta", sub: "fix/token-expiry", color: "text-purple-400", bg: "bg-purple-500/10" },
    { icon: Zap, value: "120", label: "Mutation Faults", sub: "117 killed · 3 survived", color: "text-amber-400", bg: "bg-amber-500/10" },
    { icon: CheckCircle, value: "98.2%", label: "Regression Pass Rate", sub: "Monitored via AIVCS", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  ]

  function renderView() {
    switch (activeNav) {
      case "dashboard":
        return <DashboardView setView={setActiveNav} setSelectedRun={setSelectedRun} />
      case "runs":
        return <TestRunsView runs={runs} onSelectRun={setSelectedRun} selectedRun={selectedRun} />
      case "visual":
        return <VisualSandboxView />
      case "chaos":
        return <ChaosMutationView />
      case "versioning":
        return <AIVCSTestVersioningView />
      case "reviews":
        return <ReviewsView />
      case "performance":
        return <PerformanceAuditView />
      case "docs":
        return <ApiDocsView />
      default:
        return <PlaceholderView label={NAV_ITEMS.find(n => n.id === activeNav)?.label ?? activeNav} />
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#030712] text-foreground">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-5 h-5 text-primary animate-spin" />
          <span className="text-xs text-muted-foreground/50 font-medium tracking-wider">Verifying session...</span>
        </div>
      </div>
    )
  }

  if (config?.requireAuth && !isAuthenticated) {
    return <LoginGate />
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden" style={{ fontFamily: "Inter,system-ui,sans-serif" }}>

      {/* ── Top Nav ─── */}
      <header className="h-12 flex items-center gap-3 px-4 border-b border-border shrink-0 select-none bg-gradient-to-r from-[#060a14] to-[#080c17]">
        <div className="flex items-center gap-2.5 w-52 shrink-0">
          <div className="w-5.5 h-5.5 rounded bg-primary flex items-center justify-center shadow-[0_0_10px_rgba(79,133,246,0.3)]">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-bold tracking-[0.25em] uppercase text-foreground/90">AIVCS TestForge</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" title="TestForge Live System active" />
        </div>

        <div className="flex-1 max-w-sm flex items-center gap-2 bg-white/[0.03] border border-border/50 rounded-lg px-2.5 h-7.5">
          <Search className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
          <input className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 outline-none flex-1 min-w-0" placeholder="Search test runs, mutations, visual diffs..." />
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-foreground border border-border/40 rounded-lg px-2.5 h-7.5 transition-all hover:bg-white/[0.03]">
            Active Testing Sandbox <ChevronDown className="w-3 h-3" />
          </button>
          <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-muted-foreground/60 hover:text-foreground transition-all">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
          </button>
          <div
            onClick={logout}
            title="Sign Out"
            className="flex items-center gap-2 text-xs hover:bg-white/[0.03] rounded-lg px-2 h-7.5 transition-all cursor-pointer group"
          >
            {avatarUrl ? (
              <img src={avatarUrl} className="w-5.5 h-5.5 rounded-full object-cover border border-primary/30" alt={displayLabel} />
            ) : (
              <div className="w-5.5 h-5.5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold" style={{ fontSize: "9px" }}>
                {initials}
              </div>
            )}
            <span className="text-muted-foreground/70 font-medium group-hover:text-red-400 transition-colors">
              {displayLabel}
            </span>
            <ChevronDown className="w-3 h-3 text-muted-foreground/40 group-hover:text-red-400 transition-colors" />
          </div>
        </div>
      </header>

      {/* ── Body ─── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ─── */}
        <aside className="w-52 border-r border-border flex flex-col py-3.5 shrink-0 overflow-y-auto select-none bg-[#060a14]">
          <nav className="flex flex-col gap-1 px-2.5">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`relative flex items-center gap-2.5 px-3 h-8 text-xs rounded-lg transition-all ${
                  activeNav === item.id
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "text-muted-foreground/70 hover:text-foreground hover:bg-white/[0.03]"}`}
              >
                {activeNav === item.id && (
                  <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-primary" />
                )}
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] font-mono bg-primary/15 text-primary rounded-md px-1 py-px font-semibold">{item.badge}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-auto px-3.5 pb-2 pt-4 shrink-0">
            <div className="text-[9px] font-mono tracking-[0.2em] uppercase text-muted-foreground/35 mb-2 px-1">Testing Co-Pilot</div>
            <div className="rounded-lg border border-border/50 bg-white/[0.02] p-3">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 mb-2">
                <Cpu className="w-3 h-3 text-primary animate-pulse" />
                <span className="font-mono truncate flex-1">agent-chaos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#22c55e50]" />
                <span className="text-[10px] text-emerald-400">ready for review</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Panel ─── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-b border-border shrink-0 select-none bg-gradient-to-r from-card/10 to-card/20">
            {STATS.map((s, i) => (
              <div
                key={i}
                onClick={() => setActiveNav(i === 0 ? "dashboard" : i === 1 ? "visual" : i === 2 ? "chaos" : "runs")}
                className={`flex items-center gap-3.5 px-5 py-3 ${i < 3 ? "border-r border-border" : ""} hover:bg-white/[0.02] transition-all cursor-pointer text-left`}
              >
                <div className={`p-2 rounded-lg ${s.bg} shrink-0`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold tracking-tight text-foreground">{s.value}</span>
                    <span className="text-[11px] text-muted-foreground/80 font-medium">{s.label}</span>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground/45 mt-0.5 truncate max-w-[150px]">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Routed View Arena */}
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
