---
name: transcribely-quality-chain
description: Use before considering any Transcribely implementation complete to run or define lint, typecheck, tests, build, schema validation, duplicate detection, transcript edge cases, PM payload validation, and human approval checks.
---

# Transcribely Quality Chain

Use this skill before considering implementation complete.

## Required Check Categories

Run or define the closest available checks for the current stack:

- lint
- typecheck
- unit tests
- build
- schema validation
- duplicate ticket detection
- empty transcript handling
- PM payload validation
- human approval gate

## JavaScript or Frontend Checks

If scripts are available, run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Run only the scripts that exist in the relevant `package.json`.

## Python Backend Checks

If the project uses the Python backend, check for:

- `pytest`
- `ruff` or `flake8`
- Pydantic schema validation

## Output Format

```yaml
checks_run:
checks_passed:
checks_failed:
fixes_applied:
remaining_risks:
```

If a check cannot be run, state why and name the closest manual or automated substitute.
