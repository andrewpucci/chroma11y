/**
 * Color utility functions for OKLCH color generation
 * Ported from legacy colorUtils.js to match exact algorithm
 */

import { oklch, formatHex, clampChroma, samples, interpolate, wcagContrast, colorsNamed, differenceCiede2000, nearest, parse } from 'culori';
import easing from 'bezier-easing';
import { transpose, mean } from 'mathjs';
import type { Oklch } from 'culori';

// ===== UTILITY FUNCTIONS =====

export function copyToClipboard(text: string): void {
	navigator.clipboard.writeText(text).then(() => {
		console.log(`Copied ${text} to clipboard`);
	});
}

export function updateLightnessNudgerValue(
	index: number, 
	value: number, 
	values: number[], 
	updateFn: (index: number, value: number) => void
): void {
	values[index] = value;
	updateFn(index, value);
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
function calculateDarkModeStartColor(targetColor: string = "#ffffff"): string {
  const targetContrast = 18;
  
  // Binary search to find a color that gives ~18:1 contrast with white
  let minL = 0;
  let maxL = 0.5; // Expand search range
  let bestL = 0;
  let bestContrast = 21;
  
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
      minL = testL; // Too much contrast, need lighter color (higher L)
    } else {
      maxL = testL; // Too little contrast, need darker color (lower L)
    }
  }
  
  // Convert to hex for interpolation
  return formatHex({ mode: 'oklch', l: bestL, c: 0, h: 0 }) || '#000000';
}

// ===== CONTRAST FUNCTIONS =====

/**
 * Formats a color object to a hex string
 */
