import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  Branch,
  PullRequest,
  PullRequestDiff,
  IntentThread,
  CiCheck,
  CiChecksResponse,
  ActivityResponse,
  CommentRequest,
  CommentResponse,
  Message,
} from "./types";
import { getRuntimeConfig } from "../config/runtime-config";
import {
  mockBranches,
  mockPullRequests,
  mockDiffs,
  mockIntentThreads,
  mockCIChecks,
  mockActivity,
  mockDb,
} from "./mocks";

// Helper to determine if we should run in mock mode.
export const shouldUseMocks = (): boolean => {
  const runtime = getRuntimeConfig();
  if (runtime) return runtime.useMocks;
  return (
    import.meta.env.VITE_USE_MOCKS === "1" ||
    import.meta.env.VITE_USE_MOCKS === "true"
  );
};

// API Base URL resolver.
export const getApiBaseUrl = (): string => {
  const runtime = getRuntimeConfig();
  if (runtime?.apiUrl) {
    return runtime.apiUrl;
  }
  if (import.meta.env.VITE_AIVCS_API_URL) {
    return import.meta.env.VITE_AIVCS_API_URL;
  }
  const host = window.location.hostname;
  if (host === "human.aivcs.io" || host === "www.aivcs.io") {
    return "https://api.aivcs.io";
  }
  if (host === "human-dev.aivcs.io") {
    return "https://api-dev.aivcs.io";
  }
  if (host === "aivcs-hitl.lornu.ai") {
    return "https://aivcs-api.lornu.ai";
  }
  if (host === "aivcs-hitl.dev.lornu.ai") {
    return "https://aivcs-api.dev.lornu.ai";
  }
  if (host === "localhost" || host === "127.0.0.1") {
    return "http://localhost:3000";
  }
  return "https://api-dev.aivcs.io";
};

// General JSON fetcher that appends the SSO JWT token if present.
const apiFetch = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem("aivcs_jwt");
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      window.__aivcsHandleUnauthorized?.();
    }
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
  }

  return response.json() as Promise<T>;
};

// In-memory or localStorage cache for mock intent threads to make mutations work in mock mode.
const getMockIntentThread = (prId: string): IntentThread => {
  const actualPrId = (prId === "379" && !mockDb.pullRequests["379"] && mockDb.branches.length > 0)
    ? mockDb.branches[0].id
    : prId;

  const key = `mock_thread_${actualPrId}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored) as IntentThread;
    } catch {
      // Fallback if parsing failed
    }
  }
  return mockDb.intentThreads[actualPrId] || mockIntentThreads[actualPrId] || { thread: [] };
};

const saveMockIntentThread = (prId: string, thread: IntentThread) => {
  const actualPrId = (prId === "379" && !mockDb.pullRequests["379"] && mockDb.branches.length > 0)
    ? mockDb.branches[0].id
    : prId;
  localStorage.setItem(`mock_thread_${actualPrId}`, JSON.stringify(thread));
};

export interface HookResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to retrieve branches.
 */
export function useBranches(): HookResult<Branch[]> {
  const [data, setData] = useState<Branch[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    if (shouldUseMocks()) {
      const updateData = () => {
        setData(mockDb.branches.length > 0 ? mockDb.branches : mockBranches);
        setIsLoading(false);
      };
      updateData();
      return mockDb.subscribe(updateData);
    } else {
      apiFetch<{ branches: Branch[] }>("/branches")
        .then((res) => {
          setData(res.branches);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        });
    }
  }, [tick]);

  return { data, isLoading, error, refetch };
}

/**
 * Hook to retrieve a specific pull request details.
 */
export function usePullRequest(id: string): HookResult<PullRequest> {
  const [data, setData] = useState<PullRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    if (shouldUseMocks()) {
      const updateData = () => {
        const actualId = (id === "379" && !mockDb.pullRequests["379"] && mockDb.branches.length > 0)
          ? mockDb.branches[0].id
          : id;

        const mock = mockDb.pullRequests[actualId] || mockPullRequests[actualId];
        if (mock) {
          setData(mock);
        } else {
          setData({
            id,
            number: Number.parseInt(id, 10) || 379,
            title: `Mock PR #${id}`,
            base: "develop",
            head: `feat/mock-branch-${id}`,
            status: "open",
            agent_intent: "Mock agent intent description",
            ci_summary: { total: 0, succeeded: 0, failed: 0, pending: 0 },
          });
        }
        setIsLoading(false);
      };
      updateData();
      return mockDb.subscribe(updateData);
    } else {
      apiFetch<PullRequest>(`/pull-requests/${id}`)
        .then((res) => {
          setData(res);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        });
    }
  }, [id, tick]);

  return { data, isLoading, error, refetch };
}

