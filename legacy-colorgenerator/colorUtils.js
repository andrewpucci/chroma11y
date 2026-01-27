/**
 * @module colorUtils
 * @description Provides color manipulation and generation utilities using the OKLCH color space.
 */

import { 
  clampChroma, 
  colorsNamed, 
  differenceCiede2000, 
  formatHex, 
  interpolate, 
  nearest, 
  oklch, 
  parse,
  samples, 
  wcagContrast 
} from "https://cdn.skypack.dev/culori@4.0.1";
import easing from "https://cdn.skypack.dev/bezier-easing@2.1.0";
import { colorState, setColorState } from "./state.js";

/**
 * Finds the nearest named color using CIEDE2000 color difference formula
 * @type {Function}
 */
export const nearestNamedColors = nearest(Object.keys(colorsNamed), differenceCiede2000());

/**
 * Calculates the optimal starting color for dark mode to achieve ~18:1 contrast with target color
 * @param {string} targetColor - The color to contrast against (defaults to white)
 * @returns {string} Hex color string for the dark mode starting color
 * @private
 */
const calculateDarkModeStartColor = (targetColor = "#ffffff") => {
  const targetContrast = 18;
  
  // Binary search to find a color that gives ~18:1 contrast with white
  let minL = 0;
  let maxL = 0.5; // Expand search range
  let bestL = 0;
  let bestContrast = 21;
  
  // Create a test color to find the right lightness
  for (let i = 0; i < 30; i++) {
    const testL = (minL + maxL) / 2;
    const testColor = { mode: 'oklch', l: testL, c: 0, h: 0 };
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
  return formatHex({ mode: 'oklch', l: bestL, c: 0, h: 0 });
};

/**
 * Formats a color object to a hex string
 * @param {Object|string} color - The color to format
 * @returns {string} The color as a hex string
 */
export const formatColor = (color) => formatHex(color);

/**
 * Calculates the contrast ratio between two colors using WCAG 2.1 formula
 * @param {string|Object} color1 - First color (hex string or color object)
 * @param {string|Object} color2 - Second color (hex string or color object)
 * @returns {number} Contrast ratio between 1 and 21
 */
export const getContrast = (color1, color2) => wcagContrast(color1, color2);

/**
 * Formats a contrast ratio to a readable number with 2 decimal places
 * @param {string|Object} color1 - First color
 * @param {string|Object} color2 - Second color
 * @returns {number} Formatted contrast ratio
 */
export const getPrintableContrast = (color1, color2) => 
  Math.trunc(100 * getContrast(color1, color2)) / 100;

/**
 * Generates a range of neutral colors based on the current state
 * Updates the colorState.neutrals array with the generated colors
 * @returns {Array<Object>} Array of neutral colors in OKLCH format
 */
export const generateNeutrals = () => {
  try {
<<<<<<< Updated upstream
    const nudgerInputs = Array.from(document.querySelectorAll('.nudger-input') || []);
=======
    // Determine the starting and ending colors for neutral generation
    const startColor = colorState.currentTheme === 'dark' 
      ? calculateDarkModeStartColor("#ffffff") 
      : "#ffffff"; // Light mode starts with white (step 0 = lightest)
    
    const endColor = colorState.currentTheme === 'dark'
      ? "#ffffff"
      : "#000000"; // Light mode ends with black (step 10 = darkest)
>>>>>>> Stashed changes
    
    // Create initial color samples using bezier easing
    const initialSamples = samples(colorState.numColors).map(
      interpolate([
        startColor,
        easing(colorState.x1, colorState.y1, colorState.x2, colorState.y2), 
        endColor
      ])
    );

    // Process each sample to create neutral colors
    const neutrals = initialSamples.map((color, index) => {
      const result = { ...color };
      
      // Apply warmth adjustment to all colors
      result.r = (result.r || 0) + colorState.warmth * 0.001;
      result.g = (result.g || 0) - colorState.warmth * 0.0001;
      result.b = (result.b || 0) - colorState.warmth * 0.001;

<<<<<<< Updated upstream
      // Convert to OKLCH and apply lightness nudging
=======
      // Convert to OKLCH
>>>>>>> Stashed changes
      let oklchColor = oklch(result);
      const lightnessNudger = parseFloat(nudgerInputs[index]?.value || 0);
      oklchColor.l = Math.min(1, Math.max(0, oklchColor.l + lightnessNudger));
      
      // Ensure the color is within the OKLCH gamut
      return clampChroma(oklchColor, 'oklch');
    });
<<<<<<< Updated upstream

    // Update the state with the new neutrals
    colorState.neutrals = neutrals;
    return neutrals;
=======
    
    // Store base neutrals WITHOUT nudgers applied
    colorState.baseNeutrals = baseNeutrals;
    
    // Apply lightness nudgers to create the display neutrals
    const nudgerInputs = Array.from(document.querySelectorAll('.nudger-input') || []);
    const neutralsWithNudgers = baseNeutrals.map((color, index) => {
      const lightnessNudger = parseFloat(nudgerInputs[index]?.value || 0);
      return {
        ...color,
        l: color.l + lightnessNudger
      };
    });
    
    // Update the state with neutrals that have nudgers applied (for display)
    colorState.neutrals = neutralsWithNudgers;
    
    // Return base neutrals (without nudgers) for palette generation
    return baseNeutrals;
>>>>>>> Stashed changes
  } catch (error) {
    console.error('Error generating neutral colors:', error);
    // Return empty array or previous state on error
    return colorState.neutrals || [];
  }
};

/**
 * Generates a color palette based on a base neutral palette and base color
 * @param {Array<Object>} baseNeutrals - Array of neutral colors in OKLCH format
 * @param {Object} baseColor - The base color to generate the palette from
 * @returns {Array<Object>} Generated palette colors in OKLCH format
 */
export const generatePalette = (baseNeutrals, baseColor) => {
  if (!baseNeutrals?.length || !baseColor) {
    throw new Error('Base neutrals and base color are required');
  }

  const nudgerInputs = Array.from(document.querySelectorAll('.nudger-input') || []);
  
  return baseNeutrals.map((color, index) => {
    const lightnessNudger = parseFloat(nudgerInputs[index]?.value || 0);
    
    return clampChroma(
      { 
        mode: "oklch", 
        l: color.l + lightnessNudger, 
        c: baseColor.c * colorState.chromaMultiplier, 
        h: baseColor.h 
      }, 
      "oklch"
    );
  });
};

/**
 * Generates multiple color palettes based on the current state and updates the state
 * @returns {Promise<void>}
 * @throws {Error} If base color is invalid or neutrals are not generated
 */
export const generatePalettes = async () => {
  if (!colorState.baseColor) {
    throw new Error('Base color is required');
  }
  
<<<<<<< Updated upstream
  if (!colorState.neutrals?.length) {
    throw new Error('Neutral colors must be generated first');
=======
  // CRITICAL: Always use baseNeutrals, never fall back to neutrals (which have nudgers applied)
  // If baseNeutrals doesn't exist, regenerate it from scratch
  let baseNeutrals = colorState.baseNeutrals;
  
  if (!baseNeutrals?.length) {
    console.warn('[generatePalettes] baseNeutrals missing, regenerating from scratch');
    
    // Determine the starting and ending colors for neutral generation
    const startColor = colorState.currentTheme === 'dark' 
      ? calculateDarkModeStartColor("#ffffff") 
      : "#ffffff"; // Light mode starts with white (step 0 = lightest)
    
    const endColor = colorState.currentTheme === 'dark'
      ? "#ffffff"
      : "#000000"; // Light mode ends with black (step 10 = darkest)
    
    // Regenerate base neutrals without reading nudger values
    const initialSamples = samples(colorState.numColors).map(
      interpolate([
        startColor,
        easing(colorState.x1, colorState.y1, colorState.x2, colorState.y2), 
        endColor
      ])
    );
    
    baseNeutrals = initialSamples.map((color, index) => {
      const result = { ...color };
      
      // Apply warmth adjustment to all colors
      result.r = (result.r || 0) + colorState.warmth * 0.001;
      result.g = (result.g || 0) - colorState.warmth * 0.0001;
      result.b = (result.b || 0) - colorState.warmth * 0.001;

      // Convert to OKLCH
      let oklchColor = oklch(result);
      
      // Ensure the color is within the OKLCH gamut
      return clampChroma(oklchColor, 'oklch');
    });
    
    // Store for future use
    colorState.baseNeutrals = baseNeutrals;
>>>>>>> Stashed changes
  }

  try {
    const hueNudgerInputs = Array.from(document.querySelectorAll('.hue-nudger-input') || []);
    
    // Parse and validate base color
    const baseColor = oklch(parse(colorState.baseColor));
    if (!baseColor || isNaN(baseColor.h) || isNaN(baseColor.c)) {
      throw new Error('Invalid base color: could not parse or invalid hue/chroma values');
    }
    
    console.log('Generating palettes with base color:', baseColor);
    
    // Generate palettes with hue variations
    const palettes = Array.from({ length: colorState.numPalettes }, (_, i) => {
      const hueNudger = parseFloat(hueNudgerInputs[i]?.value || 0);
      const hueOffset = (360 / colorState.numPalettes) * i + hueNudger;
      const tempColor = { 
        ...baseColor, 
        h: (baseColor.h + hueOffset) % 360,
        // Ensure we have valid chroma and lightness values
        c: Math.max(0, baseColor.c || 0.15),
        l: Math.max(0, Math.min(1, baseColor.l || 0.6))
      };
      return generatePalette(colorState.neutrals, tempColor);
    });

    // Normalize chroma values if needed
    if (colorState.chromaMultiplier > 0) {
      await normalizeChromaValues(palettes);
    }

    // Update state with new palettes
    colorState.palettes = palettes;
    return palettes;
  } catch (error) {
    console.error('Error generating palettes:', error);
    throw error; // Re-throw to allow callers to handle the error
  }
};

/**
 * Normalizes chroma values across palettes for consistent appearance
 * @param {Array<Array<Object>>} palettes - Array of palettes to normalize
 * @returns {Promise<void>}
 * @private
 */
const normalizeChromaValues = async (palettes) => {
  try {
    // Dynamically import math functions only when needed
    const { transpose, mean } = await import('https://cdn.skypack.dev/mathjs@12.4.1');
    
    // Extract chroma values from all palettes
    const cValues = palettes.map(palette => 
      palette.map(color => color.c || 0) // Default to 0 if c is undefined
    );
    
    // Calculate mean chroma for each column and apply multiplier
    const normalizedCs = transpose(cValues).map(column => {
      const avgChroma = mean(column) || 0; // Ensure we have a valid number
      return Math.max(0, avgChroma * (colorState.chromaMultiplier || 1));
    });

    // Apply normalized chroma values back to palettes
    palettes.forEach(palette => {
      palette.forEach((color, j) => {
        if (normalizedCs[j] !== undefined) {
          color.c = normalizedCs[j];
        }
      });
    });
  } catch (error) {
    console.error('Failed to normalize chroma values:', error);
    // Continue with unnormalized palettes if math operations fail
  }
};

/**
 * Updates contrast colors in the state and UI
 * @param {string} lowContrast - The low contrast color (hex)
 * @param {string} highContrast - The high contrast color (hex)
 * @returns {Promise<boolean>} True if update was successful
 */
/**
 * Updates contrast colors in the state and UI
 * @param {string} lowContrast - The low contrast color (hex)
 * @param {string} highContrast - The high contrast color (hex)
 * @returns {Promise<boolean>} True if update was successful
 */
export const updateContrast = async (lowContrast, highContrast) => {
  // Validate input parameters
  if (!lowContrast || !highContrast) {
    console.error('Both contrast colors are required. Received:', { lowContrast, highContrast });
    return false;
  }

  // Ensure colors are properly formatted
  const formattedLow = formatColor(lowContrast);
  const formattedHigh = formatColor(highContrast);

  if (!formattedLow || !formattedHigh) {
    console.error('Invalid contrast colors provided. Could not format:', { lowContrast, highContrast });
    return false;
  }

  try {
    // Update both state and CSS variables in one go
    setColorState({ 
      contrast: { 
        low: formattedLow, 
        high: formattedHigh
      },
      // Force UI update to reflect the changes
      _lastUpdated: Date.now()
    }, true);
    
    // Update CSS variables
    const root = document.documentElement;
    if (root) {
      root.style.setProperty('--low-text-color', formattedLow);
      root.style.setProperty('--high-text-color', formattedHigh);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating contrast:', error);
    return false;
  }
};

/**
 * Sets contrast colors automatically based on neutral colors at configured steps
 * @returns {Promise<boolean>} True if contrast was updated successfully
 */
/**
 * Sets contrast colors automatically based on neutral colors at configured steps
 * @returns {Promise<boolean>} True if contrast was updated successfully
 */
export const autoContrast = async () => {
  try {
    if (!colorState.neutrals?.length) {
      console.error('Neutral colors not available for auto contrast');
      return false;
    }

    // Ensure steps are within bounds
    const lowStep = Math.max(0, Math.min(colorState.lowStep, colorState.neutrals.length - 1));
    const highStep = Math.max(0, Math.min(colorState.highStep, colorState.neutrals.length - 1));

    // Get colors from neutral palette
    const lowColor = colorState.neutrals[lowStep];
    const highColor = colorState.neutrals[highStep];

    if (!lowColor || !highColor) {
      console.error('Could not get contrast colors from neutral palette');
      return false;
    }
    
    return await updateContrast(lowColor, highColor);
  } catch (error) {
    console.error('Error in autoContrast:', error);
    return false;
  }
};

/**
 * Sets contrast colors to manually configured values
 * @returns {Promise<boolean>} True if contrast was updated successfully
 */
export const manualContrast = async () => {
  try {
    if (!colorState.contrast?.low || !colorState.contrast?.high) {
      console.error('Manual contrast colors not set in state');
      return false;
    }

    // Use the colors directly from state as they should already be formatted
    return await updateContrast(
      colorState.contrast.low,
      colorState.contrast.high
    );
  } catch (error) {
    console.error('Error in manualContrast:', error);
    return false;
  }
};

/**
 * Sets the contrast mode and updates colors accordingly
 * @returns {Promise<boolean>} True if contrast mode was set successfully
 */
export const setContrastMode = async () => {
  try {
    return colorState.contrastMode === 'auto' 
      ? await autoContrast() 
      : await manualContrast();
  } catch (error) {
    console.error('Error setting contrast mode:', error);
    return false;
  }
};

/**
 * Gets a name for the palette based on its middle color
 * @param {Array<Object>} palette - The palette to name
 * @returns {string} The name of the nearest named color
 */
export const getPaletteName = (palette) => {
  if (!palette?.length) return 'Unnamed';
  
  try {
    const middleIndex = Math.round(palette.length * 0.6);
    const middleColor = palette[Math.min(middleIndex, palette.length - 1)];
    return nearestNamedColors(middleColor) || 'Unnamed';
  } catch (error) {
    console.error('Error getting palette name:', error);
    return 'Unnamed';
  }
};