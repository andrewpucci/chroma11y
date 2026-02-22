/**
 * Color utility functions for OKLCH color generation
 */

import Color from 'colorjs.io';
import { colornames as shortColorNames } from 'color-name-list/short';
import easing from 'bezier-easing';
import { announce } from '$lib/announce';
import type { DisplayColorSpace, GamutSpace, ContrastAlgorithm } from '$lib/types';

// Re-export Color so consumers can use it as the OKLCH type
export type { default as ColorType } from 'colorjs.io';

// ===== COLOR.JS HELPERS =====

/** Create an OKLCH Color object */
function oklchColor(l: number, c: number, h: number): Color {
  return new Color('oklch', [l, c, h]);
}

/** Gamut-map a Color to sRGB and return as hex string (always 6 characters) */
function toHex(color: Color): string {
  try {
    const hex = toGamut(color).to('srgb').toString({ format: 'hex' });
    // Expand shortened hex codes (#fff -> #ffffff)
    if (hex.length === 4 && hex[0] === '#') {
      return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    return hex;
  } catch {
    return '#000000';
  }
}

/**
 * Gamut-map a Color to sRGB, returning a new Color.
 * Uses the CSS Color 4 gamut mapping algorithm with tighter black/white
 * clamping thresholds so near-black/near-white colors snap cleanly.
 */
function toGamut(color: Color): Color {
  return color.clone().toGamut({
    space: 'srgb',
    blackWhiteClamp: { channel: 'oklch.l', min: 0.0001, max: 0.9999 }
  });
}

/** Parse any CSS color string into a Color object */
function parseColor(input: string): Color | null {
  try {
    return new Color(input);
  } catch {
    return null;
  }
}

/** Parse a color string and convert to OKLCH */
function toOklch(input: string): Color | null {
  const c = parseColor(input);
  return c ? c.to('oklch') : null;
}

/** Generate n evenly-spaced samples in [0, 1] */
function samples(n: number): number[] {
  if (n <= 1) return [0.5];
  return Array.from({ length: n }, (_, i) => i / (n - 1));
}

// ===== CONSTANTS =====

/** Minimum WCAG AA contrast ratio for text */
export const MIN_CONTRAST_RATIO = 4.5;

/** Target contrast ratio for dark mode start color */
const DARK_MODE_TARGET_CONTRAST = 18;

/** Maximum contrast ratio (white on black or vice versa) */
const MAX_CONTRAST_RATIO = 21;

/** Warmth adjustment constants for OKLCH */
export const WARMTH_CONFIG = {
  /** Hue for warm colors (orange/yellow) */
  WARM_HUE: 60,
  /** Hue for cool colors (blue) */
  COOL_HUE: 250,
  /** Maximum chroma to add for warmth effect */
  MAX_CHROMA: 0.03,
  /** Warmth multiplier (scales warmth input to chroma) */
  CHROMA_SCALE: 0.0006
} as const;

/** Lightness nudger bounds */
export const LIGHTNESS_NUDGER_BOUNDS = {
  MIN: -0.5,
  MAX: 0.5
} as const;

/** Hue nudger bounds */
export const HUE_NUDGER_BOUNDS = {
  MIN: -180,
  MAX: 180
} as const;

// ===== VALIDATION FUNCTIONS =====

/** Regex pattern for validating hex colors - supports #RGB, #RRGGBB formats */
export const HEX_COLOR_PATTERN = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

/**
 * Validates if a string is a valid hex color (#RGB or #RRGGBB format)
 * @param color - The color string to validate
 * @returns true if valid hex color, false otherwise
 */
export function isValidHexColor(color: string): boolean {
  return HEX_COLOR_PATTERN.test(color);
}

// ===== UTILITY FUNCTIONS =====

export function copyToClipboard(text: string): void {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      announce(`Copied ${text} to clipboard`);
    })
    .catch(() => {
      announce('Failed to copy to clipboard');
    });
}

// ===== INTERFACES =====

/**
 * Interface for color generation parameters
 */
