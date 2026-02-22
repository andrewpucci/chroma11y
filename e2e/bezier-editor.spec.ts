/**
 * Bezier Editor E2E Tests
 * Tests for the interactive bezier curve editor component
 */

import { test, expect } from '@playwright/test';
import { waitForAppReady } from './test-utils';

test.describe('Bezier Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test.describe('Visual Rendering', () => {
    test('renders the bezier curve editor', async ({ page }) => {
      const bezierEditor = page.locator('.bezier-editor');
      await expect(bezierEditor).toBeVisible();

      // Check SVG is present
      const svg = bezierEditor.locator('svg');
      await expect(svg).toBeVisible();

      // Check both control points are present
      const controlPoints = svg.locator('circle[role="slider"]');
      await expect(controlPoints).toHaveCount(2);
    });

    test('displays coordinate readout', async ({ page }) => {
      const bezierEditor = page.locator('.bezier-editor');
      const readout = bezierEditor.locator('.readout');
      await expect(readout).toBeVisible();

      // Should show both P1 and P2 coordinates
      await expect(readout).toContainText(/P1\(/);
      await expect(readout).toContainText(/P2\(/);
    });

    test('shows axis labels', async ({ page }) => {
      const svg = page.locator('.bezier-editor svg');
      await expect(svg.locator('text:has-text("Step")')).toBeVisible();
      await expect(svg.locator('text:has-text("Lightness")')).toBeVisible();
    });
  });

  test.describe('Visual regression', () => {
    test.skip(({ browserName }) => browserName !== 'chromium', 'Visual tests only run on Chromium');

    test('bezier curve visual appearance', async ({ page }) => {
      const bezierEditor = page.locator('.bezier-editor');
      await expect(bezierEditor).toHaveScreenshot('bezier-editor-default.png');
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('can focus control points', async ({ page }) => {
      const p1 = page.locator('.bezier-editor circle[role="slider"]').first();
      await p1.focus();

      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toHaveAttribute('role', 'slider');
    });

    test('moves control point with arrow keys', async ({ page }) => {
      const readout = page.locator('.readout');
      const initialText = await readout.textContent();

      // Focus first control point
      const p1 = page.locator('.bezier-editor circle[role="slider"]').first();
      await p1.focus();

      // Move with arrow key
      await page.keyboard.press('ArrowRight');

      // Wait for readout to update
      await page.waitForFunction(
        (before) => document.querySelector('.readout')?.textContent !== before,
        initialText,
        { timeout: 5000 }
      );

      const newText = await readout.textContent();
      expect(newText).not.toBe(initialText);
    });

    test('uses larger steps with Shift key', async ({ page }) => {
      const readout = page.locator('.readout');

      // Focus first control point
      const p1 = page.locator('.bezier-editor circle[role="slider"]').first();
      await p1.focus();

      // Get initial x value
      const initialText = await readout.textContent();
      const initialMatch = initialText?.match(/P1\(([\d.]+),/);
      const initialX = parseFloat(initialMatch?.[1] || '0');

      // Move with Shift+Arrow (should move by 0.05)
      await page.keyboard.press('Shift+ArrowRight');

      // Wait for readout to update
      await page.waitForFunction(
        (before) => document.querySelector('.readout')?.textContent !== before,
        initialText,
        { timeout: 5000 }
      );

      const newText = await readout.textContent();
      const newMatch = newText?.match(/P1\(([\d.]+),/);
      const newX = parseFloat(newMatch?.[1] || '0');

      // Should have moved by approximately 0.05
      expect(Math.abs(newX - initialX - 0.05)).toBeLessThan(0.01);
    });
  });

  test.describe('Integration with Color Generation', () => {
    test('changing bezier values updates color palettes', async ({ page }) => {
      // Get initial palette colors
      const paletteHexes = page
        .getByTestId('generated-palettes')
        .locator('.swatches')
        .first()
        .locator('.hex');
      const initialHex = await paletteHexes.nth(5).textContent();

      // Focus and modify bezier control point
      const p1 = page.locator('.bezier-editor circle[role="slider"]').first();
      await p1.focus();

      // Make significant change
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Shift+ArrowRight');
      }

      // Wait for palette to update - use querySelectorAll to match Playwright's nth(5)
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

      // Palette should update
      const newHex = await paletteHexes.nth(5).textContent();
      expect(newHex).not.toBe(initialHex);
    });

    test('bezier changes persist in URL', async ({ page }) => {
      const p1 = page.locator('.bezier-editor circle[role="slider"]').first();
      await p1.focus();

      // Make changes
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');

      // Wait for URL to update (debounced)
      await page.waitForFunction(() => window.location.href.includes('x1='), { timeout: 5000 });

      // URL should contain bezier parameters
      const url = page.url();
      expect(url).toMatch(/[?&]x1=/);
    });
  });

  test.describe('Accessibility', () => {
    test('control points have proper ARIA attributes', async ({ page }) => {
      const p1 = page.locator('.bezier-editor circle[role="slider"]').first();
      const p2 = page.locator('.bezier-editor circle[role="slider"]').last();

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
      const p1 = page.locator('.bezier-editor circle[role="slider"]').first();
      const p2 = page.locator('.bezier-editor circle[role="slider"]').last();

      await expect(p1).toHaveAttribute('tabindex', '0');
      await expect(p2).toHaveAttribute('tabindex', '0');
    });
  });

  test.describe('Edge Cases', () => {
    test('handles rapid keyboard input', async ({ page }) => {
      const p1 = page.locator('.bezier-editor circle[role="slider"]').first();
      await p1.focus();

      // Rapid arrow key presses
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('ArrowRight');
      }

      // Should still be functional and not crash
      const readout = page.locator('.readout');
      await expect(readout).toBeVisible();
      await expect(readout).toContainText(/P1\(/);
    });

    test('clamps values at boundaries', async ({ page }) => {
      const readout = page.locator('.readout');
      const p1 = page.locator('.bezier-editor circle[role="slider"]').first();

      // Get initial value
      const initialText = await readout.textContent();
      const initialMatch = initialText?.match(/P1\(([\d.]+),/);
      const initialX = parseFloat(initialMatch?.[1] || '0');

      await p1.focus();

      // Try to move beyond maximum
      for (let i = 0; i < 50; i++) {
        await page.keyboard.press('ArrowRight');
      }

      // Wait for readout to change from initial value
      await page.waitForFunction(
        (initial) => {
          const text = document.querySelector('.readout')?.textContent;
          const match = text?.match(/P1\(([\d.]+),/);
          return match && parseFloat(match[1]) !== initial;
        },
        initialX,
        { timeout: 5000 }
      );

      const text = await readout.textContent();
      const match = text?.match(/P1\(([\d.]+),/);
      const x = parseFloat(match?.[1] || '0');

      // Should be clamped at 1.0
      expect(x).toBeLessThanOrEqual(1.0);
    });

    test('clamps values at boundaries using keyboard navigation', async ({ page }) => {
      // Test boundary clamping using keyboard navigation instead of pointer events
      // This avoids browser coordinate system differences with getBoundingClientRect()
      const readout = page.locator('.readout');
      const p1 = page.locator('.bezier-editor circle[role="slider"]').first();

      await expect(readout).toBeVisible();
      await p1.focus();

      // Test minimum boundary (top-left) using keyboard
      // Press arrow keys many times to reach the minimum
      for (let i = 0; i < 100; i++) {
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowUp');
      }

      // Wait for readout to show boundary values
      await page.waitForFunction(
        () => {
          const text = document.querySelector('.readout')?.textContent;
          const match = text?.match(/P1\(([\d.]+),\s*([\d.]+)\)/);
          return match && parseFloat(match[1]) === 0 && parseFloat(match[2]) === 1;
        },
        { timeout: 5000 }
      );

      const minText = await readout.textContent();
      const minMatch = minText?.match(/P1\(([\d.]+),\s*([\d.]+)\)/);
      const minX = parseFloat(minMatch?.[1] || '0');
      const minY = parseFloat(minMatch?.[2] || '0');

      // Should be clamped at boundary values
      // X=0.00 (left), Y=1.00 (top/ease-in)
      expect(minX).toBe(0.0);
      expect(minY).toBe(1.0);

      // Test maximum boundary (bottom-right) using keyboard
      // Press arrow keys many times to reach the maximum
      for (let i = 0; i < 100; i++) {
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
      }

      // Wait for readout to show boundary values
      await page.waitForFunction(
        () => {
          const text = document.querySelector('.readout')?.textContent;
          const match = text?.match(/P1\(([\d.]+),\s*([\d.]+)\)/);
          return match && parseFloat(match[1]) === 1 && parseFloat(match[2]) === 0;
        },
        { timeout: 5000 }
      );

      const maxText = await readout.textContent();
      const maxMatch = maxText?.match(/P1\(([\d.]+),\s*([\d.]+)\)/);
      const maxX = parseFloat(maxMatch?.[1] || '0');
      const maxY = parseFloat(maxMatch?.[2] || '0');

      // Should be clamped at boundary values
      // X=1.00 (right), Y=0.00 (bottom/ease-out)
      expect(maxX).toBe(1.0);
      expect(maxY).toBe(0.0);
    });
  });
});