/**
 * Hook to retrieve files and patches of a pull request diff.
 */
export function usePullRequestDiff(id: string): HookResult<PullRequestDiff> {
  const [data, setData] = useState<PullRequestDiff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    if (shouldUseMocks()) {
      const updateData = () => {
        const actualId = (id === "379" && !mockDb.pullRequests["379"] && mockDb.branches.length > 0)
          ? mockDb.branches[0].id
          : id;
        setData(mockDb.diffs[actualId] || mockDiffs[actualId] || { files: [] });
        setIsLoading(false);
      };
      updateData();
      return mockDb.subscribe(updateData);
    } else {
      apiFetch<PullRequestDiff>(`/pull-requests/${id}/diff`)
        .then((res) => {
          setData(res);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        });
    }
  }, [id, tick]);

  return { data, isLoading, error, refetch };
}

/**
 * Hook to retrieve the agent intent comment thread.
 */
export function useAgentIntent(prId: string): HookResult<IntentThread> {
  const [data, setData] = useState<IntentThread | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!prId) return;
    setIsLoading(true);
    setError(null);

    if (shouldUseMocks()) {
      const updateData = () => {
        setData(getMockIntentThread(prId));
        setIsLoading(false);
      };
      updateData();
      return mockDb.subscribe(updateData);
    } else {
      apiFetch<IntentThread>(`/pull-requests/${prId}/intent`)
        .then((res) => {
          setData(res);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        });
    }
  }, [prId, tick]);

  return { data, isLoading, error, refetch };
}

/**
 * Hook to retrieve CI checks status for a pull request.
 */
export function useCIChecks(prId: string): HookResult<CiCheck[]> {
  const [data, setData] = useState<CiCheck[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!prId) return;
    setIsLoading(true);
    setError(null);

    if (shouldUseMocks()) {
      const updateData = () => {
        const actualId = (prId === "379" && !mockDb.pullRequests["379"] && mockDb.branches.length > 0)
          ? mockDb.branches[0].id
          : prId;
        setData(mockDb.ciChecks[actualId]?.checks || mockCIChecks[actualId]?.checks || []);
        setIsLoading(false);
      };
      updateData();
      return mockDb.subscribe(updateData);
    } else {
      apiFetch<CiChecksResponse>(`/pull-requests/${prId}/ci-checks`)
        .then((res) => {
          setData(res.checks);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        });
    }
  }, [prId, tick]);

  return { data, isLoading, error, refetch };
}

interface UseActivityOptions {
  limit?: number;
  cursor?: string;
}

/**
 * Hook to retrieve paginated activity timeline.
 */
