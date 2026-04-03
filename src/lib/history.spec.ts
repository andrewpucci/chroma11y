import { describe, expect, it } from 'vitest';

import { createHistoryManager, type HistorySnapshot } from './history';

function createSnapshot(overrides: Partial<HistorySnapshot> = {}): HistorySnapshot {
  return {
    baseColor: '#5EF784',
    warmth: -7,
    chromaMultiplier: 1,
    numColors: 11,
    numPalettes: 11,
    x1: 0.16,
    y1: 0,
    x2: 0.28,
    y2: 0.38,
    contrastMode: 'auto',
    lowStep: 0,
    highStep: 10,
    contrast: {
      low: '#ffffff',
      high: '#000000'
    },
    lightnessNudgers: [],
    hueNudgers: [],
    currentTheme: 'light',
    displayColorSpace: 'hex',
    gamutSpace: 'srgb',
    themePreference: 'auto',
    swatchLabels: 'both',
    showSwatchGamutWarnings: true,
    showSwatchContrastIndicators: true,
    swatchContrastIndicators: {
      wcagThreeToOne: true,
      wcagAA: true,
      wcagAAA: true,
      apcaLarge: true,
      apcaFluent: true,
      apcaBody: true
    },
    contrastAlgorithm: 'WCAG',
    solveAdjacentStopLows: true,
    oklchDisplaySignificantDigits: 4,
    customNeutralName: undefined,
    customPaletteNames: undefined,
    ...overrides
  };
}

describe('history', () => {
  it('records labeled commits and supports undo/redo', () => {
    expect.assertions(9);
    const manager = createHistoryManager(createSnapshot());

    expect(manager.getViewModel().canUndo).toBe(false);

    const committed = manager.commit(createSnapshot({ warmth: 8 }), 'Warmth changed');
    expect(committed).toBe(true);
    expect(manager.getViewModel().undoEntries[0]?.displayText).toBe('Starting state');

    const undoResult = manager.undo();
    expect(undoResult?.entry.label).toBe('Warmth changed');
    expect(undoResult?.snapshot.warmth).toBe(-7);
    expect(manager.getViewModel().canRedo).toBe(true);

    const redoResult = manager.redo();
    expect(redoResult?.entry.label).toBe('Warmth changed');
    expect(redoResult?.snapshot.warmth).toBe(8);
    expect(manager.getViewModel().canRedo).toBe(false);
  });

  it('invalidates redo history after branching commits', () => {
    expect.assertions(4);
    const manager = createHistoryManager(createSnapshot());

    manager.commit(createSnapshot({ warmth: 8 }), 'Warmth changed');
    manager.commit(createSnapshot({ baseColor: '#00ff00', warmth: 8 }), 'Base color changed');

    manager.undo();
    const committed = manager.commit(createSnapshot({ warmth: 12 }), 'Warmth changed again');

    expect(committed).toBe(true);
    expect(manager.getViewModel().redoEntries).toHaveLength(0);
    expect(manager.getViewModel().undoEntries[0]?.displayText).toBe('Warmth changed');
    expect(manager.getMetadata().at(-1)?.label).toBe('Warmth changed again');
  });

  it('trims metadata to the configured history window and supports go', () => {
    expect.assertions(4);
    const manager = createHistoryManager(createSnapshot());

    for (let index = 1; index <= 105; index += 1) {
      manager.commit(createSnapshot({ warmth: index }), `Warmth ${index}`);
    }

    expect(manager.getMetadata().length).toBe(101);
    expect(manager.getViewModel().undoEntries[0]?.displayText).toBe('Warmth 104');

    const oldestVisibleUndo = manager.getViewModel().undoEntries.at(-1);
    const goResult = oldestVisibleUndo ? manager.go(oldestVisibleUndo.position) : null;

    expect(goResult?.steps).toBe(100);
    expect(goResult?.entry.label).toBe('Warmth 5');
  });

  it('round-trips exact mixed-field snapshots through undo, redo, and go', () => {
    expect.assertions(10);

    const initial = createSnapshot();
    const manualContrast = createSnapshot({
      numColors: 13,
      contrastMode: 'manual',
      contrast: {
        low: '#ff0000',
        high: '#000000'
      }
    });
    const displaySettings = createSnapshot({
      ...manualContrast,
      displayColorSpace: 'rgb',
      gamutSpace: 'p3',
      showSwatchGamutWarnings: false
    });
    const themeAndAlgorithm = createSnapshot({
      ...displaySettings,
      currentTheme: 'dark',
      themePreference: 'dark',
      contrastAlgorithm: 'APCA'
    });

    const manager = createHistoryManager(initial);
    manager.commit(manualContrast, 'Manual contrast changed');
    manager.commit(displaySettings, 'Display settings changed');
    manager.commit(themeAndAlgorithm, 'Theme preference changed');

    expect(manager.getCurrentSnapshot()).toEqual(themeAndAlgorithm);

    const undoTheme = manager.undo();
    expect(undoTheme?.snapshot).toEqual(displaySettings);
    expect(undoTheme?.entry.label).toBe('Theme preference changed');

    const undoDisplay = manager.undo();
    expect(undoDisplay?.snapshot).toEqual(manualContrast);
    expect(undoDisplay?.entry.label).toBe('Display settings changed');

    const redoDisplay = manager.redo();
    expect(redoDisplay?.snapshot).toEqual(displaySettings);

    const jumpToStart = manager.go(0);
    expect(jumpToStart?.snapshot).toEqual(initial);
    expect(jumpToStart?.steps).toBe(2);

    const jumpToFinal = manager.go(3);
    expect(jumpToFinal?.snapshot).toEqual(themeAndAlgorithm);
    expect(jumpToFinal?.entry.label).toBe('Theme preference changed');
  });

  it('preserves custom palette names through history navigation', () => {
    expect.assertions(4);

    const initial = createSnapshot();
    const renamed = createSnapshot({
      customNeutralName: 'Canvas',
      customPaletteNames: ['Ocean', '', 'Bloom']
    });

    const manager = createHistoryManager(initial);
    manager.commit(renamed, 'Palette name changed');

    expect(manager.getCurrentSnapshot()).toEqual(renamed);
    expect(manager.undo()?.snapshot).toEqual(initial);
    expect(manager.redo()?.snapshot).toEqual(renamed);
    expect(manager.getCurrentSnapshot().customPaletteNames).toEqual(['Ocean', '', 'Bloom']);
  });
});
