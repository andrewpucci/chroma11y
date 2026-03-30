import Color from 'colorjs.io';

import {
  CHROMA_MULTIPLIER_MIN,
  clampChromaMultiplier,
  getChromaMultiplierBounds
} from '$lib/chromaMultiplier';
import {
  colorToCssHex,
  generatePalettes,
  getContrastForAlgorithm,
  HUE_NUDGER_BOUNDS,
  isValidHexColor,
  LIGHTNESS_NUDGER_BOUNDS,
  type ColorGenParams
} from '$lib/colorUtils';
import {
  DEFAULT_NEUTRAL_PALETTE_NAME,
  getGeneratedPaletteFallbackName
} from '$lib/paletteNameUtils';
import type {
  AdjacentStopContrastEntry,
  ColorDifferenceMetric,
  Constraint,
  ConstraintResult,
  ConstraintSolverSummary,
  ConstraintStatus,
  ConstraintThresholdKey,
  ContrastAlgorithm,
  ContrastReference,
  ContrastRuleConstraint,
  SolverAdjustmentSnapshot,
  TargetColorConstraint
} from '$lib/types';

export const DELTA_E_OK_PASS_MAX = 0.02;
export const DELTA_E_OK_WARNING_MAX = 0.05;
export const DELTA_E_2000_PASS_MAX = 2;
export const DELTA_E_2000_WARNING_MAX = 5;

interface SwatchCandidate {
  color: Color;
  colorHex: string;
  paletteLabel: string;
  stepIndex: number;
  stepLabel: string;
  paletteIndex?: number;
  isNeutral: boolean;
}

interface ConstraintEvaluationContext {
  constraints: Constraint[];
  neutrals: Color[];
  palettes: Color[][];
  neutralLabel?: string;
  paletteLabels?: string[];
  lowContrastColor: string;
  highContrastColor: string;
}

interface SolverSettings extends SolverAdjustmentSnapshot {
  numColors: number;
  numPalettes: number;
  currentTheme: 'light' | 'dark';
  gamutSpace: 'srgb' | 'p3' | 'rec2020';
  constraints: Constraint[];
  lowReference: ContrastReference;
  highReference: ContrastReference;
  contrastMode: 'auto' | 'manual';
  manualContrast: {
    low: string;
    high: string;
  };
}

interface SolverCandidate {
  settings: SolverAdjustmentSnapshot;
  results: ConstraintResult[];
  summary: ConstraintSolverSummary;
  score: number;
  mustPassNonPassCount: number;
  mustPassOverflow: number;
  failCount: number;
  warningCount: number;
  overflow: number;
}