export function useActivity(options: UseActivityOptions = {}): HookResult<ActivityResponse> {
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  const limit = options.limit ?? 50;
  const cursor = options.cursor;

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    if (shouldUseMocks()) {
      const updateData = () => {
        const activeActivity = mockDb.activity.length > 0 ? mockDb.activity : mockActivity;
        const start = cursor ? Number.parseInt(cursor, 10) : 0;
        const end = Math.min(start + limit, activeActivity.length);
        const items = activeActivity.slice(start, end);
        const next_cursor = end < activeActivity.length ? String(end) : null;

        setData({ items, next_cursor });
        setIsLoading(false);
      };
      updateData();
      return mockDb.subscribe(updateData);
    } else {
      const queryParams = new URLSearchParams();
      queryParams.set("limit", String(limit));
      if (cursor) {
        queryParams.set("cursor", cursor);
      }

      apiFetch<ActivityResponse>(`/activity?${queryParams.toString()}`)
        .then((res) => {
          setData(res);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        });
    }
  }, [limit, cursor, tick]);

  return { data, isLoading, error, refetch };
}

/**
 * Mutation hook to add a comment.
 */
export function useAddComment(prId: string) {
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addComment = useCallback(
    async (body: string): Promise<CommentResponse> => {
      setIsMutating(true);
      setError(null);

      if (shouldUseMocks()) {
        return new Promise<CommentResponse>((resolve) => {
          setTimeout(() => {
            const currentThread = getMockIntentThread(prId);
            const newComment: Message = {
              role: "human",
              at: new Date().toISOString(),
              body,
            };
            currentThread.thread.push(newComment);
            saveMockIntentThread(prId, currentThread);

            setIsMutating(false);
            resolve({ comment: newComment });
          }, 150);
        });
      } else {
        try {
          const res = await apiFetch<CommentResponse>(
            `/pull-requests/${prId}/comment`,
            {
              method: "POST",
              body: JSON.stringify({ body } as CommentRequest),
            },
          );
          setIsMutating(false);
          return res;
        } catch (err) {
          const parsedErr = err instanceof Error ? err : new Error(String(err));
          setError(parsedErr);
          setIsMutating(false);
          throw parsedErr;
        }
      }
    },
    [prId],
  );

  return { addComment, isMutating, error };
}

export type PullRequestAction = "approve" | "merge" | "flag" | "request-changes";

export interface ActionResponse {
  ok: boolean;
  action: PullRequestAction;
  pr_id: string;
}

/**
 * Hook for PR review actions (approve, merge, flag, request-changes).
 */
export function usePullRequestActions(prId: string) {
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const runAction = useCallback(
    async (action: PullRequestAction): Promise<ActionResponse> => {
      if (!prId) {
        throw new Error("No pull request selected");
      }
      setIsMutating(true);
      setError(null);

      if (shouldUseMocks()) {
        return new Promise<ActionResponse>((resolve) => {
          setTimeout(() => {
            setIsMutating(false);
            resolve({ ok: true, action, pr_id: prId });
          }, 200);
        });
      }

      try {
        const res = await apiFetch<ActionResponse>(`/pull-requests/${prId}/${action}`, {
          method: "POST",
        });
        setIsMutating(false);
        return res;
      } catch (err) {
        const parsedErr = err instanceof Error ? err : new Error(String(err));
        setError(parsedErr);
        setIsMutating(false);
        throw parsedErr;
      }
    },
    [prId],
  );

  return { runAction, isMutating, error };
}

/**
 * Aggregated dashboard stats derived from branches + activity (FR-2.3).
 */
export function useDashboardStats() {
  const { data: branches } = useBranches();
  const { data: activity } = useActivity({ limit: 100 });

  return useMemo(() => {
    const activeAgents = new Set(
      (branches ?? []).filter((b) => b.status === "active").map((b) => b.agent_owner),
    ).size;
    const openReviews = (branches ?? []).filter((b) => b.status === "active").length;
    const items = activity?.items ?? [];
    const approvedRequests = items.filter(
      (item) => item.kind === "pr.commented" || item.summary.toLowerCase().includes("approve"),
    ).length;
    const mergeQueue = items.filter((item) => item.kind === "pr.merged").length;

    return { activeAgents, openReviews, approvedRequests, mergeQueue };
  }, [branches, activity]);
}
