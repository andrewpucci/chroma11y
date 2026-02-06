<script lang="ts">
  import { getPaletteName } from '$lib/colorUtils';
  import { updateHueNudger } from '$lib/stores';
  import ColorSwatch from './ColorSwatch.svelte';

  interface Props {
    palettes?: string[][];
    hueNudgerValues?: number[];
  }

  let { palettes = [], hueNudgerValues = $bindable([]) }: Props = $props();

  // Cache palette names to avoid repeated calculations during render
  const paletteNames = $derived(palettes.map((palette) => getPaletteName(palette)));

  function handleHueNudgerChange(paletteIndex: number, event: Event) {
    const target = event.target as HTMLInputElement;
    const inputValue = target.value;
    // Allow empty string or just "-" while typing
    if (inputValue === '' || inputValue === '-') {
      return;
    }
    const value = parseFloat(inputValue);
    if (!isNaN(value) && isFinite(value)) {
      // Clamp to valid range [-180, 180]
      const clampedValue = Math.max(-180, Math.min(180, value));
      updateHueNudger(paletteIndex, clampedValue);
    }
  }

  function handleHueNudgerBlur(paletteIndex: number, event: Event) {
    const target = event.target as HTMLInputElement;
    const inputValue = target.value;
    const value = parseFloat(inputValue);
    if (isNaN(value) || !isFinite(value)) {
      // Reset to 0 on blur if invalid
      updateHueNudger(paletteIndex, 0);
      target.value = '0';
    }
  }
</script>

<section class="card" data-testid="generated-palettes">
  <div class="card-header">
    <div class="card-title">Generated Palettes</div>
    <div class="card-subtitle">Click any swatch to copy the hex value</div>
  </div>

  <div class="card-body color-display">
    {#if palettes.length > 0}
      {#each palettes as palette, paletteIndex (paletteIndex)}
        <div class="palette-header">
          <h3 class="palette-title">{paletteNames[paletteIndex]}</h3>
          <div class="hue-nudger">
            <label class="label" for="hue-nudger-{paletteIndex}">Hue</label>
            <input
              id="hue-nudger-{paletteIndex}"
              type="number"
              min="-180"
              max="180"
              step="1"
              value={hueNudgerValues[paletteIndex] || 0}
              oninput={(e) => handleHueNudgerChange(paletteIndex, e)}
              onblur={(e) => handleHueNudgerBlur(paletteIndex, e)}
              class="input mono hue-nudger-input"
              aria-label="Hue adjustment for {paletteNames[
                paletteIndex
              ]} palette, -180 to 180 degrees"
            />
          </div>
        </div>
        <div class="swatches">
          {#each palette as color, index (`${paletteIndex}-${index}`)}
            <ColorSwatch {color} label={String(index * 10)} showContrast={true} />
          {/each}
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

  .hue-nudger-input {
    width: 96px;
    text-align: center;
  }

  /* Touch-friendly on mobile */
  @media (max-width: 768px) {
    .hue-nudger-input {
      width: 110px;
      min-height: 44px;
      touch-action: manipulation;
    }
  }

  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .no-colors {
    text-align: center;
    color: var(--text-secondary);
    font-style: italic;
    padding: 2rem;
  }
</style>
