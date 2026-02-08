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
  let activeInput: HTMLInputElement | null = null;
  let hasWindowListeners = $state(false);

  function cleanupWindowListeners() {
    if (!hasWindowListeners) return;
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('pointercancel', handlePointerCancel);
    hasWindowListeners = false;
    activePointerId = null;
    activeInput = null;
  }

  function handlePointerDown(e: PointerEvent) {
    isDraggingCounts = true;
    activePointerId = e.pointerId;
    activeInput = e.currentTarget as HTMLInputElement;
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
          class="input mono"
          type="text"
          bind:value={baseColor}
          placeholder="#1862E6"
          aria-label="Base color hex value"
        />
      </div>
    </div>

    <div class="field">
      <label class="label" for="warmth">Warmth ({warmth})</label>
      <input id="warmth" type="range" min="-50" max="50" bind:value={warmth} />
    </div>

    <div class="field">
      <label class="label" for="chroma">Chroma Multiplier ({chromaMultiplier.toFixed(2)})</label>
      <input id="chroma" type="range" min="0.1" max="2" step="0.01" bind:value={chromaMultiplier} />
    </div>

    <div class="field">
      <label class="label" for="numColors">Number of Colors ({numColors})</label>
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

    <div class="field">
      <label class="label" for="numPalettes">Number of Palettes ({numPalettes})</label>
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

  <div class="divider"></div>

  <div class="bezier-section">
    <div class="bezier-title">Bezier Curve</div>
    <BezierEditor bind:x1 bind:y1 bind:x2 bind:y2 />
  </div>
</section>

<style>
  .generator-controls {
    display: grid;
    gap: 0.9rem;
  }

  .control-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.9rem;
  }

  input[type='range'] {
    width: 100%;
    margin-top: 0.25rem;
  }

  .base-color-row {
    display: grid;
    grid-template-columns: 56px 1fr;
    gap: 0.6rem;
    align-items: center;
  }

  .base-color-row input[type='color'] {
    width: 56px;
    height: 44px;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: transparent;
    cursor: pointer;
  }

  .divider {
    height: 1px;
    background: color-mix(in oklab, var(--border) 60%, transparent);
    margin: 0.25rem 0;
  }

  .bezier-title {
    font-size: 0.95rem;
    font-weight: 650;
    color: var(--text-primary);
  }

  @media (max-width: 980px) and (min-width: 770px) {
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
    gap: 0.5rem;
  }

  /* Touch-friendly on mobile */
  @media (max-width: 768px) {
    input[type='range'] {
      height: 44px;
      touch-action: manipulation;
    }
  }

</style>
