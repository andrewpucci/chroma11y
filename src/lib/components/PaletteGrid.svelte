<script lang="ts">
  import { getPaletteName } from '$lib/colorUtils';
  import { contrastColors, updateHueNudger } from '$lib/stores';
  import Card from '$lib/components/Card.svelte';
  import ColorSwatch from './ColorSwatch.svelte';
  import '$lib/styles/nudger.css';
  import type Color from 'colorjs.io';

  interface Props {
    palettes?: Color[][];
    palettesHex?: string[][];
    palettesDisplay?: string[][];
    hueNudgerValues?: number[];
  }

  let {
    palettes = [],
    palettesHex = [],
    palettesDisplay = [],
    hueNudgerValues = []
  }: Props = $props();

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

<Card
  title="Generated Palettes"
  subtitle="Click any swatch to view color details"
  data-testid="generated-palettes"
>
  <div class="color-display">
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
                displayValue={palettesDisplay[paletteIndex]?.[index] ?? color}
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
</Card>

<style>
  /* Palette-grid specific nudger overrides */
  .nudger-input {
    width: 96px;
  }

  @media (max-width: 768px) {
    .nudger-input {
      width: 110px;
    }
  }

  .color-display {
    display: grid;
    gap: var(--space-lg);
    container-type: inline-size;
  }

  .palette-block {
    display: grid;
    gap: var(--space-sm);
    padding: var(--space-md);
    background: color-mix(in oklab, var(--bg-secondary) 88%, transparent);
    border: var(--border-width-thin) solid color-mix(in oklab, var(--border) 65%, transparent);
    border-radius: var(--radius-md);
  }

  .palette-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
  }

  .palette-title {
    margin: 0;
    color: var(--text-primary);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-bold);
    text-transform: capitalize;
  }

  .hue-nudger {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .hue-nudger-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--text-secondary);
  }

  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .no-colors {
    text-align: center;
    color: var(--text-secondary);
    font-style: italic;
    padding: var(--space-xl);
  }
</style>
