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
 * Captures a visual snapshot in Argos during CI for trusted PRs and main pushes.
 * Snapshot names include browser/project suffix to avoid cross-browser baseline collisions.
 */
export async function maybeCaptureArgosVisual(options: VisualCaptureOptions): Promise<void> {
  const shouldUpload = process.env.ARGOS_UPLOAD === 'true';

  if (!shouldUpload) {
    return;
  }

  const snapshotName = `${options.name}-${options.testInfo.project.name}`;

  await argosScreenshot(options.page, snapshotName, {
    element: options.element,
    fullPage: options.fullPage
  });
}
