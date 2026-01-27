import { getPrintableContrast, formatColor, getContrast, setContrastMode, getPaletteName } from "./colorUtils.js";
import { colorState } from "./state.js";
import { setupContrastListeners, setupNudgerListeners, setupHueNudgerListeners } from "./events.js";

export const updateUI = (neutrals, lightContrast, darkContrast) => {
    const neutralsContainer = document.getElementById("neutrals");
    neutralsContainer.innerHTML = `<ul class="neutral">${"<li></li>".repeat(neutrals.length + 1)}</ul>`;
    
    neutrals.forEach((color, index) => {
        const $li = neutralsContainer.querySelector(`.neutral li:nth-child(${index + 2})`);
        printSwatch($li, color, lightContrast, darkContrast);
    });
};

export const updateControlsFromState = () => {
  // Update all form controls
  document.getElementById("color-count").value = colorState.numColors;
  document.getElementById("palette-count").value = colorState.numPalettes;
  document.getElementById("warmth-value").value = colorState.warmth;
  document.getElementById("x1-value").value = colorState.x1;
  document.getElementById("y1-value").value = colorState.y1;
  document.getElementById("x2-value").value = colorState.x2;
  document.getElementById("y2-value").value = colorState.y2;
  document.getElementById("chroma-mult-value").value = colorState.chromaMultiplier;
  document.getElementById("color-value").value = colorState.baseColor;
  document.getElementById("high-value").value = colorState.contrast.high;
  document.getElementById("low-value").value = colorState.contrast.low;
  
  // Ensure high-step and low-step select elements are properly updated
  const highStepSelect = document.getElementById("high-step");
  const lowStepSelect = document.getElementById("low-step");
  
  if (highStepSelect) {
    // Force the select to update by removing and re-adding the selected attribute
    const highStepOption = highStepSelect.querySelector(`option[value="${colorState.highStep}"]`);
    if (highStepOption) {
      highStepSelect.value = colorState.highStep;
      highStepOption.selected = true;
    }
  }
  
  if (lowStepSelect) {
    const lowStepOption = lowStepSelect.querySelector(`option[value="${colorState.lowStep}"]`);
    if (lowStepOption) {
      lowStepSelect.value = colorState.lowStep;
      lowStepOption.selected = true;
    }
  }
  
  document.getElementById("contrast-mode").value = colorState.contrastMode;
  
  console.log('[updateControlsFromState] Updated controls', {
    highStep: colorState.highStep,
    lowStep: colorState.lowStep,
    highStepElement: highStepSelect ? highStepSelect.value : 'not found',
    lowStepElement: lowStepSelect ? lowStepSelect.value : 'not found'
  });
};

/**
 * Updates the text color CSS variables and state based on the contrast type
 * @param {string} textType - Either 'low' or 'high' to indicate which contrast color to update
 * @param {string} color - The color value to set (in hex format)
 */
export const updateTextColor = (textType, color) => {
  const root = document.documentElement;
  
  // Update CSS variable
  const varName = `--${textType}-text-color`;
  root.style.setProperty(varName, color);
  
  // Update state to keep in sync
  if (textType === 'low' || textType === 'high') {
    setColorState({
      contrast: {
        ...colorState.contrast,
        [textType]: color
      }
    }, false); // Don't trigger UI update to avoid loops
  }
};

export const addLightnessNudgers = () => {  
  let nudgers = `<div class="nudgers row"><div></div>`;
  const lowStepSelect = document.getElementById("low-step");
  const highStepSelect = document.getElementById("high-step");
  lowStepSelect.length = 0;
  highStepSelect.length = 0;
  colorState.neutrals.forEach((neutral, index) => {
    nudgers = nudgers.concat(`<div><label for="nudger-${index}">${(index * 10)}</label><input id="nudger-${index}" class="nudger-input" type="number" value=0 step=0.01 /></div>`);
    
    // Add options to contrast reference dropdowns
    const optLow = document.createElement("option");
    optLow.value = index;
    optLow.text = `${index * 10}`;
    lowStepSelect.add(optLow);
    const optHigh = document.createElement("option");
    optHigh.value = index;
    optHigh.text = `${index * 10}`;
    highStepSelect.add(optHigh);
  });
  
  // Ensure highStep is within valid range (0-10)
  const maxStepIndex = colorState.neutrals.length - 1;
  const currentHighStep = Math.min(Math.max(0, colorState.highStep), maxStepIndex);
  
  // Update state with validated step values
  colorState.lowStep = 0;  // Always start at 0 for low step
  colorState.highStep = currentHighStep;
  
  // Update UI with current step values
  lowStepSelect.value = 0;
  highStepSelect.value = currentHighStep;
  
  // Watch for changes on contrast reference dropdowns
  setupContrastListeners();
  
  // Render the nudgers
  document.getElementById("nudgers").innerHTML = nudgers.concat('</div>');
  
  // Watch for changes on nudgers
  setupNudgerListeners();
};