export interface ColorGenParams {
  numColors: number;
  numPalettes: number;
  baseColor: string;
  warmth: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  chromaMultiplier: number;
  currentTheme: 'light' | 'dark';
  lightnessNudgers?: number[];
  hueNudgers?: number[];
  gamutSpace?: GamutSpace;
}

// ===== COLOR NAMING =====

/** Map from hex values to human-friendly color names */
const hexToNameMap = new Map<string, string>(
  shortColorNames.map(({ name, hex }) => [hex.toLowerCase(), name])
);

/** Pre-parsed Color objects for the short color name list (for nearest-color matching) */
const shortColorEntries: { hex: string; color: Color }[] = shortColorNames
  .map(({ hex }) => {
    try {
      return { hex: hex.toLowerCase(), color: new Color(hex) };
    } catch {
      return null;
    }
  })
  .filter((e): e is { hex: string; color: Color } => e !== null);

/**
 * FIFO cache for nearest color name lookups to avoid repeated O(n) scans.
 *
 * Note: Cache eviction (NEAREST_COLOR_CACHE_MAX) is not unit tested because
 * filling 256+ entries requires 256+ CIEDE2000 calculations, which times out
 * on CI (~7s). The eviction logic is simple (delete first key when full) and
 * is covered by manual verification. See colorUtils.spec.ts for cache tests.
 */
const nearestColorCache = new Map<string, string>();
const NEAREST_COLOR_CACHE_MAX = 256;

/** Clears the nearest color name cache (useful in tests to avoid stale entries) */
export function clearNearestColorCache(): void {
  nearestColorCache.clear();
}

/**
 * Returns the nearest human-friendly color name for a given hex color
 * Uses CIEDE2000 color difference via color.js, with memoization
 */
export function nearestFriendlyColorName(hex: string): string {
  const key = hex.toLowerCase();
  const cached = nearestColorCache.get(key);
  if (cached !== undefined) return cached;

  const target = parseColor(hex);
  if (!target) return 'Unnamed';

  let bestHex = '';
  let bestDelta = Infinity;

  for (const entry of shortColorEntries) {
    const delta = target.deltaE2000(entry.color);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestHex = entry.hex;
    }
  }

  const name = hexToNameMap.get(bestHex) ?? 'Unnamed';

  // Evict oldest entries when cache is full
  if (nearestColorCache.size >= NEAREST_COLOR_CACHE_MAX) {
    const firstKey = nearestColorCache.keys().next().value;
    if (firstKey !== undefined) nearestColorCache.delete(firstKey);
  }
  nearestColorCache.set(key, name);

  return name;
}

// ===== DARK MODE CALCULATION =====

/**
 * Calculates the optimal starting color for dark mode to achieve ~18:1 contrast with target color
 * @param targetColor - The color to contrast against (defaults to white)
 * @returns Hex color string for the dark mode starting color
 */
function calculateDarkModeStartColor(targetColor: string = '#ffffff'): string {
  const targetContrast = DARK_MODE_TARGET_CONTRAST;
  const target = new Color(targetColor);

  // Binary search to find a color that gives ~18:1 contrast with white
  let minL = 0;
  let maxL = 0.5;
  let bestL = 0;
  let bestContrast = MAX_CONTRAST_RATIO;

  for (let i = 0; i < 30; i++) {
    const testL = (minL + maxL) / 2;
    const testColor = oklchColor(testL, 0, 0);
    const contrast = Color.contrast(testColor, target, 'WCAG21');

    if (Math.abs(contrast - targetContrast) < Math.abs(bestContrast - targetContrast)) {
      bestL = testL;
      bestContrast = contrast;
    }

    if (contrast > targetContrast) {
      minL = testL;
    } else {
      maxL = testL;
    }
  }

  return toHex(oklchColor(bestL, 0, 0));
}

// ===== CONTRAST FUNCTIONS =====

