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
