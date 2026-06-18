import {
  Activity as ActivityIcon,
  Compass,
  GitBranch,
  Gauge,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type {
  Activity as ActivityEvent,
  Branch,
  CiCheck,
  PullRequest,
} from "../../lib/api/types";

interface InsightRibbonProps {
  branches: Branch[] | null;
  checks: CiCheck[] | null;
  activity: ActivityEvent[] | null;
  pullRequest: PullRequest | null;
}

function cleanActor(actor?: string): string {
  if (!actor) return "system";
  return actor.replace(/^(agent|human):/, "");
}

function statusCopy(status?: string): string {
  if (!status) return "listening";
  return status.replace(/_/g, " ");
}

export function InsightRibbon({
  branches,
  checks,
  activity,
  pullRequest,
}: InsightRibbonProps) {
  const branchItems = branches ?? [];
  const activeBranches = branchItems.filter((branch) => branch.status === "active");
  const agentCount = new Set(activeBranches.map((branch) => branch.agent_owner)).size;
  const checkItems = checks ?? [];

  const totalChecks = checkItems.length || pullRequest?.ci_summary?.total || 0;
  const succeededChecks = checkItems.length
    ? checkItems.filter((check) => check.conclusion === "success").length
    : pullRequest?.ci_summary?.succeeded ?? 0;
  const failedChecks = checkItems.length
    ? checkItems.filter((check) => check.conclusion && check.conclusion !== "success").length
    : pullRequest?.ci_summary?.failed ?? 0;
  const pendingChecks = checkItems.length
    ? checkItems.filter((check) => check.status !== "completed").length
    : pullRequest?.ci_summary?.pending ?? 0;
  const confidence = totalChecks ? Math.round((succeededChecks / totalChecks) * 100) : 0;

  const latestSignal = activity?.[0];
  const reviewLabel = pullRequest ? `PR #${pullRequest.number}` : "Review stream";
  const signalDetail = latestSignal
    ? `${cleanActor(latestSignal.actor)} - ${latestSignal.summary}`
    : "Waiting for the next agent signal";

  const insightCards = [
    {
      label: "Confidence",
      value: totalChecks ? `${confidence}%` : "--",
      detail: totalChecks
        ? `${succeededChecks}/${totalChecks} checks clear, ${pendingChecks} pending`
        : "No checks reported yet",
      icon: ShieldCheck,
      tone: "text-emerald-300",
      rail: "from-emerald-400/70 to-cyan-300/40",
    },
    {
      label: "Exploration paths",
      value: String(activeBranches.length),
      detail: `${agentCount || 0} active agent${agentCount === 1 ? "" : "s"} opening lanes`,
      icon: Compass,
      tone: "text-sky-300",
      rail: "from-sky-400/70 to-violet-400/40",
    },
    {
      label: "Review flow",
      value: reviewLabel,
      detail: statusCopy(pullRequest?.status),
      icon: Gauge,
      tone: "text-violet-300",
      rail: "from-violet-400/80 to-fuchsia-300/40",
    },
    {
      label: "Latest signal",
      value: failedChecks > 0 ? `${failedChecks} watch` : "live",
      detail: signalDetail,
      icon: ActivityIcon,
      tone: failedChecks > 0 ? "text-amber-300" : "text-blue-300",
      rail: failedChecks > 0 ? "from-amber-400/80 to-red-400/30" : "from-blue-400/70 to-emerald-300/40",
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/75 p-3 shadow-[0_18px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="data-grid-overlay absolute inset-0 opacity-30" aria-hidden="true" />
      <div className="absolute -right-16 -top-20 h-44 w-44 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
      <div className="relative flex items-center gap-3">
        <div className="flex min-w-[230px] items-center gap-3 border-r border-white/10 pr-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 shadow-[0_0_36px_rgba(88,166,255,0.18)]">
            <Sparkles size={17} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Data-driven cockpit
            </p>
            <p className="truncate text-[12px] text-foreground">
              Keep agents lively, auditable, and free to explore with human guardrails.
            </p>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-4 gap-2">
          {insightCards.map(({ label, value, detail, icon: Icon, tone, rail }) => (
            <div
              key={label}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-background/35 px-3 py-2 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-background/50"
            >
              <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${rail}`} />
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  {label}
                </span>
                <Icon size={12} className={tone} />
              </div>
              <div className="truncate font-mono text-[16px] font-semibold leading-tight text-foreground">
                {value}
              </div>
              <div className="mt-1 truncate text-[10px] text-muted-foreground">
                {detail}
              </div>
            </div>
          ))}
        </div>

        <div className="hidden min-w-[106px] items-center gap-2 rounded-xl border border-white/10 bg-background/40 px-3 py-2 xl:flex">
          <GitBranch size={13} className="text-emerald-300" />
          <div>
            <div className="font-mono text-[13px] font-semibold text-foreground">
              {branchItems.length}
            </div>
            <div className="text-[10px] text-muted-foreground">tracked refs</div>
          </div>
        </div>
      </div>
    </section>
  );
}