/**
 * Calculates the contrast ratio between two colors using WCAG 2.1 formula
 * @param color1 - First color (hex string)
 * @param color2 - Second color (hex string)
 * @returns Contrast ratio between 1 and 21
 */
export function getContrast(color1: string, color2: string): number {
  try {
    return Color.contrast(new Color(color1), new Color(color2), 'WCAG21');
  } catch {
    return 1;
  }
}

/**
 * Formats a contrast ratio to a readable number with 2 decimal places
 */
export function getPrintableContrast(color1: string, color2: string): number {
  return Math.trunc(100 * getContrast(color1, color2)) / 100;
}

// ===== NEUTRAL GENERATION =====

/**
 * Generates base neutral colors WITHOUT nudgers applied
 */
export function generateBaseNeutrals(params: ColorGenParams): Color[] {
  // Determine the starting and ending colors for neutral generation
  const startColorHex =
    params.currentTheme === 'dark' ? calculateDarkModeStartColor('#ffffff') : '#ffffff';

  const endColorHex = params.currentTheme === 'dark' ? '#ffffff' : '#000000';

  const startColor = new Color(startColorHex).to('oklch');
  const endColor = new Color(endColorHex).to('oklch');

  // Create bezier easing function
  const bezierEasingFn = easing(params.x1, params.y1, params.x2, params.y2);

  // Create initial color samples using bezier easing
  const range = Color.range(startColor, endColor, { space: 'oklch' });
  const initialSamples = samples(params.numColors).map((t) => {
    const easedT = bezierEasingFn(t);
    return range(easedT);
  });

  // Process each sample to create neutral colors with warmth applied directly in OKLCH
  const baseNeutrals: Color[] = initialSamples.map((sample) => {
    const baseWarmthChroma = Math.abs(params.warmth) * WARMTH_CONFIG.CHROMA_SCALE;
    const scaledChroma = baseWarmthChroma * params.chromaMultiplier;
    const clampedChroma = Math.min(scaledChroma, WARMTH_CONFIG.MAX_CHROMA);
    const warmthHue = params.warmth >= 0 ? WARMTH_CONFIG.WARM_HUE : WARMTH_CONFIG.COOL_HUE;

    return oklchColor(sample.oklch.l ?? 0, clampedChroma, warmthHue);
  });

  return baseNeutrals;
}

// ===== GAMUT BOUNDARY HELPERS =====

/** Resolve a GamutSpace value to the colorjs.io space id */
function resolveGamutSpaceId(gamut?: GamutSpace): string {
  switch (gamut) {
    case 'p3':
      return 'p3';
    case 'rec2020':
      return 'rec2020';
    default:
      return 'srgb';
  }
}

/**
 * Finds the maximum OKLCH chroma at a given lightness and hue that stays within the target gamut.
 * Uses binary search over chroma with colorjs.io's inGamut() check.
 * @param l - OKLCH lightness (0–1)
 * @param h - OKLCH hue (0–360)
 * @param gamut - Target gamut space (defaults to sRGB)
 * @returns Maximum chroma value that is in-gamut
 */
