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
  PALETTE_CHROMA_NUDGER_BOUNDS,
  PALETTE_SATURATION_NUDGER_BOUNDS,
  STEP_SATURATION_NUDGER_BOUNDS,
  type ColorGenParams
} from '$lib/colorUtils';
import {
  evaluateConstraints,
  getAdjacentStopLowPairThreshold,
  getConstraintThresholdValue,
  getTargetColorThresholds
} from '$lib/constraintUtils';
import type {
  Constraint,
  ConstraintResult,
  ConstraintSolveProfile,
  ConstraintSolveRequest,
  ConstraintSolveResponse,
  ConstraintSolveSource,
  ConstraintSolverSummary,
  ContrastReference,
  ContrastRuleConstraint,
  SolverAdjustmentSnapshot,
  TargetColorConstraint
} from '$lib/types';
import { MAX_MUST_PASS_TARGETS } from '$lib/types';
import { simplexOptimize } from '$lib/simplexOptimizer';

const SOLVER_BEZIER_PRESETS = [
  { x1: 0.16, y1: 0, x2: 0.28, y2: 0.38 },
  { x1: 0.24, y1: 0.06, x2: 0.52, y2: 0.62 },
  { x1: 0.32, y1: 0.08, x2: 0.68, y2: 0.92 },
  { x1: 0.45, y1: 0.08, x2: 0.77, y2: 0.96 }
];

const MIN_STEP_LIGHTNESS_DELTA = 0.01;
const MIN_ADJACENT_STEP_DELTA_E_OK = 0.02;
const MIN_ADJACENT_PALETTE_DELTA_E_OK = 0.025;

interface SolverCandidate {
  settings: SolverAdjustmentSnapshot;
  results: ConstraintResult[];
  summary: ConstraintSolverSummary;
  score: number;
  objective: number;
  mustPassNonPassCount: number;
  mustPassOverflow: number;
  guardrailViolationCount: number;
  guardrailOverflow: number;
  failCount: number;
  warningCount: number;
  adjacentStopLowCount: number;
  adjacentStopLowOverflow: number;
  hardOverflow: number;
  fitDistance: number;
  overflow: number;
}

type CandidateComparator = (candidate: SolverCandidate, best: SolverCandidate) => boolean;

interface SolveProfileConfig {
  maxIterations: number;
  maxEvaluations: number;
  maxDurationMs: number;
  continuousBudgetRatio: number;
  maxBezierEvaluations: number;
  maxLightnessCoordinates: number;
  maxHueCoordinates: number;
  bezierDeltas: number[];
  lightnessDeltas: number[];
  hueDeltas: number[];
}

interface SolveRuntimeState {
  startedAt: number;
  evalCount: number;
  budgetHit: boolean;
  best: SolverCandidate;
  evaluationCache: Map<string, SolverCandidate>;
}

