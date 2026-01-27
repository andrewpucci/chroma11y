// Store a reference to updateControlsFromState for use in setColorState
let updateControlsFromStateRef = null;

// Import necessary functions
import { autoContrast } from './colorUtils.js';
import { updateContrast } from './colorUtils.js';

/**
 * Sets the updateControlsFromState reference
 * @param {Function} fn - The updateControlsFromState function from domUtils
 */
export const setUpdateControlsFromState = (fn) => {
  updateControlsFromStateRef = fn;
};

/**
 * @typedef {Object} Contrast
 * @property {string} low - The low contrast color in hex format
 * @property {string} high - The high contrast color in hex format
 */

/**
 * @typedef {Object} ColorState
 * @property {number} numColors - Number of colors in each palette
 * @property {number} numPalettes - Number of palettes to generate
 * @property {string} baseColor - Base color in hex format
 * @property {number} warmth - Warmth adjustment value
 * @property {number} x1 - First control point x-coordinate for bezier curve
 * @property {number} y1 - First control point y-coordinate for bezier curve
 * @property {number} x2 - Second control point x-coordinate for bezier curve
 * @property {number} y2 - Second control point y-coordinate for bezier curve
 * @property {number} chromaMultiplier - Global chroma adjustment multiplier
 * @property {string} contrastMode - Current contrast mode ('auto' or 'manual')
 * @property {number} lowStep - Index of the low contrast step
 * @property {number} highStep - Index of the high contrast step
 * @property {Contrast} contrast - Contrast colors object
 * @property {Array} neutrals - Array of neutral colors
 * @property {Array} palettes - Array of generated color palettes
 */

/**
 * Default color state values for light and dark modes
 * @type {Object}
 */
const THEME_PRESETS = {
  light: {
    numColors: 11,
    numPalettes: 11,
    baseColor: "#1862E6",
    warmth: -7,
    x1: 0.16,
    y1: 0.0,
    x2: 0.28,
    y2: 0.38,
    chromaMultiplier: 1.14,
    contrastMode: "auto",
    lowStep: 0,
    highStep: 10,
    contrast: {
      low: "#ffffff",
      high: "#000000"
    },
    neutrals: [],
    palettes: []
  },
  dark: {
    numColors: 11,
    numPalettes: 11,
    baseColor: "#1862E6",
    warmth: -7,
    x1: 0.26,
    y1: 0.0,
    x2: 0.91,
    y2: 0.89,
    chromaMultiplier: 0.9,
    contrastMode: "auto",
    lowStep: 0,
    highStep: 10,
    contrast: {
      low: "#071531",
      high: "#ffffff"
    },
    neutrals: [],
    palettes: []
  }
};

/**
 * Current theme ('light' or 'dark')
 * @type {string}
 */
let currentTheme = 'light';

/**
 * Default color state values
 * @type {ColorState}
 */
const DEFAULT_STATE = {
  ...THEME_PRESETS.light, // Default to light theme
  currentTheme: 'light',  // Track current theme
  THEME_PRESETS          // Include presets in state for easy access
};

/**
 * Current application color state
 * @type {ColorState}
 */
export const colorState = { ...DEFAULT_STATE };

/**
 * Updates the color state with new values
 * @param {Partial<ColorState>} newState - Partial state object with new values
 * @param {boolean} [shouldUpdateUI=true] - Whether to trigger UI updates
 * @throws {Error} If newState is not an object
 */
export const setColorState = (newState, shouldUpdateUI = true) => {
  if (typeof newState !== 'object' || newState === null) {
    throw new Error('State must be an object');
  }

  let hasChanges = false;
  const updatedState = { ...newState };

  // Handle nested objects like contrast
  Object.entries(updatedState).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value) && colorState[key]) {
      // Only update nested properties that actually changed
      const currentNested = colorState[key];
      const updatedNested = { ...currentNested, ...value };
      
      if (JSON.stringify(currentNested) !== JSON.stringify(updatedNested)) {
        colorState[key] = updatedNested;
        hasChanges = true;
      }
    } else if (!Object.is(colorState[key], value)) {
      colorState[key] = value;
      hasChanges = true;
    }
  });

  // Update CSS variables when contrast values or theme changes
  if (hasChanges) {
    const root = document.documentElement;
    
    // Update contrast colors if they changed
    if ('contrast' in newState) {
      if ('low' in newState.contrast) {
        root.style.setProperty('--low-text-color', newState.contrast.low);
      }
      if ('high' in newState.contrast) {
        root.style.setProperty('--high-text-color', newState.contrast.high);
      }
    }
    
    // Update theme class on body when theme changes
    if ('currentTheme' in newState) {
      root.classList.remove('light-theme', 'dark-theme');
      root.classList.add(`${newState.currentTheme}-theme`);
    }
  }

  // Only trigger UI updates if there were actual changes
  if (hasChanges && shouldUpdateUI && typeof updateControlsFromStateRef === 'function') {
    updateControlsFromStateRef();
  }

  return hasChanges;
};

/**
 * Switches between light and dark themes
 * @param {'light'|'dark'} theme - The theme to switch to
 * @param {boolean} [shouldUpdateUI=true] - Whether to trigger UI updates after theme change
 * @returns {boolean} True if theme was changed successfully
 */
