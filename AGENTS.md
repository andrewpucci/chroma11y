# AGENTS.md

Global instructions for agents working in this codebase. Directory-specific guidance lives in scoped `AGENTS.md` files (`src/lib/`, `src/lib/components/`, `e2e/`).

Chroma11y is an accessible color palette generator powered by OKLCH, with WCAG 2.2 and APCA contrast checking, configurable display color spaces, and multiple export formats. Single-page app (SPA) built with Svelte 5 + SvelteKit, deployed as a static site.

## Build commands

| Command           | Description                                   |
| ----------------- | --------------------------------------------- |
| `npm install`     | Install dependencies                          |
| `npm run dev`     | Start Vite dev server (http://localhost:5173) |
| `npm run build`   | Build for production                          |
| `npm run preview` | Preview production build (port 4173)          |

## Running tests

**Single test file:**

```sh
npm run test:unit -- src/lib/colorUtils.spec.ts          # server (Node)
npm run test:unit -- src/lib/components/ColorSwatch.dom.spec.ts  # dom (jsdom)
```

**Single test in file:**

```sh
npm run test:unit -- src/lib/colorUtils.spec.ts -t "test name"
```

**Run all:**

```sh
npm run test:unit -- --run    # unit only, single run
npm run test:e2e              # Docker (CI-matching, rebuilds test image)
npm run test:e2e:local        # Playwright directly
npm run test:lighthouse       # Lighthouse CI audit + opens representative report
npm test                      # unit + e2e
```

Test layers - **all must pass before commit**:

| Layer         | What                                              | File pattern                                                          |
| ------------- | ------------------------------------------------- | --------------------------------------------------------------------- |
| Unit (server) | Pure functions, algorithms                        | `src/**/*.{test,spec}.{js,ts}` (excluding `.dom` and `.svelte` tests) |
| Unit (dom)    | Component rendering, user events, ARIA            | `src/**/*.dom.{test,spec}.{js,ts}`                                    |
| Unit (client) | Browser-based Svelte component tests (Playwright) | `src/**/*.svelte.{test,spec}.{js,ts}`                                 |
| E2E           | Full user flows, visual output, drag interactions | `e2e/*.spec.ts`                                                       |

**Testing principles:**

- Test your own code, not dependencies — test wrapper function behavior
- Avoid duplicate coverage — don't test same logic in multiple places unless testing different integration points
- Document intentional coverage gaps — add JSDoc comment explaining why and reference the E2E test
- Prefer integration over isolation — component tests with real interactions are more valuable than mocking everything
- Keep tests focused — each test verifies one behavior, use descriptive `it()` names

**What belongs in each layer:**

- Unit (server): Pure functions, algorithms, data transformations — NOT DOM interactions
- Unit (dom): Component rendering, user events, ARIA attributes — NOT pointer capture or SVG transforms
- Unit (client): Browser-mode Svelte component behavior (`.svelte.spec.ts`) — NOT full app flows
- E2E: Full user flows, visual output, cross-browser behavior, drag interactions

**Intentional coverage gaps:**

- Pointer/drag interactions in BezierEditor — jsdom doesn't support getBoundingClientRect or pointer capture; tested via E2E
- Defensive error handling — try/catch for exceptional conditions documented inline
- Browser environment guards (typeof window !== 'undefined') can't be meaningfully unit tested

## Linting & formatting

```sh
npm run lint       # check (Prettier + ESLint)
npm run lint:fix   # auto-fix
npm run format     # Prettier write
npm run check      # svelte-check (type checking)
```

## Code style

### TypeScript

- Strict mode — no `any` unless absolutely necessary
- Explicit return types on exported functions
- Use interfaces over types for public APIs

### Prettier: 2 spaces, single quotes, no trailing commas, 100 char width

### Imports ordering

1. Svelte/core (`svelte`, `svelte/store`)
2. Third-party (`colorjs.io`, etc.)
3. `$lib/` relative imports
4. Same directory

### Naming conventions

- Files: PascalCase components (`ColorSwatch.svelte`), camelCase utils (`colorUtils.ts`)
- Functions: camelCase with verb prefixes (`generatePalettes`, `getContrast`)
- Constants: SCREAMING_SNAKE_CASE config, camelCase exports
- Types/Interfaces: PascalCase

### JSDoc & Error handling

- Required on all exported functions (include @param, @returns)
- Never crash the UI — try/catch with fallback values
- Document defensive code with JSDoc explaining why it can't be unit tested

## Svelte 5 conventions (runes)

- `$state()`, `$derived()`, `$effect()` for local reactivity
- `$props()` (not `export let`)
- `onclick={handler}` (not `on:click`)
- `{#snippet}` / `{@render}` instead of slots
- Stores use classic `writable`/`derived` from `svelte/store` (not runes)
- Scoped `<style>` blocks — no Tailwind, no CSS-in-JS

## Design tokens

All hardcoded CSS values should use design tokens from `src/lib/styles/tokens.css`. Never add new static `px` values — use or extend the token system. Run token tests before committing: `npm run test:unit -- --run src/lib/styles/tokens.spec.ts`

## Accessibility (critical)

- Screen reader announcements via `announce()` to aria-live region
- ARIA labels on all interactive elements
- Keyboard navigation throughout
- Inline slider number inputs must remain keyboard accessible and sync with range sliders
- Contrast ratios displayed for every swatch (WCAG 2.2 AA or APCA)
- Never remove ARIA attributes, keyboard handlers, or announcements without replacement

## Security

- HTML sanitized with DOMPurify
- URL params validated (strict bounds checking)
- localStorage reads wrapped in try/catch with shape validation
- No external API calls — all client-side

## PR guidelines

Run before commit: `npm run lint && npm run check && npm test`

- Add/update tests for any code change
- Commit format: `prefix: description` (feat:, fix:, tweak:, refactor:, test:, docs:, chore:)
- Keep accessibility intact
