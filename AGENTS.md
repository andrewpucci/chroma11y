# AGENTS.md

Global instructions for Cascade. Directory-specific guidance lives in scoped `AGENTS.md` files (`src/lib/`, `src/lib/components/`, `e2e/`).

Chroma11y is an accessible color palette generator powered by OKLCH, with WCAG 2.1 and APCA contrast checking, configurable display color spaces, and multiple export formats. It is a single-page app (SPA) built with Svelte 5 and SvelteKit, deployed as a static site.

## Setup commands

- Install deps: `npm install`
- Start dev server: `npm run dev` (Vite, usually http://localhost:5173)
- Build for production: `npm run build`
- Preview production build: `npm run preview`

## Testing

This project has three test layers. **All tests must pass before any commit.**

### Unit tests (Vitest)

```sh
npm run test:unit        # watch mode
npm run test:unit -- --run  # single run
```

- Pure logic tests live alongside source: `src/lib/*.spec.ts`
- DOM component tests: `src/lib/components/*.dom.spec.ts` (jsdom + @testing-library/svelte)
- Browser component tests: `src/**/*.svelte.{test,spec}.ts` (Vitest browser mode with Playwright)

Vitest is configured with **three projects** in `vite.config.ts`:

| Project  | Environment               | File pattern                                                   |
| -------- | ------------------------- | -------------------------------------------------------------- |
| `dom`    | jsdom                     | `src/**/*.dom.{test,spec}.{js,ts}`                             |
| `client` | Vitest browser/Playwright | `src/**/*.svelte.{test,spec}.{js,ts}`                          |
| `server` | Node                      | `src/**/*.{test,spec}.{js,ts}` (excluding dom/svelte patterns) |

`expect.requireAssertions` is enabled globally — every test must contain at least one assertion.

### E2E tests (Playwright)

```sh
npm run test:e2e
npx playwright test --ui   # interactive UI mode
```

- Test files: `e2e/*.spec.ts`
- Runs against a production build (`npm run build && npm run preview` on port 4173)
- Tests run in Chromium, Firefox, and WebKit

### Run everything

```sh
npm test
```

This runs unit tests (single run) followed by E2E tests.

## Linting & formatting

```sh
npm run lint       # check (Prettier + ESLint)
npm run lint:fix   # auto-fix
npm run format     # Prettier write
npm run check      # svelte-check (type checking)
```

- Prettier: 2-space indent, single quotes, no trailing commas, 100 char print width
- ESLint: recommended JS/TS rules + svelte plugin + prettier compat
- TypeScript: strict mode, bundler module resolution

## Tech stack

- **Framework**: Svelte 5 with SvelteKit (static adapter, SPA mode with `index.html` fallback)
- **Language**: TypeScript 5.9, strict mode
- **Build**: Vite 7
- **Color science**: `colorjs.io` (OKLCH, gamut mapping, WCAG 2.1 contrast, APCA contrast, CIEDE2000 delta)
- **Easing**: `bezier-easing` (lightness curve control points)
- **Color naming**: `color-name-list` (CIEDE2000 nearest-match)
- **HTML sanitization**: `dompurify`
- **Testing**: Vitest 4 (unit/DOM/browser) + Playwright (E2E) + @testing-library/svelte
- **Node**: ≥24.13.0

## Project structure

```
src/
├── lib/
│   ├── components/          # Svelte 5 components (.svelte) + co-located DOM tests (.dom.spec.ts)
│   ├── styles/              # Shared CSS files
│   ├── colorUtils.ts        # Core color generation algorithms (OKLCH, bezier, contrast, naming)
│   ├── exportUtils.ts       # Export format generators (JSON design tokens, CSS, SCSS)
│   ├── stores.ts            # Svelte writable/derived stores (central state)
│   ├── storageUtils.ts      # localStorage persistence
│   ├── urlUtils.ts          # URL state encoding/decoding
│   ├── drawerStore.ts       # Color info drawer state
│   ├── announce.ts          # Screen reader announcement utility (aria-live)
│   └── types.ts             # Shared TypeScript interfaces
├── routes/
│   ├── +page.svelte         # Main application page (single route)
│   ├── +layout.svelte       # Root layout
│   └── +layout.ts           # Disables SSR (prerender + SPA)
└── app.html                 # HTML shell
e2e/                         # Playwright E2E test specs
scripts/                     # Build-time scripts (favicon generation)
static/                      # Static assets (favicon, manifest, robots.txt)
```

## Architecture & patterns

Detailed store patterns, color generation pipeline, persistence, export formats, and component inventory are documented in the scoped `AGENTS.md` files under `src/lib/` and `src/lib/components/`.

### Accessibility

This is an accessibility-focused project. Maintain these patterns globally:

- **Screen reader announcements** via `announce()` dispatching `app:announce` custom events to an aria-live region
- **ARIA labels** on all interactive elements
- **Keyboard navigation** support throughout
- **Skip link** to main content
- **Contrast ratios** displayed for every swatch (WCAG 2.1 AA 4.5:1 or APCA Lc 60 threshold, configurable)
- `role="application"` on the app shell
- Never remove ARIA attributes, keyboard handlers, or screen reader announcements without replacement

## Svelte 5 conventions

This project uses **Svelte 5 with runes**. Follow these patterns:

- Use `$state()` for reactive local state, `$derived()` for computed values, `$effect()` for side effects
- Use `$props()` for component props (not `export let`)
- Use `bind:` for two-way bindings
- Use `onclick={handler}` event attributes (not `on:click`)
- Use `{#snippet}` and `{@render}` instead of slots where applicable
- Stores use the classic `writable`/`derived` API from `svelte/store` (not runes) — this is intentional for cross-module shared state
- Component DOM tests use `@testing-library/svelte` with `render()` and `screen` queries
- Scoped `<style>` blocks for component CSS — no Tailwind, no CSS-in-JS

## Code style

- TypeScript strict mode — no `any` unless absolutely necessary
- JSDoc comments on all functions (public, exported, and internal)
- Prettier formatting: 2 spaces, single quotes, no trailing commas, 100 char width
- Keep components focused and single-purpose
- Pure functions preferred — side effects isolated to stores and `$effect()`
- Error handling: try/catch with fallback values (never crash the UI)
- Color objects (`colorjs.io` `Color`) are the internal representation; hex conversion happens at the store/display layer
- Helper functions mutate the store: `updateColorState()`, `setTheme()`, `setThemePreference()`, `updateLightnessNudger()`, `updateHueNudger()`, `updateContrastFromNeutrals()`, `updateContrastStep()`, `resetColorState()`

## Security

- HTML content sanitized with DOMPurify before rendering
- URL parameters validated with strict bounds checking (type, range, format)
- localStorage reads wrapped in try/catch with shape validation
- No external API calls — all computation is client-side

## PR guidelines

- Run `npm run lint && npm run check && npm test` before committing
- Add or update tests for any code you change
- Commit message format: `prefix: short description` (e.g., `feat:`, `fix:`, `tweak:`, `refactor:`, `test:`, `docs:`, `chore:`)
- Keep accessibility intact — never remove ARIA attributes, keyboard handlers, or screen reader announcements without replacement
