# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- `CONTEXT.md` at the repo root, if it exists
- `docs/adr/` for architectural decisions relevant to the area, if it exists

If these files do not exist yet, proceed silently. Do not flag their absence or suggest creating them upfront.

## File structure

This repo is configured as a single-context repo:

```
/
├── CONTEXT.md
├── docs/adr/
└── src/
```

## Use the glossary's vocabulary

When output names a domain concept, use the term as defined in `CONTEXT.md`. If the concept is missing, note the gap rather than inventing competing terminology.

## Flag ADR conflicts

If output contradicts an existing ADR, surface that explicitly instead of silently overriding it.
