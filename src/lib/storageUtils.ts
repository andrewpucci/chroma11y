/**
 * Local Storage Persistence Utilities
 * Saves and restores Chroma11y state to/from localStorage
 */

import type { SerializableColorState } from './types';
import type {
  DisplayColorSpace,
  GamutSpace,
  ThemePreference,
  SwatchLabels,
  ContrastAlgorithm,
  OklchDisplaySignificantDigits
} from './types';

export type StoredColorState = SerializableColorState;

const STORAGE_KEY = 'chroma11y-state';

const VALID_DISPLAY_SPACES: DisplayColorSpace[] = ['hex', 'rgb', 'oklch', 'hsl'];
const VALID_GAMUT_SPACES: GamutSpace[] = ['srgb', 'p3', 'rec2020'];
const VALID_THEME_PREFS: ThemePreference[] = ['light', 'dark', 'auto'];
const VALID_SWATCH_LABELS: SwatchLabels[] = ['both', 'step', 'value', 'none'];
const VALID_CONTRAST_ALGOS: ContrastAlgorithm[] = ['WCAG', 'APCA'];
const VALID_OKLCH_SIG_DIGITS: OklchDisplaySignificantDigits[] = [1, 2, 3, 4, 5, 6];

/**
 * Saves state to localStorage
 */
export function saveStateToStorage(state: StoredColorState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save state to localStorage:', error);
  }
}

/**
 * Loads state from localStorage
 */
export function loadStateFromStorage(): StoredColorState | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const state = JSON.parse(stored) as StoredColorState;

    // Validate the loaded state has expected shape
    if (typeof state !== 'object' || state === null) {
      return null;
    }

    // Validate display settings — strip invalid values so store defaults apply
    if (
      state.displayColorSpace &&
      !VALID_DISPLAY_SPACES.includes(state.displayColorSpace as DisplayColorSpace)
    ) {
      delete state.displayColorSpace;
    }
    if (state.gamutSpace && !VALID_GAMUT_SPACES.includes(state.gamutSpace as GamutSpace)) {
      delete state.gamutSpace;
    }
    if (
      state.themePreference &&
      !VALID_THEME_PREFS.includes(state.themePreference as ThemePreference)
    ) {
      delete state.themePreference;
    }
    if (state.swatchLabels && !VALID_SWATCH_LABELS.includes(state.swatchLabels as SwatchLabels)) {
      delete state.swatchLabels;
    }
    if (
      state.contrastAlgorithm &&
      !VALID_CONTRAST_ALGOS.includes(state.contrastAlgorithm as ContrastAlgorithm)
    ) {
      delete state.contrastAlgorithm;
    }
    if (
      state.oklchDisplaySignificantDigits !== undefined &&
      !VALID_OKLCH_SIG_DIGITS.includes(
        state.oklchDisplaySignificantDigits as OklchDisplaySignificantDigits
      )
    ) {
      delete state.oklchDisplaySignificantDigits;
    }

    return state;
  } catch (error) {
    console.warn('Failed to load state from localStorage:', error);
    return null;
  }
}

/**
 * Clears saved state from localStorage
 */
export function clearStoredState(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
  }
}
