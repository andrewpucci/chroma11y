import { describe, expect, it } from 'vitest';

import { createReferenceHistoryManager } from './referenceHistoryManager';
import type { ReferenceHistorySnapshot } from './referenceHistoryManager';
import type { HistorySnapshot } from './history';
import type { ReferenceWorkspaceSnapshot } from './referenceWorkspace';

function createPaletteSnapshot(overrides: Partial<HistorySnapshot> = {}): HistorySnapshot {
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
    contrast: { low: '#ffffff', high: '#000000' },
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

function createReferenceWorkspaceSnapshot(
  overrides: Partial<ReferenceWorkspaceSnapshot> = {}
): ReferenceWorkspaceSnapshot {
  return {
    referenceConfiguration: null,
    viewMode: 'default',
    comparisonMetric: 'ok',
    swatchChangeThreshold: 1,
    ...overrides
  };
}

function createCombinedSnapshot(
  paletteOverrides: Partial<HistorySnapshot> = {},
  referenceOverrides: Partial<ReferenceWorkspaceSnapshot> = {}
): ReferenceHistorySnapshot {
  return {
    palette: createPaletteSnapshot(paletteOverrides),
    reference: createReferenceWorkspaceSnapshot(referenceOverrides)
  };
}

describe('referenceHistoryManager', () => {
  it('commits combined palette and reference snapshot and supports undo/redo', () => {
    expect.assertions(8);

    const initial = createCombinedSnapshot();
    const manager = createReferenceHistoryManager(initial);

    expect(manager.getViewModel().canUndo).toBe(false);

    const pinned = createCombinedSnapshot(
      {},
      { referenceConfiguration: { baseColor: '#5EF784' }, viewMode: 'reference' }
    );

    const committed = manager.commit(pinned, 'Reference pinned');
    expect(committed).toBe(true);
    expect(manager.getViewModel().canUndo).toBe(true);

    const undoResult = manager.undo();
    expect(undoResult).not.toBeNull();
    expect(undoResult?.snapshot.reference.referenceConfiguration).toBeNull();
    expect(undoResult?.snapshot.reference.viewMode).toBe('default');

    const redoResult = manager.redo();
    expect(redoResult).not.toBeNull();
    expect(redoResult?.snapshot.reference.referenceConfiguration).toEqual({
      baseColor: '#5EF784'
    });
  });

  it('does not create a new history entry when committing an identical snapshot', () => {
    expect.assertions(2);

    const initial = createCombinedSnapshot();
    const manager = createReferenceHistoryManager(initial);

    const committed = manager.commit(initial, 'Duplicate commit');
    expect(committed).toBe(false);
    expect(manager.getViewModel().canUndo).toBe(false);
  });

  it('cannot undo below position 0', () => {
    expect.assertions(2);

    const initial = createCombinedSnapshot();
    const manager = createReferenceHistoryManager(initial);

    const result = manager.undo();
    expect(result).toBeNull();
    expect(manager.getViewModel().canUndo).toBe(false);
  });

  it('restores both palette and reference coherently when undoing a reference action', () => {
    expect.assertions(6);

    const initial = createCombinedSnapshot({ numColors: 11 });
    const manager = createReferenceHistoryManager(initial);

    const afterPaletteChange = createCombinedSnapshot({ numColors: 13 });
    manager.commit(afterPaletteChange, 'Colors changed');

    const afterPinning = createCombinedSnapshot(
      { numColors: 13 },
      { referenceConfiguration: { numColors: 13 }, viewMode: 'reference' }
    );
    manager.commit(afterPinning, 'Reference pinned');

    const undoPin = manager.undo();
    expect(undoPin?.snapshot.reference.referenceConfiguration).toBeNull();
    expect(undoPin?.snapshot.reference.viewMode).toBe('default');
    expect(undoPin?.snapshot.palette.numColors).toBe(13);

    const undoPalette = manager.undo();
    expect(undoPalette?.snapshot.palette.numColors).toBe(11);
    expect(undoPalette?.snapshot.reference.referenceConfiguration).toBeNull();
    expect(undoPalette?.snapshot.reference.viewMode).toBe('default');
  });

  it('invalidates redo entries after a branching commit', () => {
    expect.assertions(3);

    const initial = createCombinedSnapshot();
    const manager = createReferenceHistoryManager(initial);

    manager.commit(
      createCombinedSnapshot({}, { viewMode: 'reference', referenceConfiguration: { v: 1 } }),
      'Pin A'
    );
    manager.commit(
      createCombinedSnapshot({}, { viewMode: 'reference', referenceConfiguration: { v: 2 } }),
      'Pin B'
    );

    manager.undo();

    manager.commit(
      createCombinedSnapshot({}, { viewMode: 'reference', referenceConfiguration: { v: 3 } }),
      'Pin C'
    );

    expect(manager.getViewModel().redoEntries).toHaveLength(0);
    expect(manager.getViewModel().undoEntries[0]?.displayText).toBe('Pin A');
    expect(manager.getCurrentSnapshot().reference.referenceConfiguration).toEqual({ v: 3 });
  });
});
