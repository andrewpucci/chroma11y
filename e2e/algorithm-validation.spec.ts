/**
 * Algorithm Validation Tests
 * Tests for deterministic color generation, nudger stability, and bezier curve behavior
 */

import { test, expect } from '@playwright/test';
import { waitForAppReady } from './test-utils';

test.describe('Algorithm Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await page.waitForTimeout(500);
  });

  test.describe('Lightness Nudger Stability', () => {
    test('nudger changes persist and do not cause runaway values', async ({ page }) => {
      const nudgerInputs = page.locator('.nudger-input');
      const middleNudger = nudgerInputs.nth(5);
      await expect(middleNudger).toBeVisible();

      const neutralSection = page.locator('.color-display').first();
      const middleNeutralHex = neutralSection.locator('.hex').nth(5);
      const initialHex = await middleNeutralHex.textContent();

      // Change nudger value
      await middleNudger.fill('-0.1');
      await page.waitForTimeout(500);

      // Verify nudger value persists
      await expect(middleNudger).toHaveValue('-0.1');

      // Color should have changed
      const newHex = await middleNeutralHex.textContent();
      expect(newHex).not.toBe(initialHex);

      // Wait and check stability (no runaway)
      await page.waitForTimeout(500);
      const stableHex = await middleNeutralHex.textContent();
      expect(stableHex).toBe(newHex);
      await expect(middleNudger).toHaveValue('-0.1');
    });

    test('nudger only affects its own column', async ({ page }) => {
      const neutralSection = page.locator('.color-display').first();
      const hexElements = neutralSection.locator('.hex');

      const color0Before = await hexElements.nth(0).textContent();
      const color1Before = await hexElements.nth(1).textContent();
      const color2Before = await hexElements.nth(2).textContent();

      // Change nudger for step 1 only
      const nudgerInputs = page.locator('.nudger-input');
      await nudgerInputs.nth(1).fill('0.1');
      await page.waitForTimeout(500);

      const color0After = await hexElements.nth(0).textContent();
      const color1After = await hexElements.nth(1).textContent();
      const color2After = await hexElements.nth(2).textContent();

      // Only step 1 should change
      expect(color0After).toBe(color0Before);
      expect(color1After).not.toBe(color1Before);
      expect(color2After).toBe(color2Before);
    });

    test('resetting nudger to zero returns to original color', async ({ page }) => {
      const neutralSection = page.locator('.color-display').first();
      const middleHex = neutralSection.locator('.hex').nth(5);
      const nudgerInputs = page.locator('.nudger-input');
      const middleNudger = nudgerInputs.nth(5);

      const originalHex = await middleHex.textContent();

      // Change then reset nudger
      await middleNudger.fill('-0.15');
      await page.waitForTimeout(500);
      expect(await middleHex.textContent()).not.toBe(originalHex);

      await middleNudger.fill('0');
      await page.waitForTimeout(500);
      expect(await middleHex.textContent()).toBe(originalHex);
    });
  });

  test.describe('Hue Nudger Stability', () => {
    test('hue nudger changes palette colors but not neutrals', async ({ page }) => {
      const neutralSection = page.locator('.color-display').first();
      const neutralHexes = neutralSection.locator('.hex');
      const neutralsBefore: string[] = [];
      for (let i = 0; i < 3; i++) {
        neutralsBefore.push((await neutralHexes.nth(i).textContent()) || '');
      }

      const paletteSection = page.locator('.color-display').nth(1);
      const paletteHexes = paletteSection.locator('.hex');
      const paletteBefore = await paletteHexes.nth(5).textContent();

      // Change hue nudger
      const hueNudger = page.locator('.hue-nudger-input').first();
      await expect(hueNudger).toBeVisible();
      await hueNudger.fill('60');
      await page.waitForTimeout(500);

      // Neutrals should NOT change
      for (let i = 0; i < 3; i++) {
        expect(await neutralHexes.nth(i).textContent()).toBe(neutralsBefore[i]);
      }

      // Palette SHOULD change
      expect(await paletteHexes.nth(5).textContent()).not.toBe(paletteBefore);
    });

    test('hue nudger value persists', async ({ page }) => {
      const hueNudger = page.locator('.hue-nudger-input').first();
      await expect(hueNudger).toBeVisible();

      await hueNudger.fill('45');
      await page.waitForTimeout(500);
      await expect(hueNudger).toHaveValue('45');

      // Check stability
      await page.waitForTimeout(500);
      await expect(hueNudger).toHaveValue('45');
    });
  });

  test.describe('Bezier Curve Stability', () => {
    test('bezier changes do not cause runaway values', async ({ page }) => {
      const x1Input = page.locator('#x1');
      const y1Input = page.locator('#y1');
      const initialY1 = await y1Input.inputValue();

      await x1Input.fill('0.25');
      await page.waitForTimeout(500);

      await expect(x1Input).toHaveValue('0.25');
      await expect(y1Input).toHaveValue(initialY1);

      // Verify stability
      await page.waitForTimeout(500);
      await expect(x1Input).toHaveValue('0.25');
    });
  });

  test.describe('Color Generation Consistency', () => {
    test('generates consistent colors on reload', async ({ page }) => {
      const neutralSection = page.locator('.color-display').first();
      const hexElements = neutralSection.locator('.hex');

      const colorsBefore: string[] = [];
      for (let i = 0; i < 5; i++) {
        colorsBefore.push((await hexElements.nth(i).textContent()) || '');
      }

      await page.reload();
      await waitForAppReady(page);
      await page.waitForTimeout(500);

      for (let i = 0; i < 5; i++) {
        expect(await hexElements.nth(i).textContent()).toBe(colorsBefore[i]);
      }
    });

    test('light mode generates white to black gradient for neutrals', async ({ page }) => {
      const neutralSection = page.locator('.color-display').first();
      const firstHex = await neutralSection.locator('.hex').first().textContent();
      const lastHex = await neutralSection.locator('.hex').last().textContent();

      expect(firstHex?.toLowerCase()).toBe('#ffffff');
      expect(lastHex?.toLowerCase()).toBe('#000000');
    });

    test('auto contrast mode uses neutral colors', async ({ page }) => {
      const contrastModeSelect = page.locator('#contrast-mode');
      await contrastModeSelect.selectOption('auto');
      await page.waitForTimeout(300);

      const lowStep = await page.locator('#low-step').inputValue();
      const highStep = await page.locator('#high-step').inputValue();

      const neutralSection = page.locator('.color-display').first();
      const neutralHexes = neutralSection.locator('.hex');
      const expectedLowColor = await neutralHexes.nth(parseInt(lowStep)).textContent();
      const expectedHighColor = await neutralHexes.nth(parseInt(highStep)).textContent();

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

      expect(lowLabel?.toLowerCase()).toContain(expectedLowColor?.toLowerCase());
      expect(highLabel?.toLowerCase()).toContain(expectedHighColor?.toLowerCase());
    });
  });

  test.describe('Deterministic Snapshot Tests', () => {
    test('generates consistent colors in light mode with config applied', async ({ page }) => {
      // Set specific configuration
      await page.locator('#baseColor').fill('#1862e6');
      await page.locator('#warmth').fill('-7');
      await page.locator('#x1').fill('0.16');
      await page.locator('#y1').fill('0');
      await page.locator('#x2').fill('0.28');
      await page.locator('#y2').fill('0.38');
      await page.locator('#chroma').fill('1.14');
      await page.waitForTimeout(300);

      // Set lightness nudger values
      const nudgerInputs = page.locator('.nudger-input');
      await nudgerInputs.nth(5).fill('-0.005');
      await nudgerInputs.nth(6).fill('-0.0009');
      await page.waitForTimeout(300);

      // Set hue nudger
      const hueNudgers = page.locator('.hue-nudger-input');
      await hueNudgers.nth(4).fill('-5');
      await page.waitForTimeout(300);

      // Capture colors
      const neutralSection = page.locator('.color-display').first();
      const neutralHexes = neutralSection.locator('.hex');
      const neutralColors: string[] = [];
      const neutralCount = await neutralHexes.count();
      for (let i = 0; i < neutralCount; i++) {
        neutralColors.push((await neutralHexes.nth(i).textContent())?.toLowerCase() || '');
      }

      // Reload and reapply same config
      await page.reload();
      await waitForAppReady(page);
      await page.waitForTimeout(500);

      await page.locator('#baseColor').fill('#1862e6');
      await page.locator('#warmth').fill('-7');
      await page.locator('#x1').fill('0.16');
      await page.locator('#y1').fill('0');
      await page.locator('#x2').fill('0.28');
      await page.locator('#y2').fill('0.38');
      await page.locator('#chroma').fill('1.14');
      await page.waitForTimeout(300);

      const nudgerInputs2 = page.locator('.nudger-input');
      await nudgerInputs2.nth(5).fill('-0.005');
      await nudgerInputs2.nth(6).fill('-0.0009');
      await page.waitForTimeout(300);

      const hueNudgers2 = page.locator('.hue-nudger-input');
      await hueNudgers2.nth(4).fill('-5');
      await page.waitForTimeout(300);

      // Verify identical colors
      const neutralSection2 = page.locator('.color-display').first();
      const neutralHexes2 = neutralSection2.locator('.hex');
      for (let i = 0; i < neutralCount; i++) {
        expect((await neutralHexes2.nth(i).textContent())?.toLowerCase()).toBe(neutralColors[i]);
      }

      // Verify expected structure
      expect(neutralColors.length).toBe(11);
      expect(neutralColors[0]).toBe('#ffffff');
      expect(neutralColors[10]).toBe('#000000');
    });
  });
});
