<<<<<<< Updated upstream
import { colorState } from "./state.js";
import { exportColors } from "./exportUtils.js";
import { downloadJSON } from "./fileUtils.js";
import { toggleContrastMode, refreshAllSwatches } from "./domUtils.js";
import { autoContrast, updateContrast } from "./colorUtils.js";
=======
import { colorState, setColorState } from './state.js';
import { showColors, regenerateNeutralsOnly, regenerateColorsWithoutChromaNormalization, regenerateColorsOnly, regenerateColorsWithFreshState } from './main.js';
import { updateContrast, autoContrast, setContrastMode, formatColor } from './colorUtils.js';
import { refreshAllSwatches, isUpdatingControlsFromState, toggleContrastMode } from './domUtils.js';
>>>>>>> Stashed changes
import { toggleTheme as toggleAppTheme } from './state.js';

/**
 * EventManager class handles all event listeners and their dependencies
 */
class EventManager {
  static DEBOUNCE_DELAY = 50; // ms
  
  static instance = null;
  
  constructor() {
    // Dependencies
    this.showColors = null;
<<<<<<< Updated upstream
=======
    this.regenerateColorsOnly = null;
    this.regenerateNeutralsOnly = null;
    this.regenerateColorsWithoutChromaNormalization = null;
    this.regenerateColorsWithFreshState = null;
>>>>>>> Stashed changes
    this.initiateRows = null;
    this.initiateColumns = null;
    this.setColorState = null;
    
    // Debounced functions
    this.debouncedShowColors = null;
<<<<<<< Updated upstream
=======
    this.debouncedRegenerateColorsOnly = null;
    this.debouncedRegenerateNeutralsOnly = null;
    this.debouncedRegenerateColorsWithoutChromaNormalization = null;
    this.debouncedRegenerateColorsWithFreshState = null;
>>>>>>> Stashed changes
    this.debouncedInitiateColumns = null;
    this.debouncedInitiateRows = null;
  }
  
