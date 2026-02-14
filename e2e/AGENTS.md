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
