import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PageScheduler } from '$lib/pageScheduler';
import PageContent from './PageContent.svelte';

interface HistoryUiState {
  numColors: string;
  contrastMode: string;
  lowContrastValue: string | null;
  displayColorSpace: string;
  gamutSpace: string;
  gamutWarningsVisible: boolean;
  themePreference: string;
  contrastAlgorithm: string;
  oklchDigits: string | null;
}

interface ControllablePageScheduler extends PageScheduler {
  flushHistoryResync(): void;
}

type HistoryAction =
  | { type: 'setNumColors'; value: number }
  | { type: 'setContrastMode'; value: 'auto' | 'manual' }
  | { type: 'setLowContrastColor'; value: string }
  | { type: 'setDisplayColorSpace'; value: 'hex' | 'rgb' | 'oklch' | 'hsl' }
  | { type: 'setGamutSpace'; value: 'srgb' | 'p3' | 'rec2020' }
  | { type: 'toggleGamutWarnings'; value: boolean }
  | { type: 'setThemePreference'; value: 'light' | 'dark' | 'auto' }
  | { type: 'setContrastAlgorithm'; value: 'WCAG' | 'APCA' }
  | { type: 'setOklchDigits'; value: number }
  | { type: 'reset' };

function getNumColorsInput(): HTMLInputElement {
  return screen.getByRole('spinbutton', {
    name: /number of colors value input/i
  }) as HTMLInputElement;
}

function getContrastModeSelect(): HTMLSelectElement {
  return screen.getByRole('combobox', { name: /contrast mode/i }) as HTMLSelectElement;
}

function getLowContrastInput(): HTMLInputElement | null {
  return screen.queryByRole('textbox', {
    name: /low contrast color hex value/i
  }) as HTMLInputElement | null;
}

function getDisplayColorSpaceSelect(): HTMLSelectElement {
  return screen.getByRole('combobox', {
    name: /display color space format/i
  }) as HTMLSelectElement;
}

function getGamutSpaceSelect(): HTMLSelectElement {
  return screen.getByRole('combobox', { name: /gamut mapping target/i }) as HTMLSelectElement;
}

function getGamutWarningsCheckbox(): HTMLInputElement {
  return screen.getByRole('checkbox', {
    name: /show gamut warnings on mapped swatches/i
  }) as HTMLInputElement;
}

function getThemeSelect(): HTMLSelectElement {
  return screen.getByRole('combobox', { name: /theme preference/i }) as HTMLSelectElement;
}

function getContrastAlgorithmSelect(): HTMLSelectElement {
  return screen.getByRole('combobox', { name: /contrast algorithm/i }) as HTMLSelectElement;
}

function getOklchDigitsInput(): HTMLInputElement | null {
  return screen.queryByRole('spinbutton', {
    name: /oklch significant digits value input/i
  }) as HTMLInputElement | null;
}

function getUndoButton(): HTMLButtonElement {
  return screen.getByRole('button', { name: /undo last change/i }) as HTMLButtonElement;
}

function getRedoButton(): HTMLButtonElement {
  return screen.getByRole('button', { name: /redo last change/i }) as HTMLButtonElement;
}

function getUndoHistoryButton(): HTMLButtonElement {
  return screen.getByRole('button', { name: /show undo history/i }) as HTMLButtonElement;
}

function getBaseColorHexInput(): HTMLInputElement {
  return screen.getByRole('textbox', {
    name: /base color hex value/i
  }) as HTMLInputElement;
}

function readUiState(): HistoryUiState {
  return {
    numColors: getNumColorsInput().value,
    contrastMode: getContrastModeSelect().value,
    lowContrastValue: getLowContrastInput()?.value ?? null,
    displayColorSpace: getDisplayColorSpaceSelect().value,
    gamutSpace: getGamutSpaceSelect().value,
    gamutWarningsVisible: getGamutWarningsCheckbox().checked,
    themePreference: getThemeSelect().value,
    contrastAlgorithm: getContrastAlgorithmSelect().value,
    oklchDigits: getOklchDigitsInput()?.value ?? null
  };
}

