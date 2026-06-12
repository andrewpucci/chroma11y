/**
 * Reference Workspace Persistence
 *
 * Saves and restores reference workspace state (Reference Configuration, view mode, comparison settings)
 * to/from localStorage. This is separate from the main palette configuration URL state.
 */

import type { ReferenceWorkspaceSnapshot } from './referenceWorkspace';
import type { ReferenceConfiguration } from './referenceConfiguration';
import type { ColorDifferenceMetric, ContrastReference } from './types';
import {
  COMPARISON_METRICS,
  DEFAULT_SWATCH_CHANGE_THRESHOLDS_BY_METRIC,
  isComparisonMetric
} from './comparisonMetrics';

export type StoredReferenceWorkspace = ReferenceWorkspaceSnapshot;

const REFERENCE_WORKSPACE_STORAGE_KEY = 'chroma11y-reference-workspace';

const VALID_VIEW_MODES: Array<'default' | 'reference' | 'comparison'> = [
  'default',
  'reference',
  'comparison'
];

/**
 * Type guard for validating ColorDifferenceMetric
 */
function isValidComparisonMetric(value: unknown): value is ColorDifferenceMetric {
  return isComparisonMetric(value);
}

function isValidThresholdsByMetric(
  value: unknown
): value is Partial<Record<ColorDifferenceMetric, number>> {
  if (value === undefined) return true;
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;
  for (const metric of COMPARISON_METRICS) {
    if (candidate[metric] !== undefined && typeof candidate[metric] !== 'number') {
      return false;
    }
  }

  return true;
}

function isValidThemePreference(value: unknown): value is 'auto' | 'light' | 'dark' {
  return value === 'auto' || value === 'light' || value === 'dark';
}

function isValidResolvedTheme(value: unknown): value is 'light' | 'dark' {
  return value === 'light' || value === 'dark';
}

function isValidNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'number');
}

function isValidStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isValidContrastReference(value: unknown): value is ContrastReference {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  if (candidate.kind !== 'neutral' && candidate.kind !== 'palette') {
    return false;
  }

  if (typeof candidate.stepIndex !== 'number') {
    return false;
  }

  if (candidate.kind === 'palette' && typeof candidate.paletteIndex !== 'number') {
    return false;
  }

  return true;
}

function isValidReferenceConfiguration(value: unknown): value is ReferenceConfiguration {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.pinnedAt === 'number' &&
    typeof candidate.baseColor === 'string' &&
    typeof candidate.warmth === 'number' &&
    (candidate.warmthHue === undefined || typeof candidate.warmthHue === 'number') &&
    typeof candidate.chromaMultiplier === 'number' &&
    typeof candidate.numColors === 'number' &&
    typeof candidate.numPalettes === 'number' &&
    typeof candidate.x1 === 'number' &&
    typeof candidate.y1 === 'number' &&
    typeof candidate.x2 === 'number' &&
    typeof candidate.y2 === 'number' &&
    isValidNumberArray(candidate.lightnessNudgers) &&
    isValidNumberArray(candidate.hueNudgers) &&
    isValidNumberArray(candidate.stepSaturationNudgers) &&
    isValidNumberArray(candidate.paletteSaturationNudgers) &&
    isValidNumberArray(candidate.paletteChromaNudgers) &&
    (candidate.contrastMode === 'auto' || candidate.contrastMode === 'manual') &&
    typeof candidate.lowStep === 'number' &&
    typeof candidate.highStep === 'number' &&
    isValidContrastReference(candidate.lowReference) &&
    isValidContrastReference(candidate.highReference) &&
    typeof candidate.contrast === 'object' &&
    candidate.contrast !== null &&
    typeof (candidate.contrast as Record<string, unknown>).low === 'string' &&
    typeof (candidate.contrast as Record<string, unknown>).high === 'string' &&
    typeof candidate.solveAdjacentStopLows === 'boolean' &&
    isValidThemePreference(candidate.themePreference) &&
    isValidResolvedTheme(candidate.resolvedTheme) &&
    (candidate.customNeutralName === undefined ||
      typeof candidate.customNeutralName === 'string') &&
    (candidate.customPaletteNames === undefined ||
      isValidStringArray(candidate.customPaletteNames)) &&
    Array.isArray(candidate.constraints)
  );
}

