# Transcribely Multi-Agent Architecture

## Text Diagram

```text
User Request
  |
  v
AI Agents Team
  |
  v
Marcus: Triage, risk scoring, guardrails
  |
  v
Elena: Scope files, architecture, exclusive ownership
  |
  v
Specialist Agents
  |-- Rafa: Backend, API, schemas, services, integrations
  |-- Mia: Frontend, upload UI, ticket cards, approval panel
  |-- Nico: Tests, validation, quality gates
  |
  v
Quality Chain
  |-- lint
  |-- typecheck
  |-- tests
  |-- build
  |-- schema validation
  |-- duplicate detection
  |-- PM payload validation
  |-- human approval gate validation
  |
  v
Human Review and Approval
  |
  v
Ship Agent: approved implementation or approved PM sync
  |
  v
Lena: AI overview, documentation summary, architecture notes
```

## Role Explanation

Marcus is the intake and guardrail agent. Marcus classifies the request, checks missing requirements, scores risk, and protects the rule that generated tickets cannot be synced without human approval.

Elena maps the work before edits begin. Elena identifies the minimum files to change, assigns exclusive ownership, and keeps implementation order clear.

Specialist agents perform focused implementation work. Rafa owns backend and integrations, Mia owns frontend and approval UI, and Nico owns test coverage and validation.

Operational visibility matters as much as ownership. During progress reporting, the active role should be named explicitly so the user can tell whether the work is in triage, scoping, frontend, backend, QA, or documentation.

The quality chain runs before work is considered complete. It checks code quality, schema compatibility, generated-ticket quality, duplicate handling, empty transcript behavior, PM payload validity, and human approval enforcement.

The Ship Agent prepares final delivery. For PM sync, it should only send tickets that have been explicitly approved and should store external ticket identifiers after successful sync.

Lena closes the loop with documentation. Lena summarizes the feature, affected files, agent roles, quality checks, known limitations, and next recommended step.
