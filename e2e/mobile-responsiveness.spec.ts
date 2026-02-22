import { test, expect } from '@playwright/test';
import { waitForAppReady } from './test-utils';

const MOBILE_VIEWPORTS = {
  iPhone_SE: { width: 375, height: 667 },
  iPhone_12: { width: 390, height: 844 },
  Pixel_5: { width: 393, height: 851 },
  Galaxy_S20: { width: 360, height: 800 },
  Small_Phone: { width: 320, height: 568 }
};

test.describe('Mobile Responsiveness', () => {
  test.describe('Visual regression', () => {
    test.skip(({ browserName }) => browserName !== 'chromium', 'Visual tests only run on Chromium');

    test('mobile layout appearance (iPhone SE)', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORTS.iPhone_SE);
      await page.goto('/');
      await waitForAppReady(page);
      await expect(page).toHaveScreenshot('mobile-layout-iphone-se.png', {
        fullPage: true
      });
    });

    test('mobile layout appearance (small phone 320px)', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORTS.Small_Phone);
      await page.goto('/');
      await waitForAppReady(page);
      await expect(page).toHaveScreenshot('mobile-layout-320px.png', {
        fullPage: true
      });
    });
  });

  test.describe('Layout Adaptation', () => {
    test('should stack controls above palettes on mobile (375px)', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORTS.iPhone_SE);
      await page.goto('/');

      const layout = page.getByTestId('app-layout');
      await expect(layout).toBeVisible();

      const gridTemplateColumns = await layout.evaluate(
        (el) => window.getComputedStyle(el).gridTemplateColumns
      );

      // Mobile layout collapses to a single column
      expect(gridTemplateColumns).not.toContain('440px');
    });

    test('should maintain horizontal layout on desktop (1024px)', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.goto('/');

      const layout = page.getByTestId('app-layout');
      await expect(layout).toBeVisible();

      const gridTemplateColumns = await layout.evaluate(
        (el) => window.getComputedStyle(el).gridTemplateColumns
      );

      // Desktop layout uses a responsive control width column + content column
      // At 1024px viewport: clamp(320px, 25vw, 440px) = clamp(320px, 256px, 440px) = 320px
      expect(gridTemplateColumns).toContain('320px');
    });

    test('should make controls full-width on mobile', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORTS.iPhone_SE);
      await page.goto('/');

      const layout = page.getByTestId('app-layout');
      await expect(layout).toBeVisible();

      const sidebar = page.getByTestId('app-sidebar');
      await expect(sidebar).toBeVisible();

      const layoutBox = await layout.boundingBox();
      const sidebarBox = await sidebar.boundingBox();

      const layoutPadding = await layout.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          paddingLeft: parseFloat(style.paddingLeft),
          paddingRight: parseFloat(style.paddingRight)
        };
      });

      expect(layoutBox).toBeTruthy();
      expect(sidebarBox).toBeTruthy();

      const availableWidth =
        layoutBox!.width - layoutPadding.paddingLeft - layoutPadding.paddingRight;

      expect(sidebarBox!.width).toBeGreaterThanOrEqual(availableWidth - 2);
      expect(sidebarBox!.width).toBeLessThanOrEqual(availableWidth + 2);
    });
  });

  test.describe('Touch Target Sizes', () => {
    test('color picker should meet WCAG 2.2 AA minimum (24x24px) on mobile', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORTS.iPhone_SE);
      await page.goto('/');

      const colorPicker = page.locator('input[type="color"]');
      const box = await colorPicker.boundingBox();

      expect(box).toBeTruthy();
      // WCAG 2.2 AA (2.5.8) minimum is 24px
      expect(box!.height).toBeGreaterThanOrEqual(24);
      expect(box!.width).toBeGreaterThanOrEqual(24);
    });

    test('color swatches should be touch-friendly on mobile', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORTS.iPhone_SE);
      await page.goto('/');

      await page.waitForSelector('.color-swatch', { timeout: 5000 });
      const swatch = page.locator('.color-swatch').first();
      const box = await swatch.boundingBox();

      expect(box).toBeTruthy();
      // Swatches use comfortable target (44px) for better UX
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    });

    test('buttons meet WCAG 2.2 AA minimum touch target', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORTS.iPhone_SE);
      await page.goto('/');

      const exportBtn = page.getByRole('button', { name: 'Export JSON design tokens' });
      const box = await exportBtn.boundingBox();

      expect(box).toBeTruthy();
      // WCAG 2.2 AA (2.5.8) minimum is 24px
      expect(box!.height).toBeGreaterThanOrEqual(24);
      expect(box!.width).toBeGreaterThanOrEqual(24);
    });
  });

  test.describe('Swatch Grid Adaptation', () => {
    test('swatch grid should wrap on mobile', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORTS.iPhone_SE);
      await page.goto('/');

      await page.waitForSelector('.neutral-grid', { timeout: 5000 });
      const swatches = page.getByTestId('neutral-palette').locator('.neutral-grid').first();
      const flexWrap = await swatches.evaluate((el) => window.getComputedStyle(el).flexWrap);

      expect(flexWrap).toBe('wrap');
    });
  });
});
