import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { StatCards } from "./components/StatCards";
import { PRDiffPanel } from "./components/PRDiffPanel";
import { AgentIntentPanel } from "./components/AgentIntentPanel";
import { AuditTrail } from "./components/AuditTrail";
import { BranchGraph } from "./components/BranchGraph";
import { CIChecks } from "./components/CIChecks";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "sonner";
import { toast } from "sonner";
import { useAuth } from "../lib/auth/AuthProvider";
import { useRuntimeConfig } from "../lib/config/ConfigProvider";
import {
  useBranches,
  usePullRequest,
  usePullRequestDiff,
  useAgentIntent,
  useCIChecks,
  useActivity,
  useAddComment,
  useDashboardStats,
  usePullRequestActions,
  branchPullRequestId,
  selectDefaultPullRequestId,
} from "../lib/api";
import { DemoBanner } from "./components/DemoBanner";
import { LoginGate } from "./components/LoginGate";

function DashboardContent() {
  const {
    data: branches,
    isLoading: isLoadingBranches,
    error: errorBranches,
  } = useBranches();

  const [activePrId, setActivePrId] = useState<string | null>(null);

  useEffect(() => {
    if (activePrId || isLoadingBranches) return;
    const defaultId = selectDefaultPullRequestId(branches);
    if (defaultId) setActivePrId(defaultId);
  }, [branches, isLoadingBranches, activePrId]);

  const prId = activePrId ?? "";

  const {
    data: pullRequest,
    isLoading: isLoadingPR,
    error: errorPR,
  } = usePullRequest(prId);

  const {
    data: diff,
    isLoading: isLoadingDiff,
    error: errorDiff,
  } = usePullRequestDiff(prId);

  const {
    data: intentThread,
    isLoading: isLoadingIntent,
    error: errorIntent,
    refetch: refetchIntent,
  } = useAgentIntent(prId);

  const {
    data: checks,
    isLoading: isLoadingChecks,
    error: errorChecks,
  } = useCIChecks(prId);

  const {
    data: activity,
    isLoading: isLoadingActivity,
    error: errorActivity,
  } = useActivity({ limit: 50 });

  const { addComment, isMutating: isAddingComment } = useAddComment(prId);
  const { runAction, isMutating: isRunningAction } = usePullRequestActions(prId);
  const dashboardStats = useDashboardStats();

  const handleSelectBranch = (branchName: string) => {
    const branch = branches?.find((b) => b.name === branchName);
    if (branch) {
      setActivePrId(branchPullRequestId(branch));
    }
  };

  const handleAddComment = async (body: string) => {
    const res = await addComment(body);
    refetchIntent();
    return res;
  };

  const activeBranch = branches?.find(
    (b) => branchPullRequestId(b) === activePrId || b.id === activePrId,
  );
  const activeBranchName = activeBranch?.name ?? pullRequest?.head ?? "—";

  const handleReviewAction = async (
    action: "approve" | "merge" | "flag" | "request-changes",
    label: string,
  ) => {
    try {
      await runAction(action);
      toast.success(`${label} recorded for PR #${pullRequest?.number ?? ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${label.toLowerCase()}`);
    }
  };

  return (
    <div
      className="flex flex-1 min-h-0 w-full overflow-hidden bg-background text-foreground"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <Sidebar
        branches={branches}
        activeBranchName={activeBranchName}
        onSelectBranch={handleSelectBranch}
        isLoading={isLoadingBranches}
        error={errorBranches}
      />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-hidden p-3 flex flex-col gap-3 min-h-0">
          {/* Stat cards row */}
          <StatCards stats={dashboardStats} />

          {/* Middle row: PR Diff + Agent Intent */}
          <div className="flex gap-3 flex-1 min-h-0" style={{ minHeight: 0, flex: "1 1 0" }}>
            {/* PR Diff — takes most of the space */}
            <div className="flex flex-col min-h-0" style={{ flex: "3 1 0" }}>
              <PRDiffPanel
                pullRequest={pullRequest}
                diff={diff}
                isLoading={isLoadingPR || isLoadingDiff}
                error={errorPR || errorDiff}
                isActionPending={isRunningAction}
                onApprove={() => handleReviewAction("approve", "Approve")}
                onMerge={() => handleReviewAction("merge", "Merge")}
                onFlag={() => handleReviewAction("flag", "Flag for review")}
                onRequestChanges={() => handleReviewAction("request-changes", "Request changes")}
              />
            </div>

            {/* Agent Intent panel */}
            <div className="flex flex-col min-h-0" style={{ flex: "1.2 1 0" }}>
              <AgentIntentPanel
                intentThread={intentThread}
                isLoading={isLoadingIntent}
                error={errorIntent}
                onAddComment={handleAddComment}
                isAddingComment={isAddingComment}
              />
            </div>
          </div>

          {/* Bottom row: Audit Trail + Branch Graph + CI Checks */}
          <div className="flex gap-3" style={{ height: "200px", minHeight: "200px" }}>
            <div style={{ flex: "1 1 0" }} className="min-w-0 h-full">
              <AuditTrail
                items={activity?.items ?? null}
                isLoading={isLoadingActivity}
                error={errorActivity}
              />
            </div>
            <div style={{ flex: "1.5 1 0" }} className="min-w-0 h-full">
              <BranchGraph branches={branches} />
            </div>
            <div style={{ flex: "1 1 0" }} className="min-w-0 h-full">
              <CIChecks
                checks={checks}
                isLoadingChecks={isLoadingChecks}
                errorChecks={errorChecks}
                activities={activity?.items ?? null}
                isLoadingActivities={isLoadingActivity}
                errorActivities={errorActivity}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { config, isLoading: configLoading } = useRuntimeConfig();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  if (configLoading || authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <p className="text-muted-foreground" style={{ fontSize: "14px" }}>
          Loading…
        </p>
      </div>
    );
  }

  if (config?.requireAuth && !isAuthenticated) {
    return <LoginGate />;
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen w-screen flex-col overflow-hidden">
        <DemoBanner />
        <DashboardContent />
      </div>
      <Toaster theme="dark" closeButton position="top-right" />
    </ErrorBoundary>
  );
}
