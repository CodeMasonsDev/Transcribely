---
name: transcribely-scope
description: Use before editing Transcribely files to inspect repository structure, identify the minimum files that need changes, and assign exclusive file ownership across Marcus, Elena, Rafa, Mia, Nico, and Lena.
---

# Transcribely Scope

Use this skill before editing files.

## Instructions

1. Inspect the repository structure before proposing edits.
2. Identify the minimum set of files needed for the request.
3. Separate files to create, modify, and avoid.
4. Assign exclusive file ownership to avoid overlapping edits:
   - Marcus: triage, planning, guardrails
   - Elena: file scoping and workflow architecture
   - Rafa: backend, API, database, services, integrations
   - Mia: frontend, UI, components, ticket cards, approval panel
   - Nico: tests, QA, validation, duplicate detection, edge cases
   - Lena: documentation, summaries, README
5. Keep implementation order explicit.
6. Avoid broad refactors unless required by the request.

## Output Format

```yaml
files_to_create:
files_to_modify:
files_to_avoid:
agent_file_ownership:
implementation_order:
```

If a file is shared across concerns, assign one owner and name the other agents as reviewers only.
