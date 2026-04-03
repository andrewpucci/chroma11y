/**
 * Persistence Tests
 * Tests for localStorage and URL state persistence
 */

import { test, expect } from '@playwright/test';
import { ensureOutputAdvancedExpanded, waitForAppReady } from './test-utils';

test.describe('Local Storage Persistence', () => {
  test('restores representative saved state from localStorage on a fresh load', async ({
    browser
  }) => {
    const storedState = JSON.stringify({
      baseColor: '#800080',
      customNeutralName: 'Canvas',
      customPaletteNames: ['Ocean'],
      showSwatchGamutWarnings: false
    });

    const context = await browser.newContext({
      storageState: {
        cookies: [],
        origins: [
          {
            origin: 'http://localhost:4173',
            localStorage: [{ name: 'chroma11y-state', value: storedState }]
          }
        ]
      }
    });
    const page = await context.newPage();
    await page.goto('/');
    await waitForAppReady(page);

    await expect(page.locator('#baseColorHex')).toHaveValue('#800080');
    await expect(page.getByRole('button', { name: 'Edit name for neutral palette' })).toContainText(
      'Canvas'
    );
    await expect(
      page.getByRole('button', { name: 'Edit name for palette 1', exact: true })
    ).toContainText('Ocean');
    await ensureOutputAdvancedExpanded(page);
    await expect(page.locator('#show-swatch-gamut-warnings')).not.toBeChecked();

    await context.close();
  });
});

test.describe('URL State Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForAppReady(page);
  });

  test('restores a representative nontrivial configuration from the URL', async ({ page }) => {
    await page.goto('/?c=00ff00&w=5&t=dark&si=calfb&gw=0');
    await waitForAppReady(page);

    await expect(page.locator('#baseColorHex')).toHaveValue('#00ff00');
    await expect(page.locator('#warmth')).toHaveValue('5');
    await expect(page.locator('#theme-preference')).toHaveValue('dark');
    await expect(page.locator('#indicator-wcag-aa')).toBeChecked();
    await expect(page.locator('#indicator-wcag-aaa')).not.toBeChecked();
    await ensureOutputAdvancedExpanded(page);
    await expect(page.locator('#show-swatch-gamut-warnings')).not.toBeChecked();
  });

  test('URL state takes precedence over localStorage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem(
        'chroma11y-state',
        JSON.stringify({ baseColor: '#0000ff', themePreference: 'light' })
      );
    });

    await page.goto('/?c=ff0000&t=dark');
    await waitForAppReady(page);

    await expect(page.locator('#baseColorHex')).toHaveValue('#ff0000');
    await expect(page.locator('#theme-preference')).toHaveValue('dark');
  });

  test('hex display locks gamut to sRGB', async ({ page }) => {
    await page.locator('#display-color-space').selectOption('oklch');
    await ensureOutputAdvancedExpanded(page);
    await page.locator('#gamut-space').selectOption('p3');
    await expect(page.locator('#gamut-space')).toHaveValue('p3');

    await page.locator('#display-color-space').selectOption('hex');

    await expect(page.locator('#gamut-space')).toHaveValue('srgb');
    await expect(page.locator('#gamut-space')).toBeDisabled();
    await page.waitForFunction(
      () => {
        const params = new URL(window.location.href).searchParams;
        return !params.has('ds') && !params.has('gs');
      },
      { timeout: 5000 }
    );

    expect(page.url()).not.toContain('gs=');
  });
});
