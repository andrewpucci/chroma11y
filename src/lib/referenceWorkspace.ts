import type { HistorySnapshot } from './history';
import type { ColorDifferenceMetric } from './types';

export interface ReferenceWorkspaceSnapshot {
  referenceConfiguration: Record<string, unknown> | null;
  viewMode: 'default' | 'reference' | 'comparison';
  comparisonMetric: ColorDifferenceMetric;
  swatchChangeThreshold: number;
  swatchChangeThresholdsByMetric?: Partial<Record<ColorDifferenceMetric, number>>;
}

/**
 * Combined snapshot tracking both palette and reference workspace state.
 * Stored in the (generic) history stack so undo/redo restores both sides coherently.
 */
export interface ReferenceHistorySnapshot {
  palette: HistorySnapshot;
  reference: ReferenceWorkspaceSnapshot;
}
