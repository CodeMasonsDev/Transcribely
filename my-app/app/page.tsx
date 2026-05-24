"use client";

import { ChangeEvent, useMemo, useState } from "react";

import {
  ApprovalQueueScreen,
  DashboardScreen,
  GeneratedTicketsScreen,
  ProjectManagementIntegrationScreen,
  ProviderLogo,
  SettingsScreen,
  TopBar,
  TranscriptAnalyzerScreen,
} from "./transcribely-workflow";
import {
  orchestrationResponseSchema,
  projectManagementConnectionResponseSchema,
  publishTicketsResponseSchema,
  ticketStreamEventSchema,
  type DepartmentActionItem,
  type FailedClickUpTask,
  type OrchestrationResponse,
  type ProjectManagementProvider,
  type PublishedClickUpTask,
  type Ticket,
} from "../lib/transcribely-schemas";

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

export default function Home() {
  const [activeScreen, setActiveScreen] = useState<AppScreen>("Dashboard");
  const [transcript, setTranscript] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [streamingOutput, setStreamingOutput] = useState("");
  const [response, setResponse] = useState<OrchestrationResponse | null>(null);
  const [ticketDrafts, setTicketDrafts] = useState<Ticket[]>([]);
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

  const tickets = ticketDrafts.length > 0 ? ticketDrafts : response?.tickets ?? [];
  const ticketsVisible = tickets.length > 0;
  const reviewedCount = reviewedTicketIds.length;
  const selectedTicket = tickets.find(
    (ticket) => ticket.id === selectedTicketId,
  );
  const activeNavIndex = navItems.indexOf(activeScreen);
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
    setTicketDrafts([]);
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
      setTicketDrafts(normalized.tickets);
      setSelectedTicketId("");
      setActiveScreen("Approval Queue");
      setActiveStep(workflowSteps.length - 1);
    } catch (caughtError) {
      setResponse(null);
      setTicketDrafts([]);
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

  const updateTicketDraft = (ticketId: string, updates: Partial<Ticket>) => {
    setTicketDrafts((currentTickets) => {
      const nextTickets = currentTickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, ...updates } : ticket,
      );

      setResponse((currentResponse) =>
        currentResponse ? { ...currentResponse, tickets: nextTickets } : currentResponse,
      );

      return nextTickets;
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

      const rawData = await result.json().catch(() => null);
      const parsedData = publishTicketsResponseSchema.safeParse(rawData);

      if (!result.ok) {
        const message =
          rawData &&
          typeof rawData === "object" &&
          "detail" in rawData &&
          typeof (rawData as { detail?: unknown }).detail === "string" &&
          (rawData as { detail?: string }).detail
            ? (rawData as { detail: string }).detail
            : `${providerLabel(selectedProvider)} publishing failed. Check backend configuration and retry.`;
        throw new Error(message);
      }

      if (!parsedData.success) {
        throw new Error(
          "The backend returned an invalid project management publish response.",
        );
      }

      const data = parsedData.data;
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

      const rawData = await result.json().catch(() => null);
      const parsedData = projectManagementConnectionResponseSchema.safeParse(
        rawData,
      );

      if (!result.ok) {
        const message =
          rawData &&
          typeof rawData === "object" &&
          "detail" in rawData &&
          typeof (rawData as { detail?: unknown }).detail === "string" &&
          (rawData as { detail?: string }).detail
            ? (rawData as { detail: string }).detail
            : `${providerLabel(selectedProvider)} connection test failed.`;
        throw new Error(message);
      }

      if (!parsedData.success) {
        throw new Error("The backend returned an invalid connection response.");
      }

      const data = parsedData.data;
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

            <nav className="flex-1 px-3 py-4">
              <div className="relative space-y-1">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-11 rounded-md bg-violet-50 ring-1 ring-violet-200 shadow-sm transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none"
                  style={{
                    opacity: activeNavIndex >= 0 ? 1 : 0,
                    transform:
                      activeNavIndex >= 0
                        ? `translateY(${activeNavIndex * 48}px)`
                        : "translateY(0px)",
                  }}
                />

                {navItems.map((item, index) => {
                  const isActive = item === activeScreen;
                  const showCount =
                    (item === "Approval Queue" || item === "Generated Tickets") &&
                    tickets.length > 0;

                  return (
                    <button
                      key={item}
                      onClick={() => setActiveScreen(item)}
                      type="button"
                      className={`group relative flex h-11 w-full items-center justify-between rounded-md px-3 text-left text-sm font-medium transition-all duration-300 ease-out motion-reduce:transition-none ${
                        isActive
                          ? "text-violet-700"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 hover:translate-x-0.5"
                      }`}
                      style={{
                        transitionDelay: `${index * 25}ms`,
                      }}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full transition-all duration-300 ${
                            isActive
                              ? "bg-violet-600 scale-110 shadow-[0_0_0_4px_rgba(124,58,237,0.12)]"
                              : "bg-slate-300 group-hover:bg-violet-300"
                          }`}
                        />
                        <span>{item}</span>
                      </span>
                      {showCount ? (
                        <span
                          className={`relative z-10 rounded px-2 py-0.5 text-xs transition-all duration-300 ${
                            isActive
                              ? "bg-violet-100 text-violet-700"
                              : "bg-slate-100 text-slate-600 group-hover:bg-white"
                          }`}
                        >
                          {tickets.length}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
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
                onUpdateTicket={updateTicketDraft}
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

function providerLabel(provider: ProjectManagementProvider) {
  if (provider === "clickup") {
    return "ClickUp";
  }

  if (provider === "jira") {
    return "Jira";
  }

  if (provider === "trello") {
    return "Trello";
  }

  return "Other PM";
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

      const parsedEvent = ticketStreamEventSchema.safeParse(JSON.parse(line));

      if (!parsedEvent.success) {
        throw new Error("The backend returned an invalid ticket stream event.");
      }

      const event = parsedEvent.data;

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
    const parsedEvent = ticketStreamEventSchema.safeParse(JSON.parse(buffer));

    if (!parsedEvent.success) {
      throw new Error("The backend returned an invalid ticket stream event.");
    }

    const event = parsedEvent.data;

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
  return orchestrationResponseSchema.parse({
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
  });
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
