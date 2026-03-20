import { test, expect, type Locator, type Page } from '@playwright/test';

import { waitForAppReady } from './test-utils';

const MOBILE_VIEWPORT = { width: 375, height: 667 };
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

async function openMobileApp(page: Page): Promise<void> {
  await openApp(page, MOBILE_VIEWPORT);
}

async function openDesktopApp(page: Page): Promise<void> {
  await openApp(page, DESKTOP_VIEWPORT);
}

async function openApp(page: Page, viewport: { width: number; height: number }): Promise<void> {
  await page.setViewportSize(viewport);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
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

  test('defaults all compact control panels to collapsed so palettes are visible sooner', async ({
    page
  }) => {
    await openMobileApp(page);

    const generationCard = page.getByTestId('generation-controls-card');
    const contrastCard = page.getByTestId('contrast-controls-card');
    const outputCard = page.getByTestId('output-controls-card');
    const exportCard = page.getByTestId('export-controls-card');

    await expect(generationCard).toHaveJSProperty('open', false);
    await expect(contrastCard).toHaveJSProperty('open', false);
    await expect(outputCard).toHaveJSProperty('open', false);
    await expect(exportCard).toHaveJSProperty('open', false);

    await expect(
      page.getByTestId('neutral-palette').getByRole('heading', {
        level: 2,
        name: 'Neutral Palette',
        exact: true
      })
    ).toBeVisible();
  });

  test('keeps desktop sections always visible and non-collapsible', async ({ page }) => {
    await openDesktopApp(page);

    const generationCard = page.getByTestId('generation-controls-card');
    const contrastCard = page.getByTestId('contrast-controls-card');
    const outputCard = page.getByTestId('output-controls-card');
    const exportCard = page.getByTestId('export-controls-card');

    await expect(generationCard.locator(':scope > summary.card-summary')).toHaveCount(0);
    await expect(contrastCard.locator(':scope > summary.card-summary')).toHaveCount(0);
    await expect(outputCard.locator(':scope > summary.card-summary')).toHaveCount(0);
    await expect(exportCard.locator(':scope > summary.card-summary')).toHaveCount(0);
    await expect(page.locator('#baseColorHex')).toBeVisible();
  });

  test('keeps controls usable after expanding and collapsing cards on mobile', async ({ page }) => {
    await openMobileApp(page);

    const generationCard = page.getByTestId('generation-controls-card');
    const generationSummary = generationCard.locator(':scope > summary.card-summary');

    await generationSummary.click();
    await expect(generationCard).toHaveJSProperty('open', true);
    await generationSummary.click();
    await expect(generationCard).toHaveJSProperty('open', false);
    await generationSummary.click();
    await expect(generationCard).toHaveJSProperty('open', true);

    const baseColorInput = page.getByRole('textbox', { name: 'Base color hex value' });
    await expect(baseColorInput).toBeVisible();
    await baseColorInput.fill('#33aa66');
    await baseColorInput.blur();
    await expect(baseColorInput).toHaveValue('#33aa66');

    await generationSummary.focus();
    await page.keyboard.press('Enter');
    await expect(generationCard).toHaveJSProperty('open', false);
  });

  test('keeps primary mobile touch targets comfortably sized', async ({ page }) => {
    await openMobileApp(page);

    await page
      .getByTestId('generation-controls-card')
      .locator(':scope > summary.card-summary')
      .click();
    await page.getByTestId('generation-advanced-group').locator('summary').click();
    await page.getByTestId('export-controls-card').locator(':scope > summary.card-summary').click();

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
