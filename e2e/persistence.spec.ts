/**
 * Persistence Tests
 * Tests for localStorage and URL state persistence
 */

import { test, expect } from '@playwright/test';
import { ensureOutputAdvancedExpanded, waitForAppReady } from './test-utils';

async function renameNeutralPalette(
  page: import('@playwright/test').Page,
  name: string
): Promise<void> {
  await page.getByRole('button', { name: 'Edit name for neutral palette' }).click();
  const input = page.getByRole('textbox', { name: 'Neutral palette name' });
  await input.fill(name);
  await input.press('Enter');
}

async function renameGeneratedPalette(
  page: import('@playwright/test').Page,
  index: number,
  name: string
): Promise<void> {
  await page
    .getByRole('button', { name: `Edit name for palette ${index + 1}`, exact: true })
    .click();
  const input = page.getByRole('textbox', { name: `Palette ${index + 1} name`, exact: true });
  await input.fill(name);
  await input.press('Enter');
}

test.describe('Local Storage Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForAppReady(page);
  });

  test('restores representative saved state from localStorage on a fresh load', async ({
    page
  }) => {
    await page.locator('#baseColorHex').fill('#800080');
    await page.locator('#theme-preference').selectOption('dark');
    await renameNeutralPalette(page, 'Canvas');
    await renameGeneratedPalette(page, 0, 'Ocean');
    await ensureOutputAdvancedExpanded(page);
    await page.locator('#show-swatch-gamut-warnings').uncheck();

    await page.waitForFunction(
      () => {
        const raw = localStorage.getItem('chroma11y-state');
        if (!raw) return false;

        try {
          const parsed = JSON.parse(raw) as {
            baseColor?: string;
            themePreference?: string;
            customNeutralName?: string;
            customPaletteNames?: string[];
            showSwatchGamutWarnings?: boolean;
          };
          return (
            parsed.baseColor === '#800080' &&
            parsed.themePreference === 'dark' &&
            parsed.customNeutralName === 'Canvas' &&
            Array.isArray(parsed.customPaletteNames) &&
            parsed.customPaletteNames[0] === 'Ocean' &&
            parsed.showSwatchGamutWarnings === false
          );
        } catch {
          return false;
        }
      },
      { timeout: 5000 }
    );

    await page.goto('/');
    await waitForAppReady(page);

    await expect(page.locator('#baseColorHex')).toHaveValue('#800080');
    await expect(page.locator('#theme-preference')).toHaveValue('dark');
    await expect(page.getByRole('button', { name: 'Edit name for neutral palette' })).toContainText(
      'Canvas'
    );
    await expect(
      page.getByRole('button', { name: 'Edit name for palette 1', exact: true })
    ).toContainText('Ocean');
    await ensureOutputAdvancedExpanded(page);
    await expect(page.locator('#show-swatch-gamut-warnings')).not.toBeChecked();
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
