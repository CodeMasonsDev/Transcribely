# Transcribely Agent Usage Guide

Use this file when you want quick copy-paste prompts for the Transcribely workflow and a simple reference for which role should own which kind of work.

## Read These Files

For the full workflow and guardrails:

- [AGENTS.md](C:/Users/carlconrad/Documents/Production/webdev/AI_Sprint_Ticket_Orchestrator/AGENTS.md)
- [architecture.md](C:/Users/carlconrad/Documents/Production/webdev/AI_Sprint_Ticket_Orchestrator/docs/agents/architecture.md)
- [workflow.md](C:/Users/carlconrad/Documents/Production/webdev/AI_Sprint_Ticket_Orchestrator/docs/agents/workflow.md)
- [quality-gates.md](C:/Users/carlconrad/Documents/Production/webdev/AI_Sprint_Ticket_Orchestrator/docs/agents/quality-gates.md)
- [recommendations.md](C:/Users/carlconrad/Documents/Production/webdev/AI_Sprint_Ticket_Orchestrator/docs/agents/recommendations.md)

## Who Does What

- `Marcus`: triage, request classification, risk framing, guardrails, scope sizing
- `Elena`: repository scoping, minimum file set, ownership, implementation order
- `Rafa`: backend, APIs, schemas, services, integrations, ClickUp or PM adapters
- `Mia`: frontend, UI, transcript upload flow, editable cards, approval UX
- `Nico`: lint, typecheck, tests, schema validation, duplicate detection, QA
- `Lena`: docs, summaries, architecture notes, concise final overview

## Recommendation Prompt

Use this when you want Codex to tell you what to improve next and save the result:

```text
Read docs/agents/recommendations.md and the repository files it references.

For every progress update you write, always prefix the active role name:
Marcus, Elena, Rafa, Mia, Nico, or Lena.

Before each tool action, state the active role and what that role is doing.
After each important tool result, restate the active role and summarize the result.
Do not use anonymous commentary updates.

Review Transcribely and write the recommendation results into docs/recommendation-results.md.
Return:
- must-have items for v0.1
- quick wins
- later-phase ideas
- key risks and gaps
- a recommended next implementation prompt

Keep the recommendations detailed, concise, and actionable.
```

## Implement Top Recommendation

Use this when you already have saved recommendations and want Codex to pick the best next item:

```text
Read docs/recommendation-results.md and AGENTS.md.

For every progress update you write, always prefix the active role name:
Marcus, Elena, Rafa, Mia, Nico, or Lena.

Before each tool action, state the active role and what that role is doing.
After each important tool result, restate the active role and summarize the result.
Do not use anonymous commentary updates.

Choose the highest-priority unfinished recommendation and implement it.
Before editing, plan the work:
- identify the exact recommendation
- triage it
- scope the minimum files
- assign ownership by role
- list the implementation order

For progress updates, always prefix the active role name.

Then implement it, run the relevant checks, and summarize the result.
```

## Implement Specific Recommendation

Use this when you want one exact item from `docs/recommendation-results.md`:

```text
Read docs/recommendation-results.md and AGENTS.md.

For every progress update you write, always prefix the active role name:
Marcus, Elena, Rafa, Mia, Nico, or Lena.

Before each tool action, state the active role and what that role is doing.
After each important tool result, restate the active role and summarize the result.
Do not use anonymous commentary updates.

Implement this recommendation:
[paste the exact recommendation title here]

Before editing:
- triage it
- scope the minimum files
- assign ownership by role
- list the implementation order

For progress updates, always prefix the active role name.

Then implement it, run the relevant checks, and summarize the result.
```

## Frontend Prompt

Use this for UI improvements or frontend bug fixes:

```text
Read AGENTS.md and follow the Transcribely workflow.

For every progress update you write, always prefix the active role name:
Marcus, Elena, Rafa, Mia, Nico, or Lena.

Before each tool action, state the active role and what that role is doing.
After each important tool result, restate the active role and summarize the result.
Do not use anonymous commentary updates.

Task:
[describe the frontend task]

Scope:
- frontend only unless a backend or schema issue is required
- preserve the approval gate
- keep the change minimal

Workflow:
- Marcus triages the request
- Elena scopes the minimum files
- Mia owns the frontend changes
- Nico runs the relevant checks
- Lena summarizes the result

For progress updates, always prefix the active role name.
```

## Backend Prompt

Use this for API, schema, service, orchestration, or integration work:

```text
Read AGENTS.md and follow the Transcribely workflow.

For every progress update you write, always prefix the active role name:
Marcus, Elena, Rafa, Mia, Nico, or Lena.

Before each tool action, state the active role and what that role is doing.
After each important tool result, restate the active role and summarize the result.
Do not use anonymous commentary updates.

Task:
[describe the backend task]

Scope:
- backend only unless frontend changes are required
- preserve human approval before PM sync
- keep adapter boundaries explicit

Workflow:
- Marcus triages the request
- Elena scopes the minimum files
- Rafa owns backend changes
- Nico runs the relevant checks
- Lena summarizes the result

For progress updates, always prefix the active role name.
```

## Full-Stack Prompt

Use this when the task spans frontend and backend:

```text
Read AGENTS.md and follow the Transcribely workflow.

For every progress update you write, always prefix the active role name:
Marcus, Elena, Rafa, Mia, Nico, or Lena.

Before each tool action, state the active role and what that role is doing.
After each important tool result, restate the active role and summarize the result.
Do not use anonymous commentary updates.

Task:
[describe the feature or fix]

Before editing:
- Marcus triages the request
- Elena scopes the minimum files
- split ownership between Rafa and Mia where needed
- Nico verifies the result
- Lena summarizes the changes

For progress updates, always prefix the active role name.

Then implement the change, run the relevant checks, and summarize the result.
```

## Recommendation Roles

Use these owner hints when the recommendation output includes `suggested_owner`:

- `Marcus` if the recommendation is mostly product framing, prioritization, or risk clarification
- `Elena` if the recommendation is mostly architectural scoping or repo restructuring
- `Rafa` if the recommendation is mostly backend or integration work
- `Mia` if the recommendation is mostly UI, workflow clarity, or interaction design
- `Nico` if the recommendation is mostly validation, tests, or release safety
- `Lena` if the recommendation is mostly docs, onboarding, or communication cleanup

## Short Prompt

Use this when you want the fastest acceptable version:

```text
Read AGENTS.md.

For every progress update you write, always prefix the active role name:
Marcus, Elena, Rafa, Mia, Nico, or Lena.

Before each tool action, state the active role and what that role is doing.
After each important tool result, restate the active role and summarize the result.
Do not use anonymous commentary updates.

Implement [task].
Triage and scope first, name the active role in every progress update, run the relevant checks, and summarize the result.
```
