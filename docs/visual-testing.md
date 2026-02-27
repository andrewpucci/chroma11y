# Visual Testing Workflow

This project uses an Argos-only visual regression workflow for E2E tests:

- **Deterministic E2E execution** against a local production preview (`npm run build && npm run preview`)
- **Visual capture and review in Argos** (no Playwright file snapshot baselines in git)
- **Netlify deploy smoke checks** for functional validation without pixel assertions

## Quick Reference

| Command                          | Description                                        |
| -------------------------------- | -------------------------------------------------- |
| `npm run test:e2e`               | Run full E2E suite in Docker (CI parity)           |
| `npm run test:e2e:local`         | Run Playwright tests locally (debugging)           |
| `npm run test:e2e:netlify-smoke` | Run non-visual deploy smoke checks (Chromium only) |

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

### 2) Netlify Smoke (`.github/workflows/netlify-smoke.yml`)

- Waits for Netlify deploy preview URL
- Runs `e2e/netlify-smoke.spec.ts` only
- Verifies load and core functional paths (no visual assertions)

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
3. Palette grid default
4. Neutral palette default
5. Bezier editor default
6. Focus indicator light
7. Focus indicator dark
8. Mobile full page light (375x667)
9. Mobile full page dark (375x667)
10. Sidebar controls panel desktop
11. Display settings tooltip open in OKLCH mode
12. Contrast controls in custom mode
13. Contrast algorithm switched to APCA
14. Drawer open from neutral swatch
15. Palette grid after hue nudger change
16. Neutral palette after lightness nudger change
17. Bezier editor after control point move
18. Export controls panel

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
