/** Supported display color space formats */
export type DisplayColorSpace = 'hex' | 'rgb' | 'oklch' | 'hsl';

/** Supported gamut mapping targets */
export type GamutSpace = 'srgb' | 'p3' | 'rec2020';

/** Theme preference (auto follows prefers-color-scheme) */
export type ThemePreference = 'light' | 'dark' | 'auto';

/** Swatch label display options */
export type SwatchLabels = 'both' | 'step' | 'value' | 'none';

/** Supported contrast algorithm identifiers */
export type ContrastAlgorithm = 'WCAG' | 'APCA';

/** Color vision deficiency simulation modes */
export type CvdMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

/** Contrast reference source kinds for auto contrast mode */
export type ContrastReferenceKind = 'neutral' | 'palette';

/** Selected swatch reference for low/high contrast colors */
export interface ContrastReference {
  kind: ContrastReferenceKind;
  stepIndex: number;
  paletteIndex?: number;
}

/** Swatch contrast indicator visibility by criterion */
export interface SwatchContrastIndicators {
  wcagThreeToOne: boolean;
  wcagAA: boolean;
  wcagAAA: boolean;
  apcaLarge: boolean;
  apcaFluent: boolean;
  apcaBody: boolean;
}

/** User-selectable significant digits for OKLCH display values */
export type OklchDisplaySignificantDigits = 1 | 2 | 3 | 4 | 5 | 6;

/** Constraint status buckets used for target-color matching */
export type ConstraintStatus = 'pass' | 'warning' | 'fail';

/** Supported target-color difference metrics */
export type ColorDifferenceMetric = 'ok' | '2000';

/** Supported contrast-rule scopes */
export type ContrastRuleScope = 'neutral' | 'all-palettes';

/** Supported contrast-rule reference sides */
export type ContrastReferenceSide = 'low' | 'high';

/** Constraint threshold keys for WCAG/APCA rule evaluation */
export type ConstraintThresholdKey =
  | 'wcagThreeToOne'
  | 'wcagAA'
  | 'wcagAAA'
  | 'apcaLarge'
  | 'apcaFluent'
  | 'apcaBody';

interface BaseConstraint {
  id: string;
  enabled: boolean;
}

/** Target-color matching constraint evaluated with deltaEOK */
export interface TargetColorConstraint extends BaseConstraint {
  type: 'target-color';
  targetHex: string;
  mustPass?: boolean;
  metric?: ColorDifferenceMetric;
}

/** Contrast-rule constraint for a step across a scope */
export interface ContrastRuleConstraint extends BaseConstraint {
  type: 'contrast-rule';
  scope: ContrastRuleScope;
  stepIndex: number;
  reference: ContrastReferenceSide;
  algorithm: ContrastAlgorithm;
  level: ConstraintThresholdKey;
  fitToThreshold?: boolean;
}

/** Structured constraint supported by the Constraints card */
export type Constraint = TargetColorConstraint | ContrastRuleConstraint;

/** Solver-restorable adjustable settings snapshot */
export interface SolverAdjustmentSnapshot {
  baseColor: string;
  warmth: number;
  warmthHue?: number;
  chromaMultiplier: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  lightnessNudgers: number[];
  hueNudgers: number[];
  stepSaturationNudgers?: number[];
  paletteSaturationNudgers?: number[];
  paletteChromaNudgers?: number[];
}

/** Last solve summary persisted with the state */
export interface ConstraintSolverSummary {
  solvedAt: number;
  passCount: number;
  warningCount: number;
  failCount: number;
  requiredSatisfiedCount?: number;
  requiredUnsatisfiedCount?: number;
  applied: boolean;
  changed: boolean;
  scoreBefore: number;
  scoreAfter: number;
  profile?: ConstraintSolveProfile;
  source?: ConstraintSolveSource;
  durationMs?: number;
  evalCount?: number;
  budgetHit?: boolean;
}

export const MAX_MUST_PASS_TARGETS = 4;

