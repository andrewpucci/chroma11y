/**
 * Design Token E2E Tests
 * Verifies token-driven typography, spacing, motion, container queries, and text zoom.
 */

import { test, expect } from '@playwright/test';

import { waitForAppReady } from './test-utils';

async function readCardMetrics(
  page: import('@playwright/test').Page
): Promise<{ paddingTop: number; radius: number }> {
  return await page.evaluate(() => {
    const card = document.querySelector('.card');
    const cardHeader = document.querySelector('.card-header');

    if (!(card instanceof HTMLElement) || !(cardHeader instanceof HTMLElement)) {
      throw new Error('Expected card and card header to be present');
    }

    const parseFirstNumeric = (...values: string[]): number => {
      for (const value of values) {
        const parsed = Number.parseFloat(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }

      return Number.NaN;
    };

    const cardStyle = getComputedStyle(card);
    const cardHeaderStyle = getComputedStyle(cardHeader);

    return {
      paddingTop: parseFirstNumeric(
        cardHeaderStyle.paddingTop,
        cardHeaderStyle.paddingBlockStart,
        cardHeaderStyle.padding
      ),
      radius: parseFirstNumeric(cardStyle.borderTopLeftRadius, cardStyle.borderRadius)
    };
  });
}

test.describe('Design Tokens', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('scales fluid typography across representative breakpoints', async ({ page }) => {
    const measurements: number[] = [];

    for (const viewport of [
      { width: 320, height: 568 },
      { width: 768, height: 1024 },
      { width: 1440, height: 900 }
    ]) {
      await page.setViewportSize(viewport);
      measurements.push(
        await page
          .locator('.card-title')
          .first()
          .evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
      );
    }

    expect(measurements[0]).toBeGreaterThanOrEqual(15);
    expect(measurements[0]).toBeLessThanOrEqual(17);
    expect(measurements[1]).toBeGreaterThanOrEqual(measurements[0]);
    expect(measurements[2]).toBeGreaterThanOrEqual(measurements[1]);
    expect(measurements[2]).toBeLessThanOrEqual(19);
  });

  test('scales spacing and border radius with viewport size', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    const smallViewportMetrics = await readCardMetrics(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    const largeViewportMetrics = await readCardMetrics(page);

    expect(smallViewportMetrics.paddingTop).toBeGreaterThan(0);
    expect(largeViewportMetrics.paddingTop).toBeGreaterThanOrEqual(smallViewportMetrics.paddingTop);
    expect(largeViewportMetrics.paddingTop).toBeLessThanOrEqual(24);
    expect(largeViewportMetrics.radius).toBeGreaterThanOrEqual(smallViewportMetrics.radius);
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
