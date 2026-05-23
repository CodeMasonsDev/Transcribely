"use client";

import { ChangeEvent, useMemo, useState } from "react";

type Priority = "High" | "Medium" | "Low";

type Ticket = {
  id: string;
  title: string;
  priority: Priority;
  description: string;
  acceptance_criteria: string[];
};

type DepartmentActionItem = {
  department: string;
  action: string;
  owner_type: string;
};

type OrchestrationResponse = {
  executive_summary: string;
  key_decisions: string[];
  open_questions: string[];
  department_action_items: DepartmentActionItem[];
  tickets: Ticket[];
  metadata: {
    model: string;
    ticket_count: number;
    source: "text" | "file";
  };
};

type PublishedClickUpTask = {
  local_ticket_id: string;
  clickup_task_id: string;
  name: string;
  url: string;
  status: string;
  checklist_created: boolean;
  checklist_item_count: number;
  warning?: string | null;
};

type FailedClickUpTask = {
  local_ticket_id: string;
  title: string;
  error: string;
};

type PublishTicketsResponse = {
  created: PublishedClickUpTask[];
  failed: FailedClickUpTask[];
};

type ProjectManagementProvider = "clickup" | "jira" | "trello" | "other";

type ProjectManagementConnectionResponse = {
  provider: ProjectManagementProvider;
  connected: boolean;
  message: string;
  workspace_name?: string | null;
};

const API_URL = "http://127.0.0.1:8000/api/v1/orchestrate";
const STREAM_API_URL = "http://127.0.0.1:8000/api/v1/orchestrate/stream";
const PUBLISH_URL =
  "http://127.0.0.1:8000/api/v1/project-management/publish";
const TEST_CONNECTION_URL =
  "http://127.0.0.1:8000/api/v1/project-management/test-connection";

const workflowSteps = [
  "Transcript cleaner",
  "Requirements extractor",
  "Ticket generator",
  "Approval package",
];

const navItems = [
  "Dashboard",
  "Transcript Analyzer",
  "Generated Tickets",
  "Approval Queue",
  "PM Integration",
  "Settings",
] as const;

type AppScreen = (typeof navItems)[number];

const providerOptions: Array<{
  id: ProjectManagementProvider;
  name: string;
  live: boolean;
  description: string;
}> = [
  {
    id: "clickup",
    name: "ClickUp",
    live: true,
    description: "Publish reviewed tickets as ClickUp tasks with native checklists.",
  },
  {
    id: "jira",
    name: "Jira",
    live: false,
    description: "Preview issue mapping for future Jira project publishing.",
  },
  {
    id: "trello",
    name: "Trello",
    live: false,
    description: "Preview card and checklist mapping for future Trello boards.",
  },
  {
    id: "other",
    name: "Other PM",
    live: false,
    description: "Reserve a generic adapter path for other project tools.",
  },
];

