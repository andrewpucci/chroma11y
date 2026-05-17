import { describe, expect, it } from 'vitest';

import { createReferenceWorkspaceManager } from './referenceWorkspace';
import type { ReferenceWorkspaceSnapshot } from './referenceWorkspace';

function createSnapshot(
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

describe('referenceWorkspace', () => {
  it('replaceReference updates the pinned config without changing view mode', () => {
    expect.assertions(2);

    const manager = createReferenceWorkspaceManager(
      createSnapshot({ referenceConfiguration: { baseColor: '#old' }, viewMode: 'reference' })
    );

    const result = manager.replaceReference({ baseColor: '#new' });

    expect(result.referenceConfiguration).toEqual({ baseColor: '#new' });
    expect(result.viewMode).toBe('reference');
  });

  it('restoreReference returns the pinned config without modifying workspace state', () => {
    expect.assertions(3);

    const pinned = { baseColor: '#pinned' };
    const manager = createReferenceWorkspaceManager(
      createSnapshot({ referenceConfiguration: pinned, viewMode: 'reference' })
    );

    const restored = manager.restoreReference();

    expect(restored).toEqual(pinned);
    expect(manager.getState().referenceConfiguration).toEqual(pinned);
    expect(manager.getState().viewMode).toBe('reference');
  });

  it('restoreReference returns null when no reference is pinned', () => {
    expect.assertions(1);

    const manager = createReferenceWorkspaceManager(createSnapshot());

    expect(manager.restoreReference()).toBeNull();
  });

  it('clearReference removes the reference config and resets viewMode to default', () => {
    expect.assertions(2);

    const manager = createReferenceWorkspaceManager(
      createSnapshot({ referenceConfiguration: { baseColor: '#x' }, viewMode: 'reference' })
    );

    const result = manager.clearReference();

    expect(result.referenceConfiguration).toBeNull();
    expect(result.viewMode).toBe('default');
  });

  it('enterComparisonView returns null when no reference is pinned', () => {
    expect.assertions(1);

    const manager = createReferenceWorkspaceManager(createSnapshot());

    expect(manager.enterComparisonView()).toBeNull();
  });

  it('enterComparisonView sets viewMode to comparison when reference exists', () => {
    expect.assertions(1);

    const manager = createReferenceWorkspaceManager(
      createSnapshot({ referenceConfiguration: { baseColor: '#x' }, viewMode: 'reference' })
    );

    const result = manager.enterComparisonView();

    expect(result?.viewMode).toBe('comparison');
  });

  it('setSwatchChangeThreshold clamps values to [0, 100]', () => {
    expect.assertions(2);

    const manager = createReferenceWorkspaceManager(createSnapshot());

    expect(manager.setSwatchChangeThreshold(-5).swatchChangeThreshold).toBe(0);
    expect(manager.setSwatchChangeThreshold(200).swatchChangeThreshold).toBe(100);
  });
});
