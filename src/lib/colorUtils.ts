/**
 * Color utility functions for OKLCH color generation
 * Ported from legacy vanilla JS implementation for exact color matching
 */

import { oklch, formatHex, clampChroma, samples, interpolate, wcagContrast, colorsNamed, differenceCiede2000, nearest, parse } from 'culori';
import easing from 'bezier-easing';
import { transpose, mean } from 'mathjs';
import type { Rgb, Oklch } from 'culori';

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

/**
 * Interface for color generation parameters
 */
export interface ColorGenParams {
  baseColor: string;
  warmth: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  chromaMultiplier: number;
  numColors: number;
  currentTheme?: 'light' | 'dark';
}

/**
 * Interface for palette generation parameters
 */
export interface PaletteGenParams extends ColorGenParams {
  numPalettes: number;
  lightnessNudgers?: number[];
  hueNudgers?: number[];
}

/**
 * Result of generating colors - includes both base and display versions
 */
export interface ColorGenerationResult {
  baseNeutrals: Oklch[];      // Neutrals WITHOUT nudgers (for palette generation)
  neutrals: string[];          // Neutrals WITH nudgers (for display, hex format)
  palettes: string[][];        // Palettes WITH nudgers (for display, hex format)
  normalizedChromaValues?: number[];  // Stored for reuse when skipping normalization
}

/**
 * Calculates the optimal starting color for dark mode to achieve ~18:1 contrast with white
 */
