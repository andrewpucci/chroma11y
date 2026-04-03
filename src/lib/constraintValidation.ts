import { isValidHexColor } from './colorUtils';
import type { ColorDifferenceMetric, Constraint, ConstraintThresholdKey } from './types';

const VALID_CONSTRAINT_LEVELS: ConstraintThresholdKey[] = [
  'wcagThreeToOne',
  'wcagAA',
  'wcagAAA',
  'apcaLarge',
  'apcaFluent',
  'apcaBody'
];

const VALID_COLOR_DIFFERENCE_METRICS: ColorDifferenceMetric[] = ['ok', '2000'];

export function isValidConstraint(value: unknown): value is Constraint {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== 'string' || typeof candidate.enabled !== 'boolean') return false;

  if (candidate.type === 'target-color') {
    return (
      typeof candidate.targetHex === 'string' &&
      isValidHexColor(candidate.targetHex) &&
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
      VALID_CONSTRAINT_LEVELS.includes(candidate.level as ConstraintThresholdKey) &&
      (candidate.fitToThreshold === undefined || typeof candidate.fitToThreshold === 'boolean')
    );
  }

  return false;
}
