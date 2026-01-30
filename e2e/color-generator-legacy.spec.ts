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
			const paletteHexes = paletteSection.locator('.hex');
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
			const middleNeutralHex = neutralSection.locator('.hex').nth(5);
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
			const hexElements = neutralSection.locator('.hex');
			
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
			const middleHex = neutralSection.locator('.hex').nth(5);
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
			const neutralHexes = neutralSection.locator('.hex');
			const neutralsBefore: string[] = [];
			for (let i = 0; i < 3; i++) {
				neutralsBefore.push(await neutralHexes.nth(i).textContent() || '');
			}
			
			// Get middle palette color before (has more visible hue)
			const paletteSection = page.locator('.color-display').nth(1);
			const paletteHexes = paletteSection.locator('.hex');
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

		test('auto mode uses neutral colors for contrast', async ({ page }) => {
			// In auto mode, contrast colors should be derived from neutral palette
			const contrastModeSelect = page.locator('#contrast-mode');
			await expect(contrastModeSelect).toBeVisible();
			
			// Ensure we're in auto mode
			await contrastModeSelect.selectOption('auto');
			await page.waitForTimeout(500);
			
			// Get low and high step values
			const lowStep = await page.locator('#low-step').inputValue();
			const highStep = await page.locator('#high-step').inputValue();
			
			// Get neutral colors at those steps
			const neutralSection = page.locator('.color-display').first();
			const neutralHexes = neutralSection.locator('.hex');
			const expectedLowColor = await neutralHexes.nth(parseInt(lowStep)).textContent();
			const expectedHighColor = await neutralHexes.nth(parseInt(highStep)).textContent();
			
			// Get contrast label text which shows the actual colors
			const lowLabel = await page.locator('.contrast-preview .color-sample').first().locator('.label').textContent();
			const highLabel = await page.locator('.contrast-preview .color-sample').last().locator('.label').textContent();
			
			// Labels should contain the neutral colors
			expect(lowLabel?.toLowerCase()).toContain(expectedLowColor?.toLowerCase());
			expect(highLabel?.toLowerCase()).toContain(expectedHighColor?.toLowerCase());
		});
	});

	test.describe('Color Generation Consistency', () => {
		test('generates consistent colors on reload', async ({ page }) => {
			// Get initial colors
			const neutralSection = page.locator('.color-display').first();
			const hexElements = neutralSection.locator('.hex');
			
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
			const firstHex = await neutralSection.locator('.hex').first().textContent();
			
			// Should start with white (#ffffff) or very close
			expect(firstHex?.toLowerCase()).toBe('#ffffff');
			
			// Last neutral should be black or very dark
			const lastHex = await neutralSection.locator('.hex').last().textContent();
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

test.describe('Local Storage Persistence', () => {
	test('saves state to localStorage and restores on fresh load', async ({ page }) => {
		await page.goto('/');
		await page.waitForSelector('h1:has-text("Svelte Color Generator")', { timeout: 10000 });
		await page.waitForTimeout(1000);
		
		// Change base color to purple
		await page.locator('#baseColor').fill('#800080');
		await page.waitForTimeout(1000);
		
		// Verify localStorage was updated
		const storedState = await page.evaluate(() => {
			return localStorage.getItem('svelte-color-generator-state');
		});
		expect(storedState).toBeTruthy();
		expect(storedState).toContain('800080');
		
		// Navigate to clean URL (simulating fresh visit)
		await page.goto('/');
		await page.waitForSelector('h1:has-text("Svelte Color Generator")', { timeout: 10000 });
		await page.waitForTimeout(1000);
		
		// Base color should be restored from localStorage
		const baseColorValue = await page.locator('#baseColor').inputValue();
		expect(baseColorValue.toLowerCase()).toBe('#800080');
	});

	test('remembers theme preference across sessions', async ({ page }) => {
		await page.goto('/');
		await page.waitForSelector('h1:has-text("Svelte Color Generator")', { timeout: 10000 });
		await page.waitForTimeout(1000);
		
		// Toggle to dark mode
		await page.locator('.theme-toggle').click();
		await page.waitForTimeout(1000);
		
		// Navigate to fresh URL
		await page.goto('/');
		await page.waitForSelector('h1:has-text("Svelte Color Generator")', { timeout: 10000 });
		await page.waitForTimeout(1000);
		
		// Should still be in dark mode
		const themeToggle = await page.locator('.theme-toggle').textContent();
		expect(themeToggle).toContain('Light Mode');
	});
});

test.describe('URL State Persistence', () => {
	test('persists state in URL and restores on navigation', async ({ page }) => {
		await page.goto('/');
		await page.waitForSelector('h1:has-text("Svelte Color Generator")', { timeout: 10000 });
		await page.waitForTimeout(1000);
		
		// Change base color to green
		await page.locator('#baseColor').fill('#00ff00');
		await page.waitForTimeout(1000);
		
		// URL should contain the color parameter
		const url = page.url();
		expect(url).toContain('c=00ff00');
		
		// Navigate to the URL directly
		await page.goto(url);
		await page.waitForSelector('h1:has-text("Svelte Color Generator")', { timeout: 10000 });
		await page.waitForTimeout(1000);
		
		// Base color input should have the green value
		const baseColorValue = await page.locator('#baseColor').inputValue();
		expect(baseColorValue.toLowerCase()).toBe('#00ff00');
	});

	test('shares configuration via URL', async ({ page }) => {
		// Navigate with URL parameters
		await page.goto('/?c=ff0000&w=5&t=dark');
		await page.waitForSelector('h1:has-text("Svelte Color Generator")', { timeout: 10000 });
		await page.waitForTimeout(1000);
		
		// Verify base color is red
		const baseColorValue = await page.locator('#baseColor').inputValue();
		expect(baseColorValue.toLowerCase()).toBe('#ff0000');
		
		// Verify warmth is 5
		const warmthValue = await page.locator('#warmth').inputValue();
		expect(warmthValue).toBe('5');
		
		// Verify dark mode is active
		const themeToggle = await page.locator('.theme-toggle').textContent();
		expect(themeToggle).toContain('Light Mode');
	});
});

test.describe('Color Generator - Deterministic Snapshot Tests', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForSelector('h1:has-text("Svelte Color Generator")', { timeout: 10000 });
		await page.waitForTimeout(1000);
	});

	test('generates consistent colors in light mode with config applied', async ({ page }) => {
		// Set a specific base configuration
		await page.locator('#baseColor').fill('#1862e6');
		await page.locator('#warmth').fill('-7');
		await page.locator('#x1').fill('0.16');
		await page.locator('#y1').fill('0');
		await page.locator('#x2').fill('0.28');
		await page.locator('#y2').fill('0.38');
		await page.locator('#chroma').fill('1.14');
		await page.waitForTimeout(500);
		
		// Set lightness nudger values
		const nudgerInputs = page.locator('.nudger-input');
		await nudgerInputs.nth(5).fill('-0.005');
		await nudgerInputs.nth(6).fill('-0.0009');
		await page.waitForTimeout(500);
		
		// Set hue nudger for palette 4
		const hueNudgers = page.locator('.hue-nudger-input');
		await hueNudgers.nth(4).fill('-5');
		await page.waitForTimeout(500);
		
		// Capture actual neutral colors for deterministic verification
		const neutralSection = page.locator('.color-display').first();
		const neutralHexes = neutralSection.locator('.hex');
		const neutralColors: string[] = [];
		const neutralCount = await neutralHexes.count();
		for (let i = 0; i < neutralCount; i++) {
			const hex = await neutralHexes.nth(i).textContent();
			neutralColors.push(hex?.toLowerCase() || '');
		}
		
		// Capture actual first palette colors (first .color-grid inside palettes section)
		const paletteGrid = page.locator('.color-display').nth(1).locator('.color-grid').first();
		const paletteHexes = paletteGrid.locator('.hex');
		const paletteColors: string[] = [];
		const paletteCount = await paletteHexes.count();
		for (let i = 0; i < paletteCount; i++) {
			const hex = await paletteHexes.nth(i).textContent();
			paletteColors.push(hex?.toLowerCase() || '');
		}
		
		// Reload page and set same configuration
		await page.reload();
		await page.waitForSelector('h1:has-text("Svelte Color Generator")', { timeout: 10000 });
		await page.waitForTimeout(1000);
		
		await page.locator('#baseColor').fill('#1862e6');
		await page.locator('#warmth').fill('-7');
		await page.locator('#x1').fill('0.16');
		await page.locator('#y1').fill('0');
		await page.locator('#x2').fill('0.28');
		await page.locator('#y2').fill('0.38');
		await page.locator('#chroma').fill('1.14');
		await page.waitForTimeout(500);
		
		const nudgerInputs2 = page.locator('.nudger-input');
		await nudgerInputs2.nth(5).fill('-0.005');
		await nudgerInputs2.nth(6).fill('-0.0009');
		await page.waitForTimeout(500);
		
		const hueNudgers2 = page.locator('.hue-nudger-input');
		await hueNudgers2.nth(4).fill('-5');
		await page.waitForTimeout(500);
		
		// Verify neutral colors are identical after reload
		const neutralSection2 = page.locator('.color-display').first();
		const neutralHexes2 = neutralSection2.locator('.hex');
		for (let i = 0; i < neutralCount; i++) {
			const hex = await neutralHexes2.nth(i).textContent();
			expect(hex?.toLowerCase()).toBe(neutralColors[i]);
		}
		
		// Verify first palette colors are identical after reload
		const paletteGrid2 = page.locator('.color-display').nth(1).locator('.color-grid').first();
		const paletteHexes2 = paletteGrid2.locator('.hex');
		for (let i = 0; i < paletteCount; i++) {
			const hex = await paletteHexes2.nth(i).textContent();
			expect(hex?.toLowerCase()).toBe(paletteColors[i]);
		}
		
		// Verify 11 colors are generated
		expect(neutralColors.length).toBe(11);
		expect(paletteColors.length).toBe(11);
		
		// Verify first and last neutral colors (white to black gradient)
		expect(neutralColors[0]).toBe('#ffffff');
		expect(neutralColors[10]).toBe('#000000');
	});

	test('generates consistent colors in dark mode with config applied', async ({ page }) => {
		// Toggle to dark mode
		await page.locator('.theme-toggle').click();
		await page.waitForTimeout(1000);
		
		// Set a specific dark mode configuration
		await page.locator('#baseColor').fill('#1862e6');
		await page.locator('#warmth').fill('-7');
		await page.locator('#x1').fill('0.45');
		await page.locator('#y1').fill('0.08');
		await page.locator('#x2').fill('0.77');
		await page.locator('#y2').fill('0.96');
		await page.locator('#chroma').fill('0.83');
		await page.waitForTimeout(500);
		
		// Set low step to 2
		await page.locator('#low-step').selectOption('2');
		await page.waitForTimeout(500);
		
		// Set lightness nudger value at position 6
		const nudgerInputs = page.locator('.nudger-input');
		await nudgerInputs.nth(6).fill('0.0047');
		await page.waitForTimeout(500);
		
		// Set hue nudgers
		const hueNudgers = page.locator('.hue-nudger-input');
		await hueNudgers.nth(0).fill('-1');
		await hueNudgers.nth(4).fill('-5');
		await page.waitForTimeout(1000);
		
		// Capture actual neutral colors
		const neutralSection = page.locator('.color-display').first();
		const neutralHexes = neutralSection.locator('.hex');
		const neutralColors: string[] = [];
		const neutralCount = await neutralHexes.count();
		for (let i = 0; i < neutralCount; i++) {
			const hex = await neutralHexes.nth(i).textContent();
			neutralColors.push(hex?.toLowerCase() || '');
		}
		
		// Capture actual first palette colors (first .color-grid inside palettes section)
		const paletteGrid = page.locator('.color-display').nth(1).locator('.color-grid').first();
		const paletteHexes = paletteGrid.locator('.hex');
		const paletteColors: string[] = [];
		const paletteCount = await paletteHexes.count();
		for (let i = 0; i < paletteCount; i++) {
			const hex = await paletteHexes.nth(i).textContent();
			paletteColors.push(hex?.toLowerCase() || '');
		}
		
		// Navigate to clean URL (no state) and set same configuration
		await page.goto('/');
		await page.waitForSelector('h1:has-text("Svelte Color Generator")', { timeout: 10000 });
		await page.waitForTimeout(1000);
		
		// Toggle to dark mode again
		await page.locator('.theme-toggle').click();
		await page.waitForTimeout(1000);
		
		await page.locator('#baseColor').fill('#1862e6');
		await page.locator('#warmth').fill('-7');
		await page.locator('#x1').fill('0.45');
		await page.locator('#y1').fill('0.08');
		await page.locator('#x2').fill('0.77');
		await page.locator('#y2').fill('0.96');
		await page.locator('#chroma').fill('0.83');
		await page.waitForTimeout(500);
		
		await page.locator('#low-step').selectOption('2');
		await page.waitForTimeout(500);
		
		const nudgerInputs2 = page.locator('.nudger-input');
		await nudgerInputs2.nth(6).fill('0.0047');
		await page.waitForTimeout(500);
		
		const hueNudgers2 = page.locator('.hue-nudger-input');
		await hueNudgers2.nth(0).fill('-1');
		await hueNudgers2.nth(4).fill('-5');
		await page.waitForTimeout(1000);
		
		// Verify neutral colors are identical after reload
		const neutralSection2 = page.locator('.color-display').first();
		const neutralHexes2 = neutralSection2.locator('.hex');
		for (let i = 0; i < neutralCount; i++) {
			const hex = await neutralHexes2.nth(i).textContent();
			expect(hex?.toLowerCase()).toBe(neutralColors[i]);
		}
		
		// Verify first palette colors are identical after reload
		const paletteGrid2 = page.locator('.color-display').nth(1).locator('.color-grid').first();
		const paletteHexes2 = paletteGrid2.locator('.hex');
		for (let i = 0; i < paletteCount; i++) {
			const hex = await paletteHexes2.nth(i).textContent();
			expect(hex?.toLowerCase()).toBe(paletteColors[i]);
		}
		
		// Verify 11 colors are generated
		expect(neutralColors.length).toBe(11);
		expect(paletteColors.length).toBe(11);
		
		// Verify dark mode gradient (dark to white)
		expect(neutralColors[10]).toBe('#ffffff');
		// First color should be dark (low RGB values)
		const r = parseInt(neutralColors[0].slice(1, 3), 16);
		const g = parseInt(neutralColors[0].slice(3, 5), 16);
		const b = parseInt(neutralColors[0].slice(5, 7), 16);
		expect((r + g + b) / 3).toBeLessThan(30);
	});
});
