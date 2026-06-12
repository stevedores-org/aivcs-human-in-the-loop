import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { StatCards } from "./components/StatCards";
import { PRDiffPanel } from "./components/PRDiffPanel";
import { AgentIntentPanel } from "./components/AgentIntentPanel";
import { AuditTrail } from "./components/AuditTrail";
import { BranchGraph } from "./components/BranchGraph";
import { CIChecks } from "./components/CIChecks";

import {
  usePullRequest,
  usePullRequestDiff,
  useAgentIntent,
  useCIChecks,
  useActivity,
  addComment,
} from "../lib/api/client";

export default function App() {
  const [activePrId] = useState<string>("pr-125");

  const { data: pr, loading: prLoading, error: prError } = usePullRequest(activePrId);
  const { data: diff, loading: diffLoading, error: diffError } = usePullRequestDiff(activePrId);
  const { data: intent, loading: intentLoading, error: intentError, mutate: mutateIntent } = useAgentIntent(activePrId);
  const { data: checks, loading: checksLoading, error: checksError } = useCIChecks(activePrId);
  const { data: activity, loading: activityLoading, error: activityError } = useActivity();

  const handleAddComment = async (body: string) => {
    try {
      await addComment(activePrId, body);
      mutateIntent();
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const isGlobalError = prError || diffError || intentError || checksError || activityError;

  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-background text-foreground"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />

        {isGlobalError ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="text-red-400 text-lg font-bold mb-2">Error Loading Dashboard</div>
            <div className="text-muted-foreground text-sm max-w-md">
              We encountered a problem fetching the data-fabric status. Make sure the aivcs-api service is running at http://localhost:3000 or set VITE_USE_MOCKS=1 for design preview mode.
            </div>
          </div>
        ) : (
          <main className="flex-1 overflow-hidden p-3 flex flex-col gap-3 min-h-0">
            {/* Stat cards row */}
            <StatCards />

            {/* Middle row: PR Diff + Agent Intent */}
            <div className="flex gap-3 flex-1 min-h-0" style={{ minHeight: 0, flex: "1 1 0" }}>
              {/* PR Diff — takes most of the space */}
              <div className="flex flex-col min-h-0" style={{ flex: "3 1 0" }}>
                {prLoading || diffLoading || !pr || !diff ? (
                  <div className="flex-1 flex items-center justify-center border border-border rounded bg-card text-muted-foreground text-sm">
                    Loading Pull Request & Diff...
                  </div>
                ) : (
                  <PRDiffPanel pr={pr} diff={diff} />
                )}
              </div>

              {/* Agent Intent panel */}
              <div className="flex flex-col min-h-0" style={{ flex: "1.2 1 0" }}>
                {intentLoading || !intent ? (
                  <div className="flex-1 flex items-center justify-center border border-border rounded bg-card text-muted-foreground text-sm">
                    Loading Intent Thread...
                  </div>
                ) : (
                  <AgentIntentPanel
                    comments={intent.thread}
                    onAddComment={handleAddComment}
                  />
                )}
              </div>
            </div>

            {/* Bottom row: Audit Trail + Branch Graph + CI Checks */}
            <div className="flex gap-3" style={{ height: "200px", minHeight: "200px" }}>
              <div style={{ flex: "1 1 0" }} className="min-w-0 h-full">
                {activityLoading || !activity ? (
                  <div className="h-full flex items-center justify-center border border-border rounded bg-card text-muted-foreground text-[11px]">
                    Loading Audit Trail...
                  </div>
                ) : (
                  <AuditTrail items={activity.items} />
                )}
              </div>
              <div style={{ flex: "1.5 1 0" }} className="min-w-0 h-full">
                <BranchGraph />
              </div>
              <div style={{ flex: "1 1 0" }} className="min-w-0 h-full">
                {checksLoading || !checks || activityLoading || !activity ? (
                  <div className="h-full flex items-center justify-center border border-border rounded bg-card text-muted-foreground text-[11px]">
                    Loading CI Checks...
                  </div>
                ) : (
                  <CIChecks checks={checks.checks} activity={activity.items} />
                )}
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
