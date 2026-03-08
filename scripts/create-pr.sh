#!/usr/bin/env sh
set -eu

TEMPLATE_FILE='.github/pull_request_template.md'

if [ ! -f "$TEMPLATE_FILE" ]; then
  echo "Missing PR template: $TEMPLATE_FILE" >&2
  exit 1
fi

for arg in "$@"; do
  case "$arg" in
    -b|--body|--body=*|-F|--body-file|--body-file=*)
      echo "Do not pass --body/--body-file to this script; use the PR template fields instead." >&2
      exit 1
      ;;
  esac
done

gh pr create --template "$TEMPLATE_FILE" "$@"
