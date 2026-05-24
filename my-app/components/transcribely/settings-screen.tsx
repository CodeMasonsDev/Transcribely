import { API_URL, PUBLISH_URL } from "../../lib/transcribely-constants";

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

export function SettingsScreen() {
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

