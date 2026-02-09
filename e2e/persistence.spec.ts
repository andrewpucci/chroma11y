/**
 * Persistence Tests
 * Tests for localStorage and URL state persistence
 */

import { test, expect } from '@playwright/test';
import { waitForAppReady } from './test-utils';

test.describe('Local Storage Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForAppReady(page);
    await page.waitForTimeout(500);
  });

  test('saves state to localStorage and restores on fresh load', async ({ page }) => {
    // Change base color to purple
    await page.locator('#baseColor').fill('#800080');
    await page.waitForTimeout(1000);

    // Verify localStorage was updated
    const storedState = await page.evaluate(() => {
      return localStorage.getItem('chroma11y-state');
    });
    expect(storedState).toBeTruthy();
    expect(storedState).toContain('800080');

    // Navigate to clean URL
    await page.goto('/');
    await waitForAppReady(page);
    await page.waitForTimeout(500);

    // Base color should be restored from localStorage
    const baseColorValue = await page.locator('#baseColor').inputValue();
    expect(baseColorValue.toLowerCase()).toBe('#800080');
  });

  test('remembers theme preference across sessions', async ({ page }) => {
    // Toggle to dark mode
    await page.getByRole('button', { name: /Switch to (dark|light) mode/ }).click();
    await page.waitForTimeout(1000);

    // Navigate to fresh URL
    await page.goto('/');
    await waitForAppReady(page);
    await page.waitForTimeout(500);

    // Should still be in dark mode
    await expect(page.getByRole('button', { name: /Switch to (dark|light) mode/ })).toContainText(
      'Light Mode'
    );
  });
});

test.describe('URL State Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForAppReady(page);
    await page.waitForTimeout(500);
  });

  test('persists state in URL and restores on navigation', async ({ page }) => {
    // Change base color to green
    await page.locator('#baseColor').fill('#00ff00');

    // Wait for URL to update (debounced)
    await page.waitForFunction(() => window.location.href.includes('c=00ff00'), { timeout: 5000 });

    // URL should contain the color parameter
    const url = page.url();
    expect(url).toContain('c=00ff00');

    // Navigate to the URL directly
    await page.goto(url);
    await waitForAppReady(page);
    await page.waitForTimeout(500);

    // Base color input should have the green value
    const baseColorValue = await page.locator('#baseColor').inputValue();
    expect(baseColorValue.toLowerCase()).toBe('#00ff00');
  });

  test('shares configuration via URL', async ({ page }) => {
    // Navigate with URL parameters
    await page.goto('/?c=ff0000&w=5&t=dark');
    await waitForAppReady(page);
    await page.waitForTimeout(500);

    // Verify base color is red
    const baseColorValue = await page.locator('#baseColor').inputValue();
    expect(baseColorValue.toLowerCase()).toBe('#ff0000');

    // Verify warmth is 5
    await expect(page.locator('#warmth')).toHaveValue('5');

    // Verify dark mode is active
    await expect(page.getByRole('button', { name: /Switch to (dark|light) mode/ })).toContainText(
      'Light Mode'
    );
  });

  test('URL state takes precedence over localStorage', async ({ page }) => {
    // Set localStorage to blue
    await page.evaluate(() => {
      localStorage.setItem('chroma11y-state', JSON.stringify({ baseColor: '#0000ff' }));
    });

    // Navigate with URL parameter for red
    await page.goto('/?c=ff0000');
    await waitForAppReady(page);
    await page.waitForTimeout(500);

    // URL should win - base color should be red
    const baseColorValue = await page.locator('#baseColor').inputValue();
    expect(baseColorValue.toLowerCase()).toBe('#ff0000');
  });
});
