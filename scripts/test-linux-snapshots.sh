#!/bin/bash

# Generate Linux snapshots matching GitHub Actions CI environment
# Supports all browsers: Chromium, Firefox, WebKit
# Usage: ./scripts/test-linux-snapshots.sh [--update-only]

set -e

echo "🐳 Building Docker environment matching GitHub Actions (ubuntu-latest + Node 24)..."
docker compose build

echo "📸 Generating Linux snapshots for all browsers (Chromium, Firefox, WebKit)..."
docker compose run --rm update-snapshots

if [[ "$1" != "--update-only" ]]; then
  echo "🧪 Validating snapshots..."
  docker compose run --rm test
fi

echo ""
echo "✅ Linux snapshots generated in e2e/*-snapshots/"
echo ""
echo "Next steps:"
echo "1. Review the generated snapshots"
echo "2. Commit the .png files to version control"
echo "3. CI tests will use these same snapshots"
