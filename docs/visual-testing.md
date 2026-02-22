# Visual Testing with Standardized Linux Snapshots

This project runs **all E2E tests in Docker** to ensure consistency between local development and CI. The Docker environment matches GitHub Actions exactly.

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Run E2E tests in Docker (recommended) |
| `npm run test:e2e:update` | Regenerate snapshots + validate |
| `npm run test:e2e:local` | Run tests locally (may differ from CI) |

## Why Docker for All E2E Tests?

- **Cross-platform consistency**: macOS and Linux render fonts/graphics differently
- **CI parity**: Local tests match GitHub Actions exactly
- **Cross-browser support**: Chromium, Firefox, and WebKit all tested
- **No flaky tests**: Same environment = same results

## Generating Snapshots

### After UI Changes
```bash
# Regenerate all snapshots and validate
npm run test:e2e:update
```

### Update Only (Skip Validation)
```bash
./scripts/test-linux-snapshots.sh --update-only
```

### Manual Docker Commands
```bash
# Build environment
docker compose build

# Update snapshots
docker compose run --rm update-snapshots

# Run tests
docker compose run --rm test
```

## File Structure

```
e2e/
├── focus-indicators.spec.ts-snapshots/
│   ├── focus-indicator-light-chromium.png
│   ├── focus-indicator-light-firefox.png
│   ├── focus-indicator-light-webkit.png
│   └── ...
└── ...
```

## Workflow

1. **Make UI changes** in development
2. **Regenerate snapshots**: `npm run test:e2e:update`
3. **Review** the generated `.png` files
4. **Commit** the snapshots to version control
5. **CI passes**: Uses the same Docker environment

## Docker Environment

The Docker setup replicates CI exactly:
- `ubuntu:22.04` (same as GitHub Actions `ubuntu-latest`)
- Node.js 24 (matches CI configuration)
- All Playwright browsers: Chromium, Firefox, WebKit
- Playwright handles build + preview server automatically

## Configuration

`playwright.config.ts`:
- `maxDiffPixelRatio: 0.02` for small tolerance
- `webServer` config builds and starts preview server
- All three browser projects enabled

`docker-compose.yml`:
- `update-snapshots` service: generates new baselines
- `test` service: validates against existing snapshots

## Troubleshooting

### Docker not running
```bash
# Ensure Docker Desktop is running, then:
docker compose build
```

### Tests fail after UI changes
```bash
npm run test:e2e:update
# Review and commit the updated snapshots
```

### Need to debug locally
```bash
# Run tests locally (results may differ from CI)
npm run test:e2e:local

# Or with UI mode
npx playwright test --ui
```

### Slow first run
The first `docker compose build` downloads browsers (~500MB). Subsequent runs use cached layers.
