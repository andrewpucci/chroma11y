import { test, expect } from '@playwright/test';

const MOBILE_VIEWPORTS = {
  iPhone_SE: { width: 375, height: 667 },
  iPhone_12: { width: 390, height: 844 },
  Pixel_5: { width: 393, height: 851 },
  Galaxy_S20: { width: 360, height: 800 },
  Small_Phone: { width: 320, height: 568 }
};

test.describe('Mobile Responsiveness', () => {
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

      // Desktop layout uses a fixed control width column + content column
      expect(gridTemplateColumns).toContain('440px');
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
    test('theme toggle should meet minimum touch target (44x44px) on mobile', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORTS.iPhone_SE);
      await page.goto('/');

      const themeToggle = page.getByRole('button', { name: /Switch to (dark|light) mode/ });
      const box = await themeToggle.boundingBox();

      expect(box).toBeTruthy();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    });

    test('color swatches should be touch-friendly on mobile', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORTS.iPhone_SE);
      await page.goto('/');

      await page.waitForSelector('.color-swatch', { timeout: 5000 });
      const swatch = page.locator('.color-swatch').first();
      const box = await swatch.boundingBox();

      expect(box).toBeTruthy();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    });
  });

  test.describe('Swatch Grid Adaptation', () => {
    test('swatch grid should wrap on mobile', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORTS.iPhone_SE);
      await page.goto('/');

      await page.waitForSelector('.swatches', { timeout: 5000 });
      const swatches = page.getByTestId('neutral-palette').locator('.swatches').first();
      const flexWrap = await swatches.evaluate((el) => window.getComputedStyle(el).flexWrap);

      expect(flexWrap).toBe('wrap');
    });
  });
});