export function formatColor(color: unknown): string {
  return formatHex(color as Parameters<typeof formatHex>[0]) || '';
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

// ===== NEUTRAL GENERATION (LEGACY ALGORITHM) =====

/**
 * Generates base neutral colors WITHOUT nudgers applied
 * This matches the legacy generateNeutrals function exactly
 */
export function generateBaseNeutrals(params: ColorGenParams): Oklch[] {
  // Determine the starting and ending colors for neutral generation
  const startColor = params.currentTheme === 'dark' 
    ? calculateDarkModeStartColor("#ffffff") 
    : "#ffffff"; // Light mode starts with white (step 0 = lightest)
  
  const endColor = params.currentTheme === 'dark'
    ? "#ffffff"
    : "#000000"; // Light mode ends with black (step 10 = darkest)
  
  // Create initial color samples using bezier easing
  const initialSamples = samples(params.numColors).map(
    interpolate([
      startColor,
      easing(params.x1, params.y1, params.x2, params.y2), 
      endColor
    ])
  );

  // Process each sample to create neutral colors
  const baseNeutrals: Oklch[] = initialSamples.map((color) => {
    const result = { ...color };
    
    // Apply warmth adjustment to ALL colors (legacy behavior)
    result.r = (result.r || 0) + params.warmth * 0.001;
    result.g = (result.g || 0) - params.warmth * 0.0001;
    result.b = (result.b || 0) - params.warmth * 0.001;

    // Convert to OKLCH
    const oklchColor = oklch(result);
    
    // Ensure the color is within the OKLCH gamut
    return clampChroma(oklchColor, 'oklch') as Oklch;
  });
  
  return baseNeutrals;
}

/**
 * Generates a neutral color palette with lightness nudgers applied
 * Returns hex strings for display
 */
export function generateNeutralPalette(params: ColorGenParams, lightnessNudgers?: number[]): string[] {
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
  return neutralsWithNudgers.map(color => {
    try {
      const clampedColor = clampChroma(color, 'oklch');
      return formatHex(clampedColor) || '#000000';
    } catch {
      return '#000000';
    }
  });
}

// ===== PALETTE GENERATION (LEGACY ALGORITHM) =====

/**
 * Generates a single color palette based on base neutrals and a hue-shifted base color
 * This matches the legacy generatePalette function exactly
 */
function generatePalette(baseNeutrals: Oklch[], baseColor: Oklch, chromaMultiplier: number): Oklch[] {
  // Use base color's chroma multiplied by the chroma multiplier
  const targetChroma = (baseColor.c || 0) * chromaMultiplier;
  
  return baseNeutrals.map((neutralColor) => {
    return clampChroma(
      { 
        mode: "oklch" as const, 
        l: neutralColor.l, 
        c: targetChroma, 
        h: baseColor.h 
      }, 
      "oklch"
    ) as Oklch;
  });
}

/**
 * Applies lightness nudgers to neutrals and palettes after all other calculations
 * This is the FINAL step in the legacy algorithm
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
  const updatedPalettes = palettes.map(palette => {
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
  const cValues = palettes.map(palette => 
    palette.map(color => color.c || 0)
  );
  
  // Calculate mean chroma for each column
  // chromaMultiplier already applied in generatePalette, so just average
  const normalizedCs = (transpose(cValues) as number[][]).map(column => {
    const avgChroma = mean(column) || 0;
    return Math.max(0, avgChroma);
  });
  
  // Apply normalized chroma values back to palettes
  palettes.forEach(palette => {
    palette.forEach((color, j) => {
      if (normalizedCs[j] !== undefined) {
        color.c = normalizedCs[j];
      }
    });
  });
  
  return normalizedCs;
}

/**
 * Generates multiple color palettes using the LEGACY algorithm
 * Returns both OKLCH objects (for internal use) and hex strings (for display)
 */
export function generatePalettesLegacy(
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
  const { neutrals: neutralsWithNudgers, palettes: palettesWithNudgers } = 
    applyLightnessNudgers(baseNeutrals, palettes, lightnessNudgers);
  
  // Convert to hex strings
  const neutralsHex = neutralsWithNudgers.map(color => {
    try {
      const clampedColor = clampChroma(color, 'oklch');
      return formatHex(clampedColor) || '#000000';
    } catch {
      return '#000000';
    }
  });
  
  const palettesHex = palettesWithNudgers.map(palette => 
    palette.map(color => {
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
 * Wrapper around generatePalettesLegacy for backward compatibility
 */
export function generateMultiplePalettes(params: PaletteGenParams): string[][] {
  const result = generatePalettesLegacy(params as ColorGenParams, true);
  return result.palettes;
}

/**
 * Normalizes chroma values across palettes for consistent appearance
 * Public interface for external use - kept for backward compatibility
 */
export function normalizeChromaValues(palettes: string[][], _chromaMultiplier: number): void {
  // Convert hex to OKLCH
  const oklchPalettes: Oklch[][] = palettes.map(palette => 
    palette.map(color => oklch(color) as Oklch)
  );
  
  // Normalize (chromaMultiplier not used in current implementation)
  normalizeChromaValuesInternal(oklchPalettes);
  
  // Convert back to hex
  palettes.forEach((palette, paletteIndex) => {
    palette.forEach((_, colorIndex) => {
      const oklchColor = oklchPalettes[paletteIndex][colorIndex];
      if (oklchColor) {
        const clampedColor = clampChroma(oklchColor, 'oklch');
        const hexColor = formatHex(clampedColor);
        if (hexColor) {
          palettes[paletteIndex][colorIndex] = hexColor;
        }
      }
    });
  });
}

// ===== HELPER FUNCTIONS =====

/**
 * Converts hex color to RGB object
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculates relative luminance of a color
 */
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Determines if text should be light or dark on a background color
 */
export function getContrastColor(backgroundColor: string): string {
  const luminance = getLuminance(backgroundColor);
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Gets a name for the palette based on its middle color
 * @param palette - The palette to name
 * @returns The name of the nearest named color
 */
export function getPaletteName(palette: string[]): string {
  if (!palette?.length) return 'Unnamed';
  
  try {
    const middleIndex = Math.round(palette.length * 0.6);
    const middleColor = palette[Math.min(middleIndex, palette.length - 1)];
    const colorNames = nearestNamedColors(middleColor);
    // nearest() returns an array, get the first (closest) match
    const colorName = Array.isArray(colorNames) ? colorNames[0] : colorNames;
    return (typeof colorName === 'string' ? colorName : 'Unnamed') || 'Unnamed';
  } catch (error) {
    console.error('Error getting palette name:', error);
    return 'Unnamed';
  }
}

/**
 * Legacy function for backward compatibility - generates a single palette
 */
export function generateColorPalette(params: PaletteGenParams): string[] {
  const result = generatePalettesLegacy({
    ...params,
    numPalettes: 1,
    currentTheme: 'light'
  } as ColorGenParams, true);
  return result.palettes[0] || [];
}