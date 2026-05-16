/**
 * Configuration Diff generation for Reference View.
 *
 * Compares current and reference Palette Configurations and produces
 * a structured diff focused on design-relevant changes:
 * - Generation settings (numColors, numPalettes, baseColor, warmth, etc.)
 * - Contrast settings (mode, low/high reference, manual colors)
 * - Custom naming (neutral and palette-specific)
 *
 * Excludes inspection-only settings:
 * - displayColorSpace, gamutSpace, themePreference
 * - swatchLabels, showSwatchGamutWarnings, showSwatchContrastIndicators
 * - cvdMode, theme preference
 *
 * Results are structured for presentation in Configuration Diff UI.
 */

/**
 * A single change entry in the configuration diff
 */
export interface DiffEntry {
  field: string;
  label: string;
  currentValue: unknown;
  referenceValue: unknown;
}

/**
 * Structured configuration diff result
 */
export interface ConfigurationDiff {
  hasChanges: boolean;
  generationChanges: DiffEntry[];
  contrastChanges: DiffEntry[];
  namingChanges: DiffEntry[];
  timestamp: number;
}

/**
 * Fields that are part of the design-relevant configuration
 */
const GENERATION_FIELDS = [
  'numColors',
  'numPalettes',
  'baseColor',
  'warmth',
  'warmthHue',
  'x1',
  'y1',
  'x2',
  'y2',
  'chromaMultiplier',
  'lightnessNudgers',
  'hueNudgers',
  'stepSaturationNudgers',
  'paletteSaturationNudgers',
  'paletteChromaNudgers'
];

const CONTRAST_FIELDS = [
  'contrastMode',
  'lowStep',
  'highStep',
  'lowReference',
  'highReference',
  'contrast',
  'contrastAlgorithm',
  'solveAdjacentStopLows'
];

const NAMING_FIELDS = ['customNeutralName', 'customPaletteNames'];

/**
 * Friendly labels for field names in the diff output
 */
const FIELD_LABELS: Record<string, string> = {
  numColors: 'Number of steps',
  numPalettes: 'Number of palettes',
  baseColor: 'Base color',
  warmth: 'Warmth',
  warmthHue: 'Warmth hue',
  x1: 'Low contrast X',
  y1: 'Low contrast Y',
  x2: 'High contrast X',
  y2: 'High contrast Y',
  chromaMultiplier: 'Chroma multiplier',
  lightnessNudgers: 'Lightness adjustments',
  hueNudgers: 'Hue adjustments',
  stepSaturationNudgers: 'Step saturation adjustments',
  paletteSaturationNudgers: 'Palette saturation adjustments',
  paletteChromaNudgers: 'Palette chroma adjustments',
  contrastMode: 'Contrast mode',
  lowStep: 'Low contrast step',
  highStep: 'High contrast step',
  lowReference: 'Low contrast reference',
  highReference: 'High contrast reference',
  contrast: 'Contrast colors',
  contrastAlgorithm: 'Contrast algorithm',
  solveAdjacentStopLows: 'Solve adjacent stops',
  customNeutralName: 'Neutral palette name',
  customPaletteNames: 'Palette names'
};

/**
 * Helper to check if two values are deeply equal
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false;
    }
  }

  return true;
}

/**
 * Compare two color state configurations and produce a structured diff.
 *
 * Focuses on design-relevant changes and excludes inspection-only settings.
 * Results are categorized as generation, contrast, or naming changes.
 *
 * @param current Current palette configuration
 * @param reference Reference palette configuration
 * @returns Structured diff suitable for presentation
 */
export function diffColorStates(
  current: Record<string, unknown>,
  reference: Record<string, unknown>
): ConfigurationDiff {
  const generationChanges: DiffEntry[] = [];
  const contrastChanges: DiffEntry[] = [];
  const namingChanges: DiffEntry[] = [];

  // Check generation settings
  for (const field of GENERATION_FIELDS) {
    const currentValue = current[field];
    const referenceValue = reference[field];

    if (!deepEqual(currentValue, referenceValue)) {
      generationChanges.push({
        field,
        label: FIELD_LABELS[field] ?? field,
        currentValue,
        referenceValue
      });
    }
  }

  // Check contrast settings
  for (const field of CONTRAST_FIELDS) {
    const currentValue = current[field];
    const referenceValue = reference[field];

    if (!deepEqual(currentValue, referenceValue)) {
      contrastChanges.push({
        field,
        label: FIELD_LABELS[field] ?? field,
        currentValue,
        referenceValue
      });
    }
  }

  // Check naming settings
  for (const field of NAMING_FIELDS) {
    const currentValue = current[field];
    const referenceValue = reference[field];

    if (!deepEqual(currentValue, referenceValue)) {
      namingChanges.push({
        field,
        label: FIELD_LABELS[field] ?? field,
        currentValue,
        referenceValue
      });
    }
  }

  const hasChanges =
    generationChanges.length > 0 || contrastChanges.length > 0 || namingChanges.length > 0;

  return {
    hasChanges,
    generationChanges,
    contrastChanges,
    namingChanges,
    timestamp: Date.now()
  };
}
