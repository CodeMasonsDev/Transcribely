---
name: transcribely-clickup-ship
description: Use when preparing approved Transcribely tickets for ClickUp sync or designing future PM-tool adapters for Jira, Trello, Linear, GitHub Issues, or Asana.
---

# Transcribely ClickUp Ship

Use this skill when preparing approved tickets for ClickUp or future PM tools.

## Instructions

1. Only sync tickets with status `approved`.
2. Never sync draft, rejected, unreviewed, or AI-only tickets.
3. Convert internal ticket fields into PM-tool-compatible payloads.
4. Never expose API keys, tokens, secrets, or credential-bearing URLs.
5. Store `external_ticket_id` after successful sync.
6. Preserve enough local state to prevent duplicate syncs.

## ClickUp Payload Fields

Prepare ClickUp-compatible fields for:

- name
- description
- priority
- tags
- due_date if available
- assignee if available
- custom fields if configured

## Adapter Direction

Design the ship layer so future tools can be added through adapters:

- ClickUp
- Jira
- Trello
- Linear
- GitHub Issues
- Asana

Keep adapter boundaries explicit so PM-tool-specific payload mapping does not leak into transcript parsing or UI approval logic.
