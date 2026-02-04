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
      await expect(page.locator('.color-display').first()).toBeVisible();
    });

    test('generates initial color palettes', async ({ page }) => {
      // Should have neutral palette with 11 colors by default
      const neutralSection = page.locator('.color-display').first();
      await expect(neutralSection).toBeVisible();
      await expect(neutralSection.locator('.color-swatch')).toHaveCount(11);

      // Should have palette section
      await expect(page.locator('.color-display').nth(1)).toBeVisible();
    });
  });

  test.describe('Theme Toggling', () => {
    test('toggles between light and dark themes', async ({ page }) => {
      const themeToggle = page.locator('.theme-toggle');
      await expect(themeToggle).toBeVisible();

      // Initial state should be light mode
      await expect(themeToggle).toContainText('Dark Mode');

      // Toggle to dark mode
      await themeToggle.click();
      await page.waitForTimeout(500);
      await expect(themeToggle).toContainText('Light Mode');

      // Toggle back to light mode
      await themeToggle.click();
      await page.waitForTimeout(500);
      await expect(themeToggle).toContainText('Dark Mode');
    });

    test('dark mode changes bezier curve values', async ({ page }) => {
      // Light mode default x1: 0.16
      const x1Input = page.locator('#x1');
      await expect(x1Input).toHaveValue('0.16');

      // Toggle to dark mode
      await page.locator('.theme-toggle').click();
      await page.waitForTimeout(500);

      // Dark mode should have different bezier values (x1: 0.45)
      await expect(x1Input).toHaveValue('0.45');
    });
  });

  test.describe('Base Color Controls', () => {
    test('changing base color updates palettes', async ({ page }) => {
      const paletteHexes = page.locator('.color-display').nth(1).locator('.hex');
      const initialHex = await paletteHexes.nth(5).textContent();

      // Change base color to green
      await page.locator('#baseColor').fill('#00ff00');
      await page.waitForTimeout(500);

      // Palette color should change
      const newHex = await paletteHexes.nth(5).textContent();
      expect(newHex).not.toBe(initialHex);
    });
  });

  test.describe('Slider Controls', () => {
    test('allows adjusting warmth control', async ({ page }) => {
      const warmthSlider = page.locator('#warmth');
      await expect(warmthSlider).toBeVisible();

      await warmthSlider.fill('10');
      await page.waitForTimeout(500);
      await expect(warmthSlider).toHaveValue('10');
    });

    test('allows adjusting chroma multiplier', async ({ page }) => {
      const chromaControl = page.locator('#chroma');
      await expect(chromaControl).toBeVisible();

      await chromaControl.fill('1.5');
      await page.waitForTimeout(500);
      await expect(chromaControl).toHaveValue('1.5');
    });

    test('allows adjusting number of colors', async ({ page }) => {
      const numColorsInput = page.locator('#numColors');
      await numColorsInput.fill('7');
      await page.waitForTimeout(500);
      await expect(numColorsInput).toHaveValue('7');
    });
  });

  test.describe('Color Copying', () => {
    test('color swatches are clickable for copying', async ({ page }) => {
      const firstSwatch = page.locator('.color-swatch').first();
      await expect(firstSwatch).toBeVisible();

      // Verify hex code format
      const colorHex = await firstSwatch.locator('.hex').textContent();
      expect(colorHex).toMatch(/^#[0-9A-Fa-f]{6}$/);

      // Click should not break anything
      await firstSwatch.click();
      await page.waitForTimeout(200);
      await expect(firstSwatch).toBeVisible();
    });
  });

  test.describe('Contrast Controls', () => {
    test('can switch between auto and manual contrast modes', async ({ page }) => {
      const contrastModeSelect = page.locator('#contrast-mode');
      await expect(contrastModeSelect).toBeVisible();
      await expect(contrastModeSelect).toHaveValue('auto');

      // Switch to manual
      await contrastModeSelect.selectOption('manual');
      await page.waitForTimeout(300);
      await expect(contrastModeSelect).toHaveValue('manual');

      // Manual color inputs should be visible
      await expect(page.locator('#contrast-low')).toBeVisible();
    });
  });

  test.describe('Palette Naming', () => {
    test('displays palette names based on color', async ({ page }) => {
      const paletteHeaders = page.locator('.palette-header h3');
      const headerCount = await paletteHeaders.count();
      expect(headerCount).toBeGreaterThan(0);

      // First palette name should be a valid color name
      const firstName = await paletteHeaders.first().textContent();
      expect(firstName).toBeTruthy();
      expect(firstName!.length).toBeGreaterThan(1);
    });
  });
});