interface BezierControlPatch {
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

const SOLVER_BEZIER_PRESETS: BezierControlPatch[] = [
  { x1: 0.16, y1: 0, x2: 0.28, y2: 0.38 },
  { x1: 0.24, y1: 0.06, x2: 0.52, y2: 0.62 },
  { x1: 0.32, y1: 0.08, x2: 0.68, y2: 0.92 },
  { x1: 0.45, y1: 0.08, x2: 0.77, y2: 0.96 }
];

let constraintIdCounter = 0;

export function createConstraintId(): string {
  constraintIdCounter += 1;
  return `constraint-${Date.now()}-${constraintIdCounter}`;
}

export function createDefaultTargetColorConstraint(): TargetColorConstraint {
  return {
    id: createConstraintId(),
    type: 'target-color',
    enabled: true,
    targetHex: '#5EF784',
    mustPass: false,
    metric: 'ok'
  };
}

export function createDefaultContrastRuleConstraint(
  algorithm: ContrastAlgorithm
): ContrastRuleConstraint {
  return {
    id: createConstraintId(),
    type: 'contrast-rule',
    enabled: true,
    scope: 'all-palettes',
    stepIndex: 7,
    reference: 'low',
    algorithm,
    level: algorithm === 'APCA' ? 'apcaFluent' : 'wcagAA',
    fitToThreshold: false
  };
}

export function getTargetColorThresholds(metric: ColorDifferenceMetric): {
  passMax: number;
  warningMax: number;
} {
  return metric === '2000'
    ? {
        passMax: DELTA_E_2000_PASS_MAX,
        warningMax: DELTA_E_2000_WARNING_MAX
      }
    : {
        passMax: DELTA_E_OK_PASS_MAX,
        warningMax: DELTA_E_OK_WARNING_MAX
      };
}

export function getTargetColorMetricLabel(metric: ColorDifferenceMetric): string {
  return metric === '2000' ? 'ΔE2000' : 'ΔEOK';
}

export function getTargetColorStatus(
  deltaE: number,
  metric: ColorDifferenceMetric
): ConstraintStatus {
  const thresholds = getTargetColorThresholds(metric);
  if (deltaE <= thresholds.passMax) return 'pass';
  if (deltaE <= thresholds.warningMax) return 'warning';
  return 'fail';
}

function getTargetColorDifference(
  target: Color,
  candidate: Color,
  metric: ColorDifferenceMetric
): number {
  return metric === '2000' ? target.deltaE2000(candidate) : target.deltaEOK(candidate);
}

export function getConstraintThresholdValue(level: ConstraintThresholdKey): number {
  switch (level) {
    case 'wcagThreeToOne':
      return 3;
    case 'wcagAA':
      return 4.5;
    case 'wcagAAA':
      return 7;
    case 'apcaLarge':
      return 45;
    case 'apcaFluent':
      return 60;
    case 'apcaBody':
      return 75;
  }
}

export function getConstraintThresholdLabel(level: ConstraintThresholdKey): string {
  switch (level) {
    case 'wcagThreeToOne':
      return '3:1';
    case 'wcagAA':
      return 'AA';
    case 'wcagAAA':
      return 'AAA';
    case 'apcaLarge':
      return 'Large';
    case 'apcaFluent':
      return 'Fluent';
    case 'apcaBody':
      return 'Body';
  }
}

export function getThresholdOptionsForAlgorithm(
  algorithm: ContrastAlgorithm
): ConstraintThresholdKey[] {
  return algorithm === 'APCA'
    ? ['apcaLarge', 'apcaFluent', 'apcaBody']
    : ['wcagThreeToOne', 'wcagAA', 'wcagAAA'];
}

function getSwatchCandidates(
  neutrals: Color[],
  palettes: Color[][],
  neutralLabel: string = DEFAULT_NEUTRAL_PALETTE_NAME,
  paletteLabels: string[] = []
): SwatchCandidate[] {
  const candidates: SwatchCandidate[] = [];

  neutrals.forEach((color, stepIndex) => {
    candidates.push({
      color,
      colorHex: colorToCssHex(color),
      paletteLabel: neutralLabel,
      stepIndex,
      stepLabel: String(stepIndex * 10),
      isNeutral: true
    });
  });

  palettes.forEach((palette, paletteIndex) => {
    const paletteLabel =
      paletteLabels[paletteIndex] ?? getGeneratedPaletteFallbackName(paletteIndex);
    palette.forEach((color, stepIndex) => {
      candidates.push({
        color,
        colorHex: colorToCssHex(color),
        paletteLabel,
        stepIndex,
        stepLabel: String(stepIndex * 10),
        paletteIndex,
        isNeutral: false
      });
    });
  });

  return candidates;
}

function evaluateTargetColorConstraint(
  constraint: TargetColorConstraint,
  candidates: SwatchCandidate[]
): ConstraintResult {
  const metric = constraint.metric ?? 'ok';
  const target = isValidHexColor(constraint.targetHex) ? new Color(constraint.targetHex) : null;
  if (!target || candidates.length === 0) {
    return {
      id: constraint.id,
      type: 'target-color',
      required: constraint.mustPass === true,
      requiredSatisfied: false,
      metric,
      status: 'fail',
      deltaE: Number.POSITIVE_INFINITY,
      stepIndex: null,
      swatchLabel: 'Unavailable',
      paletteLabel: 'Unavailable',
      closestHex: null
    };
  }

  const best = candidates.reduce<SwatchCandidate | null>((currentBest, candidate) => {
    if (!currentBest) return candidate;
    const candidateDelta = getTargetColorDifference(target, candidate.color, metric);
    const currentBestDelta = getTargetColorDifference(target, currentBest.color, metric);
    return candidateDelta < currentBestDelta ? candidate : currentBest;
  }, null);

  const deltaE = best
    ? getTargetColorDifference(target, best.color, metric)
    : Number.POSITIVE_INFINITY;
  const status = getTargetColorStatus(deltaE, metric);

  return {
    id: constraint.id,
    type: 'target-color',
    required: constraint.mustPass === true,
    requiredSatisfied: constraint.mustPass === true ? status === 'pass' : true,
    metric,
    status,
    deltaE,
    stepIndex: best?.stepIndex ?? null,
    paletteIndex: best?.paletteIndex,
    isNeutral: best?.isNeutral ?? false,
    swatchLabel: best?.stepLabel ?? 'Unavailable',
    paletteLabel: best?.paletteLabel ?? 'Unavailable',
    closestHex: best?.colorHex ?? null
  };
}

function evaluateContrastRuleConstraint(
  constraint: ContrastRuleConstraint,
  neutrals: Color[],
  palettes: Color[][],
  neutralLabel: string,
  paletteLabels: string[],
  lowContrastColor: string,
  highContrastColor: string
): ConstraintResult {
  const referenceColor = constraint.reference === 'low' ? lowContrastColor : highContrastColor;
  const candidates: SwatchCandidate[] = [];

  if (constraint.scope === 'neutral') {
    const neutral = neutrals[constraint.stepIndex];
    if (neutral) {
      candidates.push({
        color: neutral,
        colorHex: colorToCssHex(neutral),
        paletteLabel: neutralLabel,
        stepIndex: constraint.stepIndex,
        stepLabel: String(constraint.stepIndex * 10),
        isNeutral: true
      });
    }
  } else {
    palettes.forEach((palette, paletteIndex) => {
      const color = palette[constraint.stepIndex];
      if (!color) return;
      candidates.push({
        color,
        colorHex: colorToCssHex(color),
        paletteLabel: paletteLabels[paletteIndex] ?? getGeneratedPaletteFallbackName(paletteIndex),
        stepIndex: constraint.stepIndex,
        stepLabel: String(constraint.stepIndex * 10),
        paletteIndex,
        isNeutral: false
      });
    });
  }

  if (candidates.length === 0) {
    return {
      id: constraint.id,
      type: 'contrast-rule',
      passes: false,
      actualValue: 0,
      swatchLabel: 'Unavailable',
      paletteLabel: 'Unavailable'
    };
  }

  const requirement = getConstraintThresholdValue(constraint.level);

  if (constraint.fitToThreshold) {
    const analyzed = candidates.map((candidate) => {
      const value = getContrastForAlgorithm(
        candidate.colorHex,
        referenceColor,
        constraint.algorithm
      );
      return { candidate, value, distance: Math.abs(value - requirement) };
    });
    const minimumValue = analyzed.reduce(
      (minimum, entry) => Math.min(minimum, entry.value),
      Number.POSITIVE_INFINITY
    );
    const sortedValues = analyzed.map((entry) => entry.value).sort((left, right) => left - right);
    const medianIndex = Math.floor(sortedValues.length / 2);
    const medianValue =
      sortedValues.length % 2 === 0
        ? ((sortedValues[medianIndex - 1] ?? 0) + (sortedValues[medianIndex] ?? 0)) / 2
        : (sortedValues[medianIndex] ?? 0);
    const closestToThreshold = analyzed.reduce<{
      candidate: SwatchCandidate;
      value: number;
      distance: number;
    } | null>((currentClosest, { candidate, value, distance }) => {
      if (!currentClosest || distance < currentClosest.distance) {
        return { candidate, value, distance };
      }
      return currentClosest;
    }, null);

    return {
      id: constraint.id,
      type: 'contrast-rule',
      passes: minimumValue >= requirement,
      actualValue: medianValue,
      minimumValue,
      paletteIndex: closestToThreshold?.candidate.paletteIndex,
      swatchLabel: closestToThreshold?.candidate.stepLabel ?? 'Unavailable',
      paletteLabel: closestToThreshold?.candidate.paletteLabel ?? 'Unavailable',
      distanceToThreshold: Math.abs(medianValue - requirement)
    };
  } else {
    // Original behavior: find the worst contrast value
    const worst = candidates.reduce<{ candidate: SwatchCandidate; value: number } | null>(
      (currentWorst, candidate) => {
        const value = getContrastForAlgorithm(
          candidate.colorHex,
          referenceColor,
          constraint.algorithm
        );
        if (!currentWorst || value < currentWorst.value) {
          return { candidate, value };
        }
        return currentWorst;
      },
      null
    );

    return {
      id: constraint.id,
      type: 'contrast-rule',
      passes: (worst?.value ?? 0) >= requirement,
      actualValue: worst?.value ?? 0,
      paletteIndex: worst?.candidate.paletteIndex,
      swatchLabel: worst?.candidate.stepLabel ?? 'Unavailable',
      paletteLabel: worst?.candidate.paletteLabel ?? 'Unavailable'
    };
  }
}

export function evaluateConstraints({
  constraints,
  neutrals,
  palettes,
  neutralLabel = DEFAULT_NEUTRAL_PALETTE_NAME,
  paletteLabels = [],
  lowContrastColor,
  highContrastColor
}: ConstraintEvaluationContext): {
  results: ConstraintResult[];
  summary: ConstraintSolverSummary;
} {
  const enabledConstraints = constraints.filter((constraint) => constraint.enabled);
  const swatchCandidates = getSwatchCandidates(neutrals, palettes, neutralLabel, paletteLabels);
  const results = enabledConstraints.map((constraint) => {
    if (constraint.type === 'target-color') {
      return evaluateTargetColorConstraint(constraint, swatchCandidates);
    }

    return evaluateContrastRuleConstraint(
      constraint,
      neutrals,
      palettes,
      neutralLabel,
      paletteLabels,
      lowContrastColor,
      highContrastColor
    );
  });

  const summary = results.reduce<ConstraintSolverSummary>(
    (acc, result) => {
      if (result.type === 'target-color') {
        if (result.status === 'pass') acc.passCount += 1;
        else if (result.status === 'warning') acc.warningCount += 1;
        else acc.failCount += 1;
        if (result.required) {
          if (result.requiredSatisfied)
            acc.requiredSatisfiedCount = (acc.requiredSatisfiedCount ?? 0) + 1;
          else acc.requiredUnsatisfiedCount = (acc.requiredUnsatisfiedCount ?? 0) + 1;
        }
      } else if (result.passes) {
        acc.passCount += 1;
      } else {
        acc.failCount += 1;
      }

      return acc;
    },
    {
      solvedAt: Date.now(),
      passCount: 0,
      warningCount: 0,
      failCount: 0,
      requiredSatisfiedCount: 0,
      requiredUnsatisfiedCount: 0,
      applied: false,
      changed: false,
      scoreBefore: 0,
      scoreAfter: 0
    }
  );

  return { results, summary };
}

const ADJACENT_STOP_LOW_THRESHOLD_WCAG = 1.2;
const ADJACENT_STOP_LOW_THRESHOLD_APCA = 15;
const ADJACENT_STOP_LOW_ENDPOINT_THRESHOLD_WCAG = 1.05;
const ADJACENT_STOP_LOW_ENDPOINT_THRESHOLD_APCA = 10;

function isRenderedEndpointHex(hex: string): boolean {
  const normalized = hex.toLowerCase();
  return normalized === '#000000' || normalized === '#ffffff';
}

export function getAdjacentStopLowThreshold(algorithm: ContrastAlgorithm): number {
  return algorithm === 'APCA' ? ADJACENT_STOP_LOW_THRESHOLD_APCA : ADJACENT_STOP_LOW_THRESHOLD_WCAG;
}

export function getAdjacentStopLowPairThreshold(
  algorithm: ContrastAlgorithm,
  stopIndexA: number,
  stopIndexB: number,
  rampLength: number,
  hexA: string,
  hexB: string
): number {
  const threshold = getAdjacentStopLowThreshold(algorithm);
  const isTerminalPair = stopIndexA === 0 || stopIndexB === rampLength - 1;
  if (!isTerminalPair) {
    return threshold;
  }
  if (!isRenderedEndpointHex(hexA) && !isRenderedEndpointHex(hexB)) {
    return threshold;
  }

  return algorithm === 'APCA'
    ? ADJACENT_STOP_LOW_ENDPOINT_THRESHOLD_APCA
    : ADJACENT_STOP_LOW_ENDPOINT_THRESHOLD_WCAG;
}

export function computeAdjacentStopContrast(
  neutrals: Color[],
  palettes: Color[][],
  neutralLabel: string,
  paletteLabels: string[],
  algorithm: ContrastAlgorithm
): AdjacentStopContrastEntry[] {
  const entries: AdjacentStopContrastEntry[] = [];

  const processRamp = (
    colors: Color[],
    label: string,
    isNeutral: boolean,
    paletteIndex?: number
  ): void => {
    for (let i = 0; i < colors.length - 1; i++) {
      const hexA = colorToCssHex(colors[i]);
      const hexB = colorToCssHex(colors[i + 1]);
      const contrastValue = getContrastForAlgorithm(hexA, hexB, algorithm);
      const threshold = getAdjacentStopLowPairThreshold(
        algorithm,
        i,
        i + 1,
        colors.length,
        hexA,
        hexB
      );
      entries.push({
        paletteLabel: label,
        paletteIndex,
        isNeutral,
        stopIndexA: i,
        stopIndexB: i + 1,
        contrastValue,
        contrastAlgorithm: algorithm,
        isLow: contrastValue < threshold
      });
    }
  };

  processRamp(neutrals, neutralLabel, true);
  palettes.forEach((palette, index) => {
    processRamp(
      palette,
      paletteLabels[index] ?? getGeneratedPaletteFallbackName(index),
      false,
      index
    );
  });

  return entries;
}

export function getWorstContrastAtStep(
  neutrals: Color[],
  palettes: Color[][],
  stepIndex: number,
  referenceHex: string,
  algorithm: ContrastAlgorithm
): number {
  let worst = Number.POSITIVE_INFINITY;
  const neutralHex = neutrals[stepIndex] ? colorToCssHex(neutrals[stepIndex]) : null;
  if (neutralHex) {
    worst = Math.min(worst, getContrastForAlgorithm(neutralHex, referenceHex, algorithm));
  }
  for (const palette of palettes) {
    const swatch = palette[stepIndex];
    if (!swatch) continue;
    const hex = colorToCssHex(swatch);
    worst = Math.min(worst, getContrastForAlgorithm(hex, referenceHex, algorithm));
  }
  return worst === Number.POSITIVE_INFINITY ? 0 : worst;
}

function resolveReferenceColor(
  reference: ContrastReference,
  neutrals: Color[],
  palettes: Color[][],
  fallback: string
): string {
  const source =
    reference.kind === 'palette'
      ? palettes[reference.paletteIndex ?? -1]?.[reference.stepIndex]
      : neutrals[reference.stepIndex];

  return source ? colorToCssHex(source) : fallback;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function clampWarmth(value: number): number {
  return Math.max(-50, Math.min(50, value));
}

function clampLightnessNudger(value: number): number {
  return Math.max(LIGHTNESS_NUDGER_BOUNDS.MIN, Math.min(LIGHTNESS_NUDGER_BOUNDS.MAX, value));
}

function clampHueNudger(value: number): number {
  return Math.max(HUE_NUDGER_BOUNDS.MIN, Math.min(HUE_NUDGER_BOUNDS.MAX, value));
}

function adjustBaseColor(
  baseColor: string,
  deltaL: number = 0,
  deltaC: number = 0,
  deltaH: number = 0
): string {
  try {
    const color = new Color(baseColor).to('oklch');
    color.oklch.l = clamp01((color.oklch.l ?? 0) + deltaL);
    color.oklch.c = Math.max(CHROMA_MULTIPLIER_MIN, Math.min(0.4, (color.oklch.c ?? 0) + deltaC));
    color.oklch.h = ((((color.oklch.h ?? 0) + deltaH) % 360) + 360) % 360;
    return colorToCssHex(color);
  } catch {
    return baseColor;
  }
}

function createZeroFilledArray(length: number, source: number[] = []): number[] {
  return Array.from({ length }, (_, index) => source[index] ?? 0);
}

function trimTrailingZeroes(values: number[]): number[] {
  let lastNonZeroIndex = -1;
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (Math.abs(values[index] ?? 0) > 1e-9) {
      lastNonZeroIndex = index;
      break;
    }
  }

  return lastNonZeroIndex === -1 ? [] : values.slice(0, lastNonZeroIndex + 1);
}

function normalizeAdjustments(
  settings: SolverSettings,
  adjustments: SolverAdjustmentSnapshot
): SolverAdjustmentSnapshot {
  return {
    ...adjustments,
    lightnessNudgers: createZeroFilledArray(settings.numColors, adjustments.lightnessNudgers),
    hueNudgers: createZeroFilledArray(settings.numPalettes, adjustments.hueNudgers)
  };
}

function compressAdjustments(adjustments: SolverAdjustmentSnapshot): SolverAdjustmentSnapshot {
  return {
    ...adjustments,
    lightnessNudgers: trimTrailingZeroes(adjustments.lightnessNudgers),
    hueNudgers: trimTrailingZeroes(adjustments.hueNudgers)
  };
}

function averageHexColors(hexColors: string[]): string | null {
  const validColors = hexColors
    .map((hex) => {
      try {
        return new Color(hex).to('oklch');
      } catch {
        return null;
      }
    })
    .filter((color): color is Color => color !== null);

  if (validColors.length === 0) {
    return null;
  }

  const avgL =
    validColors.reduce((sum, color) => sum + (color.oklch.l ?? 0), 0) / validColors.length;
  const avgC =
    validColors.reduce((sum, color) => sum + (color.oklch.c ?? 0), 0) / validColors.length;
  const vector = validColors.reduce(
    (sum, color) => {
      const radians = (((color.oklch.h ?? 0) % 360) * Math.PI) / 180;
      return {
        x: sum.x + Math.cos(radians),
        y: sum.y + Math.sin(radians)
      };
    },
    { x: 0, y: 0 }
  );
  const avgHue = ((Math.atan2(vector.y, vector.x) * 180) / Math.PI + 360) % 360;

  try {
    return colorToCssHex(new Color('oklch', [avgL, avgC, avgHue]));
  } catch {
    return null;
  }
}

function normalizeHueDelta(delta: number): number {
  let normalized = ((delta % 360) + 360) % 360;
  if (normalized > 180) {
    normalized -= 360;
  }
  return normalized;
}

function toColorGenParams(
  settings: SolverSettings,
  adjustments: SolverAdjustmentSnapshot
): ColorGenParams {
  return {
    numColors: settings.numColors,
    numPalettes: settings.numPalettes,
    baseColor: adjustments.baseColor,
    warmth: adjustments.warmth,
    x1: adjustments.x1,
    y1: adjustments.y1,
    x2: adjustments.x2,
    y2: adjustments.y2,
    chromaMultiplier: adjustments.chromaMultiplier,
    currentTheme: settings.currentTheme,
    lightnessNudgers: adjustments.lightnessNudgers,
    hueNudgers: adjustments.hueNudgers,
    gamutSpace: settings.gamutSpace
  };
}

function getAdjustmentDistancePenalty(
  current: SolverAdjustmentSnapshot,
  next: SolverAdjustmentSnapshot
): number {
  const huePenalty = next.hueNudgers.reduce(
    (sum, value, index) => sum + Math.abs(value - (current.hueNudgers[index] ?? 0)) * 0.002,
    0
  );
  const lightnessPenalty = next.lightnessNudgers.reduce(
    (sum, value, index) => sum + Math.abs(value - (current.lightnessNudgers[index] ?? 0)) * 0.15,
    0
  );

  return (
    Math.abs(next.warmth - current.warmth) * 0.002 +
    Math.abs(next.chromaMultiplier - current.chromaMultiplier) * 0.2 +
    Math.abs(next.x1 - current.x1) * 0.05 +
    Math.abs(next.y1 - current.y1) * 0.05 +
    Math.abs(next.x2 - current.x2) * 0.05 +
    Math.abs(next.y2 - current.y2) * 0.05 +
    huePenalty +
    lightnessPenalty
  );
}

function getConstraintOverflowPenalty(result: ConstraintResult, constraints: Constraint[]): number {
  const constraint = constraints.find((entry) => entry.id === result.id);
  if (!constraint) return 0;

  if (result.type === 'target-color') {
    const mustPassTarget = constraint.type === 'target-color' && constraint.mustPass;
    const metric = constraint.type === 'target-color' ? (constraint.metric ?? 'ok') : 'ok';
    const thresholds = getTargetColorThresholds(metric);
    if (mustPassTarget) {
      return result.deltaE <= thresholds.passMax
        ? 0
        : 6 +
            ((result.deltaE - thresholds.passMax) /
              Math.max(1e-9, thresholds.warningMax - thresholds.passMax)) *
              6;
    }
    if (result.deltaE <= thresholds.passMax) return 0;
    if (result.deltaE <= thresholds.warningMax) {
      return (
        0.5 +
        ((result.deltaE - thresholds.passMax) /
          Math.max(1e-9, thresholds.warningMax - thresholds.passMax)) *
          0.5
      );
    }
    return (
      2 + ((result.deltaE - thresholds.warningMax) / Math.max(1e-9, thresholds.warningMax)) * 2
    );
  }

  if (constraint.type !== 'contrast-rule') {
    return 0;
  }

  const requirement = getConstraintThresholdValue(constraint.level);
  const minimumValue = result.minimumValue ?? result.actualValue;
  if (constraint.fitToThreshold) {
    return Math.max(0, requirement - minimumValue) * 4 + (result.distanceToThreshold ?? 0);
  }
  return Math.max(0, requirement - minimumValue);
}

function getTargetOverflow(deltaE: number, metric: ColorDifferenceMetric): number {
  const thresholds = getTargetColorThresholds(metric);
  return Math.max(0, deltaE - thresholds.passMax);
}

function evaluateSolverCandidate(
  settings: SolverSettings,
  currentAdjustments: SolverAdjustmentSnapshot,
  candidateAdjustments: SolverAdjustmentSnapshot
): SolverCandidate {
  const generated = generatePalettes(toColorGenParams(settings, candidateAdjustments));
  const lowContrastColor =
    settings.contrastMode === 'manual'
      ? settings.manualContrast.low
      : resolveReferenceColor(
          settings.lowReference,
          generated.neutrals,
          generated.palettes,
          settings.manualContrast.low
        );
  const highContrastColor =
    settings.contrastMode === 'manual'
      ? settings.manualContrast.high
      : resolveReferenceColor(
          settings.highReference,
          generated.neutrals,
          generated.palettes,
          settings.manualContrast.high
        );

  const { results, summary } = evaluateConstraints({
    constraints: settings.constraints,
    neutrals: generated.neutrals,
    palettes: generated.palettes,
    lowContrastColor,
    highContrastColor
  });

  const score =
    results.reduce(
      (sum, result) => sum + getConstraintOverflowPenalty(result, settings.constraints),
      0
    ) + getAdjustmentDistancePenalty(currentAdjustments, candidateAdjustments);

  const mustPassResults = results.filter(
    (result): result is Extract<ConstraintResult, { type: 'target-color' }> => {
      const constraint = settings.constraints.find((entry) => entry.id === result.id);
      return (
        result.type === 'target-color' &&
        constraint?.type === 'target-color' &&
        constraint.mustPass === true
      );
    }
  );
  const mustPassNonPassCount = mustPassResults.filter((result) => result.status !== 'pass').length;
  const mustPassOverflow = mustPassResults.reduce((sum, result) => {
    const constraint = settings.constraints.find((entry) => entry.id === result.id);
    const metric = constraint?.type === 'target-color' ? (constraint.metric ?? 'ok') : 'ok';
    return sum + getTargetOverflow(result.deltaE, metric);
  }, 0);
  const failCount = results.reduce((sum, result) => {
    if (result.type === 'target-color') {
      return sum + (result.status === 'fail' ? 1 : 0);
    }
    return sum + (result.passes ? 0 : 1);
  }, 0);
  const warningCount = results.reduce(
    (sum, result) => sum + (result.type === 'target-color' && result.status === 'warning' ? 1 : 0),
    0
  );
  const overflow = results.reduce((sum, result) => {
    if (result.type === 'target-color') {
      const constraint = settings.constraints.find((entry) => entry.id === result.id);
      const metric = constraint?.type === 'target-color' ? (constraint.metric ?? 'ok') : 'ok';
      return sum + getTargetOverflow(result.deltaE, metric);
    }

    const constraint = settings.constraints.find((entry) => entry.id === result.id);
    if (constraint?.type !== 'contrast-rule') return sum;
    const requirement = getConstraintThresholdValue(constraint.level);
    const minimumValue = result.minimumValue ?? result.actualValue;
    if (constraint.fitToThreshold) {
      return sum + Math.max(0, requirement - minimumValue) + (result.distanceToThreshold ?? 0);
    }
    return sum + Math.max(0, requirement - minimumValue);
  }, 0);

  return {
    settings: candidateAdjustments,
    results,
    summary,
    score,
    mustPassNonPassCount,
    mustPassOverflow,
    failCount,
    warningCount,
    overflow
  };
}

function withPatchedAdjustment(
  current: SolverAdjustmentSnapshot,
  patch: Partial<SolverAdjustmentSnapshot>
): SolverAdjustmentSnapshot {
  return {
    ...current,
    ...patch
  };
}

function withBezierPatch(
  current: SolverAdjustmentSnapshot,
  patch: BezierControlPatch
): SolverAdjustmentSnapshot {
  return withPatchedAdjustment(current, {
    x1: clamp01(patch.x1 ?? current.x1),
    y1: clamp01(patch.y1 ?? current.y1),
    x2: clamp01(patch.x2 ?? current.x2),
    y2: clamp01(patch.y2 ?? current.y2)
  });
}

function getBezierCandidatePatches(
  current: SolverAdjustmentSnapshot,
  amount: number
): BezierControlPatch[] {
  return [
    { x1: current.x1 - amount, y1: current.y1 - amount },
    { x1: current.x1 + amount, y1: current.y1 + amount },
    { x2: current.x2 - amount, y2: current.y2 - amount },
    { x2: current.x2 + amount, y2: current.y2 + amount },
    { x1: current.x1 - amount, x2: current.x2 + amount },
    { x1: current.x1 + amount, x2: current.x2 - amount },
    { y1: current.y1 - amount, y2: current.y2 + amount },
    { y1: current.y1 + amount, y2: current.y2 - amount }
  ];
}

function arraysEqualWithinTolerance(left: number[], right: number[], tolerance: number): boolean {
  if (left.length !== right.length) return false;
  return left.every((value, index) => Math.abs(value - (right[index] ?? 0)) <= tolerance);
}

function hasMeaningfulAdjustmentChange(
  baseline: SolverAdjustmentSnapshot,
  candidate: SolverAdjustmentSnapshot
): boolean {
  return (
    baseline.baseColor.toLowerCase() !== candidate.baseColor.toLowerCase() ||
    Math.abs(baseline.warmth - candidate.warmth) > 1e-9 ||
    Math.abs(baseline.chromaMultiplier - candidate.chromaMultiplier) > 1e-6 ||
    Math.abs(baseline.x1 - candidate.x1) > 1e-6 ||
    Math.abs(baseline.y1 - candidate.y1) > 1e-6 ||
    Math.abs(baseline.x2 - candidate.x2) > 1e-6 ||
    Math.abs(baseline.y2 - candidate.y2) > 1e-6 ||
    !arraysEqualWithinTolerance(baseline.lightnessNudgers, candidate.lightnessNudgers, 1e-6) ||
    !arraysEqualWithinTolerance(baseline.hueNudgers, candidate.hueNudgers, 1e-6)
  );
}

function isBetterCandidate(candidate: SolverCandidate, best: SolverCandidate): boolean {
  if (candidate.mustPassNonPassCount !== best.mustPassNonPassCount) {
    return candidate.mustPassNonPassCount < best.mustPassNonPassCount;
  }
  if (Math.abs(candidate.mustPassOverflow - best.mustPassOverflow) > 1e-9) {
    return candidate.mustPassOverflow < best.mustPassOverflow;
  }
  if (candidate.failCount !== best.failCount) {
    return candidate.failCount < best.failCount;
  }
  if (candidate.warningCount !== best.warningCount) {
    return candidate.warningCount < best.warningCount;
  }
  if (Math.abs(candidate.overflow - best.overflow) > 1e-9) {
    return candidate.overflow < best.overflow;
  }
  return candidate.score + 1e-9 < best.score;
}

function buildSeedAdjustments(
  settings: SolverSettings,
  currentAdjustments: SolverAdjustmentSnapshot
): SolverAdjustmentSnapshot[] {
  const seeds = new Map<string, SolverAdjustmentSnapshot>();
  const addSeed = (snapshot: SolverAdjustmentSnapshot): void => {
    const normalized = normalizeAdjustments(settings, snapshot);
    seeds.set(JSON.stringify(normalized), normalized);
  };

  addSeed(currentAdjustments);

  for (const preset of SOLVER_BEZIER_PRESETS) {
    addSeed(
      withBezierPatch(currentAdjustments, {
        x1: preset.x1,
        y1: preset.y1,
        x2: preset.x2,
        y2: preset.y2
      })
    );
  }

  const targetConstraints = settings.constraints.filter(
    (constraint): constraint is TargetColorConstraint =>
      constraint.type === 'target-color' &&
      constraint.enabled &&
      isValidHexColor(constraint.targetHex)
  );
  const mustPassTargets = targetConstraints.filter((constraint) => constraint.mustPass);

  const prioritizedTargets =
    mustPassTargets.length > 0 ? mustPassTargets : targetConstraints.slice(0, 3);

  for (const constraint of prioritizedTargets) {
    addSeed({
      ...currentAdjustments,
      baseColor: constraint.targetHex
    });
  }

  const mustPassAverage = averageHexColors(
    mustPassTargets.map((constraint) => constraint.targetHex)
  );
  if (mustPassAverage) {
    addSeed({
      ...currentAdjustments,
      baseColor: mustPassAverage
    });
  }

  const allTargetsAverage = averageHexColors(
    targetConstraints.map((constraint) => constraint.targetHex)
  );
  if (allTargetsAverage && mustPassTargets.length === 0) {
    addSeed({
      ...currentAdjustments,
      baseColor: allTargetsAverage
    });
  }

  return [...seeds.values()];
}

function refineFromSeed(
  settings: SolverSettings,
  currentAdjustments: SolverAdjustmentSnapshot,
  seed: SolverAdjustmentSnapshot
): SolverCandidate {
  let best = evaluateSolverCandidate(settings, currentAdjustments, seed);

  const tryCandidate = (candidate: SolverAdjustmentSnapshot): void => {
    const normalized = normalizeAdjustments(settings, candidate);
    const evaluated = evaluateSolverCandidate(settings, currentAdjustments, normalized);
    if (isBetterCandidate(evaluated, best)) {
      best = evaluated;
    }
  };

  const globalRounds = [
    { warmth: 12, chroma: 0.12, bezier: 0.08, hue: 30, lightness: 0.06, chromaColor: 0.06 },
    { warmth: 4, chroma: 0.05, bezier: 0.04, hue: 12, lightness: 0.02, chromaColor: 0.02 },
    { warmth: 1, chroma: 0.02, bezier: 0.02, hue: 4, lightness: 0.01, chromaColor: 0.01 }
  ];

  for (const round of globalRounds) {
    let improved = true;
    let iterations = 0;
    while (improved && iterations < 3) {
      iterations += 1;
      const previousBest = best;
      const current = best.settings;

      [-1, 1].forEach((direction) => {
        tryCandidate(
          withPatchedAdjustment(current, {
            warmth: clampWarmth(current.warmth + direction * round.warmth)
          })
        );
        tryCandidate(
          withPatchedAdjustment(current, {
            chromaMultiplier: clampChromaMultiplier(
              current.chromaMultiplier + direction * round.chroma,
              settings.gamutSpace
            )
          })
        );
        tryCandidate(
          withPatchedAdjustment(current, {
            baseColor: adjustBaseColor(current.baseColor, direction * round.lightness, 0, 0)
          })
        );
        tryCandidate(
          withPatchedAdjustment(current, {
            baseColor: adjustBaseColor(current.baseColor, 0, direction * round.chromaColor, 0)
          })
        );
        tryCandidate(
          withPatchedAdjustment(current, {
            baseColor: adjustBaseColor(current.baseColor, 0, 0, direction * round.hue)
          })
        );
      });

      for (const patch of getBezierCandidatePatches(current, round.bezier)) {
        tryCandidate(withBezierPatch(current, patch));
      }

      improved = best !== previousBest;
    }
  }

  for (const amount of [0.04, 0.02, 0.01]) {
    const current = best.settings;
    for (const patch of getBezierCandidatePatches(current, amount)) {
      tryCandidate(withBezierPatch(current, patch));
    }
  }

  const lightnessSteps = [0.02, 0.01];
  const hueSteps = [3, 1];

  for (const step of lightnessSteps) {
    for (let index = 0; index < best.settings.lightnessNudgers.length; index += 1) {
      const current = best.settings;
      [-1, 1].forEach((direction) => {
        const nextNudgers = [...current.lightnessNudgers];
        nextNudgers[index] = clampLightnessNudger((nextNudgers[index] ?? 0) + direction * step);
        tryCandidate(withPatchedAdjustment(current, { lightnessNudgers: nextNudgers }));
      });
    }
  }

  for (const step of hueSteps) {
    for (let index = 0; index < best.settings.hueNudgers.length; index += 1) {
      const current = best.settings;
      [-1, 1].forEach((direction) => {
        const nextNudgers = [...current.hueNudgers];
        nextNudgers[index] = clampHueNudger((nextNudgers[index] ?? 0) + direction * step);
        tryCandidate(withPatchedAdjustment(current, { hueNudgers: nextNudgers }));
      });
    }
  }

  return best;
}

function buildMustPassRescueSeeds(
  settings: SolverSettings,
  best: SolverCandidate
): SolverAdjustmentSnapshot[] {
  const seeds = new Map<string, SolverAdjustmentSnapshot>();
  const addSeed = (snapshot: SolverAdjustmentSnapshot): void => {
    const normalized = normalizeAdjustments(settings, snapshot);
    seeds.set(JSON.stringify(normalized), normalized);
  };

  const mustPassResults = best.results.filter(
    (result): result is Extract<ConstraintResult, { type: 'target-color' }> =>
      result.type === 'target-color'
  );

  for (const result of mustPassResults) {
    const constraint = settings.constraints.find((entry) => entry.id === result.id);
    if (constraint?.type !== 'target-color' || !constraint.mustPass || result.status === 'pass') {
      continue;
    }
    if (!result.closestHex || result.stepIndex === null) {
      continue;
    }

    try {
      const target = new Color(constraint.targetHex).to('oklch');
      const closest = new Color(result.closestHex).to('oklch');
      const deltaL = (target.oklch.l ?? 0) - (closest.oklch.l ?? 0);
      const deltaC = (target.oklch.c ?? 0) - (closest.oklch.c ?? 0);
      const deltaH = normalizeHueDelta((target.oklch.h ?? 0) - (closest.oklch.h ?? 0));

      addSeed({
        ...best.settings,
        baseColor: adjustBaseColor(
          best.settings.baseColor,
          deltaL * 0.5,
          deltaC * 0.5,
          deltaH * 0.35
        )
      });

      addSeed({
        ...best.settings,
        baseColor: adjustBaseColor(
          best.settings.baseColor,
          deltaL * 0.25,
          deltaC * 0.75,
          deltaH * 0.5
        )
      });

      const nextLightnessNudgers = [...best.settings.lightnessNudgers];
      nextLightnessNudgers[result.stepIndex] = clampLightnessNudger(
        (nextLightnessNudgers[result.stepIndex] ?? 0) + deltaL
      );
      addSeed({
        ...best.settings,
        lightnessNudgers: nextLightnessNudgers
      });

      if (!result.isNeutral && typeof result.paletteIndex === 'number') {
        const nextHueNudgers = [...best.settings.hueNudgers];
        nextHueNudgers[result.paletteIndex] = clampHueNudger(
          (nextHueNudgers[result.paletteIndex] ?? 0) + deltaH
        );
        addSeed({
          ...best.settings,
          hueNudgers: nextHueNudgers
        });

        addSeed({
          ...best.settings,
          lightnessNudgers: nextLightnessNudgers,
          hueNudgers: nextHueNudgers
        });
      }
    } catch {
      continue;
    }
  }

  return [...seeds.values()];
}

export function solveConstraints(settings: SolverSettings): {
  snapshot: SolverAdjustmentSnapshot;
  summary: ConstraintSolverSummary;
  results: ConstraintResult[];
} {
  const currentAdjustments = normalizeAdjustments(settings, {
    baseColor: settings.baseColor,
    warmth: settings.warmth,
    chromaMultiplier: settings.chromaMultiplier,
    x1: settings.x1,
    y1: settings.y1,
    x2: settings.x2,
    y2: settings.y2,
    lightnessNudgers: [...settings.lightnessNudgers],
    hueNudgers: [...settings.hueNudgers]
  });

  const baseline = evaluateSolverCandidate(settings, currentAdjustments, currentAdjustments);
  let best = baseline;
  const { max: chromaMax } = getChromaMultiplierBounds(settings.gamutSpace);
  for (const seed of buildSeedAdjustments(settings, currentAdjustments)) {
    const refined = refineFromSeed(settings, currentAdjustments, seed);
    if (isBetterCandidate(refined, best)) {
      best = refined;
    }
  }

  for (let round = 0; round < 2; round += 1) {
    let improved = false;
    for (const seed of buildMustPassRescueSeeds(settings, best)) {
      const evaluated = evaluateSolverCandidate(
        settings,
        currentAdjustments,
        normalizeAdjustments(settings, seed)
      );
      if (isBetterCandidate(evaluated, best)) {
        best = evaluated;
        improved = true;
      }
    }
    if (!improved) {
      break;
    }
  }

  return {
    snapshot: compressAdjustments({
      ...best.settings,
      chromaMultiplier: Math.min(chromaMax, best.settings.chromaMultiplier)
    }),
    summary: {
      ...best.summary,
      solvedAt: Date.now(),
      applied: true,
      changed: hasMeaningfulAdjustmentChange(currentAdjustments, best.settings),
      scoreBefore: baseline.score,
      scoreAfter: best.score
    },
    results: best.results
  };
}
