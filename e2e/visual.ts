import { argosScreenshot } from '@argos-ci/playwright';
import type { Locator, Page, TestInfo } from '@playwright/test';

interface VisualCaptureOptions {
  page: Page;
  testInfo: TestInfo;
  name: string;
  element?: Locator;
  fullPage?: boolean;
}

/**
 * Captures a visual snapshot in Argos during CI for trusted PRs.
 * Phase A keeps Playwright file-based snapshots and adds Argos in parallel.
 */
export async function maybeCaptureArgosVisual(options: VisualCaptureOptions): Promise<void> {
  const isChromium = options.testInfo.project.name === 'chromium';
  const shouldUpload = process.env.ARGOS_UPLOAD === 'true';

  if (!isChromium || !shouldUpload) {
    return;
  }

  await argosScreenshot(options.page, options.name, {
    element: options.element,
    fullPage: options.fullPage
  });
}
