import { defineConfig, devices } from '@playwright/test';
import { createArgosReporterOptions } from '@argos-ci/playwright/reporter';

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:4173';

export default defineConfig({
  webServer: process.env.PLAYWRIGHT_TEST_BASE_URL
    ? undefined
    : { command: 'npm run build && npm run preview', port: 4173 },
  testDir: 'e2e',
  snapshotPathTemplate: '{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}-{projectName}{ext}',
  timeout: process.env.CI ? 60000 : 30000,
  retries: process.env.CI ? 2 : 0,
  expect: {
    timeout: 15000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01
    }
  },
  use: {
    baseURL,
    navigationTimeout: process.env.CI || process.env.PLAYWRIGHT_TEST_BASE_URL ? 60000 : 15000,
    actionTimeout: 10000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
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
