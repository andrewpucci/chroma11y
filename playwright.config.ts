import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:4173';

export default defineConfig({
  webServer: process.env.PLAYWRIGHT_TEST_BASE_URL
    ? undefined
    : { command: 'npm run build && npm run preview', port: 4173 },
  testDir: 'e2e',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  expect: {
    timeout: 10000
  },
  use: {
    baseURL,
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
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['junit', { outputFile: 'playwright-report/results.xml' }],
    ['list']
  ]
});
