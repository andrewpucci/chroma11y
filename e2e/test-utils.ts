import { Page, expect } from '@playwright/test';
import type { AxeResults } from 'axe-core';

/**
 * Wait for the Svelte Color Generator app to be fully loaded
 */
export async function waitForAppReady(page: Page): Promise<void> {
	await page.waitForSelector('h1:has-text("Svelte Color Generator")', { timeout: 10000 });
	await expect(page.locator('#baseColor')).toBeVisible();
	await expect(page.locator('.color-display').first()).toBeVisible();
}

/**
 * Wait for color generation to complete
 */
export async function waitForColorGeneration(page: Page): Promise<void> {
	// Wait for color swatches to be visible and have content
	await page.waitForFunction(() => {
		const colorSwatches = document.querySelectorAll('.color-swatch');
		return colorSwatches.length > 0;
	}, { timeout: 5000 });
}

/**
 * Get the current theme from the page
 */
export async function getCurrentTheme(page: Page): Promise<string> {
	return await page.evaluate(() => {
		const state = (window as unknown as { colorState?: { currentTheme?: string } }).colorState;
		return state?.currentTheme || 'light';
	});
}

/**
 * Get the current base color value
 */
export async function getBaseColor(page: Page): Promise<string> {
	return await page.locator('#baseColor').inputValue();
}

/**
 * Set the base color and wait for generation
 */
export async function setBaseColor(page: Page, color: string): Promise<void> {
	await page.locator('#baseColor').fill(color);
	await waitForColorGeneration(page);
}

/**
 * Get count of generated color swatches
 */
export async function getColorSwatchCount(page: Page): Promise<number> {
	return await page.locator('.color-swatch').count();
}

/**
 * Get background color of a specific color swatch
 */
export async function getSwatchColor(page: Page, index: number = 0): Promise<string> {
	const swatch = page.locator('.color-swatch').nth(index);
	return await swatch.evaluate(el => getComputedStyle(el).backgroundColor);
}

/**
 * Toggle theme and wait for transition
 */
export async function toggleTheme(page: Page): Promise<void> {
	const themeToggle = page.locator('.theme-toggle');
	await themeToggle.click();
	await page.waitForTimeout(1000); // Wait for theme transition
}

/**
 * Set a slider value and wait for generation
 */
export async function setSliderValue(page: Page, selector: string, value: string): Promise<void> {
	const slider = page.locator(selector);
	await slider.fill(value);
	await waitForColorGeneration(page);
}

/**
 * Set a number input value and wait for generation
 */
export async function setNumberInput(page: Page, index: number, value: string): Promise<void> {
	const numberInputs = page.locator('input[type="number"]');
	const targetInput = numberInputs.nth(index);
	await targetInput.fill(value);
	await waitForColorGeneration(page);
}

/**
 * Check if accessibility violations exist for specific impact level
 */
export function hasViolationsByImpact(violations: AxeResults['violations'], impact: string): boolean {
	return violations.some(v => v.impact === impact);
}

/**
 * Get violations by impact level
 */
export function getViolationsByImpact(violations: AxeResults['violations'], impact: string): AxeResults['violations'] {
	return violations.filter(v => v.impact === impact);
}
