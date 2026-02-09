/**
 * Color utility functions for OKLCH color generation
 */

import {
  oklch,
  formatHex,
  clampChroma,
  samples,
  interpolate,
  wcagContrast,
  colorsNamed,
  differenceCiede2000,
  nearest,
  parse,
  rgb
} from 'culori';
import easing from 'bezier-easing';
import { transpose, mean } from 'mathjs';
import type { Oklch } from 'culori';
import { announce } from '$lib/announce';

// ===== CONSTANTS =====

/** Minimum WCAG AA contrast ratio for text */
export const MIN_CONTRAST_RATIO = 4.5;

/** Target contrast ratio for dark mode start color */
export const DARK_MODE_TARGET_CONTRAST = 18;

/** Maximum contrast ratio (white on black or vice versa) */
export const MAX_CONTRAST_RATIO = 21;

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

/**
 * Validates if a string is a valid 6-digit hex color (#RRGGBB format only)
 * @param color - The color string to validate
 * @returns true if valid 6-digit hex color, false otherwise
 */
export function isValidHex6Color(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
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
}

/**
 * Interface for palette generation parameters (alias for backward compatibility)
 */
export interface PaletteGenParams extends ColorGenParams {
  contrastLow?: string;
  contrastHigh?: string;
}

// ===== COLOR NAMING =====

/**
 * Finds the nearest named color using CIEDE2000 color difference formula
 */
export const nearestNamedColors = nearest(Object.keys(colorsNamed), differenceCiede2000());

// ===== DARK MODE CALCULATION =====

/**
 * Calculates the optimal starting color for dark mode to achieve ~18:1 contrast with target color
 * @param targetColor - The color to contrast against (defaults to white)
 * @returns Hex color string for the dark mode starting color
 */
function calculateDarkModeStartColor(targetColor: string = '#ffffff'): string {
  const targetContrast = DARK_MODE_TARGET_CONTRAST;

  // Binary search to find a color that gives ~18:1 contrast with white
  let minL = 0;
  let maxL = 0.5; // Expand search range
  let bestL = 0;
  let bestContrast = MAX_CONTRAST_RATIO;

  // Create a test color to find the right lightness
  for (let i = 0; i < 30; i++) {
    const testL = (minL + maxL) / 2;
    const testColor = { mode: 'oklch' as const, l: testL, c: 0, h: 0 };
    const contrast = wcagContrast(testColor, targetColor);

    // Track the best match
    if (Math.abs(contrast - targetContrast) < Math.abs(bestContrast - targetContrast)) {
      bestL = testL;
      bestContrast = contrast;
    }

    if (contrast > targetContrast) {
      // Too much contrast, need lighter color (higher L)
      minL = testL;
    } else {
      // Too little contrast, need darker color (lower L)
      maxL = testL;
    }
  }

  // Convert to hex for interpolation
  return formatHex({ mode: 'oklch', l: bestL, c: 0, h: 0 }) || '#000000';
}

// ===== CONTRAST FUNCTIONS =====

/** Acceptable color input types for formatColor */
type ColorInput =
  | string
  | { mode: string; l?: number; c?: number; h?: number; r?: number; g?: number; b?: number }
  | null
  | undefined;

/**
 * Formats a color object to a hex string
 * @param color - A color string, OKLCH/RGB object, or null/undefined
 * @returns Hex color string or empty string if invalid
 */
export function formatColor(color: ColorInput): string {
  if (color === null || color === undefined) {
    return '';
  }
  try {
    const result = formatHex(color as Parameters<typeof formatHex>[0]);
    return result || '';
  } catch {
    return '';
  }
}

/**
 * Calculates the contrast ratio between two colors using WCAG 2.1 formula
 * @param color1 - First color (hex string or color object)
 * @param color2 - Second color (hex string or color object)
 * @returns Contrast ratio between 1 and 21
 */
