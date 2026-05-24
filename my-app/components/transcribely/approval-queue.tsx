import type {
  FailedClickUpTask,
  Priority,
  PublishedClickUpTask,
  Ticket,
} from "../../lib/transcribely-schemas";
import { EmptyQueue, FilterChip, MetricCard, PriorityBadge, PublishChecklistStatus, StatusBadge } from "./shared";

export function ApprovalQueueScreen({
  allTicketsReviewed,
  failedTaskByTicketId,
  failedTasks,
  isPublishing,
  onCloseTicket,
  onPublish,
  onSelectTicket,
  onToggleReview,
  onUpdateTicket,
  publishError,
  publishingApproved,
  publishedTaskByTicketId,
  publishedTasks,
  reviewedCount,
  reviewedTicketIds,
  selectedTicket,
  ticketCount,
  tickets,
}: {
  allTicketsReviewed: boolean;
  failedTaskByTicketId: Map<string, FailedClickUpTask>;
  failedTasks: FailedClickUpTask[];
  isPublishing: boolean;
  onCloseTicket: () => void;
  onPublish: () => void;
  onSelectTicket: (ticketId: string) => void;
  onToggleReview: (ticketId: string) => void;
  onUpdateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
  publishError: string;
  publishingApproved: boolean;
  publishedTaskByTicketId: Map<string, PublishedClickUpTask>;
  publishedTasks: PublishedClickUpTask[];
  reviewedCount: number;
  reviewedTicketIds: string[];
  selectedTicket: Ticket | undefined;
  ticketCount: number;
  tickets: Ticket[];
}) {
  const pendingReview = Math.max(ticketCount - reviewedTicketIds.length, 0);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-6 border-b border-slate-200 px-6 py-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label="Review queue" tone="blue" />
            <FilterChip label={`${ticketCount} tickets`} active />
            <FilterChip label={`${reviewedTicketIds.length} reviewed`} />
            <FilterChip label={`${pendingReview} pending`} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">
              Approval Queue
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Review the generated task body and acceptance criteria before
              marking each ticket as ready for PM sync.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Generated" value={String(ticketCount)} />
            <MetricCard label="Reviewed" value={String(reviewedTicketIds.length)} />
            <MetricCard label="Pending" value={String(pendingReview)} />
          </div>
        </div>

        <PublishPanel
          allTicketsReviewed={allTicketsReviewed}
          failedTasks={failedTasks}
          isPublishing={isPublishing}
          onPublish={onPublish}
          publishedTasks={publishedTasks}
          publishingApproved={publishingApproved}
          publishError={publishError}
        />
      </div>

      <div className="grid gap-0 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="border-b border-slate-200 xl:border-b-0 xl:border-r xl:border-slate-200">
          <QueueHeader
            reviewedCount={reviewedCount}
            ticketCount={ticketCount}
          />
          <div className="max-h-[760px] overflow-auto p-4">
            {tickets.length === 0 ? (
              <EmptyQueue />
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => {
                  const publishedTask = publishedTaskByTicketId.get(ticket.id);
                  const failedTask = failedTaskByTicketId.get(ticket.id);
                  const isSelected = selectedTicket?.id === ticket.id;
                  const isReviewed = reviewedTicketIds.includes(ticket.id);

                  return (
                    <TicketQueueRow
                      failedTask={failedTask}
                      isReviewed={isReviewed}
                      isSelected={isSelected}
                      key={ticket.id}
                      onClick={() => onSelectTicket(ticket.id)}
                      publishedTask={publishedTask}
                      ticket={ticket}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <TicketDetailPanel
          onCloseTicket={onCloseTicket}
          onUpdateTicket={onUpdateTicket}
          onToggleReview={onToggleReview}
          selectedTicket={selectedTicket}
        />
      </div>
    </section>
  );
}

function QueueHeader({
  reviewedCount,
  ticketCount,
}: {
  reviewedCount: number;
  ticketCount: number;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
      <div>
        <div className="text-sm font-semibold text-slate-900">Tickets</div>
        <div className="text-xs text-slate-500">
          {reviewedCount} of {ticketCount} reviewed
        </div>
      </div>
      <StatusBadge
        label={reviewedCount === ticketCount ? "Ready to sync" : "Review in progress"}
        tone={reviewedCount === ticketCount ? "green" : "amber"}
      />
    </div>
  );
}

function TicketQueueRow({
  failedTask,
  isReviewed,
  isSelected,
  onClick,
  publishedTask,
  ticket,
}: {
  failedTask?: FailedClickUpTask;
  isReviewed: boolean;
  isSelected: boolean;
  onClick: () => void;
  publishedTask?: PublishedClickUpTask;
  ticket: Ticket;
}) {
  return (
    <button
      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
        isSelected
          ? "border-blue-300 bg-blue-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
      onClick={onClick}
      type="button"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-sm font-semibold text-slate-950">
              {ticket.title}
            </div>
            <PriorityBadge priority={ticket.priority} />
          </div>
          <div className="mt-2 line-clamp-2 text-sm text-slate-600">
            {ticket.description}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isReviewed ? (
            <StatusBadge label="Reviewed" tone="green" />
          ) : (
            <StatusBadge label="Pending review" tone="amber" />
          )}
          {publishedTask ? (
            <StatusBadge label="Synced" tone="blue" />
          ) : failedTask ? (
            <StatusBadge label="Failed" tone="red" />
          ) : null}
        </div>
      </div>
    </button>
  );
}

function TicketDetailPanel({
  onCloseTicket,
  onUpdateTicket,
  onToggleReview,
  selectedTicket,
}: {
  onCloseTicket: () => void;
  onUpdateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
  onToggleReview: (ticketId: string) => void;
  selectedTicket: Ticket | undefined;
}) {
  if (!selectedTicket) {
    return (
      <div className="flex min-h-[760px] items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="text-lg font-semibold text-slate-900">
            Select a ticket to review
          </div>
          <div className="mt-2 text-sm text-slate-600">
            Open a generated ticket from the left panel to edit the final body,
            acceptance criteria, and priority before sync.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[760px] flex-col">
        <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              Editable ticket details
            </div>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">
              {selectedTicket.title}
            </h3>
          </div>
          <PriorityBadge priority={selectedTicket.priority} />
        </div>
        <button
          className="mt-3 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-400"
          onClick={onCloseTicket}
          type="button"
        >
          Close
        </button>
        <p className="mt-3 text-sm text-slate-600">
          Update the ticket fields directly, then mark the ticket as reviewed
          once it is ready for PM sync.
        </p>
      </div>

      <div className="flex-1 space-y-6 overflow-auto p-6">
        <div>
          <label
            className="mb-2 block text-sm font-medium text-slate-700"
            htmlFor={`ticket-title-${selectedTicket.id}`}
          >
            Title
          </label>
          <input
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            id={`ticket-title-${selectedTicket.id}`}
            onChange={(event) =>
              onUpdateTicket(selectedTicket.id, { title: event.target.value })
            }
            value={selectedTicket.title}
          />
        </div>

        <div>
          <label
            className="mb-2 block text-sm font-medium text-slate-700"
            htmlFor={`ticket-description-${selectedTicket.id}`}
          >
            Description
          </label>
          <textarea
            className="min-h-36 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            id={`ticket-description-${selectedTicket.id}`}
            onChange={(event) =>
              onUpdateTicket(selectedTicket.id, { description: event.target.value })
            }
            value={selectedTicket.description}
          />
        </div>

        <div>
          <label
            className="mb-2 block text-sm font-medium text-slate-700"
            htmlFor={`ticket-priority-${selectedTicket.id}`}
          >
            Priority
          </label>
          <select
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            id={`ticket-priority-${selectedTicket.id}`}
            onChange={(event) =>
              onUpdateTicket(selectedTicket.id, {
                priority: event.target.value as Priority,
              })
            }
            value={selectedTicket.priority}
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="block text-sm font-medium text-slate-700">
              Acceptance criteria
            </label>
            <button
              className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-400"
              onClick={() =>
                onUpdateTicket(selectedTicket.id, {
                  acceptance_criteria: [
                    ...selectedTicket.acceptance_criteria,
                    "New criterion",
                  ],
                })
              }
              type="button"
            >
              Add criterion
            </button>
          </div>

          <div className="space-y-3">
            {selectedTicket.acceptance_criteria.map((criterion, index) => (
              <div
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                key={`${selectedTicket.id}-${index}`}
              >
                <input
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  onChange={(event) => {
                    const nextCriteria = [...selectedTicket.acceptance_criteria];
                    nextCriteria[index] = event.target.value;
                    onUpdateTicket(selectedTicket.id, {
                      acceptance_criteria: nextCriteria,
                    });
                  }}
                  value={criterion}
                />
                <button
                  className="rounded-full border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-400"
                  onClick={() => {
                    const nextCriteria = selectedTicket.acceptance_criteria.filter(
                      (_, criterionIndex) => criterionIndex !== index,
                    );
                    onUpdateTicket(selectedTicket.id, {
                      acceptance_criteria: nextCriteria,
                    });
                  }}
                  type="button"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          onClick={() => onToggleReview(selectedTicket.id)}
          type="button"
        >
          Mark as reviewed
        </button>
      </div>
    </div>
  );
}

function PublishPanel({
  allTicketsReviewed,
  failedTasks,
  isPublishing,
  onPublish,
  publishedTasks,
  publishingApproved,
  publishError,
}: {
  allTicketsReviewed: boolean;
  failedTasks: FailedClickUpTask[];
  isPublishing: boolean;
  onPublish: () => void;
  publishedTasks: PublishedClickUpTask[];
  publishingApproved: boolean;
  publishError: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Sync gate
          </div>
          <div className="mt-2 text-base font-semibold text-slate-950">
            Publish reviewed tickets
          </div>
        </div>
        <StatusBadge
          label={publishingApproved ? "Approved" : "Waiting"}
          tone={publishingApproved ? "green" : "amber"}
        />
      </div>

      <p className="mt-3 text-sm text-slate-600">
        {allTicketsReviewed
          ? "All tickets have been reviewed and are ready to sync."
          : "Approve every ticket before publishing to ClickUp."}
      </p>

      <div className="mt-4 space-y-3">
        <button
          className="w-full rounded-full bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!allTicketsReviewed || publishingApproved || isPublishing}
          onClick={onPublish}
          type="button"
        >
          {isPublishing
            ? "Syncing to PM tool..."
            : publishingApproved
              ? "Synced"
              : "Sync selected tickets"}
        </button>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Synced" value={String(publishedTasks.length)} />
          <MetricCard label="Failed" value={String(failedTasks.length)} />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {publishedTasks.map((task) => (
          <PublishChecklistStatus key={task.local_ticket_id} task={task} />
        ))}
      </div>

      {publishError ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {publishError}
        </div>
      ) : null}
    </div>
  );
}
