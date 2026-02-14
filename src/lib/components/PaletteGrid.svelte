<script lang="ts">
  import { getPaletteName } from '$lib/colorUtils';
  import { contrastColors, updateHueNudger } from '$lib/stores';
  import ColorSwatch from './ColorSwatch.svelte';
  import '$lib/styles/nudger.css';
  import type Color from 'colorjs.io';

  interface Props {
    palettes?: Color[][];
    palettesHex?: string[][];
    hueNudgerValues?: number[];
  }

  let { palettes = [], palettesHex = [], hueNudgerValues = [] }: Props = $props();

  // Cache palette names to avoid repeated calculations during render
  const paletteNames = $derived(
    palettesHex.length === 0
      ? []
      : palettesHex.map((palette) => getPaletteName(palette, $contrastColors.low))
  );

  let inputEls: HTMLInputElement[] = $state([]);

  // Sync input DOM values when store values change (Bug 6 fix)
  $effect(() => {
    for (let i = 0; i < hueNudgerValues.length; i++) {
      const el = inputEls[i];
      if (el && document.activeElement !== el) {
        el.value = String(hueNudgerValues[i] ?? 0);
      }
    }
  });

  function handleKeyDown(paletteIndex: number, event: KeyboardEvent) {
    const target = event.target as HTMLInputElement;
    const currentValue = parseFloat(target.value) || 0;
    const step = 1;

    switch (event.key) {
      case 'ArrowUp': {
        event.preventDefault();
        const newValueUp = Math.min(180, currentValue + step);
        target.value = newValueUp.toString();
        updateHueNudger(paletteIndex, newValueUp);
        break;
      }
      case 'ArrowDown': {
        event.preventDefault();
        const newValueDown = Math.max(-180, currentValue - step);
        target.value = newValueDown.toString();
        updateHueNudger(paletteIndex, newValueDown);
        break;
      }
    }
  }

  function handleHueNudgerChange(paletteIndex: number, event: Event) {
    const target = event.target as HTMLInputElement;
    const inputValue = target.value;
    // Allow empty string, "-", "." while typing
    if (inputValue === '' || inputValue === '-' || inputValue === '.') {
      return;
    }
    const value = parseFloat(inputValue);
    if (!isNaN(value) && isFinite(value)) {
      // Clamp to valid range [-180, 180]
      const clampedValue = Math.max(-180, Math.min(180, value));
      // Update input to show clamped value
      target.value = clampedValue.toString();
      updateHueNudger(paletteIndex, clampedValue);
    }
  }

  function handleHueNudgerBlur(paletteIndex: number, event: Event) {
    const target = event.target as HTMLInputElement;
    const inputValue = target.value;
    const value = parseFloat(inputValue);
    if (isNaN(value) || !isFinite(value)) {
      // Reset to 0 on blur if invalid
      target.value = '0';
      updateHueNudger(paletteIndex, 0);
    }
  }
</script>

<section class="card palette-grid" data-testid="generated-palettes">
  <div class="card-header">
    <div class="card-title">Generated Palettes</div>
    <div class="card-subtitle">Click any swatch to view color details</div>
  </div>

  <div class="card-body color-display">
    {#if palettesHex.length > 0}
      {#each palettesHex as palette, paletteIndex (paletteIndex)}
        <div class="palette-block">
          <div class="palette-header">
            <h3 class="palette-title">{paletteNames[paletteIndex]}</h3>
            <div class="hue-nudger">
              <label class="hue-nudger-label" for="hue-nudger-{paletteIndex}">Hue</label>
              <div class="nudger-container">
                <input
                  bind:this={inputEls[paletteIndex]}
                  id="hue-nudger-{paletteIndex}"
                  type="number"
                  min="-180"
                  max="180"
                  step="1"
                  value={hueNudgerValues[paletteIndex] ?? 0}
                  data-nonzero={(hueNudgerValues[paletteIndex] ?? 0) !== 0 ? '' : undefined}
                  oninput={(e) => handleHueNudgerChange(paletteIndex, e)}
                  onblur={(e) => handleHueNudgerBlur(paletteIndex, e)}
                  onkeydown={(e) => handleKeyDown(paletteIndex, e)}
                  class="nudger-input"
                  aria-label="Hue adjustment for {paletteNames[
                    paletteIndex
                  ]} palette, -180 to 180 degrees"
                />
              </div>
            </div>
          </div>
          <div class="swatches">
            {#each palette as color, index (`${paletteIndex}-${index}`)}
              <ColorSwatch
                {color}
                label={String(index * 10)}
                oklchColor={palettes[paletteIndex]?.[index] ?? null}
                paletteName={paletteNames[paletteIndex]}
              />
            {/each}
          </div>
        </div>
      {/each}
    {:else}
      <p class="no-colors">No color palettes generated yet. Adjust the controls above.</p>
    {/if}
  </div>
</section>

<style>
  .color-display {
    display: grid;
    gap: 1rem;
  }

  .palette-block {
    display: grid;
    gap: 0.5rem;
    padding: var(--palette-block-padding, 0.75rem);
    background: color-mix(in oklab, var(--bg-secondary) 88%, transparent);
    border: var(--palette-block-border-width, 1px) solid
      color-mix(in oklab, var(--border) 65%, transparent);
    border-radius: var(--radius-md);
  }

  .palette-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .palette-title {
    margin: 0;
    color: var(--text-primary);
    font-size: 1rem;
    font-weight: 700;
    text-transform: capitalize;
  }

  .hue-nudger {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .hue-nudger-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: var(--swatch-gap, 0.5rem);
  }

  .no-colors {
    text-align: center;
    color: var(--text-secondary);
    font-style: italic;
    padding: 2rem;
  }
</style>
