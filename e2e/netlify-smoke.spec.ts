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
    const getPaletteSignature = async () => {
      const hexes = await page
        .getByTestId('generated-palettes')
        .locator('.swatches')
        .first()
        .locator('.hex')
        .allTextContents();
      return hexes.map((hex) => hex.trim()).join('|');
    };

    const initialSignature = await getPaletteSignature();

    await page.goto('/?c=00ff00');
    await waitForAppReady(page);

    await expect(page.locator('#baseColorHex')).toHaveValue('#00ff00');

    const updatedSignature = await getPaletteSignature();
    expect(updatedSignature).not.toBe(initialSignature);
  });

  test('can export JSON file', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export JSON design tokens' }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.json$/);
  });
});
