/**
 * Design Token E2E Tests
 * Verifies token-driven typography, spacing, motion, container queries, and text zoom.
 */

import { test, expect } from '@playwright/test';

import { waitForAppReady } from './test-utils';

test.describe('Design Tokens', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('updates motion tokens when reduced motion preference changes', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await waitForAppReady(page);

    const reducedDurations = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return {
        fast: style.getPropertyValue('--duration-fast').trim(),
        normal: style.getPropertyValue('--duration-normal').trim()
      };
    });

    expect(reducedDurations.fast).toBe('0s');
    expect(reducedDurations.normal).toBe('0s');

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.reload();
    await waitForAppReady(page);

    const normalDurations = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return {
        fast: style.getPropertyValue('--duration-fast').trim(),
        normal: style.getPropertyValue('--duration-normal').trim()
      };
    });

    expect(normalDurations.fast).toMatch(/^(0?\.1s|100ms)$/);
    expect(normalDurations.normal).toMatch(/^(0?\.2s|200ms)$/);
  });

  test('switches layout at the sidebar container breakpoint', async ({ page }) => {
    const layout = page.getByTestId('app-layout');

    await page.setViewportSize({ width: 1100, height: 768 });
    const wideColumns = await layout.evaluate((el) => getComputedStyle(el).gridTemplateColumns);

    await page.setViewportSize({ width: 900, height: 768 });
    const narrowColumns = await layout.evaluate((el) => getComputedStyle(el).gridTemplateColumns);

    expect(wideColumns.trim().split(' ')).toHaveLength(2);
    expect(narrowColumns.trim().split(' ')).toHaveLength(1);
  });

  test('supports larger browser font sizes without clipping content', async ({ page }) => {
    const baselineSize = await page
      .locator('.card-title')
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

    await page.addStyleTag({
      content: 'html { font-size: 32px !important; }'
    });

    const cardTitle = page.locator('.card-title').first();
    const increasedSize = await cardTitle.evaluate((el) =>
      parseFloat(getComputedStyle(el).fontSize)
    );
    const overflow = await cardTitle.evaluate((el) => getComputedStyle(el).overflow);

    await expect(page.getByTestId('app-layout')).toBeVisible();
    expect(increasedSize).toBeGreaterThan(baselineSize);
    expect(overflow).not.toBe('hidden');
  });
});
