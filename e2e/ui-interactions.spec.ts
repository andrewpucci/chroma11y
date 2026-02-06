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
    await page.waitForTimeout(500);
  });

  test.describe('App Loading', () => {
    test('loads the application successfully', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Svelte Color Generator');
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

  test.describe('Base Color Controls', () => {
    test('changing base color updates palettes', async ({ page }) => {
      const paletteHexes = page
        .getByTestId('generated-palettes')
        .locator('.swatches')
        .first()
        .locator('.hex');
      const initialHex = await paletteHexes.nth(5).textContent();

      // Change base color to green
      await page.locator('#baseColor').fill('#00ff00');
      await page.waitForTimeout(500);

      // Palette color should change
      const newHex = await paletteHexes.nth(5).textContent();
      expect(newHex).not.toBe(initialHex);
    });
  });
});
