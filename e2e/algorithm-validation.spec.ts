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

  test('changing one lightness nudger affects only its corresponding neutral swatch', async ({
    page
  }) => {
    const neutralSection = page.getByTestId('neutral-palette');
    const hexElements = neutralSection.locator('.hex');

    const color0Before = await hexElements.nth(0).textContent();
    const color1Before = await hexElements.nth(1).textContent();
    const color2Before = await hexElements.nth(2).textContent();

    const nudgerInputs = page.locator('.nudger-input');
    await nudgerInputs.nth(1).fill('0.1');
    await page.waitForTimeout(500);

    const color0After = await hexElements.nth(0).textContent();
    const color1After = await hexElements.nth(1).textContent();
    const color2After = await hexElements.nth(2).textContent();

    expect(color0After).toBe(color0Before);
    expect(color1After).not.toBe(color1Before);
    expect(color2After).toBe(color2Before);
  });

  test('hue nudger changes palette colors but not neutral colors', async ({ page }) => {
    const neutralSection = page.getByTestId('neutral-palette');
    const neutralHexes = neutralSection.locator('.hex');
    const neutralsBefore: string[] = [];
    for (let i = 0; i < 3; i++) {
      neutralsBefore.push((await neutralHexes.nth(i).textContent()) || '');
    }

    const paletteSection = page.getByTestId('generated-palettes');
    const paletteHexes = paletteSection.locator('.swatches').first().locator('.hex');
    const paletteBefore = await paletteHexes.nth(5).textContent();

    const hueNudger = page.locator('.hue-nudger-input').first();
    await expect(hueNudger).toBeVisible();
    await hueNudger.fill('60');
    await page.waitForTimeout(500);

    for (let i = 0; i < 3; i++) {
      expect(await neutralHexes.nth(i).textContent()).toBe(neutralsBefore[i]);
    }

    expect(await paletteHexes.nth(5).textContent()).not.toBe(paletteBefore);
  });
});
