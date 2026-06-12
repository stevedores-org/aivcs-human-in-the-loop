import { useState, useEffect, useCallback } from "react";
import type { paths } from "./schema";

type Branch = paths["/branches"]["get"]["responses"]["200"]["content"]["application/json"]["branches"][number];
type PullRequest = paths["/pull-requests/{id}"]["get"]["responses"]["200"]["content"]["application/json"];
type PullRequestDiff = paths["/pull-requests/{id}/diff"]["get"]["responses"]["200"]["content"]["application/json"];
type IntentThread = paths["/pull-requests/{id}/intent"]["get"]["responses"]["200"]["content"]["application/json"];
type CiChecksResponse = paths["/pull-requests/{id}/ci-checks"]["get"]["responses"]["200"]["content"]["application/json"];
type ActivityResponse = paths["/activity"]["get"]["responses"]["200"]["content"]["application/json"];
type BranchesResponse = paths["/branches"]["get"]["responses"]["200"]["content"]["application/json"];

const API_BASE_URL = import.meta.env.VITE_AIVCS_API_URL || "http://localhost:3000";
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "1" || !import.meta.env.VITE_AIVCS_API_URL;

// ---- Mock Data -------------------------------------------------------------
const MOCK_BRANCHES: Branch[] = [
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

const MOCK_PULL_REQUESTS: Record<string, PullRequest> = {
  "pr-125": {
    id: "pr-125",
    number: 125,
    title: "Refactor Authentication Service",
    base: "develop",
    head: "feat/auth-refactor",
    status: "open",
    agent_intent: "Refactored AuthService to implement dependency injection pattern. Extracted TokenService for better separation of concerns. All 47 existing tests pass.",
    ci_summary: { total: 4, succeeded: 3, failed: 0, pending: 1 },
  },
  "pr-126": {
    id: "pr-126",
    number: 126,
    title: "Add rate limiting middleware",
    base: "develop",
    head: "feat/rate-limiting",
    status: "open",
    agent_intent: "Added rate limiting middleware to prevent brute force login attempts on auth endpoints.",
    ci_summary: { total: 3, succeeded: 3, failed: 0, pending: 0 },
  },
};

const MOCK_DIFFS: Record<string, PullRequestDiff> = {
  "pr-125": {
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
+    );`,
      },
    ],
  },
};

const MOCK_INTENTS: Record<string, IntentThread> = {
  "pr-125": {
    thread: [
      {
        role: "agent",
        at: "2026-06-11T14:08:00Z",
        body: "Refactored AuthService to implement dependency injection pattern. Extracted TokenService for better separation of concerns. All 47 existing tests pass.",
      },
      {
        role: "human",
        at: "2026-06-11T14:15:00Z",
        body: "LGTM on the interface extraction. Can you also add rate limiting to the validateUser method? We've had issues with brute force attempts.",
      },
      {
        role: "agent",
        at: "2026-06-11T14:20:00Z",
        body: "⚠ Detected hardcoded JWT_SECRET fallback in line 5. Recommend using environment validation at startup instead of runtime fallback.",
      },
    ],
  },
};

const MOCK_CHECKS: Record<string, CiChecksResponse> = {
  "pr-125": {
    checks: [
      {
        name: "local-ci / fmt",
        status: "completed",
        conclusion: "success",
        url: "https://github.com/stevedores-org/agent-scheduler/actions/runs/1",
      },
      {
        name: "local-ci / clippy",
        status: "completed",
        conclusion: "success",
        url: "https://github.com/stevedores-org/agent-scheduler/actions/runs/1",
      },
      {
        name: "local-ci / test",
        status: "completed",
        conclusion: "success",
        url: "https://github.com/stevedores-org/agent-scheduler/actions/runs/1",
      },
      {
        name: "verify-aivcs-snapshot",
        status: "in_progress",
        conclusion: null,
        url: "https://github.com/stevedores-org/agent-scheduler/actions/runs/1",
      },
    ],
  },
};

const MOCK_ACTIVITY: ActivityResponse = {
  items: [
    { id: "1", kind: "pr.opened", at: "2026-06-11T14:12:00Z", actor: "Optimizer-7", subject: "#125", summary: "Opened PR #125" },
    { id: "2", kind: "ci.passed", at: "2026-06-11T14:08:00Z", actor: "CI/CD Pipeline", subject: "tests", summary: "Tests passed (47/47)" },
    { id: "3", kind: "pr.commented", at: "2026-06-11T14:15:00Z", actor: "Jane Taylor", subject: "#125", summary: "Requested review comments" },
    { id: "4", kind: "ci.failed", at: "2026-06-11T14:18:00Z", actor: "CI/CD Pipeline", subject: "build", summary: "Build failed on step 3/7" },
  ],
  next_cursor: null,
};

// ---- Hooks -----------------------------------------------------------------

export function useBranches() {
  const [data, setData] = useState<BranchesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (USE_MOCKS) {
      setData({ branches: MOCK_BRANCHES });
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${API_BASE_URL}/branches`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch branches");
        return res.json();
      })
      .then((data) => {
        setData(data);
        setError(null);
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export function usePullRequest(id: string) {
  const [data, setData] = useState<PullRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;
    if (USE_MOCKS) {
      setData(MOCK_PULL_REQUESTS[id] || stubPullRequestFallback(id));
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${API_BASE_URL}/pull-requests/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch PR");
        return res.json();
      })
      .then((data) => {
        setData(data);
        setError(null);
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [id]);

  return { data, loading, error };
}

export function usePullRequestDiff(id: string) {
  const [data, setData] = useState<PullRequestDiff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;
    if (USE_MOCKS) {
      setData(MOCK_DIFFS[id] || stubDiffFallback());
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${API_BASE_URL}/pull-requests/${id}/diff`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch diff");
        return res.json();
      })
      .then((data) => {
        setData(data);
        setError(null);
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [id]);

  return { data, loading, error };
}

export function useAgentIntent(prId: string) {
  const [data, setData] = useState<IntentThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(() => {
    if (!prId) return;
    if (USE_MOCKS) {
      setData(MOCK_INTENTS[prId] || { thread: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${API_BASE_URL}/pull-requests/${prId}/intent`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch intent thread");
        return res.json();
      })
      .then((data) => {
        setData(data);
        setError(null);
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [prId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, mutate: fetchData };
}

export function useCIChecks(prId: string) {
  const [data, setData] = useState<CiChecksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!prId) return;
    if (USE_MOCKS) {
      setData(MOCK_CHECKS[prId] || { checks: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${API_BASE_URL}/pull-requests/${prId}/ci-checks`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch CI checks");
        return res.json();
      })
      .then((data) => {
        setData(data);
        setError(null);
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [prId]);

  return { data, loading, error };
}

export function useActivity() {
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (USE_MOCKS) {
      setData(MOCK_ACTIVITY);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${API_BASE_URL}/activity?limit=50`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch activity");
        return res.json();
      })
      .then((data) => {
        setData(data);
        setError(null);
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export async function addComment(prId: string, body: string): Promise<void> {
  if (USE_MOCKS) {
    const thread = MOCK_INTENTS[prId]?.thread || [];
    thread.push({
      role: "human",
      at: new Date().toISOString(),
      body,
    });
    MOCK_INTENTS[prId] = { thread };
    return;
  }

  const response = await fetch(`${API_BASE_URL}/pull-requests/${prId}/comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ body }),
  });

  if (!response.ok) {
    throw new Error("Failed to add comment");
  }
}

// ---- Fallbacks -------------------------------------------------------------
function stubPullRequestFallback(id: string): PullRequest {
  const num = Number.parseInt(id.replace(/\D/g, ""), 10) || 125;
  return {
    id,
    number: num,
    title: `PR #${num}: Wire up Agent Interface`,
    base: "develop",
    head: "feat/agent-ui",
    status: "open",
    agent_intent: "Fallback stub PR intent.",
    ci_summary: { total: 0, succeeded: 0, failed: 0, pending: 0 },
  };
}

function stubDiffFallback(): PullRequestDiff {
  return {
    files: [
      {
        path: "README.md",
        additions: 1,
        deletions: 1,
        patch: "@@ -1,1 +1,1 @@\n-Mocked content\n+Real fetched content\n",
      },
    ],
  };
}
