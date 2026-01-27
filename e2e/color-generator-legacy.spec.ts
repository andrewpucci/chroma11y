/**
 * Playwright tests ported from legacy Cypress tests
 * Tests color generation algorithm, nudger stability, and theme switching
 */

import { test, expect } from '@playwright/test';

test.describe('Color Generator - Legacy Algorithm Tests', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		// Wait for the app to be ready
		await page.waitForSelector('h1:has-text("Svelte Color Generator")', { timeout: 10000 });
		// Wait for colors to generate
		await page.waitForTimeout(1000);
	});

	test.describe('Basic Loading', () => {
		test('loads the application successfully', async ({ page }) => {
			// Check for main elements
			await expect(page.locator('h1')).toContainText('Svelte Color Generator');
			await expect(page.locator('.color-display').first()).toBeVisible();
		});

		test('generates initial color palettes', async ({ page }) => {
			// Should have neutral palette
			const neutralSection = page.locator('.color-display').first();
			await expect(neutralSection).toBeVisible();
			
			// Should have 11 neutral colors by default
			const neutralSwatches = neutralSection.locator('.color-swatch');
			await expect(neutralSwatches).toHaveCount(11);
			
			// Should have palette section
			const paletteSection = page.locator('.color-display').nth(1);
			await expect(paletteSection).toBeVisible();
		});
	});

	test.describe('Theme Toggling', () => {
		test('toggles between light and dark themes', async ({ page }) => {
			const themeToggle = page.locator('.theme-toggle');
			await expect(themeToggle).toBeVisible();
			
			// Initial state should be light mode
			const initialText = await themeToggle.textContent();
			expect(initialText).toContain('Dark Mode');
			
			// Toggle to dark mode
			await themeToggle.click();
			await page.waitForTimeout(500);
			
			// Should now show Light Mode option
			const darkModeText = await themeToggle.textContent();
			expect(darkModeText).toContain('Light Mode');
			
			// Toggle back to light mode
			await themeToggle.click();
			await page.waitForTimeout(500);
			
			// Should show Dark Mode option again
			const lightModeText = await themeToggle.textContent();
			expect(lightModeText).toContain('Dark Mode');
		});

		test('dark mode changes bezier curve values', async ({ page }) => {
			// Get initial x1 value (light mode default: 0.16)
			const x1Input = page.locator('#x1');
			const initialX1 = await x1Input.inputValue();
			expect(initialX1).toBe('0.16');
			
			// Toggle to dark mode
			await page.locator('.theme-toggle').click();
			await page.waitForTimeout(500);
			
			// Dark mode should have different bezier values (x1: 0.45)
			const darkX1 = await x1Input.inputValue();
			expect(darkX1).toBe('0.45');
		});
	});

	test.describe('Base Color Changes', () => {
		test('changing base color updates palettes', async ({ page }) => {
			// Get initial palette color hex (use middle color which has more chroma)
			const paletteSection = page.locator('.color-display').nth(1);
			const paletteHexes = paletteSection.locator('.color-hex');
			// Use 5th color (middle of palette) which has visible color
			const initialHex = await paletteHexes.nth(5).textContent();
			
			// Change base color to a very different color (green)
			await page.locator('#baseColor').fill('#00ff00');
			await page.waitForTimeout(1000);
			
			// Palette color should change
			const newHex = await paletteHexes.nth(5).textContent();
			expect(newHex).not.toBe(initialHex);
		});
	});

	test.describe('Lightness Nudger Stability', () => {
		test('nudger changes persist and do not cause runaway values', async ({ page }) => {
			// Use middle nudger (step 5) which has room to adjust both ways
			const nudgerInputs = page.locator('.nudger-input');
			const middleNudger = nudgerInputs.nth(5);
			await expect(middleNudger).toBeVisible();
			
			// Get initial neutral color at step 5
			const neutralSection = page.locator('.color-display').first();
			const middleNeutralHex = neutralSection.locator('.color-hex').nth(5);
			const initialHex = await middleNeutralHex.textContent();
			
			// Change nudger value (negative to make it darker, more visible change)
			await middleNudger.fill('-0.1');
			await page.waitForTimeout(500);
			
			// Verify nudger value persists
			const nudgerValue = await middleNudger.inputValue();
			expect(nudgerValue).toBe('-0.1');
			
			// Get new color
			const newHex = await middleNeutralHex.textContent();
			
			// Color should have changed
			expect(newHex).not.toBe(initialHex);
			
			// Wait and check again - value should be stable (no runaway)
			await page.waitForTimeout(500);
			const stableHex = await middleNeutralHex.textContent();
			expect(stableHex).toBe(newHex);
			
			// Nudger value should still be the same
			const stableNudgerValue = await middleNudger.inputValue();
			expect(stableNudgerValue).toBe('-0.1');
		});

		test('nudger only affects its own column', async ({ page }) => {
			// Get colors before nudging
			const neutralSection = page.locator('.color-display').first();
			const hexElements = neutralSection.locator('.color-hex');
			
			const color0Before = await hexElements.nth(0).textContent();
			const color1Before = await hexElements.nth(1).textContent();
			const color2Before = await hexElements.nth(2).textContent();
			
			// Change nudger for step 1 only
			const nudgerInputs = page.locator('.nudger-input');
			await nudgerInputs.nth(1).fill('0.1');
			await page.waitForTimeout(500);
			
			// Get colors after nudging
			const color0After = await hexElements.nth(0).textContent();
			const color1After = await hexElements.nth(1).textContent();
			const color2After = await hexElements.nth(2).textContent();
			
			// Only step 1 should change
			expect(color0After).toBe(color0Before);
			expect(color1After).not.toBe(color1Before);
			expect(color2After).toBe(color2Before);
		});

		test('resetting nudger to zero returns to original color', async ({ page }) => {
			const neutralSection = page.locator('.color-display').first();
			// Use middle color (step 5) which has room to adjust
			const middleHex = neutralSection.locator('.color-hex').nth(5);
			const nudgerInputs = page.locator('.nudger-input');
			const middleNudger = nudgerInputs.nth(5);
			
			// Get original color
			const originalHex = await middleHex.textContent();
			
			// Change nudger (negative to make it darker)
			await middleNudger.fill('-0.15');
			await page.waitForTimeout(500);
			
			// Color should change
			const changedHex = await middleHex.textContent();
			expect(changedHex).not.toBe(originalHex);
			
			// Reset nudger to 0
			await middleNudger.fill('0');
			await page.waitForTimeout(500);
			
			// Color should return to original
			const resetHex = await middleHex.textContent();
			expect(resetHex).toBe(originalHex);
		});
	});

	test.describe('Hue Nudger Stability', () => {
		test('hue nudger changes palette colors but not neutrals', async ({ page }) => {
			// Get neutral colors before (sample a few)
			const neutralSection = page.locator('.color-display').first();
			const neutralHexes = neutralSection.locator('.color-hex');
			const neutralsBefore: string[] = [];
			for (let i = 0; i < 3; i++) {
				neutralsBefore.push(await neutralHexes.nth(i).textContent() || '');
			}
			
			// Get middle palette color before (has more visible hue)
			const paletteSection = page.locator('.color-display').nth(1);
			const paletteHexes = paletteSection.locator('.color-hex');
			const paletteBefore = await paletteHexes.nth(5).textContent();
			
			// Change hue nudger for first palette with larger value
			const hueNudger = page.locator('.hue-nudger-input').first();
			await expect(hueNudger).toBeVisible();
			await hueNudger.fill('60');
			await page.waitForTimeout(500);
			
			// Neutrals should NOT change
			for (let i = 0; i < 3; i++) {
				const neutralAfter = await neutralHexes.nth(i).textContent();
				expect(neutralAfter).toBe(neutralsBefore[i]);
			}
			
			// Palette middle color SHOULD change
			const paletteAfter = await paletteHexes.nth(5).textContent();
			expect(paletteAfter).not.toBe(paletteBefore);
		});

		test('hue nudger value persists', async ({ page }) => {
			const hueNudger = page.locator('.hue-nudger-input').first();
			await expect(hueNudger).toBeVisible();
			
			// Set hue nudger
			await hueNudger.fill('45');
			await page.waitForTimeout(500);
			
			// Value should persist
			const value = await hueNudger.inputValue();
			expect(value).toBe('45');
			
			// Wait and check stability
			await page.waitForTimeout(500);
			const stableValue = await hueNudger.inputValue();
			expect(stableValue).toBe('45');
		});
	});

	test.describe('Bezier Curve Stability', () => {
		test('bezier changes do not cause runaway values', async ({ page }) => {
			const x1Input = page.locator('#x1');
			const y1Input = page.locator('#y1');
			
			// Get initial y1 value
			const initialY1 = await y1Input.inputValue();
			
			// Change x1
			await x1Input.fill('0.25');
			await page.waitForTimeout(500);
			
			// Value should be what we set
			expect(await x1Input.inputValue()).toBe('0.25');
			
			// y1 should be unchanged
			expect(await y1Input.inputValue()).toBe(initialY1);
			
			// Wait and verify stability
			await page.waitForTimeout(500);
			expect(await x1Input.inputValue()).toBe('0.25');
		});

		test('resetting bezier returns to theme default', async ({ page }) => {
			const x1Input = page.locator('#x1');
			
			// Change value
			await x1Input.fill('0.5');
			await page.waitForTimeout(500);
			
			// Reset to default (0.16 for light mode)
			await x1Input.fill('0.16');
			await page.waitForTimeout(500);
			
			expect(await x1Input.inputValue()).toBe('0.16');
		});
	});

	test.describe('Contrast Mode', () => {
		test('can switch between auto and manual contrast modes', async ({ page }) => {
			const contrastModeSelect = page.locator('#contrast-mode');
			await expect(contrastModeSelect).toBeVisible();
			
			// Initial mode should be auto
			const initialMode = await contrastModeSelect.inputValue();
			expect(initialMode).toBe('auto');
			
			// Switch to manual
			await contrastModeSelect.selectOption('manual');
			await page.waitForTimeout(500);
			
			// Should now be manual
			const newMode = await contrastModeSelect.inputValue();
			expect(newMode).toBe('manual');
			
			// Manual color inputs should be visible
			const lowColorInput = page.locator('#contrast-low');
			await expect(lowColorInput).toBeVisible();
		});

		test.skip('auto mode uses neutral colors for contrast', async () => {
			// This test requires verifying contrast colors match neutral palette steps
			// Skip until contrast display is implemented
		});
	});

	test.describe('Color Generation Consistency', () => {
		test('generates consistent colors on reload', async ({ page }) => {
			// Get initial colors
			const neutralSection = page.locator('.color-display').first();
			const hexElements = neutralSection.locator('.color-hex');
			
			const colorsBefore: string[] = [];
			const count = await hexElements.count();
			for (let i = 0; i < Math.min(count, 5); i++) {
				colorsBefore.push(await hexElements.nth(i).textContent() || '');
			}
			
			// Reload page
			await page.reload();
			await page.waitForSelector('h1:has-text("Svelte Color Generator")', { timeout: 10000 });
			await page.waitForTimeout(1000);
			
			// Get colors after reload
			const colorsAfter: string[] = [];
			for (let i = 0; i < Math.min(count, 5); i++) {
				colorsAfter.push(await hexElements.nth(i).textContent() || '');
			}
			
			// Colors should be the same
			expect(colorsAfter).toEqual(colorsBefore);
		});

		test('light mode generates white to black gradient for neutrals', async ({ page }) => {
			// First neutral should be white or very light
			const neutralSection = page.locator('.color-display').first();
			const firstHex = await neutralSection.locator('.color-hex').first().textContent();
			
			// Should start with white (#ffffff) or very close
			expect(firstHex?.toLowerCase()).toBe('#ffffff');
			
			// Last neutral should be black or very dark
			const lastHex = await neutralSection.locator('.color-hex').last().textContent();
			expect(lastHex?.toLowerCase()).toBe('#000000');
		});
	});

	test.describe('Palette Naming', () => {
		test('displays palette names based on color', async ({ page }) => {
			// Palette headers should show color names
			const paletteHeaders = page.locator('.palette-header h3');
			const headerCount = await paletteHeaders.count();
			
			expect(headerCount).toBeGreaterThan(0);
			
			// First palette name should be a valid color name (not empty)
			const firstName = await paletteHeaders.first().textContent();
			expect(firstName).toBeTruthy();
			// Name should have at least 2 characters (valid color name)
			expect(firstName!.length).toBeGreaterThan(1);
		});
	});
});

test.describe('Color Generator - Snapshot Tests', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForSelector('h1:has-text("Svelte Color Generator")', { timeout: 10000 });
		await page.waitForTimeout(1000);
	});

	test.skip('light mode generates expected neutral colors', async () => {
		// This test verifies exact color values from the legacy algorithm
		// Expected values from legacy Cypress tests (may need adjustment)
		// Enable this test once algorithm is verified to match legacy exactly
		// 
		// const expectedNeutrals = [
		// 	'#ffffff', '#f1f3f5', '#d5d7d9', '#b7b9bb', '#999b9d',
		// 	'#7c7e80', '#5f6163', '#434547', '#292b2d', '#111314', '#000000'
		// ];
	});

	test.skip('dark mode generates expected neutral colors', async () => {
		// Toggle to dark mode first, then verify:
		// - Dark mode neutrals start from calculated dark color and go to white
		// - In dark mode, first color is dark, last is white
		// Enable this test once dark mode algorithm is verified
	});

	test.skip('generates expected palette colors with nudgers', async () => {
		// This test would verify exact palette colors with specific nudger values
		// Ported from legacy colorGenerator.cy.js "Consistent color generation" tests
		// Skip until full algorithm verification is complete
	});
});