export const scaffoldPalettes = () => {
  let $div = document.getElementById("palettes");
  $div.innerHTML = "";
  
  for (var index = 0; index < colorState.numPalettes; index++) {
    const rowContent = `<ul class="generated-${index} generated-hue"><li><label for="hue-nudger-${index}" id="hue-nudger-label-${index}">Color Name</label><input id="hue-nudger-${index}" class="hue-nudger-input" type="number" value=0 step=1 /></div></li>${"<li></li>".repeat(colorState.numColors)}</ul>`;
    $div.innerHTML = $div.innerHTML + rowContent;
  }
  
  // Watch for changes on hue nudgers
  setupHueNudgerListeners();
};

/**
 * Renders a color swatch with appropriate contrast text
 * @param {HTMLElement} target - The target element to render the swatch in
 * @param {Object} color - The color object to render
 */
export const printSwatch = (target, color) => {
  if (!target) return;
  
  const formattedColor = formatColor(color);
  const lowContrast = colorState.contrast.low;
  const highContrast = colorState.contrast.high;
  
  // Set background color
  target.style.backgroundColor = formattedColor;
  
  // Set content with contrast values (background, text)
  target.innerHTML = `
    ${formattedColor}
    <br>
    <span class="low">${getPrintableContrast(formattedColor, lowContrast)}</span>
    <br>
    <span class="high">${getPrintableContrast(formattedColor, highContrast)}</span>
  `;
  
  // Get current contrast values from state
  const currentLowContrast = colorState.contrast.low;
  const currentHighContrast = colorState.contrast.high;
  
  // Calculate contrast ratios - Note: getContrast(background, text)
  const minContrastRatio = 4.5;
  const lowContrastRatio = getContrast(formattedColor, currentLowContrast); // Background first, then text
  const highContrastRatio = getContrast(formattedColor, currentHighContrast); // Background first, then text
  
  
  // Always use the highest contrast option that meets the minimum ratio
  if (highContrastRatio >= minContrastRatio && highContrastRatio > lowContrastRatio) {
    // High contrast text is readable, use it
    target.style.color = 'var(--high-text-color)';
  } else if (lowContrastRatio >= minContrastRatio) {
    // Fall back to low contrast text if it meets the minimum
    target.style.color = 'var(--low-text-color)';
  } else {
    // If neither meets the minimum, use the one with better contrast
    target.style.color = highContrastRatio > lowContrastRatio 
      ? 'var(--high-text-color)' 
      : 'var(--low-text-color)';
  }
};

export const printNeutrals = () => {
  document.getElementById("neutrals").innerHTML = `</div><ul class="neutral">${"<li></li>".repeat(colorState.neutrals.length + 1)}</ul>`;
  document.querySelector(".neutral li:first-child").textContent = getPaletteName(colorState.neutrals);
  colorState.neutrals.forEach((color, index) => {
    const $li = document.querySelector(`.neutral li:nth-child(${parseInt(index) + 2})`);
    printSwatch($li, color);
  });
};

export const printPalettes = () => {
  for (let i = 0; i < colorState.palettes.length; i++) {
    const colorName = getPaletteName(colorState.palettes[i]);
    document.getElementById(`hue-nudger-label-${i}`).textContent = colorName;

    Object.entries(colorState.palettes[i]).forEach(([idx, color]) => {
      const $li = document.querySelector(
        `.generated-${i} li:nth-child(${parseInt(idx) + 2})`
      );
      printSwatch($li, color);
    });
  }
};

/**
 * Toggles between auto and manual contrast modes and updates the UI
 * @returns {Promise<void>}
 */
export const toggleContrastMode = async (mode) => {
  // Update visibility of manual/auto mode controls based on the current mode
  const isAutoMode = (mode || colorState.contrastMode) === 'auto';
  
  document.querySelectorAll(".manual-mode").forEach(element => {
    element.classList.toggle("d-none", isAutoMode);
  });
  
  document.querySelectorAll(".auto-mode").forEach(element => {
    element.classList.toggle("d-none", !isAutoMode);
  });
  
  // Update contrast colors based on current mode
  await setContrastMode();
  
  // Refresh all swatches to show updated contrast values
  refreshAllSwatches();
};

/**
 * Refreshes all swatches to show current contrast values
 */
export const refreshAllSwatches = () => {
  // Refresh neutral swatches
  colorState.neutrals.forEach((color, index) => {
    const $li = document.querySelector(`.neutral li:nth-child(${index + 2})`);
    if ($li) {
      printSwatch($li, color);
    }
  });
  
  // Refresh palette swatches
  colorState.palettes.forEach((palette, paletteIndex) => {
    palette.forEach((color, colorIndex) => {
      const $li = document.querySelector(`.generated-${paletteIndex} li:nth-child(${colorIndex + 2})`);
      if ($li) {
        printSwatch($li, color);
      }
    });
  });
};