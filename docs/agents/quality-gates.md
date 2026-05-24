# Transcribely Quality Gates

## AI Output Quality Gates

- Generated tickets must be grounded in transcript evidence.
- Unsupported or unclear details must go into `open_questions`.
- Acceptance criteria must be concrete and testable.
- Duplicate or near-duplicate tickets must be detected before approval.
- Empty transcripts must be rejected with a clear error.
- Ticket schema must remain compatible across backend, frontend, and PM sync payloads.
- Draft tickets must be editable before approval.
- No ticket may sync to a PM tool unless its status is `approved`.

## Code Quality Gates

- Lint passes for changed frontend and backend files where tooling exists.
- Typecheck passes where the stack supports it.
- Unit tests pass for affected behavior.
- Build passes for production-facing changes.
- Pydantic schema validation passes for backend ticket and PM payload models.
- PM payload validation confirms required fields before sync.
- Integration code never logs or exposes API keys.

## Done Definition

Work is done when:

- The requested behavior is implemented or documented.
- Files changed are limited to the scoped ownership plan.
- AI output and PM sync guardrails are preserved.
- Quality checks have been run or clearly documented as unavailable.
- Remaining risks are documented.
- Human approval is required before any PM sync.
- Documentation is updated when behavior, architecture, or workflow changes.

