import type {
  Priority,
  ProjectManagementProvider,
  PublishedClickUpTask,
} from "../../lib/transcribely-schemas";

export const workflowSteps = [
  "Transcript cleaner",
  "Requirements extractor",
  "Ticket generator",
  "Approval package",
] as const;

export const navItems = [
  "Dashboard",
  "Transcript Analyzer",
  "Generated Tickets",
  "Approval Queue",
  "PM Integration",
  "Settings",
] as const;

export type AppScreen = (typeof navItems)[number];

const providerConfigs = {
  clickup: {
    id: "clickup",
    name: "ClickUp",
    live: true,
    description: "Publish reviewed tickets as ClickUp tasks with native checklists.",
    authLabel: "ClickUp API Token",
    targetLabel: "Target List ID",
    defaultStatus: "to do",
    fieldMapping: [
      ["AI ticket title", "ClickUp task name"],
      ["AI description", "Task description"],
      ["Priority", "ClickUp priority"],
      ["Acceptance criteria", "Native checklist items"],
      ["ai-generated", "ClickUp tag"],
    ],
  },
  jira: {
    id: "jira",
    name: "Jira",
    live: false,
    description: "Preview issue mapping for future Jira project publishing.",
    authLabel: "Jira API Token",
    targetLabel: "Project Key",
    defaultStatus: "Backlog",
    fieldMapping: [
      ["AI ticket title", "Jira issue summary"],
      ["AI description", "Jira issue description"],
      ["Priority", "Jira priority"],
      ["Acceptance criteria", "Description checklist section"],
      ["ai-generated", "Jira label"],
    ],
  },
  trello: {
    id: "trello",
    name: "Trello",
    live: false,
    description: "Preview card and checklist mapping for future Trello boards.",
    authLabel: "Trello API Token",
    targetLabel: "Target List ID",
    defaultStatus: "To Do",
    fieldMapping: [
      ["AI ticket title", "Trello card name"],
      ["AI description", "Card description"],
      ["Priority", "Card label"],
      ["Acceptance criteria", "Trello checklist items"],
      ["ai-generated", "Card label"],
    ],
  },
  other: {
    id: "other",
    name: "Other PM",
    live: false,
    description: "Reserve a generic adapter path for other project tools.",
    authLabel: "API Credential",
    targetLabel: "Workspace or Board ID",
    defaultStatus: "Draft",
    fieldMapping: [
      ["AI ticket title", "Task name"],
      ["AI description", "Task body"],
      ["Priority", "Priority field"],
      ["Acceptance criteria", "Checklist or description section"],
      ["ai-generated", "Tag or label"],
    ],
  },
} as const satisfies Record<
  ProjectManagementProvider,
  {
    authLabel: string;
    defaultStatus: string;
    description: string;
    fieldMapping: string[][];
    id: ProjectManagementProvider;
    live: boolean;
    name: string;
    targetLabel: string;
  }
>;

export const providerOptions = Object.values(providerConfigs);

export function providerLabel(provider: ProjectManagementProvider) {
  return providerConfigs[provider].name;
}

export function providerConfig(provider: ProjectManagementProvider) {
  return providerConfigs[provider];
}

export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-950">{value}</div>
    </div>
  );
}

export function FilterChip({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
        active
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex w-fit rounded-md px-2.5 py-1 text-xs font-semibold ${priorityClassName(priority)}`}
    >
      {priority}
    </span>
  );
}

export function StatusBadge({
  label,
  tone = "slate",
}: {
  label: string;
  tone?: "slate" | "green" | "amber" | "red" | "blue";
}) {
  const toneClasses: Record<typeof tone, string> = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-rose-100 text-rose-700",
    blue: "bg-blue-100 text-blue-700",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${toneClasses[tone]}`}>
      {label}
    </span>
  );
}

export function PublishChecklistStatus({
  task,
}: {
  task: PublishedClickUpTask;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium text-slate-900">{task.name}</div>
        <StatusBadge
          label={task.status}
          tone={task.status.toLowerCase().includes("done") ? "green" : "blue"}
        />
      </div>
      <div className="mt-2 text-slate-600">
        {task.checklist_created
          ? `${task.checklist_item_count} checklist items synced`
          : "Checklist not created"}
      </div>
      {task.warning ? (
        <div className="mt-2 text-amber-700">{task.warning}</div>
      ) : null}
    </div>
  );
}

function priorityClassName(priority: Priority) {
  if (priority === "High") {
    return "bg-rose-100 text-rose-700";
  }

  if (priority === "Medium") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-emerald-100 text-emerald-700";
}

export function EmptyQueue() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
      <div className="text-lg font-semibold text-slate-900">
        No tickets are ready yet
      </div>
      <div className="mt-2 text-sm text-slate-600">
        Run transcript analysis to generate tickets before reviewing them.
      </div>
    </div>
  );
}
