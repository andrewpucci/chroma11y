<script lang="ts">
  import { onMount } from 'svelte';
  import {
    neutrals,
    palettes,
    numColors,
    numPalettes,
    baseColor,
    warmth,
    chromaMultiplier,
    x1,
    y1,
    x2,
    y2,
    lightnessNudgers,
    hueNudgers,
    currentTheme,
    contrastMode,
    lowStep,
    highStep,
    updateColorState,
    updateContrastFromNeutrals,
    setTheme
  } from '$lib/stores';
  import { getUrlState, updateBrowserUrl, type UrlColorState } from '$lib/urlUtils';
  import { loadStateFromStorage, saveStateToStorage } from '$lib/storageUtils';
  import { announce } from '$lib/announce';

  import { generatePalettes } from '$lib/colorUtils';
  import type { ColorGenParams } from '$lib/colorUtils';

  import ColorControls from '$lib/components/ColorControls.svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import ExportButtons from '$lib/components/ExportButtons.svelte';
  import NeutralPalette from '$lib/components/NeutralPalette.svelte';
  import PaletteGrid from '$lib/components/PaletteGrid.svelte';
  import ContrastControls from '$lib/components/ContrastControls.svelte';

  // Derived values from stores (auto-subscribed)
  let neutralsLocal = $derived($neutrals);
  let palettesLocal = $derived($palettes);
  let lightnessNudgerValues = $derived($lightnessNudgers);
  let hueNudgerValues = $derived($hueNudgers);
  let currentThemeLocal = $derived($currentTheme);
  let contrastModeLocal = $derived($contrastMode);
  let lowStepLocal = $derived($lowStep);
  let highStepLocal = $derived($highStep);

  // Bindable state for controls
  let baseColorLocal = $state('#1862E6');
  let warmthLocal = $state(-7);
  let chromaMultiplierLocal = $state(1.14);
  let numColorsLocal = $state(11);
  let numPalettesLocal = $state(11);
  let x1Local = $state(0.16);
  let y1Local = $state(0.0);
  let x2Local = $state(0.28);
  let y2Local = $state(0.38);

  let urlStateLoaded = $state(false);
  let urlUpdateTimeout: ReturnType<typeof setTimeout> | null = null;
  let colorGenTimeout: ReturnType<typeof setTimeout> | null = null;
  let colorGenId = 0; // Track latest generation request

  // Load initial state from URL or localStorage
  onMount(() => {
    const urlState = getUrlState();
    if (Object.keys(urlState).length > 0) {
      applyUrlState(urlState);
    } else {
      const storedState = loadStateFromStorage();
      if (storedState) {
        applyUrlState(storedState);
      }
    }
    urlStateLoaded = true;

    return () => {
      if (urlUpdateTimeout) clearTimeout(urlUpdateTimeout);
    };
  });

  // Sync local bindable state to stores when they change
  $effect(() => {
    const storeBaseColor = $baseColor;
    const storeWarmth = $warmth;
    const storeChroma = $chromaMultiplier;
    const storeNumColors = $numColors;
    const storeNumPalettes = $numPalettes;
    const storeX1 = $x1;
    const storeY1 = $y1;
    const storeX2 = $x2;
    const storeY2 = $y2;

    baseColorLocal = storeBaseColor;
    warmthLocal = storeWarmth;
    chromaMultiplierLocal = storeChroma;
    numColorsLocal = storeNumColors;
    numPalettesLocal = storeNumPalettes;
    x1Local = storeX1;
    y1Local = storeY1;
    x2Local = storeX2;
    y2Local = storeY2;
  });

  // Generate colors when parameters change (debounced to prevent race conditions)
  $effect(() => {
    // Access all parameters directly to establish reactive dependencies
    const _numColors = numColorsLocal;
    const _numPalettes = numPalettesLocal;
    const _baseColor = baseColorLocal;
    const _warmth = warmthLocal;
    const _chroma = chromaMultiplierLocal;
    const _x1 = x1Local;
    const _y1 = y1Local;
    const _x2 = x2Local;
    const _y2 = y2Local;
    const _theme = currentThemeLocal;
    const _lightnessNudgers = lightnessNudgerValues;
    const _hueNudgers = hueNudgerValues;
    void _numColors, _numPalettes, _baseColor, _warmth, _chroma, _x1, _y1, _x2, _y2, _theme, _lightnessNudgers, _hueNudgers;

    // Debounce color generation to prevent race conditions during rapid changes
    if (colorGenTimeout) clearTimeout(colorGenTimeout);
    const currentGenId = ++colorGenId;

    colorGenTimeout = setTimeout(() => {
      // Only proceed if this is still the latest generation request
      if (currentGenId === colorGenId && urlStateLoaded) {
        generateColors();
      }
    }, 16); // ~60fps debounce for smooth slider interactions

    return () => {
      if (colorGenTimeout) {
        clearTimeout(colorGenTimeout);
        colorGenTimeout = null;
      }
    };
  });

  // Update URL and localStorage when state changes (debounced)
  $effect(() => {
    if (!urlStateLoaded) return;

    // Access all reactive values to track them
    const state: UrlColorState = {
      baseColor: baseColorLocal,
      warmth: warmthLocal,
      chromaMultiplier: chromaMultiplierLocal,
      numColors: numColorsLocal,
      numPalettes: numPalettesLocal,
      x1: x1Local,
      y1: y1Local,
      x2: x2Local,
      y2: y2Local,
      theme: currentThemeLocal,
      contrastMode: contrastModeLocal,
      lowStep: lowStepLocal,
      highStep: highStepLocal,
      lightnessNudgers: lightnessNudgerValues,
      hueNudgers: hueNudgerValues
    };

    // Clear any existing timeout before setting new one
    if (urlUpdateTimeout) {
      clearTimeout(urlUpdateTimeout);
    }

    // Create new timeout and capture ID for cleanup
    urlUpdateTimeout = setTimeout(() => {
      updateBrowserUrl(state);
      saveStateToStorage(state);
    }, 500);

    // Cleanup function clears the module-level timeout
    return () => {
      if (urlUpdateTimeout) {
        clearTimeout(urlUpdateTimeout);
        urlUpdateTimeout = null;
      }
    };
  });

  function applyUrlState(urlState: UrlColorState) {
    if (urlState.theme) {
      setTheme(urlState.theme);
    }

    const stateUpdate: Record<string, unknown> = {};

    if (urlState.baseColor) stateUpdate.baseColor = urlState.baseColor;
    if (urlState.warmth !== undefined) stateUpdate.warmth = urlState.warmth;
    if (urlState.chromaMultiplier !== undefined)
      stateUpdate.chromaMultiplier = urlState.chromaMultiplier;
    if (urlState.numColors !== undefined) stateUpdate.numColors = urlState.numColors;
    if (urlState.numPalettes !== undefined) stateUpdate.numPalettes = urlState.numPalettes;
    if (urlState.x1 !== undefined) stateUpdate.x1 = urlState.x1;
    if (urlState.y1 !== undefined) stateUpdate.y1 = urlState.y1;
    if (urlState.x2 !== undefined) stateUpdate.x2 = urlState.x2;
    if (urlState.y2 !== undefined) stateUpdate.y2 = urlState.y2;
    if (urlState.contrastMode) stateUpdate.contrastMode = urlState.contrastMode;
    if (urlState.lowStep !== undefined) stateUpdate.lowStep = urlState.lowStep;
    if (urlState.highStep !== undefined) stateUpdate.highStep = urlState.highStep;
    if (urlState.lightnessNudgers) stateUpdate.lightnessNudgers = urlState.lightnessNudgers;
    if (urlState.hueNudgers) stateUpdate.hueNudgers = urlState.hueNudgers;

    if (Object.keys(stateUpdate).length > 0) {
      updateColorState(stateUpdate);
    }
  }

  function generateColors() {
    const params: ColorGenParams = {
      numColors: numColorsLocal,
      numPalettes: numPalettesLocal,
      baseColor: baseColorLocal,
      warmth: warmthLocal,
      x1: x1Local,
      y1: y1Local,
      x2: x2Local,
      y2: y2Local,
      chromaMultiplier: chromaMultiplierLocal,
      currentTheme: currentThemeLocal,
      lightnessNudgers: lightnessNudgerValues,
      hueNudgers: hueNudgerValues
    };

    try {
      const result = generatePalettes(params, true);
      // Atomic update to prevent race conditions
      updateColorState({
        neutrals: result.neutrals,
        palettes: result.palettes
      });
      // Update contrast after neutrals are set
      updateContrastFromNeutrals();
    } catch (error) {
      console.error('Error generating colors:', error);
      announce('Error generating colors. Please check your color settings and try again.');
      updateColorState({
        neutrals: [],
        palettes: []
      });
    }
  }
