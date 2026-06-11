import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { StatCards } from "./components/StatCards";
import { PRDiffPanel } from "./components/PRDiffPanel";
import { AgentIntentPanel } from "./components/AgentIntentPanel";
import { AuditTrail } from "./components/AuditTrail";
import { BranchGraph } from "./components/BranchGraph";
import { CIChecks } from "./components/CIChecks";

export default function App() {
  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-background text-foreground"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-hidden p-3 flex flex-col gap-3 min-h-0">
          {/* Stat cards row */}
          <StatCards />

          {/* Middle row: PR Diff + Agent Intent */}
          <div className="flex gap-3 flex-1 min-h-0" style={{ minHeight: 0, flex: "1 1 0" }}>
            {/* PR Diff — takes most of the space */}
            <div className="flex flex-col min-h-0" style={{ flex: "3 1 0" }}>
              <PRDiffPanel />
            </div>

            {/* Agent Intent panel */}
            <div className="flex flex-col min-h-0" style={{ flex: "1.2 1 0" }}>
              <AgentIntentPanel />
            </div>
          </div>

          {/* Bottom row: Audit Trail + Branch Graph + CI Checks */}
          <div className="flex gap-3" style={{ height: "200px", minHeight: "200px" }}>
            <div style={{ flex: "1 1 0" }} className="min-w-0 h-full">
              <AuditTrail />
            </div>
            <div style={{ flex: "1.5 1 0" }} className="min-w-0 h-full">
              <BranchGraph />
            </div>
            <div style={{ flex: "1 1 0" }} className="min-w-0 h-full">
              <CIChecks />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
