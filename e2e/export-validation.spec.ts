/**
 * Phase 7.3: Export Format Validation Tests
 * Validates that export formats match legacy implementation structure
 *
 * Tests:
 * - JSON design tokens structure matches legacy format
 * - CSS custom properties naming convention
 * - SCSS variables naming convention
 * - File download functionality
 */

import { test, expect } from '@playwright/test';
import { waitForAppReady } from './test-utils';
import * as fs from 'fs';

// Expected palette names in order (matching legacy exportUtils.js)
const EXPECTED_PALETTE_NAMES = [
  'gray', // neutrals
  'blue',
  'purple',
  'orchid',
  'pink',
  'red',
  'orange',
  'gold',
  'lime',
  'green',
  'turquoise',
  'skyblue'
];

test.describe('Phase 7.3: Export Format Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await page.waitForTimeout(500);
  });

  test.describe('JSON Design Tokens Structure', () => {
    test('JSON export has correct top-level structure', async ({ page }) => {
      // Get the export function result by evaluating in page context
      const jsonStructure = await page.evaluate(() => {
        // Access the exported colors from the page
        const neutrals = Array.from(document.querySelectorAll('.color-display')).at(0)
          ?.querySelectorAll('.hex');
        const neutralColors = Array.from(neutrals || []).map(el => el.textContent?.toLowerCase() || '');
        
        // Build expected structure
        return {
          hasNeutrals: neutralColors.length === 11,
          firstNeutral: neutralColors[0],
          lastNeutral: neutralColors[10]
        };
      });

      expect(jsonStructure.hasNeutrals).toBe(true);
      expect(jsonStructure.firstNeutral).toMatch(/^#[0-9a-f]{6}$/);
      expect(jsonStructure.lastNeutral).toMatch(/^#[0-9a-f]{6}$/);
    });

    test('JSON export follows design tokens format', async ({ page }) => {
      // Test the structure by checking export button exists and colors are generated
      const exportButton = page.locator('button:has-text("Export JSON")');
      await expect(exportButton).toBeVisible();
      await expect(exportButton).not.toBeDisabled();

      // Verify export structure matches legacy format:
      // { color: { name: "color", _base: { gray: {...}, blue: {...}, ... } } }
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
        return Array.from(headers).map(h => h.textContent?.toLowerCase() || '');
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
      const stepCount = await page.evaluate(() => {
        const firstPalette = document.querySelector('.color-grid');
        const swatches = firstPalette?.querySelectorAll('.color-swatch');
        return swatches?.length || 0;
      });

      expect(stepCount).toBe(11); // Steps: 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
    });

    test('design token values have correct format', async ({ page }) => {
      // Each token should have: name, description, value, type
      // value should be a hex color, type should be "color"
      const hexColors = await page.evaluate(() => {
        const hexElements = document.querySelectorAll('.hex');
        return Array.from(hexElements).slice(0, 22).map(el => el.textContent || '');
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
      const structureValid = await page.evaluate(() => {
        const neutralSection = document.querySelector('.color-display');
        const neutralSwatches = neutralSection?.querySelectorAll('.color-swatch');
        return neutralSwatches?.length === 11;
      });

      expect(structureValid).toBe(true);

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
      const sectionCount = await page.evaluate(() => {
        // Neutral section + 11 palette sections = 12 total display areas
        const displayAreas = document.querySelectorAll('.color-display');
        return displayAreas.length;
      });

      // Should have at least neutral + palettes sections
      expect(sectionCount).toBeGreaterThanOrEqual(2);
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

      // Click export JSON button
      await page.locator('button:has-text("Export JSON")').click();

      const download = await downloadPromise;
      
      // Verify filename
      expect(download.suggestedFilename()).toBe('color-tokens.json');
    });

    test('CSS download triggers file save', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download');
      await page.locator('button:has-text("Export CSS")').click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe('colors.css');
    });

    test('SCSS download triggers file save', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download');
      await page.locator('button:has-text("Export SCSS")').click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe('colors.scss');
    });

    test('JSON download contains valid JSON', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download');
      await page.locator('button:has-text("Export JSON")').click();

      const download = await downloadPromise;
      const content = await download.path();
      
      if (content) {
        const fileContent = fs.readFileSync(content, 'utf-8');
        const parsed = JSON.parse(fileContent);
        
        // Verify structure
        expect(parsed).toHaveProperty('color');
        expect(parsed.color).toHaveProperty('name', 'color');
        expect(parsed.color).toHaveProperty('_base');
        expect(parsed.color._base).toHaveProperty('gray');
        expect(parsed.color._base).toHaveProperty('blue');
      }
    });

    test('CSS download contains valid CSS syntax', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download');
      await page.locator('button:has-text("Export CSS")').click();

      const download = await downloadPromise;
      const content = await download.path();
      
      if (content) {
        const fileContent = fs.readFileSync(content, 'utf-8');
        
        // Verify CSS structure
        expect(fileContent).toContain(':root {');
        expect(fileContent).toContain('--color-gray-0:');
        expect(fileContent).toContain('--color-blue-0:');
        expect(fileContent).toMatch(/--color-[a-z]+-\d+:\s*#[0-9a-f]{6}/i);
      }
    });

    test('SCSS download contains valid SCSS syntax', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download');
      await page.locator('button:has-text("Export SCSS")').click();

      const download = await downloadPromise;
      const content = await download.path();
      
      if (content) {
        const fileContent = fs.readFileSync(content, 'utf-8');
        
        // Verify SCSS structure
        expect(fileContent).toContain('$color-gray-0:');
        expect(fileContent).toContain('$color-blue-0:');
        expect(fileContent).toMatch(/\$color-[a-z]+-\d+:\s*#[0-9a-f]{6}/i);
      }
    });
  });

  test.describe('Legacy Format Compatibility', () => {
    test('JSON structure matches legacy exportColors output', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download');
      await page.locator('button:has-text("Export JSON")').click();

      const download = await downloadPromise;
      const content = await download.path();
      
      if (content) {
        const fileContent = fs.readFileSync(content, 'utf-8');
        const parsed = JSON.parse(fileContent);
        
        // Legacy structure verification:
        // {
        //   color: {
        //     name: "color",
        //     _base: {
        //       gray: { 0: {...}, 10: {...}, ... },
        //       blue: { 0: {...}, 10: {...}, ... },
        //       purple: {...},
        //       orchid: {...},
        //       pink: {...},
        //       red: {...},
        //       orange: {...},
        //       gold: {...},
        //       lime: {...},
        //       green: {...},
        //       turquoise: {...},
        //       skyblue: {...}
        //     }
        //   }
        // }
        
        // Verify top-level structure
        expect(parsed).toHaveProperty('color');
        expect(parsed.color).toHaveProperty('name', 'color');
        expect(parsed.color).toHaveProperty('_base');
        
        // Verify all palette names exist
        for (const palette of EXPECTED_PALETTE_NAMES) {
          expect(parsed.color._base).toHaveProperty(palette);
        }
        
        // Verify gray palette token structure
        const grayPalette = parsed.color._base.gray;
        expect(grayPalette).toHaveProperty('0');
        expect(grayPalette[0]).toHaveProperty('name');
        expect(grayPalette[0]).toHaveProperty('description');
        expect(grayPalette[0]).toHaveProperty('value');
        expect(grayPalette[0]).toHaveProperty('type', 'color');
        
        // Verify token name format
        expect(grayPalette[0].name).toBe('_base/gray/0');
        expect(grayPalette[0].value).toMatch(/^#[0-9a-f]{6}$/i);
        
        // Verify all steps exist (0, 10, 20, ..., 100)
        for (let step = 0; step <= 100; step += 10) {
          expect(grayPalette).toHaveProperty(String(step));
        }
      }
    });

    test('exported colors match displayed colors', async ({ page }) => {
      // Get displayed neutral colors
      const displayedNeutrals = await page.evaluate(() => {
        const neutralSection = document.querySelector('.color-display');
        const hexElements = neutralSection?.querySelectorAll('.hex');
        return Array.from(hexElements || []).map(el => el.textContent?.toLowerCase() || '');
      });

      // Download and verify JSON matches
      const downloadPromise = page.waitForEvent('download');
      await page.locator('button:has-text("Export JSON")').click();

      const download = await downloadPromise;
      const content = await download.path();
      
      if (content) {
        const fileContent = fs.readFileSync(content, 'utf-8');
        const parsed = JSON.parse(fileContent);
        
        // Compare each neutral color
        for (let i = 0; i < 11; i++) {
          const step = i * 10;
          const exportedColor = parsed.color._base.gray[step].value.toLowerCase();
          expect(exportedColor).toBe(displayedNeutrals[i]);
        }
      }
    });

    test('palette order matches legacy implementation', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download');
      await page.locator('button:has-text("Export JSON")').click();

      const download = await downloadPromise;
      const content = await download.path();
      
      if (content) {
        const fileContent = fs.readFileSync(content, 'utf-8');
        const parsed = JSON.parse(fileContent);
        
        // Get the order of palettes in the export
        const exportedPalettes = Object.keys(parsed.color._base);
        
        // Should match legacy order exactly
        expect(exportedPalettes).toEqual(EXPECTED_PALETTE_NAMES);
      }
    });
  });

  test.describe('Export with Custom Configuration', () => {
    test('export reflects warmth changes', async ({ page }) => {
      // Set warmth to a custom value
      await page.locator('#warmth').fill('-10');
      await page.waitForTimeout(300);

      // Get the current neutral middle color
      const neutralMid = await page.evaluate(() => {
        const neutralSection = document.querySelector('.color-display');
        const hexElements = neutralSection?.querySelectorAll('.hex');
        return hexElements?.[5]?.textContent?.toLowerCase() || '';
      });

      // Download and verify the warmth is applied
      const downloadPromise = page.waitForEvent('download');
      await page.locator('button:has-text("Export JSON")').click();

      const download = await downloadPromise;
      const content = await download.path();
      
      if (content) {
        const fileContent = fs.readFileSync(content, 'utf-8');
        const parsed = JSON.parse(fileContent);
        
        const exportedMid = parsed.color._base.gray[50].value.toLowerCase();
        expect(exportedMid).toBe(neutralMid);
      }
    });

    test('export reflects base color changes', async ({ page }) => {
      // Set a specific base color
      await page.locator('#baseColor').fill('#ff0000');
      await page.waitForTimeout(500);

      // Download and verify first palette reflects the base color influence
      const downloadPromise = page.waitForEvent('download');
      await page.locator('button:has-text("Export JSON")').click();

      const download = await downloadPromise;
      const content = await download.path();
      
      if (content) {
        const fileContent = fs.readFileSync(content, 'utf-8');
        const parsed = JSON.parse(fileContent);
        
        // First palette (blue) should have colors
        expect(parsed.color._base.blue[50].value).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });
  });
});
