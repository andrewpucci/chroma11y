# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues.

Prefer the GitHub MCP tools for reads and writes from agent chat when available. Use the `gh` CLI as the fallback and default shell workflow.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`
- **Read an issue**: `gh issue view <number> --comments`
- **List issues**: `gh issue list --state open`
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close an issue**: `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v` when using `gh` inside this clone.

## When a skill says "publish to the issue tracker"

Create a GitHub issue in `andrewpucci/chroma11y`.

## When a skill says "fetch the relevant ticket"

Fetch the GitHub issue and its comments.
