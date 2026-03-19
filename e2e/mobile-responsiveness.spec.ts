import { test, expect, type Locator, type Page } from '@playwright/test';

import { waitForAppReady } from './test-utils';

const MOBILE_VIEWPORT = { width: 375, height: 667 };

async function openMobileApp(page: Page): Promise<void> {
  await page.setViewportSize(MOBILE_VIEWPORT);
  await page.goto('/');
  await waitForAppReady(page);
}

async function expectMinimumTouchTarget(locator: Locator, minimumSize: number): Promise<void> {
  const box = await locator.boundingBox();

  expect(box).toBeTruthy();
  expect(box!.width).toBeGreaterThanOrEqual(minimumSize);
  expect(box!.height).toBeGreaterThanOrEqual(minimumSize);
}

test.describe('Mobile Responsiveness', () => {
  test('stacks the sidebar above palettes and keeps controls full width on mobile', async ({
    page
  }) => {
    await openMobileApp(page);

    const layout = page.getByTestId('app-layout');
    const sidebar = page.getByTestId('app-sidebar');

    const gridTemplateColumns = await layout.evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns
    );
    const layoutBox = await layout.boundingBox();
    const sidebarBox = await sidebar.boundingBox();

    const layoutPadding = await layout.evaluate((el) => {
      const style = getComputedStyle(el);
      return parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    });

    expect(gridTemplateColumns.trim().split(' ')).toHaveLength(1);
    expect(layoutBox).toBeTruthy();
    expect(sidebarBox).toBeTruthy();

    const availableWidth = layoutBox!.width - layoutPadding;
    expect(sidebarBox!.width).toBeGreaterThanOrEqual(availableWidth - 2);
    expect(sidebarBox!.width).toBeLessThanOrEqual(availableWidth + 2);
  });

  test('keeps primary mobile touch targets comfortably sized', async ({ page }) => {
    await openMobileApp(page);

    await expectMinimumTouchTarget(page.locator('input[type="color"]'), 24);
    await expectMinimumTouchTarget(
      page.getByRole('button', { name: 'Export JSON design tokens' }),
      24
    );
    await expectMinimumTouchTarget(page.locator('.color-swatch').first(), 44);

    const sliderTargets = page.locator('.bezier-editor [role="slider"]');
    await expect(sliderTargets).toHaveCount(2);

    for (let index = 0; index < (await sliderTargets.count()); index += 1) {
      await expectMinimumTouchTarget(sliderTargets.nth(index), 24);
    }
  });

  test('wraps the neutral swatch grid on mobile', async ({ page }) => {
    await openMobileApp(page);

    const swatches = page.getByTestId('neutral-palette').locator('.neutral-grid').first();
    const flexWrap = await swatches.evaluate((el) => getComputedStyle(el).flexWrap);

    expect(flexWrap).toBe('wrap');
  });
});
