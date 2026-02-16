<script lang="ts">
  import { onDestroy } from 'svelte';
  import BezierEditor from './BezierEditor.svelte';

  interface Props {
    baseColor?: string;
    warmth?: number;
    chromaMultiplier?: number;
    numColors?: number;
    numPalettes?: number;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    onRangeDragStart?: () => void;
    onRangeDragEnd?: () => void;
  }

  let {
    baseColor = $bindable('#1862E6'),
    warmth = $bindable(0),
    chromaMultiplier = $bindable(1),
    numColors = $bindable(5),
    numPalettes = $bindable(1),
    x1 = $bindable(0),
    y1 = $bindable(0),
    x2 = $bindable(1),
    y2 = $bindable(1),
    onRangeDragStart,
    onRangeDragEnd
  }: Props = $props();

  let isDraggingCounts = $state(false);
  let activePointerId: number | null = $state(null);
  let hasWindowListeners = false;

  function cleanupWindowListeners() {
    if (!hasWindowListeners) return;
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('pointercancel', handlePointerCancel);
    hasWindowListeners = false;
    activePointerId = null;
  }

  function handlePointerDown(e: PointerEvent) {
    isDraggingCounts = true;
    activePointerId = e.pointerId;
    onRangeDragStart?.();
    if (!hasWindowListeners) {
      hasWindowListeners = true;
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerCancel);
    }
  }

  function finalizeDrag() {
    cleanupWindowListeners();
    isDraggingCounts = false;
    // Defer layout unfreeze to the next frame so the browser's native
    // range-input handling finishes with the frozen layout geometry first.
    // This prevents the pointer position from being remapped to a shifted slider.
    requestAnimationFrame(() => {
      onRangeDragEnd?.();
    });
  }

  function handlePointerUp(e: PointerEvent) {
    if (activePointerId !== null && e.pointerId !== activePointerId) return;
    finalizeDrag();
  }

  function handlePointerCancel(e: PointerEvent) {
    if (activePointerId !== null && e.pointerId !== activePointerId) return;
    finalizeDrag();
  }

  function handleKeyboardInput() {
    if (!isDraggingCounts) {
      onRangeDragEnd?.();
    }
  }

  onDestroy(() => {
    cleanupWindowListeners();
  });
</script>

<section class="generator-controls">
  <div class="control-grid">
    <div class="field base-color">
      <label class="label" for="baseColor">Base Color</label>
      <div class="base-color-row">
        <input id="baseColor" type="color" bind:value={baseColor} aria-describedby="baseColorHex" />
        <input
          id="baseColorHex"
          class="input"
          type="text"
          bind:value={baseColor}
          placeholder="#1862E6"
          aria-label="Base color hex value"
        />
      </div>
    </div>

    <div class="field">
      <label class="label" for="warmth">Warmth ({warmth})</label>
      <div class="slider-wrapper">
        <input id="warmth" type="range" min="-50" max="50" bind:value={warmth} />
      </div>
    </div>

    <div class="field">
      <label class="label" for="saturation">Saturation ({chromaMultiplier.toFixed(2)})</label>
      <div class="slider-wrapper">
        <input
          id="saturation"
          type="range"
          min="0"
          max="2"
          step="0.01"
          bind:value={chromaMultiplier}
        />
      </div>
    </div>

    <div class="field">
      <label class="label" for="numColors">Number of Colors ({numColors})</label>
      <div class="slider-wrapper">
        <input
          id="numColors"
          type="range"
          min="2"
          max="20"
          bind:value={numColors}
          onpointerdown={handlePointerDown}
          oninput={handleKeyboardInput}
        />
      </div>
    </div>

    <div class="field">
      <label class="label" for="numPalettes">Number of Palettes ({numPalettes})</label>
      <div class="slider-wrapper">
        <input
          id="numPalettes"
          type="range"
          min="1"
          max="11"
          bind:value={numPalettes}
          onpointerdown={handlePointerDown}
          oninput={handleKeyboardInput}
        />
      </div>
    </div>
  </div>

  <div class="divider"></div>

  <div class="bezier-section">
    <div class="bezier-title">Bezier Curve</div>
    <BezierEditor bind:x1 bind:y1 bind:x2 bind:y2 />
  </div>
</section>

<style>
  .generator-controls {
    display: grid;
    gap: var(--space-md);
    container-type: inline-size;
  }

  .control-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }

  input[type='range'] {
    width: 100%;
  }

  .base-color-row {
    display: grid;
    grid-template-columns: 56px 1fr;
    gap: var(--space-sm);
    align-items: center;
  }

  .base-color-row input[type='color'] {
    width: 56px;
    height: var(--touch-target-comfortable);
    padding: 0;
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    cursor: pointer;
    appearance: none;
  }

  .base-color-row input[type='color']::-webkit-color-swatch-wrapper {
    padding: 0;
    border: none;
    border-radius: var(--radius-md);
  }

  .base-color-row input[type='color']::-webkit-color-swatch {
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  .base-color-row input[type='color']::-moz-color-swatch {
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  .divider {
    height: 1px;
    background: color-mix(in oklab, var(--border) 60%, transparent);
    margin: var(--space-xs) 0;
  }

  .bezier-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
  }

  @container (max-width: 980px) and (min-width: 770px) {
    .generator-controls {
      grid-template-columns: 1fr 1fr;
      align-items: start;
    }

    .control-grid {
      grid-column: 1;
    }

    .bezier-section {
      grid-column: 2;
      align-content: start;
    }

    .divider {
      display: none;
    }
  }

  .bezier-section {
    display: grid;
    gap: var(--space-sm);
  }

  /* Touch-friendly on mobile */
  @media (max-width: 768px) {
    input[type='range'] {
      height: var(--touch-target-comfortable);
      touch-action: manipulation;
    }
  }

  .slider-wrapper:focus-within {
    outline: 3px solid white;
    box-shadow: 0 0 0 6px black;
  }

  .slider-wrapper input:focus-visible {
    outline: none;
    box-shadow: none;
  }

  .slider-wrapper {
    width: 100%;
    padding: 0 var(--space-sm);
    box-sizing: border-box;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
