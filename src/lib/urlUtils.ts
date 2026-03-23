/**
 * URL State Persistence Utilities
 * Encodes and decodes Chroma11y state to/from URL parameters
 */

import type { SerializableColorState } from './types';
import type {
  DisplayColorSpace,
  GamutSpace,
  SwatchLabels,
  ContrastAlgorithm,
  OklchDisplaySignificantDigits,
  SwatchContrastIndicators,
  ContrastReference
} from './types';
import type { Constraint } from './types';
import { isValidConstraint } from './constraintValidation';
import { getChromaMultiplierBounds } from './chromaMultiplier';
import { normalizeCustomPaletteName, normalizeCustomPaletteNames } from './paletteNameUtils';

export type UrlColorState = SerializableColorState;

const VALID_DISPLAY_SPACES: DisplayColorSpace[] = ['hex', 'rgb', 'oklch', 'hsl'];
const VALID_GAMUT_SPACES: GamutSpace[] = ['srgb', 'p3', 'rec2020'];
const VALID_SWATCH_LABELS: SwatchLabels[] = ['both', 'step', 'value', 'none'];
const VALID_CONTRAST_ALGOS: ContrastAlgorithm[] = ['WCAG', 'APCA'];
const VALID_OKLCH_SIG_DIGITS: OklchDisplaySignificantDigits[] = [1, 2, 3, 4, 5, 6];
const DEFAULT_SWATCH_CONTRAST_INDICATORS: SwatchContrastIndicators = {
  wcagThreeToOne: true,
  wcagAA: true,
  wcagAAA: true,
  apcaLarge: true,
  apcaFluent: true,
  apcaBody: true
};
const INDICATOR_KEY_BY_CODE = {
  c: 'wcagThreeToOne',
  a: 'wcagAA',
  A: 'wcagAAA',
  l: 'apcaLarge',
  f: 'apcaFluent',
  b: 'apcaBody'
} as const satisfies Record<string, keyof SwatchContrastIndicators>;
const INDICATOR_CODE_ORDER = ['c', 'a', 'A', 'l', 'f', 'b'] as const;

function sanitizeConstraints(
  constraints: Constraint[] | null | undefined
): Constraint[] | undefined {
  if (!constraints?.length) {
    return undefined;
  }

  const sanitized = constraints.filter((constraint) => isValidConstraint(constraint));

  return sanitized.length > 0 ? sanitized : undefined;
}

function encodeContrastReference(reference: ContrastReference): string {
  if (reference.kind === 'palette') {
    return `p:${reference.paletteIndex ?? 0}:${reference.stepIndex}`;
  }

  return `n:${reference.stepIndex}`;
}

function decodeContrastReference(encoded: string): ContrastReference | null {
  const parts = encoded.split(':');
  if (parts[0] === 'n' && parts.length === 2) {
    const stepIndex = parseInt(parts[1], 10);
    if (Number.isInteger(stepIndex) && stepIndex >= 0) {
      return { kind: 'neutral', stepIndex };
    }
  }

  if (parts[0] === 'p' && parts.length === 3) {
    const paletteIndex = parseInt(parts[1], 10);
    const stepIndex = parseInt(parts[2], 10);
    if (
      Number.isInteger(paletteIndex) &&
      paletteIndex >= 0 &&
      Number.isInteger(stepIndex) &&
      stepIndex >= 0
    ) {
      return { kind: 'palette', paletteIndex, stepIndex };
    }
  }

  return null;
}

function encodeJsonState<T>(value: T): string {
  const json = JSON.stringify(value);

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(json, 'utf8').toString('base64url');
  }

  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeJsonState<T>(value: string): T | null {
  try {
    if (typeof Buffer !== 'undefined') {
      return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
    }

    const padded = value + '==='.slice((value.length + 3) % 4);
    const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    return null;
  }
}

function areAllIndicatorsVisible(indicators: SwatchContrastIndicators): boolean {
  return Object.values(indicators).every(Boolean);
}

function areNoIndicatorsVisible(indicators: SwatchContrastIndicators): boolean {
  return Object.values(indicators).every((value) => !value);
}

