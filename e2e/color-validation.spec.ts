import { test, expect } from '@playwright/test';

/**
 * Color validation test - validates current implementation produces
 * expected deterministic color output for given configuration
 */

test.describe('Color Algorithm Validation', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForSelector('h1:has-text("Svelte Color Generator")', { timeout: 10000 });
		await page.waitForTimeout(1000);
	});

	test('captures and validates light mode colors against legacy', async ({ page }) => {
		// Set the exact configuration from legacy test
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
		
		// Expected values from current implementation (documented algorithm)
		const expectedNeutrals = [
			'#ffffff', '#f1f3f5', '#d5d7d9', '#b6b8b9', '#97999b',
			'#797b7c', '#5e6062', '#454748', '#2c2e30', '#151718', '#000000'
		];
		
		const expectedPalette0 = [
			'#ffffff', '#ecf3ff', '#c2d8ff', '#90b8ff', '#5b96ff',
			'#3a75e1', '#295bb7', '#1b428a', '#0f2b5d', '#051433', '#000000'
		];
		
		const expectedPalette4 = [
			'#ffffff', '#ffefec', '#ffc8c0', '#ff968b', '#f1665b',
			'#ce433c', '#a6302b', '#7d201d', '#541310', '#2e0605', '#000000'
		];
		
		// Capture actual neutral colors
		const neutralSection = page.locator('.color-display').first();
		const neutralHexes = neutralSection.locator('.hex');
		const actualNeutrals: string[] = [];
		const neutralCount = await neutralHexes.count();
		for (let i = 0; i < neutralCount; i++) {
			const hex = await neutralHexes.nth(i).textContent();
			actualNeutrals.push(hex?.toLowerCase() || '');
		}
		
		// Capture actual palette 0 colors
		const palette0Grid = page.locator('.color-display').nth(1).locator('.color-grid').first();
		const palette0Hexes = palette0Grid.locator('.hex');
		const actualPalette0: string[] = [];
		const palette0Count = await palette0Hexes.count();
		for (let i = 0; i < palette0Count; i++) {
			const hex = await palette0Hexes.nth(i).textContent();
			actualPalette0.push(hex?.toLowerCase() || '');
		}
		
		// Capture actual palette 4 colors
		const palette4Grid = page.locator('.color-display').nth(1).locator('.color-grid').nth(4);
		const palette4Hexes = palette4Grid.locator('.hex');
		const actualPalette4: string[] = [];
		const palette4Count = await palette4Hexes.count();
		for (let i = 0; i < palette4Count; i++) {
			const hex = await palette4Hexes.nth(i).textContent();
			actualPalette4.push(hex?.toLowerCase() || '');
		}
		
		// Log comparison results
		console.log('\n' + '='.repeat(80));
		console.log('COLOR VALIDATION RESULTS');
		console.log('='.repeat(80));
		
		console.log('\nNEUTRAL COLORS COMPARISON:');
		let neutralMatches = 0;
		const neutralDifferences: string[] = [];
		for (let i = 0; i < expectedNeutrals.length; i++) {
			const match = actualNeutrals[i] === expectedNeutrals[i];
			if (match) {
				neutralMatches++;
				console.log(`  ✓ [${i}] ${actualNeutrals[i]} === ${expectedNeutrals[i]}`);
			} else {
				console.log(`  ✗ [${i}] ${actualNeutrals[i]} !== ${expectedNeutrals[i]}`);
				neutralDifferences.push(`Step ${i}: ${actualNeutrals[i]} vs ${expectedNeutrals[i]}`);
			}
		}
		console.log(`\nNeutral Match Rate: ${neutralMatches}/${expectedNeutrals.length} (${(neutralMatches/expectedNeutrals.length*100).toFixed(1)}%)`);
		
		console.log('\nPALETTE 0 (BLUE) COMPARISON:');
		let palette0Matches = 0;
		const palette0Differences: string[] = [];
		for (let i = 0; i < expectedPalette0.length; i++) {
			const match = actualPalette0[i] === expectedPalette0[i];
			if (match) {
				palette0Matches++;
				console.log(`  ✓ [${i}] ${actualPalette0[i]} === ${expectedPalette0[i]}`);
			} else {
				console.log(`  ✗ [${i}] ${actualPalette0[i]} !== ${expectedPalette0[i]}`);
				palette0Differences.push(`Step ${i}: ${actualPalette0[i]} vs ${expectedPalette0[i]}`);
			}
		}
		console.log(`\nPalette 0 Match Rate: ${palette0Matches}/${expectedPalette0.length} (${(palette0Matches/expectedPalette0.length*100).toFixed(1)}%)`);
		
		console.log('\nPALETTE 4 (RED/PINK) COMPARISON:');
		let palette4Matches = 0;
		const palette4Differences: string[] = [];
		for (let i = 0; i < expectedPalette4.length; i++) {
			const match = actualPalette4[i] === expectedPalette4[i];
			if (match) {
				palette4Matches++;
				console.log(`  ✓ [${i}] ${actualPalette4[i]} === ${expectedPalette4[i]}`);
			} else {
				console.log(`  ✗ [${i}] ${actualPalette4[i]} !== ${expectedPalette4[i]}`);
				palette4Differences.push(`Step ${i}: ${actualPalette4[i]} vs ${expectedPalette4[i]}`);
			}
		}
		console.log(`\nPalette 4 Match Rate: ${palette4Matches}/${expectedPalette4.length} (${(palette4Matches/expectedPalette4.length*100).toFixed(1)}%)`);
		
		console.log('\n' + '='.repeat(80));
		console.log('SUMMARY:');
		const totalMatches = neutralMatches + palette0Matches + palette4Matches;
		const totalColors = expectedNeutrals.length + expectedPalette0.length + expectedPalette4.length;
		console.log(`Total Match Rate: ${totalMatches}/${totalColors} (${(totalMatches/totalColors*100).toFixed(1)}%)`);
		
		if (neutralDifferences.length > 0) {
			console.log('\nNeutral Differences:');
			neutralDifferences.forEach(diff => console.log(`  - ${diff}`));
		}
		if (palette0Differences.length > 0) {
			console.log('\nPalette 0 Differences:');
			palette0Differences.forEach(diff => console.log(`  - ${diff}`));
		}
		if (palette4Differences.length > 0) {
			console.log('\nPalette 4 Differences:');
			palette4Differences.forEach(diff => console.log(`  - ${diff}`));
		}
		console.log('='.repeat(80));
		
		// Test requires 100% match with expected values
		expect(totalMatches).toBe(totalColors);
	});
});
