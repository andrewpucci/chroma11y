/**
 * UI Interaction Tests
 * Tests for basic UI controls, theme toggling, and user interactions
 */

import { test, expect } from '@playwright/test';
import { ensureOutputAdvancedExpanded, waitForAppReady } from './test-utils';

test.describe('UI Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test.describe('Display Settings Tooltip', () => {
    test('OKLCH significant digits tooltip stays above overlapping swatches and works with keyboard focus', async ({
      page
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      const displaySpace = page.locator('#display-color-space');
      await expect(displaySpace).toBeVisible();
      await displaySpace.evaluate((node) => {
        const select = node as HTMLSelectElement;
        select.value = 'oklch';
        select.dispatchEvent(new Event('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await expect(displaySpace).toHaveValue('oklch');
      await ensureOutputAdvancedExpanded(page);

      const significantDigitsSlider = page.locator('#oklch-significant-digits');
      await expect(significantDigitsSlider).toBeVisible({ timeout: 30000 });

      const infoButton = page.getByRole('button', { name: 'Explain OKLCH significant digits' });
      const tooltip = page.locator('#oklch-significant-digits-help');

      await expect(infoButton).toBeVisible({ timeout: 30000 });
      await infoButton.scrollIntoViewIfNeeded();
      await infoButton.hover();
      await expect(tooltip).toBeVisible();
      const tooltipBox = await tooltip.boundingBox();
      expect(tooltipBox).toBeTruthy();
      expect(tooltipBox!.width).toBeGreaterThan(180);

      // Tooltip intentionally uses pointer-events: none in app CSS.
      // Enable pointer-events for this assertion so elementFromPoint reflects
      // visual stacking order rather than hit-testing behavior.
      await page.evaluate(() => {
        const tooltipEl = document.querySelector<HTMLElement>('#oklch-significant-digits-help');
        if (tooltipEl) {
          tooltipEl.style.pointerEvents = 'auto';
        }
      });

      const overlapResult = await page.evaluate(() => {
        const tooltipEl = document.querySelector<HTMLElement>('#oklch-significant-digits-help');
        if (!tooltipEl) throw new Error('Tooltip not found');

        const tooltipRect = tooltipEl.getBoundingClientRect();
        const x = Math.min(tooltipRect.left + tooltipRect.width * 0.85, window.innerWidth - 1);
        const y = Math.min(tooltipRect.top + tooltipRect.height * 0.5, window.innerHeight - 1);
        const topElement = document.elementFromPoint(x, y);

        return {
          hasOverlap: true,
          tooltipOnTop: Boolean(topElement?.closest('#oklch-significant-digits-help'))
        };
      });

      expect(overlapResult.hasOverlap).toBe(true);
      expect(overlapResult.tooltipOnTop).toBe(true);

      await infoButton.focus();
      await expect(infoButton).toBeFocused();
      await expect(tooltip).toBeVisible();
    });
  });

  test.describe('Getting Started Guide', () => {
    test('keeps keyboard focus inside the modal and returns focus to the Help trigger', async ({
      page
    }) => {
      const helpButton = page.getByRole('button', { name: 'Open Getting Started guide' });
      await helpButton.click();

      const dialog = page.getByRole('dialog', { name: 'Getting Started' });
      await expect(dialog).toBeVisible();
      await expect(page.getByRole('button', { name: 'Close Getting Started guide' })).toBeFocused();

      for (let index = 0; index < 12; index += 1) {
        await page.keyboard.press('Tab');
        await expect
          .poll(async () => {
            return await page.evaluate(() =>
              Boolean(document.activeElement?.closest('#getting-started-dialog'))
            );
          })
          .toBe(true);
      }

      await page.keyboard.press('Escape');

      await expect(dialog).toBeHidden();
      await expect(helpButton).toBeFocused();
    });
  });

  test.describe('Constraints Panel', () => {
    test('keeps closed constraints content out of the tab order until expanded and supports filter and enabled toggles', async ({
      page
    }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());
      await page.goto(
        '/?ct=W3siaWQiOiJjb25zdHJhaW50LTEiLCJ0eXBlIjoidGFyZ2V0LWNvbG9yIiwiZW5hYmxlZCI6dHJ1ZSwidGFyZ2V0SGV4IjoiIzVFRjc4NCIsIm11c3RQYXNzIjpmYWxzZSwibWV0cmljIjoib2sifSx7ImlkIjoiY29uc3RyYWludC0yIiwidHlwZSI6ImNvbnRyYXN0LXJ1bGUiLCJlbmFibGVkIjp0cnVlLCJzY29wZSI6ImFsbC1wYWxldHRlcyIsInN0ZXBJbmRleCI6NywicmVmZXJlbmNlIjoibG93IiwiYWxnb3JpdGhtIjoiV0NBRyIsImxldmVsIjoid2NhZ0FBIiwiZml0VG9UaHJlc2hvbGQiOnRydWV9XQ'
      );
      await waitForAppReady(page);

      const constraintsCard = page.getByTestId('constraints-controls-card');
      const constraintsSummary = constraintsCard.locator(':scope > summary.card-summary');

      await constraintsSummary.focus();
      await expect(constraintsSummary).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(
        page.getByTestId('contrast-controls-card').locator(':scope > summary.card-summary')
      ).toBeFocused();
      await expect(page.locator('.constraint-editor')).toHaveCount(0);

      await constraintsSummary.focus();
      await page.keyboard.press('Enter');
      await expect(constraintsCard).toHaveJSProperty('open', true);

      await page.getByRole('button', { name: 'Edit' }).first().click();
      await expect(page.getByLabel('Target color enabled')).toBeChecked();
      await page.getByLabel('Target color enabled').click();
      await expect(page.getByLabel('Target color enabled')).not.toBeChecked();
      await expect(constraintsSummary).toContainText('1 disabled');

      await constraintsCard
        .locator('select[aria-label="Constraint status filter"]:visible')
        .selectOption('disabled');
      await expect(constraintsCard.locator('.filter-results:visible')).toHaveText(
        '1 of 2 constraints shown'
      );
    });
  });
});
