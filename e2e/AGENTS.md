# E2E Tests

Playwright end-to-end tests that run against a production build. **All E2E tests run in Docker** to ensure consistency between local development and CI.

## Setup

Run E2E tests in Docker (recommended):

```sh
npm run test:e2e
```

Update snapshots after UI changes:

```sh
npm run test:e2e:update
```

Run locally for debugging (results may differ from CI):

```sh
npm run test:e2e:local
```

See `docs/visual-testing.md` for full Docker workflow documentation.

## Browsers

Tests run in Chromium, Firefox, and WebKit. Visual regression snapshots are generated for all three browsers.

## Conventions

- Test files: `*.spec.ts`
- Shared helpers: `test-utils.ts`
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

## When to add E2E tests

**Add E2E tests when:**

- Testing full user workflows (input → process → output)
- Testing browser-specific behavior (pointer events, clipboard, downloads)
- Testing interactions that require real rendering (drag, resize, scroll)
- Testing cross-browser compatibility
- Testing visual appearance

**Don't add E2E tests when:**

- Testing pure function logic (use unit tests)
- Testing component rendering/ARIA (use DOM tests)
- Testing library behavior (don't test dependencies)

## Test selectors

Prefer these selector strategies in order:

1. `data-testid` attributes for stable selectors
2. ARIA roles and labels (`getByRole`, `getByLabel`)
3. Text content for user-visible elements
4. CSS classes only when necessary (fragile)

## Visual comparisons (snapshots)

Visual regression tests use Playwright's `toHaveScreenshot()` API. Snapshots are stored in `{test-file}.spec.ts-snapshots/` directories and **must be committed** to version control.

### Generating snapshots

All snapshots are generated in Docker to match CI environment:

```sh
# Update snapshots after UI changes
npm run test:e2e:update
```

### Best practices

- Name snapshots explicitly: `await expect(page).toHaveScreenshot('palette-grid.png')`
- Snapshots include browser suffix automatically: `palette-grid-chromium.png`, `palette-grid-firefox.png`, `palette-grid-webkit.png`
- All snapshots are Linux-generated for consistency across local dev and CI
- Use `stylePath` option to hide dynamic content (timestamps, animations)

### Current coverage

Visual regression tests are implemented in:

- **`focus-indicators.spec.ts`** — Focus ring appearance (light/dark)
- **`ui-interactions.spec.ts`** — Full app themes, palette grid, neutral palette
- **`mobile-responsiveness.spec.ts`** — Mobile layouts (iPhone SE, 320px)
- **`bezier-editor.spec.ts`** — Bezier curve editor appearance

Snapshots are stored in `*.spec.ts-snapshots/` directories and committed to version control.

## Adding new test files

When adding a new E2E test file:

1. Name it descriptively: `feature-name.spec.ts`
2. Add a JSDoc header explaining what the file tests
3. Use `waitForAppReady()` in `beforeEach`
4. Update the "Test file inventory" section below

## Test file inventory

- **`algorithm-validation.spec.ts`** — Color generation algorithm correctness
- **`bezier-editor.spec.ts`** — Bezier curve editor drag interactions + visual regression
- **`design-tokens.spec.ts`** — Design token system runtime behavior
- **`export-validation.spec.ts`** — Export format correctness
- **`focus-indicators.spec.ts`** — Focus ring visibility, behavior + visual regression
- **`mobile-responsiveness.spec.ts`** — Responsive layout testing + visual regression
- **`persistence.spec.ts`** — URL and localStorage state persistence
- **`ui-interactions.spec.ts`** — General UI interaction flows + visual regression (themes, palettes)