function encodeIndicators(indicators: SwatchContrastIndicators): string {
  return INDICATOR_CODE_ORDER.filter((code) => indicators[INDICATOR_KEY_BY_CODE[code]]).join('');
}

function decodeIndicators(encoded: string): SwatchContrastIndicators | null {
  if (!encoded) return null;
  if (encoded === '0') {
    return {
      wcagThreeToOne: false,
      wcagAA: false,
      wcagAAA: false,
      apcaLarge: false,
      apcaFluent: false,
      apcaBody: false
    };
  }
  if (encoded === '1') {
    return { ...DEFAULT_SWATCH_CONTRAST_INDICATORS };
  }

  if (!/^[caAlfb]+$/.test(encoded)) {
    return null;
  }

  const uniqueCodes = new Set(encoded.split(''));
  const hasLegacyWcagCodes = uniqueCodes.has('a') || uniqueCodes.has('A');
  return {
    // Backward compatibility for masks created before the 3:1 bucket existed.
    wcagThreeToOne: uniqueCodes.has('c') || hasLegacyWcagCodes,
    wcagAA: uniqueCodes.has('a'),
    wcagAAA: uniqueCodes.has('A'),
    apcaLarge: uniqueCodes.has('l'),
    apcaFluent: uniqueCodes.has('f'),
    apcaBody: uniqueCodes.has('b')
  };
}

/**
 * Encodes the color state into URL search parameters
 */
export function encodeStateToUrl(state: UrlColorState): string {
  const params = new URLSearchParams();

  if (state.baseColor) {
    // Remove # from hex color for cleaner URL
    params.set('c', state.baseColor.replace('#', ''));
  }
  if (state.warmth !== undefined) params.set('w', state.warmth.toString());
  if (state.chromaMultiplier !== undefined) params.set('cm', state.chromaMultiplier.toString());
  if (state.numColors !== undefined) params.set('nc', state.numColors.toString());
  if (state.numPalettes !== undefined) params.set('np', state.numPalettes.toString());

  // Bezier curve parameters
  if (state.x1 !== undefined) params.set('x1', state.x1.toString());
  if (state.y1 !== undefined) params.set('y1', state.y1.toString());
  if (state.x2 !== undefined) params.set('x2', state.x2.toString());
  if (state.y2 !== undefined) params.set('y2', state.y2.toString());

  // Contrast
  if (state.contrastMode) params.set('m', state.contrastMode);
  if (state.lowStep !== undefined) params.set('ls', state.lowStep.toString());
  if (state.highStep !== undefined) params.set('hs', state.highStep.toString());
  if (state.lowReference) params.set('lr', encodeContrastReference(state.lowReference));
  if (state.highReference) params.set('hr', encodeContrastReference(state.highReference));

  // Encode nudgers as comma-separated values (only non-zero values with index)
  if (state.lightnessNudgers?.some((v) => v !== 0)) {
    const nudgerStr = state.lightnessNudgers
      .map((v, i) => (v !== 0 ? `${i}:${v}` : null))
      .filter(Boolean)
      .join(',');
    if (nudgerStr) params.set('ln', nudgerStr);
  }

  if (state.hueNudgers?.some((v) => v !== 0)) {
    const nudgerStr = state.hueNudgers
      .map((v, i) => (v !== 0 ? `${i}:${v}` : null))
      .filter(Boolean)
      .join(',');
    if (nudgerStr) params.set('hn', nudgerStr);
  }

  if (state.stepSaturationNudgers?.some((v) => v !== 0)) {
    const nudgerStr = state.stepSaturationNudgers
      .map((v, i) => (v !== 0 ? `${i}:${v}` : null))
      .filter(Boolean)
      .join(',');
    if (nudgerStr) params.set('scn', nudgerStr);
  }

  if (state.paletteSaturationNudgers?.some((v) => v !== 0)) {
    const nudgerStr = state.paletteSaturationNudgers
      .map((v, i) => (v !== 0 ? `${i}:${v}` : null))
      .filter(Boolean)
      .join(',');
    if (nudgerStr) params.set('psn', nudgerStr);
  }

  const customNeutralName = normalizeCustomPaletteName(state.customNeutralName);
  if (customNeutralName) {
    params.set('nn', customNeutralName);
  }

  const customPaletteNames = normalizeCustomPaletteNames(
    state.customPaletteNames,
    state.numPalettes
  );
  if (customPaletteNames?.length) {
    const encodedNames = customPaletteNames
      .map((name, index) => (name ? `${index}:${encodeNameToken(name)}` : null))
      .filter(Boolean)
      .join(',');

    if (encodedNames) {
      params.set('pn', encodedNames);
    }
  }

  // Theme preference
  if (state.themePreference && state.themePreference !== 'auto')
    params.set('t', state.themePreference);

  // Display settings
  if (state.displayColorSpace && state.displayColorSpace !== 'hex')
    params.set('ds', state.displayColorSpace);
  const effectiveGamutSpace =
    state.displayColorSpace === 'hex' && state.gamutSpace && state.gamutSpace !== 'srgb'
      ? 'srgb'
      : state.gamutSpace;
  if (effectiveGamutSpace && effectiveGamutSpace !== 'srgb') params.set('gs', effectiveGamutSpace);
  if (state.swatchLabels && state.swatchLabels !== 'both') params.set('sl', state.swatchLabels);
  if (state.showSwatchGamutWarnings !== undefined && !state.showSwatchGamutWarnings)
    params.set('gw', '0');
  if (state.swatchContrastIndicators) {
    if (areNoIndicatorsVisible(state.swatchContrastIndicators)) {
      params.set('si', '0');
    } else if (!areAllIndicatorsVisible(state.swatchContrastIndicators)) {
      params.set('si', encodeIndicators(state.swatchContrastIndicators));
    }
  } else if (
    state.showSwatchContrastIndicators !== undefined &&
    !state.showSwatchContrastIndicators
  ) {
    // Backward-compatible fallback for pre-checklist state
    params.set('si', '0');
  }
  if (state.contrastAlgorithm && state.contrastAlgorithm !== 'WCAG')
    params.set('ca', state.contrastAlgorithm);
  if (
    state.oklchDisplaySignificantDigits !== undefined &&
    state.oklchDisplaySignificantDigits !== 4
  )
    params.set('os', state.oklchDisplaySignificantDigits.toString());
  const sanitizedConstraints = sanitizeConstraints(state.constraints);
  if (sanitizedConstraints?.length) {
    params.set('ct', encodeJsonState(sanitizedConstraints));
  }
  if (state.solverAdjustmentSnapshot) {
    params.set('sa', encodeJsonState(state.solverAdjustmentSnapshot));
  }
  if (state.constraintSolverSummary) {
    params.set('cs', encodeJsonState(state.constraintSolverSummary));
  }

  return params.toString();
}

