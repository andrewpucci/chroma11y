/**
 * Visual Regression E2E Tests
 * Argos-only visual coverage for high-risk UI states.
 */

import { test, expect, type Page } from '@playwright/test';
import { waitForAppReady } from './test-utils';
import { maybeCaptureArgosVisual } from './visual';

test.skip(
  process.env.ARGOS_UPLOAD !== 'true',
  'Visual snapshots run only when Argos uploads are enabled.'
);

async function setTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
  await page.locator('#theme-preference').selectOption(theme);
  await page.waitForFunction(
    (nextTheme) => document.documentElement.getAttribute('data-theme') === nextTheme,
    theme
  );
}

function cardByHeading(page: Page, heading: string) {
  return page.locator('.card', {
    has: page.getByRole('heading', { name: heading })
  });
}

test.describe('Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('app full page light', async ({ page }, testInfo) => {
    await expect(page.getByTestId('app-layout')).toBeVisible();

    await maybeCaptureArgosVisual({
      page,
      testInfo,
      name: 'app-full-light',
      fullPage: true
    });
  });

  test('app full page dark', async ({ page }, testInfo) => {
    await setTheme(page, 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await maybeCaptureArgosVisual({
      page,
      testInfo,
      name: 'app-full-dark',
      fullPage: true
    });
  });

  test('palette grid default', async ({ page }, testInfo) => {
    const palettes = page.getByTestId('generated-palettes');
    await expect(palettes).toBeVisible();

    await maybeCaptureArgosVisual({
      page,
      testInfo,
      name: 'palette-grid-default',
      element: palettes
    });
  });

  test('neutral palette default', async ({ page }, testInfo) => {
    const neutralPalette = page.getByTestId('neutral-palette');
    await expect(neutralPalette).toBeVisible();

    await maybeCaptureArgosVisual({
      page,
      testInfo,
      name: 'neutral-palette-default',
      element: neutralPalette
    });
  });

  test('bezier editor default', async ({ page }, testInfo) => {
    const bezierEditor = page.locator('.bezier-editor');
    await expect(bezierEditor).toBeVisible();

    await maybeCaptureArgosVisual({
      page,
      testInfo,
      name: 'bezier-editor-default',
      element: bezierEditor
    });
  });

  test('focus indicator light', async ({ page }, testInfo) => {
    const hexInput = page.locator('#baseColorHex');
    await hexInput.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(hexInput).toBeFocused();

    await maybeCaptureArgosVisual({
      page,
      testInfo,
      name: 'focus-indicator-light',
      element: hexInput
    });
  });

  test('focus indicator dark', async ({ page }, testInfo) => {
    await setTheme(page, 'dark');

    const hexInput = page.locator('#baseColorHex');
    await hexInput.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(hexInput).toBeFocused();

    await maybeCaptureArgosVisual({
      page,
      testInfo,
      name: 'focus-indicator-dark',
      element: hexInput
    });
  });

  test('mobile full page light (375x667)', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await waitForAppReady(page);

    const layout = page.getByTestId('app-layout');
    await expect(layout).toBeVisible();

    await maybeCaptureArgosVisual({
      page,
      testInfo,
      name: 'mobile-full-light-375x667',
      fullPage: true
    });
  });

  test('mobile full page dark (375x667)', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await waitForAppReady(page);

    await setTheme(page, 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await maybeCaptureArgosVisual({
      page,
      testInfo,
      name: 'mobile-full-dark-375x667',
      fullPage: true
    });
  });

  test('sidebar controls panel desktop expanded', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await waitForAppReady(page);

    const sidebar = page.getByTestId('app-sidebar');
    await expect(sidebar).toBeVisible();
    await expect(
      page.getByTestId('generation-controls-card').locator(':scope > summary.card-summary')
    ).toHaveCount(0);

    await maybeCaptureArgosVisual({
      page,
      testInfo,
      name: 'sidebar-controls-desktop-expanded',
      element: sidebar
    });
  });

  test('sidebar controls panel compact default state', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await waitForAppReady(page);

    const sidebar = page.getByTestId('app-sidebar');
    await expect(sidebar).toBeVisible();
    await expect(page.getByTestId('generation-controls-card')).toHaveJSProperty('open', false);

    await maybeCaptureArgosVisual({
      page,
      testInfo,
      name: 'sidebar-controls-compact-default',
      element: sidebar
    });
  });

  test('output settings tooltip open in oklch mode', async ({ page }, testInfo) => {
    const displaySpace = page.locator('#display-color-space');
    await displaySpace.selectOption('oklch');
    await expect(displaySpace).toHaveValue('oklch');

    await page.getByTestId('output-advanced-group').locator('summary').click();
    const infoButton = page.getByRole('button', { name: 'Explain OKLCH significant digits' });
    const tooltip = page.locator('#oklch-significant-digits-help');
    await infoButton.hover();
    await expect(tooltip).toBeVisible();

    const settingsPanel = page.getByTestId('display-settings');
    await expect(settingsPanel).toBeVisible();

    await maybeCaptureArgosVisual({
      page,
      testInfo,
      name: 'output-tooltip-open',
      element: settingsPanel
    });
  });

  test('contrast controls in custom mode', async ({ page }, testInfo) => {
    await page.locator('#contrast-mode').selectOption('manual');
    await expect(page.locator('#contrast-mode')).toHaveValue('manual');
    await expect(page.locator('#contrast-low')).toBeVisible();
    await expect(page.locator('#contrast-high')).toBeVisible();

    const contrastCard = cardByHeading(page, 'Contrast');
    await expect(contrastCard).toBeVisible();

    await maybeCaptureArgosVisual({
      page,
      testInfo,
      name: 'contrast-controls-custom-mode',
      element: contrastCard
    });
  });

  test('contrast algorithm switched to apca', async ({ page }, testInfo) => {
    const contrastAlgorithm = page.locator('#contrast-algorithm');
    await contrastAlgorithm.selectOption('APCA');
    await expect(contrastAlgorithm).toHaveValue('APCA');

    const palettes = page.getByTestId('generated-palettes');
    await expect(palettes).toBeVisible();

    await maybeCaptureArgosVisual({
      page,
      testInfo,
      name: 'contrast-algorithm-apca',
      element: palettes
    });
  });

  test('drawer open from neutral swatch', async ({ page }, testInfo) => {
    const neutralSwatch = page.getByTestId('neutral-palette').locator('.color-swatch').first();

    await neutralSwatch.click();

    const drawer = page.getByRole('dialog', { name: /./ });
    await expect(drawer).toBeVisible();
    await expect(page.locator('#drawer-title')).toBeVisible();

    await maybeCaptureArgosVisual({
      page,
      testInfo,
      name: 'drawer-open-neutral',
      element: drawer
    });
  });

  test('palette grid after hue nudger change', async ({ page }, testInfo) => {
    const hueInput = page.locator('#hue-nudger-0');
    await hueInput.fill('24');
    await hueInput.blur();
    await expect(hueInput).toHaveValue('24');

    const palettes = page.getByTestId('generated-palettes');
    await expect(palettes).toBeVisible();

    await maybeCaptureArgosVisual({
      page,
      testInfo,
      name: 'palette-grid-hue-nudger-updated',
      element: palettes
    });
  });

  test('neutral palette after lightness nudger change', async ({ page }, testInfo) => {
    const lightnessInput = page.locator('#lightness-nudger-5');
    await lightnessInput.fill('0.2');
    await lightnessInput.blur();
    await expect(lightnessInput).toHaveValue('0.2');

    const neutralPalette = page.getByTestId('neutral-palette');
    await expect(neutralPalette).toBeVisible();

    await maybeCaptureArgosVisual({
      page,
      testInfo,
      name: 'neutral-palette-lightness-nudger-updated',
      element: neutralPalette
    });
  });

  test('bezier editor after control point move', async ({ page }, testInfo) => {
    const p1xInput = page.getByLabel('P1 X coordinate');
    const initialX = parseFloat((await p1xInput.inputValue()) || '0');

    const p1Slider = page.getByRole('slider', { name: 'Control point P1' });
    await p1Slider.focus();

    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('ArrowRight');
    }

    await expect
      .poll(async () => parseFloat((await p1xInput.inputValue()) || '0'))
      .toBeGreaterThan(initialX);

    const bezierEditor = page.locator('.bezier-editor');
    await expect(bezierEditor).toBeVisible();

    await maybeCaptureArgosVisual({
      page,
      testInfo,
      name: 'bezier-editor-control-point-moved',
      element: bezierEditor
    });
  });

  test('export controls panel', async ({ page }, testInfo) => {
    const exportCard = cardByHeading(page, 'Export');
    await expect(exportCard).toBeVisible();

    await maybeCaptureArgosVisual({
      page,
      testInfo,
      name: 'export-controls-panel',
      element: exportCard
    });
  });
});
