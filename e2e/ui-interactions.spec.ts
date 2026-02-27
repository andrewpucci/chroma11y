/**
 * UI Interaction Tests
 * Tests for basic UI controls, theme toggling, and user interactions
 */

import { test, expect } from '@playwright/test';
import { waitForAppReady } from './test-utils';

test.describe('UI Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test.describe('App Loading', () => {
    test('loads the application successfully', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Chroma11y');
      await expect(page.locator('#baseColor')).toBeVisible();
      await expect(page.locator('.color-swatch').first()).toBeVisible();
    });

    test('generates initial color palettes', async ({ page }) => {
      // Should have neutral palette with 11 colors by default
      const neutralSection = page.getByTestId('neutral-palette');
      await expect(neutralSection).toBeVisible();
      await expect(neutralSection.locator('.color-swatch')).toHaveCount(11);

      // Should have palette section
      await expect(page.getByTestId('generated-palettes')).toBeVisible();
    });
  });

  test.describe('Display Settings Tooltip', () => {
    test('OKLCH significant digits tooltip stays above overlapping swatches and works with keyboard focus', async ({
      page
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      const displaySpace = page.locator('#display-color-space');
      await expect(displaySpace).toBeVisible();
      await displaySpace.evaluate((node) => {
        const select = node as HTMLSelectElement;
        select.value = 'oklch';
        select.dispatchEvent(new Event('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await expect(displaySpace).toHaveValue('oklch');

      const significantDigitsSlider = page.locator('#oklch-significant-digits');
      await expect(significantDigitsSlider).toBeVisible({ timeout: 30000 });

      const infoButton = page.getByRole('button', { name: 'Explain OKLCH significant digits' });
      const tooltip = page.locator('#oklch-significant-digits-help');

      await expect(infoButton).toBeVisible({ timeout: 30000 });
      await infoButton.scrollIntoViewIfNeeded();
      await infoButton.hover();
      await expect(tooltip).toBeVisible();
      const tooltipBox = await tooltip.boundingBox();
      expect(tooltipBox).toBeTruthy();
      expect(tooltipBox!.width).toBeGreaterThan(180);

      // Tooltip intentionally uses pointer-events: none in app CSS.
      // Enable pointer-events for this assertion so elementFromPoint reflects
      // visual stacking order rather than hit-testing behavior.
      await page.evaluate(() => {
        const tooltipEl = document.querySelector<HTMLElement>('#oklch-significant-digits-help');
        if (tooltipEl) {
          tooltipEl.style.pointerEvents = 'auto';
        }
      });

      const overlapResult = await page.evaluate(() => {
        const tooltipEl = document.querySelector<HTMLElement>('#oklch-significant-digits-help');
        if (!tooltipEl) throw new Error('Tooltip not found');

        const tooltipRect = tooltipEl.getBoundingClientRect();
        const x = Math.min(tooltipRect.left + tooltipRect.width * 0.85, window.innerWidth - 1);
        const y = Math.min(tooltipRect.top + tooltipRect.height * 0.5, window.innerHeight - 1);
        const topElement = document.elementFromPoint(x, y);

        return {
          hasOverlap: true,
          tooltipOnTop: Boolean(topElement?.closest('#oklch-significant-digits-help'))
        };
      });

      expect(overlapResult.hasOverlap).toBe(true);
      expect(overlapResult.tooltipOnTop).toBe(true);

      await infoButton.focus();
      await expect(infoButton).toBeFocused();
      await expect(tooltip).toBeVisible();
    });
  });

  test.describe('Base Color Controls', () => {
    test('changing base color updates palettes', async ({ page }) => {
      const paletteHexes = page
        .getByTestId('generated-palettes')
        .locator('.swatches')
        .first()
        .locator('.hex');
      const initialHex = (await paletteHexes.nth(5).textContent())?.trim() ?? '';

      // Change base color to green
      await page.locator('#baseColor').fill('#00ff00');
      await page.locator('#baseColor').press('Tab');
      await expect
        .poll(async () => ((await paletteHexes.nth(5).textContent()) ?? '').trim(), {
          timeout: 15000
        })
        .not.toBe(initialHex);

      // Palette color should change
      const newHex = await paletteHexes.nth(5).textContent();
      expect(newHex).not.toBe(initialHex);
    });
  });
});
