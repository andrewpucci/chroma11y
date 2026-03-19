/**
 * Focus Indicator E2E Tests
 * Verifies keyboard navigation works and focus indicators are visible.
 * Uses keyboard navigation (Tab) to trigger :focus-visible consistently across browsers,
 * since programmatic .focus() doesn't reliably trigger :focus-visible styles.
 */

import { test, expect } from '@playwright/test';
import { waitForAppReady } from './test-utils';

test.describe('Focus Indicators', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test.describe('Keyboard navigation', () => {
    test('Tab key moves focus through interactive elements', async ({ page }) => {
      // Start from hex input (color picker is not keyboard-focusable in WebKit/Safari)
      const hexInput = page.locator('#baseColorHex');
      await hexInput.focus();

      // Verify strict tab order from hex input through the algorithm selector.
      const expectedTabOrder = [
        { selector: '#warmth' },
        { selector: '[aria-label="Warmth value input"]' },
        { selector: '#saturation' },
        { selector: '[aria-label="Saturation value input"]' },
        { selector: '#numColors' },
        { selector: '[aria-label="Number of colors value input"]' },
        { selector: '#numPalettes' },
        { selector: '[aria-label="Number of palettes value input"]' },
        { selector: '.bezier-editor [role="slider"]', index: 0 },
        { selector: '.bezier-editor [role="slider"]', index: 1 },
        { selector: '#bezier-p1-x' },
        { selector: '#bezier-p1-y' },
        { selector: '#bezier-p2-x' },
        { selector: '#bezier-p2-y' },
        { selector: '#contrast-algorithm' }
      ];

      for (const item of expectedTabOrder) {
        await page.keyboard.press('Tab');

        const locator =
          item.index !== undefined
            ? page.locator(item.selector).nth(item.index)
            : page.locator(item.selector);

        await expect(locator).toBeFocused();
      }

      // Browser engines differ in checklist sub-order; ensure we traverse checklist controls
      // before arriving at contrast mode.
      const focusedControls: string[] = [];
      let reachedContrastMode = false;
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press('Tab');

        const focusedControl = await page.evaluate(() => {
          const active = document.activeElement as HTMLElement | null;
          if (!active) return '';

          return active.id || active.getAttribute('aria-label') || active.tagName;
        });
        focusedControls.push(focusedControl);

        if (focusedControl === 'contrast-mode') {
          reachedContrastMode = true;
          break;
        }
      }

      expect(reachedContrastMode).toBe(true);
    });

    test('focus indicator is visible after keyboard navigation', async ({ page }) => {
      const hexInput = page.locator('#baseColorHex');
      await hexInput.focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');

      const outline = await hexInput.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          outlineStyle: style.outlineStyle,
          outlineWidth: parseFloat(style.outlineWidth)
        };
      });

      expect(outline.outlineStyle).toBe('solid');
      expect(outline.outlineWidth).toBeGreaterThanOrEqual(2);
    });

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