  /**
   * Get singleton instance
   * @returns {EventManager} The singleton instance
   */
  static getInstance() {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  /**
   * Creates a debounced version of a function
   * @param {Function} func - The function to debounce
   * @param {number} wait - The debounce delay in milliseconds
   * @returns {Function} The debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  /**
   * Initialize the event manager with required dependencies
   * @param {Object} deps - Dependencies object
   * @returns {boolean} True if initialization was successful
   */
  init(deps) {
<<<<<<< Updated upstream
    if (!deps || !deps.showColors || !deps.initiateRows || !deps.initiateColumns || !deps.setColorState) {
=======
    if (!deps || !deps.showColors || !deps.regenerateColorsOnly || !deps.regenerateNeutralsOnly || !deps.regenerateColorsWithoutChromaNormalization || !deps.regenerateColorsWithFreshState || !deps.initiateRows || !deps.initiateColumns || !deps.setColorState) {
>>>>>>> Stashed changes
      console.error('Missing required dependencies:', deps);
      return false;
    }
    
    try {
      // Store function references
      this.showColors = deps.showColors;
<<<<<<< Updated upstream
=======
      this.regenerateColorsOnly = deps.regenerateColorsOnly;
      this.regenerateNeutralsOnly = deps.regenerateNeutralsOnly;
      this.regenerateColorsWithoutChromaNormalization = deps.regenerateColorsWithoutChromaNormalization;
      this.regenerateColorsWithFreshState = deps.regenerateColorsWithFreshState;
>>>>>>> Stashed changes
      this.initiateRows = deps.initiateRows;
      this.initiateColumns = deps.initiateColumns;
      this.setColorState = deps.setColorState;
      
      // Create debounced versions of functions
<<<<<<< Updated upstream
      this.debouncedShowColors = this.debounce(this.showColors, EventManager.DEBOUNCE_DELAY);
      this.debouncedInitiateColumns = this.debounce(this.initiateColumns, EventManager.DEBOUNCE_DELAY);
      this.debouncedInitiateRows = this.debounce(this.initiateRows, EventManager.DEBOUNCE_DELAY);
=======
      this.debouncedShowColors = this.debounce(this.showColors, this.constructor.DEBOUNCE_DELAY);
      this.debouncedRegenerateColorsOnly = this.debounce(this.regenerateColorsOnly, this.constructor.DEBOUNCE_DELAY);
      this.debouncedRegenerateNeutralsOnly = this.debounce(this.regenerateNeutralsOnly, this.constructor.DEBOUNCE_DELAY);
      this.debouncedRegenerateColorsWithoutChromaNormalization = this.debounce(this.regenerateColorsWithoutChromaNormalization, this.constructor.DEBOUNCE_DELAY);
      this.debouncedRegenerateColorsWithFreshState = this.debounce(this.regenerateColorsWithFreshState, this.constructor.DEBOUNCE_DELAY);
      this.debouncedInitiateColumns = this.debounce(this.initiateColumns, this.constructor.DEBOUNCE_DELAY);
      this.debouncedInitiateRows = this.debounce(this.initiateRows, this.constructor.DEBOUNCE_DELAY);
>>>>>>> Stashed changes
      
      // Create non-debounced version for bezier inputs
      this.immediateShowColors = this.showColors;
      
      return true;
    } catch (error) {
      console.error('Failed to initialize event manager:', error);
      return false;
    }
  }

  /**
   * Helper function to handle async operations safely
   * @param {Function} asyncFunc - The async function to execute
   */
  async handleAsync(asyncFunc) {
    try {
      await asyncFunc();
    } catch (error) {
      console.error('Error in async operation:', error);
    }
  }

  /**
   * Sets up a debounced input handler for the specified element
   * @param {string} id - The ID of the input element
   * @param {string} stateKey - The state key to update
   * @param {Function} transform - Function to transform the input value
   * @param {Function} debouncedFn - The debounced function to call on input
   */
  setupDebouncedInput(id, stateKey, transform = parseFloat, debouncedFn = null) {
    const element = document.getElementById(id);
    if (!element) {
      console.warn(`Element with ID '${id}' not found`);
      return;
    }
    
    const debouncedFunc = debouncedFn || this.debouncedShowColors;
    
    element.addEventListener("input", () => {
      const value = transform(element.value);
      if (!isNaN(value)) {
        this.setColorState({ [stateKey]: value });
        this.handleAsync(debouncedFunc);
      }
    });
  }
  
  /**
   * Sets up all debounced input fields
   */
  setupDebouncedInputs() {
    this.setupDebouncedInput("color-count", "numColors", parseInt, this.debouncedInitiateColumns);
    this.setupDebouncedInput("palette-count", "numPalettes", parseInt, this.debouncedInitiateRows);
    this.setupDebouncedInput("warmth-value", "warmth", parseFloat, this.debouncedInitiateColumns);
    this.setupDebouncedInput("x1-value", "x1");
    this.setupDebouncedInput("y1-value", "y1");
    this.setupDebouncedInput("x2-value", "x2");
    this.setupDebouncedInput("y2-value", "y2");
    this.setupDebouncedInput("chroma-mult-value", "chromaMultiplier");
  }

  /**
   * Sets up the color value input handler
   */
  setupColorValueInput() {
    const colorInput = document.getElementById("color-value");
    if (!colorInput) {
      console.warn('Color input element not found');
      return;
    }
    
    colorInput.addEventListener("input", () => {
      this.setColorState({ baseColor: colorInput.value });
      this.handleAsync(this.debouncedShowColors);
    });
  }

  /**
   * Sets up the theme toggle button
   */
  setupThemeToggle() {
    const themeToggle = document.getElementById("theme-toggle");
    if (!themeToggle) {
      console.warn('Theme toggle button not found');
      return;
    }
    
    themeToggle.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      try {
        await toggleAppTheme();
        await this.handleAsync(this.showColors);
      } catch (error) {
        console.error('Error toggling theme:', error);
      }
    });
  }

  /**
   * Sets up the download button
   */
  setupDownloadButton() {
    const downloadBtn = document.getElementById("download-button");
    if (!downloadBtn) {
      console.warn('Download button not found');
      return;
    }
    
    downloadBtn.addEventListener("click", (event) => {
      event.preventDefault();
      const colors = exportColors();
      downloadJSON(colors, 'color-palette.json');
    });
  }

