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
    await page.waitForTimeout(500);
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
      await page.waitForTimeout(100);

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
      await page.waitForTimeout(100);

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
      await page.waitForTimeout(500);

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
      await page.waitForTimeout(600);

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
      await p1.focus();

      // Try to move beyond maximum
      for (let i = 0; i < 50; i++) {
        await page.keyboard.press('ArrowRight');
      }
      await page.waitForTimeout(100);

      const text = await readout.textContent();
      const match = text?.match(/P1\(([\d.]+),/);
      const x = parseFloat(match?.[1] || '0');

      // Should be clamped at 1.0
      expect(x).toBeLessThanOrEqual(1.0);
    });

    test('continues dragging outside the canvas and clamps values', async ({ page }) => {
      const svg = page.locator('.bezier-editor svg');
      const p1 = page.locator('.bezier-editor circle[role="slider"]').first();
      const readout = page.locator('.readout');

      await expect(svg).toBeVisible();
      await expect(p1).toBeVisible();
      await expect(readout).toBeVisible();

      const svgBox = await svg.boundingBox();
      const p1Box = await p1.boundingBox();

      expect(svgBox).toBeTruthy();
      expect(p1Box).toBeTruthy();
      if (!svgBox || !p1Box) return;

      const p1CenterX = p1Box.x + p1Box.width / 2;
      const p1CenterY = p1Box.y + p1Box.height / 2;

      // Drag far outside the top-left of the SVG; implementation should clamp to (0.00, 1.00)
      const outsideX = svgBox.x - 80;
      const outsideY = svgBox.y - 80;

      // Use dispatchEvent to fire pointer events so setPointerCapture is triggered correctly
      await p1.dispatchEvent('pointerdown', {
        clientX: p1CenterX,
        clientY: p1CenterY,
        pointerId: 1,
        bubbles: true
      });
      await svg.dispatchEvent('pointermove', {
        clientX: outsideX,
        clientY: outsideY,
        pointerId: 1,
        bubbles: true
      });
      await svg.dispatchEvent('pointerup', {
        clientX: outsideX,
        clientY: outsideY,
        pointerId: 1,
        bubbles: true
      });

      await expect(readout).toContainText('P1(0.00, 1.00)');
    });
  });
});
