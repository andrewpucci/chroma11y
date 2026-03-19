/**
 * History Tests
 * Focuses on browser-level history behavior that DOM tests cannot cover well.
 */

import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

import { waitForAppReady } from './test-utils';

const undoShortcut = process.platform === 'darwin' ? 'Meta+KeyZ' : 'Control+KeyZ';
const redoShortcut = process.platform === 'darwin' ? 'Meta+Shift+KeyZ' : 'Control+Shift+KeyZ';
const ctrlYShortcut = 'Control+KeyY';

async function clickNativeSpinbuttonIncrement(page: Page, input: Locator): Promise<void> {
  const box = await input.boundingBox();
  const previousValue = Number(await input.inputValue());

  if (!box) {
    throw new Error('Spinbutton bounding box was unavailable');
  }

  const candidates = [
    { dx: 20, dy: 10 },
    { dx: 20, dy: 14 },
    { dx: 18, dy: 10 },
    { dx: 22, dy: 10 },
    { dx: 16, dy: 10 },
    { dx: 24, dy: 10 },
    { dx: 20, dy: 8 },
    { dx: 20, dy: 16 },
    { dx: 28, dy: 10 },
    { dx: 32, dy: 10 }
  ];

  for (const candidate of candidates) {
    await page.mouse.click(box.x + box.width - candidate.dx, box.y + candidate.dy);

    if (Number(await input.inputValue()) === previousValue + 1) {
      return;
    }
  }

  throw new Error('Failed to locate the native spinbutton increment hotspot');
}

async function incrementSpinbuttonToValue(
  page: Page,
  input: Locator,
  targetValue: number
): Promise<void> {
  while (Number(await input.inputValue()) < targetValue) {
    await clickNativeSpinbuttonIncrement(page, input);
  }
}

async function expectUrlParams(
  page: Page,
  expectedParams: Record<string, string | null>
): Promise<void> {
  for (const [key, value] of Object.entries(expectedParams)) {
    await expect
      .poll(() => new URL(page.url()).searchParams.get(key))
      .toBe(value, {
        message: `Expected URL param ${key} to equal ${value}`
      });
  }
}

async function startAnnouncementCapture(page: Page): Promise<void> {
  await page.evaluate(() => {
    const browserWindow = window as typeof window & {
      __announcementMessages?: string[];
      __announcementListenerInstalled?: boolean;
    };

    browserWindow.__announcementMessages = [];

    if (browserWindow.__announcementListenerInstalled) {
      return;
    }

    window.addEventListener('app:announce', (event) => {
      const customEvent = event as CustomEvent<string>;
      browserWindow.__announcementMessages?.push(customEvent.detail);
    });

    browserWindow.__announcementListenerInstalled = true;
  });
}

async function clearAnnouncementMessages(page: Page): Promise<void> {
  await page.evaluate(() => {
    const browserWindow = window as typeof window & {
      __announcementMessages?: string[];
    };

    browserWindow.__announcementMessages = [];
  });
}

async function getAnnouncementMessages(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const browserWindow = window as typeof window & {
      __announcementMessages?: string[];
    };

    return [...(browserWindow.__announcementMessages ?? [])];
  });
}

