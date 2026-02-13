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
  import ExportButtons from '$lib/components/ExportButtons.svelte';
  import NeutralPalette from '$lib/components/NeutralPalette.svelte';
  import PaletteGrid from '$lib/components/PaletteGrid.svelte';
  import ContrastControls from '$lib/components/ContrastControls.svelte';
  import Card from '$lib/components/Card.svelte';
  import AppHeader from '$lib/components/AppHeader.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';

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
  let layoutEl: HTMLElement | undefined = $state();
  let topbarInnerEl: HTMLElement | undefined = $state();
  let isDraggingSlider = $state(false);

  function freezeLayout() {
    isDraggingSlider = true;
    if (layoutEl) {
      const width = layoutEl.offsetWidth + 'px';
      layoutEl.style.minWidth = width;
      layoutEl.style.maxWidth = width;
    }
    if (topbarInnerEl) {
      const width = topbarInnerEl.offsetWidth + 'px';
      topbarInnerEl.style.minWidth = width;
      topbarInnerEl.style.maxWidth = width;
    }
  }

  function unfreezeLayout() {
    isDraggingSlider = false;
    if (layoutEl) {
      layoutEl.style.minWidth = '';
      layoutEl.style.maxWidth = '';
    }
    if (topbarInnerEl) {
      topbarInnerEl.style.minWidth = '';
      topbarInnerEl.style.maxWidth = '';
    }
  }

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
    const _isDragging = isDraggingSlider;
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

    // Skip generation while dragging to prevent layout reflow
    if (_isDragging || !urlStateLoaded) return;

    // Debounce color generation to prevent race conditions during rapid changes
    if (colorGenTimeout) clearTimeout(colorGenTimeout);
    const currentGenId = ++colorGenId;

    colorGenTimeout = setTimeout(() => {
      if (currentGenId === colorGenId) {
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
<div
  class="app-shell"
  role="application"
  aria-label="Chroma11y"
  style="--num-colors: {numColorsLocal};"
>
  <AppHeader bind:bindInner={topbarInnerEl} />

  <div class="layout" data-testid="app-layout" bind:this={layoutEl}>
    <Sidebar>
      <Card title="Generation" subtitle="Control how colors are distributed across the palette">
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
          onRangeDragStart={freezeLayout}
          onRangeDragEnd={unfreezeLayout}
        />
      </Card>

      <Card title="Contrast" subtitle="Configure contrast reference points">
        <ContrastControls />
      </Card>

      <Card title="Export" subtitle="Download tokens in common formats">
        <ExportButtons neutrals={neutralsLocal} palettes={palettesLocal} />
      </Card>
    </Sidebar>

    <main
      class="content"
      id="main-content"
      role="region"
      aria-labelledby="main-heading"
      data-testid="app-content"
    >
      <div class="content-inner">
        <NeutralPalette neutrals={neutralsLocal} lightnessNudgerValues={lightnessNudgerValues} />
        <PaletteGrid palettes={palettesLocal} hueNudgerValues={hueNudgerValues} />
      </div>
    </main>
  </div>
</div>

<style>
  .app-shell {
    --content-width: calc(
      var(--control-width) + var(--layout-gap) + (var(--num-colors) * var(--swatch-width)) +
        ((var(--num-colors) - 1) * var(--swatch-gap)) + (var(--card-padding) * 2) +
        (var(--card-border-width) * 2) + (var(--column-padding) * 2) +
        (var(--palette-block-padding) * 2) + (var(--palette-block-border-width) * 2)
    );
    --container-max: min(
      var(--content-width),
      min(var(--container-vw), var(--container-max-limit))
    );

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

  .layout {
    flex: 1;
    max-width: var(--container-max);
    margin: 0 auto;
    width: 100%;
    display: grid;
    grid-template-columns: var(--control-width) 1fr;
    gap: var(--layout-gap);
    padding: var(--layout-gap) var(--column-padding) 1.25rem var(--column-padding);
    min-height: 0;
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
      padding: var(--layout-gap) 0.5rem 1.25rem 0.5rem;
      max-width: none;
    }
  }
</style>
