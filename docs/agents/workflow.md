# Transcribely Workflow

## Transcript to PM Sync

1. User uploads or pastes a meeting transcript.
2. The app validates the transcript and rejects empty or unsupported input.
3. Transcript cleaning removes noise while preserving requirements, decisions, concerns, and unclear items.
4. Marcus triages the request or transcript-derived work, classifying risk and missing information.
5. Elena scopes the implementation or ticket-generation responsibilities and assigns file ownership when code changes are needed.
6. The ticket-generation pipeline creates draft tickets from transcript evidence.
7. Generated tickets include title, description, user story, acceptance criteria, priority, ticket type, suggested assignee role, tags, dependencies, estimated effort, and open questions.
8. Nico validates ticket quality, schema compatibility, duplicate tickets, empty transcript handling, and PM payload readiness.
9. The user reviews generated tickets as editable cards.
10. The user approves tickets that are ready to sync.
11. The ship layer converts approved internal tickets into PM-tool payloads.
12. ClickUp sync creates external tasks and stores returned external ticket IDs.
13. Lena documents the change or summarizes the generated output when needed.

## Human Approval Gate

Generated tickets are drafts until a human approves them. Draft, rejected, unreviewed, or AI-only tickets must not be synced to ClickUp or any future PM tool.

## Future PM Tools

Future integrations should be added through adapters so the core ticket-generation flow does not depend on a specific PM vendor. Planned adapter targets include Jira, Trello, Linear, GitHub Issues, and Asana.

## Recommendation Pass

When the team wants improvement ideas instead of immediate implementation, run a recommendation pass using [recommendations.md](/C:/Users/carlconrad/Documents/Production/webdev/AI_Sprint_Ticket_Orchestrator/docs/agents/recommendations.md). The recommendation pass should read the repo guidance files first, then return prioritized suggestions for immediate v0.1 gaps, quick wins, technical debt, UX issues, and later-phase roadmap ideas.

For ready-to-use prompts and role examples, see [README.md](C:/Users/carlconrad/Documents/Production/webdev/AI_Sprint_Ticket_Orchestrator/docs/agents/README.md) in this folder.

## Named Agent Updates

During implementation, progress updates should show which role is currently active. This is for visibility, not literal process isolation.

Use role-prefixed updates such as:

- `Marcus: this request is a frontend UX fix with no backend contract change.`
- `Elena: minimum files are the extracted workflow module and the route file only if prop wiring is needed.`
- `Mia: the editable ticket state is now handler-based instead of effect-based.`
- `Nico: lint is running to verify the workflow split and editable panel changes.`
- `Lena: the summary and affected-files notes are updated.`

If work moves from one area to another, switch the prefix to match the current owner instead of continuing with anonymous updates.