test.describe('Undo and Redo History', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForAppReady(page);
  });

  test('announces undo, redo, and multi-step history jumps', async ({ page }) => {
    const themeSelect = page.getByRole('combobox', { name: 'Theme preference' });
    const displayColorSpaceSelect = page.getByRole('combobox', {
      name: 'Display color space format'
    });
    const contrastAlgorithmSelect = page.getByRole('combobox', { name: 'Contrast algorithm' });

    await startAnnouncementCapture(page);

    await themeSelect.selectOption('dark');
    await expect(themeSelect).toHaveValue('dark');

    await displayColorSpaceSelect.selectOption('rgb');
    await expect(displayColorSpaceSelect).toHaveValue('rgb');

    await contrastAlgorithmSelect.selectOption('APCA');
    await expect(contrastAlgorithmSelect).toHaveValue('APCA');

    await clearAnnouncementMessages(page);

    await page.getByRole('button', { name: 'Undo last change' }).click();
    await expect
      .poll(async () => (await getAnnouncementMessages(page)).at(-1))
      .toBe('Undid Contrast algorithm changed');

    await page.getByRole('button', { name: 'Redo last change' }).click();
    await expect
      .poll(async () => (await getAnnouncementMessages(page)).at(-1))
      .toBe('Redid Contrast algorithm changed');

    await page.getByRole('button', { name: 'Show undo history' }).click();
    await page.getByRole('menuitem', { name: 'Undo to Theme preference changed' }).click();
    await expect
      .poll(async () => (await getAnnouncementMessages(page)).at(-1))
      .toBe('Undid 2 steps to Theme preference changed');

    await page.getByRole('button', { name: 'Show redo history' }).click();
    await page.getByRole('menuitem', { name: 'Redo to Contrast algorithm changed' }).click();
    await expect
      .poll(async () => (await getAnnouncementMessages(page)).at(-1))
      .toBe('Redid 2 steps to Contrast algorithm changed');
  });

  test('clears redo history after a new branching edit', async ({ page }) => {
    const baseColorInput = page.locator('#baseColorHex');
    const warmthInput = page.getByRole('spinbutton', { name: 'Warmth value input' });

    await baseColorInput.fill('#00ff00');
    await baseColorInput.blur();

    await warmthInput.fill('12');
    await warmthInput.blur();

    await page.getByRole('button', { name: 'Undo last change' }).click();
    await expect(warmthInput).toHaveValue('-7');

    await warmthInput.fill('18');
    await warmthInput.blur();

    await expect(page.getByRole('button', { name: 'Redo last change' })).toBeDisabled();
    await expect(warmthInput).toHaveValue('18');
  });

  test('keeps number input shortcut undo in sync after native stepper clicks', async ({ page }) => {
    const numColorsInput = page.getByRole('spinbutton', {
      name: 'Number of colors value input'
    });
    const undoButton = page.getByRole('button', { name: 'Undo last change' });

    await clickNativeSpinbuttonIncrement(page, numColorsInput);
    await expect(numColorsInput).toHaveValue('12');

    await clickNativeSpinbuttonIncrement(page, numColorsInput);
    await expect(numColorsInput).toHaveValue('13');
    await expect(undoButton).toBeEnabled();

    await page.keyboard.press(undoShortcut);
    await expect(numColorsInput).toHaveValue('12');
    await expect(undoButton).toBeEnabled();

    await page.keyboard.press(undoShortcut);
    await expect(numColorsInput).toHaveValue('11');
    await expect(undoButton).toBeDisabled();
  });

  test('keeps mixed-field keyboard undo and redo shortcuts aligned', async ({ page }) => {
    const numColorsInput = page.getByRole('spinbutton', {
      name: 'Number of colors value input'
    });
    const contrastModeSelect = page.getByRole('combobox', { name: 'Contrast Mode' });
    const displayColorSpaceSelect = page.getByRole('combobox', {
      name: 'Display color space format'
    });
    const lowContrastInput = page.getByRole('textbox', {
      name: 'Low contrast color hex value'
    });

    await incrementSpinbuttonToValue(page, numColorsInput, 13);
    await expect(numColorsInput).toHaveValue('13');

    await contrastModeSelect.selectOption('manual');
    await expect(contrastModeSelect).toHaveValue('manual');
    const manualLowColorBeforeEdit = await lowContrastInput.inputValue();

    await lowContrastInput.fill('#ff0000');
    await lowContrastInput.blur();
    await expect(lowContrastInput).toHaveValue('#ff0000');

    await displayColorSpaceSelect.selectOption('rgb');
    await expect(displayColorSpaceSelect).toHaveValue('rgb');

    await page.keyboard.press(undoShortcut);
    await expect(displayColorSpaceSelect).toHaveValue('hex');
    await expect(numColorsInput).toHaveValue('13');
    await expect(contrastModeSelect).toHaveValue('manual');
    await expect(lowContrastInput).toHaveValue('#ff0000');

    await page.keyboard.press(undoShortcut);
    await expect(displayColorSpaceSelect).toHaveValue('hex');
    await expect(lowContrastInput).toHaveValue(manualLowColorBeforeEdit);

    await page.keyboard.press(redoShortcut);
    await expect(lowContrastInput).toHaveValue('#ff0000');
    await expect(displayColorSpaceSelect).toHaveValue('hex');

    await page.keyboard.press(ctrlYShortcut);
    await expect(displayColorSpaceSelect).toHaveValue('rgb');
    await expect(numColorsInput).toHaveValue('13');
    await expect(contrastModeSelect).toHaveValue('manual');
    await expect(lowContrastInput).toHaveValue('#ff0000');
  });

  test('keeps encoded URL params aligned with history navigation', async ({ page }) => {
    const numColorsInput = page.getByRole('spinbutton', {
      name: 'Number of colors value input'
    });
    const contrastModeSelect = page.getByRole('combobox', { name: 'Contrast Mode' });
    const displayColorSpaceSelect = page.getByRole('combobox', {
      name: 'Display color space format'
    });
    const undoButton = page.getByRole('button', { name: 'Undo last change' });
    const redoButton = page.getByRole('button', { name: 'Redo last change' });

    await incrementSpinbuttonToValue(page, numColorsInput, 13);
    await contrastModeSelect.selectOption('manual');
    await displayColorSpaceSelect.selectOption('rgb');

    await expectUrlParams(page, {
      nc: '13',
      m: 'manual',
      ds: 'rgb'
    });

    await undoButton.click();
    await expect(displayColorSpaceSelect).toHaveValue('hex');
    await expectUrlParams(page, {
      nc: '13',
      m: 'manual',
      ds: null
    });

    await redoButton.click();
    await expect(displayColorSpaceSelect).toHaveValue('rgb');
    await expectUrlParams(page, {
      nc: '13',
      m: 'manual',
      ds: 'rgb'
    });
  });
});
