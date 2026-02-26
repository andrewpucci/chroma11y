/**
 * Focus Indicator E2E Tests
 * Verifies keyboard navigation works and focus indicators are visible.
 * Uses keyboard navigation (Tab) to trigger :focus-visible consistently across browsers,
 * since programmatic .focus() doesn't reliably trigger :focus-visible styles.
 */

import { test, expect } from '@playwright/test';
import { waitForAppReady } from './test-utils';
import { maybeCaptureArgosVisual } from './visual';

test.describe('Focus Indicators', () => {
  test.describe('Visual regression', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await waitForAppReady(page);
    });

    test('focus indicator appearance in light mode', async ({ page }, testInfo) => {
      const hexInput = page.locator('#baseColorHex');
      await hexInput.focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      await maybeCaptureArgosVisual({
        page,
        testInfo,
        name: 'focus-indicator-light',
        element: hexInput
      });
      await expect(hexInput).toHaveScreenshot('focus-indicator-light.png');
    });

    test('focus indicator appearance in dark mode', async ({ page }, testInfo) => {
      await page.locator('#theme-preference').selectOption('dark');
      await page.waitForFunction(
        () => document.documentElement.getAttribute('data-theme') === 'dark'
      );

      const hexInput = page.locator('#baseColorHex');
      await hexInput.focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      await maybeCaptureArgosVisual({
        page,
        testInfo,
        name: 'focus-indicator-dark',
        element: hexInput
      });
      await expect(hexInput).toHaveScreenshot('focus-indicator-dark.png');
    });
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test.describe('Keyboard navigation', () => {
    test('Tab key moves focus through interactive elements', async ({ page }) => {
      // Start from hex input (color picker is not keyboard-focusable in WebKit/Safari)
      const hexInput = page.locator('#baseColorHex');
      await hexInput.focus();

      // Verify tab order from hex input through remaining controls
      const expectedTabOrder = [
        { selector: '#warmth' },
        { selector: '#saturation' },
        { selector: '#numColors' },
        { selector: '#numPalettes' },
        { selector: '.bezier-editor [role="slider"]', index: 0 },
        { selector: '.bezier-editor [role="slider"]', index: 1 },
        { selector: '#bezier-p1-x' },
        { selector: '#bezier-p1-y' },
        { selector: '#bezier-p2-x' },
        { selector: '#bezier-p2-y' },
        { selector: '#contrast-mode' }
      ];

      for (const item of expectedTabOrder) {
        await page.keyboard.press('Tab');

        const locator =
          item.index !== undefined
            ? page.locator(item.selector).nth(item.index)
            : page.locator(item.selector);

        await expect(locator).toBeFocused();
      }
    });

    test('focus indicator is visible after keyboard navigation', async ({ page }) => {
      // Focus hex input and use keyboard to trigger :focus-visible
      const hexInput = page.locator('#baseColorHex');
      await hexInput.focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab'); // Tab back to hex input via keyboard

      const outline = await hexInput.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          outlineStyle: style.outlineStyle,
          outlineWidth: parseFloat(style.outlineWidth)
        };
      });

      // After keyboard navigation, focus indicator should be visible
      expect(outline.outlineStyle).toBe('solid');
      expect(outline.outlineWidth).toBeGreaterThanOrEqual(2);
    });
  });

  test.describe('Dark theme focus indicators', () => {
    test('focus indicator adapts to dark mode', async ({ page }) => {
      // Switch to dark theme
      await page.locator('#theme-preference').selectOption('dark');

      // Wait for theme to be applied
      await page.waitForFunction(
        () => document.documentElement.getAttribute('data-theme') === 'dark',
        { timeout: 5000 }
      );

      // Use keyboard navigation to trigger :focus-visible
      const hexInput = page.locator('#baseColorHex');
      await hexInput.focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');

      const outline = await hexInput.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          outlineStyle: style.outlineStyle,
          outlineWidth: parseFloat(style.outlineWidth),
          outlineColor: style.outlineColor
        };
      });

      expect(outline.outlineStyle).toBe('solid');
      expect(outline.outlineWidth).toBe(3);
      // Dark mode uses black inner ring
      expect(outline.outlineColor).toMatch(/rgb\(0,\s*0,\s*0\)/);
    });
  });
});
