import { defineConfig, devices } from '@playwright/test';
import { createArgosReporterOptions } from '@argos-ci/playwright/reporter';

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:4173';
const hasExternalBaseUrl = Boolean(process.env.PLAYWRIGHT_TEST_BASE_URL);
const shouldUploadArgos = process.env.ARGOS_UPLOAD === 'true';

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
    video: {
      mode: 'retain-on-failure',
      size: { width: 1280, height: 720 },
      fps: 30,
      show: {
        actions: {
          duration: 1000,
          // Keep Playwright's synthetic cursor out of the page DOM between actions so it cannot
          // leak into Argos screenshots; the red point marker still shows each action location.
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
