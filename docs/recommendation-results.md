```yaml
project_stage: v0.1 frontend MVP
summary: >
  The core transcript-to-ticket flow is in place, but the approval and sync model
  is still too easy to lie to the user. The next work should make edits invalidate
  approval, make sync state honest, tighten acceptance-criteria editing, and add
  workflow-level state clarity and checks.

top_priorities:
  - Make any ticket edit invalidate approval and sync state.
  - Make the sync CTA and status reflect actual selected/approved ticket behavior.
  - Keep acceptance criteria as one editable UI only, with stable editing behavior.
  - Show clear dirty, approved, and synced state across the workflow.
  - Add quality gates around transcript edge cases and PM payload validation.

recommendations:
  - title: Invalidate approval and sync state when a ticket draft changes
    why_it_matters: >
      A user can currently edit an approved ticket and still publish it without
      re-approval. That breaks the human approval gate and makes the sync state
      untrustworthy.
    impact: High
    effort: Medium
    affected_areas:
      - my-app/app/page.tsx
      - my-app/app/transcribely-workflow.tsx
      - ticket draft state
      - approval state
      - publish state
    suggested_owner: Mia
    recommended_order: 1

  - title: Make the publish model honest about what is actually being synced
    why_it_matters: >
      The UI says "Sync selected tickets", but the current implementation publishes
      the whole ticket set. That mismatch will confuse users and can cause unwanted
      syncs.
    impact: High
    effort: Medium
    affected_areas:
      - my-app/app/page.tsx
      - my-app/app/transcribely-workflow.tsx
      - approval queue
      - publish CTA
      - selected ticket model
    suggested_owner: Mia
    recommended_order: 2

  - title: Harden the acceptance-criteria editor
    why_it_matters: >
      Acceptance criteria should stay editable one item at a time, without duplicate
      read-only UI, and without mutating the user's input while they type.
    impact: High
    effort: Low-Medium
    affected_areas:
      - my-app/app/transcribely-workflow.tsx
      - ticket detail panel
      - acceptance criteria inputs
      - add/remove criterion controls
    suggested_owner: Mia
    recommended_order: 3

  - title: Add explicit workflow-state feedback from upload to publish
    why_it_matters: >
      Users need to know whether they are uploading, analyzing, reviewing, approved,
      or blocked on sync. Without that, the workflow feels ambiguous and failures are
      hard to interpret.
    impact: Medium
    effort: Low-Medium
    affected_areas:
      - my-app/app/page.tsx
      - my-app/app/transcribely-workflow.tsx
      - sidebar
      - metric cards
      - empty states
      - publish readiness indicators
    suggested_owner: Mia
    recommended_order: 4

  - title: Add validation and QA coverage for transcript and PM payload edge cases
    why_it_matters: >
      v0.1 needs guardrails for empty transcripts, duplicate ticket detection, invalid
      schema fields, and malformed PM payloads before the product can be trusted.
    impact: High
    effort: Medium
    affected_areas:
      - transcript ingestion
      - ticket schema validation
      - ClickUp payloads
      - test/QA scripts
      - quality-gates docs
    suggested_owner: Nico
    recommended_order: 5

  - title: Keep extracting shared UI state into smaller, stable components
    why_it_matters: >
      The current frontend is much better than the original monolith, but the approval
      and settings surfaces still benefit from clearer component boundaries and fewer
      shared state assumptions.
    impact: Medium
    effort: Low
    affected_areas:
      - my-app/app/transcribely-workflow.tsx
      - shared badges
      - approval queue
      - settings and sync panels
    suggested_owner: Elena
    recommended_order: 6

risks_and_gaps:
  - >
    Approval can be bypassed after edits unless draft changes reset review and sync
    state.
  - >
    Sync status can become stale after post-publish edits, so the UI can claim a
    ticket is synced when the draft has changed.
  - >
    The publish copy implies ticket selection, but the current implementation does
    not really model selection.
  - >
    Acceptance criteria editing can feel unstable if the editor normalizes input on
    every keystroke.
  - >
    The quality chain still needs stronger coverage for empty transcript handling,
    duplicate detection, and PM payload validation.
  - >
    Future PM adapters will be harder to add safely unless ticket schema and payload
    contracts are treated as first-class interfaces.

quick_wins:
  - >
    Remove any remaining duplicate acceptance-criteria display and keep one editable
    path only.
  - >
    Change stale "Synced" wording to "Needs review" or "Out of date" after an edit
    invalidates publish state.
  - >
    Add a visible "unsaved changes" or "draft changed" badge in the approval queue.
  - >
    Stop trimming acceptance-criteria text on each keystroke; normalize on save.
  - >
    Improve empty states for no transcript, no generated tickets, and no approved
    tickets.
  - >
    Tighten keyboard focus and modal close behavior in the ticket detail panel.
  - >
    Keep the sidebar animation work, but ensure it never hides the active workflow
    step on smaller screens.

later_phase_ideas:
  - >
    Add real per-ticket selection, bulk approve, and bulk publish actions.
  - >
    Add filters and sorting for priority, status, owner, and sync state in the queue.
  - >
    Add side-by-side ticket comparison before approval.
  - >
    Add an activity timeline for generation, review, approval, and sync actions.
  - >
    Add saved workflow presets for recurring transcript types and team-specific rules.
  - >
    Build PM adapters for Jira, Trello, Linear, Asana, and GitHub Issues behind the
    same ticket contract.
  - >
    Add field-level edit history and change tracking for reviewed tickets.

recommended_next_prompt: >
  Read my-app/app/page.tsx and my-app/app/transcribely-workflow.tsx. Implement
  approval invalidation and sync-state reset whenever a ticket draft changes, make
  the publish CTA reflect the actual sync model, and fix acceptance-criteria input
  handling so it preserves typed text and keeps one editable UI only. Then run lint
  and the relevant workflow checks.
```
