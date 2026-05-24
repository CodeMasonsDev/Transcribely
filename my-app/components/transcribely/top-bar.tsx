import { providerLabel } from "./shared";
import { ProviderLogo } from "./provider-logo";
import type { ProjectManagementProvider } from "../../lib/transcribely-schemas";

export function TopBar({
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
            className="h-9 w-9 rounded-lg object-contain"
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
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm">
            API connected
          </span>
          <span className="flex items-center gap-1.5 rounded-md border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm">
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

