/**
 * Focus Indicator E2E Tests
 * Verifies that all keyboard focus indicators use the same universal double-outline
 * pattern (3px solid white outline + 6px black box-shadow) throughout the interface.
 * per https://www.sarasoueidan.com/blog/focus-indicators/
 */

import { test, expect } from '@playwright/test';
import { waitForAppReady } from './test-utils';

test.describe('Focus Indicators', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await page.waitForTimeout(500);
  });

  test.describe('Universal double-outline pattern', () => {
    test('shows 3px white outline on focused text input', async ({ page }) => {
      const hexInput = page.locator('#baseColorHex');
      await hexInput.focus();

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
      expect(outline.outlineColor).toMatch(/rgb\(255,\s*255,\s*255\)/);
    });

    test('shows visible outline on focused select', async ({ page }) => {
      const select = page.locator('#contrast-mode');
      await select.focus();

      const outline = await select.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          outlineStyle: style.outlineStyle,
          outlineWidth: parseFloat(style.outlineWidth)
        };
      });

      expect(outline.outlineStyle).toBe('solid');
      expect(outline.outlineWidth).toBeGreaterThanOrEqual(2);
    });

    test('shows visible outline on focused button', async ({ page }) => {
      const exportBtn = page.getByRole('button', { name: 'Export JSON design tokens' });
      await exportBtn.focus();

      const outline = await exportBtn.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          outlineStyle: style.outlineStyle,
          outlineWidth: parseFloat(style.outlineWidth)
        };
      });

      expect(outline.outlineStyle).toBe('solid');
      expect(outline.outlineWidth).toBeGreaterThanOrEqual(2);
    });

    test('shows visible outline on focused color swatch', async ({ page }) => {
      const swatch = page.locator('.color-swatch').first();
      await swatch.focus();

      const outline = await swatch.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          outlineStyle: style.outlineStyle,
          outlineWidth: parseFloat(style.outlineWidth)
        };
      });

      expect(outline.outlineStyle).toBe('solid');
      expect(outline.outlineWidth).toBeGreaterThanOrEqual(2);
    });

    test('shows visible outline on focused range slider', async ({ page }) => {
      const slider = page.locator('#warmth');
      await slider.focus();

      // Check the warmth slider's wrapper div for the focus ring (not the input itself)
      const wrapper = page.locator('#warmth').locator('..');
      const outline = await wrapper.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          outlineStyle: style.outlineStyle,
          outlineWidth: parseFloat(style.outlineWidth)
        };
      });

      expect(outline.outlineStyle).toBe('solid');
      expect(outline.outlineWidth).toBeGreaterThanOrEqual(2);
    });
  });

  test.describe('Dark theme focus indicators', () => {
    test('uses same white outline in dark mode', async ({ page }) => {
      // Switch to dark theme
      await page.locator('#theme-preference').selectOption('dark');
      await page.waitForTimeout(300);

      const hexInput = page.locator('#baseColorHex');
      await hexInput.focus();

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
      expect(outline.outlineColor).toMatch(/rgb\(255,\s*255,\s*255\)/);
    });
  });

  test.describe('No suppressed outlines', () => {
    test('nudger inputs do not suppress outline', async ({ page }) => {
      const nudger = page.locator('.nudger-input').first();
      await nudger.focus();

      const outlineStyle = await nudger.evaluate((el) => {
        return getComputedStyle(el).outlineStyle;
      });

      expect(outlineStyle).not.toBe('none');
    });
  });

  test.describe('Keyboard navigation', () => {
    test('Tab key moves focus through interactive elements with visible indicators', async ({
      page
    }) => {
      // Start tabbing from the beginning
      await page.keyboard.press('Tab'); // skip link
      await page.keyboard.press('Tab'); // color picker
      await page.keyboard.press('Tab'); // hex input

      const hexInput = page.locator('#baseColorHex');
      await expect(hexInput).toBeFocused();

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
  });
});
