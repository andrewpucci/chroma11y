import { generateNeutrals, generatePalettes } from "./colorUtils.js";
import { colorState, setColorState, setUpdateControlsFromState } from "./state.js";
import { updateControlsFromState, addLightnessNudgers, printNeutrals, scaffoldPalettes, printPalettes, toggleContrastMode } from "./domUtils.js";
import { setupEventListeners } from "./events.js";

export { setColorState }; // Re-export for backward compatibility

export const initiateColumns = async () => {
  try {
    generateNeutrals();
    addLightnessNudgers();
    scaffoldPalettes();
    await showColors();
  } catch (error) {
    console.error('Error in initiateColumns:', error);
  }
};

export const initiateRows = async () => {
  try {
    scaffoldPalettes();
    await showColors();
  } catch (error) {
    console.error('Error in initiateRows:', error);
  }
};

/**
 * Regenerates and displays all colors and palettes
 * This function is exposed globally to allow theme changes to trigger updates
 */
const showColors = async () => {
  try {
    console.log('[showColors] Regenerating colors and palettes');
    
    // Clear any existing state that could cause accumulation
    // This is important when bezier curve or other fundamental parameters change
    colorState.normalizedChromaValues = [];
    colorState.baseNeutrals = [];
    colorState.neutrals = [];
    colorState.palettes = [];
    
    // Generate and display neutral colors
    const neutrals = generateNeutrals();
    printNeutrals();
    
    // Generate and display color palettes
    await generatePalettes();
    printPalettes();
    
    // Update contrast mode
    toggleContrastMode();
    
    console.log('[showColors] Colors and palettes regenerated');
  } catch (error) {
    console.error('Error in showColors:', error);
  }
};

<<<<<<< Updated upstream
// Expose showColors globally for theme changes
window.regeneratePalettes = showColors;

export { showColors };
=======

/**
 * Regenerates only neutral colors without affecting palettes
 * Used for lightness nudger changes to prevent cross-column effects
 */
const regenerateNeutralsOnly = async () => {
  try {
    console.log('[regenerateNeutralsOnly] Regenerating neutrals only');
    // Generate and display neutral colors only
    const neutrals = generateNeutrals();
    printNeutrals();
    
    // Update contrast mode (but don't regenerate palettes)
    toggleContrastMode();
    
    console.log('[regenerateNeutralsOnly] Neutrals regenerated');
  } catch (error) {
    console.error('Error in regenerateNeutralsOnly:', error);
  }
};

/**
 * Regenerates colors without chroma normalization to prevent cross-column effects
 * Used for lightness nudger changes - only reapplies nudgers without regenerating base colors
 */
const regenerateColorsWithoutChromaNormalization = async () => {
  try {
    console.log('[regenerateColorsWithoutChromaNormalization] Reapplying lightness nudgers only');
    
    // DO NOT regenerate base neutrals - just reapply nudgers to existing base neutrals
    // This ensures only the nudged step changes, not all steps
    
    // Generate and display color palettes without chroma normalization
    await generatePalettes(false); // Skip chroma normalization
    printNeutrals(); // Print neutrals with nudgers applied (from state)
    printPalettes();
    
    // Update contrast mode
    toggleContrastMode();
    
    console.log('[regenerateColorsWithoutChromaNormalization] Lightness nudgers reapplied');
  } catch (error) {
    console.error('Error in regenerateColorsWithoutChromaNormalization:', error);
  }
};

/**
 * Regenerates colors only with chroma normalization
 * Used for hue nudger changes - regenerates palettes without affecting neutrals
 */
const regenerateColorsOnly = async () => {
  try {
    console.log('[regenerateColorsOnly] Regenerating palettes with chroma normalization');
    
    // DO NOT regenerate base neutrals - they should remain unchanged
    // Only regenerate palettes with new hue nudger values
    
    // Generate and display color palettes WITH chroma normalization
    await generatePalettes(true); // Include chroma normalization
    printPalettes();
    
    // Update contrast mode
    toggleContrastMode();
    
    console.log('[regenerateColorsOnly] Palettes regenerated');
  } catch (error) {
    console.error('Error in regenerateColorsOnly:', error);
  }
};

/**
 * Regenerates all colors with proper state clearing
 * Used for bezier curve changes - regenerates neutrals and palettes with fresh state
 */
const regenerateColorsWithFreshState = async () => {
  try {
    console.log('[regenerateColorsWithFreshState] Regenerating colors with fresh state');
    
    // Clear ALL color-related state to prevent any accumulation
    // This is critical when bezier curve changes
    colorState.normalizedChromaValues = [];
    colorState.baseNeutrals = [];
    colorState.neutrals = [];
    colorState.palettes = [];
    
    // Force regeneration by ensuring generatePalettes doesn't use cached baseNeutrals
    const originalBaseNeutrals = colorState.baseNeutrals;
    colorState.baseNeutrals = []; // Force regeneration
    
    // Generate and display neutral colors
    const neutrals = generateNeutrals();
    printNeutrals();
    
    // Generate and display color palettes (will regenerate baseNeutrals from scratch)
    await generatePalettes();
    printPalettes();
    
    // Update contrast mode
    toggleContrastMode();
    
    console.log('[regenerateColorsWithFreshState] Colors regenerated with fresh state');
  } catch (error) {
    console.error('Error in regenerateColorsWithFreshState:', error);
  }
};

// Expose showColors globally for theme changes
window.regeneratePalettes = showColors;

export { showColors, regenerateNeutralsOnly, regenerateColorsWithoutChromaNormalization, regenerateColorsOnly, regenerateColorsWithFreshState };
>>>>>>> Stashed changes

// Application dependencies to be passed to event listeners
const appDependencies = {
  showColors,
<<<<<<< Updated upstream
=======
  regenerateColorsOnly,
  regenerateNeutralsOnly,
  regenerateColorsWithoutChromaNormalization,
  regenerateColorsWithFreshState,
>>>>>>> Stashed changes
  initiateRows,
  initiateColumns,
  setColorState
};

/**
 * Initializes the application by setting up theme and contrast
 */
const initializeApp = () => {
  // Set initial CSS variables from theme
  const root = document.documentElement;
  root.style.setProperty('--low-text-color', colorState.contrast.low);
  root.style.setProperty('--high-text-color', colorState.contrast.high);
  
  // Initialize the rest of the app
  updateControlsFromState();
  
  // Set up the updateControlsFromState reference in state.js
  setUpdateControlsFromState(updateControlsFromState);
  
  // Set up event listeners with dependencies
  setupEventListeners(appDependencies);
  
  // Initialize the UI
  initiateColumns();
  toggleContrastMode();
};

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Initialize the application
  initializeApp();
  
  // Initial render
  showColors().then(() => {
    console.log('Initial render complete');
  });
  
  // Expose colorState to the window object for testing
  if (window.Cypress) {
    window.colorState = colorState;
  }
});
