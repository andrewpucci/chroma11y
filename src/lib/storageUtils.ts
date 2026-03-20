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
  OklchDisplaySignificantDigits,
  SwatchContrastIndicators
} from './types';
import { normalizeCustomPaletteName, normalizeCustomPaletteNames } from './paletteNameUtils';

export type StoredColorState = SerializableColorState;
export interface StoredUiPreferences {
  compactSections: {
    generation: boolean;
    contrast: boolean;
    output: boolean;
    export: boolean;
  };
  generationAdvancedOpen: boolean;
  outputAdvancedOpen: boolean;
}

const STORAGE_KEY = 'chroma11y-state';
const UI_PREFERENCES_STORAGE_KEY = 'chroma11y-ui-preferences';

const VALID_DISPLAY_SPACES: DisplayColorSpace[] = ['hex', 'rgb', 'oklch', 'hsl'];
const VALID_GAMUT_SPACES: GamutSpace[] = ['srgb', 'p3', 'rec2020'];
const VALID_THEME_PREFS: ThemePreference[] = ['light', 'dark', 'auto'];
const VALID_SWATCH_LABELS: SwatchLabels[] = ['both', 'step', 'value', 'none'];
const VALID_CONTRAST_ALGOS: ContrastAlgorithm[] = ['WCAG', 'APCA'];
const VALID_OKLCH_SIG_DIGITS: OklchDisplaySignificantDigits[] = [1, 2, 3, 4, 5, 6];

function isValidSwatchContrastIndicators(value: unknown): value is SwatchContrastIndicators {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;
  const keys: (keyof SwatchContrastIndicators)[] = [
    'wcagThreeToOne',
    'wcagAA',
    'wcagAAA',
    'apcaLarge',
    'apcaFluent',
    'apcaBody'
  ];
  return keys.every((key) => typeof candidate[key] === 'boolean');
}

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
      state.showSwatchGamutWarnings !== undefined &&
      typeof state.showSwatchGamutWarnings !== 'boolean'
    ) {
      delete state.showSwatchGamutWarnings;
    }
    if (
      state.showSwatchContrastIndicators !== undefined &&
      typeof state.showSwatchContrastIndicators !== 'boolean'
    ) {
      delete state.showSwatchContrastIndicators;
    }
    if (
      state.swatchContrastIndicators !== undefined &&
      !isValidSwatchContrastIndicators(state.swatchContrastIndicators)
    ) {
      const legacyIndicators = state.swatchContrastIndicators as Partial<SwatchContrastIndicators>;
      if (
        typeof legacyIndicators?.wcagAA === 'boolean' &&
        typeof legacyIndicators?.wcagAAA === 'boolean' &&
        typeof legacyIndicators?.apcaLarge === 'boolean' &&
        typeof legacyIndicators?.apcaFluent === 'boolean' &&
        typeof legacyIndicators?.apcaBody === 'boolean'
      ) {
        state.swatchContrastIndicators = {
          wcagThreeToOne: legacyIndicators.wcagAA || legacyIndicators.wcagAAA,
          wcagAA: legacyIndicators.wcagAA,
          wcagAAA: legacyIndicators.wcagAAA,
          apcaLarge: legacyIndicators.apcaLarge,
          apcaFluent: legacyIndicators.apcaFluent,
          apcaBody: legacyIndicators.apcaBody
        };
      } else if (
        typeof legacyIndicators?.wcagAA === 'boolean' &&
        typeof legacyIndicators?.wcagAAA === 'boolean' &&
        typeof legacyIndicators?.apcaLarge === 'boolean' &&
        typeof legacyIndicators?.apcaBody === 'boolean'
      ) {
        state.swatchContrastIndicators = {
          wcagThreeToOne: legacyIndicators.wcagAA || legacyIndicators.wcagAAA,
          wcagAA: legacyIndicators.wcagAA,
          wcagAAA: legacyIndicators.wcagAAA,
          apcaLarge: legacyIndicators.apcaLarge,
          apcaFluent: legacyIndicators.apcaBody,
          apcaBody: legacyIndicators.apcaBody
        };
      } else {
        delete state.swatchContrastIndicators;
      }
    }
    if (!state.swatchContrastIndicators && state.showSwatchContrastIndicators !== undefined) {
      state.swatchContrastIndicators = {
        wcagThreeToOne: state.showSwatchContrastIndicators,
        wcagAA: state.showSwatchContrastIndicators,
        wcagAAA: state.showSwatchContrastIndicators,
        apcaLarge: state.showSwatchContrastIndicators,
        apcaFluent: state.showSwatchContrastIndicators,
        apcaBody: state.showSwatchContrastIndicators
      };
    }
    if (state.swatchContrastIndicators && state.showSwatchContrastIndicators === undefined) {
      state.showSwatchContrastIndicators = Object.values(state.swatchContrastIndicators).some(
        Boolean
      );
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

    state.customNeutralName = normalizeCustomPaletteName(state.customNeutralName);
    state.customPaletteNames = normalizeCustomPaletteNames(
      state.customPaletteNames,
      state.numPalettes
    );

    const effectiveDisplaySpace = state.displayColorSpace ?? 'hex';
    if (state.gamutSpace && state.gamutSpace !== 'srgb' && effectiveDisplaySpace === 'hex') {
      state.gamutSpace = 'srgb';
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

function isValidStoredUiPreferences(value: unknown): value is StoredUiPreferences {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;
  const compactSections = candidate.compactSections;

  if (typeof compactSections !== 'object' || compactSections === null) return false;

  const sectionState = compactSections as Record<string, unknown>;

  return (
    typeof sectionState.generation === 'boolean' &&
    typeof sectionState.contrast === 'boolean' &&
    typeof sectionState.output === 'boolean' &&
    typeof sectionState.export === 'boolean' &&
    typeof candidate.generationAdvancedOpen === 'boolean' &&
    typeof candidate.outputAdvancedOpen === 'boolean'
  );
}

export function saveUiPreferencesToStorage(preferences: StoredUiPreferences): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(UI_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.warn('Failed to save UI preferences to localStorage:', error);
  }
}

export function loadUiPreferencesFromStorage(): StoredUiPreferences | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(UI_PREFERENCES_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as unknown;
    return isValidStoredUiPreferences(parsed) ? parsed : null;
  } catch (error) {
    console.warn('Failed to load UI preferences from localStorage:', error);
    return null;
  }
}
