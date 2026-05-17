/**
 * Reference Workspace Persistence
 *
 * Saves and restores reference workspace state (Reference Configuration, view mode, comparison settings)
 * to/from localStorage. This is separate from the main palette configuration URL state.
 */

import type { ReferenceWorkspaceSnapshot } from './referenceWorkspace';
import type { ColorDifferenceMetric } from './types';

export type StoredReferenceWorkspace = ReferenceWorkspaceSnapshot;

const REFERENCE_WORKSPACE_STORAGE_KEY = 'chroma11y-reference-workspace';

const VALID_VIEW_MODES: Array<'default' | 'reference' | 'comparison'> = [
  'default',
  'reference',
  'comparison'
];
const VALID_COMPARISON_METRICS: ColorDifferenceMetric[] = ['ok', '2000'];

/**
 * Type guard for validating ColorDifferenceMetric
 */
function isValidComparisonMetric(value: unknown): value is ColorDifferenceMetric {
  return VALID_COMPARISON_METRICS.includes(value as ColorDifferenceMetric);
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

  return true;
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

    return parsed;
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
