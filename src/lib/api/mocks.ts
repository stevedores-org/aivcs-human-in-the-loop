import type {
  Branch,
  PullRequest,
  PullRequestDiff,
  IntentThread,
  CiCheck,
  Activity,
  ActivityKind,
} from "./types";

type ScenarioBranch = {
  name: string;
  head_sha: string;
  agent_owner: string;
};

type ScenarioCiCheck = {
  name: string;
  status: CiCheck["status"];
  conclusion: CiCheck["conclusion"];
  details_url?: string;
};

type ScenarioAuditEvent = {
  id: string;
  kind: string;
  at: string;
  summary: string;
  actor?: string;
  subject?: string;
};

type DemoScenario = {
  pull_request: PullRequest;
  branches: ScenarioBranch[];
  ci_checks: ScenarioCiCheck[];
  audit_events: ScenarioAuditEvent[];
};

export const mockBranches: Branch[] = [
  {
    id: "br_01",
    name: "feat/agent-thread-ui",
    head_sha: "f1e2d3c4b5a6978800112233445566778899aabb",
    agent_owner: "agent:librarian",
    status: "active",
    pull_request_id: "379",
  },
  {
    id: "br_02",
    name: "fix/login-redirect",
    head_sha: "aabbccddeeff00112233445566778899aabbccdd",
    agent_owner: "agent:codex",
    status: "merged",
    pull_request_id: "pr-125",
  },
  {
    id: "br_03",
    name: "chore/bump-deps",
    head_sha: "00ff11ee22dd33cc44bb55aa66998877665544",
    agent_owner: "agent:dependabot",
    status: "abandoned",
    pull_request_id: "pr-126",
  },
];

export const mockPullRequests: Record<string, PullRequest> = {
  "379": {
    id: "379",
    number: 379,
    title: "Refactor Authentication Service",
    base: "main",
    head: "feature/auth-refactor",
    status: "open",
    agent_intent:
      "Refactored AuthService to implement dependency injection pattern. Extracted TokenService for better separation of concerns. All 47 existing tests pass.",
    ci_summary: { total: 6, succeeded: 5, failed: 1, pending: 0 },
  },
};

export const mockDiffs: Record<string, PullRequestDiff> = {
  "379": {
    files: [
      {
        path: "src/services/AuthService.ts",
        additions: 14,
        deletions: 6,
        patch: `import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

-export class AuthService {
-  private secretKey: string = process.env.JWT_SECRET;
-  private tokenExpiry: string = '24h';
+export class AuthService implements IAuthService {
+  private readonly config: AuthConfig;
+  private readonly tokenService: TokenService;

-  async validateUser(username: string, password: string) {
-    const user = await db.users.findOne({ username });
-    if (!user) return null;
+  async validateUser(credentials: UserCredentials): Promise<AuthResult> {
+    const user = await this.userRepository.findByUsername(
+      credentials.username,
+    );

     const isValid = await bcrypt.compare(
       password, user.passwordHash
     );`,
      },
    ],
  },
};

export const mockIntentThreads: Record<string, IntentThread> = {
  "379": {
    thread: [
      {
        role: "agent",
        at: "2026-06-11T17:20:00Z",
        body: "Refactored AuthService to implement dependency injection pattern. Extracted TokenService for better separation of concerns. All 47 existing tests pass.",
      },
      {
        role: "human",
        at: "2026-06-11T17:23:00Z",
        body: "LGTM on the interface extraction. Can you also add rate limiting to the validateUser method? We've had issues with brute force attempts.",
      },
      {
        role: "agent",
        at: "2026-06-11T17:25:00Z",
        body: "⚠ Detected hardcoded JWT_SECRET fallback in line 5. Recommend using environment validation at startup instead of runtime fallback.",
      },
      {
        role: "human",
        at: "2026-06-11T17:28:00Z",
        body: "Following the AuthConfig pattern. Make sure the TokenService is properly injected in the DI container — see bootstrap.ts line 42.",
      },
    ],
  },
};

export const mockCIChecks: Record<string, { checks: CiCheck[] }> = {
  "379": {
    checks: [
      {
        name: "Unit Tests",
        status: "completed",
        conclusion: "success",
        url: "#",
      },
      {
        name: "Integration Tests",
        status: "completed",
        conclusion: "success",
        url: "#",
      },
      {
        name: "Security Scan",
        status: "completed",
        conclusion: "success",
        url: "#",
      },
      {
        name: "Policy Check",
        status: "completed",
        conclusion: "success",
        url: "#",
      },
      {
        name: "Build (prod)",
        status: "completed",
        conclusion: "failure",
        url: "#",
      },
      {
        name: "Deploy Preview",
        status: "in_progress",
        conclusion: null,
        url: "#",
      },
    ],
  },
};

export const mockActivity: Activity[] = [
  {
    id: "act_1",
    kind: "branch.opened",
    at: "2026-06-11T17:23:00Z",
    actor: "Optimizer-7",
    subject: "a3f891b",
    summary: "Pushed commit",
  },
  {
    id: "act_2",
    kind: "ci.passed",
    at: "2026-06-11T17:20:00Z",
    actor: "SecurityAgent-3",
    subject: "passed",
    summary: "Security scan",
  },
  {
    id: "act_3",
    kind: "pr.commented",
    at: "2026-06-11T17:18:00Z",
    actor: "Jane Taylor",
    subject: "#379",
    summary: "Requested review",
  },
  {
    id: "act_4",
    kind: "ci.failed",
    at: "2026-06-11T17:15:00Z",
    actor: "CI/CD Pipeline",
    subject: "step 3/7",
    summary: "Build failed",
  },
  {
    id: "act_5",
    kind: "pr.opened",
    at: "2026-06-11T17:12:00Z",
    actor: "Optimizer-7",
    subject: "#379",
    summary: "Opened PR",
  },
  {
    id: "act_6",
    kind: "ci.passed",
    at: "2026-06-11T17:08:00Z",
    actor: "CI/CD Pipeline",
    subject: "47/47",
    summary: "Tests passed",
  },
  {
    id: "act_7",
    kind: "pr.merged",
    at: "2026-06-11T17:05:00Z",
    actor: "PolicyAgent-1",
    subject: "auth-rules",
    summary: "Approved policy",
  },
];

