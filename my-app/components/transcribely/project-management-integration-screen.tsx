"use client";

import { useState } from "react";

import { MetricCard, providerConfig, providerOptions } from "./shared";
import { ProviderLogo } from "./provider-logo";
import type {
  FailedClickUpTask,
  ProjectManagementProvider,
  PublishedClickUpTask,
} from "../../lib/transcribely-schemas";

function PublishPanel({
  failedTasks,
  publishError,
  publishedTasks,
  publishingApproved,
  ticketCount,
}: {
  failedTasks: FailedClickUpTask[];
  publishError: string;
  publishedTasks: PublishedClickUpTask[];
  publishingApproved: boolean;
  ticketCount: number;
}) {
  return (
    <div className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Publish overview
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">
            Review sync output
          </h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {publishingApproved ? "Synced" : "Waiting"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <MetricCard label="Tickets" value={String(ticketCount)} />
        <MetricCard label="Created" value={String(publishedTasks.length)} />
        <MetricCard label="Failed" value={String(failedTasks.length)} />
      </div>

      {publishError ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {publishError}
        </div>
      ) : null}
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

export function ProjectManagementIntegrationScreen({
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
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">
              Integrations
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
              Project Management Hub
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Connect and sync your AI-generated sprint tickets with your team&apos;s project management tool. Select a platform to configure credentials and view field mapping.
            </p>
          </div>

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
                  className="flex flex-col gap-4 p-5 transition duration-150 hover:bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-2 shadow-sm">
                      <ProviderLogo provider={provider.id} className="h-7 w-7" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          {provider.name}
                        </h3>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badgeBg}`}>
                          {badgeText}
                        </span>
                        {provider.id === "clickup" ? (
                          <span className="text-[10px] font-medium text-emerald-600">
                            • Production-ready
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500">
                        {provider.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center sm:self-center">
                    <button
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition duration-150 hover:border-violet-600 hover:text-violet-600"
                      onClick={() => {
                        onProviderChange(provider.id);
                        setIsConfiguring(true);
                      }}
                      type="button"
                    >
                      Configure settings
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

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <button
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:text-violet-600"
            onClick={() => setIsConfiguring(false)}
            type="button"
          >
            Back to Hub
          </button>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            <span>Integrations</span>
            <span>/</span>
            <span className="text-slate-600">{selectedConfig.name}</span>
          </div>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-2">
                <ProviderLogo provider={selectedProvider} className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-950">
                    {selectedConfig.name} Integration
                  </h1>
                  {selectedProvider === "clickup" ? (
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        isVerified
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-violet-200 bg-violet-50 text-violet-700"
                      }`}
                    >
                      {isVerified ? "Connected" : "Setup Mode"}
                    </span>
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      Preview Mode
                    </span>
                  )}
                </div>
                <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-slate-500">
                  Configure credentials, test connection workspace, and view mapping fields.
                </p>
              </div>
            </div>
            <button
              className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
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
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-800 shadow-sm">
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
                <span className="text-xs font-semibold text-slate-600">Status</span>
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
                    {savedProvider === selectedProvider ? "Saved" : "Unsaved changes"}
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
              <MetricCard label="Created tasks" value={String(publishedTasks.length)} />
              <MetricCard label="Failed tasks" value={String(failedTasks.length)} />
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
              value={isClickUp ? "Configured in backend .env" : "Setup required"}
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
        ticketCount={ticketCount}
      />
    </>
  );
}