export default function Home() {
  const [activeScreen, setActiveScreen] = useState<AppScreen>("Dashboard");
  const [transcript, setTranscript] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [streamingOutput, setStreamingOutput] = useState("");
  const [response, setResponse] = useState<OrchestrationResponse | null>(null);
  const [reviewedTicketIds, setReviewedTicketIds] = useState<string[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string>("");
  const [publishingApproved, setPublishingApproved] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [selectedProvider, setSelectedProvider] =
    useState<ProjectManagementProvider>("clickup");
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState("");
  const [connectionVerifiedProvider, setConnectionVerifiedProvider] =
    useState<ProjectManagementProvider | "">("");
  const [savedProvider, setSavedProvider] =
    useState<ProjectManagementProvider>("clickup");
  const [publishedTasks, setPublishedTasks] = useState<PublishedClickUpTask[]>(
    [],
  );
  const [failedTasks, setFailedTasks] = useState<FailedClickUpTask[]>([]);

  const tickets = response?.tickets ?? [];
  const ticketsVisible = tickets.length > 0;
  const reviewedCount = reviewedTicketIds.length;
  const selectedTicket = tickets.find(
    (ticket) => ticket.id === selectedTicketId,
  );
  const allTicketsReviewed = ticketsVisible && reviewedCount === tickets.length;
  const publishedTaskByTicketId = useMemo(
    () =>
      new Map(
        publishedTasks.map((task) => [task.local_ticket_id, task] as const),
      ),
    [publishedTasks],
  );
  const failedTaskByTicketId = useMemo(
    () =>
      new Map(failedTasks.map((task) => [task.local_ticket_id, task] as const)),
    [failedTasks],
  );

  const transcriptStats = useMemo(() => {
    const words = transcript.trim().split(/\s+/).filter(Boolean).length;
    const minutesSaved = ticketsVisible ? Math.max(45, tickets.length * 20) : 0;

    return {
      words,
      minutesSaved,
    };
  }, [tickets.length, ticketsVisible, transcript]);

  const resetOutput = () => {
    setResponse(null);
    setPublishingApproved(false);
    setIsPublishing(false);
    setPublishError("");
    setPublishedTasks([]);
    setFailedTasks([]);
    setReviewedTicketIds([]);
    setSelectedTicketId("");
    setActiveStep(-1);
    setStreamingOutput("");
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    setError("");
    resetOutput();

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".txt")) {
      setError("Upload a .txt transcript for this workflow.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setTranscript(String(reader.result ?? ""));
      setFileName(selectedFile.name);
    };
    reader.onerror = () => {
      setError("The transcript file could not be read. Try another .txt file.");
    };
    reader.readAsText(selectedFile);
  };

  const handleGenerate = async () => {
    if (!transcript.trim()) {
      setError(
        "Add a transcript by uploading a .txt file or pasting the full text.",
      );
      return;
    }

    setError("");
    setResponse(null);
    setPublishingApproved(false);
    setPublishError("");
    setPublishedTasks([]);
    setFailedTasks([]);
    setReviewedTicketIds([]);
    setSelectedTicketId("");
    setStreamingOutput("");
    setIsGenerating(true);
    setActiveStep(0);

    const progressTimer = window.setInterval(() => {
      setActiveStep((currentStep) =>
        Math.min(currentStep + 1, workflowSteps.length - 1),
      );
    }, 900);

    try {
      const formData = new FormData();
      formData.append("transcript_text", transcript.trim());

      const result = await fetch(STREAM_API_URL, {
        method: "POST",
        body: formData,
      });

      if (!result.ok) {
        throw new Error(
          "The backend could not stream tickets from this transcript.",
        );
      }

      if (!result.body) {
        throw new Error("The backend did not return a readable stream.");
      }

      const normalized = await readTicketStream(result.body, (chunk) => {
        setStreamingOutput((currentOutput) => currentOutput + chunk);
      });
      setResponse(normalized);
      setSelectedTicketId("");
      setActiveStep(workflowSteps.length - 1);
    } catch (caughtError) {
      setResponse(null);
      setReviewedTicketIds([]);
      setSelectedTicketId("");
      setPublishingApproved(false);
      setPublishError("");
      setPublishedTasks([]);
      setFailedTasks([]);
      setActiveStep(-1);
      setStreamingOutput("");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to connect to the FastAPI backend at http://127.0.0.1:8000.",
      );
    } finally {
      window.clearInterval(progressTimer);
      setIsGenerating(false);
    }
  };

  const toggleTicketReview = (ticketId: string) => {
    setPublishingApproved(false);
    setPublishError("");
    setPublishedTasks([]);
    setFailedTasks([]);

    setReviewedTicketIds((currentIds) => {
      if (currentIds.includes(ticketId)) {
        return currentIds.filter((id) => id !== ticketId);
      }

      return [...currentIds, ticketId];
    });
  };

  const handlePublish = async () => {
    if (!allTicketsReviewed) {
      setPublishError(
        "Review every generated ticket before publishing to a project management tool.",
      );
      return;
    }

    if (selectedProvider !== "clickup") {
      setPublishError(
        `${providerLabel(selectedProvider)} is not connected yet. Select ClickUp to publish reviewed tickets in this version.`,
      );
      return;
    }

    setIsPublishing(true);
    setPublishingApproved(false);
    setPublishError("");
    setPublishedTasks([]);
    setFailedTasks([]);

    try {
      const result = await fetch(PUBLISH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provider: selectedProvider, tickets }),
      });

      const data = (await result.json().catch(() => null)) as
        | PublishTicketsResponse
        | { detail?: string }
        | null;

      if (!result.ok) {
        const message =
          data && "detail" in data && data.detail
            ? data.detail
            : `${providerLabel(selectedProvider)} publishing failed. Check backend configuration and retry.`;
        throw new Error(message);
      }

      if (!data || !("created" in data) || !("failed" in data)) {
        throw new Error(
          "The backend returned an invalid project management publish response.",
        );
      }

      setPublishedTasks(data.created);
      setFailedTasks(data.failed);
      setPublishingApproved(
        data.created.length === tickets.length && data.failed.length === 0,
      );

      if (data.failed.length > 0) {
        setPublishError(
          `${data.failed.length} ticket${
            data.failed.length === 1 ? "" : "s"
          } failed to publish. Review the failed task messages below.`,
        );
      }
    } catch (caughtError) {
      setPublishError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to connect to the project management publishing endpoint.",
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionMessage("");

    try {
      const result = await fetch(TEST_CONNECTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provider: selectedProvider }),
      });

      const data = (await result.json().catch(() => null)) as
        | ProjectManagementConnectionResponse
        | { detail?: string }
        | null;

      if (!result.ok) {
        const message =
          data && "detail" in data && data.detail
            ? data.detail
            : `${providerLabel(selectedProvider)} connection test failed.`;
        throw new Error(message);
      }

      if (!data || !("message" in data)) {
        throw new Error("The backend returned an invalid connection response.");
      }

      setConnectionMessage(data.message);
      setConnectionVerifiedProvider(data.connected ? data.provider : "");
    } catch (caughtError) {
      setConnectionVerifiedProvider("");
      setConnectionMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to test the project management connection.",
      );
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveConfiguration = () => {
    setSavedProvider(selectedProvider);
    if (selectedProvider === "clickup") {
      setConnectionMessage(
        connectionVerifiedProvider === "clickup"
          ? "ClickUp configuration saved. You can transcribe now and sync reviewed tickets when ready."
          : "ClickUp selected. Use Test Connection to verify the configured backend credentials before publishing.",
      );
      return;
    }

    setConnectionVerifiedProvider("");
    setConnectionMessage(
      `${providerLabel(selectedProvider)} setup preview saved. Live publishing is not connected yet, but this destination is ready for future configuration.`,
    );
  };

  return (
    <main className="min-h-screen bg-[#f6f7fb] text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 px-5 py-5">
              <div className="flex items-center gap-3">
                <img
                  src="/icon/transcribe_logo.png"
                  alt="Transcribely Logo"
                  className="h-10 w-10 object-contain rounded-lg"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Transcribely
                  </p>
                  <p className="text-xs text-slate-500">Workspace Admin</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
              {navItems.map((item) => (
                <button
                  key={item}
                  onClick={() => setActiveScreen(item)}
                  type="button"
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium ${
                    item === activeScreen
                      ? "bg-violet-600 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  <span>{item}</span>
                  {(item === "Approval Queue" ||
                    item === "Generated Tickets") &&
                  tickets.length > 0 ? (
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        item === activeScreen ? "bg-white/20" : "bg-slate-100"
                      }`}
                    >
                      {tickets.length}
                    </span>
                  ) : null}
                </button>
              ))}
            </nav>

            <div className="border-t border-slate-200 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                PM sync
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-50 border border-slate-100 p-0.5 shadow-sm">
                  <ProviderLogo provider={selectedProvider} className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  {publishingApproved
                    ? `${providerLabel(selectedProvider)} synced`
                    : `${providerLabel(selectedProvider)} selected`}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <TopBar selectedProvider={selectedProvider} />

          <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
            {activeScreen === "Dashboard" ? (
              <DashboardScreen
                allTicketsReviewed={allTicketsReviewed}
                failedTasks={failedTasks}
                onNavigate={setActiveScreen}
                publishedTasks={publishedTasks}
                publishingApproved={publishingApproved}
                response={response}
                reviewedCount={reviewedCount}
                ticketCount={tickets.length}
                transcriptWords={transcriptStats.words}
              />
            ) : null}

            {activeScreen === "Transcript Analyzer" ? (
              <TranscriptAnalyzerScreen
                activeStep={activeStep}
                error={error}
                fileName={fileName}
                isGenerating={isGenerating}
                onFileUpload={handleFileUpload}
                onGenerate={handleGenerate}
                onTranscriptChange={(value) => {
                  setTranscript(value);
                  setError("");
                  resetOutput();
                }}
                response={response}
                streamingOutput={streamingOutput}
                transcript={transcript}
                words={transcriptStats.words}
              />
            ) : null}

            {activeScreen === "Generated Tickets" ? (
              <GeneratedTicketsScreen
                failedTaskByTicketId={failedTaskByTicketId}
                onSelectTicket={(ticketId) => {
                  setSelectedTicketId(ticketId);
                  setActiveScreen("Approval Queue");
                }}
                publishedTaskByTicketId={publishedTaskByTicketId}
                reviewedTicketIds={reviewedTicketIds}
                tickets={tickets}
              />
            ) : null}

            {activeScreen === "Approval Queue" ? (
              <ApprovalQueueScreen
                allTicketsReviewed={allTicketsReviewed}
                failedTaskByTicketId={failedTaskByTicketId}
                failedTasks={failedTasks}
                isPublishing={isPublishing}
                onPublish={handlePublish}
                onSelectTicket={setSelectedTicketId}
                onCloseTicket={() => setSelectedTicketId("")}
                onToggleReview={toggleTicketReview}
                publishError={publishError}
                publishedTaskByTicketId={publishedTaskByTicketId}
                publishedTasks={publishedTasks}
                publishingApproved={publishingApproved}
                reviewedCount={reviewedCount}
                reviewedTicketIds={reviewedTicketIds}
                selectedTicket={selectedTicket}
                tickets={tickets}
              />
            ) : null}

            {activeScreen === "PM Integration" ? (
              <ProjectManagementIntegrationScreen
                allTicketsReviewed={allTicketsReviewed}
                failedTasks={failedTasks}
                isPublishing={isPublishing}
                isTestingConnection={isTestingConnection}
                connectionMessage={connectionMessage}
                connectionVerifiedProvider={connectionVerifiedProvider}
                onPublish={handlePublish}
                onProviderChange={(provider) => {
                  setSelectedProvider(provider);
                  setPublishError("");
                  setConnectionMessage("");
                }}
                onSaveConfiguration={handleSaveConfiguration}
                onTestConnection={handleTestConnection}
                publishError={publishError}
                publishedTasks={publishedTasks}
                publishingApproved={publishingApproved}
                savedProvider={savedProvider}
                selectedProvider={selectedProvider}
                ticketCount={tickets.length}
              />
            ) : null}

            {activeScreen === "Settings" ? <SettingsScreen /> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardScreen({
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
          <MetricCard
            label="Transcript words"
            value={String(transcriptWords)}
          />
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

function TranscriptAnalyzerScreen({
  activeStep,
  error,
  fileName,
  isGenerating,
  onFileUpload,
  onGenerate,
  onTranscriptChange,
  response,
  streamingOutput,
  transcript,
  words,
}: {
  activeStep: number;
  error: string;
  fileName: string;
  isGenerating: boolean;
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onGenerate: () => void;
  onTranscriptChange: (value: string) => void;
  response: OrchestrationResponse | null;
  streamingOutput: string;
  transcript: string;
  words: number;
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-[440px_minmax(0,1fr)]">
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <TranscriptPanel
          activeStep={activeStep}
          error={error}
          fileName={fileName}
          isGenerating={isGenerating}
          onFileUpload={onFileUpload}
          onGenerate={onGenerate}
          onTranscriptChange={onTranscriptChange}
          transcript={transcript}
          words={words}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
          Analysis preview
        </p>
        {isGenerating ? (
          <StreamingOutputCard
            isGenerating={isGenerating}
            output={streamingOutput}
          />
        ) : response ? (
          <>
            <GeneratedTicketCards tickets={response.tickets} />
          </>
        ) : (
          <div className="mt-4 flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 text-center">
            <p className="text-sm font-semibold text-slate-700">
              No analysis generated yet
            </p>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Generate tickets to see the executive summary, decisions, open
              questions, and department action items.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function GeneratedTicketsScreen({
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

function StreamingOutputCard({
  isGenerating,
  output,
}: {
  isGenerating: boolean;
  output: string;
}) {
  return (
    <div className="mt-4 rounded-lg border border-violet-200 bg-slate-950 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-200">
            Live agent stream
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            Transcribely is generating ticket JSON
          </p>
        </div>
        <span className="rounded-full bg-violet-400/15 px-2.5 py-1 text-xs font-semibold text-violet-100">
          {isGenerating ? "Streaming" : "Complete"}
        </span>
      </div>
      <pre className="max-h-[460px] overflow-auto whitespace-pre-wrap break-words px-4 py-4 text-xs leading-6 text-slate-100">
        {output || "Waiting for the first model token..."}
      </pre>
    </div>
  );
}

function GeneratedTicketCards({ tickets }: { tickets: Ticket[] }) {
  return (
    <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm ">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Ticket cards
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">
            Converted from streamed JSON
          </h3>
        </div>
        <FilterChip label={`${tickets.length} generated`} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2 overflow-y-auto h-[600px]">
        {tickets.map((ticket) => (
          <article
            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            key={ticket.id}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                {ticket.id}
              </span>
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h4 className="mt-3 text-sm font-semibold text-slate-950">
              {ticket.title}
            </h4>
            <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-600">
              {ticket.description}
            </p>
            <p className="mt-3 text-xs font-semibold text-slate-500">
              {ticket.acceptance_criteria.length} acceptance criteria
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ApprovalQueueScreen({
  allTicketsReviewed,
  failedTaskByTicketId,
  failedTasks,
  isPublishing,
  onCloseTicket,
  onPublish,
  onSelectTicket,
  onToggleReview,
  publishError,
  publishedTaskByTicketId,
  publishedTasks,
  publishingApproved,
  reviewedCount,
  reviewedTicketIds,
  selectedTicket,
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
  publishError: string;
  publishedTaskByTicketId: Map<string, PublishedClickUpTask>;
  publishedTasks: PublishedClickUpTask[];
  publishingApproved: boolean;
  reviewedCount: number;
  reviewedTicketIds: string[];
  selectedTicket?: Ticket;
  tickets: Ticket[];
}) {
  const pendingReview = Math.max(tickets.length - reviewedCount, 0);

  return (
    <>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">
              Approval queue
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Ticket review queue
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Review AI-generated tickets, approve readiness, and sync only
              approved work into the selected project management destination.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              type="button"
            >
              Export
            </button>
            <button
              className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={
                !allTicketsReviewed || publishingApproved || isPublishing
              }
              onClick={onPublish}
              type="button"
            >
              {isPublishing
                ? "Syncing to PM tool..."
                : publishingApproved
                  ? "Synced"
                  : "Sync selected tickets"}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total tickets" value={String(tickets.length)} />
          <MetricCard label="Pending review" value={String(pendingReview)} />
          <MetricCard label="Approved" value={String(reviewedCount)} />
          <MetricCard label="Synced" value={String(publishedTasks.length)} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <QueueHeader
            allTicketsReviewed={allTicketsReviewed}
            reviewedCount={reviewedCount}
            ticketCount={tickets.length}
          />
          <div className="flex flex-wrap gap-2">
            <FilterChip label="Assignee: All" />
            <FilterChip label="Date: Last 7 Days" />
          </div>
        </div>

        {tickets.length === 0 ? (
          <EmptyQueue />
        ) : (
          <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
            <div className="grid grid-cols-[40px_minmax(280px,1fr)_110px_130px_110px] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 max-lg:hidden">
              <span />
              <span>Ticket title</span>
              <span>Priority</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            <div className="divide-y divide-slate-200">
              {tickets.map((ticket) => (
                <TicketQueueRow
                  failedTask={failedTaskByTicketId.get(ticket.id)}
                  isSelected={selectedTicket?.id === ticket.id}
                  key={ticket.id}
                  onSelect={onSelectTicket}
                  onToggleReview={onToggleReview}
                  publishedTask={publishedTaskByTicketId.get(ticket.id)}
                  reviewed={reviewedTicketIds.includes(ticket.id)}
                  ticket={ticket}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {selectedTicket ? (
        <TicketDetailPanel
          failedTask={failedTaskByTicketId.get(selectedTicket.id)}
          onClose={onCloseTicket}
          onToggleReview={onToggleReview}
          publishedTask={publishedTaskByTicketId.get(selectedTicket.id)}
          reviewed={reviewedTicketIds.includes(selectedTicket.id)}
          ticket={selectedTicket}
        />
      ) : null}

      <PublishPanel
        failedTasks={failedTasks}
        publishError={publishError}
        publishedTasks={publishedTasks}
        publishingApproved={publishingApproved}
        tickets={tickets}
      />
    </>
  );
}

function ProviderLogo({
  provider,
  className = "h-8 w-8",
}: {
  provider: ProjectManagementProvider;
  className?: string;
}) {
  if (provider === "clickup") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 3.5c-.32 0-.63.14-.85.38L4.35 10.7a1.2 1.2 0 0 0 .85 2.05h3.4v4.5a1.2 1.2 0 0 0 1.2 1.2h4.4a1.2 1.2 0 0 0 1.2-1.2v-4.5h3.4a1.2 1.2 0 0 0 .85-2.05L12.85 3.88a1.18 1.18 0 0 0-.85-.38z"
          fill="url(#clickup-top)"
        />
        <path
          d="M4.52 14.8c-.8.15-1.29 1.02-.9 1.73A8.4 8.4 0 0 0 12 21.2a8.4 8.4 0 0 0 8.38-4.67c.39-.7-.1-1.58-.9-1.73a7.48 7.48 0 0 1-1.3-.1c-.55-.08-.98.37-1 .92a5.4 5.4 0 0 1-10.36 0c-.02-.55-.45-1-1-.92-.28.04-.55.08-.82.1z"
          fill="url(#clickup-bottom)"
        />
        <defs>
          <linearGradient id="clickup-top" x1="4.35" y1="3.5" x2="19.65" y2="12.75" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF4B72" />
            <stop offset="100%" stopColor="#FF7A00" />
          </linearGradient>
          <linearGradient id="clickup-bottom" x1="3.62" y1="14.7" x2="20.38" y2="21.2" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7B00E0" />
            <stop offset="100%" stopColor="#B300E0" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  if (provider === "jira") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12.1 22a2 2 0 0 1-2-2V13.8c0-.6.2-1.2.7-1.6l8-6.8a2 2 0 0 1 3.2 1.5v6.5a2 2 0 0 1-.7 1.5l-7.7 6.6c-.4.4-.9.7-1.5.7z"
          fill="#0052CC"
        />
        <path
          d="M3.7 15a2 2 0 0 1-2-2V6.8c0-.6.2-1.2.7-1.6l8-6.8a2 2 0 0 1 3.2 1.5V6.4a2 2 0 0 1-.7 1.5l-7.7 6.6a2 2 0 0 1-1.5.5z"
          fill="#2684FF"
        />
      </svg>
    );
  }
  if (provider === "trello") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="20" height="20" rx="4" fill="#0079BF" />
        <rect x="6" y="6" width="4.5" height="12" rx="1.5" fill="white" />
        <rect x="13.5" y="6" width="4.5" height="8" rx="1.5" fill="white" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="5" fill="#E2E8F0" />
      <path
        d="M12 6a3 3 0 0 0-3 3v1H8a3 3 0 0 0 0 6h1v1a3 3 0 0 0 6 0v-1h1a3 3 0 0 0 0-6h-1V9a3 3 0 0 0-3-3z"
        fill="#475569"
      />
    </svg>
  );
}

function ProjectManagementIntegrationScreen({
  allTicketsReviewed,
  connectionMessage,
  connectionVerifiedProvider,
  failedTasks,
  isPublishing,
  isTestingConnection,
  onPublish,
  onProviderChange,
  onSaveConfiguration,
  onTestConnection,
  publishError,
  publishedTasks,
  publishingApproved,
  savedProvider,
  selectedProvider,
  ticketCount,
}: {
  allTicketsReviewed: boolean;
  connectionMessage: string;
  connectionVerifiedProvider: ProjectManagementProvider | "";
  failedTasks: FailedClickUpTask[];
  isPublishing: boolean;
  isTestingConnection: boolean;
  onPublish: () => void;
  onProviderChange: (provider: ProjectManagementProvider) => void;
  onSaveConfiguration: () => void;
  onTestConnection: () => void;
  publishError: string;
  publishedTasks: PublishedClickUpTask[];
  publishingApproved: boolean;
  savedProvider: ProjectManagementProvider;
  selectedProvider: ProjectManagementProvider;
  ticketCount: number;
}) {
  const [isConfiguring, setIsConfiguring] = useState(false);

  const selectedConfig = providerConfig(selectedProvider);
  const isClickUp = selectedProvider === "clickup";
  const isVerified = connectionVerifiedProvider === selectedProvider;

  if (!isConfiguring) {
    return (
      <div className="max-w-4xl">
        {/* Unified Integrations Hub Panel */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">
              Integrations
            </p>
            <h1 className="text-xl font-bold tracking-tight text-slate-950 mt-1">
              Project Management Hub
            </h1>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Connect and sync your AI-generated sprint tickets with your team's project management tool. Select a platform to configure credentials and view field mapping.
            </p>
          </div>

          {/* List of Integrations */}
          <div className="divide-y divide-slate-100">
            {providerOptions.map((provider) => {
              let badgeBg = "bg-slate-100 text-slate-600";
              let badgeText = "Available";
              if (provider.id === "clickup") {
                if (connectionVerifiedProvider === "clickup") {
                  badgeBg = "bg-emerald-50 text-emerald-700 border border-emerald-200";
                  badgeText = "Connected";
                } else {
                  badgeBg = "bg-violet-50 text-violet-700 border border-violet-200";
                  badgeText = "Active";
                }
              } else {
                badgeBg = "bg-slate-100 text-slate-500 border border-slate-200";
                badgeText = "Preview";
              }

              return (
                <div
                  key={provider.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 hover:bg-slate-50/50 transition duration-150"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 p-2 shadow-sm">
                      <ProviderLogo provider={provider.id} className="h-7 w-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900">
                          {provider.name}
                        </h3>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badgeBg}`}>
                          {badgeText}
                        </span>
                        {provider.id === "clickup" && (
                          <span className="text-[10px] text-emerald-600 font-medium">
                            • Production-ready
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-xl">
                        {provider.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center sm:self-center self-end shrink-0">
                    <button
                      onClick={() => {
                        onProviderChange(provider.id);
                        setIsConfiguring(true);
                      }}
                      type="button"
                      className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 hover:border-violet-600 hover:text-violet-600 shadow-sm transition duration-150"
                    >
                      Configure settings
                      <svg className="ml-1.5 h-3.5 w-3.5 text-slate-400 group-hover:text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  // Detail View when isConfiguring is true
  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Navigation Breadcrumbs & Back link */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsConfiguring(false)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-violet-600 transition uppercase tracking-wider"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Hub
          </button>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            <span>Integrations</span>
            <span>/</span>
            <span className="text-slate-600">{selectedConfig.name}</span>
          </div>
        </div>

        {/* Detailed Header Card */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 p-2">
                <ProviderLogo provider={selectedProvider} className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-950">
                    {selectedConfig.name} Integration
                  </h1>
                  {selectedProvider === "clickup" ? (
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      isVerified ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-violet-50 text-violet-700 border border-violet-200"
                    }`}>
                      {isVerified ? "Connected" : "Setup Mode"}
                    </span>
                  ) : (
                    <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                      Preview Mode
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500 max-w-xl leading-relaxed">
                  Configure credentials, test connection workspace, and view mapping fields.
                </p>
              </div>
            </div>
            <button
              className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300 shrink-0"
              disabled={
                !isClickUp || !allTicketsReviewed || publishingApproved || isPublishing
              }
              onClick={onPublish}
              type="button"
            >
              {!isClickUp
                ? "Provider not connected"
                : isPublishing
                  ? "Syncing..."
                  : publishingApproved
                    ? "Synced to ClickUp"
                    : "Sync reviewed tickets"}
            </button>
          </div>
        </section>
      </div>

      {!isClickUp ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-800 flex items-center gap-2 shadow-sm">
          <svg className="h-4.5 w-4.5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>
            <strong>{selectedConfig.name}</strong> publishing is not connected yet. You can review the planned field mapping below, but only ClickUp can publish tickets in this version.
          </span>
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Connection status
            </p>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-600">
                  Status
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  {isVerified
                    ? "Verified"
                    : isClickUp
                      ? "Ready to test"
                      : "Preview saved"}
                </span>
              </div>
              <dl className="mt-4 space-y-3 text-xs">
                <div>
                  <dt className="text-slate-500">Connected workspace</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {isVerified
                      ? `${selectedConfig.name} verified`
                      : isClickUp
                        ? "Configured ClickUp List"
                        : `${selectedConfig.name} setup preview`}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Configuration</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {savedProvider === selectedProvider
                      ? "Saved"
                      : "Unsaved changes"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Sync summary
            </p>
            <div className="mt-4 space-y-3">
              <MetricCard
                label="Reviewed tickets"
                value={
                  allTicketsReviewed
                    ? `${ticketCount}/${ticketCount}`
                    : "Incomplete"
                }
              />
              <MetricCard
                label="Created tasks"
                value={String(publishedTasks.length)}
              />
              <MetricCard
                label="Failed tasks"
                value={String(failedTasks.length)}
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Configuration details
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <ReadOnlyConfigField
              label={selectedConfig.authLabel}
              value={isClickUp ? "************************" : "Not connected"}
            />
            <ReadOnlyConfigField
              label={selectedConfig.targetLabel}
              value={
                isClickUp ? "Configured in backend .env" : "Setup required"
              }
            />
            <ReadOnlyConfigField
              label="Default Status"
              value={selectedConfig.defaultStatus}
            />
            <ReadOnlyConfigField label="Default Tag" value="ai-generated" />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              disabled={isTestingConnection}
              onClick={onTestConnection}
              type="button"
            >
              {isTestingConnection ? "Testing..." : "Test Connection"}
            </button>
            <button
              className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-700"
              onClick={onSaveConfiguration}
              type="button"
            >
              Save Configuration
            </button>
          </div>

          {connectionMessage ? (
            <div
              className={`mt-4 rounded-lg border px-3 py-2 text-xs font-medium ${
                isVerified
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : isClickUp
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-blue-200 bg-blue-50 text-blue-800"
              }`}
            >
              {connectionMessage}
            </div>
          ) : null}

          {isVerified ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
              <p className="text-xs font-bold text-emerald-900">
                {selectedConfig.name} is integrated successfully.
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-emerald-800">
                Users can transcribe a meeting, review generated tickets, and
                sync approved work to {selectedConfig.name}.
              </p>
            </div>
          ) : null}

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Field mapping
            </p>
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
              {selectedConfig.fieldMapping.map(([source, target]) => (
                <div
                  className="grid gap-3 border-b border-slate-200 px-4 py-2.5 text-xs last:border-b-0 md:grid-cols-[1fr_40px_1fr]"
                  key={`${source}-${target}`}
                >
                  <span className="font-semibold text-slate-700">{source}</span>
                  <span className="text-slate-400">to</span>
                  <span className="text-slate-600">{target}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PublishPanel
        failedTasks={failedTasks}
        publishError={publishError}
        publishedTasks={publishedTasks}
        publishingApproved={publishingApproved}
        tickets={Array.from({ length: ticketCount }, (_, index) => ({
          acceptance_criteria: [],
          description: "",
          id: `AI-${index + 1}`,
          priority: "Low",
          title: "",
        }))}
      />
    </>
  );
}

function SettingsScreen() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
        Settings
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-slate-950">
        Application configuration
      </h1>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <SettingsCard
          description="FastAPI endpoint used for transcript orchestration."
          label="Transcript API"
          value={API_URL}
        />
        <SettingsCard
          description="FastAPI endpoint used for project management publishing."
          label="PM publish API"
          value={PUBLISH_URL}
        />
        <SettingsCard
          description="Frontend currently accepts pasted text and .txt transcript files."
          label="Supported input"
          value=".txt or paste"
        />
        <SettingsCard
          description="ClickUp publishing is live; Jira, Trello, and other PM tools are selectable previews."
          label="Sync behavior"
          value="Provider adapter"
        />
      </div>
    </section>
  );
}

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

function providerLabel(provider: ProjectManagementProvider) {
  return providerOptions.find((option) => option.id === provider)?.name ?? "PM";
}

function providerConfig(provider: ProjectManagementProvider) {
  const configs = {
    clickup: {
      name: "ClickUp",
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
      name: "Jira",
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
      name: "Trello",
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
      name: "Other PM",
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
  } satisfies Record<
    ProjectManagementProvider,
    {
      authLabel: string;
      defaultStatus: string;
      fieldMapping: string[][];
      name: string;
      targetLabel: string;
    }
  >;

  return configs[provider];
}

function SettingsCard({
  description,
  label,
  value,
}: {
  description: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-sm font-semibold text-slate-950">{label}</p>
      <p className="mt-1 break-words text-sm text-slate-700">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}

function ReadOnlyConfigField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <span className="mt-1 block rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800">
        {value}
      </span>
    </label>
  );
}

function TopBar({
  selectedProvider,
}: {
  selectedProvider: ProjectManagementProvider;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 lg:hidden">
          <img
            src="/icon/transcribe_logo.png"
            alt="Transcribely Logo"
            className="h-9 w-9 object-contain rounded-lg"
          />
          <p className="font-semibold text-slate-950">Transcribely</p>
        </div>

        <div className="flex min-w-0 flex-1 items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 md:max-w-xl">
          <span className="text-xs font-semibold text-slate-400">Search</span>
          <input
            className="ml-3 min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            placeholder="Tickets, transcripts, assignees..."
            type="search"
          />
          <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs text-slate-400">
            K
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200 shadow-sm">
            API connected
          </span>
          <span className="flex items-center gap-1.5 rounded-md bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 border border-violet-200 shadow-sm">
            <ProviderLogo provider={selectedProvider} className="h-3.5 w-3.5 shrink-0" />
            <span>
              {selectedProvider === "clickup"
                ? "ClickUp connected"
                : `${providerLabel(selectedProvider)} not connected`}
            </span>
          </span>
        </div>
      </div>
    </header>
  );
}

function TranscriptPanel({
  activeStep,
  error,
  fileName,
  isGenerating,
  onFileUpload,
  onGenerate,
  onTranscriptChange,
  transcript,
  words,
}: {
  activeStep: number;
  error: string;
  fileName: string;
  isGenerating: boolean;
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onGenerate: () => void;
  onTranscriptChange: (value: string) => void;
  transcript: string;
  words: number;
}) {
  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Transcript analyzer
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Strategy input
          </h2>
        </div>
        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          .txt or paste
        </span>
      </div>

      <label
        className="mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-violet-200 bg-violet-50/50 px-4 py-5 text-center transition hover:border-violet-400 hover:bg-white"
        htmlFor="transcript-file"
      >
        <span className="text-sm font-semibold text-slate-800">
          Upload transcript
        </span>
        <span className="text-sm text-slate-500">
          Choose a .txt meeting transcript.
        </span>
        {fileName ? (
          <span className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm">
            {fileName}
          </span>
        ) : null}
        <input
          accept=".txt,text/plain"
          className="sr-only"
          id="transcript-file"
          onChange={onFileUpload}
          type="file"
        />
      </label>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="transcript"
          >
            Paste full transcript
          </label>
          <span className="text-xs text-slate-500">{words} words</span>
        </div>
        <textarea
          className="min-h-52 w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-100"
          id="transcript"
          onChange={(event) => onTranscriptChange(event.target.value)}
          placeholder="Paste a stakeholder strategy transcript here."
          value={transcript}
        />
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <button
        className="mt-5 flex w-full items-center justify-center rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isGenerating}
        onClick={onGenerate}
        type="button"
      >
        {isGenerating ? "Generating queue..." : "Generate AI tickets"}
      </button>

      <div className="mt-5 space-y-2">
        {workflowSteps.map((step, index) => {
          const complete = activeStep > index;
          const active = activeStep === index;

          return (
            <div
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
              key={step}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                  complete
                    ? "bg-emerald-600 text-white"
                    : active
                      ? "bg-violet-600 text-white"
                      : "bg-white text-slate-400"
                }`}
              >
                {complete ? "OK" : index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">{step}</p>
                <p className="text-xs text-slate-500">
                  {complete ? "Complete" : active ? "Processing" : "Waiting"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QueueHeader({
  allTicketsReviewed,
  reviewedCount,
  ticketCount,
}: {
  allTicketsReviewed: boolean;
  reviewedCount: number;
  ticketCount: number;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
          Approval queue
        </p>
        <h2 className="mt-1 text-xl font-semibold text-slate-950">
          Generated tickets
        </h2>
      </div>
      <div className="flex flex-wrap gap-2">
        <FilterChip label="Priority: All" />
        <FilterChip
          label={allTicketsReviewed ? "Status: Approved" : "Status: Pending"}
        />
        <FilterChip label={`${reviewedCount}/${ticketCount} reviewed`} />
      </div>
    </div>
  );
}

function TicketQueueRow({
  failedTask,
  isSelected,
  onSelect,
  onToggleReview,
  publishedTask,
  reviewed,
  ticket,
}: {
  failedTask?: FailedClickUpTask;
  isSelected: boolean;
  onSelect: (ticketId: string) => void;
  onToggleReview: (ticketId: string) => void;
  publishedTask?: PublishedClickUpTask;
  reviewed: boolean;
  ticket: Ticket;
}) {
  const status = publishedTask
    ? "Synced"
    : failedTask
      ? "Failed"
      : reviewed
        ? "Approved"
        : "Pending review";

  return (
    <article
      className={`grid gap-3 px-4 py-4 lg:grid-cols-[40px_minmax(260px,1fr)_110px_130px_110px] lg:items-center ${
        isSelected ? "bg-violet-50/70" : "bg-white"
      }`}
    >
      <button
        aria-label={
          reviewed ? "Mark ticket as not reviewed" : "Mark ticket reviewed"
        }
        className={`flex h-5 w-5 items-center justify-center rounded border text-[10px] font-bold ${
          reviewed
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-slate-300 bg-white text-transparent hover:border-slate-500"
        }`}
        onClick={() => onToggleReview(ticket.id)}
        type="button"
      >
        OK
      </button>

      <button
        className="min-w-0 text-left"
        onClick={() => onSelect(ticket.id)}
        type="button"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
            {ticket.id}
          </span>
          <span className="rounded bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700">
            Task
          </span>
        </div>
        <h3 className="mt-2 text-sm font-semibold leading-6 text-slate-950">
          {ticket.title}
        </h3>
        <p className="line-clamp-2 text-sm leading-6 text-slate-500">
          {ticket.description}
        </p>
      </button>

      <PriorityBadge priority={ticket.priority} />
      <StatusBadge
        failed={Boolean(failedTask)}
        published={Boolean(publishedTask)}
        reviewed={reviewed}
      >
        {status}
      </StatusBadge>
      <button
        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        onClick={() => onSelect(ticket.id)}
        type="button"
      >
        Review
      </button>
    </article>
  );
}

function TicketDetailPanel({
  failedTask,
  onClose,
  onToggleReview,
  publishedTask,
  reviewed,
  ticket,
}: {
  failedTask?: FailedClickUpTask;
  onClose: () => void;
  onToggleReview: (ticketId: string) => void;
  publishedTask?: PublishedClickUpTask;
  reviewed: boolean;
  ticket: Ticket;
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6"
      role="dialog"
    >
      <section className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                {ticket.id}
              </span>
              <span className="rounded bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700">
                Task
              </span>
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge
                failed={Boolean(failedTask)}
                published={Boolean(publishedTask)}
                reviewed={reviewed}
              >
                {publishedTask
                  ? "Synced"
                  : failedTask
                    ? "Failed"
                    : reviewed
                      ? "Approved"
                      : "Pending review"}
              </StatusBadge>
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              {ticket.id} {ticket.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review the generated task body and acceptance criteria before
              publishing to the selected project management tool.
            </p>
          </div>

          <button
            aria-label="Close ticket detail"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-lg font-semibold text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto p-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-800">
                    Description
                  </p>
                </div>
                <p className="px-4 py-4 text-sm leading-6 text-slate-700">
                  {ticket.description}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-800">
                    Acceptance criteria
                  </p>
                </div>
                <ul className="divide-y divide-slate-200">
                  {ticket.acceptance_criteria.map((item, index) => (
                    <li
                      className="flex gap-3 px-4 py-3 text-sm leading-6 text-slate-700"
                      key={`${ticket.id}-${index}-${item}`}
                    >
                      <span className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border border-slate-300 bg-white" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <aside className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">
                Review controls
              </p>
              <button
                className={`mt-3 w-full rounded-md px-4 py-2 text-sm font-semibold ${
                  reviewed
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-violet-600 text-white hover:bg-violet-700"
                }`}
                onClick={() => onToggleReview(ticket.id)}
                type="button"
              >
                {reviewed ? "Approved" : "Mark approved"}
              </button>

              <div className="mt-5 border-t border-slate-200 pt-4">
                <p className="text-sm font-semibold text-slate-950">
                  PM sync status
                </p>
                {publishedTask ? (
                  <div className="mt-3 space-y-3">
                    <a
                      className="inline-flex rounded-md bg-white px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm"
                      href={publishedTask.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open ClickUp task
                    </a>
                    <PublishChecklistStatus task={publishedTask} />
                  </div>
                ) : failedTask ? (
                  <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium leading-5 text-red-700">
                    {failedTask.error}
                  </p>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Approve every generated ticket to enable project management publishing.
                  </p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

function PublishPanel({
  failedTasks,
  publishError,
  publishedTasks,
  publishingApproved,
  tickets,
}: {
  failedTasks: FailedClickUpTask[];
  publishError: string;
  publishedTasks: PublishedClickUpTask[];
  publishingApproved: boolean;
  tickets: Ticket[];
}) {
  if (!publishError && publishedTasks.length === 0 && !publishingApproved) {
    return null;
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">
        Publishing activity
      </h2>
      {publishError ? (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {publishError}
        </div>
      ) : null}

      {publishedTasks.length > 0 ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-semibold text-emerald-800">
            {publishedTasks.length} ticket
            {publishedTasks.length === 1 ? "" : "s"} published.
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {publishedTasks.map((task) => (
              <a
                className="rounded-md bg-white px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-100"
                href={task.url}
                key={task.clickup_task_id}
                rel="noreferrer"
                target="_blank"
              >
                {task.local_ticket_id}: Open task
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {failedTasks.length > 0 ? (
        <div className="mt-4 space-y-2">
          {failedTasks.map((task) => (
            <p
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
              key={task.local_ticket_id}
            >
              {task.local_ticket_id}: {task.error}
            </p>
          ))}
        </div>
      ) : null}

      {publishingApproved ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {tickets.length} reviewed ticket
          {tickets.length === 1 ? " is" : "s are"} now live in the selected
          project management tool.
        </div>
      ) : null}
    </section>
  );
}

function EmptyQueue() {
  return (
    <div className="mt-4 flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 text-center">
      <div className="mb-4 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
        Waiting for transcript analysis
      </div>
      <p className="max-w-md text-sm leading-6 text-slate-500">
        Add transcript content and generate tickets to populate the approval
        queue.
      </p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function FilterChip({ label }: { label: string }) {
  return (
    <span className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
      {label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex w-fit rounded-md px-2.5 py-1 text-xs font-semibold ${priorityClassName(priority)}`}
    >
      {priority}
    </span>
  );
}

function StatusBadge({
  children,
  failed,
  published,
  reviewed,
}: {
  children: React.ReactNode;
  failed: boolean;
  published: boolean;
  reviewed: boolean;
}) {
  return (
    <span
      className={`inline-flex w-fit rounded-md px-2.5 py-1 text-xs font-semibold ${
        published
          ? "bg-emerald-50 text-emerald-700"
          : failed
            ? "bg-red-50 text-red-700"
            : reviewed
              ? "bg-blue-50 text-blue-700"
              : "bg-amber-50 text-amber-700"
      }`}
    >
      {children}
    </span>
  );
}

function PublishChecklistStatus({ task }: { task: PublishedClickUpTask }) {
  return (
    <div
      className={`rounded-md border px-3 py-2 text-xs font-medium ${
        task.checklist_created
          ? "border-blue-200 bg-blue-50 text-blue-800"
          : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      <span className="font-semibold">{task.local_ticket_id}</span>
      {task.checklist_created
        ? ` checklist created with ${task.checklist_item_count} item${
            task.checklist_item_count === 1 ? "" : "s"
          }.`
        : ` task created, but checklist needs attention: ${
            task.warning ?? "No checklist status returned."
          }`}
    </div>
  );
}

function priorityClassName(priority: Priority) {
  if (priority === "High") {
    return "bg-red-50 text-red-700";
  }

  if (priority === "Medium") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-emerald-50 text-emerald-700";
}

async function readTicketStream(
  body: ReadableStream<Uint8Array>,
  onToken: (chunk: string) => void,
): Promise<OrchestrationResponse> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalResponse: OrchestrationResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }

      const event = JSON.parse(line) as {
        type: "token" | "final" | "error";
        data: { content?: string; message?: string } | OrchestrationResponse;
      };

      if (event.type === "token" && "content" in event.data) {
        onToken(event.data.content ?? "");
      }

      if (event.type === "error" && "message" in event.data) {
        throw new Error(event.data.message ?? "Ticket generation failed.");
      }

      if (event.type === "final" && "tickets" in event.data) {
        finalResponse = normalizeResponse(event.data);
      }
    }
  }

  if (buffer.trim()) {
    const event = JSON.parse(buffer) as {
      type: "final" | "error";
      data: { message?: string } | OrchestrationResponse;
    };

    if (event.type === "error" && "message" in event.data) {
      throw new Error(event.data.message ?? "Ticket generation failed.");
    }

    if (event.type === "final" && "tickets" in event.data) {
      finalResponse = normalizeResponse(event.data);
    }
  }

  if (!finalResponse) {
    throw new Error("The backend stream ended without final ticket JSON.");
  }

  return finalResponse;
}

function normalizeResponse(
  response: OrchestrationResponse,
): OrchestrationResponse {
  return {
    ...response,
    key_decisions: uniqueItems(response.key_decisions),
    open_questions: uniqueItems(response.open_questions),
    department_action_items: uniqueActionItems(
      response.department_action_items,
    ),
    tickets: response.tickets.map((ticket) => ({
      ...ticket,
      acceptance_criteria: uniqueItems(ticket.acceptance_criteria),
    })),
  };
}

function uniqueItems(items: string[]) {
  return items.filter((item, index, list) => list.indexOf(item) === index);
}

function uniqueActionItems(items: DepartmentActionItem[]) {
  return items.filter((item, index, list) => {
    const key = `${item.department}-${item.action}-${item.owner_type}`;
    return (
      list.findIndex(
        (candidate) =>
          `${candidate.department}-${candidate.action}-${candidate.owner_type}` ===
          key,
      ) === index
    );
  });
}
