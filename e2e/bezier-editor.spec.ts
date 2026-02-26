/**
 * Bezier Editor E2E Tests
 * Tests for the interactive bezier curve editor component
 */

import { test, expect } from '@playwright/test';
import { waitForAppReady } from './test-utils';
import { maybeCaptureArgosVisual } from './visual';

test.describe('Bezier Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test.describe('Visual Rendering', () => {
    test('renders the bezier curve editor', async ({ page }) => {
      const bezierEditor = page.locator('.bezier-editor');
      await expect(bezierEditor).toBeVisible();

      const svg = bezierEditor.locator('svg');
      await expect(svg).toBeVisible();

      const controlPoints = svg.locator('[role="slider"]');
      await expect(controlPoints).toHaveCount(2);
    });

    test('displays coordinate inputs', async ({ page }) => {
      await expect(page.getByLabel('P1 X coordinate')).toBeVisible();
      await expect(page.getByLabel('P1 Y coordinate')).toBeVisible();
      await expect(page.getByLabel('P2 X coordinate')).toBeVisible();
      await expect(page.getByLabel('P2 Y coordinate')).toBeVisible();
    });

    test('shows axis labels', async ({ page }) => {
      const svg = page.locator('.bezier-editor svg');
      await expect(svg.locator('text:has-text("Step")')).toBeVisible();
      await expect(svg.locator('text:has-text("Lightness")')).toBeVisible();
    });
  });

  test.describe('Visual regression', () => {
    test('bezier curve visual appearance', async ({ page }, testInfo) => {
      const bezierEditor = page.locator('.bezier-editor');
      await maybeCaptureArgosVisual({
        page,
        testInfo,
        name: 'bezier-editor-default',
        element: bezierEditor
      });
      await expect(bezierEditor).toHaveScreenshot('bezier-editor-default.png');
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('can focus control points', async ({ page }) => {
      const p1 = page.locator('.bezier-editor [role="slider"]').first();
      await p1.focus();

      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toHaveAttribute('role', 'slider');
    });

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

  test.describe('Integration with Color Generation', () => {
    test('changing bezier values updates color palettes', async ({ page }) => {
      const paletteHexes = page
        .getByTestId('generated-palettes')
        .locator('.swatches')
        .first()
        .locator('.hex');
      const initialHex = await paletteHexes.nth(5).textContent();

      const p1 = page.locator('.bezier-editor [role="slider"]').first();
      await p1.focus();

      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Shift+ArrowRight');
      }

      await page.waitForFunction(
        (before) => {
          const hexElements = document.querySelectorAll(
            '[data-testid="generated-palettes"] .swatches .hex'
          );
          const hex = hexElements[5]?.textContent;
          return hex !== before;
        },
        initialHex,
        { timeout: 5000 }
      );

      const newHex = await paletteHexes.nth(5).textContent();
      expect(newHex).not.toBe(initialHex);
    });

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

  test.describe('Accessibility', () => {
    test('control points have proper ARIA attributes', async ({ page }) => {
      const p1 = page.locator('.bezier-editor [role="slider"]').first();
      const p2 = page.locator('.bezier-editor [role="slider"]').last();

      await expect(p1).toHaveAttribute('role', 'slider');
      await expect(p1).toHaveAttribute('aria-label');
      await expect(p1).toHaveAttribute('aria-valuenow');
      await expect(p1).toHaveAttribute('aria-valuemin', '0');
      await expect(p1).toHaveAttribute('aria-valuemax', '1');

      await expect(p2).toHaveAttribute('role', 'slider');
      await expect(p2).toHaveAttribute('aria-label');
    });

    test('SVG has group role and label', async ({ page }) => {
      const svg = page.locator('.bezier-editor svg');
      await expect(svg).toHaveAttribute('role', 'group');
      await expect(svg).toHaveAttribute('aria-label');
    });

    test('control points are keyboard focusable', async ({ page }) => {
      const p1 = page.locator('.bezier-editor [role="slider"]').first();
      const p2 = page.locator('.bezier-editor [role="slider"]').last();

      await expect(p1).toHaveAttribute('tabindex', '0');
      await expect(p2).toHaveAttribute('tabindex', '0');
    });
  });

  test.describe('Edge Cases', () => {
    test('handles rapid keyboard input', async ({ page }) => {
      const p1xInput = page.getByLabel('P1 X coordinate');
      const p1 = page.locator('.bezier-editor [role="slider"]').first();
      await p1.focus();

      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('ArrowRight');
      }

      const x = parseFloat((await p1xInput.inputValue()) || '0');
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(1);
    });

    test('clamps values at boundaries', async ({ page }) => {
      const p1xInput = page.getByLabel('P1 X coordinate');
      const p1 = page.locator('.bezier-editor [role="slider"]').first();
      await p1.focus();

      for (let i = 0; i < 50; i++) {
        await page.keyboard.press('ArrowRight');
      }

      await expect
        .poll(async () => parseFloat((await p1xInput.inputValue()) || '0'))
        .toBeLessThanOrEqual(1);
    });

    test('clamps values at boundaries using keyboard navigation', async ({ page }) => {
      const p1xInput = page.getByLabel('P1 X coordinate');
      const p1yInput = page.getByLabel('P1 Y coordinate');
      const p1 = page.locator('.bezier-editor [role="slider"]').first();

      await p1.focus();

      for (let i = 0; i < 100; i++) {
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowUp');
      }

      await expect.poll(async () => parseFloat((await p1xInput.inputValue()) || '0')).toBe(0);
      await expect.poll(async () => parseFloat((await p1yInput.inputValue()) || '0')).toBe(1);

      for (let i = 0; i < 100; i++) {
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
      }

      await expect.poll(async () => parseFloat((await p1xInput.inputValue()) || '0')).toBe(1);
      await expect.poll(async () => parseFloat((await p1yInput.inputValue()) || '0')).toBe(0);
    });
  });
});
