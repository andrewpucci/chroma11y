/**
 * Storage utilities tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { saveStateToStorage, loadStateFromStorage, clearStoredState } from './storageUtils';
import type { SerializableColorState } from './types';

describe('storageUtils', () => {
  const mockState: SerializableColorState = {
    numColors: 11,
    numPalettes: 11,
    baseColor: '#1862E6',
    warmth: -7,
    x1: 0.16,
    y1: 0.0,
    x2: 0.28,
    y2: 0.38,
    chromaMultiplier: 1.14,
    contrastMode: 'auto',
    lowStep: 0,
    highStep: 10,
    lightnessNudgers: [0, 0, 0],
    hueNudgers: [0, 0, 0],
    theme: 'light',
    displayColorSpace: 'hex',
    gamutSpace: 'srgb',
    themePreference: 'auto',
    swatchLabels: 'both',
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
    oklchDisplaySignificantDigits: 4
  };

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('saveStateToStorage', () => {
    it('saves state to localStorage', () => {
      expect.assertions(1);

      saveStateToStorage(mockState);

      const stored = localStorage.getItem('chroma11y-state');
      expect(stored).toBe(JSON.stringify(mockState));
    });

    it('handles localStorage errors gracefully', () => {
      expect.assertions(1);

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      saveStateToStorage(mockState);

      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to save state to localStorage:',
        expect.any(Error)
      );

      warnSpy.mockRestore();
      setItemSpy.mockRestore();
    });
  });

  describe('loadStateFromStorage', () => {
    it('returns null when no state is stored', () => {
      expect.assertions(1);

      const result = loadStateFromStorage();

      expect(result).toBeNull();
    });

    it('loads and parses stored state', () => {
      expect.assertions(1);

      localStorage.setItem('chroma11y-state', JSON.stringify(mockState));

      const result = loadStateFromStorage();

      expect(result).toEqual(mockState);
    });

    it('returns null for invalid JSON', () => {
      expect.assertions(1);

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem('chroma11y-state', 'not valid json');

      const result = loadStateFromStorage();

      expect(result).toBeNull();

      warnSpy.mockRestore();
    });

    it('returns null for non-object stored value', () => {
      expect.assertions(1);

      localStorage.setItem('chroma11y-state', '"string value"');

      const result = loadStateFromStorage();

      expect(result).toBeNull();
    });

    it('returns null for null stored value', () => {
      expect.assertions(1);

      localStorage.setItem('chroma11y-state', 'null');

      const result = loadStateFromStorage();

      expect(result).toBeNull();
    });

    it('strips invalid displayColorSpace', () => {
      expect.assertions(2);

      const invalidState = { ...mockState, displayColorSpace: 'invalid' };
      localStorage.setItem('chroma11y-state', JSON.stringify(invalidState));

      const result = loadStateFromStorage();

      expect(result).not.toBeNull();
      expect(result?.displayColorSpace).toBeUndefined();
    });

    it('strips invalid gamutSpace', () => {
      expect.assertions(2);

      const invalidState = { ...mockState, gamutSpace: 'invalid' };
      localStorage.setItem('chroma11y-state', JSON.stringify(invalidState));

      const result = loadStateFromStorage();

      expect(result).not.toBeNull();
      expect(result?.gamutSpace).toBeUndefined();
    });

    it('strips invalid themePreference', () => {
      expect.assertions(2);

      const invalidState = { ...mockState, themePreference: 'invalid' };
      localStorage.setItem('chroma11y-state', JSON.stringify(invalidState));

      const result = loadStateFromStorage();

      expect(result).not.toBeNull();
      expect(result?.themePreference).toBeUndefined();
    });

    it('strips invalid swatchLabels', () => {
      expect.assertions(2);

      const invalidState = { ...mockState, swatchLabels: 'invalid' };
      localStorage.setItem('chroma11y-state', JSON.stringify(invalidState));

      const result = loadStateFromStorage();

      expect(result).not.toBeNull();
      expect(result?.swatchLabels).toBeUndefined();
    });

    it('strips invalid contrastAlgorithm', () => {
      expect.assertions(2);

      const invalidState = { ...mockState, contrastAlgorithm: 'invalid' };
      localStorage.setItem('chroma11y-state', JSON.stringify(invalidState));

      const result = loadStateFromStorage();

      expect(result).not.toBeNull();
      expect(result?.contrastAlgorithm).toBeUndefined();
    });

    it('strips invalid showSwatchContrastIndicators', () => {
      expect.assertions(2);

      const invalidState = { ...mockState, showSwatchContrastIndicators: 'invalid' };
      localStorage.setItem('chroma11y-state', JSON.stringify(invalidState));

      const result = loadStateFromStorage();

      expect(result).not.toBeNull();
      expect(result?.showSwatchContrastIndicators).toBe(true);
    });

    it('strips invalid swatchContrastIndicators object', () => {
      expect.assertions(2);

      const invalidState = {
        ...mockState,
        swatchContrastIndicators: {
          wcagThreeToOne: true,
          wcagAA: true,
          wcagAAA: 'nope',
          apcaLarge: true,
          apcaFluent: true,
          apcaBody: true
        }
      };
      localStorage.setItem('chroma11y-state', JSON.stringify(invalidState));

      const result = loadStateFromStorage();

      expect(result).not.toBeNull();
      expect(result?.swatchContrastIndicators).toEqual({
        wcagThreeToOne: true,
        wcagAA: true,
        wcagAAA: true,
        apcaLarge: true,
        apcaFluent: true,
        apcaBody: true
      });
    });

    it('maps legacy showSwatchContrastIndicators false to all indicator levels hidden', () => {
      expect.assertions(2);

      const legacyState = { ...mockState, showSwatchContrastIndicators: false };
      delete legacyState.swatchContrastIndicators;
      localStorage.setItem('chroma11y-state', JSON.stringify(legacyState));

      const result = loadStateFromStorage();

      expect(result?.showSwatchContrastIndicators).toBe(false);
      expect(result?.swatchContrastIndicators).toEqual({
        wcagThreeToOne: false,
        wcagAA: false,
        wcagAAA: false,
        apcaLarge: false,
        apcaFluent: false,
        apcaBody: false
      });
    });

    it('maps legacy indicator objects without wcagThreeToOne to new shape', () => {
      expect.assertions(2);

      const legacyState = {
        ...mockState,
        swatchContrastIndicators: {
          wcagAA: true,
          wcagAAA: false,
          apcaLarge: true,
          apcaFluent: true,
          apcaBody: true
        }
      };
      localStorage.setItem('chroma11y-state', JSON.stringify(legacyState));

      const result = loadStateFromStorage();

      expect(result?.swatchContrastIndicators?.wcagThreeToOne).toBe(true);
      expect(result?.swatchContrastIndicators?.wcagAAA).toBe(false);
    });

    it('strips invalid oklchDisplaySignificantDigits', () => {
      expect.assertions(2);

      const invalidState = { ...mockState, oklchDisplaySignificantDigits: 99 };
      localStorage.setItem('chroma11y-state', JSON.stringify(invalidState));

      const result = loadStateFromStorage();

      expect(result).not.toBeNull();
      expect(result?.oklchDisplaySignificantDigits).toBeUndefined();
    });

    it('preserves valid display settings', () => {
      expect.assertions(8);

      localStorage.setItem('chroma11y-state', JSON.stringify(mockState));

      const result = loadStateFromStorage();

      expect(result?.displayColorSpace).toBe('hex');
      expect(result?.gamutSpace).toBe('srgb');
      expect(result?.themePreference).toBe('auto');
      expect(result?.swatchLabels).toBe('both');
      expect(result?.showSwatchContrastIndicators).toBe(true);
      expect(result?.swatchContrastIndicators).toEqual(mockState.swatchContrastIndicators);
      expect(result?.contrastAlgorithm).toBe('WCAG');
      expect(result?.oklchDisplaySignificantDigits).toBe(4);
    });
  });

  describe('clearStoredState', () => {
    it('removes state from localStorage', () => {
      expect.assertions(1);

      localStorage.setItem('chroma11y-state', JSON.stringify(mockState));

      clearStoredState();

      expect(localStorage.getItem('chroma11y-state')).toBeNull();
    });

    it('handles localStorage errors gracefully', () => {
      expect.assertions(1);

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      clearStoredState();

      expect(warnSpy).toHaveBeenCalledWith('Failed to clear localStorage:', expect.any(Error));

      warnSpy.mockRestore();
      removeItemSpy.mockRestore();
    });
  });
});