export function maxChromaInGamut(l: number, h: number, gamut: GamutSpace = 'srgb'): number {
  // Extremes have zero chroma
  if (l <= 0.0001 || l >= 0.9999) return 0;

  const spaceId = resolveGamutSpaceId(gamut);
  let lo = 0;
  let hi = 0.4; // OKLCH chroma rarely exceeds 0.4

  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const test = oklchColor(l, mid, h);
    if (test.inGamut(spaceId)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return lo;
}

// ===== PALETTE GENERATION =====

/**
 * Generates a single color palette based on base neutrals and a hue-shifted base color.
 * Uses gamut-boundary-relative chroma so that every hue uses the same proportion
 * of its available gamut, producing visually even saturation across palettes.
 */
function generatePalette(
  baseNeutrals: Color[],
  baseColor: Color,
  chromaMultiplier: number,
  referenceHue: number,
  gamut: GamutSpace = 'srgb'
): Color[] {
  const baseChroma = (baseColor.oklch.c || 0) * chromaMultiplier;
  const paletteHue = baseColor.oklch.h ?? 0;

  return baseNeutrals.map((neutralColor) => {
    const l = neutralColor.oklch.l ?? 0;
    // Preserve pure black/white endpoints — don't apply chroma to extremes
    if (l >= 0.9999 || l <= 0.0001) return oklchColor(l, 0, paletteHue);

    // Compute the gamut boundary for the reference hue and this palette's hue
    const refMaxC = maxChromaInGamut(l, referenceHue, gamut);
    const hueMaxC = maxChromaInGamut(l, paletteHue, gamut);

    // Scale chroma proportionally: if the base chroma is X% of the reference
    // hue's boundary, apply the same X% to this hue's boundary
    let c: number;
    if (refMaxC > 1e-6) {
      const ratio = baseChroma / refMaxC;
      c = ratio * hueMaxC;
    } else {
      c = baseChroma;
    }

    return oklchColor(l, c, paletteHue);
  });
}

/**
 * Applies lightness nudgers to neutrals and palettes after all other calculations
 * This is the FINAL step in the algorithm
 */
function applyLightnessNudgers(
  neutrals: Color[],
  palettes: Color[][],
  lightnessNudgers: number[]
): { neutrals: Color[]; palettes: Color[][] } {
  const updatedNeutrals = neutrals.map((color, index) => {
    const nudger = lightnessNudgers[index] || 0;
    const c = color.clone();
    c.oklch.l = (c.oklch.l ?? 0) + nudger;
    return c;
  });

  const updatedPalettes = palettes.map((palette) => {
    return palette.map((color, index) => {
      const nudger = lightnessNudgers[index] || 0;
      const c = color.clone();
      c.oklch.l = (c.oklch.l ?? 0) + nudger;
      return c;
    });
  });

  return { neutrals: updatedNeutrals, palettes: updatedPalettes };
}

/**
 * Generates multiple color palettes
 * Returns Color objects; hex conversion is handled by the store layer
 */
export function generatePalettes(params: ColorGenParams): {
  neutrals: Color[];
  palettes: Color[][];
} {
  // Generate base neutrals WITHOUT nudgers
  const baseNeutrals = generateBaseNeutrals(params);

  // Parse and validate base color
  const baseColor = toOklch(params.baseColor);
  if (!baseColor || isNaN(baseColor.oklch.c ?? 0)) {
    throw new Error('Invalid base color: could not parse or invalid chroma value');
  }
  // Achromatic colors (e.g. grays) have NaN hue in colorjs.io — default to 0
  const baseH = baseColor.oklch.h;
  if (baseH == null || isNaN(baseH)) baseColor.oklch.h = 0;

  // The reference hue is the base color's hue — all palettes scale relative to it
  const referenceHue = baseColor.oklch.h ?? 0;
  const gamut = params.gamutSpace ?? 'srgb';

  // Generate palettes with hue variations using BASE neutrals (without nudgers)
  const palettes: Color[][] = Array.from({ length: params.numPalettes }, (_, i) => {
    const hueNudger = params.hueNudgers?.[i] || 0;
    const hueOffset = (360 / params.numPalettes) * i + hueNudger;
    const tempColor = baseColor.clone();
    tempColor.oklch.h = ((baseColor.oklch.h ?? 0) + hueOffset) % 360;
    return generatePalette(baseNeutrals, tempColor, params.chromaMultiplier, referenceHue, gamut);
  });

  // Apply lightness nudgers as the FINAL step
  const lightnessNudgers = params.lightnessNudgers || [];
  const { neutrals: neutralsWithNudgers, palettes: palettesWithNudgers } = applyLightnessNudgers(
    baseNeutrals,
    palettes,
    lightnessNudgers
  );

  return {
    neutrals: neutralsWithNudgers,
    palettes: palettesWithNudgers
  };
}

// ===== OKLCH-BASED CONVERSION HELPERS =====

/**
 * Gamut-maps any Color object to sRGB and returns a hex string.
 * Accepts colors in any color space (OKLCH, sRGB, etc.).
 */
export function colorToCssHex(color: Color): string {
  try {
    return toHex(color);
  } catch {
    return '#000000';
  }
}

/**
 * Gamut-maps any Color object to sRGB and returns a CSS rgb() string (CSS Color 4 syntax).
 * e.g. "rgb(20.97% 40.548% 87.236%)"
 */
export function colorToCssRgb(color: Color): string {
  try {
    return toGamut(color).to('srgb').toString();
  } catch {
    return 'rgb(0% 0% 0%)';
  }
}

/**
 * Gamut-maps any Color object to Display P3 and returns a CSS color() string.
 * e.g. "color(display-p3 0.097 0.384 0.901)"
 */
export function colorToCssP3(color: Color): string {
  try {
    const p3 = color.clone().toGamut({ space: 'p3' }).to('p3');
    const [r, g, b] = p3.coords.map((v) => parseFloat((v ?? 0).toFixed(6)));
    return `color(display-p3 ${r} ${g} ${b})`;
  } catch {
    return 'color(display-p3 0 0 0)';
  }
}

/**
 * Gamut-maps any Color object to Rec. 2020 and returns a CSS color() string.
 * e.g. "color(rec2020 0.169 0.353 0.872)"
 */
export function colorToCssRec2020(color: Color): string {
  try {
    const rec = color.clone().toGamut({ space: 'rec2020' }).to('rec2020');
    const [r, g, b] = rec.coords.map((v) => parseFloat((v ?? 0).toFixed(6)));
    return `color(rec2020 ${r} ${g} ${b})`;
  } catch {
    return 'color(rec2020 0 0 0)';
  }
}

/**
 * Converts any Color object to a CSS oklch() string (CSS Color 4 syntax).
 * e.g. "oklch(55% 0.19 264)"
 *
 * Values are rounded to 2 decimal places for readability on swatches.
 * Full precision is available in the color info drawer and exports.
 */
export function colorToCssOklch(color: Color, gamut: GamutSpace = 'srgb'): string {
  try {
    // Sanitize NaN hue before gamut mapping (achromatic colors have NaN hue in colorjs.io)
    const clone = color.clone();
    const rawH = clone.oklch.h;
    if (rawH == null || isNaN(rawH)) clone.oklch.h = 0;
    // Gamut-map to the target space first so the OKLCH values represent the actual
    // rendered color, avoiding browser-induced hue shifts for out-of-gamut colors
    const gamutSpace = gamut === 'rec2020' ? 'rec2020' : gamut === 'p3' ? 'p3' : 'srgb';
    const mapped = clone.toGamut({
      space: gamutSpace,
      blackWhiteClamp: { channel: 'oklch.l', min: 0.0001, max: 0.9999 }
    });
    const oklch = mapped.to('oklch');
    const l = oklch.oklch.l ?? 0;
    const c = oklch.oklch.c ?? 0;
    const h = oklch.oklch.h;
    const safeH = h == null || isNaN(h) ? 0 : h;
    // Round to 2 decimal places for readability; snap near-zero values to 0
    const lPct = parseFloat((l * 100).toFixed(2));
    const cRound = c < 1e-6 ? 0 : parseFloat(c.toFixed(2));
    const hRound = parseFloat(safeH.toFixed(2));
    return `oklch(${lPct}% ${cRound} ${hRound})`;
  } catch {
    return 'oklch(0% 0 0)';
  }
}

/**
 * Gamut-maps any Color object to sRGB and returns a CSS hsl() string (CSS Color 4 syntax).
 * e.g. "hsl(222.27 72.189% 54.103%)"
 */
export function colorToCssHsl(color: Color): string {
  try {
    const hslColor = toGamut(color).to('hsl');
    // Sanitize null/NaN hue and saturation (achromatic colors serialize as "none" otherwise)
    const h = hslColor.hsl.h;
    if (h == null || isNaN(h)) hslColor.hsl.h = 0;
    const s = hslColor.hsl.s;
    if (s == null || isNaN(s)) hslColor.hsl.s = 0;
    return hslColor.toString();
  } catch {
    return 'hsl(0 0% 0%)';
  }
}

/**
 * Formats a Color object as a CSS string in the given display color space and gamut.
 * This is the main dispatcher used by derived stores and components.
 *
 * Note: hex, rgb, and hsl formats are sRGB-only. When a wider gamut (P3 / Rec. 2020)
 * is selected, those formats fall back to the gamut's native `color()` syntax
 * (e.g. `color(display-p3 …)`) because hex/rgb/hsl cannot represent out-of-sRGB values.
 * OKLCH is gamut-independent and always returns `oklch(…)` after gamut-mapping.
 */
export function colorToCssDisplay(
  color: Color,
  space: DisplayColorSpace,
  gamut: GamutSpace
): string {
  switch (space) {
    case 'oklch':
      return colorToCssOklch(color, gamut);
    case 'hex':
      switch (gamut) {
        case 'p3':
          return colorToCssP3(color);
        case 'rec2020':
          return colorToCssRec2020(color);
        default:
          return colorToCssHex(color);
      }
    case 'rgb':
      switch (gamut) {
        case 'p3':
          return colorToCssP3(color);
        case 'rec2020':
          return colorToCssRec2020(color);
        default:
          return colorToCssRgb(color);
      }
    case 'hsl':
      switch (gamut) {
        case 'p3':
          return colorToCssP3(color);
        case 'rec2020':
          return colorToCssRec2020(color);
        default:
          return colorToCssHsl(color);
      }
    default:
      return colorToCssHex(color);
  }
}

// ===== CONTRAST ALGORITHM HELPERS =====

/** Minimum APCA Lc value for body text (approximate threshold) */
export const MIN_APCA_LC_BODY = 60;

/** Minimum APCA Lc value for large text (approximate threshold) */
export const MIN_APCA_LC_LARGE = 45;

/**
 * Calculates the APCA contrast (Lc value) between a text color and a background color.
 * APCA is asymmetric: the order of arguments matters (text on background).
 * Returns the absolute Lc value (always positive).
 * @param textColor - Foreground/text color (hex string)
 * @param bgColor - Background color (hex string)
 * @returns Absolute Lc value (0–106)
 */
export function getContrastAPCA(textColor: string, bgColor: string): number {
  try {
    const lc = Color.contrast(new Color(textColor), new Color(bgColor), 'APCA');
    return Math.abs(lc);
  } catch {
    return 0;
  }
}

/**
 * Formats an APCA Lc value to a readable number with 1 decimal place
 */
export function getPrintableContrastAPCA(textColor: string, bgColor: string): number {
  return Math.round(getContrastAPCA(textColor, bgColor) * 10) / 10;
}

/**
 * Unified contrast function that dispatches to the correct algorithm.
 * Callers pass (bgColor, fgColor) — the background color first, then the foreground/text color.
 * WCAG 2.1 is symmetric so order doesn't matter; APCA is asymmetric and
 * requires (textColor, bgColor), so this function swaps internally for APCA.
 */
export function getContrastForAlgorithm(
  bgColor: string,
  fgColor: string,
  algorithm: ContrastAlgorithm
): number {
  return algorithm === 'APCA' ? getContrastAPCA(fgColor, bgColor) : getContrast(fgColor, bgColor);
}

/**
 * Formats a contrast value for display based on the selected algorithm.
 * Callers pass (bgColor, fgColor) — same convention as getContrastForAlgorithm.
 * Returns a rounded number suitable for UI display.
 */
export function getPrintableContrastForAlgorithm(
  bgColor: string,
  fgColor: string,
  algorithm: ContrastAlgorithm
): number {
  return algorithm === 'APCA'
    ? getPrintableContrastAPCA(fgColor, bgColor)
    : getPrintableContrast(fgColor, bgColor);
}

/**
 * Gets a name for the palette based on its middle color.
 * @param palette - The palette to name
 * @param lowStepIndex - The index of the color to use as the contrast reference
 * @returns The name of the nearest named color
 *
 * Note: The outer try/catch (lines 792-794) is defensive error handling for
 * unexpected failures in the color naming pipeline. This is difficult to trigger
 * in unit tests since all internal operations have their own error handling.
 * The function is well-tested for all normal code paths and edge cases.
 */
export function getPaletteName(palette: string[], lowStepIndex: number | string = 0): string {
  if (!palette?.length) return 'Unnamed';

  try {
    let referenceColorRaw =
      typeof lowStepIndex === 'string'
        ? lowStepIndex
        : (palette[Math.max(0, Math.min(palette.length - 1, lowStepIndex))] ?? palette[0]);

    if (
      typeof lowStepIndex === 'number' &&
      (!referenceColorRaw || !isValidHexColor(referenceColorRaw))
    ) {
      referenceColorRaw = palette[0];
    }

    // Validate that we have a valid hex color
    if (
      !referenceColorRaw ||
      typeof referenceColorRaw !== 'string' ||
      !isValidHexColor(referenceColorRaw)
    ) {
      console.warn('Invalid color in palette for naming:', referenceColorRaw);
      return 'Unnamed';
    }

    const normalizeHexColor = (value: string): string | null => {
      try {
        return new Color(value).to('srgb').toString({ format: 'hex' });
      } catch {
        return null;
      }
    };

    const lowContrastColor = normalizeHexColor(referenceColorRaw) ?? referenceColorRaw;

    const getOklchChroma = (hex: string): number | null => {
      try {
        const color = new Color(hex).to('oklch');
        const chroma = color.oklch.c;
        return typeof chroma === 'number' && isFinite(chroma) ? chroma : null;
      } catch {
        return null;
      }
    };

    const normalizedPalette = palette
      .filter((value): value is string => typeof value === 'string' && isValidHexColor(value))
      .map((c) => normalizeHexColor(c) ?? c);

    const candidates = normalizedPalette.filter((c) => c !== lowContrastColor);
    const nonExtremeCandidates = candidates.filter(
      (c) => c !== '#ffffff' && c !== '#000000' && c !== '#fff' && c !== '#000'
    );
    const basePool = nonExtremeCandidates.length > 0 ? nonExtremeCandidates : candidates;

    const chromaticCandidates = basePool.filter((c) => {
      const chroma = getOklchChroma(c);
      return chroma !== null && chroma > 0.02;
    });

    const selectionPool = chromaticCandidates.length > 0 ? chromaticCandidates : basePool;

    const bestMatch = selectionPool.reduce<{
      color: string;
      distance: number;
    } | null>((best, candidate) => {
      const contrast = getContrast(lowContrastColor, candidate);
      const distance = Math.abs(contrast - MIN_CONTRAST_RATIO);

      if (!best || distance < best.distance) {
        return { color: candidate, distance };
      }
      return best;
    }, null);

    const colorToName = bestMatch?.color ?? lowContrastColor;

    const isExtremeName = (name: string): boolean => {
      const normalized = name.trim().toLowerCase();
      return normalized === 'white' || normalized === 'black';
    };

    let chosenName = nearestFriendlyColorName(colorToName);

    if (isExtremeName(chosenName) && selectionPool.length > 0) {
      const altCandidate = selectionPool
        .map((candidate) => ({
          candidate,
          distance: Math.abs(getContrast(lowContrastColor, candidate) - MIN_CONTRAST_RATIO)
        }))
        .sort((a, b) => a.distance - b.distance)
        .find(({ candidate }) => {
          const altName = nearestFriendlyColorName(candidate);
          return altName !== 'Unnamed' && !isExtremeName(altName);
        });

      if (altCandidate) {
        chosenName = nearestFriendlyColorName(altCandidate.candidate);
      }
    }

    return chosenName;
  } catch (error) {
    console.error('Error getting palette name:', error);
    return 'Unnamed';
  }
}