  /**
   * Sets up contrast controls
   */
  setupContrastControls() {
    const contrastModeSelect = document.getElementById("contrast-mode");
    if (!contrastModeSelect) {
      console.warn('Contrast mode select not found');
      return;
    }
    
    contrastModeSelect.addEventListener("change", async (e) => {
      try {
        const mode = e.target.value;
        // Update the state first
        this.setColorState({ contrastMode: mode });
        
        // Then update the UI based on the new mode
        await toggleContrastMode(mode);
        
        // If switching to auto mode, also trigger auto contrast
        if (mode === 'auto') {
          await this.handleAsync(autoContrast);
        }
      } catch (error) {
        console.error('Error handling contrast mode change:', error);
      }
    });
  }

  /**
   * Sets up contrast listeners
   */
  setupContrastListeners() {
    // Debounced update function for contrast values
    const debouncedUpdateContrast = this.debounce(async (inputElement, contrastKey) => {
      const value = inputElement.value;
      if (value === '') return;
      
      this.setColorState({ 
        contrast: { 
          ...colorState.contrast, 
          [contrastKey]: value 
        },
        contrastMode: 'manual'
      });
      
      await updateContrast();
      refreshAllSwatches();
    }, EventManager.DEBOUNCE_DELAY);

    // Low value input handler
    const lowValueInput = document.getElementById("low-value");
    if (lowValueInput) {
      lowValueInput.addEventListener("input", (e) => {
        debouncedUpdateContrast(e.target, 'low');
      });
    }

    // High value input handler
    const highValueInput = document.getElementById("high-value");
    if (highValueInput) {
      highValueInput.addEventListener("input", (e) => {
        debouncedUpdateContrast(e.target, 'high');
      });
    }
    
    // Low step select handler
    const lowStepSelect = document.getElementById("low-step");
    if (lowStepSelect) {
      lowStepSelect.addEventListener("input", async (e) => {
        const step = parseInt(e.target.value, 10);
        if (!isNaN(step)) {
          // Update the state with the new low step
          this.setColorState({ 
            lowStep: step,
            contrast: {
              ...colorState.contrast
            },
            contrastMode: 'auto'
          });
          
          // If in auto contrast mode, update contrast colors based on new step
          if (colorState.contrastMode === 'auto') {
            await autoContrast();
          }
          
          // Refresh swatches to show updated contrast values
          refreshAllSwatches();
        }
      });
    }
    
    // High step select handler
    const highStepSelect = document.getElementById("high-step");
    if (highStepSelect) {
      highStepSelect.addEventListener("input", async (e) => {
        const step = parseInt(e.target.value, 10);
        if (!isNaN(step)) {
          // Update the state with the new high step
          this.setColorState({ 
            highStep: step,
            contrast: {
              ...colorState.contrast
            },
            contrastMode: 'auto'
          });
          
          // If in auto contrast mode, update contrast colors based on new step
          if (colorState.contrastMode === 'auto') {
            await autoContrast();
          }
          
          // Refresh swatches to show updated contrast values
          refreshAllSwatches();
        }
      });
    }
  }

  /**
   * Sets up all event listeners for the application
   * @param {Object} deps - Dependencies required for initialization
   */
  setupEventListeners(deps) {
    if (!this.init(deps)) {
      console.error('Failed to initialize event listeners: missing dependencies');
      return;
    }
    
    console.log('Setting up event listeners...');
    
    // Set up all the event listeners
    this.setupThemeToggle();
    this.setupDebouncedInputs();
    this.setupColorValueInput();
    this.setupContrastControls();
    this.setupContrastListeners();
    this.setupDownloadButton();
  }
}

// Export singleton instance
export const eventManager = EventManager.getInstance();

// Export the setupEventListeners function
export const setupEventListeners = (deps) => {
  eventManager.setupEventListeners(deps);
};

// Export individual functions needed by other modules
export const setupContrastListeners = () => {
  eventManager.setupContrastListeners();
};

export const setupNudgerListeners = () => {
  // This is a no-op as the nudger listeners are set up in setupEventListeners
  // This export is kept for backward compatibility
};

export const setupHueNudgerListeners = () => {
  // This is a no-op as the hue nudger listeners are set up in setupEventListeners
  // This export is kept for backward compatibility
};
