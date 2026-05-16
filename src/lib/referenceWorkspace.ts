/**
 * Reference Workspace State Management
 *
 * Manages the Reference Configuration lifecycle, view mode transitions, and comparison-specific settings.
 * This state is locally persisted, excluded from shared URL state, and participates in undo/redo history.
 */

import type { ColorDifferenceMetric } from './types';

/**
 * Serializable snapshot of reference workspace state.
 * Includes the pinned Reference Configuration, view mode, and comparison-specific settings.
 */
export interface ReferenceWorkspaceSnapshot {
  referenceConfiguration: Record<string, unknown> | null;
  viewMode: 'default' | 'reference' | 'comparison';
  comparisonMetric: ColorDifferenceMetric;
  swatchChangeThreshold: number;
}

export type ReferenceWorkspaceState = ReferenceWorkspaceSnapshot;
export type ReferenceWorkspaceActionResult = ReferenceWorkspaceState;

/**
 * Factory for creating a reference workspace manager.
 * Encapsulates all reference lifecycle actions and view mode logic.
 */
export function createReferenceWorkspaceManager(initialSnapshot: ReferenceWorkspaceSnapshot) {
  let state: ReferenceWorkspaceState = structuredClone(initialSnapshot);

  /**
   * Clones the current state for external consumption.
   * Ensures external mutations don't affect internal state.
   */
  function getCurrentState(): ReferenceWorkspaceState {
    return structuredClone(state);
  }

  /**
   * Updates internal state and returns a cloned copy.
   */
  function updateState(updater: (draft: ReferenceWorkspaceState) => void): ReferenceWorkspaceState {
    const draft = structuredClone(state);
    updater(draft);
    state = draft;
    return getCurrentState();
  }

  /**
   * Pins the provided configuration as the Reference Configuration.
   * Automatically enters Reference View.
   */
  function pinReference(config: Record<string, unknown>): ReferenceWorkspaceActionResult {
    return updateState((draft) => {
      draft.referenceConfiguration = structuredClone(config);
      draft.viewMode = 'reference';
    });
  }

  /**
   * Replaces the Reference Configuration with the current Palette Configuration.
   * Preserves the current view mode.
   */
  function replaceReference(
    currentConfig: Record<string, unknown>
  ): ReferenceWorkspaceActionResult {
    return updateState((draft) => {
      draft.referenceConfiguration = structuredClone(currentConfig);
      // View mode is preserved (reference or comparison)
    });
  }

  /**
   * Restores the Reference Configuration into the current Palette Configuration.
   * Does not clear the pinned baseline, so the user can continue comparing.
   */
  function restoreReference(): Record<string, unknown> | null {
    if (!state.referenceConfiguration) {
      return null;
    }
    return structuredClone(state.referenceConfiguration);
  }

  /**
   * Clears the Reference Configuration and returns to default view.
   */
  function clearReference(): ReferenceWorkspaceActionResult {
    return updateState((draft) => {
      draft.referenceConfiguration = null;
      draft.viewMode = 'default';
    });
  }

  /**
   * Enters Comparison View if a Reference Configuration exists.
   * Returns null if no reference is pinned.
   */
  function enterComparisonView(): ReferenceWorkspaceActionResult | null {
    if (!state.referenceConfiguration) {
      return null;
    }

    return updateState((draft) => {
      draft.viewMode = 'comparison';
    });
  }

  /**
   * Exits Comparison View and returns to Reference View.
   * Returns null if not currently in Comparison View.
   */
  function exitComparisonView(): ReferenceWorkspaceActionResult | null {
    if (state.viewMode !== 'comparison') {
      return null;
    }

    return updateState((draft) => {
      draft.viewMode = 'reference';
    });
  }

  /**
   * Sets the comparison metric for color difference calculations.
   */
  function setComparisonMetric(metric: ColorDifferenceMetric): ReferenceWorkspaceActionResult {
    return updateState((draft) => {
      draft.comparisonMetric = metric;
    });
  }

  /**
   * Sets the swatch change threshold for annotation visibility.
   * Valid range: [0, 100]. Values outside this range are clamped.
   */
  function setSwatchChangeThreshold(threshold: number): ReferenceWorkspaceActionResult {
    return updateState((draft) => {
      draft.swatchChangeThreshold = Math.max(0, Math.min(100, threshold));
    });
  }

  return {
    getState: getCurrentState,
    pinReference,
    replaceReference,
    restoreReference,
    clearReference,
    enterComparisonView,
    exitComparisonView,
    setComparisonMetric,
    setSwatchChangeThreshold
  };
}
