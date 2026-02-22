# E2E Tests

Playwright end-to-end tests that run against a production build.

## Setup

Tests require a built app served on port 4173:

```sh
npm run build && npm run preview
```

Or run everything with:

```sh
npm run test:e2e
```

## Browsers

Tests run in Chromium, Firefox, and WebKit.

## Conventions

- Test files: `*.spec.ts`
- Shared helpers: `test-utils.ts`
- Screenshots: `screenshots/` (visual comparison baselines)
- Use Playwright's `--ui` flag for interactive debugging: `npx playwright test --ui`
- Tests should cover real user flows — navigation, interactions, visual output
- Accessibility assertions (ARIA, keyboard nav) are encouraged in E2E tests too

## What E2E tests should cover

E2E tests are the right place for interactions that can't be reliably unit tested:

- **Pointer/drag interactions** — `BezierEditor` control point dragging, slider interactions
- **SVG coordinate transforms** — Anything involving `getBoundingClientRect` or viewport calculations
- **Cross-browser behavior** — Tests run in Chromium, Firefox, and WebKit
- **Full user flows** — Complete workflows from input to output (e.g., generate palette → export)
- **Visual regression** — Screenshot comparisons for UI consistency

## Relationship to unit tests

E2E tests complement unit tests — they don't replace them:

| Unit tests cover    | E2E tests cover           |
| ------------------- | ------------------------- |
| Pure function logic | Full user workflows       |
| Store mutations     | Browser-specific behavior |
| Component rendering | Drag/pointer interactions |
| ARIA attributes     | Visual appearance         |

When adding code that can't be unit tested (e.g., pointer capture handlers), document in the source file which E2E test covers it:

```typescript
/**
 * Note: Pointer drag interactions are tested via E2E in e2e/bezier-editor.spec.ts
 */
```

## Test file inventory

- **`algorithm-validation.spec.ts`** — Color generation algorithm correctness
- **`bezier-editor.spec.ts`** — Bezier curve editor drag interactions
- **`design-tokens.spec.ts`** — Design token system runtime behavior
- **`export-validation.spec.ts`** — Export format correctness
- **`focus-indicators.spec.ts`** — Focus ring visibility and behavior
- **`mobile-responsiveness.spec.ts`** — Responsive layout testing
- **`persistence.spec.ts`** — URL and localStorage state persistence
- **`ui-interactions.spec.ts`** — General UI interaction flows