const PROFILE_CONFIG: Record<ConstraintSolveProfile, SolveProfileConfig> = {
  fast: {
    maxIterations: 80,
    maxEvaluations: 20000,
    maxDurationMs: 2500,
    continuousBudgetRatio: 0.6,
    maxBezierEvaluations: 4000,
    maxLightnessCoordinates: 4,
    maxHueCoordinates: 4,
    bezierDeltas: [0.08, 0.04, 0.02],
    lightnessDeltas: [-0.04, -0.02, -0.01, 0.01, 0.02, 0.04],
    hueDeltas: [-24, -16, -8, -4, -2, 2, 4, 8, 16, 24]
  },
  deep: {
    maxIterations: 220,
    maxEvaluations: Number.POSITIVE_INFINITY,
    maxDurationMs: Number.POSITIVE_INFINITY,
    continuousBudgetRatio: 1,
    maxBezierEvaluations: Number.POSITIVE_INFINITY,
    maxLightnessCoordinates: 6,
    maxHueCoordinates: 6,
    bezierDeltas: [0.12, 0.08, 0.04, 0.02],
    lightnessDeltas: [-0.05, -0.03, -0.02, -0.01, 0.01, 0.02, 0.03, 0.05],
    hueDeltas: [-12, -8, -4, -2, 2, 4, 8, 12]
  }
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function clampRange(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampWarmth(value: number): number {
  return clampRange(value, -50, 50);
}

function clampLightnessNudger(value: number): number {
  return clampRange(value, LIGHTNESS_NUDGER_BOUNDS.MIN, LIGHTNESS_NUDGER_BOUNDS.MAX);
}

function clampHueNudger(value: number): number {
  return clampRange(value, HUE_NUDGER_BOUNDS.MIN, HUE_NUDGER_BOUNDS.MAX);
}

function clampStepSaturationNudger(value: number): number {
  return clampRange(value, STEP_SATURATION_NUDGER_BOUNDS.MIN, STEP_SATURATION_NUDGER_BOUNDS.MAX);
}

function clampPaletteSaturationNudger(value: number): number {
  return clampRange(
    value,
    PALETTE_SATURATION_NUDGER_BOUNDS.MIN,
    PALETTE_SATURATION_NUDGER_BOUNDS.MAX
  );
}

function clampPaletteChromaNudger(value: number): number {
  return clampRange(value, PALETTE_CHROMA_NUDGER_BOUNDS.MIN, PALETTE_CHROMA_NUDGER_BOUNDS.MAX);
}

function normalizeHueDelta(delta: number): number {
  let normalized = ((delta % 360) + 360) % 360;
  if (normalized > 180) {
    normalized -= 360;
  }
  return normalized;
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

function createZeroFilledArray(length: number, source: number[] = []): number[] {
  return Array.from({ length }, (_, index) => source[index] ?? 0);
}

function createOneFilledArray(length: number, source: number[] = []): number[] {
  return Array.from({ length }, (_, index) => source[index] ?? 1.0);
}

function trimTrailingIdentity(values: number[], identity: number): number[] {
  let lastNonIdentityIndex = -1;
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (Math.abs((values[index] ?? identity) - identity) > 1e-9) {
      lastNonIdentityIndex = index;
      break;
    }
  }
  return lastNonIdentityIndex === -1 ? [] : values.slice(0, lastNonIdentityIndex + 1);
}

function normalizeAdjustments(
  request: ConstraintSolveRequest,
  adjustments: SolverAdjustmentSnapshot
): SolverAdjustmentSnapshot {
  return {
    ...adjustments,
    lightnessNudgers: createZeroFilledArray(request.numColors, adjustments.lightnessNudgers),
    hueNudgers: createZeroFilledArray(request.numPalettes, adjustments.hueNudgers),
    stepSaturationNudgers: createZeroFilledArray(
      request.numColors,
      adjustments.stepSaturationNudgers
    ),
    paletteSaturationNudgers: createZeroFilledArray(
      request.numPalettes,
      adjustments.paletteSaturationNudgers
    ),
    paletteChromaNudgers: createOneFilledArray(
      request.numPalettes,
      adjustments.paletteChromaNudgers
    )
  };
}

function compressAdjustments(adjustments: SolverAdjustmentSnapshot): SolverAdjustmentSnapshot {
  return {
    ...adjustments,
    lightnessNudgers: trimTrailingZeroes(adjustments.lightnessNudgers),
    hueNudgers: trimTrailingZeroes(adjustments.hueNudgers),
    stepSaturationNudgers: trimTrailingZeroes(adjustments.stepSaturationNudgers ?? []),
    paletteSaturationNudgers: trimTrailingZeroes(adjustments.paletteSaturationNudgers ?? []),
    paletteChromaNudgers: trimTrailingIdentity(adjustments.paletteChromaNudgers ?? [], 1.0)
  };
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
    (baseline.warmthHue ?? -1) !== (candidate.warmthHue ?? -1) ||
    Math.abs(baseline.chromaMultiplier - candidate.chromaMultiplier) > 1e-6 ||
    Math.abs(baseline.x1 - candidate.x1) > 1e-6 ||
    Math.abs(baseline.y1 - candidate.y1) > 1e-6 ||
    Math.abs(baseline.x2 - candidate.x2) > 1e-6 ||
    Math.abs(baseline.y2 - candidate.y2) > 1e-6 ||
    !arraysEqualWithinTolerance(baseline.lightnessNudgers, candidate.lightnessNudgers, 1e-6) ||
    !arraysEqualWithinTolerance(baseline.hueNudgers, candidate.hueNudgers, 1e-6) ||
    !arraysEqualWithinTolerance(
      baseline.stepSaturationNudgers ?? [],
      candidate.stepSaturationNudgers ?? [],
      1e-6
    ) ||
    !arraysEqualWithinTolerance(
      baseline.paletteSaturationNudgers ?? [],
      candidate.paletteSaturationNudgers ?? [],
      1e-6
    ) ||
    !arraysEqualWithinTolerance(
      baseline.paletteChromaNudgers ?? [],
      candidate.paletteChromaNudgers ?? [],
      1e-6
    )
  );
}

function toColorGenParams(
  request: ConstraintSolveRequest,
  adjustments: SolverAdjustmentSnapshot
): ColorGenParams {
  return {
    numColors: request.numColors,
    numPalettes: request.numPalettes,
    baseColor: adjustments.baseColor,
    warmth: adjustments.warmth,
    warmthHue: adjustments.warmthHue,
    x1: adjustments.x1,
    y1: adjustments.y1,
    x2: adjustments.x2,
    y2: adjustments.y2,
    chromaMultiplier: adjustments.chromaMultiplier,
    currentTheme: request.currentTheme,
    lightnessNudgers: adjustments.lightnessNudgers,
    hueNudgers: adjustments.hueNudgers,
    stepSaturationNudgers: adjustments.stepSaturationNudgers,
    paletteSaturationNudgers: adjustments.paletteSaturationNudgers,
    paletteChromaNudgers: adjustments.paletteChromaNudgers,
    gamutSpace: request.gamutSpace
  };
}

function resolveReferenceColor(
  reference: ContrastReference,
  generated: ReturnType<typeof generatePalettes>,
  fallback: string
): string {
  const source =
    reference.kind === 'palette'
      ? generated.palettes[reference.paletteIndex ?? -1]?.[reference.stepIndex]
      : generated.neutrals[reference.stepIndex];

  return source ? colorToCssHex(source) : fallback;
}

function getAdjustmentDistancePenalty(
  baseline: SolverAdjustmentSnapshot,
  next: SolverAdjustmentSnapshot
): number {
  const huePenalty = next.hueNudgers.reduce(
    (sum, value, index) => sum + Math.abs(value - (baseline.hueNudgers[index] ?? 0)) * 0.001,
    0
  );
  const lightnessPenalty = next.lightnessNudgers.reduce(
    (sum, value, index) => sum + Math.abs(value - (baseline.lightnessNudgers[index] ?? 0)) * 0.03,
    0
  );
  const stepSaturationPenalty = (next.stepSaturationNudgers ?? []).reduce(
    (sum, value, index) =>
      sum + Math.abs(value - ((baseline.stepSaturationNudgers ?? [])[index] ?? 0)) * 8,
    0
  );
  const paletteSaturationPenalty = (next.paletteSaturationNudgers ?? []).reduce(
    (sum, value, index) =>
      sum + Math.abs(value - ((baseline.paletteSaturationNudgers ?? [])[index] ?? 0)) * 10,
    0
  );
  const chromaNudgerPenalty = (next.paletteChromaNudgers ?? []).reduce(
    (sum, value, index) =>
      sum + Math.abs(value - ((baseline.paletteChromaNudgers ?? [])[index] ?? 1.0)) * 15,
    0
  );

  return (
    Math.abs(next.warmth - baseline.warmth) * 0.002 +
    Math.abs(next.chromaMultiplier - baseline.chromaMultiplier) * 0.2 +
    Math.abs(next.x1 - baseline.x1) * 0.01 +
    Math.abs(next.y1 - baseline.y1) * 0.01 +
    Math.abs(next.x2 - baseline.x2) * 0.01 +
    Math.abs(next.y2 - baseline.y2) * 0.01 +
    huePenalty +
    lightnessPenalty +
    stepSaturationPenalty +
    paletteSaturationPenalty +
    chromaNudgerPenalty
  );
}

function getTargetOverflow(
  result: Extract<ConstraintResult, { type: 'target-color' }>,
  constraints: Constraint[]
) {
  const constraint = constraints.find((entry) => entry.id === result.id);
  const metric = constraint?.type === 'target-color' ? (constraint.metric ?? 'ok') : 'ok';
  return Math.max(0, result.deltaE - getTargetColorThresholds(metric).passMax);
}

function getConstraintOverflowPenalty(result: ConstraintResult, constraints: Constraint[]): number {
  const constraint = constraints.find((entry) => entry.id === result.id);
  if (!constraint) return 0;

  if (result.type === 'target-color') {
    const thresholds = getTargetColorThresholds(
      constraint.type === 'target-color' ? (constraint.metric ?? 'ok') : 'ok'
    );
    if (constraint.type === 'target-color' && constraint.mustPass) {
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

  if (constraint.type !== 'contrast-rule') return 0;
  const requirement = getConstraintThresholdValue(constraint.level);
  const minimumValue = result.minimumValue ?? result.actualValue;
  if (constraint.fitToThreshold) {
    return Math.max(0, requirement - minimumValue) * 4 + (result.distanceToThreshold ?? 0);
  }
  return Math.max(0, requirement - minimumValue);
}

function getObjectiveValue(candidate: SolverCandidate): number {
  return (
    candidate.mustPassNonPassCount * 1e12 +
    candidate.mustPassOverflow * 1e9 +
    candidate.guardrailViolationCount * 1e7 +
    candidate.guardrailOverflow * 1e6 +
    candidate.failCount * 1e5 +
    candidate.warningCount * 1e3 +
    candidate.adjacentStopLowCount * 5e2 +
    candidate.adjacentStopLowOverflow * 2e2 +
    candidate.overflow * 1e2 +
    candidate.score
  );
}

function getLightnessGuardrailPenalty(colors: Color[]): {
  violationCount: number;
  overflow: number;
} {
  let violationCount = 0;
  let overflow = 0;

  for (let index = 0; index < colors.length - 1; index += 1) {
    const currentLightness = colors[index]?.oklch.l ?? 0;
    const nextLightness = colors[index + 1]?.oklch.l ?? 0;
    const lightnessDrop = currentLightness - nextLightness;

    if (lightnessDrop < MIN_STEP_LIGHTNESS_DELTA) {
      violationCount += 1;
      overflow += MIN_STEP_LIGHTNESS_DELTA - lightnessDrop;
    }
  }

  return { violationCount, overflow };
}

function getAdjacentPerceptualPenalty(
  colors: Color[],
  minimumDelta: number
): {
  violationCount: number;
  overflow: number;
} {
  let violationCount = 0;
  let overflow = 0;

  for (let index = 0; index < colors.length - 1; index += 1) {
    const delta = colors[index]?.deltaEOK(colors[index + 1]) ?? 0;
    if (delta < minimumDelta) {
      violationCount += 1;
      overflow += minimumDelta - delta;
    }
  }

  return { violationCount, overflow };
}

function getSolverGuardrailPenalty(generated: ReturnType<typeof generatePalettes>): {
  violationCount: number;
  overflow: number;
} {
  let violationCount = 0;
  let overflow = 0;

  const neutralLightness = getLightnessGuardrailPenalty(generated.neutrals);
  violationCount += neutralLightness.violationCount;
  overflow += neutralLightness.overflow;

  const neutralAdjacency = getAdjacentPerceptualPenalty(
    generated.neutrals,
    MIN_ADJACENT_STEP_DELTA_E_OK
  );
  violationCount += neutralAdjacency.violationCount;
  overflow += neutralAdjacency.overflow;

  for (const palette of generated.palettes) {
    const paletteLightness = getLightnessGuardrailPenalty(palette);
    violationCount += paletteLightness.violationCount;
    overflow += paletteLightness.overflow;

    const paletteAdjacency = getAdjacentPerceptualPenalty(palette, MIN_ADJACENT_STEP_DELTA_E_OK);
    violationCount += paletteAdjacency.violationCount;
    overflow += paletteAdjacency.overflow;
  }

  for (let stepIndex = 1; stepIndex < generated.neutrals.length - 1; stepIndex += 1) {
    const stepColors = generated.palettes
      .map((palette) => palette[stepIndex])
      .filter((color): color is Color => Boolean(color));
    const stepAdjacency = getAdjacentPerceptualPenalty(stepColors, MIN_ADJACENT_PALETTE_DELTA_E_OK);
    violationCount += stepAdjacency.violationCount;
    overflow += stepAdjacency.overflow;
  }

  return { violationCount, overflow };
}

function getAdjacentStopLowPenalty(
  generated: ReturnType<typeof generatePalettes>,
  algorithm: 'WCAG' | 'APCA'
): {
  lowCount: number;
  overflow: number;
} {
  let lowCount = 0;
  let overflow = 0;

  const processRamp = (colors: Color[]): void => {
    for (let index = 0; index < colors.length - 1; index += 1) {
      const currentHex = colorToCssHex(colors[index]);
      const nextHex = colorToCssHex(colors[index + 1]);
      const contrast = getContrastForAlgorithm(currentHex, nextHex, algorithm);
      const threshold = getAdjacentStopLowPairThreshold(
        algorithm,
        index,
        index + 1,
        colors.length,
        currentHex,
        nextHex
      );
      if (contrast < threshold) {
        lowCount += 1;
        overflow += threshold - contrast;
      }
    }
  };

  processRamp(generated.neutrals);
  for (const palette of generated.palettes) {
    processRamp(palette);
  }

  return { lowCount, overflow };
}

function evaluateSolverCandidate(
  request: ConstraintSolveRequest,
  baseline: SolverAdjustmentSnapshot,
  candidateAdjustments: SolverAdjustmentSnapshot
): SolverCandidate {
  const generated = generatePalettes(toColorGenParams(request, candidateAdjustments));
  const guardrailPenalty = getSolverGuardrailPenalty(generated);
  const solveAdjacentStopLows = request.solveAdjacentStopLows !== false;
  const adjacentStopLowPenalty = solveAdjacentStopLows
    ? getAdjacentStopLowPenalty(generated, request.contrastAlgorithm ?? 'WCAG')
    : { lowCount: 0, overflow: 0 };
  const lowContrastColor =
    request.contrastMode === 'manual'
      ? request.manualContrast.low
      : resolveReferenceColor(request.lowReference, generated, request.manualContrast.low);
  const highContrastColor =
    request.contrastMode === 'manual'
      ? request.manualContrast.high
      : resolveReferenceColor(request.highReference, generated, request.manualContrast.high);

  const { results, summary } = evaluateConstraints({
    constraints: request.constraints,
    neutrals: generated.neutrals,
    palettes: generated.palettes,
    lowContrastColor,
    highContrastColor
  });

  const mustPassResults = results.filter(
    (result): result is Extract<ConstraintResult, { type: 'target-color' }> => {
      const constraint = request.constraints.find((entry) => entry.id === result.id);
      return (
        result.type === 'target-color' &&
        constraint?.type === 'target-color' &&
        constraint.mustPass === true
      );
    }
  );

  const mustPassNonPassCount = mustPassResults.filter((result) => result.status !== 'pass').length;
  const mustPassOverflow = mustPassResults.reduce(
    (sum, result) => sum + getTargetOverflow(result, request.constraints),
    0
  );
  const failCount = results.reduce((sum, result) => {
    if (result.type === 'target-color') return sum + (result.status === 'fail' ? 1 : 0);
    return sum + (result.passes ? 0 : 1);
  }, 0);
  const warningCount = results.reduce(
    (sum, result) => sum + (result.type === 'target-color' && result.status === 'warning' ? 1 : 0),
    0
  );
  let fitDistance = 0;
  const hardOverflow = results.reduce((sum, result) => {
    if (result.type === 'target-color') return sum + getTargetOverflow(result, request.constraints);
    const constraint = request.constraints.find((entry) => entry.id === result.id);
    if (constraint?.type !== 'contrast-rule') return sum;
    const requirement = getConstraintThresholdValue(constraint.level);
    const minimumValue = result.minimumValue ?? result.actualValue;
    if (constraint.fitToThreshold) {
      fitDistance += result.distanceToThreshold ?? 0;
      return sum + Math.max(0, requirement - minimumValue);
    }
    return sum + Math.max(0, requirement - minimumValue);
  }, 0);
  const overflow = hardOverflow + fitDistance;

  const score =
    results.reduce(
      (sum, result) => sum + getConstraintOverflowPenalty(result, request.constraints),
      0
    ) +
    guardrailPenalty.violationCount * 2 +
    guardrailPenalty.overflow * 50 +
    adjacentStopLowPenalty.lowCount * 20 +
    adjacentStopLowPenalty.overflow * 50 +
    getAdjustmentDistancePenalty(baseline, candidateAdjustments);

  const candidate: SolverCandidate = {
    settings: candidateAdjustments,
    results,
    summary,
    score,
    objective: 0,
    mustPassNonPassCount,
    mustPassOverflow,
    guardrailViolationCount: guardrailPenalty.violationCount,
    guardrailOverflow: guardrailPenalty.overflow,
    failCount,
    warningCount,
    adjacentStopLowCount: adjacentStopLowPenalty.lowCount,
    adjacentStopLowOverflow: adjacentStopLowPenalty.overflow,
    hardOverflow,
    fitDistance,
    overflow
  };
  candidate.objective = getObjectiveValue(candidate);
  return candidate;
}

function isBetterCandidate(candidate: SolverCandidate, best: SolverCandidate): boolean {
  if (candidate.mustPassNonPassCount !== best.mustPassNonPassCount) {
    return candidate.mustPassNonPassCount < best.mustPassNonPassCount;
  }
  if (Math.abs(candidate.mustPassOverflow - best.mustPassOverflow) > 1e-9) {
    return candidate.mustPassOverflow < best.mustPassOverflow;
  }
  if (candidate.guardrailViolationCount !== best.guardrailViolationCount) {
    return candidate.guardrailViolationCount < best.guardrailViolationCount;
  }
  if (Math.abs(candidate.guardrailOverflow - best.guardrailOverflow) > 1e-9) {
    return candidate.guardrailOverflow < best.guardrailOverflow;
  }
  if (candidate.failCount !== best.failCount) {
    return candidate.failCount < best.failCount;
  }
  if (candidate.warningCount !== best.warningCount) {
    return candidate.warningCount < best.warningCount;
  }
  if (candidate.adjacentStopLowCount !== best.adjacentStopLowCount) {
    return candidate.adjacentStopLowCount < best.adjacentStopLowCount;
  }
  if (Math.abs(candidate.adjacentStopLowOverflow - best.adjacentStopLowOverflow) > 1e-9) {
    return candidate.adjacentStopLowOverflow < best.adjacentStopLowOverflow;
  }
  if (Math.abs(candidate.overflow - best.overflow) > 1e-9) {
    return candidate.overflow < best.overflow;
  }
  return candidate.score + 1e-9 < best.score;
}

function hasEquivalentFeasibility(candidate: SolverCandidate, best: SolverCandidate): boolean {
  return (
    candidate.mustPassNonPassCount === best.mustPassNonPassCount &&
    Math.abs(candidate.mustPassOverflow - best.mustPassOverflow) <= 1e-9 &&
    candidate.guardrailViolationCount === best.guardrailViolationCount &&
    Math.abs(candidate.guardrailOverflow - best.guardrailOverflow) <= 1e-9 &&
    candidate.failCount === best.failCount &&
    candidate.warningCount === best.warningCount &&
    candidate.adjacentStopLowCount === best.adjacentStopLowCount &&
    Math.abs(candidate.adjacentStopLowOverflow - best.adjacentStopLowOverflow) <= 1e-9 &&
    Math.abs(candidate.hardOverflow - best.hardOverflow) <= 1e-9
  );
}

function isBetterFitPhaseCandidate(candidate: SolverCandidate, best: SolverCandidate): boolean {
  if (isBetterCandidate(candidate, best)) {
    return true;
  }
  if (!hasEquivalentFeasibility(candidate, best)) {
    return false;
  }
  if (Math.abs(candidate.fitDistance - best.fitDistance) > 1e-9) {
    return candidate.fitDistance < best.fitDistance;
  }
  return candidate.score + 1e-9 < best.score;
}

function canContinue(runtimeState: SolveRuntimeState, profile: SolveProfileConfig): boolean {
  if (runtimeState.evalCount >= profile.maxEvaluations) {
    runtimeState.budgetHit = true;
    return false;
  }
  if (Date.now() - runtimeState.startedAt >= profile.maxDurationMs) {
    runtimeState.budgetHit = true;
    return false;
  }
  return true;
}

function canContinueContinuousPhase(
  runtimeState: SolveRuntimeState,
  profile: SolveProfileConfig
): boolean {
  if (!canContinue(runtimeState, profile)) {
    return false;
  }

  const continuousEvalBudget = Math.max(
    1,
    Math.floor(profile.maxEvaluations * profile.continuousBudgetRatio)
  );
  if (runtimeState.evalCount >= continuousEvalBudget) {
    return false;
  }

  const continuousDurationBudget = profile.maxDurationMs * profile.continuousBudgetRatio;
  if (Date.now() - runtimeState.startedAt >= continuousDurationBudget) {
    return false;
  }

  return true;
}

function snapshotToVector(snapshot: SolverAdjustmentSnapshot): number[] {
  return [
    snapshot.warmth,
    snapshot.chromaMultiplier,
    snapshot.x1,
    snapshot.y1,
    snapshot.x2,
    snapshot.y2
  ];
}

function vectorToSnapshot(
  request: ConstraintSolveRequest,
  baseline: SolverAdjustmentSnapshot,
  vector: number[]
): SolverAdjustmentSnapshot {
  const { max: chromaMax } = getChromaMultiplierBounds(request.gamutSpace);
  return normalizeAdjustments(request, {
    ...baseline,
    baseColor: baseline.baseColor,
    warmth: clampWarmth(vector[0] ?? baseline.warmth),
    chromaMultiplier: clampRange(
      clampChromaMultiplier(vector[1] ?? baseline.chromaMultiplier, request.gamutSpace),
      CHROMA_MULTIPLIER_MIN,
      chromaMax
    ),
    x1: clamp01(vector[2] ?? baseline.x1),
    y1: clamp01(vector[3] ?? baseline.y1),
    x2: clamp01(vector[4] ?? baseline.x2),
    y2: clamp01(vector[5] ?? baseline.y2)
  });
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
  patch: Partial<Pick<SolverAdjustmentSnapshot, 'x1' | 'y1' | 'x2' | 'y2'>>
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
): Array<Partial<Pick<SolverAdjustmentSnapshot, 'x1' | 'y1' | 'x2' | 'y2'>>> {
  return [
    { x1: current.x1 - amount, y1: current.y1 - amount },
    { x1: current.x1 + amount, y1: current.y1 + amount },
    { x2: current.x2 - amount, y2: current.y2 - amount },
    { x2: current.x2 + amount, y2: current.y2 + amount },
    { x1: current.x1 - amount, x2: current.x2 + amount },
    { x1: current.x1 + amount, x2: current.x2 - amount },
    { y1: current.y1 - amount, y2: current.y2 + amount },
    { y1: current.y1 + amount, y2: current.y2 - amount },
    { x1: current.x1 - amount },
    { x1: current.x1 + amount },
    { y1: current.y1 - amount },
    { y1: current.y1 + amount },
    { x2: current.x2 - amount },
    { x2: current.x2 + amount },
    { y2: current.y2 - amount },
    { y2: current.y2 + amount }
  ];
}

function getStepFocusedBezierPatches(
  current: SolverAdjustmentSnapshot,
  stepIndex: number,
  numColors: number,
  amount: number
): Array<Partial<Pick<SolverAdjustmentSnapshot, 'x1' | 'y1' | 'x2' | 'y2'>>> {
  const ratio = numColors <= 1 ? 0.5 : stepIndex / (numColors - 1);

  if (ratio <= 0.35) {
    return [
      { x1: current.x1 - amount, y1: current.y1 + amount },
      { x1: current.x1 + amount, y1: current.y1 - amount },
      { x1: current.x1 - amount },
      { x1: current.x1 + amount },
      { y1: current.y1 - amount },
      { y1: current.y1 + amount },
      { x1: current.x1 - amount, x2: current.x2 + amount },
      { x1: current.x1 + amount, x2: current.x2 - amount }
    ];
  }

  if (ratio >= 0.65) {
    return [
      { x2: current.x2 - amount, y2: current.y2 - amount },
      { x2: current.x2 + amount, y2: current.y2 + amount },
      { x2: current.x2 - amount },
      { x2: current.x2 + amount },
      { y2: current.y2 - amount },
      { y2: current.y2 + amount },
      { x1: current.x1 - amount, x2: current.x2 + amount },
      { x1: current.x1 + amount, x2: current.x2 - amount }
    ];
  }

  return [
    { x1: current.x1 - amount, x2: current.x2 + amount },
    { x1: current.x1 + amount, x2: current.x2 - amount },
    { y1: current.y1 - amount, y2: current.y2 + amount },
    { y1: current.y1 + amount, y2: current.y2 - amount },
    { x1: current.x1 - amount, y2: current.y2 + amount },
    { y1: current.y1 + amount, x2: current.x2 - amount }
  ];
}

function getMustPassTargets(constraints: Constraint[]): TargetColorConstraint[] {
  return constraints.filter(
    (constraint): constraint is TargetColorConstraint =>
      constraint.type === 'target-color' &&
      constraint.enabled &&
      constraint.mustPass === true &&
      isValidHexColor(constraint.targetHex)
  );
}

function buildSeedSnapshots(
  request: ConstraintSolveRequest,
  baseline: SolverAdjustmentSnapshot
): SolverAdjustmentSnapshot[] {
  const seeds = new Map<string, SolverAdjustmentSnapshot>();
  const addSeed = (snapshot: SolverAdjustmentSnapshot): void => {
    const normalized = normalizeAdjustments(request, snapshot);
    seeds.set(JSON.stringify(normalized), normalized);
  };

  addSeed(baseline);

  for (const preset of SOLVER_BEZIER_PRESETS) {
    addSeed({
      ...baseline,
      ...preset
    });
  }

  for (const delta of [0.08, 0.04]) {
    for (const patch of getBezierCandidatePatches(baseline, delta)) {
      addSeed(withBezierPatch(baseline, patch));
    }
  }

  return [...seeds.values()];
}

function evaluateSnapshot(
  request: ConstraintSolveRequest,
  baseline: SolverAdjustmentSnapshot,
  runtimeState: SolveRuntimeState,
  profile: SolveProfileConfig,
  snapshot: SolverAdjustmentSnapshot,
  comparator: CandidateComparator = isBetterCandidate
): SolverCandidate | null {
  if (!canContinue(runtimeState, profile)) {
    return null;
  }

  const cacheKey = JSON.stringify(compressAdjustments(snapshot));
  const cached = runtimeState.evaluationCache.get(cacheKey);
  if (cached) {
    if (comparator(cached, runtimeState.best)) {
      runtimeState.best = cached;
    }
    return cached;
  }

  runtimeState.evalCount += 1;
  const candidate = evaluateSolverCandidate(request, baseline, snapshot);
  runtimeState.evaluationCache.set(cacheKey, candidate);
  if (comparator(candidate, runtimeState.best)) {
    runtimeState.best = candidate;
  }
  return candidate;
}

function getFitToThresholdStepIndexes(
  request: ConstraintSolveRequest,
  results: ConstraintResult[],
  profile: SolveProfileConfig
): number[] {
  const stepIndexes = new Set<number>();

  for (const result of results) {
    const constraint = request.constraints.find((entry) => entry.id === result.id);
    if (
      result.type === 'contrast-rule' &&
      constraint?.type === 'contrast-rule' &&
      constraint.fitToThreshold
    ) {
      stepIndexes.add(constraint.stepIndex);
    }
  }

  return [...stepIndexes].slice(0, profile.maxLightnessCoordinates);
}

function getFitLightnessDeltas(profile: SolveProfileConfig): number[] {
  return [...new Set([...profile.lightnessDeltas, -0.06, -0.03, 0.03, 0.06])].sort(
    (left, right) => left - right
  );
}

function optimizeContinuousSeed(
  request: ConstraintSolveRequest,
  baseline: SolverAdjustmentSnapshot,
  runtimeState: SolveRuntimeState,
  profile: SolveProfileConfig,
  seed: SolverAdjustmentSnapshot
): void {
  if (!canContinue(runtimeState, profile)) return;

  const initialVector = snapshotToVector(seed);
  simplexOptimize(
    (vector) => {
      const snapshot = vectorToSnapshot(request, seed, vector);
      const candidate = evaluateSnapshot(request, baseline, runtimeState, profile, snapshot);
      return candidate?.objective ?? runtimeState.best.objective + 1e6;
    },
    initialVector,
    {
      maxIterations: profile.maxIterations,
      minErrorDelta: 1e-6,
      minTolerance: 1e-5
    }
  );
}

/**
 * Checks if the constraint set is "simple" enough for single-variable optimization:
 * all contrast-rule constraints are on distinct steps and total enabled constraint
 * count is <= 6.
 */
function isSimpleConstraintSet(constraints: Constraint[]): boolean {
  const enabled = constraints.filter((c) => c.enabled);
  if (enabled.length === 0 || enabled.length > 6) return false;

  const contrastSteps = new Set<number>();
  for (const c of enabled) {
    if (c.type === 'contrast-rule') {
      if (contrastSteps.has(c.stepIndex)) return false;
      contrastSteps.add(c.stepIndex);
    }
  }
  return true;
}

/**
 * Single-variable warm-start phase using ternary search for target-color constraints
 * and binary search for contrast constraints. Runs before Nelder-Mead in fast profile
 * to provide a better starting point. Only activates when the constraint set is "simple".
 */
function singleVariableWarmStart(
  request: ConstraintSolveRequest,
  baseline: SolverAdjustmentSnapshot,
  runtimeState: SolveRuntimeState,
  profile: SolveProfileConfig
): void {
  if (!isSimpleConstraintSet(request.constraints)) return;

  const enabledConstraints = request.constraints.filter((c) => c.enabled);

  // Greedy sequential refinement: evaluateSnapshot may update runtimeState.best as a
  // side effect, so each constraint's search starts from the improved settings left by
  // earlier constraints rather than the original baseline.

  // For contrast-rule constraints: binary search for the lightest nudger meeting the floor.
  // Direction depends on reference side: 'low' ref means positive nudger = more contrast,
  // 'high' ref means positive nudger = less contrast.
  for (const constraint of enabledConstraints) {
    if (!canContinue(runtimeState, profile)) break;
    if (constraint.type !== 'contrast-rule') continue;

    const stepIndex = constraint.stepIndex;
    const currentNudger = runtimeState.best.settings.lightnessNudgers[stepIndex] ?? 0;
    const lowRef = constraint.reference === 'low';

    let lo = currentNudger - 0.2;
    let hi = currentNudger + 0.2;

    for (let iter = 0; iter < 40 && hi - lo > 1e-6; iter++) {
      if (!canContinue(runtimeState, profile)) break;
      const mid = (lo + hi) / 2;
      const nextNudgers = [...runtimeState.best.settings.lightnessNudgers];
      nextNudgers[stepIndex] = clampLightnessNudger(mid);
      const candidate = evaluateSnapshot(request, baseline, runtimeState, profile, {
        ...runtimeState.best.settings,
        lightnessNudgers: nextNudgers
      });

      const result = candidate?.results.find((r) => r.id === constraint.id);
      const passes = result && result.type === 'contrast-rule' && result.passes;
      if (lowRef) {
        // Low ref: positive nudger = lighter swatch = more contrast with dark ref
        if (passes) {
          lo = mid;
        } else {
          hi = mid;
        }
      } else {
        // High ref: positive nudger = lighter swatch = less contrast with light ref
        if (passes) {
          hi = mid;
        } else {
          lo = mid;
        }
      }
    }
  }

  // For target-color constraints: ternary search to minimize delta-E via lightness nudgers
  // We identify impacted step indexes from the current best results
  for (const constraint of enabledConstraints) {
    if (!canContinue(runtimeState, profile)) break;
    if (constraint.type !== 'target-color') continue;

    // Find which step the closest match landed on
    const result = runtimeState.best.results.find((r) => r.id === constraint.id);
    if (!result || result.type !== 'target-color' || result.stepIndex == null) continue;
    const stepIndex = result.stepIndex;

    const currentNudger = runtimeState.best.settings.lightnessNudgers[stepIndex] ?? 0;
    let lo = currentNudger - 0.2;
    let hi = currentNudger + 0.2;

    for (let iter = 0; iter < 60 && hi - lo > 1e-6; iter++) {
      if (!canContinue(runtimeState, profile)) break;
      const m1 = lo + (hi - lo) / 3;
      const m2 = hi - (hi - lo) / 3;

      const nudgers1 = [...runtimeState.best.settings.lightnessNudgers];
      nudgers1[stepIndex] = clampLightnessNudger(m1);
      const c1 = evaluateSnapshot(request, baseline, runtimeState, profile, {
        ...runtimeState.best.settings,
        lightnessNudgers: nudgers1
      });

      const nudgers2 = [...runtimeState.best.settings.lightnessNudgers];
      nudgers2[stepIndex] = clampLightnessNudger(m2);
      const c2 = evaluateSnapshot(request, baseline, runtimeState, profile, {
        ...runtimeState.best.settings,
        lightnessNudgers: nudgers2
      });

      // Compare objectives: lower is better
      const obj1 = c1?.objective ?? Number.POSITIVE_INFINITY;
      const obj2 = c2?.objective ?? Number.POSITIVE_INFINITY;
      if (obj1 < obj2) {
        hi = m2;
      } else {
        lo = m1;
      }
    }
  }
}

function refineBezierControls(
  request: ConstraintSolveRequest,
  baseline: SolverAdjustmentSnapshot,
  runtimeState: SolveRuntimeState,
  profile: SolveProfileConfig
): void {
  const phaseStartEvalCount = runtimeState.evalCount;
  let rounds = 0;
  let improved = true;

  while (
    improved &&
    rounds < 2 &&
    canContinue(runtimeState, profile) &&
    runtimeState.evalCount - phaseStartEvalCount < profile.maxBezierEvaluations
  ) {
    rounds += 1;
    const previousBest = runtimeState.best;
    const current = runtimeState.best.settings;

    for (const preset of SOLVER_BEZIER_PRESETS) {
      if (runtimeState.evalCount - phaseStartEvalCount >= profile.maxBezierEvaluations) {
        break;
      }
      evaluateSnapshot(request, baseline, runtimeState, profile, {
        ...current,
        ...preset
      });
    }

    for (const delta of profile.bezierDeltas) {
      if (runtimeState.evalCount - phaseStartEvalCount >= profile.maxBezierEvaluations) {
        break;
      }
      for (const patch of getBezierCandidatePatches(current, delta)) {
        if (runtimeState.evalCount - phaseStartEvalCount >= profile.maxBezierEvaluations) {
          break;
        }
        evaluateSnapshot(request, baseline, runtimeState, profile, withBezierPatch(current, patch));
      }
    }

    const focusedStepIndexes = new Set<number>();
    for (const result of runtimeState.best.results) {
      if (result.type === 'target-color' && result.status !== 'pass' && result.stepIndex !== null) {
        focusedStepIndexes.add(result.stepIndex);
        continue;
      }

      const constraint = request.constraints.find((entry) => entry.id === result.id);
      if (
        result.type === 'contrast-rule' &&
        constraint?.type === 'contrast-rule' &&
        (!result.passes || (constraint.fitToThreshold && (result.distanceToThreshold ?? 0) > 1e-6))
      ) {
        focusedStepIndexes.add(constraint.stepIndex);
      }
    }

    for (const stepIndex of focusedStepIndexes) {
      if (runtimeState.evalCount - phaseStartEvalCount >= profile.maxBezierEvaluations) {
        break;
      }
      for (const delta of profile.bezierDeltas) {
        if (runtimeState.evalCount - phaseStartEvalCount >= profile.maxBezierEvaluations) {
          break;
        }
        for (const patch of getStepFocusedBezierPatches(
          current,
          stepIndex,
          request.numColors,
          delta
        )) {
          if (runtimeState.evalCount - phaseStartEvalCount >= profile.maxBezierEvaluations) {
            break;
          }
          evaluateSnapshot(
            request,
            baseline,
            runtimeState,
            profile,
            withBezierPatch(current, patch)
          );
        }
      }
    }

    improved = runtimeState.best !== previousBest;
  }
}

function getImpactedCoordinateIndexes(
  request: ConstraintSolveRequest,
  results: ConstraintResult[],
  profile: SolveProfileConfig,
  current: SolverAdjustmentSnapshot
): { lightnessIndexes: number[]; hueIndexes: number[]; paletteIndexes: number[] } {
  const lightnessIndexes = new Set<number>();
  const hueIndexes = new Set<number>();
  const paletteIndexes = new Set<number>();

  for (const result of results) {
    const constraint = request.constraints.find((entry) => entry.id === result.id);
    if (!constraint) continue;

    if (result.type === 'target-color' && result.status !== 'pass') {
      if (result.stepIndex !== null) {
        lightnessIndexes.add(result.stepIndex);
      }
      if (typeof result.paletteIndex === 'number') {
        hueIndexes.add(result.paletteIndex);
        paletteIndexes.add(result.paletteIndex);
      }
    }

    if (
      result.type === 'contrast-rule' &&
      (!result.passes || (constraint.type === 'contrast-rule' && constraint.fitToThreshold))
    ) {
      if (constraint.type === 'contrast-rule') {
        lightnessIndexes.add(constraint.stepIndex);
        if (typeof result.paletteIndex === 'number') {
          hueIndexes.add(result.paletteIndex);
          paletteIndexes.add(result.paletteIndex);
        } else if (constraint.scope === 'all-palettes') {
          for (let paletteIndex = 0; paletteIndex < request.numPalettes; paletteIndex += 1) {
            hueIndexes.add(paletteIndex);
            paletteIndexes.add(paletteIndex);
          }
        }
      }
    }
  }

  const generated = generatePalettes(toColorGenParams(request, current));
  const lastStepIndex = generated.neutrals.length - 1;

  for (let stepIndex = 0; stepIndex < generated.neutrals.length - 1; stepIndex += 1) {
    const nextStepIndex = stepIndex + 1;

    const neutralDelta = generated.neutrals[stepIndex]?.deltaEOK(generated.neutrals[nextStepIndex]);
    if ((neutralDelta ?? 0) < MIN_ADJACENT_STEP_DELTA_E_OK) {
      lightnessIndexes.add(stepIndex);
      lightnessIndexes.add(nextStepIndex);
    }

    for (const palette of generated.palettes) {
      const paletteDelta = palette[stepIndex]?.deltaEOK(palette[nextStepIndex]);
      if ((paletteDelta ?? 0) < MIN_ADJACENT_STEP_DELTA_E_OK) {
        lightnessIndexes.add(stepIndex);
        lightnessIndexes.add(nextStepIndex);
      }
    }
  }

  for (let stepIndex = 1; stepIndex < lastStepIndex; stepIndex += 1) {
    for (let paletteIndex = 0; paletteIndex < generated.palettes.length - 1; paletteIndex += 1) {
      const currentColor = generated.palettes[paletteIndex]?.[stepIndex];
      const nextColor = generated.palettes[paletteIndex + 1]?.[stepIndex];
      const delta = currentColor?.deltaEOK(nextColor) ?? 0;
      if (delta < MIN_ADJACENT_PALETTE_DELTA_E_OK) {
        hueIndexes.add(paletteIndex);
        hueIndexes.add(paletteIndex + 1);
        paletteIndexes.add(paletteIndex);
        paletteIndexes.add(paletteIndex + 1);
      }
    }
  }

  return {
    lightnessIndexes: [...lightnessIndexes].slice(0, profile.maxLightnessCoordinates),
    hueIndexes: [...hueIndexes].slice(0, profile.maxHueCoordinates),
    paletteIndexes: [...paletteIndexes].slice(0, profile.maxHueCoordinates)
  };
}

function refineDiscreteNudgers(
  request: ConstraintSolveRequest,
  baseline: SolverAdjustmentSnapshot,
  runtimeState: SolveRuntimeState,
  profile: SolveProfileConfig
): void {
  let improved = true;
  let rounds = 0;

  while (improved && rounds < 2 && canContinue(runtimeState, profile)) {
    rounds += 1;
    const previousBest = runtimeState.best;
    const { lightnessIndexes, hueIndexes, paletteIndexes } = getImpactedCoordinateIndexes(
      request,
      runtimeState.best.results,
      profile,
      runtimeState.best.settings
    );

    for (const index of lightnessIndexes) {
      for (const delta of [-0.02, -0.01, -0.005, 0.005, 0.01, 0.02]) {
        const current = runtimeState.best.settings;
        const nextNudgers = [...(current.stepSaturationNudgers ?? [])];
        nextNudgers[index] = clampStepSaturationNudger((nextNudgers[index] ?? 0) + delta);
        evaluateSnapshot(request, baseline, runtimeState, profile, {
          ...current,
          stepSaturationNudgers: nextNudgers
        });
      }
      for (const delta of profile.lightnessDeltas) {
        const current = runtimeState.best.settings;
        const nextNudgers = [...current.lightnessNudgers];
        nextNudgers[index] = clampLightnessNudger((nextNudgers[index] ?? 0) + delta);
        evaluateSnapshot(request, baseline, runtimeState, profile, {
          ...current,
          lightnessNudgers: nextNudgers
        });
      }
    }

    for (const index of paletteIndexes) {
      for (const delta of [-0.015, -0.0075, 0.0075, 0.015]) {
        const current = runtimeState.best.settings;
        const nextNudgers = [...(current.paletteSaturationNudgers ?? [])];
        nextNudgers[index] = clampPaletteSaturationNudger((nextNudgers[index] ?? 0) + delta);
        evaluateSnapshot(request, baseline, runtimeState, profile, {
          ...current,
          paletteSaturationNudgers: nextNudgers
        });
      }
      for (const delta of [-0.05, -0.025, -0.01, 0.01, 0.025, 0.05]) {
        const current = runtimeState.best.settings;
        const nextChromaNudgers = [...(current.paletteChromaNudgers ?? [])];
        nextChromaNudgers[index] = clampPaletteChromaNudger(
          (nextChromaNudgers[index] ?? 1.0) + delta
        );
        evaluateSnapshot(request, baseline, runtimeState, profile, {
          ...current,
          paletteChromaNudgers: nextChromaNudgers
        });
      }
    }

    for (const index of hueIndexes) {
      for (const delta of profile.hueDeltas) {
        const current = runtimeState.best.settings;
        const nextNudgers = [...current.hueNudgers];
        nextNudgers[index] = clampHueNudger((nextNudgers[index] ?? 0) + delta);
        evaluateSnapshot(request, baseline, runtimeState, profile, {
          ...current,
          hueNudgers: nextNudgers
        });
      }
    }

    improved = runtimeState.best !== previousBest;
  }
}

function refineFitToThreshold(
  request: ConstraintSolveRequest,
  baseline: SolverAdjustmentSnapshot,
  runtimeState: SolveRuntimeState,
  profile: SolveProfileConfig
): void {
  if (
    !request.constraints.some(
      (constraint) =>
        constraint.enabled &&
        constraint.type === 'contrast-rule' &&
        constraint.fitToThreshold === true
    )
  ) {
    return;
  }

  let improved = true;
  let rounds = 0;
  const fitLightnessDeltas = getFitLightnessDeltas(profile);

  while (improved && rounds < 3 && canContinue(runtimeState, profile)) {
    rounds += 1;
    const previousBest = runtimeState.best;
    const stepIndexes = getFitToThresholdStepIndexes(request, runtimeState.best.results, profile);

    for (const stepIndex of stepIndexes) {
      for (const delta of fitLightnessDeltas) {
        const current = runtimeState.best.settings;
        const nextNudgers = [...current.lightnessNudgers];
        nextNudgers[stepIndex] = clampLightnessNudger((nextNudgers[stepIndex] ?? 0) + delta);
        evaluateSnapshot(
          request,
          baseline,
          runtimeState,
          profile,
          {
            ...current,
            lightnessNudgers: nextNudgers
          },
          isBetterFitPhaseCandidate
        );
      }

      for (const delta of profile.bezierDeltas) {
        const current = runtimeState.best.settings;
        for (const patch of getStepFocusedBezierPatches(
          current,
          stepIndex,
          request.numColors,
          delta
        )) {
          evaluateSnapshot(
            request,
            baseline,
            runtimeState,
            profile,
            withBezierPatch(current, patch),
            isBetterFitPhaseCandidate
          );
        }
      }
    }

    improved = runtimeState.best !== previousBest;
  }

  // Binary search polish: for each fit-to-threshold step, find the lightest nudger that
  // still meets the contrast floor. This maximizes lightness subject to contrast minimum.
  // Direction depends on reference side: 'low' ref means positive nudger = more contrast,
  // 'high' ref means positive nudger = less contrast.
  if (canContinue(runtimeState, profile)) {
    const fitConstraints = request.constraints.filter(
      (c): c is ContrastRuleConstraint =>
        c.enabled && c.type === 'contrast-rule' && c.fitToThreshold === true
    );
    for (const constraint of fitConstraints) {
      if (!canContinue(runtimeState, profile)) break;
      const stepIndex = constraint.stepIndex;
      const current = runtimeState.best.settings;
      const currentNudger = current.lightnessNudgers[stepIndex] ?? 0;
      const lowRef = constraint.reference === 'low';

      let lo = currentNudger - 0.15;
      let hi = currentNudger + 0.15;

      const currentResult = runtimeState.best.results.find((r) => r.id === constraint.id);
      if (!currentResult || currentResult.type !== 'contrast-rule' || !currentResult.passes) {
        continue; // Only polish passing constraints
      }

      for (let iter = 0; iter < 30 && hi - lo > 1e-6; iter++) {
        if (!canContinue(runtimeState, profile)) break;
        const mid = (lo + hi) / 2;
        const nextNudgers = [...runtimeState.best.settings.lightnessNudgers];
        nextNudgers[stepIndex] = clampLightnessNudger(mid);
        const candidate = evaluateSnapshot(
          request,
          baseline,
          runtimeState,
          profile,
          {
            ...runtimeState.best.settings,
            lightnessNudgers: nextNudgers
          },
          isBetterFitPhaseCandidate
        );

        const fitResult = candidate?.results.find((r) => r.id === constraint.id);
        const passes = fitResult && fitResult.type === 'contrast-rule' && fitResult.passes;
        if (lowRef) {
          // Low ref: positive nudger = lighter swatch = more contrast with dark ref
          if (passes) {
            lo = mid;
          } else {
            hi = mid;
          }
        } else {
          // High ref: positive nudger = lighter swatch = less contrast with light ref
          if (passes) {
            hi = mid;
          } else {
            lo = mid;
          }
        }
      }
    }
  }
}

function buildTargetRescueSeeds(
  request: ConstraintSolveRequest,
  best: SolverCandidate
): SolverAdjustmentSnapshot[] {
  const seeds = new Map<string, SolverAdjustmentSnapshot>();
  const addSeed = (snapshot: SolverAdjustmentSnapshot): void => {
    const normalized = normalizeAdjustments(request, snapshot);
    seeds.set(JSON.stringify(normalized), normalized);
  };

  const prioritizedResults = best.results.filter(
    (result): result is Extract<ConstraintResult, { type: 'target-color' }> =>
      result.type === 'target-color'
  );

  for (const result of prioritizedResults) {
    const constraint = request.constraints.find((entry) => entry.id === result.id);
    if (constraint?.type !== 'target-color' || result.status === 'pass') {
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

      const nextLightnessNudgers = [...best.settings.lightnessNudgers];
      nextLightnessNudgers[result.stepIndex] = clampLightnessNudger(
        (nextLightnessNudgers[result.stepIndex] ?? 0) + deltaL
      );
      const nextStepSaturationNudgers = [...(best.settings.stepSaturationNudgers ?? [])];
      nextStepSaturationNudgers[result.stepIndex] = clampStepSaturationNudger(
        (nextStepSaturationNudgers[result.stepIndex] ?? 0) + deltaC * 0.08
      );
      addSeed({
        ...best.settings,
        lightnessNudgers: nextLightnessNudgers,
        stepSaturationNudgers: nextStepSaturationNudgers
      });

      if (!result.isNeutral && typeof result.paletteIndex === 'number') {
        const nextHueNudgers = [...best.settings.hueNudgers];
        nextHueNudgers[result.paletteIndex] = clampHueNudger(
          (nextHueNudgers[result.paletteIndex] ?? 0) + deltaH
        );
        const nextPaletteSaturationNudgers = [...(best.settings.paletteSaturationNudgers ?? [])];
        nextPaletteSaturationNudgers[result.paletteIndex] = clampPaletteSaturationNudger(
          (nextPaletteSaturationNudgers[result.paletteIndex] ?? 0) + deltaC * 0.08
        );
        addSeed({
          ...best.settings,
          hueNudgers: nextHueNudgers,
          paletteSaturationNudgers: nextPaletteSaturationNudgers
        });

        addSeed({
          ...best.settings,
          lightnessNudgers: nextLightnessNudgers,
          hueNudgers: nextHueNudgers,
          stepSaturationNudgers: nextStepSaturationNudgers,
          paletteSaturationNudgers: nextPaletteSaturationNudgers
        });
      }
    } catch {
      continue;
    }
  }

  return [...seeds.values()];
}

function createSummary(
  request: ConstraintSolveRequest,
  baseline: SolverCandidate,
  best: SolverCandidate,
  runtimeState: SolveRuntimeState,
  profileName: ConstraintSolveProfile,
  source: ConstraintSolveSource
): ConstraintSolverSummary {
  return {
    ...best.summary,
    solvedAt: Date.now(),
    applied: true,
    changed: hasMeaningfulAdjustmentChange(
      normalizeAdjustments(request, {
        baseColor: request.baseColor,
        warmth: request.warmth,
        warmthHue: request.warmthHue,
        chromaMultiplier: request.chromaMultiplier,
        x1: request.x1,
        y1: request.y1,
        x2: request.x2,
        y2: request.y2,
        lightnessNudgers: [...request.lightnessNudgers],
        hueNudgers: [...request.hueNudgers],
        stepSaturationNudgers: [...(request.stepSaturationNudgers ?? [])],
        paletteSaturationNudgers: [...(request.paletteSaturationNudgers ?? [])],
        paletteChromaNudgers: [...(request.paletteChromaNudgers ?? [])]
      }),
      best.settings
    ),
    scoreBefore: baseline.score,
    scoreAfter: best.score,
    profile: profileName,
    source,
    durationMs: Date.now() - runtimeState.startedAt,
    evalCount: runtimeState.evalCount,
    budgetHit: runtimeState.budgetHit
  };
}

export function validateConstraintSolveRequest(request: ConstraintSolveRequest): string | null {
  const mustPassCount = getMustPassTargets(request.constraints).length;
  if (mustPassCount > MAX_MUST_PASS_TARGETS) {
    return `A maximum of ${MAX_MUST_PASS_TARGETS} target colors can be marked must pass.`;
  }
  if (request.numColors <= 0 || request.numPalettes <= 0) {
    return 'Invalid solve dimensions.';
  }
  return null;
}

export function getConstraintSolveRequestHash(
  request: ConstraintSolveRequest,
  profile: ConstraintSolveProfile
): string {
  const normalized = normalizeAdjustments(request, request);
  const payload = JSON.stringify({
    profile,
    ...request,
    lightnessNudgers: normalized.lightnessNudgers,
    hueNudgers: normalized.hueNudgers,
    stepSaturationNudgers: normalized.stepSaturationNudgers,
    paletteSaturationNudgers: normalized.paletteSaturationNudgers
  });

  let hash = 2166136261;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= payload.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${profile}-${(hash >>> 0).toString(16)}`;
}

export function solveConstraintsWithProfile(
  request: ConstraintSolveRequest,
  profileName: ConstraintSolveProfile,
  source: ConstraintSolveSource
): ConstraintSolveResponse {
  const validationError = validateConstraintSolveRequest(request);
  if (validationError) {
    throw new Error(validationError);
  }

  const profile = PROFILE_CONFIG[profileName];
  const baselineAdjustments = normalizeAdjustments(request, {
    baseColor: request.baseColor,
    warmth: request.warmth,
    warmthHue: request.warmthHue,
    chromaMultiplier: request.chromaMultiplier,
    x1: request.x1,
    y1: request.y1,
    x2: request.x2,
    y2: request.y2,
    lightnessNudgers: [...request.lightnessNudgers],
    hueNudgers: [...request.hueNudgers],
    stepSaturationNudgers: [...(request.stepSaturationNudgers ?? [])],
    paletteSaturationNudgers: [...(request.paletteSaturationNudgers ?? [])],
    paletteChromaNudgers: [...(request.paletteChromaNudgers ?? [])]
  });

  const baseline = evaluateSolverCandidate(request, baselineAdjustments, baselineAdjustments);
  const runtimeState: SolveRuntimeState = {
    startedAt: Date.now(),
    evalCount: 0,
    budgetHit: false,
    best: baseline,
    evaluationCache: new Map()
  };

  if (
    request.constraints.filter((constraint) => constraint.enabled).length === 0 &&
    baseline.guardrailViolationCount === 0 &&
    baseline.guardrailOverflow <= 1e-9 &&
    baseline.failCount === 0 &&
    baseline.warningCount === 0 &&
    baseline.adjacentStopLowCount === 0 &&
    baseline.adjacentStopLowOverflow <= 1e-9 &&
    baseline.overflow <= 1e-9
  ) {
    return {
      snapshot: compressAdjustments(baselineAdjustments),
      summary: createSummary(request, baseline, baseline, runtimeState, profileName, source),
      results: baseline.results
    };
  }

  // Fast profile: single-variable warm-start for simple constraint sets
  if (profileName === 'fast') {
    singleVariableWarmStart(request, baselineAdjustments, runtimeState, profile);
  }

  for (const seed of buildSeedSnapshots(request, baselineAdjustments)) {
    if (!canContinueContinuousPhase(runtimeState, profile)) {
      break;
    }
    optimizeContinuousSeed(request, baselineAdjustments, runtimeState, profile, seed);
    if (!canContinue(runtimeState, profile)) {
      break;
    }
  }

  refineBezierControls(request, baselineAdjustments, runtimeState, profile);

  // Co-optimization loop: run discrete+rescue+discrete+bezier phases, then check if
  // chroma nudgers were discovered. If so and profile is deep, run a second pass to let
  // lightness nudgers re-settle against the new chroma nudger values.
  const maxCoOptRounds = profileName === 'deep' ? 2 : 1;
  for (
    let coOptRound = 0;
    coOptRound < maxCoOptRounds && canContinue(runtimeState, profile);
    coOptRound += 1
  ) {
    refineDiscreteNudgers(request, baselineAdjustments, runtimeState, profile);
    for (let round = 0; round < 2 && canContinue(runtimeState, profile); round += 1) {
      let improved = false;
      for (const seed of buildTargetRescueSeeds(request, runtimeState.best)) {
        const candidate = evaluateSnapshot(
          request,
          baselineAdjustments,
          runtimeState,
          profile,
          seed
        );
        if (candidate && runtimeState.best === candidate) {
          improved = true;
        }
        if (!canContinue(runtimeState, profile)) {
          break;
        }
      }
      if (!improved) {
        break;
      }
    }
    refineDiscreteNudgers(request, baselineAdjustments, runtimeState, profile);
    refineBezierControls(request, baselineAdjustments, runtimeState, profile);

    // Only run a second co-opt round if chroma nudgers were actually discovered
    if (coOptRound === 0 && maxCoOptRounds > 1) {
      const discoveredChromaNudgers =
        runtimeState.best.settings.paletteChromaNudgers?.some((b) => Math.abs(b - 1.0) > 1e-6) ??
        false;
      if (!discoveredChromaNudgers) break;
    }
  }

  refineFitToThreshold(request, baselineAdjustments, runtimeState, profile);

  return {
    snapshot: compressAdjustments(runtimeState.best.settings),
    summary: createSummary(request, baseline, runtimeState.best, runtimeState, profileName, source),
    results: runtimeState.best.results
  };
}

export function solveConstraints(request: ConstraintSolveRequest): ConstraintSolveResponse {
  return solveConstraintsWithProfile(request, 'fast', 'client');
}
