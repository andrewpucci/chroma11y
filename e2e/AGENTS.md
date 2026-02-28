# E2E Tests

Playwright end-to-end tests run against a production build. Full-suite CI parity runs use Docker.

CI pipelines:

- `e2e.yml`: deterministic E2E execution + Argos visual capture
- `netlify-smoke.yml`: deploy-preview functional smoke checks (no visual assertions)

## Setup

Run E2E in Docker (recommended for parity):

```sh
npm run test:e2e
```

Run locally for debugging:

```sh
npm run test:e2e:local
```

Run deploy-preview smoke checks only:

```sh
npm run test:e2e:netlify-smoke
```

See `docs/visual-testing.md` for the full visual workflow.

## Browsers

Tests run in Chromium, Firefox, and WebKit.

## Conventions

- Test files: `*.spec.ts`
- Shared helpers: `test-utils.ts`
- Use Playwright UI mode for local debugging: `npx playwright test --ui`
- E2E should focus on full user flows, browser behavior, and integration outcomes

## What E2E tests should cover

- Pointer/drag interactions requiring real rendering
- SVG coordinate interactions and viewport-dependent behavior
- Cross-browser compatibility
- End-to-end workflows (input -> generation -> output/export)
- Inline slider numeric input flows (spinbutton entry, native steppers, slider sync, and clamping)
- Visual states through Argos capture points

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
- Palette grid + neutral palette defaults
- Bezier editor default + moved control point state
- Focus indicator states (light, dark)
- Mobile full-page states (light, dark)
- Sidebar controls panel
- Display settings tooltip open (OKLCH)
- Contrast custom mode
- Contrast algorithm APCA state
- Drawer open state
- Palette and neutral nudger-adjusted states
- Export controls panel

## Adding new test files

When adding a new E2E test file:

1. Use a descriptive name: `feature-name.spec.ts`
2. Add a JSDoc header describing scope
3. Use `waitForAppReady()` in `beforeEach` when the test starts at `/`
4. Update the test inventory below

## Test file inventory

- `algorithm-validation.spec.ts` — color generation algorithm correctness
- `bezier-editor.spec.ts` — bezier interactions, accessibility, integration behaviors
- `design-tokens.spec.ts` — runtime behavior of design token system
- `export-validation.spec.ts` — export format and download correctness
- `focus-indicators.spec.ts` — keyboard navigation + focus behavior assertions
- `mobile-responsiveness.spec.ts` — responsive layout and touch-target behavior
- `netlify-smoke.spec.ts` — deploy-preview smoke checks (non-visual)
- `persistence.spec.ts` — URL/localStorage persistence behavior
- `ui-interactions.spec.ts` — non-visual interaction flows and UI behaviors
- `visual-regression.spec.ts` — Argos-only visual checkpoint suite
