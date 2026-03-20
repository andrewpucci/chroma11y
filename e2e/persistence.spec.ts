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

  test('saves state to localStorage and restores on fresh load', async ({ page }) => {
    // Change base color to purple
    await page.locator('#baseColorHex').fill('#800080');

    // Wait for localStorage to be updated (debounced)
    await page.waitForFunction(() => localStorage.getItem('chroma11y-state')?.includes('800080'), {
      timeout: 5000
    });

    // Verify localStorage was updated
    const storedState = await page.evaluate(() => {
      return localStorage.getItem('chroma11y-state');
    });
    expect(storedState).toBeTruthy();
    expect(storedState).toContain('800080');

    // Navigate to clean URL (don't clear localStorage)
    await page.goto('/');
    await waitForAppReady(page);

    // Base color should be restored from localStorage
    const baseColorValue = await page.locator('#baseColorHex').inputValue();
    expect(baseColorValue.toLowerCase()).toBe('#800080');
  });

  test('remembers theme preference across sessions', async ({ page }) => {
    // Toggle to dark mode
    await page.locator('#theme-preference').selectOption('dark');

    // Wait for theme preference to be saved to localStorage
    await page.waitForFunction(
      () => localStorage.getItem('chroma11y-state')?.includes('"themePreference":"dark"'),
      { timeout: 5000 }
    );

    // Navigate to fresh URL (don't clear localStorage)
    await page.goto('/');
    await waitForAppReady(page);

    // Should still be in dark mode
    await expect(page.locator('#theme-preference')).toHaveValue('dark');
  });

  test('remembers swatch contrast indicator selections across sessions', async ({ page }) => {
    await page.locator('#indicator-wcag-aa').uncheck();
    await page.locator('#indicator-wcag-aaa').uncheck();

    await page.waitForFunction(
      () => {
        const raw = localStorage.getItem('chroma11y-state');
        if (!raw) return false;

        try {
          const parsed = JSON.parse(raw) as {
            swatchContrastIndicators?: { wcagAA?: boolean; wcagAAA?: boolean };
          };
          return (
            parsed.swatchContrastIndicators?.wcagAA === false &&
            parsed.swatchContrastIndicators?.wcagAAA === false
          );
        } catch {
          return false;
        }
      },
      { timeout: 5000 }
    );

    await page.goto('/');
    await waitForAppReady(page);

    await expect(page.locator('#indicator-wcag-aa')).not.toBeChecked();
    await expect(page.locator('#indicator-wcag-aaa')).not.toBeChecked();
  });

  test('remembers swatch gamut warning visibility across sessions', async ({ page }) => {
    await ensureOutputAdvancedExpanded(page);
    await page.locator('#show-swatch-gamut-warnings').uncheck();

    await page.waitForFunction(
      () => {
        const raw = localStorage.getItem('chroma11y-state');
        if (!raw) return false;

        try {
          const parsed = JSON.parse(raw) as { showSwatchGamutWarnings?: boolean };
          return parsed.showSwatchGamutWarnings === false;
        } catch {
          return false;
        }
      },
      { timeout: 5000 }
    );

    await page.goto('/');
    await waitForAppReady(page);

    await expect(page.locator('#show-swatch-gamut-warnings')).not.toBeChecked();
  });

  test('remembers custom neutral and generated palette names across sessions', async ({ page }) => {
    await renameNeutralPalette(page, 'Canvas');
    await renameGeneratedPalette(page, 0, 'Ocean');

    await page.waitForFunction(
      () => {
        const raw = localStorage.getItem('chroma11y-state');
        if (!raw) return false;

        try {
          const parsed = JSON.parse(raw) as {
            customNeutralName?: string;
            customPaletteNames?: string[];
          };
          return (
            parsed.customNeutralName === 'Canvas' &&
            Array.isArray(parsed.customPaletteNames) &&
            parsed.customPaletteNames[0] === 'Ocean'
          );
        } catch {
          return false;
        }
      },
      { timeout: 5000 }
    );

    await page.goto('/');
    await waitForAppReady(page);

    await expect(page.getByRole('button', { name: 'Edit name for neutral palette' })).toContainText(
      'Canvas'
    );
    await expect(
      page.getByRole('button', { name: 'Edit name for palette 1', exact: true })
    ).toContainText('Ocean');
  });
});

test.describe('URL State Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForAppReady(page);
  });

  test('persists state in URL and restores on navigation', async ({ page }) => {
    // Change base color to green using the hex input
    await page.locator('#baseColorHex').fill('#00ff00');

    // Wait for URL to update (debounced)
    await page.waitForFunction(() => window.location.href.includes('c=00ff00'), { timeout: 5000 });

    // URL should contain the color parameter
    const url = page.url();
    expect(url).toContain('c=00ff00');

    // Navigate to the URL directly
    await page.goto(url);
    await waitForAppReady(page);

    // Base color input should have the green value
    const baseColorValue = await page.locator('#baseColorHex').inputValue();
    expect(baseColorValue.toLowerCase()).toBe('#00ff00');
  });

  test('shares configuration via URL', async ({ page }) => {
    // Navigate with URL parameters
    await page.goto('/?c=ff0000&w=5&t=dark');
    await waitForAppReady(page);

    // Verify base color is red
    const baseColorValue = await page.locator('#baseColorHex').inputValue();
    expect(baseColorValue.toLowerCase()).toBe('#ff0000');

    // Verify warmth is 5
    await expect(page.locator('#warmth')).toHaveValue('5');

    // Verify theme preference is dark
    await expect(page.locator('#theme-preference')).toHaveValue('dark');
  });

  test('URL state takes precedence over localStorage', async ({ page }) => {
    // Set localStorage to blue
    await page.evaluate(() => {
      localStorage.setItem('chroma11y-state', JSON.stringify({ baseColor: '#0000ff' }));
    });

    // Navigate with URL parameter for red
    await page.goto('/?c=ff0000');
    await waitForAppReady(page);

    // URL should win - base color should be red
    const baseColorValue = await page.locator('#baseColorHex').inputValue();
    expect(baseColorValue.toLowerCase()).toBe('#ff0000');
  });

  test('persists swatch contrast indicator selections in URL', async ({ page }) => {
    await page.locator('#indicator-wcag-aaa').uncheck();

    await page.waitForFunction(() => window.location.href.includes('si='), { timeout: 5000 });
    const url = page.url();
    expect(url).toContain('si=calfb');

    await page.goto(url);
    await waitForAppReady(page);

    await expect(page.locator('#indicator-wcag-aa')).toBeChecked();
    await expect(page.locator('#indicator-wcag-aaa')).not.toBeChecked();
  });

  test('persists swatch gamut warning visibility in URL', async ({ page }) => {
    await ensureOutputAdvancedExpanded(page);
    await page.locator('#show-swatch-gamut-warnings').uncheck();

    await page.waitForFunction(() => window.location.href.includes('gw=0'), { timeout: 5000 });
    const url = page.url();
    expect(url).toContain('gw=0');

    await page.goto(url);
    await waitForAppReady(page);

    await expect(page.locator('#show-swatch-gamut-warnings')).not.toBeChecked();
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