/**
 * Decodes URL search parameters into color state
 */
export function decodeStateFromUrl(searchParams: URLSearchParams): UrlColorState {
  const state: UrlColorState = {};

  const baseColor = searchParams.get('c');
  if (baseColor) state.baseColor = `#${baseColor}`;

  const gs = searchParams.get('gs');
  const isValidGamut = gs && VALID_GAMUT_SPACES.includes(gs as GamutSpace);
  const decodedGamut: GamutSpace = isValidGamut ? (gs as GamutSpace) : 'srgb';
  if (isValidGamut) {
    state.gamutSpace = decodedGamut;
  }

  const warmth = searchParams.get('w');
  if (warmth) {
    const parsed = parseFloat(warmth);
    // Tighter bounds: warmth typically ranges from -20 to +20
    if (!isNaN(parsed) && isFinite(parsed) && parsed >= -20 && parsed <= 20) {
      state.warmth = parsed;
    }
  }

  const chromaMultiplier = searchParams.get('cm');
  if (chromaMultiplier) {
    const parsed = parseFloat(chromaMultiplier);
    const { min, max } = getChromaMultiplierBounds(decodedGamut);
    if (!isNaN(parsed) && isFinite(parsed)) {
      state.chromaMultiplier = Math.max(min, Math.min(max, parsed));
    }
  }

  const numColors = searchParams.get('nc');
  if (numColors) {
    const parsed = parseInt(numColors);
    if (!isNaN(parsed) && isFinite(parsed) && parsed > 0 && parsed <= 100) {
      state.numColors = parsed;
    }
  }

  const numPalettes = searchParams.get('np');
  if (numPalettes) {
    const parsed = parseInt(numPalettes);
    if (!isNaN(parsed) && isFinite(parsed) && parsed > 0 && parsed <= 100) {
      state.numPalettes = parsed;
    }
  }

  // Bezier curve
  const x1 = searchParams.get('x1');
  if (x1) {
    const parsed = parseFloat(x1);
    if (!isNaN(parsed) && isFinite(parsed) && parsed >= 0 && parsed <= 1) {
      state.x1 = parsed;
    }
  }

  const y1 = searchParams.get('y1');
  if (y1) {
    const parsed = parseFloat(y1);
    if (!isNaN(parsed) && isFinite(parsed) && parsed >= 0 && parsed <= 1) {
      state.y1 = parsed;
    }
  }

  const x2 = searchParams.get('x2');
  if (x2) {
    const parsed = parseFloat(x2);
    if (!isNaN(parsed) && isFinite(parsed) && parsed >= 0 && parsed <= 1) {
      state.x2 = parsed;
    }
  }

  const y2 = searchParams.get('y2');
  if (y2) {
    const parsed = parseFloat(y2);
    if (!isNaN(parsed) && isFinite(parsed) && parsed >= 0 && parsed <= 1) {
      state.y2 = parsed;
    }
  }

  // Contrast
  const contrastMode = searchParams.get('m');
  if (contrastMode === 'manual' || contrastMode === 'auto') state.contrastMode = contrastMode;

  const lowStep = searchParams.get('ls');
  if (lowStep) {
    const parsed = parseInt(lowStep);
    if (!isNaN(parsed) && isFinite(parsed) && parsed >= 0 && parsed <= 100) {
      state.lowStep = parsed;
    }
  }

  const highStep = searchParams.get('hs');
  if (highStep) {
    const parsed = parseInt(highStep);
    if (!isNaN(parsed) && isFinite(parsed) && parsed >= 0 && parsed <= 100) {
      state.highStep = parsed;
    }
  }
  const lowReference = searchParams.get('lr');
  if (lowReference) {
    state.lowReference = decodeContrastReference(lowReference) ?? undefined;
  }
  const highReference = searchParams.get('hr');
  if (highReference) {
    state.highReference = decodeContrastReference(highReference) ?? undefined;
  }

  // Decode nudgers with appropriate bounds
  const lightnessNudgers = searchParams.get('ln');
  if (lightnessNudgers) {
    state.lightnessNudgers = parseNudgers(lightnessNudgers, 11, -0.5, 0.5);
  }

  const hueNudgers = searchParams.get('hn');
  if (hueNudgers) {
    state.hueNudgers = parseNudgers(hueNudgers, 11, -180, 180);
  }

  const stepSaturationNudgers = searchParams.get('scn');
  if (stepSaturationNudgers) {
    state.stepSaturationNudgers = parseNudgers(stepSaturationNudgers, 11, -0.035, 0.035);
  }

  const paletteSaturationNudgers = searchParams.get('psn');
  if (paletteSaturationNudgers) {
    state.paletteSaturationNudgers = parseNudgers(paletteSaturationNudgers, 11, -0.03, 0.03);
  }

  const neutralName = searchParams.get('nn');
  if (neutralName) {
    state.customNeutralName = normalizeCustomPaletteName(neutralName);
  }

  const paletteNames = searchParams.get('pn');
  if (paletteNames) {
    state.customPaletteNames = parsePaletteNames(paletteNames, state.numPalettes ?? 11);
  }

  // Theme preference
  const theme = searchParams.get('t');
  if (theme === 'light' || theme === 'dark' || theme === 'auto') state.themePreference = theme;

  // Display settings
  const ds = searchParams.get('ds');
  if (ds && VALID_DISPLAY_SPACES.includes(ds as DisplayColorSpace))
    state.displayColorSpace = ds as DisplayColorSpace;

  const sl = searchParams.get('sl');
  if (sl && VALID_SWATCH_LABELS.includes(sl as SwatchLabels))
    state.swatchLabels = sl as SwatchLabels;

  const gw = searchParams.get('gw');
  if (gw === '0') state.showSwatchGamutWarnings = false;
  if (gw === '1') state.showSwatchGamutWarnings = true;

  const si = searchParams.get('si');
  if (si) {
    const decodedIndicators = decodeIndicators(si);
    if (decodedIndicators) {
      state.swatchContrastIndicators = decodedIndicators;
      state.showSwatchContrastIndicators = Object.values(decodedIndicators).some(Boolean);
    }
  }

  const ca = searchParams.get('ca');
  if (ca && VALID_CONTRAST_ALGOS.includes(ca as ContrastAlgorithm))
    state.contrastAlgorithm = ca as ContrastAlgorithm;

  const os = searchParams.get('os');
  if (os) {
    const parsed = parseInt(os);
    if (VALID_OKLCH_SIG_DIGITS.includes(parsed as OklchDisplaySignificantDigits)) {
      state.oklchDisplaySignificantDigits = parsed as OklchDisplaySignificantDigits;
    }
  }
  const constraints = searchParams.get('ct');
  if (constraints) {
    state.constraints = sanitizeConstraints(decodeJsonState<Constraint[]>(constraints));
  }
  const solverAdjustmentSnapshot = searchParams.get('sa');
  if (solverAdjustmentSnapshot) {
    state.solverAdjustmentSnapshot = decodeJsonState(solverAdjustmentSnapshot) ?? undefined;
  }
  const constraintSolverSummary = searchParams.get('cs');
  if (constraintSolverSummary) {
    state.constraintSolverSummary = decodeJsonState(constraintSolverSummary) ?? undefined;
  }

  const effectiveDisplaySpace = state.displayColorSpace ?? 'hex';
  if (state.gamutSpace && state.gamutSpace !== 'srgb' && effectiveDisplaySpace === 'hex') {
    state.gamutSpace = 'srgb';
  }

  return state;
}