function calculateDarkModeStartColor(targetColor: string = "#ffffff"): string {
  const targetContrast = 18;
  
  let minL = 0;
  let maxL = 0.5;
  let bestL = 0;
  let bestContrast = 21;
  
  // Binary search to find a color that gives ~18:1 contrast with white
  for (let i = 0; i < 30; i++) {
    const testL = (minL + maxL) / 2;
    const testColor = { mode: 'oklch' as const, l: testL, c: 0, h: 0 };
    const contrast = wcagContrast(testColor, targetColor);
    
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
  
  return formatHex({ mode: 'oklch', l: bestL, c: 0, h: 0 }) || '#000000';
}

/**
 * Generates base neutral colors (WITHOUT lightness nudgers applied)
 * This is the foundation for both neutral display and palette generation
 */
export function generateBaseNeutrals(params: ColorGenParams): Oklch[] {
  const isDarkMode = params.currentTheme === 'dark';
  
  // Determine start and end colors based on theme
  const startColor = isDarkMode 
    ? calculateDarkModeStartColor("#ffffff") 
    : "#ffffff";
  
  const endColor = isDarkMode
    ? "#ffffff"
    : "#000000";
  
  // Create bezier easing function
  const bezierEasing = easing(params.x1, params.y1, params.x2, params.y2);
  
  // Create initial color samples using bezier interpolation
  const initialSamples = samples(params.numColors).map(
    interpolate([startColor, bezierEasing, endColor])
  );

  // Process each sample to create neutral colors
  const baseNeutrals: Oklch[] = initialSamples.map((color) => {
    const result = { ...color } as Rgb;
    
    // Apply warmth adjustment to all colors
    result.r = (result.r || 0) + params.warmth * 0.001;
    result.g = (result.g || 0) - params.warmth * 0.0001;
    result.b = (result.b || 0) - params.warmth * 0.001;

    // Convert to OKLCH and clamp to gamut
    const oklchColor = oklch(result);
    return clampChroma(oklchColor, 'oklch') as Oklch;
  });
  
  return baseNeutrals;
}

/**
 * Generates a single palette based on base neutrals and a target hue
 */
function generatePaletteFromNeutrals(
  baseNeutrals: Oklch[], 
  baseColor: Oklch, 
  chromaMultiplier: number
): Oklch[] {
  const targetChroma = (baseColor.c || 0) * chromaMultiplier;
  
  return baseNeutrals.map((neutral) => {
    return clampChroma(
      { 
        mode: "oklch" as const, 
        l: neutral.l, 
        c: targetChroma, 
        h: baseColor.h 
      }, 
      "oklch"
    ) as Oklch;
  });
}

/**
 * Applies lightness nudgers to an array of OKLCH colors
 */
function applyLightnessNudgersToColors(colors: Oklch[], lightnessNudgers: number[]): Oklch[] {
  return colors.map((color, index) => {
    const nudger = lightnessNudgers[index] || 0;
    return {
      ...color,
      l: color.l + nudger
    };
  });
}

/**
 * Converts OKLCH colors to hex strings
 */
function oklchArrayToHex(colors: Oklch[]): string[] {
  return colors.map(color => {
    const clamped = clampChroma(color, 'oklch');
    return formatHex(clamped) || '#000000';
  });
}

/**
 * Main color generation function - generates neutrals and palettes
 * Matches the legacy algorithm exactly
 */
export function generateColors(params: PaletteGenParams, shouldNormalizeChroma: boolean = true): ColorGenerationResult {
  // Parse and validate base color
  const baseColor = oklch(parse(params.baseColor));
  if (!baseColor || isNaN(baseColor.h || 0) || isNaN(baseColor.c || 0)) {
    throw new Error('Invalid base color: could not parse or invalid hue/chroma values');
  }

  // Generate base neutrals (without nudgers)
  const baseNeutrals = generateBaseNeutrals(params);
  
  // Generate palettes with hue variations using base neutrals
  const basePalettes: Oklch[][] = Array.from({ length: params.numPalettes }, (_, i) => {
    const hueNudger = (params.hueNudgers && params.hueNudgers[i]) || 0;
    const hueOffset = (360 / params.numPalettes) * i + hueNudger;
    const tempColor: Oklch = { 
      ...baseColor, 
      h: ((baseColor.h || 0) + hueOffset) % 360
    };
    return generatePaletteFromNeutrals(baseNeutrals, tempColor, params.chromaMultiplier);
  });

  // Normalize chroma values if needed
  let normalizedChromaValues: number[] | undefined;
  if (shouldNormalizeChroma && params.chromaMultiplier > 0) {
    normalizedChromaValues = normalizeChromaValuesOklch(basePalettes);
  }

  // Apply lightness nudgers as the final step (after chroma normalization)
  const lightnessNudgers = params.lightnessNudgers || [];
  const neutralsWithNudgers = applyLightnessNudgersToColors(baseNeutrals, lightnessNudgers);
  const palettesWithNudgers = basePalettes.map(palette => 
    applyLightnessNudgersToColors(palette, lightnessNudgers)
  );

  // Convert to hex for display
  return {
    baseNeutrals,
    neutrals: oklchArrayToHex(neutralsWithNudgers),
    palettes: palettesWithNudgers.map(oklchArrayToHex),
    normalizedChromaValues
  };
}

/**
 * Normalizes chroma values across palettes for consistent appearance
 * Modifies palettes in place and returns the normalized values
 */
function normalizeChromaValuesOklch(palettes: Oklch[][]): number[] {
  // Extract chroma values from all palettes
  const cValues = palettes.map(palette => 
    palette.map(color => color.c || 0)
  );
  
  // Calculate mean chroma for each column (step position)
  const normalizedCs = (transpose(cValues as number[][]) as number[][]).map(column => {
    const avgChroma = mean(column as number[]) || 0;
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

// ============================================
// Legacy compatibility functions
// ============================================

/**
 * Legacy function - generates neutral palette as hex strings
 * @deprecated Use generateColors() instead
 */
export function generateNeutralPalette(params: ColorGenParams, lightnessNudgers?: number[]): string[] {
  const paletteParams: PaletteGenParams = {
    ...params,
    numPalettes: 1,
    lightnessNudgers
  };
  const result = generateColors(paletteParams, false);
  return result.neutrals;
}

/**
 * Legacy function - generates multiple palettes as hex strings
 * @deprecated Use generateColors() instead
 */
export function generateMultiplePalettes(params: PaletteGenParams): string[][] {
  const result = generateColors(params, true);
  return result.palettes;
}

/**
 * Normalizes chroma values across palettes for consistent appearance
 * Matches the legacy implementation using mathjs transpose and mean
 */
export function normalizeChromaValues(palettes: string[][], chromaMultiplier: number): void {
  try {
    // Convert hex colors to OKLCH objects and extract chroma values
    const cValues = palettes.map(palette => 
      palette.map(color => {
        const oklchColor = oklch(color);
        return oklchColor?.c || 0; // Default to 0 if c is undefined
      })
    );
    
    // Calculate mean chroma for each column and apply multiplier
    const normalizedCs = transpose(cValues as number[][]).map(column => {
      const avgChroma = mean(column as number[]) || 0; // Ensure we have a valid number
      return Math.max(0, avgChroma * chromaMultiplier);
    });

    // Apply normalized chroma values back to palettes
    palettes.forEach((palette, paletteIndex) => {
      palette.forEach((color, colorIndex) => {
        if (normalizedCs[colorIndex] !== undefined) {
          const oklchColor = oklch(color);
          if (oklchColor) {
            oklchColor.c = normalizedCs[colorIndex];
            const clampedColor = clampChroma(oklchColor, 'oklch');
            const hexColor = formatHex(clampedColor);
            if (hexColor) {
              palettes[paletteIndex][colorIndex] = hexColor;
            }
          }
        }
      });
    });
  } catch (error) {
    console.error('Failed to normalize chroma values:', error);
    // Continue with unnormalized palettes if math operations fail
  }
}

/**
 * Legacy function for backward compatibility - generates a single palette
 */
export function generateColorPalette(params: ColorGenParams): string[] {
  const paletteParams: PaletteGenParams = {
    ...params,
    numPalettes: 1,
    hueShift: 0
  };
  
  const palettes = generateMultiplePalettes(paletteParams);
  return palettes[0] || [];
}

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

// ===== CONTRAST SYSTEM FUNCTIONS =====

/**
 * Finds the nearest named color using CIEDE2000 color difference formula
 */
export const nearestNamedColors = nearest(Object.keys(colorsNamed), differenceCiede2000());

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
 * @param color1 - First color
 * @param color2 - Second color
 * @returns Formatted contrast ratio
 */
export function getPrintableContrast(color1: string, color2: string): number {
  return Math.trunc(100 * getContrast(color1, color2)) / 100;
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
    const colorName = nearestNamedColors(middleColor);
    return (typeof colorName === 'string' ? colorName : 'Unnamed') || 'Unnamed';
  } catch (error) {
    console.error('Error getting palette name:', error);
    return 'Unnamed';
  }
}