export const setTheme = async (theme, shouldUpdateUI = true) => {
  console.log(`[state.setTheme] Setting theme to: ${theme}`);
  
  if (!THEME_PRESETS[theme]) {
    console.error(`[state.setTheme] Invalid theme: ${theme}. Must be 'light' or 'dark'`);
    return false;
  }

  try {
    // Get the new theme's preset
    const themePreset = THEME_PRESETS[theme];
    console.log(`[state.setTheme] Theme preset:`, themePreset);
    
    // Ensure we have valid contrast colors from the theme
    const contrast = { ...themePreset.contrast };
    
    // Fallback to default contrast colors if not defined in the theme
    if (!contrast.low || !contrast.high) {
      console.warn(`[state.setTheme] Theme ${theme} missing contrast colors, using defaults`);
      contrast.low = theme === 'dark' ? '#071531' : '#ffffff';
      contrast.high = theme === 'dark' ? '#ffffff' : '#000000';
    }
    
    // Create the new state object with all theme-specific settings
    const newState = {
      // First spread the current state to preserve any custom values
      ...colorState,
      // Then apply all theme-specific settings including highStep and lowStep
      ...themePreset,
      // Ensure contrast colors are properly set
      contrast: {
        low: contrast.low,
        high: contrast.high
      },
      // Set the current theme
      currentTheme: theme,
      // Force an update by including a timestamp
      _lastUpdated: Date.now()
    };
    
    console.log('[state.setTheme] New state to be set:', newState);
    
    // Update the state with the new theme's properties
    const result = setColorState(newState, shouldUpdateUI);
    console.log('[state.setTheme] setColorState result:', result);
    console.log('[state.setTheme] Current theme after setColorState:', colorState.currentTheme);
    
    // Update the UI to reflect the new theme
    if (shouldUpdateUI) {
      const root = document.documentElement;
      root.classList.remove('light-theme', 'dark-theme');
      root.classList.add(`${theme}-theme`);
      
      // Update contrast colors in CSS variables
      root.style.setProperty('--low-text-color', contrast.low);
      root.style.setProperty('--high-text-color', contrast.high);
      
      // Update the theme icon
      const themeIcon = document.querySelector('#theme-toggle .theme-icon');
      if (themeIcon) {
        // Match test expectations: '🌙' for light theme, '☀️' for dark theme
        themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
      }
      
      // Update contrast mode controls
      if (updateControlsFromStateRef) {
        updateControlsFromStateRef();
      }
      
      // Regenerate palettes with the new theme settings
      if (window.regeneratePalettes) {
        console.log('[state.setTheme] Regenerating palettes for new theme');
        try {
          await window.regeneratePalettes();
          
          // After regenerating palettes, ensure contrast is updated
          if (colorState.contrastMode === 'auto') {
            await autoContrast();
          } else {
            await updateContrast(contrast.low, contrast.high);
          }
        } catch (error) {
          console.error('[state.setTheme] Error regenerating palettes:', error);
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('[state.setTheme] Error setting theme:', error);
    return false;
  }
};

/**
 * Toggles between light and dark themes
 * @param {boolean} [shouldUpdateUI=true] - Whether to trigger UI updates after toggle
 * @returns {Promise<boolean>} True if theme was toggled successfully
 */
export const toggleTheme = async (shouldUpdateUI = true) => {
  const newTheme = colorState.currentTheme === 'light' ? 'dark' : 'light';
  console.log(`[state.toggleTheme] Toggling theme from ${colorState.currentTheme} to ${newTheme}`);
  
  try {
    return await setTheme(newTheme, shouldUpdateUI);
  } catch (error) {
    console.error('[state.toggleTheme] Error toggling theme:', error);
    return false;
  } finally {
    colorState._isTogglingTheme = false;
  }
};

/**
 * Resets the color state to default values
 * @param {boolean} [shouldUpdateUI=true] - Whether to trigger UI updates after reset
 * @param {string} [theme] - Optional theme to reset to ('light' or 'dark')
 * @returns {boolean} True if reset was successful
 */
export const resetColorState = (shouldUpdateUI = true, theme) => {
  try {
    const targetTheme = theme && THEME_PRESETS[theme] ? theme : colorState.currentTheme;
    
    // Create a clean copy of the default state
    const defaultState = {
      ...JSON.parse(JSON.stringify(THEME_PRESETS[targetTheme])),
      currentTheme: targetTheme,
      THEME_PRESETS,
      // Force an update by including a timestamp
      _lastUpdated: Date.now()
    };
    
    // Clear the current state and apply defaults
    Object.keys(colorState).forEach(key => delete colorState[key]);
    Object.assign(colorState, defaultState);
    
    // Update CSS variables
    const root = document.documentElement;
    root.style.setProperty('--low-text-color', colorState.contrast.low);
    root.style.setProperty('--high-text-color', colorState.contrast.high);
    
    // Update UI if requested
    if (shouldUpdateUI && typeof updateControlsFromState === 'function') {
      updateControlsFromState();
    }
    
    return true;
  } catch (error) {
    console.error('Error resetting color state:', error);
    return false;
  }
};
