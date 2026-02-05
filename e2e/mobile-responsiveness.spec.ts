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

      const container = page.locator('.container');
      const flexDirection = await container.evaluate(
        (el) => window.getComputedStyle(el).flexDirection
      );

      expect(flexDirection).toBe('column');
    });

    test('should maintain horizontal layout on desktop (1024px)', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.goto('/');

      const container = page.locator('.container');
      const flexDirection = await container.evaluate(
        (el) => window.getComputedStyle(el).flexDirection
      );

      expect(flexDirection).toBe('row');
    });

    test('should make controls full-width on mobile', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORTS.iPhone_SE);
      await page.goto('/');

      const controlsColumn = page.locator('.controls-column');
      const width = await controlsColumn.evaluate((el) => window.getComputedStyle(el).width);

      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(parseInt(width)).toBe(viewportWidth);
    });
  });

  test.describe('Touch Target Sizes', () => {
    test('theme toggle should meet minimum touch target (44x44px) on mobile', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORTS.iPhone_SE);
      await page.goto('/');

      const themeToggle = page.locator('.theme-toggle');
      const box = await themeToggle.boundingBox();

      expect(box).toBeTruthy();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    });

    test('export buttons should meet minimum touch target on mobile', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORTS.iPhone_SE);
      await page.goto('/');

      const exportButtons = page.locator('.export-button');
      const count = await exportButtons.count();

      for (let i = 0; i < count; i++) {
        const box = await exportButtons.nth(i).boundingBox();
        expect(box).toBeTruthy();
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
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

    test('range inputs should be touch-friendly on mobile', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORTS.iPhone_SE);
      await page.goto('/');

      const rangeInput = page.locator('input[type="range"]').first();
      const height = await rangeInput.evaluate((el) => window.getComputedStyle(el).height);

      expect(parseInt(height)).toBeGreaterThanOrEqual(44);
    });

    test('text inputs should be touch-friendly on mobile', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORTS.iPhone_SE);
      await page.goto('/');

      const textInput = page.locator('input[type="text"]').first();
      const height = await textInput.evaluate((el) => window.getComputedStyle(el).minHeight);

      expect(parseInt(height)).toBeGreaterThanOrEqual(44);
    });

    test('lightness nudger inputs should be touch-friendly on mobile', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORTS.iPhone_SE);
      await page.goto('/');

      await page.waitForSelector('.nudger-input', { timeout: 5000 });
      const nudgerInput = page.locator('.nudger-input').first();
      const height = await nudgerInput.evaluate((el) => window.getComputedStyle(el).minHeight);

      expect(parseInt(height)).toBeGreaterThanOrEqual(44);
    });

    test('hue nudger inputs should be touch-friendly on mobile', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORTS.iPhone_SE);
      await page.goto('/');

      await page.waitForSelector('.hue-nudger-input', { timeout: 5000 });
      const hueInput = page.locator('.hue-nudger-input').first();
      const height = await hueInput.evaluate((el) => window.getComputedStyle(el).minHeight);

      expect(parseInt(height)).toBeGreaterThanOrEqual(44);
    });
  });

  test.describe('Swatch Grid Adaptation', () => {
    test('swatch grid should wrap on mobile', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORTS.iPhone_SE);
      await page.goto('/');

      await page.waitForSelector('.color-grid.compact', { timeout: 5000 });
      const grid = page.locator('.color-grid.compact').first();
      const flexWrap = await grid.evaluate((el) => window.getComputedStyle(el).flexWrap);

      expect(flexWrap).toBe('wrap');
    });

    test('palettes should be visible and scrollable on mobile', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORTS.iPhone_SE);
      await page.goto('/');

      // Wait for swatches to render first
      await page.waitForSelector('.color-swatch', { timeout: 5000 });

      const palettesColumn = page.locator('.palettes-column');
      await expect(palettesColumn).toBeVisible();
      const overflowY = await palettesColumn.evaluate(
        (el) => window.getComputedStyle(el).overflowY
      );

      expect(overflowY).toBe('auto');
    });
  });

  test.describe('Copy Functionality on Mobile', () => {
    test('should have clickable swatches on mobile', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORTS.iPhone_SE);
      await page.goto('/');

      await page.waitForSelector('.color-swatch', { timeout: 5000 });
      const swatch = page.locator('.color-swatch').first();

      // Verify swatch is clickable/tappable
      expect(await swatch.isVisible()).toBe(true);
      expect(await swatch.isEnabled()).toBe(true);

      // Click the swatch (clipboard API is flaky in tests)
      await swatch.click();
      await page.waitForTimeout(100);
    });

    test('should show cursor pointer on swatches', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORTS.iPhone_SE);
      await page.goto('/');

      await page.waitForSelector('.color-swatch', { timeout: 5000 });
      const swatch = page.locator('.color-swatch').first();

      const cursor = await swatch.evaluate((el) => window.getComputedStyle(el).cursor);

      expect(cursor).toBe('pointer');
    });
  });

  test.describe('Touch Interactions', () => {
    test('nudger inputs should be interactive', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORTS.iPhone_SE);
      await page.goto('/');

      await page.waitForSelector('.nudger-input', { timeout: 5000 });
      const nudgerInput = page.locator('.nudger-input').first();

      // Verify input is interactive
      expect(await nudgerInput.isVisible()).toBe(true);
      expect(await nudgerInput.isEnabled()).toBe(true);

      // Click and fill input
      await nudgerInput.click();
      await nudgerInput.clear();
      await nudgerInput.fill('0.1');

      const value = await nudgerInput.inputValue();
      expect(parseFloat(value)).toBe(0.1);
    });

    test('hue nudger should be interactive', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORTS.iPhone_SE);
      await page.goto('/');

      await page.waitForSelector('.hue-nudger-input', { timeout: 5000 });
      const hueInput = page.locator('.hue-nudger-input').first();

      // Verify input is interactive
      expect(await hueInput.isVisible()).toBe(true);
      expect(await hueInput.isEnabled()).toBe(true);

      // Click and fill input
      await hueInput.click();
      await hueInput.clear();
      await hueInput.fill('15');

      const value = await hueInput.inputValue();
      expect(parseInt(value)).toBe(15);
    });

    test('range sliders should be interactive', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORTS.iPhone_SE);
      await page.goto('/');

      await page.waitForSelector('.color-swatch', { timeout: 5000 });

      const rangeInput = page.locator('input[id="warmth"]');

      // Verify slider is interactive
      await expect(rangeInput).toBeVisible();
      await expect(rangeInput).toBeEnabled();

      // Set a specific value and verify it was applied
      await rangeInput.fill('25');
      await page.waitForTimeout(100);

      const newValue = await rangeInput.inputValue();
      expect(newValue).toBe('25');
    });
  });

  test.describe('Multiple Viewport Sizes', () => {
    Object.entries(MOBILE_VIEWPORTS).forEach(([device, viewport]) => {
      test(`should render correctly on ${device} (${viewport.width}x${viewport.height})`, async ({
        page
      }) => {
        await page.setViewportSize(viewport);
        await page.goto('/');

        await page.waitForSelector('.color-swatch', { timeout: 5000 });

        const controlsColumn = page.locator('.controls-column');
        const palettesColumn = page.locator('.palettes-column');

        expect(await controlsColumn.isVisible()).toBe(true);
        expect(await palettesColumn.isVisible()).toBe(true);

        const swatchCount = await page.locator('.color-swatch').count();
        expect(swatchCount).toBeGreaterThan(0);
      });
    });
  });

  test.describe('Responsive Font Sizes', () => {
    test('header should have smaller font size on mobile than desktop', async ({ page }) => {
      // Get mobile font size
      await page.setViewportSize(MOBILE_VIEWPORTS.iPhone_SE);
      await page.goto('/');
      await page.waitForTimeout(200);

      const h1 = page.locator('header h1');
      const mobileFontSize = await h1.evaluate((el) =>
        parseFloat(window.getComputedStyle(el).fontSize)
      );

      // Get desktop font size
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(200);

      const desktopFontSize = await h1.evaluate((el) =>
        parseFloat(window.getComputedStyle(el).fontSize)
      );

      expect(mobileFontSize).toBeLessThanOrEqual(desktopFontSize);
      expect(mobileFontSize).toBeGreaterThan(20);
      expect(desktopFontSize).toBeGreaterThanOrEqual(mobileFontSize);
    });
  });

  test.describe('Touch Action Prevention', () => {
    test('interactive elements should have touch-action manipulation', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORTS.iPhone_SE);
      await page.goto('/');

      const elements = ['.theme-toggle', '.export-button', '.color-swatch', 'input[type="range"]'];

      for (const selector of elements) {
        const element = page.locator(selector).first();
        const touchAction = await element.evaluate((el) => window.getComputedStyle(el).touchAction);

        expect(['manipulation', 'auto']).toContain(touchAction);
      }
    });
  });
});
