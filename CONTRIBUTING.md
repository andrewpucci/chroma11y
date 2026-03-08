# Contributing to Chroma11y

Thanks for contributing. This document is the source of truth for contribution workflow and submission quality.

## Before You Start

- Read [README.md](README.md) for project setup and architecture.
- Follow coding/testing guidance in [AGENTS.md](AGENTS.md).
- Keep accessibility behavior intact (ARIA, keyboard support, announcements, contrast reporting).

## Issues

Use the issue chooser and pick the right form:

- `Bug report`
- `Feature request`
- `Documentation improvement`

Blank issues are disabled by design.

### Issue Naming

- Bug: `[Bug]: <short problem statement>`
- Feature: `[Feature]: <capability or workflow>`
- Docs: `[Docs]: <doc area + gap>`

Each form asks for structured, actionable details (problem, expected/proposed behavior, acceptance criteria, context).

### Security Reports

Do not file vulnerabilities in public issues. Use private reporting via GitHub Security Advisories:

- <https://github.com/andrewpucci/chroma11y/security/advisories/new>

## Pull Requests

PRs use the repository PR template and must include summary, linked issue(s), impact, testing, and risk notes.

### PR Title Format (enforced in CI)

Use one of:

- `<type>: <summary> (#<issue-number>)`
- `<type>: <summary> [no-issue]`

Allowed `<type>` values:

- `feat`, `fix`, `tweak`, `refactor`, `test`, `docs`, `chore`

Examples:

- `fix: clamp invalid URL gamut params (#99)`
- `chore: update CI node patch version [no-issue]`

Dependabot PR titles are exempt from this rule.

## Required Checks

Run before opening or updating a PR:

```sh
npm run lint
npm run check
npm test
```

If any standard check is intentionally skipped, explain why in the PR body.

## Code and Test Expectations

- Add or update tests for behavior changes.
- Use the test layer that matches the change (unit, DOM, client, E2E).
- Use design tokens instead of hardcoded CSS values.
- Keep exported TypeScript APIs documented with JSDoc.
- Never remove accessibility affordances without an equivalent replacement.

## Commit Messages

Use `prefix: description`:

- `feat: ...`
- `fix: ...`
- `tweak: ...`
- `refactor: ...`
- `test: ...`
- `docs: ...`
- `chore: ...`
