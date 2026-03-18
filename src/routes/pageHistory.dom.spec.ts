import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Page from './+page.svelte';

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

interface HistoryScenario {
  name: string;
  actions: HistoryAction[];
}

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

async function waitForUiState(expected: HistoryUiState): Promise<void> {
  await waitFor(() => {
    expect(readUiState()).toEqual(expected);
  });
}

async function renderPage(): Promise<void> {
  render(Page);
  await tick();
  await tick();
  await waitFor(() => expect(getUndoButton()).toBeDisabled());
  await waitFor(() => expect(getRedoButton()).toBeDisabled());
}

async function flushHistoryCommit(): Promise<void> {
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
      await waitFor(() => expect(getNumColorsInput()).toHaveValue(action.value));
      await flushHistoryCommit();
      return;
    }
    case 'setContrastMode':
      await fireEvent.change(getContrastModeSelect(), { target: { value: action.value } });
      await waitFor(() => expect(getContrastModeSelect()).toHaveValue(action.value));
      await waitFor(() => {
        if (action.value === 'manual') {
          expect(getLowContrastInput()).not.toBeNull();
          return;
        }

        expect(getLowContrastInput()).toBeNull();
      });
      await flushHistoryCommit();
      return;
    case 'setLowContrastColor': {
      const lowContrastInput = getLowContrastInput();
      if (!lowContrastInput) {
        throw new Error('Expected manual low contrast input to exist');
      }
      lowContrastInput.value = action.value;
      await fireEvent.change(lowContrastInput);
      await waitFor(() => expect(getLowContrastInput()).toHaveValue(action.value));
      await flushHistoryCommit();
      return;
    }
    case 'setDisplayColorSpace':
      await fireEvent.change(getDisplayColorSpaceSelect(), { target: { value: action.value } });
      await waitFor(() => expect(getDisplayColorSpaceSelect()).toHaveValue(action.value));
      await waitFor(() => {
        if (action.value === 'oklch') {
          expect(getOklchDigitsInput()).not.toBeNull();
          return;
        }

        expect(getOklchDigitsInput()).toBeNull();
      });
      await flushHistoryCommit();
      return;
    case 'setGamutSpace':
      await fireEvent.change(getGamutSpaceSelect(), { target: { value: action.value } });
      await waitFor(() => expect(getGamutSpaceSelect()).toHaveValue(action.value));
      await flushHistoryCommit();
      return;
    case 'toggleGamutWarnings': {
      const gamutWarningsCheckbox = getGamutWarningsCheckbox();
      if (gamutWarningsCheckbox.checked !== action.value) {
        await user.click(gamutWarningsCheckbox);
      }
      await waitFor(() => expect(getGamutWarningsCheckbox().checked).toBe(action.value));
      await flushHistoryCommit();
      return;
    }
    case 'setThemePreference':
      await fireEvent.change(getThemeSelect(), { target: { value: action.value } });
      await waitFor(() => expect(getThemeSelect()).toHaveValue(action.value));
      await flushHistoryCommit();
      return;
    case 'setContrastAlgorithm':
      await fireEvent.change(getContrastAlgorithmSelect(), { target: { value: action.value } });
      await waitFor(() => expect(getContrastAlgorithmSelect()).toHaveValue(action.value));
      await flushHistoryCommit();
      return;
    case 'setOklchDigits': {
      const oklchDigitsInput = getOklchDigitsInput();
      if (!oklchDigitsInput) {
        throw new Error('Expected OKLCH significant digits input to exist');
      }
      oklchDigitsInput.value = `${action.value}`;
      await fireEvent.input(oklchDigitsInput);
      await fireEvent.change(oklchDigitsInput);
      await waitFor(() => expect(getOklchDigitsInput()).toHaveValue(action.value));
      await flushHistoryCommit();
      return;
    }
    case 'reset':
      await user.click(screen.getByRole('button', { name: /reset all settings to defaults/i }));
      await waitFor(() => expect(getThemeSelect()).toHaveValue('auto'));
      await flushHistoryCommit();
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
    expect(themeSelect).toHaveValue('dark');

    await fireEvent.change(getDisplayColorSpaceSelect(), { target: { value: 'rgb' } });
    expect(getDisplayColorSpaceSelect()).toHaveValue('rgb');

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /undo last change/i })).toBeEnabled()
    );

    await user.click(screen.getByRole('button', { name: /undo last change/i }));
    await waitFor(() => expect(getDisplayColorSpaceSelect()).toHaveValue('hex'));

    await user.click(screen.getByRole('button', { name: /redo last change/i }));
    await waitFor(() => expect(getDisplayColorSpaceSelect()).toHaveValue('rgb'));

    await user.click(screen.getByRole('button', { name: /show undo history/i }));
    await user.click(screen.getByRole('menuitem', { name: /undo to theme preference changed/i }));

    await waitFor(() => expect(getThemeSelect()).toHaveValue('dark'));
    expect(getDisplayColorSpaceSelect()).toHaveValue('hex');
    expect(screen.getByRole('button', { name: /show redo history/i })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: /show redo history/i }));
    await user.click(
      screen.getByRole('menuitem', { name: /redo to display color space changed/i })
    );

    await waitFor(() => expect(getDisplayColorSpaceSelect()).toHaveValue('rgb'));
    expect(screen.getByRole('button', { name: /undo last change/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /redo last change/i })).toBeDisabled();
  });

  it('keeps mixed generator and contrast history steps aligned across redo', async () => {
    const user = userEvent.setup();

    await renderPage();
    await performAction({ type: 'setNumColors', value: 12 }, user);
    await waitFor(() => expect(getNumColorsInput()).toHaveValue(12));

    await performAction({ type: 'setNumColors', value: 13 }, user);
    await waitFor(() => expect(getNumColorsInput()).toHaveValue(13));

    await performAction({ type: 'setContrastMode', value: 'manual' }, user);
    await waitFor(() => expect(getContrastModeSelect()).toHaveValue('manual'));
    await waitFor(() => expect(getLowContrastInput()).not.toBeNull());
    const manualLowColorBeforeEdit = getLowContrastInput()?.value;

    await performAction({ type: 'setLowContrastColor', value: '#ff0000' }, user);
    await waitFor(() => expect(getLowContrastInput()).toHaveValue('#ff0000'));

    await user.click(getUndoButton());
    await waitFor(() => expect(getContrastModeSelect()).toHaveValue('manual'));
    expect(getNumColorsInput()).toHaveValue(13);
    expect(getLowContrastInput()).toHaveValue(manualLowColorBeforeEdit);

    await user.click(getUndoButton());
    await waitFor(() => expect(getContrastModeSelect()).toHaveValue('auto'));
    expect(getNumColorsInput()).toHaveValue(13);
    expect(getLowContrastInput()).toBeNull();

    await user.click(getRedoButton());
    await waitFor(() => expect(getContrastModeSelect()).toHaveValue('manual'));
    expect(getNumColorsInput()).toHaveValue(13);
    expect(getLowContrastInput()).toHaveValue(manualLowColorBeforeEdit);

    await user.click(getRedoButton());
    await waitFor(() => expect(getLowContrastInput()).toHaveValue('#ff0000'));
    expect(getNumColorsInput()).toHaveValue(13);
    expect(getContrastModeSelect()).toHaveValue('manual');
  });

  it('cancels history-input resync once a replacement edit starts', async () => {
    await renderPage();
    const initialBaseColor = getBaseColorHexInput().value;
    const baseColorInput = getBaseColorHexInput();
    baseColorInput.value = '#00ff00';
    await fireEvent.input(baseColorInput);
    await fireEvent.change(baseColorInput);
    await fireEvent.blur(baseColorInput);
    await waitFor(() => expect(getBaseColorHexInput()).toHaveValue('#00ff00'));
    await flushHistoryCommit();

    await fireEvent.click(getUndoButton());
    await waitFor(() => expect(getBaseColorHexInput()).toHaveValue(initialBaseColor));

    vi.useFakeTimers();

    try {
      const currentBaseColorInput = getBaseColorHexInput();
      currentBaseColorInput.focus();
      expect(currentBaseColorInput).toHaveFocus();

      const historyUndoInputEvent = new InputEvent('input', {
        bubbles: true,
        inputType: 'historyUndo'
      });
      await fireEvent(currentBaseColorInput, historyUndoInputEvent);
      await tick();
      await tick();

      const replacementInput = getBaseColorHexInput();
      replacementInput.focus();
      replacementInput.value = '#ff0000';
      await fireEvent.input(replacementInput);
      await fireEvent.change(replacementInput);
      await tick();
      await tick();

      expect(getBaseColorHexInput()).toHaveValue('#ff0000');

      await vi.advanceTimersByTimeAsync(1000);
      await tick();
      await tick();

      expect(getBaseColorHexInput()).toHaveValue('#ff0000');
    } finally {
      vi.useRealTimers();
    }
  });

  const historyScenarios: HistoryScenario[] = [
    {
      name: 'generator and manual contrast edits round-trip cleanly',
      actions: [
        { type: 'setNumColors', value: 12 },
        { type: 'setNumColors', value: 13 },
        { type: 'setContrastMode', value: 'manual' },
        { type: 'setLowContrastColor', value: '#ff0000' }
      ]
    },
    {
      name: 'display, gamut, theme, and contrast algorithm edits round-trip cleanly',
      actions: [
        { type: 'setDisplayColorSpace', value: 'rgb' },
        { type: 'setGamutSpace', value: 'p3' },
        { type: 'toggleGamutWarnings', value: false },
        { type: 'setThemePreference', value: 'dark' },
        { type: 'setContrastAlgorithm', value: 'APCA' }
      ]
    },
    {
      name: 'contrast-first mixed edits preserve later generator and display changes',
      actions: [
        { type: 'setContrastMode', value: 'manual' },
        { type: 'setLowContrastColor', value: '#00ff00' },
        { type: 'setNumColors', value: 14 },
        { type: 'setDisplayColorSpace', value: 'hsl' }
      ]
    },
    {
      name: 'oklch display settings and theme changes round-trip cleanly',
      actions: [
        { type: 'setDisplayColorSpace', value: 'oklch' },
        { type: 'setOklchDigits', value: 5 },
        { type: 'setNumColors', value: 15 },
        { type: 'setThemePreference', value: 'dark' }
      ]
    },
    {
      name: 'reset can be undone and redone after mixed edits',
      actions: [
        { type: 'setNumColors', value: 13 },
        { type: 'setContrastMode', value: 'manual' },
        { type: 'setLowContrastColor', value: '#00ff00' },
        { type: 'setDisplayColorSpace', value: 'rgb' },
        { type: 'reset' }
      ]
    }
  ];

  for (const scenario of historyScenarios) {
    it(
      scenario.name,
      async () => {
        const user = userEvent.setup();

        await renderPage();

        const snapshots: HistoryUiState[] = [readUiState()];

        for (const action of scenario.actions) {
          await performAction(action, user);
          const nextSnapshot = readUiState();
          if (JSON.stringify(nextSnapshot) !== JSON.stringify(snapshots.at(-1))) {
            snapshots.push(nextSnapshot);
          }
        }

        await waitFor(() => expect(getUndoButton()).toBeEnabled());
        await user.click(getUndoHistoryButton());
        await waitFor(() =>
          expect(screen.getAllByRole('menuitem')).toHaveLength(snapshots.length - 1)
        );
        await user.click(getUndoHistoryButton());

        expect(getUndoButton()).toBeEnabled();

        for (let index = snapshots.length - 2; index >= 0; index -= 1) {
          await user.click(getUndoButton());
          await waitForUiState(snapshots[index] as HistoryUiState);
        }

        expect(getUndoButton()).toBeDisabled();
        expect(getRedoButton()).toBeEnabled();

        for (let index = 1; index < snapshots.length; index += 1) {
          await user.click(getRedoButton());
          await waitForUiState(snapshots[index] as HistoryUiState);
        }

        expect(getUndoButton()).toBeEnabled();
        expect(getRedoButton()).toBeDisabled();
      },
      15000
    );
  }
});
