/**
 * Export Format Validation Tests
 * Verifies that rendered app state is preserved in real downloaded exports.
 */

import * as fs from 'fs';

import { test, expect, type Page } from '@playwright/test';

import { waitForAppReady, waitForColorGeneration } from './test-utils';

async function downloadFileContent(
  page: Page,
  buttonName: string
): Promise<{ filename: string; content: string }> {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: buttonName }).click();

  const download = await downloadPromise;
  const path = await download.path();

  if (!path) {
    throw new Error(`Expected a downloaded file for ${buttonName}`);
  }

  return {
    filename: download.suggestedFilename(),
    content: fs.readFileSync(path, 'utf-8')
  };
}

test.describe('Export Format Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await waitForColorGeneration(page);
  });

  test('JSON export mirrors the rendered neutral palette', async ({ page }) => {
    const displayedNeutrals = (
      await page.getByTestId('neutral-palette').locator('.hex').allTextContents()
    ).map((hex) => hex.trim().toLowerCase());

    const { filename, content } = await downloadFileContent(page, 'Export JSON design tokens');
    const parsed = JSON.parse(content) as Record<
      string,
      Record<string, { $value: { hex: string } }>
    >;

    expect(filename).toBe('color-tokens.json');
    expect(Object.keys(parsed.gray)).toHaveLength(displayedNeutrals.length);

    const exportedNeutrals = displayedNeutrals.map((_, index) => {
      const step = String(index * 10);
      return parsed.gray[step].$value.hex.toLowerCase();
    });

    expect(exportedNeutrals).toEqual(displayedNeutrals);
  });

  test('JSON export updates generated palettes after base color changes', async ({ page }) => {
    const initialExport = JSON.parse(
      (await downloadFileContent(page, 'Export JSON design tokens')).content
    ) as Record<string, unknown>;

    const paletteHexes = page
      .getByTestId('generated-palettes')
      .locator('.swatches')
      .first()
      .locator('.hex');
    const initialSignature = (await paletteHexes.allTextContents())
      .map((hex) => hex.trim())
      .join('|');

    await page.locator('#baseColor').fill('#ff0000');
    await page.locator('#baseColor').press('Tab');

    await expect
      .poll(async () => (await paletteHexes.allTextContents()).map((hex) => hex.trim()).join('|'))
      .not.toBe(initialSignature);

    const updatedExport = JSON.parse(
      (await downloadFileContent(page, 'Export JSON design tokens')).content
    ) as Record<string, unknown>;

    expect(updatedExport.gray).toEqual(initialExport.gray);
    expect(updatedExport).not.toEqual(initialExport);
  });

  test('CSS export uses the currently rendered OKLCH display values', async ({ page }) => {
    const displaySpace = page.locator('#display-color-space');
    await displaySpace.selectOption('oklch');
    await expect(displaySpace).toHaveValue('oklch');

    const swatchValue =
      (
        await page.getByTestId('neutral-palette').locator('.color-swatch .hex').nth(1).textContent()
      )?.trim() ?? '';

    expect(swatchValue).toMatch(/^oklch\(/i);

    const { filename, content } = await downloadFileContent(page, 'Export CSS custom properties');

    expect(filename).toBe('colors.css');
    expect(content).toContain(':root {');
    expect(content).toContain(`--color-gray-10: ${swatchValue};`);
  });

  test('SCSS export downloads variable declarations', async ({ page }) => {
    const { filename, content } = await downloadFileContent(page, 'Export SCSS variables');

    expect(filename).toBe('colors.scss');
    expect(content).toContain('$color-gray-0:');
    expect(content).toMatch(/\$color-[a-z0-9-]+-\d+:\s*#[0-9a-f]{6}/i);
    expect(content).not.toContain(':root');
  });
});
