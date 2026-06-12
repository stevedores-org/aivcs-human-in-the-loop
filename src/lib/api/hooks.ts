import { useState, useEffect, useCallback } from "react";
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
import {
  mockBranches,
  mockPullRequests,
  mockDiffs,
  mockIntentThreads,
  mockCIChecks,
  mockActivity,
} from "./mocks";

// Helper to determine if we should run in mock mode.
// We default to mock mode if VITE_USE_MOCKS is set to '1' or 'true'.
export const shouldUseMocks = (): boolean => {
  return (
    import.meta.env.VITE_USE_MOCKS === "1" ||
    import.meta.env.VITE_USE_MOCKS === "true"
  );
};

// API Base URL resolver.
export const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_AIVCS_API_URL) {
    return import.meta.env.VITE_AIVCS_API_URL;
  }
  const host = window.location.hostname;
  if (host === "aivcs-hitl.lornu.ai") {
    return "https://aivcs-api.lornu.ai";
  }
  if (host === "aivcs-hitl.dev.lornu.ai") {
    return "https://aivcs-api.dev.lornu.ai";
  }
  if (host === "localhost" || host === "127.0.0.1") {
    return "http://localhost:3000";
  }
  return "https://aivcs-api.dev.lornu.ai"; // Default fallback
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
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
  }

  return response.json() as Promise<T>;
};

// In-memory or localStorage cache for mock intent threads to make mutations work in mock mode.
const getMockIntentThread = (prId: string): IntentThread => {
  const key = `mock_thread_${prId}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored) as IntentThread;
    } catch {
      // Fallback if parsing failed
    }
  }
  return mockIntentThreads[prId] || { thread: [] };
};

const saveMockIntentThread = (prId: string, thread: IntentThread) => {
  localStorage.setItem(`mock_thread_${prId}`, JSON.stringify(thread));
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
      // Simulate network latency
      const timer = setTimeout(() => {
        setData(mockBranches);
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
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
      const timer = setTimeout(() => {
        const mock = mockPullRequests[id];
        if (mock) {
          setData(mock);
        } else {
          // Dynamic fallback for any other ID
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
      }, 200);
      return () => clearTimeout(timer);
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
      const timer = setTimeout(() => {
        setData(mockDiffs[id] || { files: [] });
        setIsLoading(false);
      }, 250);
      return () => clearTimeout(timer);
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
      const timer = setTimeout(() => {
        setData(getMockIntentThread(prId));
        setIsLoading(false);
      }, 200);
      return () => clearTimeout(timer);
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
      const timer = setTimeout(() => {
        setData(mockCIChecks[prId]?.checks || []);
        setIsLoading(false);
      }, 200);
      return () => clearTimeout(timer);
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
      const timer = setTimeout(() => {
        const start = cursor ? Number.parseInt(cursor, 10) : 0;
        const end = Math.min(start + limit, mockActivity.length);
        const items = mockActivity.slice(start, end);
        const next_cursor = end < mockActivity.length ? String(end) : null;

        setData({ items, next_cursor });
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
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
