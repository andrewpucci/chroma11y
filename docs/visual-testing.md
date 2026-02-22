# Visual Testing Workflow

This project uses a dual workflow for E2E confidence:

- **Deterministic visual regression** in CI against a local production preview (`npm run build && npm run preview`)
- **Netlify deploy smoke checks** against deploy previews, without pixel comparison assertions

Argos is integrated for PR visual review in **phase A** while keeping existing Playwright snapshot baselines in git.

## Quick Reference

| Command                          | Description                                   |
| -------------------------------- | --------------------------------------------- |
| `npm run test:e2e`               | Run full E2E suite in Docker                  |
| `npm run test:e2e:update`        | Regenerate Linux snapshots + validate         |
| `npm run test:e2e:local`         | Run Playwright tests locally (debugging)      |
| `npm run test:e2e:netlify-smoke` | Run non-visual deploy smoke checks (Chromium) |

## CI Pipelines

### 1) Required Visual Gate (`.github/workflows/e2e.yml`)

- Runs Playwright against local production preview (deterministic)
- Uses committed `toHaveScreenshot()` baselines
- Uploads Argos captures for trusted PRs only:
  - `ARGOS_UPLOAD=true` on same-repo PRs
  - `ARGOS_UPLOAD=false` on fork PRs and manual dispatch

### 2) Netlify Smoke (`.github/workflows/netlify-smoke.yml`)

- Waits for Netlify deploy preview URL
- Runs `e2e/netlify-smoke.spec.ts` only
- Verifies load and core functional paths, no visual baseline assertions

## Phase A Migration Behavior

During phase A we keep both mechanisms for visual checks:

1. Existing Playwright `toHaveScreenshot()` assertions (git baselines)
2. Argos captures through `e2e/visual.ts` in Chromium only when `ARGOS_UPLOAD=true`

This gives rollback safety while Argos review flow stabilizes.

## Snapshot Baselines (Current Source in Phase A)

Snapshots are still generated in Docker and committed:

```bash
npm run test:e2e:update
```

Manual commands:

```bash
docker compose build
docker compose run --rm update-snapshots
docker compose run --rm test
```

## Baseline Reseeding for Argos

The E2E workflow supports manual dispatch (`workflow_dispatch`) to run a non-upload baseline-safe pass.
Use this with a run from `main` when you need to reseed/refresh Argos reference behavior.

## Troubleshooting

### Visual diffs on Netlify but not local preview

Expected in some cases due to deploy-environment rendering differences. Required visual gating is local deterministic CI; deploy checks belong in the smoke workflow.

### Fork PRs do not show Argos upload

Expected. Fork PRs intentionally skip Argos upload to avoid secret/integration constraints.

### Updating UI changed expected snapshots

Regenerate in Docker:

```bash
npm run test:e2e:update
```
