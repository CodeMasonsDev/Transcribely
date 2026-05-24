import type { ProjectManagementProvider } from "../../lib/transcribely-schemas";

export function ProviderLogo({
  provider,
  className = "h-8 w-8",
}: {
  provider: ProjectManagementProvider;
  className?: string;
}) {
  if (provider === "clickup") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 3.5c-.32 0-.63.14-.85.38L4.35 10.7a1.2 1.2 0 0 0 .85 2.05h3.4v4.5a1.2 1.2 0 0 0 1.2 1.2h4.4a1.2 1.2 0 0 0 1.2-1.2v-4.5h3.4a1.2 1.2 0 0 0 .85-2.05L12.85 3.88a1.18 1.18 0 0 0-.85-.38z"
          fill="url(#clickup-top)"
        />
        <path
          d="M4.52 14.8c-.8.15-1.29 1.02-.9 1.73A8.4 8.4 0 0 0 12 21.2a8.4 8.4 0 0 0 8.38-4.67c.39-.7-.1-1.58-.9-1.73a7.48 7.48 0 0 1-1.3-.1c-.55-.08-.98.37-1 .92a5.4 5.4 0 0 1-10.36 0c-.02-.55-.45-1-1-.92-.28.04-.55.08-.82.1z"
          fill="url(#clickup-bottom)"
        />
        <defs>
          <linearGradient
            id="clickup-top"
            x1="4.35"
            y1="3.5"
            x2="19.65"
            y2="12.75"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FF4B72" />
            <stop offset="100%" stopColor="#FF7A00" />
          </linearGradient>
          <linearGradient
            id="clickup-bottom"
            x1="3.62"
            y1="14.7"
            x2="20.38"
            y2="21.2"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#7B00E0" />
            <stop offset="100%" stopColor="#B300E0" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (provider === "jira") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
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
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="2" y="2" width="20" height="20" rx="4" fill="#0079BF" />
        <rect x="6" y="6" width="4.5" height="12" rx="1.5" fill="white" />
        <rect x="13.5" y="6" width="4.5" height="8" rx="1.5" fill="white" />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" fill="#E2E8F0" />
      <path
        d="M12 6a3 3 0 0 0-3 3v1H8a3 3 0 0 0 0 6h1v1a3 3 0 0 0 6 0v-1h1a3 3 0 0 0 0-6h-1V9a3 3 0 0 0-3-3z"
        fill="#475569"
      />
    </svg>
  );
}

