---
name: transcribely-triage
description: Use when starting any new Transcribely feature, bug fix, refactor, integration, test, documentation, or research request to classify scope, risks, missing information, and the next development step before implementation.
---

# Transcribely Triage

Use this skill at the start of any Transcribely work item.

## Instructions

1. Identify the user request in one clear sentence.
2. Classify the request as one of:
   - feature
   - bug
   - refactor
   - documentation
   - integration
   - test
   - research
3. Check for missing requirements, unclear acceptance criteria, and hidden assumptions.
4. Check for risks:
   - user data and transcript privacy
   - AI hallucination or unsupported ticket details
   - human approval bypass
   - ClickUp or future PM-tool compatibility
   - schema drift between backend, frontend, and PM payloads
   - migration, data loss, or integration side effects
5. Recommend the next skill or agent step.

## Output Format

Return a triage result with:

```yaml
request_type:
confidence_score:
scope_size:
missing_information:
risk_level:
recommended_next_step:
affected_areas:
```

Keep the result concise and actionable.