function createImmediatePageScheduler(): PageScheduler {
  return {
    scheduleColorGeneration(task: () => void): void {
      task();
    },
    schedulePersistence(task: () => void): void {
      task();
    },
    scheduleEditableHistorySuppressionReset(task: () => void): void {
      task();
    },
    schedulePendingNativeHistoryReset(task: () => void): void {
      task();
    },
    scheduleHistoryShortcut(task: () => void): void {
      task();
    },
    scheduleHistoryResync(task: () => void): void {
      task();
    },
    cancelHistoryResync(): void {},
    destroy(): void {}
  };
}

function createControllablePageScheduler(): ControllablePageScheduler {
  let historyResyncTask: (() => void) | null = null;

  return {
    ...createImmediatePageScheduler(),
    scheduleHistoryResync(task: () => void): void {
      historyResyncTask = task;
    },
    cancelHistoryResync(): void {
      historyResyncTask = null;
    },
    flushHistoryResync(): void {
      historyResyncTask?.();
    },
    destroy(): void {
      historyResyncTask = null;
    }
  };
}

async function renderPage(
  scheduler: PageScheduler = createImmediatePageScheduler()
): Promise<void> {
  render(PageContent, { props: { scheduler } });
  await flushAppState();
  expect(getUndoButton()).toBeDisabled();
  expect(getRedoButton()).toBeDisabled();
}

async function flushHistoryCommit(): Promise<void> {
  await flushAppState();
}

async function flushAppState(): Promise<void> {
  await tick();
  await Promise.resolve();
  await tick();
  await tick();
}

async function performAction(action: HistoryAction, user: ReturnType<typeof userEvent.setup>) {
  switch (action.type) {
    case 'setNumColors': {
      const numColorsInput = getNumColorsInput();
      numColorsInput.value = `${action.value}`;
      await fireEvent.input(numColorsInput);
      await fireEvent.change(numColorsInput);
      await flushHistoryCommit();
      expect(getNumColorsInput()).toHaveValue(action.value);
      return;
    }
    case 'setContrastMode':
      await fireEvent.change(getContrastModeSelect(), { target: { value: action.value } });
      await flushHistoryCommit();
      expect(getContrastModeSelect()).toHaveValue(action.value);
      if (action.value === 'manual') {
        expect(getLowContrastInput()).not.toBeNull();
      } else {
        expect(getLowContrastInput()).toBeNull();
      }
      return;
    case 'setLowContrastColor': {
      const lowContrastInput = getLowContrastInput();
      if (!lowContrastInput) {
        throw new Error('Expected manual low contrast input to exist');
      }
      lowContrastInput.value = action.value;
      await fireEvent.change(lowContrastInput);
      await flushHistoryCommit();
      expect(getLowContrastInput()).toHaveValue(action.value);
      return;
    }
    case 'setDisplayColorSpace':
      await fireEvent.change(getDisplayColorSpaceSelect(), { target: { value: action.value } });
      await flushHistoryCommit();
      expect(getDisplayColorSpaceSelect()).toHaveValue(action.value);
      if (action.value === 'oklch') {
        expect(getOklchDigitsInput()).not.toBeNull();
      } else {
        expect(getOklchDigitsInput()).toBeNull();
      }
      return;
    case 'setGamutSpace':
      await fireEvent.change(getGamutSpaceSelect(), { target: { value: action.value } });
      await flushHistoryCommit();
      expect(getGamutSpaceSelect()).toHaveValue(action.value);
      return;
    case 'toggleGamutWarnings': {
      const gamutWarningsCheckbox = getGamutWarningsCheckbox();
      if (gamutWarningsCheckbox.checked !== action.value) {
        await user.click(gamutWarningsCheckbox);
      }
      await flushHistoryCommit();
      expect(getGamutWarningsCheckbox().checked).toBe(action.value);
      return;
    }
    case 'setThemePreference':
      await fireEvent.change(getThemeSelect(), { target: { value: action.value } });
      await flushHistoryCommit();
      expect(getThemeSelect()).toHaveValue(action.value);
      return;
    case 'setContrastAlgorithm':
      await fireEvent.change(getContrastAlgorithmSelect(), { target: { value: action.value } });
      await flushHistoryCommit();
      expect(getContrastAlgorithmSelect()).toHaveValue(action.value);
      return;
    case 'setOklchDigits': {
      const oklchDigitsInput = getOklchDigitsInput();
      if (!oklchDigitsInput) {
        throw new Error('Expected OKLCH significant digits input to exist');
      }
      oklchDigitsInput.value = `${action.value}`;
      await fireEvent.input(oklchDigitsInput);
      await fireEvent.change(oklchDigitsInput);
      await flushHistoryCommit();
      expect(getOklchDigitsInput()).toHaveValue(action.value);
      return;
    }
    case 'reset':
      await user.click(screen.getByRole('button', { name: /reset all settings to defaults/i }));
      await flushHistoryCommit();
      expect(getThemeSelect()).toHaveValue('auto');
      return;
  }
}

