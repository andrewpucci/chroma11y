import { get } from 'svelte/store';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import {
  createReferenceConfiguration,
  type ReferenceConfiguration
} from './referenceConfiguration';
import {
  saveReferenceWorkspaceToStorage,
  loadReferenceWorkspaceFromStorage,
  clearStoredReferenceWorkspace
} from './referenceWorkspacePersistence';
import type { StoredReferenceWorkspace } from './referenceWorkspacePersistence';
import { colorStore, resetColorState } from './stores';

const STORAGE_KEY = 'chroma11y-reference-workspace';

function createWorkspaceState(
  overrides: Partial<StoredReferenceWorkspace> = {}
): StoredReferenceWorkspace {
  return {
    referenceConfiguration: null,
    viewMode: 'default',
    comparisonMetric: 'ok',
    swatchChangeThreshold: 1,
    ...overrides
  };
}

function createStoredReferenceConfiguration(
  overrides: Partial<ReferenceConfiguration> = {}
): ReferenceConfiguration {
  resetColorState('light');
  return {
    ...createReferenceConfiguration(get(colorStore)),
    ...overrides
  };
}

describe('referenceWorkspacePersistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('saveReferenceWorkspaceToStorage', () => {
    it('persists workspace state including reference configuration to localStorage', () => {
      expect.assertions(1);

      const state = createWorkspaceState({
        referenceConfiguration: createStoredReferenceConfiguration() as unknown as Record<
          string,
          unknown
        >,
        viewMode: 'reference'
      });

      saveReferenceWorkspaceToStorage(state);

      expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(state));
    });

    it('handles localStorage errors gracefully', () => {
      expect.assertions(1);

      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      saveReferenceWorkspaceToStorage(createWorkspaceState());

      expect(console.warn).toHaveBeenCalledWith(
        'Failed to save reference workspace to localStorage:',
        expect.any(Error)
      );

      vi.restoreAllMocks();
    });
  });

  describe('loadReferenceWorkspaceFromStorage', () => {
    it('restores workspace state including reference configuration from localStorage', () => {
      expect.assertions(2);

      const state = createWorkspaceState({
        referenceConfiguration: createStoredReferenceConfiguration() as unknown as Record<
          string,
          unknown
        >,
        viewMode: 'reference',
        comparisonMetric: '2000',
        swatchChangeThreshold: 5
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

      const result = loadReferenceWorkspaceFromStorage();

      expect(result?.referenceConfiguration).toEqual(state.referenceConfiguration);
      expect(result?.viewMode).toBe('reference');
    });

    it('drops legacy reference configurations that are missing required frozen-theme fields', () => {
      expect.assertions(4);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...createWorkspaceState({
            referenceConfiguration: { baseColor: '#5EF784', numColors: 11 },
            viewMode: 'comparison',
            comparisonMetric: '2000',
            swatchChangeThreshold: 3
          }),
          swatchChangeThresholdsByMetric: {
            ok: 0.04,
            '2000': 3
          }
        })
      );

      const result = loadReferenceWorkspaceFromStorage();

      expect(result?.referenceConfiguration).toBeNull();
      expect(result?.viewMode).toBe('default');
      expect(result?.comparisonMetric).toBe('2000');
      expect(result?.swatchChangeThreshold).toBe(3);
    });

    it('restores remembered swatch thresholds for each comparison metric', () => {
      expect.assertions(1);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...createWorkspaceState({
            comparisonMetric: 'ok',
            swatchChangeThreshold: 0.04
          }),
          swatchChangeThresholdsByMetric: {
            ok: 0.04,
            '2000': 3
          }
        })
      );

      const result = loadReferenceWorkspaceFromStorage();

      expect(result).toMatchObject({
        swatchChangeThresholdsByMetric: {
          ok: 0.04,
          '2000': 3
        }
      });
    });

    it('preserves a legacy single threshold by seeding the active metric slot', () => {
      expect.assertions(1);

      // Legacy format: only swatchChangeThreshold, no swatchChangeThresholdsByMetric
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          createWorkspaceState({
            comparisonMetric: 'ok',
            swatchChangeThreshold: 0.05
          })
        )
      );

      const result = loadReferenceWorkspaceFromStorage();

      // The custom 0.05 lands in the active metric's slot; the other metric keeps its default
      expect(result).toMatchObject({
        comparisonMetric: 'ok',
        swatchChangeThreshold: 0.05,
        swatchChangeThresholdsByMetric: {
          ok: 0.05,
          '2000': 2
        }
      });
    });

    it('seeds the active metric slot from a legacy threshold when that metric is 2000', () => {
      expect.assertions(1);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          createWorkspaceState({
            comparisonMetric: '2000',
            swatchChangeThreshold: 5
          })
        )
      );

      const result = loadReferenceWorkspaceFromStorage();

      expect(result).toMatchObject({
        comparisonMetric: '2000',
        swatchChangeThreshold: 5,
        swatchChangeThresholdsByMetric: {
          ok: 0.02,
          '2000': 5
        }
      });
    });

    it('returns null when nothing is stored', () => {
      expect.assertions(1);

      expect(loadReferenceWorkspaceFromStorage()).toBeNull();
    });

    it('returns null for invalid JSON', () => {
      expect.assertions(1);

      vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem(STORAGE_KEY, 'not valid json');

      expect(loadReferenceWorkspaceFromStorage()).toBeNull();

      vi.restoreAllMocks();
    });

    it('returns null for stored state with invalid viewMode', () => {
      expect.assertions(1);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...createWorkspaceState(), viewMode: 'invalid' })
      );

      expect(loadReferenceWorkspaceFromStorage()).toBeNull();
    });

    it('returns null for stored state with invalid comparisonMetric', () => {
      expect.assertions(1);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...createWorkspaceState(), comparisonMetric: 'bad' })
      );

      expect(loadReferenceWorkspaceFromStorage()).toBeNull();
    });

    it('returns null for stored state with non-numeric swatchChangeThreshold', () => {
      expect.assertions(1);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...createWorkspaceState(), swatchChangeThreshold: 'not-a-number' })
      );

      expect(loadReferenceWorkspaceFromStorage()).toBeNull();
    });
  });

  describe('clearStoredReferenceWorkspace', () => {
    it('removes stored workspace from localStorage', () => {
      expect.assertions(1);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(createWorkspaceState()));

      clearStoredReferenceWorkspace();

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('handles localStorage errors gracefully', () => {
      expect.assertions(1);

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      clearStoredReferenceWorkspace();

      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to clear reference workspace from localStorage:',
        expect.any(Error)
      );

      vi.restoreAllMocks();
    });
  });
});
