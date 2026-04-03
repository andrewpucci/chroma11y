/**
 * Bezier Editor E2E Tests
 * Tests for the interactive bezier curve editor component
 */

import { test, expect } from '@playwright/test';
import { ensureGenerationAdvancedExpanded, waitForAppReady } from './test-utils';

test.describe('Bezier Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await ensureGenerationAdvancedExpanded(page);
  });

  test.describe('Keyboard Navigation', () => {
    test('moves control point with arrow keys', async ({ page }) => {
      const p1xInput = page.getByLabel('P1 X coordinate');
      const initialX = parseFloat((await p1xInput.inputValue()) || '0');

      const p1 = page.locator('.bezier-editor [role="slider"]').first();
      await p1.focus();
      await page.keyboard.press('ArrowRight');

      await expect
        .poll(async () => parseFloat((await p1xInput.inputValue()) || '0'))
        .toBeGreaterThan(initialX);
    });

    test('uses larger steps with Shift key', async ({ page }) => {
      const p1xInput = page.getByLabel('P1 X coordinate');
      const initialX = parseFloat((await p1xInput.inputValue()) || '0');

      const p1 = page.locator('.bezier-editor [role="slider"]').first();
      await p1.focus();
      await page.keyboard.press('Shift+ArrowRight');

      const newX = parseFloat((await p1xInput.inputValue()) || '0');
      expect(Math.abs(newX - initialX - 0.05)).toBeLessThan(0.01);
    });
  });

  test.describe('Integration with URL and inputs', () => {
    test('bezier changes persist in URL', async ({ page }) => {
      const p1 = page.locator('.bezier-editor [role="slider"]').first();
      await p1.focus();

      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');

      await page.waitForFunction(() => window.location.href.includes('x1='), { timeout: 5000 });

      const url = page.url();
      expect(url).toMatch(/[?&]x1=/);
    });

    test('numeric coordinate input updates slider aria state and URL', async ({ page }) => {
      const p1xInput = page.getByLabel('P1 X coordinate');
      const p1Slider = page.getByRole('slider', { name: 'Control point P1' });

      await p1xInput.fill('0.42');
      await p1xInput.blur();

      await expect(p1Slider).toHaveAttribute('aria-valuetext', 'x=0.42, y=0.00');
      await page.waitForFunction(() => window.location.href.includes('x1=0.42'), {
        timeout: 5000
      });
    });
  });

  test.describe('Edge Cases', () => {
    test('clamps values at boundaries using keyboard navigation', async ({ page }) => {
      const p1xInput = page.getByLabel('P1 X coordinate');
      const p1yInput = page.getByLabel('P1 Y coordinate');
      const p1 = page.locator('.bezier-editor [role="slider"]').first();

      await p1xInput.fill('0.02');
      await p1xInput.blur();
      await p1yInput.fill('0.98');
      await p1yInput.blur();

      await p1.focus();
      await page.keyboard.press('Shift+ArrowLeft');
      await page.keyboard.press('Shift+ArrowUp');

      await expect.poll(async () => parseFloat((await p1xInput.inputValue()) || '0')).toBe(0);
      await expect.poll(async () => parseFloat((await p1yInput.inputValue()) || '0')).toBe(1);

      await p1xInput.fill('0.98');
      await p1xInput.blur();
      await p1yInput.fill('0.02');
      await p1yInput.blur();

      await p1.focus();
      await page.keyboard.press('Shift+ArrowRight');
      await page.keyboard.press('Shift+ArrowDown');

      await expect.poll(async () => parseFloat((await p1xInput.inputValue()) || '0')).toBe(1);
      await expect.poll(async () => parseFloat((await p1yInput.inputValue()) || '0')).toBe(0);
    });
  });
});
