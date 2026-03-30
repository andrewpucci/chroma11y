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

      const getFocusedControl = async (): Promise<string> => {
        return page.evaluate(() => {
          const active = document.activeElement as HTMLElement | null;
          if (!active) return '';
          return active.id || active.getAttribute('aria-label') || active.tagName;
        });
      };

      // Verify strict tab order for controls before the optional warmth-hue toggle.
      const expectedPreSaturationTabOrder = [
        { selector: '#warmth' },
        { selector: '[aria-label="Warmth value input"]' }
      ];

      for (const item of expectedPreSaturationTabOrder) {
        await page.keyboard.press('Tab');
        await expect(page.locator(item.selector)).toBeFocused();
      }

      // Chromium/Firefox include the "Custom Warmth Hue" checkbox in tab order,
      // while WebKit often skips it with Safari-style keyboard navigation defaults.
      const customWarmthToggle = page.getByRole('checkbox', { name: 'Custom Warmth Hue' });
      await page.keyboard.press('Tab');
      if (
        (await customWarmthToggle.count()) > 0 &&
        (await customWarmthToggle.evaluate((el) => el === document.activeElement))
      ) {
        await page.keyboard.press('Tab');
      }
      await expect(page.locator('#saturation')).toBeFocused();

      const expectedPostSaturationTabOrder = [
        { selector: '[aria-label="Saturation value input"]' },
        { selector: '#numColors' },
        { selector: '[aria-label="Number of colors value input"]' },
        { selector: '#numPalettes' },
        { selector: '[aria-label="Number of palettes value input"]' },
        { selector: '[data-testid="generation-advanced-group"] summary' }
      ];

      for (const item of expectedPostSaturationTabOrder) {
        await page.keyboard.press('Tab');
        await expect(page.locator(item.selector)).toBeFocused();
      }

      let contrastAlgorithmFocused = false;
      const traversalToContrastAlgorithm: string[] = [];
      for (let i = 0; i < 14; i += 1) {
        await page.keyboard.press('Tab');
        traversalToContrastAlgorithm.push(await getFocusedControl());
        const contrastAlgorithm = page.locator('#contrast-algorithm');
        if (await contrastAlgorithm.evaluate((el) => el === document.activeElement)) {
          contrastAlgorithmFocused = true;
          break;
        }
      }

      expect(
        contrastAlgorithmFocused,
        `Did not reach #contrast-algorithm. Traversed: ${traversalToContrastAlgorithm.join(' -> ')}`
      ).toBe(true);

      // Browser engines differ in checklist sub-order; ensure we traverse checklist controls
      // before arriving at contrast mode.
      const focusedControls: string[] = [];
      let reachedContrastMode = false;
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press('Tab');
        const focusedControl = await getFocusedControl();
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

    test('compact disclosure summaries keep their focus indicator fully visible', async ({
      page
    }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await waitForAppReady(page);

      const generationCard = page.getByTestId('generation-controls-card');
      const generationSummary = generationCard.locator(':scope > summary.card-summary');

      let generationSummaryFocused = false;
      for (let i = 0; i < 20; i += 1) {
        await page.keyboard.press('Tab');
        if (await generationSummary.evaluate((el) => el === document.activeElement)) {
          generationSummaryFocused = true;
          break;
        }
      }

      expect(generationSummaryFocused).toBe(true);

      const generationFocusRing = await generationCard.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          outlineStyle: style.outlineStyle,
          outlineWidth: parseFloat(style.outlineWidth),
          boxShadow: style.boxShadow
        };
      });

      expect(generationFocusRing.outlineStyle).toBe('solid');
      expect(generationFocusRing.outlineWidth).toBeGreaterThanOrEqual(2);
      expect(generationFocusRing.boxShadow).not.toBe('none');

      await page.keyboard.press('Enter');
      const advancedGroup = page.getByTestId('generation-advanced-group');
      const advancedSummary = advancedGroup.locator('summary');

      await page.getByRole('spinbutton', { name: 'Number of palettes value input' }).focus();
      let advancedSummaryFocused = false;
      for (let i = 0; i < 6; i += 1) {
        await page.keyboard.press('Tab');
        if (await advancedSummary.evaluate((el) => el === document.activeElement)) {
          advancedSummaryFocused = true;
          break;
        }
      }

      expect(advancedSummaryFocused).toBe(true);

      const advancedFocusRing = await advancedGroup.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          outlineStyle: style.outlineStyle,
          outlineWidth: parseFloat(style.outlineWidth),
          boxShadow: style.boxShadow
        };
      });

      expect(advancedFocusRing.outlineStyle).toBe('solid');
      expect(advancedFocusRing.outlineWidth).toBeGreaterThanOrEqual(2);
      expect(advancedFocusRing.boxShadow).not.toBe('none');
    });
  });
});