</script>

<a href="#main-content" class="skip-link">Skip to main content</a>
<div class="container" role="application" aria-label="Color Generator">
  <!-- Left Column: Controls -->
  <div class="controls-column">
    <header class="header">
      <h1 id="main-heading">Svelte Color Generator</h1>
      <p>Advanced color generation using OKLCH color space</p>
    </header>

    <section class="controls">
      <ThemeToggle />
      <ExportButtons neutrals={neutralsLocal} palettes={palettesLocal} />
      <ContrastControls />
    </section>

    <ColorControls
      bind:baseColor={baseColorLocal}
      bind:warmth={warmthLocal}
      bind:chromaMultiplier={chromaMultiplierLocal}
      bind:numColors={numColorsLocal}
      bind:numPalettes={numPalettesLocal}
      bind:x1={x1Local}
      bind:y1={y1Local}
      bind:x2={x2Local}
      bind:y2={y2Local}
    />
  </div>

  <!-- Right Column: Palettes -->
  <div class="palettes-column" id="main-content" role="region" aria-labelledby="main-heading">
    <NeutralPalette bind:neutrals={neutralsLocal} bind:lightnessNudgerValues />
    <PaletteGrid palettes={palettesLocal} bind:hueNudgerValues />
  </div>
</div>

<style>
  .container {
    height: 100vh;
    padding: 0;
    box-sizing: border-box;
    overflow: hidden;
    display: flex;
    flex-direction: row;
  }

  .controls-column {
    width: 420px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: var(--column-padding);
    background: var(--bg-primary);
    border-right: 1px solid var(--border);
    overflow-y: auto;
  }

  .palettes-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-height: 0;
    overflow-y: auto;
    padding: var(--column-padding);
    container-type: inline-size;
  }

  /* Mobile-first responsive layout */
  @media (max-width: 768px) {
    .container {
      flex-direction: column;
      height: auto;
      min-height: 100vh;
    }

    .controls-column {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid var(--border);
      overflow-y: visible;
      max-height: none;
    }

    .palettes-column {
      flex: 1;
      min-height: 50vh;
    }

    .header h1 {
      font-size: 1.75rem;
    }

    .header p {
      font-size: 0.875rem;
    }
  }

  /* Extra small devices (phones in portrait, less than 576px) */
  @media (max-width: 575px) {
    .header h1 {
      font-size: 1.5rem;
    }

    .header p {
      font-size: 0.8rem;
    }
  }

  /* Responsive chip sizing */
  .palettes-column {
    --chip-size: 15px;
    --show-names: 0;
  }

  /* When space is tight, hide names and make chips smaller */
  @container (max-height: 800px) {
    .palettes-column {
      --chip-size: 12px;
      --show-names: 0;
    }
  }

  @container (max-height: 600px) {
    .palettes-column {
      --chip-size: 10px;
      --show-names: 0;
    }
  }

  .header {
    text-align: center;
    margin-bottom: 1rem;
  }

  .header h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, var(--accent), var(--accent-hover));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .header p {
    color: var(--text-secondary);
    font-size: 1rem;
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