export type ConstraintSolveProfile = 'fast' | 'deep';

export type ConstraintSolveSource = 'client' | 'server';

export interface ConstraintSolveRequest extends SolverAdjustmentSnapshot {
  numColors: number;
  numPalettes: number;
  currentTheme: 'light' | 'dark';
  gamutSpace: GamutSpace;
  contrastAlgorithm?: ContrastAlgorithm;
  solveAdjacentStopLows?: boolean;
  constraints: Constraint[];
  lowReference: ContrastReference;
  highReference: ContrastReference;
  contrastMode: 'auto' | 'manual';
  manualContrast: {
    low: string;
    high: string;
  };
}

export interface ConstraintSolveResponse {
  snapshot: SolverAdjustmentSnapshot;
  summary: ConstraintSolverSummary;
  results: ConstraintResult[];
}

export interface ConstraintSolveRunState {
  status: 'idle' | 'running-fast' | 'running-deep';
  requestHash?: string;
  startedAt?: number;
  source?: ConstraintSolveSource;
  statusMessage?: string;
}

/** Target-color constraint evaluation result */
export interface TargetColorConstraintResult {
  id: string;
  type: 'target-color';
  status: ConstraintStatus;
  required?: boolean;
  requiredSatisfied?: boolean;
  metric: ColorDifferenceMetric;
  deltaE: number;
  stepIndex: number | null;
  paletteIndex?: number;
  isNeutral?: boolean;
  swatchLabel: string;
  paletteLabel: string;
  closestHex: string | null;
}

/** Contrast-rule constraint evaluation result */
export interface ContrastRuleConstraintResult {
  id: string;
  type: 'contrast-rule';
  passes: boolean;
  actualValue: number;
  minimumValue?: number;
  paletteIndex?: number;
  swatchLabel: string;
  paletteLabel: string;
  distanceToThreshold?: number;
}

/** Constraint evaluation result union */
export type ConstraintResult = TargetColorConstraintResult | ContrastRuleConstraintResult;

/** Adjacent-stop contrast entry for reporting low-contrast adjacent pairs */
export interface AdjacentStopContrastEntry {
  paletteLabel: string;
  paletteIndex?: number;
  isNeutral: boolean;
  stopIndexA: number;
  stopIndexB: number;
  contrastValue: number;
  contrastAlgorithm: ContrastAlgorithm;
  isLow: boolean;
}

/**
 * Serializable color state for URL and localStorage persistence.
 * All fields are optional to support partial state updates.
 */
export interface SerializableColorState {
  baseColor?: string;
  warmth?: number;
  warmthHue?: number;
  chromaMultiplier?: number;
  numColors?: number;
  numPalettes?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  theme?: 'light' | 'dark';
  contrastMode?: 'auto' | 'manual';
  lowStep?: number;
  highStep?: number;
  lowReference?: ContrastReference;
  highReference?: ContrastReference;
  lightnessNudgers?: number[];
  hueNudgers?: number[];
  stepSaturationNudgers?: number[];
  paletteSaturationNudgers?: number[];
  paletteChromaNudgers?: number[];
  displayColorSpace?: DisplayColorSpace;
  gamutSpace?: GamutSpace;
  themePreference?: ThemePreference;
  swatchLabels?: SwatchLabels;
  showSwatchGamutWarnings?: boolean;
  showSwatchContrastIndicators?: boolean;
  swatchContrastIndicators?: SwatchContrastIndicators;
  contrastAlgorithm?: ContrastAlgorithm;
  solveAdjacentStopLows?: boolean;
  oklchDisplaySignificantDigits?: OklchDisplaySignificantDigits;
  cvdMode?: CvdMode;
  customNeutralName?: string;
  customPaletteNames?: string[];
  constraints?: Constraint[];
  solverAdjustmentSnapshot?: SolverAdjustmentSnapshot | null;
  constraintSolverSummary?: ConstraintSolverSummary | null;
}
