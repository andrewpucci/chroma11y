/**
 * URL State Persistence Utilities
 * Encodes and decodes Chroma11y state to/from URL parameters
 */

export interface UrlColorState {
  baseColor?: string;
  warmth?: number;
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
  lightnessNudgers?: number[];
  hueNudgers?: number[];
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

  // Theme and contrast
  if (state.theme) params.set('t', state.theme);
  if (state.contrastMode) params.set('m', state.contrastMode);
  if (state.lowStep !== undefined) params.set('ls', state.lowStep.toString());
  if (state.highStep !== undefined) params.set('hs', state.highStep.toString());

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

  return params.toString();
}

/**
 * Decodes URL search parameters into color state
 */
export function decodeStateFromUrl(searchParams: URLSearchParams): UrlColorState {
  const state: UrlColorState = {};

  const baseColor = searchParams.get('c');
  if (baseColor) state.baseColor = `#${baseColor}`;

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
    // Tighter bounds: chroma multiplier typically ranges from 0.1 to 2.0
    if (!isNaN(parsed) && isFinite(parsed) && parsed >= 0.1 && parsed <= 2.0) {
      state.chromaMultiplier = parsed;
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

  // Theme and contrast
  const theme = searchParams.get('t');
  if (theme === 'dark' || theme === 'light') state.theme = theme;

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

  // Decode nudgers with appropriate bounds
  const lightnessNudgers = searchParams.get('ln');
  if (lightnessNudgers) {
    state.lightnessNudgers = parseNudgers(lightnessNudgers, 11, -0.5, 0.5);
  }

  const hueNudgers = searchParams.get('hn');
  if (hueNudgers) {
    state.hueNudgers = parseNudgers(hueNudgers, 11, -180, 180);
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

/**
 * Updates the browser URL without triggering navigation
 */
export function updateBrowserUrl(state: UrlColorState): void {
  const queryString = encodeStateToUrl(state);
  const newUrl = queryString ? `?${queryString}` : window.location.pathname;

  // Use replaceState to avoid polluting browser history
  window.history.replaceState({}, '', newUrl);
}

/**
 * Gets the current URL state from browser location
 */
export function getUrlState(): UrlColorState {
  if (typeof window === 'undefined') return {};
  return decodeStateFromUrl(new URLSearchParams(window.location.search));
}
