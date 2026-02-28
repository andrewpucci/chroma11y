<script lang="ts">
  import { onDestroy } from 'svelte';
  import BezierEditor from './BezierEditor.svelte';
  import SliderNumberField from './SliderNumberField.svelte';
  import { getChromaMultiplierBounds } from '$lib/chromaMultiplier';
  import type { GamutSpace } from '$lib/types';

  interface Props {
    baseColor?: string;
    warmth?: number;
    chromaMultiplier?: number;
    gamutSpace?: GamutSpace;
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
    gamutSpace = 'srgb',
    numColors = $bindable(5),
    numPalettes = $bindable(1),
    x1 = $bindable(0),
    y1 = $bindable(0),
    x2 = $bindable(1),
    y2 = $bindable(1),
    onRangeDragStart,
    onRangeDragEnd
  }: Props = $props();

  interface RangeConfig {
    min: number;
    max: number;
    step: number;
  }

  const WARMTH_RANGE: RangeConfig = { min: -50, max: 50, step: 1 };
  const NUM_COLORS_RANGE: RangeConfig = { min: 2, max: 20, step: 1 };
  const NUM_PALETTES_RANGE: RangeConfig = { min: 1, max: 11, step: 1 };
  const SATURATION_STEP = 0.01;

  const saturationBounds = $derived(getChromaMultiplierBounds(gamutSpace));
  const SATURATION_RANGE = $derived<RangeConfig>({
    min: saturationBounds.min,
    max: saturationBounds.max,
    step: SATURATION_STEP
  });

  let isDraggingCounts = $state(false);
  let activePointerId: number | null = $state(null);
  let hasWindowListeners = false;

  function getStepPrecision(stepValue: number): number {
    if (!Number.isFinite(stepValue) || stepValue <= 0) return 0;
    const serialized = stepValue.toString();
    const pointIndex = serialized.indexOf('.');
    return pointIndex === -1 ? 0 : serialized.length - pointIndex - 1;
  }

  function clampToRange(rawValue: number, min: number, max: number, step: number): number {
    if (!Number.isFinite(rawValue)) return min;
    const clamped = Math.max(min, Math.min(max, rawValue));
    if (!Number.isFinite(step) || step <= 0) {
      return clamped;
    }
    const stepped = min + Math.round((clamped - min) / step) * step;
    const precision = getStepPrecision(step);
    return Number(Math.max(min, Math.min(max, stepped)).toFixed(precision));
  }

  function clampWithRange(rawValue: number, range: RangeConfig): number {
    return clampToRange(rawValue, range.min, range.max, range.step);
  }

  function clampWarmthFromInput() {
    warmth = clampWithRange(warmth, WARMTH_RANGE);
  }

  function clampSaturationFromInput() {
    chromaMultiplier = clampWithRange(chromaMultiplier, SATURATION_RANGE);
  }

  function clampNumColorsFromInput() {
    numColors = clampWithRange(numColors, NUM_COLORS_RANGE);
  }

  function clampNumPalettesFromInput() {
    numPalettes = clampWithRange(numPalettes, NUM_PALETTES_RANGE);
  }

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
        <input
          id="baseColor"
          type="color"
          bind:value={baseColor}
          aria-describedby="baseColorHex"
          tabindex="0"
        />
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

    <SliderNumberField
      id="warmth"
      label="Warmth"
      valueInputLabel="Warmth value input"
      min={WARMTH_RANGE.min}
      max={WARMTH_RANGE.max}
      step={WARMTH_RANGE.step}
      bind:value={warmth}
      groupHelpText={`Range ${WARMTH_RANGE.min} to ${WARMTH_RANGE.max}. Use slider for coarse adjustment and number input for precise adjustment.`}
      onNumberInput={clampWarmthFromInput}
      onNumberBlur={clampWarmthFromInput}
    />

    <SliderNumberField
      id="saturation"
      label="Saturation"
      valueInputLabel="Saturation value input"
      min={SATURATION_RANGE.min}
      max={SATURATION_RANGE.max}
      step={SATURATION_RANGE.step}
      bind:value={chromaMultiplier}
      groupHelpText="Range follows the selected gamut mapping. Use slider for coarse adjustment and number input for precise adjustment."
      onNumberInput={clampSaturationFromInput}
      onNumberBlur={clampSaturationFromInput}
    />

    <SliderNumberField
      id="numColors"
      label="Number of Colors"
      valueInputLabel="Number of colors value input"
      min={NUM_COLORS_RANGE.min}
      max={NUM_COLORS_RANGE.max}
      step={NUM_COLORS_RANGE.step}
      bind:value={numColors}
      groupHelpText={`Range ${NUM_COLORS_RANGE.min} to ${NUM_COLORS_RANGE.max}. Use slider for coarse adjustment and number input for precise adjustment.`}
      onRangePointerDown={handlePointerDown}
      onRangeInput={handleKeyboardInput}
      onNumberInput={clampNumColorsFromInput}
      onNumberBlur={clampNumColorsFromInput}
    />

    <SliderNumberField
      id="numPalettes"
      label="Number of Palettes"
      valueInputLabel="Number of palettes value input"
      min={NUM_PALETTES_RANGE.min}
      max={NUM_PALETTES_RANGE.max}
      step={NUM_PALETTES_RANGE.step}
      bind:value={numPalettes}
      groupHelpText={`Range ${NUM_PALETTES_RANGE.min} to ${NUM_PALETTES_RANGE.max}. Use slider for coarse adjustment and number input for precise adjustment.`}
      onRangePointerDown={handlePointerDown}
      onRangeInput={handleKeyboardInput}
      onNumberInput={clampNumPalettesFromInput}
      onNumberBlur={clampNumPalettesFromInput}
    />
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
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: transparent;
    cursor: pointer;
    /* Don't use appearance: none to maintain keyboard focusability in WebKit */
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
</style>