export class MockDatabase {
  private loaded = false;
  private listeners: (() => void)[] = [];

  public branches: Branch[] = [];
  public pullRequests: Record<string, PullRequest> = {};
  public diffs: Record<string, PullRequestDiff> = {};
  public intentThreads: Record<string, IntentThread> = {};
  public ciChecks: Record<string, { checks: CiCheck[] }> = {};
  public activity: Activity[] = [];

  constructor() {
    this.initialize();
  }

  public isLoaded() {
    return this.loaded;
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private async initialize() {
    try {
      const listRes = await fetch("/scenarios/scenarios.json");
      if (!listRes.ok) throw new Error("no scenarios list");
      const list = (await listRes.json()) as string[];

      const scenarios = (await Promise.all(
        list.map(async (id) => {
          const res = await fetch(`/scenarios/${id}/seed.json`);
          if (!res.ok) throw new Error(`failed to load scenario ${id}`);
          return res.json();
        })
      )) as DemoScenario[];

      const branchesList: Branch[] = [];
      const prs: Record<string, PullRequest> = {};
      const diffsList: Record<string, PullRequestDiff> = {};
      const intentsList: Record<string, IntentThread> = {};
      const checksList: Record<string, { checks: CiCheck[] }> = {};
      let activityList: Activity[] = [];

      for (const scenario of scenarios) {
        const pr = scenario.pull_request;
        const prId = pr.id;

        // Map branches. Each branch needs a unique id (multiple branches per
        // scenario would otherwise collide as React keys) and an explicit
        // pull_request_id so branchPullRequestId resolves to the right PR
        // instead of falling back to the (shared) branch id.
        scenario.branches.forEach((b, i) => {
          branchesList.push({
            id: `${prId}-br-${i}`,
            name: b.name,
            head_sha: b.head_sha,
            agent_owner: b.agent_owner,
            status: "active",
            pull_request_id: prId,
          });
        });

        // Map PullRequest
        prs[prId] = {
          id: prId,
          number: pr.number,
          title: pr.title,
          base: pr.base,
          head: pr.head,
          status: pr.status,
          agent_intent: pr.agent_intent,
          ci_summary: pr.ci_summary,
        };

        // Stub/mock Diff
        diffsList[prId] = {
          files: [
            {
              path: "src/main.rs",
              additions: 15,
              deletions: 4,
              patch: `@@ -1,8 +1,19 @@
-fn main() {
-    println!("Hello World");
-}
+use tracing::{info, warn};
+
+#[tokio::main]
+async fn main() -> Result<(), Box<dyn std::error::Error>> {
+    tracing_subscriber::fmt::init();
+    info!("Initializing AIVCS Lornu Demo Adapter Service");
+
+    // Load private gateway routes for tenant: lornu
+    let route_config = load_gateway_route().await?;
+    info!(?route_config, "Gateway route successfully initialized");
+
+    Ok(())
+}`,
            },
          ],
        };

        // Intent Thread
        intentsList[prId] = {
          thread: [
            {
              role: "agent",
              at: "2026-06-16T10:00:00Z",
              body: pr.agent_intent,
            },
          ],
        };

        // CI Checks
        checksList[prId] = {
          checks: scenario.ci_checks.map((chk) => ({
            name: chk.name,
            status: chk.status,
            conclusion: chk.conclusion,
            url: chk.details_url || "#",
          })),
        };

        // Map Audit Events to Activity
        for (const evt of scenario.audit_events) {
          let kind: ActivityKind = "pr.commented";
          if (evt.kind === "agent_run") kind = "pr.opened";
          else if (evt.kind === "ci_check") {
            kind = evt.summary.toLowerCase().includes("fail") ? "ci.failed" : "ci.passed";
          } else if (evt.kind === "commit") kind = "branch.opened";
          else if (evt.kind === "pr.merged") kind = "pr.merged";

          activityList.push({
            id: evt.id,
            kind,
            at: evt.at,
            actor: evt.actor ?? "system",
            subject: pr.number ? `#${pr.number}` : prId,
            summary: evt.summary,
          });
        }
      }

      // Sort activityList by time descending
      activityList.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

      this.branches = branchesList;
      this.pullRequests = prs;
      this.diffs = diffsList;
      this.intentThreads = intentsList;
      this.ciChecks = checksList;
      this.activity = activityList;

      this.loaded = true;
      this.notify();
    } catch (err) {
      console.warn("Failed to load dynamic scenarios, using static fallback mocks:", err);
      this.branches = mockBranches;
      this.pullRequests = mockPullRequests;
      this.diffs = mockDiffs;
      this.intentThreads = mockIntentThreads;
      this.ciChecks = mockCIChecks;
      this.activity = mockActivity;
      this.loaded = true;
      this.notify();
    }
  }
}

export const mockDb = new MockDatabase();

