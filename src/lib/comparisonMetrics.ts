/**
 * Comparison Metrics
 *
 * Single source of truth for the set of color-difference metrics used by
 * Comparison View, their default Swatch Change Thresholds, and the colorjs.io
 * delta-E method each metric maps to. Keyed off the ColorDifferenceMetric union
 * so adding a metric is a one-file change.
 */

import type Color from 'colorjs.io';
import type { ColorDifferenceMetric } from './types';

/** The complete, ordered list of supported Comparison Metrics. */
export const COMPARISON_METRICS: ColorDifferenceMetric[] = ['ok', '2000'];

/** Each Comparison Metric's default Swatch Change Threshold, in that metric's units. */
export const DEFAULT_SWATCH_CHANGE_THRESHOLDS_BY_METRIC: Record<ColorDifferenceMetric, number> = {
  ok: 0.02,
  '2000': 2
};

/** Type guard for a valid Comparison Metric. */
export function isComparisonMetric(value: unknown): value is ColorDifferenceMetric {
  return COMPARISON_METRICS.includes(value as ColorDifferenceMetric);
}

/**
 * Computes the color difference between two colors using the given Comparison
 * Metric's delta-E method. The single home for the metric -> delta-E mapping.
 */
export function deltaEForMetric(a: Color, b: Color, metric: ColorDifferenceMetric): number {
  return metric === 'ok' ? a.deltaEOK(b) : a.deltaE2000(b);
}