export function getContrast(color1: string, color2: string): number {
  return wcagContrast(color1, color2);
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
export function generateBaseNeutrals(params: ColorGenParams): Oklch[] {
  // Determine the starting and ending colors for neutral generation
  const startColorHex =
    params.currentTheme === 'dark' ? calculateDarkModeStartColor('#ffffff') : '#ffffff'; // Light mode starts with white (step 0 = lightest)

  const endColorHex = params.currentTheme === 'dark' ? '#ffffff' : '#000000'; // Light mode ends with black (step 10 = darkest)

  // Convert hex strings to OKLCH color objects for interpolation
  const startColor = oklch(startColorHex);
  const endColor = oklch(endColorHex);

  // Ensure colors are valid before interpolation
  if (!startColor || !endColor) {
    throw new Error('Failed to parse start or end color for neutral palette');
  }

  // Create bezier easing function
  const bezierEasingFn = easing(params.x1, params.y1, params.x2, params.y2);

  // Create initial color samples using bezier easing with manual index mapping
  const interpolator = interpolate([startColor, endColor], 'oklch');
  const initialSamples = samples(params.numColors).map((t) => {
    // Map the linear sample t to a bezier-eased t
    const easedT = bezierEasingFn(t);
    return interpolator(easedT);
  });

  // Process each sample to create neutral colors with warmth applied directly in OKLCH
  const baseNeutrals: Oklch[] = initialSamples.map((oklchColor) => {
    // Apply warmth adjustment directly in OKLCH color space
    // Warmth > 0 = warm (orange/yellow hue), Warmth < 0 = cool (blue hue)
    // Scale by chromaMultiplier so user can control warmth saturation
    const baseWarmthChroma = Math.abs(params.warmth) * WARMTH_CONFIG.CHROMA_SCALE;
    const scaledChroma = baseWarmthChroma * params.chromaMultiplier;
    const clampedChroma = Math.min(scaledChroma, WARMTH_CONFIG.MAX_CHROMA);

    // Determine hue based on warmth direction
    const warmthHue = params.warmth >= 0 ? WARMTH_CONFIG.WARM_HUE : WARMTH_CONFIG.COOL_HUE;

    const adjustedColor: Oklch = {
      mode: 'oklch' as const,
      l: oklchColor.l,
      c: clampedChroma,
      h: warmthHue
    };

    // Ensure the color is within the OKLCH gamut
    return clampChroma(adjustedColor, 'oklch') as Oklch;
  });

  return baseNeutrals;
}

/**
 * Generates a neutral color palette with lightness nudgers applied
 * Returns hex strings for display
 */
export function generateNeutralPalette(
  params: ColorGenParams,
  lightnessNudgers?: number[]
): string[] {
  const baseNeutrals = generateBaseNeutrals(params);

  // Apply lightness nudgers to create display neutrals
  const neutralsWithNudgers = baseNeutrals.map((color, index) => {
    const lightnessNudger = lightnessNudgers?.[index] || 0;
    return {
      ...color,
      l: color.l + lightnessNudger
    };
  });

  // Convert to hex strings
  return neutralsWithNudgers.map((color, index) => {
    try {
      const clampedColor = clampChroma(color, 'oklch');
      const hex = formatHex(clampedColor);
      if (!hex) {
        console.warn(`Failed to format neutral color at index ${index}, using fallback`);
        return '#000000';
      }
      return hex;
    } catch (error) {
      console.error(`Error converting neutral color at index ${index}:`, error);
      return '#000000';
    }
  });
}

// ===== PALETTE GENERATION =====

/**
 * Generates a single color palette based on base neutrals and a hue-shifted base color
 */
function generatePalette(
  baseNeutrals: Oklch[],
  baseColor: Oklch,
  chromaMultiplier: number
): Oklch[] {
  // Use base color's chroma multiplied by the chroma multiplier
  const targetChroma = (baseColor.c || 0) * chromaMultiplier;

  return baseNeutrals.map((neutralColor) => {
    return clampChroma(
      {
        mode: 'oklch' as const,
        l: neutralColor.l,
        c: targetChroma,
        h: baseColor.h
      },
      'oklch'
    ) as Oklch;
  });
}

/**
 * Applies lightness nudgers to neutrals and palettes after all other calculations
 * This is the FINAL step in the algorithm
 */
function applyLightnessNudgers(
  neutrals: Oklch[],
  palettes: Oklch[][],
  lightnessNudgers: number[]
): { neutrals: Oklch[]; palettes: Oklch[][] } {
  // Apply to neutrals
  const updatedNeutrals = neutrals.map((color, index) => {
    const lightnessNudger = lightnessNudgers[index] || 0;
    return {
      ...color,
      l: color.l + lightnessNudger
    };
  });

  // Apply to palettes
  const updatedPalettes = palettes.map((palette) => {
    return palette.map((color, index) => {
      const lightnessNudger = lightnessNudgers[index] || 0;
      return {
        ...color,
        l: color.l + lightnessNudger
      };
    });
  });

  return { neutrals: updatedNeutrals, palettes: updatedPalettes };
}

/**
 * Normalizes chroma values across palettes for consistent appearance
 * Averages chroma values across all palettes for each color step
 */
function normalizeChromaValuesInternal(palettes: Oklch[][]): number[] {
  // Extract chroma values from all palettes
  const cValues = palettes.map((palette) => palette.map((color) => color.c || 0));

  // Calculate mean chroma for each column
  // chromaMultiplier already applied in generatePalette, so just average
  const normalizedCs = (transpose(cValues) as number[][]).map((column) => {
    const avgChroma = mean(column) || 0;
    return Math.max(0, avgChroma);
  });

  // Apply normalized chroma values back to palettes
  palettes.forEach((palette) => {
    palette.forEach((color, j) => {
      if (normalizedCs[j] !== undefined) {
        color.c = normalizedCs[j];
      }
    });
  });

  return normalizedCs;
}

/**
 * Generates multiple color palettes
 * Returns both OKLCH objects (for internal use) and hex strings (for display)
 */
export function generatePalettes(
  params: ColorGenParams,
  shouldNormalizeChroma: boolean = true
): { neutrals: string[]; palettes: string[][]; normalizedChromaValues: number[] } {
  // Generate base neutrals WITHOUT nudgers
  const baseNeutrals = generateBaseNeutrals(params);

  // Parse and validate base color
  const baseColor = oklch(parse(params.baseColor));
  if (!baseColor || isNaN(baseColor.h || 0) || isNaN(baseColor.c || 0)) {
    throw new Error('Invalid base color: could not parse or invalid hue/chroma values');
  }

  // Generate palettes with hue variations using BASE neutrals (without nudgers)
  const palettes: Oklch[][] = Array.from({ length: params.numPalettes }, (_, i) => {
    const hueNudger = params.hueNudgers?.[i] || 0;
    const hueOffset = (360 / params.numPalettes) * i + hueNudger;
    const tempColor: Oklch = {
      ...baseColor,
      h: ((baseColor.h || 0) + hueOffset) % 360
    };
    return generatePalette(baseNeutrals, tempColor, params.chromaMultiplier);
  });

  // Normalize chroma values if needed
  let normalizedChromaValues: number[] = [];
  if (shouldNormalizeChroma && params.chromaMultiplier > 0) {
    normalizedChromaValues = normalizeChromaValuesInternal(palettes);
  }

  // Apply lightness nudgers as the FINAL step (after chroma normalization)
  const lightnessNudgers = params.lightnessNudgers || [];
  const { neutrals: neutralsWithNudgers, palettes: palettesWithNudgers } = applyLightnessNudgers(
    baseNeutrals,
    palettes,
    lightnessNudgers
  );

  // Convert to hex strings
  const neutralsHex = neutralsWithNudgers.map((color) => {
    try {
      const clampedColor = clampChroma(color, 'oklch');
      return formatHex(clampedColor) || '#000000';
    } catch {
      return '#000000';
    }
  });

  const palettesHex = palettesWithNudgers.map((palette) =>
    palette.map((color) => {
      try {
        const clampedColor = clampChroma(color, 'oklch');
        return formatHex(clampedColor) || '#000000';
      } catch {
        return '#000000';
      }
    })
  );

  return {
    neutrals: neutralsHex,
    palettes: palettesHex,
    normalizedChromaValues
  };
}

/**
 * Generates multiple color palettes (simplified interface)
 * Wrapper around generatePalettes for ease of use
 */
export function generateMultiplePalettes(params: PaletteGenParams): string[][] {
  const result = generatePalettes(params as ColorGenParams, true);
  return result.palettes;
}

/**
 * Converts hex color to RGB object
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalizedHex = hex.startsWith('#') ? hex : `#${hex}`;
  const parsed = parse(normalizedHex);
  if (!parsed) return null;

  const srgb = rgb(parsed);
  if (srgb.r == null || srgb.g == null || srgb.b == null) return null;

  return {
    r: srgb.r,
    g: srgb.g,
    b: srgb.b
  };
}

/**
 * Calculates relative luminance of a color
 */
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Determines if text should be light or dark on a background color
 */
export function getContrastColor(backgroundColor: string): string {
  const luminance = getLuminance(backgroundColor);
  const threshold = 0.5;
  return luminance > threshold ? '#000000' : '#ffffff';
}

/**
 * Gets a name for the palette based on its middle color
 * @param palette - The palette to name
 * @param lowStepIndex - The index of the color to use as the contrast reference
 * @returns The name of the nearest named color
 */
export function getPaletteName(palette: string[], lowStepIndex: number | string = 0): string {
  if (!palette?.length) return 'Unnamed';

  try {
    let referenceColorRaw =
      typeof lowStepIndex === 'string'
        ? lowStepIndex
        : palette[Math.max(0, Math.min(palette.length - 1, lowStepIndex))] ?? palette[0];

    if (typeof lowStepIndex === 'number' && (!referenceColorRaw || !isValidHexColor(referenceColorRaw))) {
      referenceColorRaw = palette[0];
    }

    // Validate that we have a valid hex color
    if (!referenceColorRaw || typeof referenceColorRaw !== 'string' || !isValidHexColor(referenceColorRaw)) {
      console.warn('Invalid color in palette for naming:', referenceColorRaw);
      return 'Unnamed';
    }

    const normalizeHexColor = (value: string): string | null => {
      try {
        const parsed = parse(value);
        return parsed ? formatHex(parsed) : null;
      } catch {
        return null;
      }
    };

    const lowContrastColor = normalizeHexColor(referenceColorRaw) ?? referenceColorRaw;

    const getOklchChroma = (hex: string): number | null => {
      try {
        const color = oklch(hex);
        const chroma = color?.c;
        return typeof chroma === 'number' && isFinite(chroma) ? chroma : null;
      } catch {
        return null;
      }
    };

    const targetContrast = 4.5;

    const normalizedPalette = palette
      .filter((value): value is string => typeof value === 'string' && isValidHexColor(value))
      .map((c) => normalizeHexColor(c) ?? c);

    const candidates = normalizedPalette.filter((c) => c !== lowContrastColor);
    const nonExtremeCandidates = candidates.filter((c) => c !== '#ffffff' && c !== '#000000');
    const basePool = nonExtremeCandidates.length > 0 ? nonExtremeCandidates : candidates;

    const chromaticCandidates = basePool.filter((c) => {
      const chroma = getOklchChroma(c);
      return chroma !== null && chroma > 0.02;
    });

    const selectionPool = chromaticCandidates.length > 0 ? chromaticCandidates : basePool;

    const bestMatch = selectionPool
      .reduce<
        | {
            color: string;
            distance: number;
          }
        | null
      >((best, candidate) => {
        const contrast = getContrast(lowContrastColor, candidate);
        const distance = Math.abs(contrast - targetContrast);

        if (!best || distance < best.distance) {
          return { color: candidate, distance };
        }
        return best;
      }, null);

    const colorToName = bestMatch?.color ?? lowContrastColor;

    // Defensive: ensure nearestNamedColors is available and colorsNamed has entries
    if (!nearestNamedColors || Object.keys(colorsNamed).length === 0) {
      return 'Unnamed';
    }

    const getNearestName = (hex: string): string => {
      const colorNames = nearestNamedColors(hex);
      const colorName = Array.isArray(colorNames) ? colorNames[0] : colorNames;
      return (typeof colorName === 'string' ? colorName : 'Unnamed') || 'Unnamed';
    };

    const isExtremeName = (name: string): boolean => {
      const normalized = name.trim().toLowerCase();
      return normalized === 'white' || normalized === 'black';
    };

    let chosenName = getNearestName(colorToName);

    if (isExtremeName(chosenName) && selectionPool.length > 0) {
      const altCandidate = selectionPool
        .map((candidate) => ({
          candidate,
          distance: Math.abs(getContrast(lowContrastColor, candidate) - targetContrast)
        }))
        .sort((a, b) => a.distance - b.distance)
        .find(({ candidate }) => {
          const altName = getNearestName(candidate);
          return altName !== 'Unnamed' && !isExtremeName(altName);
        });

      if (altCandidate) {
        chosenName = getNearestName(altCandidate.candidate);
      }
    }

    return chosenName;
  } catch (error) {
    console.error('Error getting palette name:', error);
    return 'Unnamed';
  }
}
