import type {
  Branch,
  PullRequest,
  PullRequestDiff,
  IntentThread,
  CiCheck,
  Activity,
} from "./types";

export const mockBranches: Branch[] = [
  {
    id: "br_01",
    name: "feat/agent-thread-ui",
    head_sha: "f1e2d3c4b5a6978800112233445566778899aabb",
    agent_owner: "agent:librarian",
    status: "active",
  },
  {
    id: "br_02",
    name: "fix/login-redirect",
    head_sha: "aabbccddeeff00112233445566778899aabbccdd",
    agent_owner: "agent:codex",
    status: "merged",
  },
  {
    id: "br_03",
    name: "chore/bump-deps",
    head_sha: "00ff11ee22dd33cc44bb55aa66998877665544",
    agent_owner: "agent:dependabot",
    status: "abandoned",
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
