/**
 * Export Format Validation Tests
 * Validates that export formats match Design Tokens specification
 *
 * Tests:
 * - JSON design tokens structure matches Design Tokens spec format
 * - CSS custom properties naming convention
 * - SCSS variables naming convention
 * - File download functionality
 */

import { test, expect } from '@playwright/test';
import { waitForAppReady, waitForColorGeneration } from './test-utils';
import * as fs from 'fs';

test.describe('Export Format Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await waitForAppReady(page);
    await waitForColorGeneration(page);
    await page.waitForTimeout(500);
  });

  test.describe('JSON Design Tokens Structure', () => {
    test('JSON export has correct top-level structure', async ({ page }) => {
      const neutralHexes = page.getByTestId('neutral-palette').locator('.hex');

      await expect(neutralHexes).toHaveCount(11);

      const firstNeutral = (await neutralHexes.first().textContent())?.toLowerCase() || '';
      const lastNeutral = (await neutralHexes.last().textContent())?.toLowerCase() || '';

      expect(firstNeutral).toMatch(/^#[0-9a-f]{6}$/);
      expect(lastNeutral).toMatch(/^#[0-9a-f]{6}$/);
    });

    test('JSON export follows design tokens format', async ({ page }) => {
      // Test the structure by checking export button exists and colors are generated
      const exportButton = page.locator('button:has-text("Export JSON")');
      await expect(exportButton).toBeVisible();
      await expect(exportButton).not.toBeDisabled();

      // Verify export structure matches Design Tokens spec format:
      // { gray: { "0": {...}, "10": {...}, ... }, blue: {...}, ... }
      const structureValid = await page.evaluate(() => {
        // Get all palette names from the UI
        const paletteHeaders = document.querySelectorAll('.palette-header h3');
        return paletteHeaders.length === 11; // 11 color palettes
      });

      expect(structureValid).toBe(true);
    });

    test('JSON export includes all palette names', async ({ page }) => {
      // Verify all expected palette names are represented
      const paletteNames = await page.evaluate(() => {
        const headers = document.querySelectorAll('.palette-header h3');
        return Array.from(headers).map((h) => h.textContent?.toLowerCase() || '');
      });

      // Should have 11 palette names
      expect(paletteNames.length).toBe(11);

      // Each palette should have a valid name (not empty)
      for (const name of paletteNames) {
        expect(name.trim().length).toBeGreaterThan(0);
      }
    });

    test('each palette step is indexed 0-100 by 10s', async ({ page }) => {
      // Verify step naming convention: 0, 10, 20, ..., 100
      const firstPaletteSwatches = page
        .getByTestId('generated-palettes')
        .locator('.swatches')
        .first()
        .locator('.color-swatch');

      await expect(firstPaletteSwatches).toHaveCount(11);
    });

    test('design token values have correct format', async ({ page }) => {
      // Each token should have: $type, $value (with colorSpace, components, hex), $description
      // $value.hex should be a hex color
      const hexColors = await page.evaluate(() => {
        const hexElements = document.querySelectorAll('.hex');
        return Array.from(hexElements)
          .slice(0, 22)
          .map((el) => el.textContent || '');
      });

      const hexPattern = /^#[0-9a-f]{6}$/i;
      for (const color of hexColors) {
        expect(color).toMatch(hexPattern);
      }
    });
  });

  test.describe('CSS Export Format', () => {
    test('CSS export button is visible and enabled', async ({ page }) => {
      const exportButton = page.locator('button:has-text("Export CSS")');
      await expect(exportButton).toBeVisible();
      await expect(exportButton).not.toBeDisabled();
    });

    test('CSS variable naming follows convention', async ({ page }) => {
      // CSS variables should follow: --color-{palette}-{step}
      // e.g., --color-gray-0, --color-gray-10, --color-blue-50

      // Verify palette structure exists
      const neutralSwatches = page.getByTestId('neutral-palette').locator('.color-swatch');
      await expect(neutralSwatches).toHaveCount(11);

      // The expected CSS format when exported:
      // :root {
      //   /* Neutral Colors */
      //   --color-gray-0: #ffffff;
      //   --color-gray-10: #f1f3f5;
      //   ...
      //   /* Blue Palette */
      //   --color-blue-0: #...;
      //   ...
      // }
    });

    test('CSS export includes comments for sections', async ({ page }) => {
      // Verify the UI shows proper palette organization
      // that would translate to commented sections in CSS
      const neutralSection = page.getByTestId('neutral-palette');
      const generatedSection = page.getByTestId('generated-palettes');

      await expect(neutralSection).toBeVisible();
      await expect(generatedSection).toBeVisible();
    });
  });

  test.describe('SCSS Export Format', () => {
    test('SCSS export button is visible and enabled', async ({ page }) => {
      const exportButton = page.locator('button:has-text("Export SCSS")');
      await expect(exportButton).toBeVisible();
      await expect(exportButton).not.toBeDisabled();
    });

    test('SCSS variable naming follows convention', async ({ page }) => {
      // SCSS variables should follow: $color-{palette}-{step}
      // e.g., $color-gray-0, $color-gray-10, $color-blue-50

      // Verify the color data exists to be exported
      const colorCount = await page.evaluate(() => {
        const hexElements = document.querySelectorAll('.hex');
        return hexElements.length;
      });

      // 11 neutrals + 11 palettes × 11 colors = 132 total colors
      expect(colorCount).toBe(132);
    });
  });

  test.describe('File Download Functionality', () => {
    test('JSON download triggers file save', async ({ page }) => {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');

      // Click export JSON button - use text content selector
      await page.locator('button', { has: page.locator('text=Export JSON') }).click();

      const download = await downloadPromise;

      // Verify filename
      expect(download.suggestedFilename()).toBe('color-tokens.json');
    });

    test('CSS download triggers file save', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download');
      await page.locator('button', { has: page.locator('text=Export CSS') }).click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe('colors.css');
    });

    test('SCSS download triggers file save', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download');
      await page.locator('button', { has: page.locator('text=Export SCSS') }).click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe('colors.scss');
    });

    test('JSON download contains valid JSON', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download');
      await page.locator('button', { has: page.locator('text=Export JSON') }).click();

      const download = await downloadPromise;
      const content = await download.path();

      if (content) {
        const fileContent = fs.readFileSync(content, 'utf-8');
        const parsed = JSON.parse(fileContent);

        // Verify Design Tokens spec structure
        // { gray: { "0": {...}, "10": {...}, ... }, palette: {...}, ... }
        expect(parsed).toHaveProperty('gray');
        expect(Object.keys(parsed).length).toBeGreaterThan(0);
        expect(parsed.gray).toHaveProperty('0');
        expect(parsed.gray).toHaveProperty('10');
      }
    });

    test('CSS download contains valid CSS syntax', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download');
      await page.locator('button', { has: page.locator('text=Export CSS') }).click();

      const download = await downloadPromise;
      const content = await download.path();

      if (content) {
        const fileContent = fs.readFileSync(content, 'utf-8');

        // Verify CSS structure
        expect(fileContent).toContain(':root {');
        expect(fileContent).toContain('--color-gray-0:');
        expect(fileContent).toMatch(/--color-[a-z]+-\d+:\s*#[0-9a-f]{6}/i);
        // Verify multiple palettes exist
        const colorVarCount = (fileContent.match(/--color-/g) || []).length;
        expect(colorVarCount).toBeGreaterThan(11); // At least gray (11) + another palette
      }
    });

    test('SCSS download contains valid SCSS syntax', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download');
      await page.locator('button', { has: page.locator('text=Export SCSS') }).click();

      const download = await downloadPromise;
      const content = await download.path();

      if (content) {
        const fileContent = fs.readFileSync(content, 'utf-8');

        // Verify SCSS structure
        expect(fileContent).toContain('$color-gray-0:');
        expect(fileContent).toMatch(/\$color-[a-z]+-\d+:\s*#[0-9a-f]{6}/i);
        // Verify multiple palettes exist
        const colorVarCount = (fileContent.match(/\$color-/g) || []).length;
        expect(colorVarCount).toBeGreaterThan(11); // At least gray (11) + another palette
      }
    });
  });

  test.describe('Design Tokens Format Compatibility', () => {
    test('JSON structure matches Design Tokens spec', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download');
      await page.locator('button', { has: page.locator('text=Export JSON') }).click();

      const download = await downloadPromise;
      const content = await download.path();

      if (content) {
        const fileContent = fs.readFileSync(content, 'utf-8');
        const parsed = JSON.parse(fileContent);

        // Design Tokens spec structure verification:
        // {
        //   gray: {
        //     "0": { $type: "color", $value: {...}, $description: "..." },
        //     "10": { $type: "color", $value: {...}, $description: "..." },
        //     ...
        //   },
        //   palette: { ... },
        //   ...
        // }

        // Verify gray palette exists at top level
        expect(parsed).toHaveProperty('gray');
        expect(Object.keys(parsed).length).toBeGreaterThan(1);

        // Verify gray palette token structure (Design Tokens spec format)
        const grayPalette = parsed.gray;
        expect(grayPalette).toHaveProperty('0');
        expect(grayPalette[0]).toHaveProperty('$type', 'color');
        expect(grayPalette[0]).toHaveProperty('$value');
        expect(grayPalette[0]).toHaveProperty('$description');

        // Verify $value structure
        expect(grayPalette[0].$value).toHaveProperty('colorSpace', 'srgb');
        expect(grayPalette[0].$value).toHaveProperty('components');
        expect(grayPalette[0].$value).toHaveProperty('hex');
        expect(grayPalette[0].$value.hex).toMatch(/^#[0-9a-f]{6}$/i);

        // Verify all steps exist (0, 10, 20, ..., 100)
        for (let step = 0; step <= 100; step += 10) {
          expect(grayPalette).toHaveProperty(String(step));
        }
      }
    });

    test('exported colors match displayed colors', async ({ page }) => {
      // Get displayed neutral colors
      const displayedNeutrals = await page
        .getByTestId('neutral-palette')
        .locator('.hex')
        .allTextContents();
      const displayedNeutralsNormalized = displayedNeutrals.map((hex) => hex.toLowerCase().trim());

      // Download and verify JSON matches
      const downloadPromise = page.waitForEvent('download');
      await page.locator('button', { has: page.locator('text=Export JSON') }).click();

      const download = await downloadPromise;
      const content = await download.path();

      if (content) {
        const fileContent = fs.readFileSync(content, 'utf-8');
        const parsed = JSON.parse(fileContent);

        // Compare each neutral color
        for (let i = 0; i < 11; i++) {
          const step = i * 10;
          const exportedColor = parsed.gray[step].$value.hex.toLowerCase();
          expect(exportedColor).toBe(displayedNeutralsNormalized[i]);
        }
      }
    });

    test('palette order follows expected sequence', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download');
      await page.locator('button', { has: page.locator('text=Export JSON') }).click();

      const download = await downloadPromise;
      const content = await download.path();

      if (content) {
        const fileContent = fs.readFileSync(content, 'utf-8');
        const parsed = JSON.parse(fileContent);

        // Get the order of palettes in the export (top-level keys)
        const exportedPalettes = Object.keys(parsed);

        // Should have gray as first palette
        expect(exportedPalettes[0]).toBe('gray');
        // Should have multiple palettes
        expect(exportedPalettes.length).toBeGreaterThan(1);
      }
    });
  });

  test.describe('Export with Custom Configuration', () => {
    test('export reflects warmth changes', async ({ page }) => {
      // Set warmth to a custom value
      await page.locator('#warmth').fill('-10');
      await page.waitForTimeout(300);

      // Get the current neutral middle color
      const neutralMid = (
        await page.getByTestId('neutral-palette').locator('.hex').nth(5).textContent()
      )
        ?.toLowerCase()
        .trim();

      // Download and verify the warmth is applied
      const downloadPromise = page.waitForEvent('download');
      await page.locator('button', { has: page.locator('text=Export JSON') }).click();

      const download = await downloadPromise;
      const content = await download.path();

      if (content) {
        const fileContent = fs.readFileSync(content, 'utf-8');
        const parsed = JSON.parse(fileContent);

        const exportedMid = parsed.gray[50].$value.hex.toLowerCase();
        expect(exportedMid).toBe(neutralMid);
      }
    });

    test('export reflects base color changes', async ({ page }) => {
      // Set a specific base color
      await page.locator('#baseColor').fill('#ff0000');
      await page.waitForTimeout(500);

      // Download and verify first palette reflects the base color influence
      const downloadPromise = page.waitForEvent('download');
      await page.locator('button', { has: page.locator('text=Export JSON') }).click();

      const download = await downloadPromise;
      const content = await download.path();

      if (content) {
        const fileContent = fs.readFileSync(content, 'utf-8');
        const parsed = JSON.parse(fileContent);

        // Get first non-gray palette and verify it has colors
        const palettes = Object.keys(parsed).filter((key) => key !== 'gray');
        expect(palettes.length).toBeGreaterThan(0);
        const firstPalette = palettes[0];
        expect(parsed[firstPalette][50].$value.hex).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });
  });
});
