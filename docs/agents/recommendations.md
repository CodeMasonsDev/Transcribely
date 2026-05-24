# Transcribely Recommendation Review

Use this file when you want Codex to review Transcribely and recommend what to improve, fix, simplify, or build next.

## Read First

Before making recommendations, read:

- `README.md`
- `AGENTS.md`
- `docs/agents/architecture.md`
- `docs/agents/workflow.md`
- `docs/agents/quality-gates.md`

If one of those files is missing, say so and continue with the remaining context.

## Purpose

Produce a detailed, concise, and clear recommendation list for Transcribely based on the current documented product direction.

By default, if the user wants the result saved, write the recommendation output into `docs/recommendation-results.md` instead of `README.md`.

## What To Evaluate

Review the project from these angles:

- v0.1 product completeness
- transcript upload and validation gaps
- AI ticket generation quality and schema gaps
- editable ticket review-card UX
- approval workflow strength
- ClickUp sync safety and future PM-tool adapter readiness
- backend architecture and maintainability
- frontend clarity and usability
- testing and quality-chain coverage
- onboarding and documentation gaps

## Recommendation Rules

1. Base recommendations on the repository documentation, not guesswork.
2. Distinguish must-have work from later-phase work.
3. Prefer actionable recommendations over abstract advice.
4. Name the likely affected areas for each idea.
5. Call out assumptions when the docs are incomplete.
6. If the prompt asks for frontend-only, backend-only, or integration-only ideas, narrow the recommendations accordingly.
7. Do not recommend anything that bypasses the human approval gate for PM sync.

## Output Format

Return the result using this structure:

```yaml
project_stage:
summary:
top_priorities:
recommendations:
risks_and_gaps:
quick_wins:
later_phase_ideas:
recommended_next_prompt:
```

For each recommendation, include:

- title
- why_it_matters
- impact
- effort
- affected_areas
- suggested_owner
- recommended_order

## Suggested Owners

Use the existing Transcribely roles where helpful:

- Marcus: triage, guardrails, request scoring
- Elena: file scoping, architecture mapping
- Rafa: backend, APIs, integrations
- Mia: frontend, upload UI, ticket cards, approval flows
- Nico: tests, QA, validation
- Lena: docs, README, summaries

## Example Prompt

```text
Read docs/agents/recommendations.md and the repository files it references.
Then tell me what Transcribely should improve next.
Give me must-have items for v0.1, quick wins, and later-phase ideas.
```

## Example Prompt With Saved Output

```text
Read docs/agents/recommendations.md and the repository files it references.
Then review Transcribely and write the recommendation results into docs/recommendation-results.md.
Give me must-have items for v0.1, quick wins, and later-phase ideas.
```
