import type { ColorDifferenceMetric } from './types';

export interface ReferenceWorkspaceSnapshot {
  referenceConfiguration: Record<string, unknown> | null;
  viewMode: 'default' | 'reference' | 'comparison';
  comparisonMetric: ColorDifferenceMetric;
  swatchChangeThreshold: number;
}
