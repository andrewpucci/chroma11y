/**
 * Netlify smoke tests run against deploy previews only.
 * These checks intentionally avoid visual snapshot assertions.
 */

import { test, expect } from '@playwright/test';
import { waitForAppReady } from './test-utils';

test.describe('Netlify Smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('loads application and key controls', async ({ page }) => {
    await expect(page.locator('#main-heading')).toContainText('Chroma11y');
    await expect(page.locator('#baseColor')).toBeVisible();
    await expect(page.getByTestId('generated-palettes')).toBeVisible();
  });

  test('updates palette when base color changes', async ({ page }) => {
    const paletteHexes = page
      .getByTestId('generated-palettes')
      .locator('.swatches')
      .first()
      .locator('.hex');
    const initialHex = await paletteHexes.nth(5).textContent();

    await page.locator('#baseColor').fill('#00ff00');

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

    const updatedHex = await paletteHexes.nth(5).textContent();
    expect(updatedHex).not.toBe(initialHex);
  });

  test('can export JSON file', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export JSON design tokens' }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.json$/);
  });
});
