import type { Branch, Activity } from "./types";

export function branchPullRequestId(branch: Branch): string {
  return branch.pull_request_id ?? branch.id;
}

export function selectDefaultPullRequestId(branches: Branch[] | null | undefined): string | null {
  if (!branches?.length) return null;
  const active = branches.find((b) => b.status === "active");
  const chosen = active ?? branches[0];
  return branchPullRequestId(chosen);
}

export function deriveDashboardStats(
  branches: Branch[] | null | undefined,
  activity: Activity[] | null | undefined,
) {
  const activeAgents = new Set(
    (branches ?? [])
      .filter((b) => b.status === "active")
      .map((b) => b.agent_owner),
  ).size;

  const openReviews = (branches ?? []).filter((b) => b.status === "active").length;

  const approvedRequests = (activity ?? []).filter((item) =>
    item.kind === "pr.commented" || item.summary.toLowerCase().includes("approve"),
  ).length;

  const mergeQueue = (activity ?? []).filter((item) => item.kind === "pr.merged").length;

  return {
    activeAgents,
    openReviews,
    approvedRequests,
    mergeQueue,
  };
}