/**
 * Type guard for validating view mode
 */
function isValidViewMode(value: unknown): value is 'default' | 'reference' | 'comparison' {
  return (
    typeof value === 'string' &&
    VALID_VIEW_MODES.includes(value as 'default' | 'reference' | 'comparison')
  );
}

/**
 * Type guard for stored reference workspace
 */
function isValidStoredReferenceWorkspace(value: unknown): value is StoredReferenceWorkspace {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;

  // Check referenceConfiguration is null or an object
  if (candidate.referenceConfiguration !== null) {
    if (typeof candidate.referenceConfiguration !== 'object') {
      return false;
    }
  }

  // Check viewMode
  if (!isValidViewMode(candidate.viewMode)) {
    return false;
  }

  // Check comparisonMetric
  if (!isValidComparisonMetric(candidate.comparisonMetric)) {
    return false;
  }

  // Check swatchChangeThreshold is a number
  if (typeof candidate.swatchChangeThreshold !== 'number') {
    return false;
  }

  if (!isValidThresholdsByMetric(candidate.swatchChangeThresholdsByMetric)) {
    return false;
  }

  return true;
}

function migrateStoredReferenceWorkspace(
  value: StoredReferenceWorkspace
): StoredReferenceWorkspace {
  const referenceConfiguration = isValidReferenceConfiguration(value.referenceConfiguration)
    ? value.referenceConfiguration
    : null;
  // Legacy workspaces stored only a single swatchChangeThreshold with no
  // per-metric map. Seed the active metric's slot from that legacy value (it was
  // authored in that metric's scale); other metrics keep their defaults.
  const legacyThresholdsByMetric: Partial<Record<ColorDifferenceMetric, number>> = {
    [value.comparisonMetric]: value.swatchChangeThreshold
  };
  const storedThresholdsByMetric = value.swatchChangeThresholdsByMetric ?? legacyThresholdsByMetric;
  const swatchChangeThresholdsByMetric = COMPARISON_METRICS.reduce(
    (result, metric) => {
      result[metric] = Math.max(
        0,
        storedThresholdsByMetric[metric] ?? DEFAULT_SWATCH_CHANGE_THRESHOLDS_BY_METRIC[metric]
      );
      return result;
    },
    {} as Record<ColorDifferenceMetric, number>
  );

  return {
    referenceConfiguration,
    viewMode: referenceConfiguration ? value.viewMode : 'default',
    comparisonMetric: value.comparisonMetric,
    swatchChangeThreshold: swatchChangeThresholdsByMetric[value.comparisonMetric],
    swatchChangeThresholdsByMetric
  };
}

/**
 * Saves reference workspace state to localStorage
 */
export function saveReferenceWorkspaceToStorage(state: StoredReferenceWorkspace): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(REFERENCE_WORKSPACE_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save reference workspace to localStorage:', error);
  }
}

/**
 * Loads reference workspace state from localStorage
 */
export function loadReferenceWorkspaceFromStorage(): StoredReferenceWorkspace | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(REFERENCE_WORKSPACE_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as unknown;

    if (!isValidStoredReferenceWorkspace(parsed)) {
      return null;
    }

    return migrateStoredReferenceWorkspace(parsed);
  } catch (error) {
    console.warn('Failed to load reference workspace from localStorage:', error);
    return null;
  }
}

/**
 * Clears saved reference workspace from localStorage
 */
export function clearStoredReferenceWorkspace(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(REFERENCE_WORKSPACE_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear reference workspace from localStorage:', error);
  }
}
