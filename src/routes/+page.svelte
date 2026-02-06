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
    void _numColors;
    void _numPalettes;
    void _baseColor;
    void _warmth;
    void _chroma;
    void _x1;
    void _y1;
    void _x2;
    void _y2;
    void _theme;
    void _lightnessNudgers;
    void _hueNudgers;

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
<div class="app-shell" role="application" aria-label="Color Generator">
  <header class="topbar">
    <div class="topbar-inner">
      <div class="brand">
        <h1 id="main-heading">Svelte Color Generator</h1>
        <p class="tagline">Advanced color generation using OKLCH color space</p>
      </div>

      <div class="topbar-actions">
        <ThemeToggle />
      </div>
    </div>
  </header>

  <div class="layout" data-testid="app-layout">
    <aside class="sidebar" aria-label="Controls" data-testid="app-sidebar">
      <div class="sidebar-inner">
        <section class="card">
          <div class="card-header">
            <div class="card-title">Generation</div>
            <div class="card-subtitle">Tune the palette curve and appearance</div>
          </div>
          <div class="card-body">
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
        </section>

        <section class="card">
          <div class="card-header">
            <div class="card-title">Contrast</div>
            <div class="card-subtitle">Set references for WCAG contrast ratios</div>
          </div>
          <div class="card-body">
            <ContrastControls />
          </div>
        </section>

        <section class="card">
          <div class="card-header">
            <div class="card-title">Export</div>
            <div class="card-subtitle">Download tokens in common formats</div>
          </div>
          <div class="card-body">
            <ExportButtons neutrals={neutralsLocal} palettes={palettesLocal} />
          </div>
        </section>
      </div>
    </aside>

    <main
      class="content"
      id="main-content"
      role="region"
      aria-labelledby="main-heading"
      data-testid="app-content"
    >
      <div class="content-inner">
        <NeutralPalette bind:neutrals={neutralsLocal} bind:lightnessNudgerValues />
        <PaletteGrid palettes={palettesLocal} bind:hueNudgerValues />
      </div>
    </main>
  </div>
</div>

<style>
  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background:
      radial-gradient(
        1200px 600px at 0% 0%,
        color-mix(in oklab, var(--accent) 14%, transparent),
        transparent
      ),
      var(--bg-primary);
  }

  .topbar {
    position: sticky;
    top: 0;
    z-index: 10;
    background: color-mix(in oklab, var(--bg-primary) 88%, transparent);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid color-mix(in oklab, var(--border) 70%, transparent);
  }

  .topbar-inner {
    max-width: var(--container-max);
    margin: 0 auto;
    padding: 1rem var(--column-padding);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .brand {
    display: grid;
    gap: 0.25rem;
  }

  .brand h1 {
    font-size: 1.35rem;
    font-weight: 750;
    letter-spacing: -0.03em;
  }

  .tagline {
    font-size: 0.9rem;
    color: var(--text-secondary);
  }

  .layout {
    flex: 1;
    max-width: var(--container-max);
    margin: 0 auto;
    width: 100%;
    display: grid;
    grid-template-columns: var(--control-width) 1fr;
    gap: 1rem;
    padding: 1rem var(--column-padding) 1.25rem var(--column-padding);
    min-height: 0;
  }

  .sidebar {
    min-height: 0;
  }

  .sidebar-inner {
    position: sticky;
    top: 86px;
    display: grid;
    gap: 0.9rem;
    max-height: calc(100vh - 110px);
    overflow: auto;
    padding-right: 2px;
  }

  .content {
    min-height: 0;
  }

  .content-inner {
    display: grid;
    gap: 1rem;
    min-height: 0;
  }

  @media (max-width: 980px) {
    .layout {
      grid-template-columns: 1fr;
    }

    .sidebar-inner {
      position: static;
      max-height: none;
      overflow: visible;
    }
  }

  @media (max-width: 520px) {
    .topbar-inner {
      flex-direction: column;
      align-items: flex-start;
    }

    .brand h1 {
      font-size: 1.2rem;
    }
  }
</style>
