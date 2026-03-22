/**
 * Local Storage Persistence Utilities
 * Saves and restores Chroma11y state to/from localStorage
 */

import type { SerializableColorState } from './types';
import type {
  ColorDifferenceMetric,
  DisplayColorSpace,
  GamutSpace,
  ThemePreference,
  SwatchLabels,
  ContrastAlgorithm,
  OklchDisplaySignificantDigits,
  SwatchContrastIndicators,
  Constraint,
  ContrastReference,
  ConstraintThresholdKey
} from './types';
import { normalizeCustomPaletteName, normalizeCustomPaletteNames } from './paletteNameUtils';

export type StoredColorState = SerializableColorState;
export interface StoredUiPreferences {
  compactSections: {
    generation: boolean;
    constraints: boolean;
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
const VALID_CONSTRAINT_LEVELS: ConstraintThresholdKey[] = [
  'wcagThreeToOne',
  'wcagAA',
  'wcagAAA',
  'apcaLarge',
  'apcaFluent',
  'apcaBody'
];
const VALID_COLOR_DIFFERENCE_METRICS: ColorDifferenceMetric[] = ['ok', '2000'];

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

function isValidContrastReference(value: unknown): value is ContrastReference {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  if (candidate.kind !== 'neutral' && candidate.kind !== 'palette') return false;
  if (typeof candidate.stepIndex !== 'number' || !Number.isInteger(candidate.stepIndex))
    return false;
  if (candidate.kind === 'palette') {
    return typeof candidate.paletteIndex === 'number' && Number.isInteger(candidate.paletteIndex);
  }
  return candidate.paletteIndex === undefined;
}

function isValidConstraint(value: unknown): value is Constraint {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== 'string' || typeof candidate.enabled !== 'boolean') return false;

  if (candidate.type === 'target-color') {
    return (
      typeof candidate.targetHex === 'string' &&
      (candidate.mustPass === undefined || typeof candidate.mustPass === 'boolean') &&
      (candidate.metric === undefined ||
        VALID_COLOR_DIFFERENCE_METRICS.includes(candidate.metric as ColorDifferenceMetric))
    );
  }

  if (candidate.type === 'contrast-rule') {
    return (
      (candidate.scope === 'neutral' || candidate.scope === 'all-palettes') &&
      typeof candidate.stepIndex === 'number' &&
      Number.isInteger(candidate.stepIndex) &&
      (candidate.reference === 'low' || candidate.reference === 'high') &&
      (candidate.algorithm === 'WCAG' || candidate.algorithm === 'APCA') &&
      VALID_CONSTRAINT_LEVELS.includes(candidate.level as ConstraintThresholdKey)
    );
  }

  return false;
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
    if (state.lowReference && !isValidContrastReference(state.lowReference)) {
      delete state.lowReference;
    }
    if (state.highReference && !isValidContrastReference(state.highReference)) {
      delete state.highReference;
    }
    if (state.constraints && !Array.isArray(state.constraints)) {
      delete state.constraints;
    } else if (state.constraints) {
      state.constraints = state.constraints.filter((constraint) => isValidConstraint(constraint));
    }
    if (
      state.constraintSolverSummary &&
      (typeof state.constraintSolverSummary !== 'object' ||
        typeof state.constraintSolverSummary.solvedAt !== 'number' ||
        typeof state.constraintSolverSummary.passCount !== 'number' ||
        typeof state.constraintSolverSummary.warningCount !== 'number' ||
        typeof state.constraintSolverSummary.failCount !== 'number' ||
        typeof state.constraintSolverSummary.applied !== 'boolean' ||
        typeof state.constraintSolverSummary.changed !== 'boolean' ||
        typeof state.constraintSolverSummary.scoreBefore !== 'number' ||
        typeof state.constraintSolverSummary.scoreAfter !== 'number')
    ) {
      delete state.constraintSolverSummary;
    }
    if (
      state.solverAdjustmentSnapshot &&
      (typeof state.solverAdjustmentSnapshot !== 'object' ||
        typeof state.solverAdjustmentSnapshot.baseColor !== 'string' ||
        typeof state.solverAdjustmentSnapshot.warmth !== 'number' ||
        typeof state.solverAdjustmentSnapshot.chromaMultiplier !== 'number' ||
        typeof state.solverAdjustmentSnapshot.x1 !== 'number' ||
        typeof state.solverAdjustmentSnapshot.y1 !== 'number' ||
        typeof state.solverAdjustmentSnapshot.x2 !== 'number' ||
        typeof state.solverAdjustmentSnapshot.y2 !== 'number' ||
        !Array.isArray(state.solverAdjustmentSnapshot.lightnessNudgers) ||
        !Array.isArray(state.solverAdjustmentSnapshot.hueNudgers) ||
        (state.solverAdjustmentSnapshot.stepSaturationNudgers !== undefined &&
          !Array.isArray(state.solverAdjustmentSnapshot.stepSaturationNudgers)) ||
        (state.solverAdjustmentSnapshot.paletteSaturationNudgers !== undefined &&
          !Array.isArray(state.solverAdjustmentSnapshot.paletteSaturationNudgers)))
    ) {
      delete state.solverAdjustmentSnapshot;
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
    typeof sectionState.constraints === 'boolean' &&
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
