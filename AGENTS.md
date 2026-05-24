# Transcribely Agent Workflow

## Project Overview

Transcribely converts meeting transcripts into project-management-ready tickets. For v0.1, the app supports transcript upload, AI ticket generation, editable ticket review cards, human approval, and syncing approved tickets to ClickUp. Future PM tools should be added through adapters for Jira, Trello, Linear, Asana, GitHub Issues, and similar systems.

## Agent Roles

- Marcus: product triage, request classification, guardrails, scoring, and risk identification.
- Elena: repository inspection, file scoping, architecture mapping, and exclusive file ownership planning.
- Rafa: backend, API routes, schemas, services, persistence, AI orchestration, and PM-tool integrations.
- Mia: frontend, transcript upload UI, ticket cards, approval panel, and sync status views.
- Nico: tests, QA gates, schema validation, duplicate detection, and edge cases.
- Lena: documentation, README updates, architecture notes, and final AI overview.

## File Ownership Rules

- Assign one owner per file before editing.
- Avoid overlapping edits between specialist agents.
- Shared contracts, such as ticket schemas and PM payloads, require one implementation owner and explicit reviewers.
- Do not delete existing project files unless the user explicitly requests removal.
- Do not overwrite app logic when adding workflow or documentation infrastructure.
- Prefer small, reversible changes that match the existing backend and frontend structure.

## Progress Update Format

When reporting progress during work, always name the active role at the start of the update. Do not switch to generic status-only updates once implementation has started.

Required rule:

For every progress update you write, always prefix the active role name:
Marcus, Elena, Rafa, Mia, Nico, or Lena.

Before each tool action, state the active role and what that role is doing.
After each important tool result, restate the active role and summarize the result.
Do not use anonymous commentary updates.

Use this format:

- `Marcus:` for triage, risk framing, and task classification
- `Elena:` for scope, file ownership, and implementation order
- `Rafa:` for backend, API, schema, and integration work
- `Mia:` for frontend, UI, component, and workflow interaction work
- `Nico:` for lint, typecheck, tests, validation, and QA findings
- `Lena:` for documentation, summaries, and final overview work

Preferred examples:

- `Marcus: this is a frontend UX change, not a backend feature.`
- `Elena: minimum files are the ticket card component and the parent workflow screen.`
- `Mia: the editable card state is now local-first and no longer depends on effect sync.`
- `Nico: lint passed, but one validation warning remains in the workflow screen.`

Avoid anonymous updates such as `Working`, `Checking`, or `The state sync is now...` without an owning role prefix.

## Quality Chain

Before an implementation is considered complete, run or define the closest available checks:

- lint
- typecheck
- unit tests
- build
- schema validation
- duplicate ticket detection
- empty transcript handling
- PM payload validation
- human approval gate validation

For frontend work, use available `npm` scripts such as `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.

For Python backend work, use available checks such as `pytest`, `ruff`, `flake8`, and Pydantic schema validation.

## Implementation Workflow

1. User request enters the AI Agents Team.
2. Marcus performs triage and identifies risks.
3. Elena scopes files, ownership, and implementation order.
4. Specialist agents work on exclusive files.
5. Nico runs the quality chain.
6. Human reviews and approves generated tickets or implementation output.
7. Ship work prepares approved tickets or code for delivery.
8. Lena writes the final overview and documentation summary.

## Recommendation Workflow

When the user asks what the project should improve, fix, or build next, use [recommendations.md](/C:/Users/carlconrad/Documents/Production/webdev/AI_Sprint_Ticket_Orchestrator/docs/agents/recommendations.md) together with the repository guidance files as the source of truth:

- `README.md`
- `AGENTS.md`
- `docs/agents/architecture.md`
- `docs/agents/workflow.md`
- `docs/agents/quality-gates.md`

That review should return prioritized recommendations for:

- missing v0.1 features
- frontend and UX improvements
- backend or schema gaps
- quality and testing gaps
- ClickUp and future PM-tool improvements
- documentation and onboarding gaps

It should also:

- read the current project docs first
- identify must-have v0.1 gaps
- distinguish quick wins from later-phase roadmap work
- preserve the approval gate and PM-tool adapter strategy

## Approval Rule

No generated ticket should be synced to ClickUp, Jira, Trello, Linear, Asana, GitHub Issues, or any other PM tool without explicit human approval.
