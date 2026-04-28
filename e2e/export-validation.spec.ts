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

async function renameNeutralPalette(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: 'Edit name for neutral palette' }).click();
  const input = page.getByRole('textbox', { name: 'Neutral palette name' });
  await input.fill(name);
  await input.press('Enter');
}

async function renameGeneratedPalette(page: Page, index: number, name: string): Promise<void> {
  await page
    .getByRole('button', { name: `Edit name for palette ${index + 1}`, exact: true })
    .click();
  const input = page.getByRole('textbox', { name: `Palette ${index + 1} name`, exact: true });
  await input.fill(name);
  await input.press('Enter');
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

    const [neutralKey] = Object.keys(parsed);
    const exportedNeutralPalette = parsed[neutralKey] as Record<
      string,
      { $value: { hex: string } }
    >;

    expect(filename).toBe('color-tokens.json');
    expect(Object.keys(exportedNeutralPalette)).toHaveLength(displayedNeutrals.length);

    const exportedNeutrals = displayedNeutrals.map((_, index) => {
      const step = String(index * 10);
      return exportedNeutralPalette[step].$value.hex.toLowerCase();
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
    expect(content).toContain(`${swatchValue};`);
    expect(content).toMatch(/--color-[a-z0-9-]+-10:\s*oklch\(/i);
  });

  test('SCSS export downloads variable declarations', async ({ page }) => {
    const { filename, content } = await downloadFileContent(page, 'Export SCSS variables');

    expect(filename).toBe('colors.scss');
    expect(content).toMatch(/\$color-[a-z0-9-]+-0:/i);
    expect(content).toMatch(/\$color-[a-z0-9-]+-\d+:\s*#[0-9a-f]{6}/i);
    expect(content).not.toContain(':root');
  });

  test('preview menu opens dialog and downloads from inside it', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.getByRole('button', { name: 'More options for CSS custom properties' }).click();
    await page.getByRole('menuitem', { name: 'Preview…' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('tab', { name: 'CSS', selected: true })).toBeVisible();

    const previewContent = await dialog.getByTestId('export-preview-content').textContent();
    expect(previewContent ?? '').toContain(':root {');
    expect(previewContent ?? '').toMatch(/--color-[a-z0-9-]+-0:/i);

    await dialog.getByRole('tab', { name: 'SCSS' }).click();
    const scssContent = await dialog.getByTestId('export-preview-content').textContent();
    expect(scssContent ?? '').toMatch(/\$color-[a-z0-9-]+-0:/i);

    const downloadPromise = page.waitForEvent('download');
    await dialog
      .getByRole('button', {
        name: /download scss as palette-1\.scss|download scss as colors\.scss/i
      })
      .click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('colors.scss');

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('chevron Copy menu writes the chosen format to the clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.getByRole('button', { name: 'More options for JSON design tokens' }).click();
    await page.getByRole('menuitem', { name: 'Copy' }).click();

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    const parsed = JSON.parse(clipboard) as Record<string, unknown>;
    expect(typeof parsed).toBe('object');
    expect(Object.keys(parsed).length).toBeGreaterThan(0);
  });

  test('per-palette Copy button scopes preview to that palette only', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const firstPaletteSwatchHexes = await page
      .getByTestId('generated-palettes')
      .locator('.swatches')
      .first()
      .locator('.hex')
      .allTextContents();
    const firstHex = firstPaletteSwatchHexes[0]?.trim() ?? '';
    expect(firstHex).not.toEqual('');

    await page.getByTestId('copy-palette-0').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('tab', { name: 'List', selected: true })).toBeVisible();

    const content = (await dialog.getByTestId('export-preview-content').textContent()) ?? '';
    expect(content).toContain(firstHex);

    const neutralHexes = await page
      .getByTestId('neutral-palette')
      .locator('.color-swatch .hex')
      .allTextContents();
    const aNeutralHex = neutralHexes[0]?.trim() ?? '';
    if (aNeutralHex && aNeutralHex !== firstHex) {
      expect(content).not.toContain(aNeutralHex);
    }
  });

  test('neutral palette Copy button scopes preview to neutrals only', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const neutralHexes = (
      await page.getByTestId('neutral-palette').locator('.color-swatch .hex').allTextContents()
    ).map((hex) => hex.trim());

    await page.getByTestId('copy-neutral-palette').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const content = (await dialog.getByTestId('export-preview-content').textContent()) ?? '';
    for (const hex of neutralHexes) {
      expect(content).toContain(hex);
    }

    const generatedHexes = await page
      .getByTestId('generated-palettes')
      .locator('.swatches')
      .first()
      .locator('.hex')
      .allTextContents();
    const aGeneratedHex = generatedHexes[0]?.trim() ?? '';
    if (aGeneratedHex && !neutralHexes.includes(aGeneratedHex)) {
      expect(content).not.toContain(aGeneratedHex);
    }
  });

  test('custom neutral and palette names round-trip through URL and exports', async ({ page }) => {
    await renameNeutralPalette(page, 'Canvas');
    await renameGeneratedPalette(page, 0, 'Ocean');

    await page.waitForFunction(
      () => {
        const params = new URL(window.location.href).searchParams;
        return params.get('nn') === 'Canvas' && params.has('pn');
      },
      { timeout: 5000 }
    );

    const shareUrl = page.url();
    await page.goto(shareUrl);
    await waitForAppReady(page);
    await waitForColorGeneration(page);

    const jsonExport = JSON.parse(
      (await downloadFileContent(page, 'Export JSON design tokens')).content
    ) as Record<string, unknown>;
    expect(jsonExport.canvas).toBeTruthy();
    expect(jsonExport.ocean).toBeTruthy();

    const cssExport = (await downloadFileContent(page, 'Export CSS custom properties')).content;
    expect(cssExport).toContain('--color-canvas-0:');
    expect(cssExport).toContain('--color-ocean-0:');

    const scssExport = (await downloadFileContent(page, 'Export SCSS variables')).content;
    expect(scssExport).toContain('$color-canvas-0:');
    expect(scssExport).toContain('$color-ocean-0:');
  });
});
