import { EmptyQueue, MetricCard, StatusBadge } from "./shared";
import type { AppScreen } from "./shared";
import type {
  FailedClickUpTask,
  OrchestrationResponse,
  PublishedClickUpTask,
} from "../../lib/transcribely-schemas";

function WorkflowTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function QuickAction({
  description,
  label,
  onClick,
}: {
  description: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-violet-300 hover:bg-violet-50"
      onClick={onClick}
      type="button"
    >
      <p className="text-sm font-semibold text-slate-950">{label}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </button>
  );
}

export function DashboardScreen({
  allTicketsReviewed,
  failedTasks,
  onNavigate,
  publishedTasks,
  publishingApproved,
  response,
  reviewedCount,
  ticketCount,
  transcriptWords,
}: {
  allTicketsReviewed: boolean;
  failedTasks: FailedClickUpTask[];
  onNavigate: (screen: AppScreen) => void;
  publishedTasks: PublishedClickUpTask[];
  publishingApproved: boolean;
  response: OrchestrationResponse | null;
  reviewedCount: number;
  ticketCount: number;
  transcriptWords: number;
}) {
  const pendingReview = Math.max(ticketCount - reviewedCount, 0);

  return (
    <>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">
              Transcribely AI Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Workflow overview
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Monitor transcript processing, ticket readiness, and project
              management sync status from one operations dashboard.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm"
              onClick={() => onNavigate("Transcript Analyzer")}
              type="button"
            >
              Analyze transcript
            </button>
            <button
              className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm"
              onClick={() => onNavigate("Approval Queue")}
              type="button"
            >
              Open approval queue
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Generated tickets" value={String(ticketCount)} />
          <MetricCard label="Pending review" value={String(pendingReview)} />
          <MetricCard
            label="PM sync"
            value={publishingApproved ? "Synced" : "Waiting"}
          />
          <MetricCard label="Transcript words" value={String(transcriptWords)} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Pipeline
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                Current workflow status
              </h2>
            </div>
            <StatusBadge
              failed={failedTasks.length > 0}
              published={publishingApproved}
              reviewed={allTicketsReviewed}
            >
              {publishingApproved
                ? "Synced"
                : allTicketsReviewed
                  ? "Ready to sync"
                  : "Needs review"}
            </StatusBadge>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <WorkflowTile
              label="Transcript analyzed"
              value={response ? "Complete" : "Pending"}
            />
            <WorkflowTile
              label="Tickets reviewed"
              value={`${reviewedCount}/${ticketCount}`}
            />
            <WorkflowTile
              label="Published tasks"
              value={String(publishedTasks.length)}
            />
          </div>

          {response ? (
            <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
              {response.executive_summary}
            </p>
          ) : (
            <EmptyQueue />
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Quick actions
          </p>
          <div className="mt-4 space-y-3">
            <QuickAction
              description="Upload or paste a strategy transcript."
              label="Transcript Analyzer"
              onClick={() => onNavigate("Transcript Analyzer")}
            />
            <QuickAction
              description="Inspect generated project-management-ready tickets."
              label="Generated Tickets"
              onClick={() => onNavigate("Generated Tickets")}
            />
            <QuickAction
              description="Approve tickets before publishing."
              label="Approval Queue"
              onClick={() => onNavigate("Approval Queue")}
            />
            <QuickAction
              description="Choose a project management destination and review sync state."
              label="PM Integration"
              onClick={() => onNavigate("PM Integration")}
            />
          </div>
        </div>
      </section>
    </>
  );
}

