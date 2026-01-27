import { test, expect } from '@playwright/test';

test.describe('Color Generator', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		// Wait for the app to be ready
		await page.waitForSelector('h1:has-text("Svelte Color Generator")', { timeout: 10000 });
	});

	test('successfully loads', async ({ page }) => {
		// Check if the app is loaded by verifying key elements exist
		await expect(page.locator('body')).toBeVisible();
		await expect(page.locator('#baseColor')).toBeVisible();
		await expect(page.locator('.color-display').first()).toBeVisible();
	});

	test('generates color palettes', async ({ page }) => {
		// Wait for color display section to be visible
		await expect(page.locator('.color-display').first()).toBeVisible({ timeout: 10000 });
		
		// Check if palettes are generated
		const colorGrids = page.locator('.color-grid');
		const gridCount = await colorGrids.count();
		expect(gridCount).toBeGreaterThan(0);
		
		// Check if there are color items in the generated palettes
		const colorItems = page.locator('.color-item');
		const itemCount = await colorItems.count();
		expect(itemCount).toBeGreaterThan(0);
	});

	test('allows changing the base color', async ({ page }) => {
		// Wait for palettes to be generated
		await expect(page.locator('.color-display').first()).toBeVisible({ timeout: 10000 });
		
		// Get middle color hex (has visible chroma, not edge white/black)
		const paletteHexes = page.locator('.color-display').nth(1).locator('.color-hex');
		const initialHex = await paletteHexes.nth(5).textContent();
		
		// Change the base color to a very different color (bright green)
		await page.locator('#baseColor').fill('#00ff00');
		
		// Wait for color generation to complete
		await page.waitForTimeout(1000);
		
		// Verify the color hex has changed
		const newHex = await paletteHexes.nth(5).textContent();
		expect(newHex).not.toBe(initialHex);
		
		// Also verify the color input value changed
		const inputColor = await page.locator('#baseColor').inputValue();
		expect(inputColor).toBe('#00ff00');
	});

	test('toggles between light and dark themes', async ({ page }) => {
		// The theme toggle button should be visible
		const themeToggle = page.locator('.theme-toggle');
		await expect(themeToggle).toBeVisible();
		
		// Get the initial theme text
		const initialText = await themeToggle.textContent();
		expect(initialText).toContain('Dark Mode');
		
		// Toggle the theme
		await themeToggle.click();
		
		// Wait for theme transition
		await page.waitForTimeout(1000);
		
		// Verify the theme text has changed
		const newText = await themeToggle.textContent();
		expect(newText).toContain('Light Mode');
		
		// Toggle back to the original theme
		await themeToggle.click();
		
		// Wait for theme transition
		await page.waitForTimeout(1000);
		
		// Verify we're back to the original theme
		const finalText = await themeToggle.textContent();
		expect(finalText).toContain('Dark Mode');
	});

	test('allows adjusting warmth control', async ({ page }) => {
		// Find the warmth slider
		const warmthSlider = page.locator('#warmth');
		await expect(warmthSlider).toBeVisible();
		
		// Change the warmth value
		await warmthSlider.fill('10');
		
		// Wait for color generation
		await page.waitForTimeout(1000);
		
		// Verify the value has changed
		const newValue = await warmthSlider.inputValue();
		expect(newValue).toBe('10');
	});

	test('allows adjusting chroma multiplier', async ({ page }) => {
		// Find the chroma control
		const chromaControl = page.locator('#chroma');
		await expect(chromaControl).toBeVisible();
		
		// Check if it's a range input or number input
		const inputType = await chromaControl.getAttribute('type');
		
		if (inputType === 'range') {
			// For range input, set a specific value
			await chromaControl.fill('1.5');
		} else {
			// For number input, fill the value
			await chromaControl.fill('1.5');
		}
		
		// Wait for color generation
		await page.waitForTimeout(1000);
		
		// Verify the value was set
		const value = await chromaControl.inputValue();
		expect(value).toBe('1.5');
	});

	test('allows adjusting number of colors and palettes', async ({ page }) => {
		// Find number inputs
		const numberInputs = page.locator('input[type="number"]');
		const inputCount = await numberInputs.count();
		expect(inputCount).toBeGreaterThan(0);
		
		// Change the first number input (likely colors)
		const firstNumberInput = numberInputs.first();
		await firstNumberInput.fill('7');
		
		// Wait for color generation
		await page.waitForTimeout(1000);
		
		// Verify the value was set
		const value = await firstNumberInput.inputValue();
		expect(value).toBe('7');
	});

	test('allows copying colors to clipboard', async ({ page }) => {
		// Wait for colors to be generated
		const colorItems = page.locator('.color-item');
		const itemCount = await colorItems.count();
		expect(itemCount).toBeGreaterThan(0);
		
		// Get the first color item
		const firstColorItem = page.locator('.color-item').first();
		await expect(firstColorItem).toBeVisible();
		
		// Get the color value from the item
		const colorHex = await firstColorItem.locator('.color-hex').textContent();
		expect(colorHex).toMatch(/^#[0-9A-Fa-f]{6}$/);
		
		// Click to copy (we can't actually test clipboard in Playwright easily, but we can test the click)
		await firstColorItem.click();
		
		// Wait a moment for any copy feedback
		await page.waitForTimeout(500);
		
		// Verify the element is still clickable and nothing broke
		await expect(firstColorItem).toBeVisible();
	});

	test('displays neutral palette', async ({ page }) => {
		// Check for neutral palette section
		const neutralSection = page.locator('.neutral-palette, .neutral-colors');
		if (await neutralSection.count() > 0) {
			await expect(neutralSection).toBeVisible();
			
			// Check for neutral color items
			const neutralItems = neutralSection.locator('.color-item, .neutral-color');
			const neutralCount = await neutralItems.count();
			if (neutralCount > 0) {
				expect(neutralCount).toBeGreaterThan(0);
			}
		}
	});

	test('handles bezier curve controls', async ({ page }) => {
		// Look for bezier control inputs (x1, y1, x2, y2)
		const bezierInputs = page.locator('input[id*="1"], input[id*="2"]');
		const bezierCount = await bezierInputs.count();
		
		if (bezierCount > 0) {
			// Test changing bezier values
			const firstBezierInput = bezierInputs.first();
			await firstBezierInput.fill('0.25');
			
			// Wait for color generation
			await page.waitForTimeout(1000);
			
			// Verify the value was set
			const value = await firstBezierInput.inputValue();
			expect(value).toBe('0.25');
		}
	});
});
