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

  test.describe('Visual regression', () => {
    test('app appearance in light theme', async ({ page }) => {
      await expect(page).toHaveScreenshot('app-light-theme.png', {
        fullPage: true
      });
    });

    test('app appearance in dark theme', async ({ page }) => {
      await page.locator('#theme-preference').selectOption('dark');
      await page.waitForFunction(
        () => document.documentElement.getAttribute('data-theme') === 'dark'
      );
      await expect(page).toHaveScreenshot('app-dark-theme.png', {
        fullPage: true
      });
    });

    test('palette grid visual appearance', async ({ page }) => {
      const palettes = page.getByTestId('generated-palettes');
      await expect(palettes).toHaveScreenshot('palette-grid.png');
    });

    test('neutral palette visual appearance', async ({ page }) => {
      const neutralPalette = page.getByTestId('neutral-palette');
      await expect(neutralPalette).toHaveScreenshot('neutral-palette.png');
    });
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

      // Wait for palette color to update
      await page.waitForFunction(
        (before) => {
          const hex = document.querySelector(
            '[data-testid="generated-palettes"] .swatches .hex:nth-child(6)'
          )?.textContent;
          return hex !== before;
        },
        initialHex,
        { timeout: 5000 }
      );

      // Palette color should change
      const newHex = await paletteHexes.nth(5).textContent();
      expect(newHex).not.toBe(initialHex);
    });
  });
});
