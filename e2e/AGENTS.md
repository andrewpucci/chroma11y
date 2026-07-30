# E2E Tests

Playwright end-to-end tests run against a production build. Full-suite CI parity runs use Docker.

## Workflow expectations

- Git hooks do not run E2E by default; `pre-push` currently runs type-checking and unit tests only
- For behavior or visual changes, run `npm test` (or at minimum `npm run test:e2e:local`) before opening/updating a PR
- Keep E2E tests deterministic across Chromium, Firefox, and WebKit

CI pipelines:

- `e2e.yml`: deterministic E2E execution + Argos visual capture
- `deploy-smoke.yml`: deployed site functional smoke checks after Cloudflare Pages deploys the
  current commit (same-repo PRs, `main`, or manual `base_url`)

## Setup

Run E2E in Docker (recommended for parity):

```sh
npm run test:e2e
```

Run locally for debugging:

```sh
npm run test:e2e:local
```

Run deployed Pages smoke checks only:

```sh
npm run test:e2e:deploy-smoke
```

See `docs/visual-testing.md` for the full visual workflow.

## Browsers

Tests run in Chromium, Firefox, and WebKit.

## Conventions

- Test files: `*.spec.ts`
- Shared helpers: `test-utils.ts`
- Use Playwright UI mode for local debugging: `npx playwright test --ui`
- E2E should focus on full user flows, browser behavior, and integration outcomes
- Do not add E2E coverage for browser-independent logic already covered by unit or DOM tests

## What E2E tests should cover

- Pointer/drag interactions requiring real rendering
- SVG coordinate interactions and viewport-dependent behavior
- Cross-browser compatibility
- End-to-end workflows (input -> generation -> output/export)
- Inline slider numeric input flows (spinbutton entry, native steppers, slider sync, and clamping)
- Visual states through Argos capture points
- Real downloads, responsive layout behavior, and focus-visible behavior that depends on the browser

Use this checklist before adding an E2E test:

1. The behavior depends on the real browser event model, layout engine, download pipeline, or cross-browser rendering.
2. A unit or DOM test would miss the failure mode you are targeting.
3. The test covers one high-value workflow or browser-specific risk, not generic app boot or duplicated serialization logic.

## Relationship to unit tests

| Unit tests cover    | E2E tests cover           |
| ------------------- | ------------------------- |
| Pure function logic | Full user workflows       |
| Store mutations     | Browser-specific behavior |
| Component rendering | Drag/pointer interactions |
| ARIA attributes     | Integrated visual states  |

When code cannot be meaningfully unit-tested (for example pointer capture logic), document the E2E
spec that covers it.

## Visual Regression (Argos-only)

Visual checkpoints are centralized in `visual-regression.spec.ts`.

- Captures are triggered through `maybeCaptureArgosVisual(...)` in `e2e/visual.ts`
- Upload is gated by `ARGOS_UPLOAD=true`
- Snapshot names include browser suffixes
- There are no committed Playwright `*-snapshots/` baselines

Current visual checkpoint coverage:

- App full page (light, dark)
- Focus indicator states (light, dark)
- Mobile full-page states (light, dark)
- Sidebar controls panel (compact default state)
- Output settings tooltip open (OKLCH)
- Drawer open state
- One nudger-adjusted palette state
- Bezier editor after control point move

## Adding new test files

When adding a new E2E test file:

1. Use a descriptive name: `feature-name.spec.ts`
2. Add a JSDoc header describing scope
3. Use `waitForAppReady()` in `beforeEach` when the test starts at `/`
4. Update the test inventory below

## Test file inventory

- `bezier-editor.spec.ts` — bezier interactions, accessibility, integration behaviors
- `design-tokens.spec.ts` — runtime token behavior that depends on browser media, layout, or text scaling
- `export-validation.spec.ts` — export format and download correctness
- `focus-indicators.spec.ts` — browser-rendered focus indicator assertions
- `mobile-responsiveness.spec.ts` — responsive layout and touch-target behavior
- `deploy-smoke.spec.ts` — deployed site smoke checks (non-visual)
- `persistence.spec.ts` — representative URL/localStorage restore and precedence behavior
- `ui-interactions.spec.ts` — browser-specific tooltip and compact-constraints interactions
- `visual-regression.spec.ts` — Argos-only visual checkpoint suite
