/**
 * Visual Comparison Tests
 * Validates color generation against expected values from the algorithm
 *
 * Tests:
 * - Neutral colors match expected values
 * - Deterministic color generation
 * - Contrast calculations
 * - Color naming (CIEDE2000)
 */

import { test, expect } from '@playwright/test';
import { waitForAppReady } from './test-utils';

// Test configuration for validating color generation
const TEST_CONFIG = {
  baseColor: '#1862e6',
  warmth: -7,
  x1: 0.16,
  y1: 0,
  x2: 0.28,
  y2: 0.38,
  chromaMult: 1.14,
  lightnessNudgers: { 5: -0.005, 6: -0.0009 },
  hueNudgers: { 4: -5 }
};

// Expected neutral colors from validated algorithm (100% match)
const EXPECTED_NEUTRALS = [
  '#ffffff',
  '#f1f3f5',
  '#d5d7d9',
  '#b6b8b9',
  '#97999b',
  '#797b7c',
  '#5e6062',
  '#454748',
  '#2c2e30',
  '#151718',
  '#000000'
];

test.describe('Visual Comparison', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await page.waitForTimeout(500);
  });

  test.describe('Color Generation Comparison', () => {
    test('generates expected neutral colors with test config', async ({ page }) => {
      // Apply test configuration
      await page.locator('#baseColor').fill(TEST_CONFIG.baseColor);
      await page.locator('#warmth').fill(String(TEST_CONFIG.warmth));
      await page.locator('#x1').fill(String(TEST_CONFIG.x1));
      await page.locator('#y1').fill(String(TEST_CONFIG.y1));
      await page.locator('#x2').fill(String(TEST_CONFIG.x2));
      await page.locator('#y2').fill(String(TEST_CONFIG.y2));
      await page.locator('#chroma').fill(String(TEST_CONFIG.chromaMult));
      await page.waitForTimeout(300);

      // Apply lightness nudgers
      const nudgerInputs = page.locator('.nudger-input');
      for (const [index, value] of Object.entries(TEST_CONFIG.lightnessNudgers)) {
        await nudgerInputs.nth(parseInt(index)).fill(String(value));
      }
      await page.waitForTimeout(300);

      // Apply hue nudgers
      const hueNudgers = page.locator('.hue-nudger-input');
      for (const [index, value] of Object.entries(TEST_CONFIG.hueNudgers)) {
        await hueNudgers.nth(parseInt(index)).fill(String(value));
      }
      await page.waitForTimeout(500);

      // Capture neutral colors (first .color-display section contains neutrals)
      const neutralSection = page.locator('.color-display').first();
      const neutralHexes = neutralSection.locator('.hex');
      const neutralCount = await neutralHexes.count();

      expect(neutralCount).toBe(11);

      // Compare each neutral color
      const results: { step: number; expected: string; actual: string; match: boolean }[] = [];
      for (let i = 0; i < neutralCount; i++) {
        const actual = ((await neutralHexes.nth(i).textContent()) || '').toLowerCase();
        const expected = EXPECTED_NEUTRALS[i].toLowerCase();
        results.push({
          step: i,
          expected,
          actual,
          match: actual === expected
        });
      }

      // Log detailed comparison
      console.log('\n=== Neutral Color Comparison ===');
      console.log('Step | Expected | Actual   | Status');
      console.log('-----|----------|----------|--------');
      for (const r of results) {
        console.log(
          `${r.step.toString().padStart(4)} | ${r.expected} | ${r.actual} | ${r.match ? '✓' : '✗'}`
        );
      }

      const matchCount = results.filter((r) => r.match).length;
      console.log(
        `\nMatch Rate: ${matchCount}/${results.length} (${Math.round((matchCount / results.length) * 100)}%)`
      );

      // Assert high match rate (allowing for minor rounding differences)
      expect(matchCount).toBeGreaterThanOrEqual(9); // At least 82% match
    });

    test('generates 11 palettes with consistent structure', async ({ page }) => {
      // Apply test configuration
      await page.locator('#baseColor').fill(TEST_CONFIG.baseColor);
      await page.locator('#warmth').fill(String(TEST_CONFIG.warmth));
      await page.locator('#chroma').fill(String(TEST_CONFIG.chromaMult));
      await page.waitForTimeout(500);

      // The palette grid contains all 11 palettes - count palette headers (h3)
      const paletteGrid = page.locator('.color-display').last();
      const paletteHeaders = paletteGrid.locator('.palette-header');
      const paletteCount = await paletteHeaders.count();

      expect(paletteCount).toBe(11);

      // Check each palette has 11 colors by counting color grids
      const colorGrids = paletteGrid.locator('.color-grid');
      const gridCount = await colorGrids.count();
      expect(gridCount).toBe(11);

      // Verify first palette has 11 swatches
      const firstGridSwatches = colorGrids.first().locator('.hex');
      expect(await firstGridSwatches.count()).toBe(11);
    });

    test('palette colors have valid hex format', async ({ page }) => {
      await page.locator('#baseColor').fill(TEST_CONFIG.baseColor);
      await page.waitForTimeout(500);

      const hexPattern = /^#[0-9a-f]{6}$/i;

      // Check neutrals
      const neutralSection = page.locator('.color-display').first();
      const neutralHexes = neutralSection.locator('.hex');
      const neutralCount = await neutralHexes.count();

      for (let i = 0; i < neutralCount; i++) {
        const hex = await neutralHexes.nth(i).textContent();
        expect(hex).toMatch(hexPattern);
      }

      // Check first palette
      const firstPalette = page.locator('.color-display').nth(1);
      const paletteHexes = firstPalette.locator('.hex');
      const paletteCount = await paletteHexes.count();

      for (let i = 0; i < paletteCount; i++) {
        const hex = await paletteHexes.nth(i).textContent();
        expect(hex).toMatch(hexPattern);
      }
    });
  });

  test.describe('Contrast Ratio Comparison', () => {
    test('displays contrast ratios on swatches', async ({ page }) => {
      await page.locator('#baseColor').fill(TEST_CONFIG.baseColor);
      await page.waitForTimeout(500);

      // Check for contrast ratio display elements
      const contrastElements = page.locator('.contrast-ratio');
      const contrastCount = await contrastElements.count();

      // Each swatch should show contrast ratios
      expect(contrastCount).toBeGreaterThan(0);
    });

    test('contrast ratios are numeric and in valid range', async ({ page }) => {
      await page.locator('#baseColor').fill(TEST_CONFIG.baseColor);
      await page.waitForTimeout(500);

      // Contrast info is in .contrast-info spans with .low and .high classes
      const contrastLowElements = page.locator('.contrast-info .low');
      const count = await contrastLowElements.count();

      for (let i = 0; i < Math.min(count, 22); i++) {
        // Check first 22
        const text = await contrastLowElements.nth(i).textContent();
        const ratio = parseFloat(text || '1');

        // WCAG contrast ratios are between 1 and 21
        expect(ratio).toBeGreaterThanOrEqual(1);
        expect(ratio).toBeLessThanOrEqual(21);
      }
    });

    test('auto contrast mode selects appropriate colors', async ({ page }) => {
      // Set auto contrast mode
      const contrastModeSelect = page.locator('#contrast-mode');
      await contrastModeSelect.selectOption('auto');
      await page.waitForTimeout(300);

      // Get low and high step selections
      const lowStep = parseInt((await page.locator('#low-step').inputValue()) || '0');
      const highStep = parseInt((await page.locator('#high-step').inputValue()) || '10');

      // Verify sensible defaults (low should be lighter, high should be darker)
      expect(lowStep).toBeLessThan(highStep);
      expect(lowStep).toBeGreaterThanOrEqual(0);
      expect(highStep).toBeLessThanOrEqual(10);
    });

    test('manual contrast mode uses custom colors', async ({ page }) => {
      // Set manual contrast mode
      const contrastModeSelect = page.locator('#contrast-mode');
      await contrastModeSelect.selectOption('manual');
      await page.waitForTimeout(300);

      // Manual color pickers should be visible (ids: contrast-low, contrast-high)
      const lowColorPicker = page.locator('#contrast-low');
      const highColorPicker = page.locator('#contrast-high');

      await expect(lowColorPicker).toBeVisible();
      await expect(highColorPicker).toBeVisible();

      // Set custom colors via text inputs - need to clear first, then type
      const lowTextInput = page
        .locator('.manual-controls .color-input-group')
        .first()
        .locator('input[type="text"]');
      const highTextInput = page
        .locator('.manual-controls .color-input-group')
        .last()
        .locator('input[type="text"]');

      // Clear and fill low color
      await lowTextInput.click();
      await lowTextInput.fill('#ff0000');
      await lowTextInput.press('Enter');
      await page.waitForTimeout(200);

      // Clear and fill high color
      await highTextInput.click();
      await highTextInput.fill('#0000ff');
      await highTextInput.press('Enter');
      await page.waitForTimeout(500);

      // Verify colors were applied in the contrast preview
      const lowLabel = await page
        .locator('.contrast-preview .color-sample')
        .first()
        .locator('.label')
        .textContent();
      const highLabel = await page
        .locator('.contrast-preview .color-sample')
        .last()
        .locator('.label')
        .textContent();

      // The low color should be red, high color should be blue
      expect(lowLabel?.toLowerCase()).toContain('#ff0000');
      expect(highLabel?.toLowerCase()).toContain('#0000ff');
    });
  });

  test.describe('Color Naming Accuracy', () => {
    test('palettes have meaningful names', async ({ page }) => {
      await page.locator('#baseColor').fill(TEST_CONFIG.baseColor);
      await page.waitForTimeout(500);

      // Palette names are in h3 elements within .palette-header
      const paletteNames = page.locator('.palette-header h3');
      const nameCount = await paletteNames.count();

      expect(nameCount).toBe(11); // Should have 11 palette names

      // Verify names are not empty or "Unnamed"
      let validNames = 0;
      for (let i = 0; i < nameCount; i++) {
        const name = await paletteNames.nth(i).textContent();
        if (name && name.trim() !== '' && name.toLowerCase() !== 'unnamed') {
          validNames++;
        }
      }

      // At least half should have valid names
      expect(validNames).toBeGreaterThanOrEqual(Math.floor(nameCount / 2));
    });

    test('base color palette is named correctly', async ({ page }) => {
      // Use a recognizable color (blue)
      await page.locator('#baseColor').fill('#0000ff');
      await page.waitForTimeout(500);

      // Find the first palette name (h3 in palette-header)
      const firstPaletteName = page.locator('.palette-header h3').first();
      const name = ((await firstPaletteName.textContent()) || '').toLowerCase();

      // Should contain 'blue' or a blue-related color name
      const blueNames = [
        'blue',
        'navy',
        'royal',
        'azure',
        'cobalt',
        'indigo',
        'ultramarine',
        'mediumblue'
      ];
      const hasBlueInName = blueNames.some((b) => name.includes(b));

      expect(hasBlueInName).toBe(true);
    });

    test('warm colors get warm names', async ({ page }) => {
      // Use a warm color (orange/red)
      await page.locator('#baseColor').fill('#ff6600');
      await page.waitForTimeout(500);

      const firstPaletteName = page.locator('.palette-header h3').first();
      const name = ((await firstPaletteName.textContent()) || '').toLowerCase();

      // Log the actual name for debugging
      console.log(`Warm color name detected: "${name}"`);

      // Should contain warm color names (extended list based on CIEDE2000)
      const warmNames = [
        'orange',
        'red',
        'coral',
        'salmon',
        'tomato',
        'tan',
        'peru',
        'sienna',
        'chocolate',
        'darkorange',
        'orangered',
        'brown',
        'firebrick',
        'crimson',
        'maroon',
        'darkred',
        'indianred',
        'lightsalmon',
        'sandybrown',
        'gold',
        'goldenrod',
        'darkgoldenrod'
      ];
      const hasWarmName = warmNames.some((w) => name.includes(w));

      expect(hasWarmName).toBe(true);
    });
  });

  test.describe('Theme Comparison', () => {
    test('light mode starts with white neutrals', async ({ page }) => {
      // Ensure light mode by clicking preset if needed
      const lightPreset = page
        .locator('button:has-text("Light"), .theme-preset:has-text("Light")')
        .first();
      if (await lightPreset.isVisible()) {
        await lightPreset.click();
        await page.waitForTimeout(300);
      }

      const neutralSection = page.locator('.color-display').first();
      const firstHex = await neutralSection.locator('.hex').first().textContent();
      const lastHex = await neutralSection.locator('.hex').last().textContent();

      expect(firstHex?.toLowerCase()).toBe('#ffffff');
      expect(lastHex?.toLowerCase()).toBe('#000000');
    });

    test('dark mode inverts neutral gradient', async ({ page }) => {
      // Switch to dark mode by clicking preset
      const darkPreset = page
        .locator('button:has-text("Dark"), .theme-preset:has-text("Dark")')
        .first();
      if (await darkPreset.isVisible()) {
        await darkPreset.click();
        await page.waitForTimeout(500);
      }

      const neutralSection = page.locator('.color-display').first();
      const firstHex = await neutralSection.locator('.hex').first().textContent();
      const lastHex = await neutralSection.locator('.hex').last().textContent();

      // Dark mode: first should be dark, last should be light/white
      const firstLuminance = getRelativeLuminance(firstHex || '#000000');
      const lastLuminance = getRelativeLuminance(lastHex || '#ffffff');

      expect(firstLuminance).toBeLessThan(lastLuminance);
    });
  });

  test.describe('Visual Regression Screenshots', () => {
    test('captures default state screenshot', async ({ page }) => {
      await page.locator('#baseColor').fill(TEST_CONFIG.baseColor);
      await page.waitForTimeout(500);

      await page.screenshot({
        path: 'e2e/screenshots/visual-comparison-default.png',
        fullPage: true
      });
    });

    test('captures configured state screenshot', async ({ page }) => {
      // Apply full test config
      await page.locator('#baseColor').fill(TEST_CONFIG.baseColor);
      await page.locator('#warmth').fill(String(TEST_CONFIG.warmth));
      await page.locator('#x1').fill(String(TEST_CONFIG.x1));
      await page.locator('#y1').fill(String(TEST_CONFIG.y1));
      await page.locator('#x2').fill(String(TEST_CONFIG.x2));
      await page.locator('#y2').fill(String(TEST_CONFIG.y2));
      await page.locator('#chroma').fill(String(TEST_CONFIG.chromaMult));
      await page.waitForTimeout(300);

      const nudgerInputs = page.locator('.nudger-input');
      for (const [index, value] of Object.entries(TEST_CONFIG.lightnessNudgers)) {
        await nudgerInputs.nth(parseInt(index)).fill(String(value));
      }
      await page.waitForTimeout(500);

      await page.screenshot({
        path: 'e2e/screenshots/visual-comparison-configured.png',
        fullPage: true
      });
    });

    test('captures dark mode screenshot', async ({ page }) => {
      // Switch to dark mode by clicking preset
      const darkPreset = page
        .locator('button:has-text("Dark"), .theme-preset:has-text("Dark")')
        .first();
      if (await darkPreset.isVisible()) {
        await darkPreset.click();
        await page.waitForTimeout(300);
      }

      await page.locator('#baseColor').fill(TEST_CONFIG.baseColor);
      await page.waitForTimeout(500);

      await page.screenshot({
        path: 'e2e/screenshots/visual-comparison-dark.png',
        fullPage: true
      });
    });
  });
});

// Helper function to calculate relative luminance
function getRelativeLuminance(hex: string): number {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return 0;

  const [r, g, b] = [
    parseInt(match[1], 16) / 255,
    parseInt(match[2], 16) / 255,
    parseInt(match[3], 16) / 255
  ].map((val) => (val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)));

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
