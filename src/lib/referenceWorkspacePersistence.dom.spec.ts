import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import {
  saveReferenceWorkspaceToStorage,
  loadReferenceWorkspaceFromStorage,
  clearStoredReferenceWorkspace
} from './referenceWorkspacePersistence';
import type { StoredReferenceWorkspace } from './referenceWorkspacePersistence';

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
        referenceConfiguration: { baseColor: '#5EF784', numColors: 11 },
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
        referenceConfiguration: { baseColor: '#5EF784', numColors: 11 },
        viewMode: 'reference',
        comparisonMetric: '2000',
        swatchChangeThreshold: 5
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

      const result = loadReferenceWorkspaceFromStorage();

      expect(result?.referenceConfiguration).toEqual({ baseColor: '#5EF784', numColors: 11 });
      expect(result?.viewMode).toBe('reference');
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
