<script lang="ts">
  import { onDestroy } from 'svelte';
  import BezierEditor from './BezierEditor.svelte';
  import Icon from './Icon.svelte';
  import SliderNumberField from './SliderNumberField.svelte';
  import { getChromaMultiplierBounds } from '$lib/chromaMultiplier';
  import type { GamutSpace } from '$lib/types';

  interface Props {
    baseColor?: string;
    warmth?: number;
    warmthHue?: number;
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
    onBaseColorCommit?: () => void;
    onWarmthCommit?: () => void;
    onWarmthHueCommit?: () => void;
    onSaturationCommit?: () => void;
    onNumColorsCommit?: () => void;
    onNumPalettesCommit?: () => void;
    onBezierInteractionStart?: () => void;
    onBezierCommit?: () => void;
    advancedOpen?: boolean;
    onAdvancedToggle?: (open: boolean) => void;
  }

  let {
    baseColor = $bindable('#1862E6'),
    warmth = $bindable(0),
    warmthHue = $bindable<number | undefined>(undefined),
    chromaMultiplier = $bindable(1),
    gamutSpace = 'srgb',
    numColors = $bindable(5),
    numPalettes = $bindable(1),
    x1 = $bindable(0),
    y1 = $bindable(0),
    x2 = $bindable(1),
    y2 = $bindable(1),
    onRangeDragStart,
    onRangeDragEnd,
    onBaseColorCommit,
    onWarmthCommit,
    onWarmthHueCommit,
    onSaturationCommit,
    onNumColorsCommit,
    onNumPalettesCommit,
    onBezierInteractionStart,
    onBezierCommit,
    advancedOpen = false,
    onAdvancedToggle
  }: Props = $props();
  let currentAdvancedOpen = $derived(advancedOpen);

  interface RangeConfig {
    min: number;
    max: number;
    step: number;
  }

  const WARMTH_RANGE: RangeConfig = { min: -50, max: 50, step: 1 };
  const WARMTH_HUE_RANGE: RangeConfig = { min: 0, max: 359, step: 1 };
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

  let warmthHueEnabled = $derived(warmthHue !== undefined);
  let warmthHueValue = $state(0);

  $effect(() => {
    if (warmthHue !== undefined) {
      warmthHueValue = warmthHue;
    }
  });

  function handleWarmthHueToggle() {
    if (warmthHueEnabled) {
      warmthHue = undefined;
    } else {
      warmthHue = warmthHueValue;
    }
    // Fires on both enable and disable so undo restores the previous toggle state.
    onWarmthHueCommit?.();
  }

  function clampWarmthHueFromInput() {
    warmthHueValue = clampWithRange(warmthHueValue, WARMTH_HUE_RANGE);
    warmthHue = warmthHueValue;
  }

  function handleWarmthHueRangeChange() {
    warmthHue = warmthHueValue;
    onWarmthHueCommit?.();
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

  function handleAdvancedToggle(event: Event): void {
    const nextOpen = (event.currentTarget as HTMLDetailsElement).open;
    currentAdvancedOpen = nextOpen;
    onAdvancedToggle?.(nextOpen);
  }

  onDestroy(() => {
    cleanupWindowListeners();
  });
</script>

<section class="generator-controls">
  <section class="control-subsection">
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
            onchange={onBaseColorCommit}
          />
          <input
            id="baseColorHex"
            class="input"
            type="text"
            bind:value={baseColor}
            placeholder="#1862E6"
            aria-label="Base color hex value"
            onchange={onBaseColorCommit}
            onblur={onBaseColorCommit}
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
        onRangeChange={onWarmthCommit}
        onNumberInput={clampWarmthFromInput}
        onNumberChange={onWarmthCommit}
        onNumberBlur={clampWarmthFromInput}
      />

      {#if warmth !== 0}
        <div class="warmth-hue-override">
          <label class="warmth-hue-toggle">
            <input type="checkbox" checked={warmthHueEnabled} onchange={handleWarmthHueToggle} />
            Custom warmth hue
          </label>
          {#if warmthHueEnabled}
            <SliderNumberField
              id="warmth-hue"
              label="Warmth hue"
              valueInputLabel="Warmth hue value input"
              min={WARMTH_HUE_RANGE.min}
              max={WARMTH_HUE_RANGE.max}
              step={WARMTH_HUE_RANGE.step}
              bind:value={warmthHueValue}
              groupHelpText="Hue angle 0 to 359 degrees. Overrides the default warm/cool hue direction."
              onRangeChange={handleWarmthHueRangeChange}
              onNumberInput={clampWarmthHueFromInput}
              onNumberChange={onWarmthHueCommit}
              onNumberBlur={clampWarmthHueFromInput}
            />
          {/if}
        </div>
      {/if}

      <SliderNumberField
        id="saturation"
        label="Saturation"
        valueInputLabel="Saturation value input"
        min={SATURATION_RANGE.min}
        max={SATURATION_RANGE.max}
        step={SATURATION_RANGE.step}
        bind:value={chromaMultiplier}
        groupHelpText="Normalized range 0 to 1. Use slider for coarse adjustment and number input for precise adjustment."
        onRangeChange={onSaturationCommit}
        onNumberInput={clampSaturationFromInput}
        onNumberChange={onSaturationCommit}
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
        onRangeChange={onNumColorsCommit}
        onNumberInput={clampNumColorsFromInput}
        onNumberChange={onNumColorsCommit}
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
        onRangeChange={onNumPalettesCommit}
        onNumberInput={clampNumPalettesFromInput}
        onNumberChange={onNumPalettesCommit}
        onNumberBlur={clampNumPalettesFromInput}
      />
    </div>
  </section>

  <details
    class="advanced-group"
    open={currentAdvancedOpen}
    data-testid="generation-advanced-group"
    ontoggle={handleAdvancedToggle}
  >
    <summary class="advanced-summary">
      <span class="advanced-heading">
        <h3 class="subsection-title">Advanced</h3>
        <span class="advanced-copy">Bezier curve shaping</span>
      </span>
      <span class="advanced-chevron" aria-hidden="true">
        <span class="advanced-chevron-inner">
          <Icon
            name="chevron-down"
            size="var(--advanced-disclosure-icon-size)"
            stroke="var(--advanced-disclosure-icon-stroke)"
          />
        </span>
      </span>
    </summary>
    <div class="advanced-panel">
      <div class="advanced-body">
        <div class="bezier-section">
          <div class="bezier-title">Bezier Curve</div>
          <BezierEditor
            bind:x1
            bind:y1
            bind:x2
            bind:y2
            onInteractionStart={onBezierInteractionStart}
            onCommit={onBezierCommit}
          />
        </div>
      </div>
    </div>
  </details>
</section>

<style>
  .generator-controls {
    --advanced-disclosure-icon-size: var(--icon-size-disclosure);
    --advanced-disclosure-icon-stroke: var(--icon-stroke-disclosure);
    --advanced-expand-duration: var(--duration-normal);
    --advanced-collapse-duration: var(--duration-fast);
    --advanced-expand-ease: var(--ease-emphasized);
    --advanced-collapse-ease: var(--ease-out);
    display: grid;
    gap: var(--space-md);
    container-type: inline-size;
  }

  .control-subsection {
    display: grid;
    gap: var(--space-md);
  }

  .subsection-title {
    margin: 0;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    letter-spacing: var(--letter-spacing-normal);
    color: var(--text-primary);
  }

  .advanced-copy {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }

  .control-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }

  .base-color-row {
    display: grid;
    grid-template-columns: var(--control-size-color-input) 1fr;
    gap: var(--space-sm);
    align-items: center;
  }

  .base-color-row input[type='color'] {
    width: var(--control-size-color-input);
    height: var(--touch-target-comfortable);
    padding: 0;
    border: var(--border-width-thin) solid var(--border);
    border-radius: var(--radius-md);
    background: transparent;
    cursor: pointer;
  }

  .base-color-row input[type='color']::-webkit-color-swatch-wrapper {
    padding: 0;
    border: none;
    border-radius: var(--radius-md);
  }

  .base-color-row input[type='color']::-webkit-color-swatch {
    border: var(--border-width-thin) solid var(--border);
    border-radius: var(--radius-md);
  }

  .base-color-row input[type='color']::-moz-color-swatch {
    border: var(--border-width-thin) solid var(--border);
    border-radius: var(--radius-md);
  }

  .advanced-group {
    border: var(--border-width-thin) solid color-mix(in oklab, var(--border) 55%, transparent);
    border-radius: var(--radius-md);
    background: color-mix(in oklab, var(--bg-primary) 92%, transparent);
    overflow: hidden;
    transition:
      border-color var(--transition-fast),
      background-color var(--transition-normal);
  }

  .advanced-summary {
    list-style: none;
    cursor: pointer;
    min-height: var(--touch-target-comfortable);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-sm);
    padding: var(--space-md);
    text-align: left;
    width: 100%;
  }

  .advanced-summary::-webkit-details-marker {
    display: none;
  }

  .advanced-summary::marker {
    content: '';
  }

  .advanced-summary:focus-visible {
    outline: none;
    box-shadow: none;
  }

  .advanced-group:has(> .advanced-summary:focus-visible) {
    outline: var(--focus-outline-width) solid var(--focus-outline-inside);
    box-shadow: 0 0 0 var(--focus-outline-offset) var(--focus-outline-outside);
  }

  .advanced-chevron {
    inline-size: calc(var(--space-md) + var(--space-2xs));
    block-size: calc(var(--space-md) + var(--space-2xs));
    flex: 0 0 calc(var(--space-md) + var(--space-2xs));
    margin-inline-start: auto;
    margin-block-start: var(--space-2xs);
    color: var(--text-primary);
    opacity: 0.92;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .advanced-chevron-inner {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition:
      transform var(--duration-normal) var(--ease-emphasized),
      opacity var(--transition-fast);
    transform-origin: center;
  }

  .advanced-group[open] .advanced-chevron-inner {
    transform: rotate(180deg);
  }

  .advanced-body {
    display: grid;
    gap: var(--space-sm);
    padding: var(--space-md);
    border-top: var(--border-width-thin) solid color-mix(in oklab, var(--border) 42%, transparent);
  }

  .bezier-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
  }

  .bezier-section {
    display: grid;
    gap: var(--space-sm);
  }

  @container (max-width: 980px) and (min-width: 770px) {
    .generator-controls {
      grid-template-columns: 1fr 1fr;
      align-items: start;
    }

    .control-subsection {
      grid-column: 1;
    }

    .advanced-group {
      grid-column: 2;
      align-self: start;
    }
  }

  @media (max-width: 980px) {
    .generator-controls {
      --advanced-disclosure-icon-size: var(--icon-size-disclosure-compact);
      --advanced-disclosure-icon-stroke: var(--icon-stroke-disclosure-compact);
    }
  }

  @supports selector(::details-content) {
    @supports (interpolate-size: allow-keywords) {
      .advanced-group {
        interpolate-size: allow-keywords;
      }

      .advanced-group::details-content {
        block-size: 0;
        opacity: 0;
        overflow: clip;
        transition:
          block-size var(--advanced-collapse-duration) var(--advanced-collapse-ease),
          opacity var(--advanced-collapse-duration) var(--advanced-collapse-ease),
          content-visibility var(--advanced-collapse-duration) allow-discrete;
      }

      .advanced-group[open]::details-content {
        block-size: auto;
        opacity: 1;
        transition:
          block-size var(--advanced-expand-duration) var(--advanced-expand-ease),
          opacity var(--duration-fast) var(--ease-out),
          content-visibility var(--advanced-expand-duration) allow-discrete;
      }

      .advanced-body {
        transform: translateY(calc(var(--space-xs) * -1));
        transition: transform var(--advanced-collapse-duration) var(--advanced-collapse-ease);
      }

      .advanced-group[open] .advanced-body {
        transform: translateY(0);
        transition: transform var(--advanced-expand-duration) var(--advanced-expand-ease);
      }
    }
  }

  .warmth-hue-override {
    display: grid;
    gap: var(--space-xs);
    padding-inline-start: var(--space-sm);
  }

  .warmth-hue-toggle {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    cursor: pointer;
  }
</style>
