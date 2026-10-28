import { defineConfig, devices } from '@playwright/test';
import { createArgosReporterOptions } from '@argos-ci/playwright/reporter';

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:4173';
const hasExternalBaseUrl = Boolean(process.env.PLAYWRIGHT_TEST_BASE_URL);
const shouldUploadArgos = process.env.ARGOS_UPLOAD === 'true';
const shouldAnnotateActions = process.env.PW_ANNOTATE === '1' && !process.env.CI;

export default defineConfig({
  webServer: hasExternalBaseUrl
    ? undefined
    : {
        command: 'npm run build && npm run preview',
        port: 4173,
        reuseExistingServer: !process.env.CI
      },
  testDir: 'e2e',
  testIgnore: [...(!shouldUploadArgos ? ['visual-regression.spec.ts'] : [])],
  timeout: process.env.CI ? 60000 : 30000,
  retries: process.env.CI ? 2 : 0,
  expect: {
    timeout: 15000
  },
  use: {
    baseURL,
    navigationTimeout: process.env.CI || process.env.PLAYWRIGHT_TEST_BASE_URL ? 60000 : 15000,
    actionTimeout: 10000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Record video alongside the trace on the first retry so failing CI runs get both artifacts
    // from the same attempt and passing first attempts pay no recording cost.
    video: shouldAnnotateActions
      ? {
          // Opt-in local debugging aid: annotated recordings of every run. Annotations pause each
          // action for `duration`, which changes test timing, so keep them out of CI.
          mode: 'on',
          show: {
            actions: {
              duration: 1000,
              cursor: 'none',
              style: {
                point:
                  'width: 16px; height: 16px; border-radius: 50%; background: rgba(255, 59, 48, 0.8); border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5)',
                highlight:
                  'border: 2px solid rgba(255, 59, 48, 0.8); background: rgba(255, 59, 48, 0.1)'
              }
            }
          }
        }
      : 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-lcd-text', '--font-render-hinting=none']
        }
      }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  reporter: [
    [process.env.CI ? 'dot' : 'list'],
    [
      '@argos-ci/playwright/reporter',
      createArgosReporterOptions({
        uploadToArgos: process.env.ARGOS_UPLOAD === 'true'
      })
    ],
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['junit', { outputFile: 'playwright-report/results.xml' }]
  ]
});
