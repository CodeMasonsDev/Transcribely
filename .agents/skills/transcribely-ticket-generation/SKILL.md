---
name: transcribely-ticket-generation
description: Use when implementing or changing Transcribely's transcript-to-ticket generation pipeline, ticket schema, AI prompts, editable ticket cards, or validation around generated project-management tickets.
---

# Transcribely Ticket Generation

Use this skill when building or changing the transcript-to-ticket generation pipeline.

## Product Flow

Build around this flow:

```text
transcript upload -> transcript cleaning -> Marcus triage -> Elena scoping -> ticket generation -> QA validation -> human approval -> PM tool sync
```

## Ticket Requirements

Generated tickets must include:

- title
- description
- user_story
- acceptance_criteria
- priority
- ticket_type
- suggested_assignee_role
- tags
- dependencies
- estimated_effort
- open_questions

## Guardrails

- Do not invent unsupported details from transcripts.
- Put missing or uncertain details in `open_questions`.
- Keep acceptance criteria concrete and testable.
- Make generated tickets editable before approval.
- Display tickets as cards before syncing.
- Do not sync generated tickets to any PM tool until a human has approved them.
- Keep schema changes aligned across backend responses, frontend state, validation, and PM payload adapters.
