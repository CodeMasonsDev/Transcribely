import type { ChangeEvent } from "react";

import { FilterChip, PriorityBadge, workflowSteps } from "./shared";
import type { OrchestrationResponse, Ticket } from "../../lib/transcribely-schemas";

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

      <div className="mt-4 grid h-[600px] gap-3 overflow-y-auto lg:grid-cols-2">
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

export function TranscriptAnalyzerScreen({
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
