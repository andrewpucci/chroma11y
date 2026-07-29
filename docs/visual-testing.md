# Visual Testing Workflow

This project uses an Argos-only visual regression workflow for E2E tests:

- **Deterministic E2E execution** against a local production preview (`npm run build && npm run preview`)
- **Visual capture and review in Argos** (no Playwright file snapshot baselines in git)
- **Cloudflare Pages deploy smoke checks** for functional validation without pixel assertions

## Quick Reference

| Command                         | Description                                        |
| ------------------------------- | -------------------------------------------------- |
| `npm run test:e2e`              | Run full E2E suite in Docker (CI parity)           |
| `npm run test:e2e:local`        | Run Playwright tests locally (debugging)           |
| `npm run test:e2e:deploy-smoke` | Run non-visual deploy smoke checks (Chromium only) |

`npm run test:e2e` runs `docker compose run --rm --build test` so app source changes are
rebuilt into the test image.

## CI Pipelines

### 1) Required E2E + Visual Capture (`.github/workflows/e2e.yml`)

- Runs Playwright against local production preview (deterministic)
- Visual checkpoints are captured through `e2e/visual.ts` and uploaded to Argos when allowed
- Upload behavior:
  - Same-repo PRs: `ARGOS_UPLOAD=true`
  - Pushes to `main`: `ARGOS_UPLOAD=true` (baseline refresh)
  - Fork PRs: `ARGOS_UPLOAD=false`

### 2) Deploy Smoke (`.github/workflows/deploy-smoke.yml`)

- Runs automatically for same-repo pull requests after the Cloudflare Pages preview deployment for
  the current commit succeeds
- Runs automatically on pushes to `main` against production
- Manual dispatch still accepts a `base_url` override for ad hoc smoke checks
- Runs `e2e/deploy-smoke.spec.ts` only
- Verifies load and core functional paths (no visual assertions)
- Fork pull requests are skipped because Cloudflare Pages does not create preview URLs for forks

## Argos Capture Behavior

All visual checkpoints live in `e2e/visual-regression.spec.ts` and call
`maybeCaptureArgosVisual(...)`.

- Upload is gated by `ARGOS_UPLOAD=true`
- Captures are attempted for all Playwright projects (Chromium, Firefox, WebKit)
- Snapshot names include project/browser suffixes to avoid collisions

When uploads are disabled (for example fork PRs or default local runs), visual tests still run and
must pass deterministic non-visual assertions before each capture point.

## Visual Checkpoint Inventory

The visual suite captures these states:

1. App full page light
2. App full page dark
3. Focus indicator light
4. Focus indicator dark
5. Mobile full page light (375x667)
6. Mobile full page dark (375x667)
7. Sidebar controls panel compact default state
8. Output settings tooltip open in OKLCH mode
9. Drawer open from neutral swatch
10. Palette grid after hue nudger change
11. Bezier editor after control point move

Guidance for future visual captures:

- Prefer distinct risk states over exhaustive default-state coverage.
- Let full-page captures subsume nested default component states when they are already visible in the page-level snapshot.
- Add element-level captures only when the state would be too small, too transient, or too noisy to validate well in the full-page view.

## Local Development

Use local runs to debug behavior and selectors:

```bash
npm run test:e2e:local
```

To verify upload behavior intentionally, run with Argos env configured in a trusted context.

## Troubleshooting

### Fork PRs do not upload to Argos

Expected. Fork PRs intentionally skip uploads due to secret/integration constraints.

### Local run passes but Argos shows visual diffs

Expected when UI changed; review and approve/update Argos baselines through the Argos workflow.

### `npm run test:e2e` fails but local run passes

Investigate environment-sensitive issues first; Docker run is the CI-parity source of truth.