/**
 * Parses nudger string format "0:0.1,5:-0.05" into array
 * @param nudgerStr - The string to parse
 * @param length - Expected array length
 * @param minBound - Minimum valid value (inclusive)
 * @param maxBound - Maximum valid value (inclusive)
 */
function parseNudgers(
  nudgerStr: string,
  length: number,
  minBound: number,
  maxBound: number
): number[] {
  const result = new Array(length).fill(0);
  nudgerStr.split(',').forEach((pair) => {
    const [indexStr, valueStr] = pair.split(':');
    const index = parseInt(indexStr);
    const value = parseFloat(valueStr);
    // Validate index bounds and value range
    if (
      !isNaN(index) &&
      !isNaN(value) &&
      isFinite(value) &&
      index >= 0 &&
      index < length &&
      value >= minBound &&
      value <= maxBound
    ) {
      result[index] = value;
    }
  });
  return result;
}

function parsePaletteNames(value: string, length: number): string[] | undefined {
  const result = new Array(length).fill('');

  value.split(',').forEach((pair) => {
    const delimiterIndex = pair.indexOf(':');
    if (delimiterIndex === -1) {
      return;
    }

    const index = parseInt(pair.slice(0, delimiterIndex), 10);
    if (Number.isNaN(index) || index < 0 || index >= length) {
      return;
    }

    try {
      const decodedValue = decodeNameToken(pair.slice(delimiterIndex + 1));
      result[index] = normalizeCustomPaletteName(decodedValue) ?? '';
    } catch {
      result[index] = '';
    }
  });

  return normalizeCustomPaletteNames(result, length);
}

function encodeNameToken(value: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'utf8').toString('base64url');
  }

  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeNameToken(value: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'base64url').toString('utf8');
  }

  const padded = value + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Updates the browser URL without triggering navigation
 */
export function updateBrowserUrl(state: UrlColorState): void {
  const queryString = encodeStateToUrl(state);
  const newUrl = queryString ? `?${queryString}` : window.location.pathname;

  // Keep the URL in sync without triggering a navigation.
  window.history.replaceState(window.history.state ?? {}, '', newUrl);
}

/**
 * Gets the current URL state from browser location
 */
export function getUrlState(): UrlColorState {
  if (typeof window === 'undefined') return {};
  return decodeStateFromUrl(new URLSearchParams(window.location.search));
}
