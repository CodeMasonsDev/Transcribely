import { EmptyQueue, FilterChip, PriorityBadge, StatusBadge } from "./shared";
import type {
  FailedClickUpTask,
  PublishedClickUpTask,
  Ticket,
} from "../../lib/transcribely-schemas";

export function GeneratedTicketsScreen({
  failedTaskByTicketId,
  onSelectTicket,
  publishedTaskByTicketId,
  reviewedTicketIds,
  tickets,
}: {
  failedTaskByTicketId: Map<string, FailedClickUpTask>;
  onSelectTicket: (ticketId: string) => void;
  publishedTaskByTicketId: Map<string, PublishedClickUpTask>;
  reviewedTicketIds: string[];
  tickets: Ticket[];
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Generated tickets
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            AI ticket library
          </h1>
        </div>
        <FilterChip label={`${tickets.length} total`} />
      </div>

      {tickets.length === 0 ? (
        <EmptyQueue />
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {tickets.map((ticket) => (
            <button
              className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-violet-300 hover:bg-violet-50/40"
              key={ticket.id}
              onClick={() => onSelectTicket(ticket.id)}
              type="button"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  {ticket.id}
                </span>
                <StatusBadge
                  failed={Boolean(failedTaskByTicketId.get(ticket.id))}
                  published={Boolean(publishedTaskByTicketId.get(ticket.id))}
                  reviewed={reviewedTicketIds.includes(ticket.id)}
                >
                  {publishedTaskByTicketId.get(ticket.id)
                    ? "Synced"
                    : reviewedTicketIds.includes(ticket.id)
                      ? "Approved"
                      : "Draft"}
                </StatusBadge>
              </div>
              <h2 className="mt-3 text-base font-semibold text-slate-950">
                {ticket.title}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                {ticket.description}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <PriorityBadge priority={ticket.priority} />
                <FilterChip
                  label={`${ticket.acceptance_criteria.length} criteria`}
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

