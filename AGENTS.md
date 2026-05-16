# AGENTS.md

Global instructions for agents working in this codebase. Directory-specific guidance lives in scoped `AGENTS.md` files (`src/lib/`, `src/lib/components/`, `e2e/`).

Chroma11y is an accessible color palette generator powered by OKLCH, with WCAG 2.2 and APCA contrast checking, configurable display color spaces, and multiple export formats. Single-page app (SPA) built with Svelte 5 + SvelteKit, deployed as a static site.

## Design context reference

Persistent UI and UX guidance lives in `.impeccable.md` at the project root. Read the `## Design Context`
section before making meaningful visual, interaction, or product-design decisions. Expect that file to
capture durable guidance about users, brand personality, aesthetic direction, and design principles.
Update `.impeccable.md` when the project's long-term design direction changes instead of duplicating the
same guidance elsewhere.

## Agent skills

### Issue tracker

Issues are tracked in this repo's GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the canonical labels `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This repo uses a single-context domain-doc layout rooted at `CONTEXT.md` and `docs/adr/` when present. See `docs/agents/domain.md`.

## Build commands

| Command                     | Description                                   |
| --------------------------- | --------------------------------------------- |
| `npm install`               | Install dependencies                          |
| `npm run dev`               | Start Vite dev server (http://localhost:5173) |
| `npm run build`             | Build for production                          |
| `npm run preview`           | Preview production build (port 4173)          |
| `npm run generate:favicons` | Generate favicons from `static/favicon.svg`   |
| `npm run hooks:install`     | Manually reinstall Husky hooks                |

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
npm run test:coverage         # unit coverage report (V8 coverage provider)
npm run test:e2e              # Docker (CI-matching, rebuilds test image)
npm run test:e2e:local        # Playwright directly for fast local debugging, not the preferred parity run
npm run test:e2e:netlify-smoke # deploy smoke checks (Chromium)
npm run test:lighthouse       # Lighthouse CI audit + opens representative report
npm test                      # unit + e2e
```

Use `npm run test:e2e` for CI-matching confidence before opening or updating a PR. Use
`npm run test:e2e:local` for faster iteration when debugging a single spec, browser, or
Playwright interaction locally.

Test layers - **all must pass before commit**:

| Layer         | What                                              | File pattern                                            |
| ------------- | ------------------------------------------------- | ------------------------------------------------------- |
| Unit (server) | Pure functions, algorithms, isolated modules      | `src/**/*.{test,spec}.{js,ts}` (excluding `.dom` tests) |
| Unit (dom)    | Component rendering, user events, ARIA            | `src/**/*.dom.{test,spec}.{js,ts}`                      |
| E2E           | Full user flows, visual output, drag interactions | `e2e/*.spec.ts`                                         |

**Testing principles:**

- Test your own code, not dependencies — test wrapper function behavior
- Avoid duplicate coverage — default to the lowest effective test layer and only repeat coverage when each layer is asserting a different integration risk
- Document intentional coverage gaps — add JSDoc comment explaining why and reference the E2E test
- Prefer integration over isolation — component tests with real interactions are more valuable than mocking everything
- Keep tests focused — each test verifies one behavior, use descriptive `it()` names
- New E2E coverage must justify why unit or DOM tests are insufficient

**What belongs in each layer:**

- Unit (server): Pure functions, algorithms, data transformations — NOT DOM interactions
- Unit (dom): Component rendering, user events, ARIA attributes, persistence wiring, and most form interactions — NOT pointer capture or SVG transforms
- E2E: Browser-native behavior, full integrated workflows, real downloads, responsive/layout behavior, cross-browser behavior, drag interactions, and visual checkpoints

Default layering guidance:

- Prefer unit/server tests for pure logic, serialization, normalization, and store behavior
- Prefer DOM tests for component interaction, persistence UI wiring, and most accessible form flows
- Reserve E2E for behaviors that depend on the real browser event model, layout engine, download pipeline, or cross-browser rendering

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
npm run check:watch # svelte-check in watch mode
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

## Local git hooks

Husky hooks are installed automatically by `npm install` (via `prepare`):

- `pre-commit`: `npm run lint-staged` (Prettier + ESLint on staged files)
- `pre-push`: `npm run check` and `npm run test:unit -- --run`
- `commit-msg`: commitlint conventional-commit validation
- Allowed commit types: `feat`, `fix`, `tweak`, `refactor`, `test`, `docs`, `chore`

## PR guidelines

Run before opening/updating a PR: `npm run lint && npm run check && npm test`

- Add/update tests for any code change
- Commit format: `prefix: description` (feat:, fix:, tweak:, refactor:, test:, docs:, chore:)
- Open PRs with GitHub UI or `gh pr create`, and make the PR body follow `.github/pull_request_template.md`
- PR title format (CI enforced): `<type>: <summary> (#<issue-number>)` or `<type>: <summary> [no-issue]`
- Allowed PR title types: `feat`, `fix`, `tweak`, `refactor`, `test`, `docs`, `chore`
- Keep accessibility intact

## Issue guidelines

- Use issue forms in `.github/ISSUE_TEMPLATE/` (`Bug report`, `Feature request`, `Documentation improvement`)
- Do not use blank issues (disabled in `config.yml`)
- Security vulnerabilities must be reported privately via GitHub Security Advisories:
  `https://github.com/andrewpucci/chroma11y/security/advisories/new`