describe('page history integration', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" /></svg>'
      })
    );
    Object.defineProperty(window, 'confirm', {
      writable: true,
      value: vi.fn().mockReturnValue(true)
    });
    localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('supports button undo/redo and multi-step menu jumps', async () => {
    const user = userEvent.setup();

    await renderPage();

    const getThemeSelect = () =>
      screen.getByRole('combobox', { name: /theme preference/i }) as HTMLSelectElement;
    const getDisplayColorSpaceSelect = () =>
      screen.getByRole('combobox', { name: /display color space format/i }) as HTMLSelectElement;

    const themeSelect = getThemeSelect();
    await fireEvent.change(themeSelect, { target: { value: 'dark' } });
    await flushHistoryCommit();
    expect(themeSelect).toHaveValue('dark');

    await fireEvent.change(getDisplayColorSpaceSelect(), { target: { value: 'rgb' } });
    await flushHistoryCommit();
    expect(getDisplayColorSpaceSelect()).toHaveValue('rgb');

    expect(screen.getByRole('button', { name: /undo last change/i })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: /undo last change/i }));
    await flushHistoryCommit();
    expect(getDisplayColorSpaceSelect()).toHaveValue('hex');

    await user.click(screen.getByRole('button', { name: /redo last change/i }));
    await flushHistoryCommit();
    expect(getDisplayColorSpaceSelect()).toHaveValue('rgb');

    await user.click(screen.getByRole('button', { name: /show undo history/i }));
    await user.click(screen.getByRole('menuitem', { name: /undo to theme preference changed/i }));
    await flushHistoryCommit();
    expect(getThemeSelect()).toHaveValue('dark');
    expect(getDisplayColorSpaceSelect()).toHaveValue('hex');
    expect(screen.getByRole('button', { name: /show redo history/i })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: /show redo history/i }));
    await user.click(
      screen.getByRole('menuitem', { name: /redo to display color space changed/i })
    );
    await flushHistoryCommit();
    expect(getDisplayColorSpaceSelect()).toHaveValue('rgb');
    expect(screen.getByRole('button', { name: /undo last change/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /redo last change/i })).toBeDisabled();
  }, 10000);

  it('keeps mixed generator and contrast history steps aligned across redo', async () => {
    const user = userEvent.setup();

    await renderPage();
    await performAction({ type: 'setNumColors', value: 12 }, user);
    expect(getNumColorsInput()).toHaveValue(12);

    await performAction({ type: 'setNumColors', value: 13 }, user);
    expect(getNumColorsInput()).toHaveValue(13);

    await performAction({ type: 'setContrastMode', value: 'manual' }, user);
    expect(getContrastModeSelect()).toHaveValue('manual');
    expect(getLowContrastInput()).not.toBeNull();
    const manualLowColorBeforeEdit = getLowContrastInput()?.value;

    await performAction({ type: 'setLowContrastColor', value: '#ff0000' }, user);
    expect(getLowContrastInput()).toHaveValue('#ff0000');

    await user.click(getUndoButton());
    await flushHistoryCommit();
    expect(getContrastModeSelect()).toHaveValue('manual');
    expect(getNumColorsInput()).toHaveValue(13);
    expect(getLowContrastInput()).toHaveValue(manualLowColorBeforeEdit);

    await user.click(getUndoButton());
    await flushHistoryCommit();
    expect(getContrastModeSelect()).toHaveValue('auto');
    expect(getNumColorsInput()).toHaveValue(13);
    expect(getLowContrastInput()).toBeNull();

    await user.click(getRedoButton());
    await flushHistoryCommit();
    expect(getContrastModeSelect()).toHaveValue('manual');
    expect(getNumColorsInput()).toHaveValue(13);
    expect(getLowContrastInput()).toHaveValue(manualLowColorBeforeEdit);

    await user.click(getRedoButton());
    await flushHistoryCommit();
    expect(getLowContrastInput()).toHaveValue('#ff0000');
    expect(getNumColorsInput()).toHaveValue(13);
    expect(getContrastModeSelect()).toHaveValue('manual');
  }, 10000);

  it('cancels history-input resync once a replacement edit starts', async () => {
    const scheduler = createControllablePageScheduler();

    await renderPage(scheduler);
    const initialBaseColor = getBaseColorHexInput().value;
    const baseColorInput = getBaseColorHexInput();
    baseColorInput.value = '#00ff00';
    await fireEvent.input(baseColorInput);
    await fireEvent.change(baseColorInput);
    await fireEvent.blur(baseColorInput);
    await flushHistoryCommit();
    expect(getBaseColorHexInput()).toHaveValue('#00ff00');

    await fireEvent.click(getUndoButton());
    await flushHistoryCommit();
    expect(getBaseColorHexInput()).toHaveValue(initialBaseColor);

    const currentBaseColorInput = getBaseColorHexInput();
    currentBaseColorInput.focus();
    expect(currentBaseColorInput).toHaveFocus();

    const historyUndoInputEvent = new InputEvent('input', {
      bubbles: true,
      inputType: 'historyUndo'
    });
    await fireEvent(currentBaseColorInput, historyUndoInputEvent);
    await flushAppState();

    const replacementInput = getBaseColorHexInput();
    replacementInput.focus();
    replacementInput.value = '#ff0000';
    await fireEvent.input(replacementInput);
    await fireEvent.change(replacementInput);
    await flushAppState();

    expect(getBaseColorHexInput()).toHaveValue('#ff0000');

    scheduler.flushHistoryResync();
    await flushAppState();

    expect(getBaseColorHexInput()).toHaveValue('#ff0000');
  }, 10000);

  async function expectScenarioRoundTrip(actions: HistoryAction[]): Promise<void> {
    const user = userEvent.setup();

    await renderPage();

    const snapshots: HistoryUiState[] = [readUiState()];

    for (const action of actions) {
      await performAction(action, user);
      const nextSnapshot = readUiState();
      if (JSON.stringify(nextSnapshot) !== JSON.stringify(snapshots.at(-1))) {
        snapshots.push(nextSnapshot);
      }
    }

    expect(getUndoButton()).toBeEnabled();
    await user.click(getUndoHistoryButton());
    await flushAppState();
    expect(screen.getAllByRole('menuitem')).toHaveLength(snapshots.length - 1);
    await user.click(getUndoHistoryButton());
    await flushAppState();

    for (let index = snapshots.length - 2; index >= 0; index -= 1) {
      await user.click(getUndoButton());
      await flushHistoryCommit();
      expect(readUiState()).toEqual(snapshots[index] as HistoryUiState);
    }

    expect(getUndoButton()).toBeDisabled();
    expect(getRedoButton()).toBeEnabled();

    for (let index = 1; index < snapshots.length; index += 1) {
      await user.click(getRedoButton());
      await flushHistoryCommit();
      expect(readUiState()).toEqual(snapshots[index] as HistoryUiState);
    }

    expect(getUndoButton()).toBeEnabled();
    expect(getRedoButton()).toBeDisabled();
  }

  it('round-trips representative display and contrast history edits', async () => {
    await expectScenarioRoundTrip([
      { type: 'setContrastMode', value: 'manual' },
      { type: 'setLowContrastColor', value: '#00ff00' },
      { type: 'setDisplayColorSpace', value: 'rgb' },
      { type: 'setGamutSpace', value: 'p3' },
      { type: 'toggleGamutWarnings', value: false },
      { type: 'setThemePreference', value: 'dark' },
      { type: 'setContrastAlgorithm', value: 'APCA' }
    ]);
  }, 30000);

  it('round-trips oklch digits and reset history edits', async () => {
    await expectScenarioRoundTrip([
      { type: 'setDisplayColorSpace', value: 'oklch' },
      { type: 'setOklchDigits', value: 5 },
      { type: 'setNumColors', value: 15 },
      { type: 'setThemePreference', value: 'dark' },
      { type: 'reset' }
    ]);
  }, 30000);
});
