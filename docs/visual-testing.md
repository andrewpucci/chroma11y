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

`npm run test:e2e` runs `docker compose run --rm --build test` so app source changes are always rebuilt into the test image.

## CI Pipelines

### 1) Required Visual Gate (`.github/workflows/e2e.yml`)

- Runs Playwright against local production preview (deterministic)
- Uses committed `toHaveScreenshot()` baselines
- Uploads Argos captures when:
  - `ARGOS_UPLOAD=true` on same-repo PRs
  - `ARGOS_UPLOAD=true` on pushes to `main` (post-merge baseline refresh)
  - `ARGOS_UPLOAD=false` on fork PRs by default

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
docker compose run --rm --build test
```

## Baseline Reseeding for Argos

Argos baseline refresh now happens automatically on pushes to `main` in the E2E workflow.
Manual dispatch (`workflow_dispatch`) is still available for ad-hoc runs:

- set `argos_upload=true` to upload captures to Argos
- leave it `false` for a non-upload validation run

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
