/**
 * Design Token E2E Tests
 * Verifies fluid typography, spacing tokens, border radius scaling,
 * touch targets, motion preferences, container queries, and text zoom.
 * WCAG 2.2 AA compliance testing.
 */

import { test, expect } from '@playwright/test';
import { waitForAppReady } from './test-utils';

test.describe('Design Tokens', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test.describe('Fluid Typography', () => {
    test('scales correctly at mobile viewport (320px)', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });

      const cardTitle = page.locator('.card-title').first();
      const fontSize = await cardTitle.evaluate((el) => {
        return parseFloat(getComputedStyle(el).fontSize);
      });

      // At 320px, --font-size-lg should be near its minimum
      expect(fontSize).toBeGreaterThanOrEqual(15); // ~0.95rem
      expect(fontSize).toBeLessThanOrEqual(17);
    });

    test('scales correctly at tablet viewport (768px)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const cardTitle = page.locator('.card-title').first();
      const fontSize = await cardTitle.evaluate((el) => {
        return parseFloat(getComputedStyle(el).fontSize);
      });

      // At 768px, --font-size-lg should be in the middle range
      expect(fontSize).toBeGreaterThanOrEqual(15);
      expect(fontSize).toBeLessThanOrEqual(18);
    });

    test('scales correctly at desktop viewport (1440px)', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });

      const cardTitle = page.locator('.card-title').first();
      const fontSize = await cardTitle.evaluate((el) => {
        return parseFloat(getComputedStyle(el).fontSize);
      });

      // At 1440px, --font-size-lg should be near its maximum
      expect(fontSize).toBeGreaterThanOrEqual(16);
      expect(fontSize).toBeLessThanOrEqual(19); // ~1.125rem
    });
  });

  test.describe('Spacing Tokens', () => {
    test('maintains visual consistency across breakpoints', async ({ page }) => {
      const viewports = [
        { width: 320, height: 568 },
        { width: 768, height: 1024 },
        { width: 1440, height: 900 }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);

        const cardBody = page.locator('.card-body').first();
        const padding = await cardBody.evaluate((el) => {
          const style = getComputedStyle(el);
          return parseFloat(style.paddingTop);
        });

        // Spacing should scale proportionally with viewport
        expect(padding).toBeGreaterThan(0);
        expect(padding).toBeLessThanOrEqual(24); // Max for --space-lg
      }
    });
  });

  test.describe('Border Radius Tokens', () => {
    test('scales proportionally with viewport', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });

      const card = page.locator('.card').first();
      const radiusSmall = await card.evaluate((el) => {
        return parseFloat(getComputedStyle(el).borderTopLeftRadius);
      });

      await page.setViewportSize({ width: 1440, height: 900 });

      const radiusLarge = await card.evaluate((el) => {
        return parseFloat(getComputedStyle(el).borderTopLeftRadius);
      });

      // Border radius should increase with viewport size
      expect(radiusLarge).toBeGreaterThanOrEqual(radiusSmall);
    });
  });

  test.describe('Touch Targets - WCAG 2.2 AA (2.5.8)', () => {
    test('buttons meet 24px minimum touch target', async ({ page }) => {
      const exportBtn = page.getByRole('button', { name: 'Export JSON design tokens' });
      const box = await exportBtn.boundingBox();

      expect(box).toBeTruthy();
      expect(box!.height).toBeGreaterThanOrEqual(24);
      expect(box!.width).toBeGreaterThanOrEqual(24);
    });

    test('input fields meet 24px minimum touch target', async ({ page }) => {
      const select = page.locator('#contrast-mode');
      const box = await select.boundingBox();

      expect(box).toBeTruthy();
      expect(box!.height).toBeGreaterThanOrEqual(24);
    });

    test('color swatches meet comfortable touch target (44px)', async ({ page }) => {
      await page.waitForSelector('.color-swatch', { timeout: 5000 });
      const swatch = page.locator('.color-swatch').first();
      const box = await swatch.boundingBox();

      expect(box).toBeTruthy();
      // Swatches use --touch-target-comfortable (44px)
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    });
  });

  test.describe('Motion Tokens - prefers-reduced-motion', () => {
    test('respects reduced motion preference', async ({ page }) => {
      // Enable reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.reload();
      await waitForAppReady(page);

      const durationFast = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('--duration-fast');
      });

      const durationNormal = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('--duration-normal');
      });

      // Motion tokens should be 0s when reduced motion is preferred
      expect(durationFast.trim()).toBe('0s');
      expect(durationNormal.trim()).toBe('0s');
    });

    test('uses normal durations without reduced motion', async ({ page }) => {
      // Disable reduced motion preference
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.reload();
      await waitForAppReady(page);

      const durationFast = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('--duration-fast');
      });

      const durationNormal = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('--duration-normal');
      });

      // Motion tokens should have normal values (browser normalizes ms to s)
      expect(durationFast.trim()).toMatch(/^0?\.1s$/);
      expect(durationNormal.trim()).toMatch(/^0?\.2s$/);
    });
  });

  test.describe('Container Queries', () => {
    test('layout switches to single column at container breakpoint', async ({ page }) => {
      // Set viewport to ensure container width > 980px for two-column layout
      // Container width = min(92vw, 2400px), so we need 92vw > 980px
      // 980px / 0.92 = 1065px minimum viewport width
      await page.setViewportSize({ width: 1100, height: 768 });

      const layout = page.getByTestId('app-layout');
      const gridColumns = await layout.evaluate((el) => {
        return getComputedStyle(el).gridTemplateColumns;
      });

      // At 1100px viewport, container width = min(1012px, 2400px) = 1012px
      // Since 1012px > 980px, should be two columns (first column uses clamp, second is 1fr)
      // The grid should have two values separated by space
      const columnCount = gridColumns.trim().split(' ').length;
      expect(columnCount).toBe(2);

      // Set viewport to ensure container width < 980px for single column layout
      // Container width at 900px viewport = min(828px, 2400px) = 828px
      await page.setViewportSize({ width: 900, height: 768 });

      const gridColumnsMobile = await layout.evaluate((el) => {
        return getComputedStyle(el).gridTemplateColumns;
      });

      // Below 980px container query, should be single column
      // Computed value will be actual pixel width, not '1fr'
      const columnCountMobile = gridColumnsMobile.trim().split(' ').length;
      expect(columnCountMobile).toBe(1);
    });
  });

  test.describe('Text Zoom - WCAG 2.2 AA (1.4.4)', () => {
    test('supports 200% text zoom without breaking layout', async ({ page }) => {
      // Set base font size to 32px (200% of typical 16px)
      await page.addStyleTag({
        content: 'html { font-size: 32px !important; }'
      });

      await page.reload();
      await waitForAppReady(page);

      // Check that layout doesn't break
      const layout = page.getByTestId('app-layout');
      const isVisible = await layout.isVisible();
      expect(isVisible).toBe(true);

      // Check that text is readable (no overflow hidden)
      const cardTitle = page.locator('.card-title').first();
      const overflow = await cardTitle.evaluate((el) => {
        return getComputedStyle(el).overflow;
      });

      expect(overflow).not.toBe('hidden');
    });

    test('fluid typography adjusts with browser font size', async ({ page }) => {
      // Get baseline font size
      const baselineSize = await page
        .locator('.card-title')
        .first()
        .evaluate((el) => {
          return parseFloat(getComputedStyle(el).fontSize);
        });

      // Increase browser base font size
      await page.addStyleTag({
        content: 'html { font-size: 20px !important; }'
      });

      const increasedSize = await page
        .locator('.card-title')
        .first()
        .evaluate((el) => {
          return parseFloat(getComputedStyle(el).fontSize);
        });

      // Font size should increase proportionally
      expect(increasedSize).toBeGreaterThan(baselineSize);
    });
  });

  test.describe('T-shirt Size Consistency', () => {
    test('spacing and typography maintain proportional relationships', async ({ page }) => {
      const spaceXs = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('--space-xs').trim();
      });

      const spaceSm = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('--space-sm').trim();
      });

      const spaceMd = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('--space-md').trim();
      });

      const spaceLg = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('--space-lg').trim();
      });

      // Check that spacing tokens are defined and use clamp() for fluid scaling
      expect(spaceXs).toMatch(/^clamp\(/);
      expect(spaceSm).toMatch(/^clamp\(/);
      expect(spaceMd).toMatch(/^clamp\(/);
      expect(spaceLg).toMatch(/^clamp\(/);

      // Check that each spacing token has progressively larger maximum values in clamp()
      const getXsMax = parseFloat(spaceXs.match(/,\s*([\d.]+)rem\)/)?.[1] || '0');
      const getSmMax = parseFloat(spaceSm.match(/,\s*([\d.]+)rem\)/)?.[1] || '0');
      const getMdMax = parseFloat(spaceMd.match(/,\s*([\d.]+)rem\)/)?.[1] || '0');
      const getLgMax = parseFloat(spaceLg.match(/,\s*([\d.]+)rem\)/)?.[1] || '0');

      expect(getSmMax).toBeGreaterThan(getXsMax);
      expect(getMdMax).toBeGreaterThan(getSmMax);
      expect(getLgMax).toBeGreaterThan(getMdMax);
    });
  });
});
