<script lang="ts">
  import { getPaletteName } from '$lib/colorUtils';
  import { updateHueNudger } from '$lib/stores';
  import ColorSwatch from './ColorSwatch.svelte';

  interface Props {
    palettes?: string[][];
    hueNudgerValues?: number[];
  }

  let { palettes = [], hueNudgerValues = $bindable([]) }: Props = $props();

  function handleHueNudgerChange(paletteIndex: number, event: Event) {
    const target = event.target as HTMLInputElement;
    const value = parseFloat(target.value) || 0;
    updateHueNudger(paletteIndex, value);
  }
</script>

<section class="color-display">
  <h2>Generated Color Palettes</h2>
  {#if palettes.length > 0}
    {#each palettes as palette, paletteIndex}
      <div class="palette-header">
        <h3>{getPaletteName(palette)}</h3>
        <div class="hue-nudger">
          <label for="hue-nudger-{paletteIndex}">Hue:</label>
          <input
            id="hue-nudger-{paletteIndex}"
            type="number"
            min="-180"
            max="180"
            step="1"
            value={hueNudgerValues[paletteIndex] || 0}
            oninput={(e) => handleHueNudgerChange(paletteIndex, e)}
            class="hue-nudger-input"
            title="Hue adjustment for palette {paletteIndex + 1} (-180 to 180 degrees)"
          />
        </div>
      </div>
      <div class="color-grid compact">
        {#each palette as color, index}
          <ColorSwatch {color} label={String(index * 10)} showContrast={true} />
        {/each}
      </div>
    {/each}
  {:else}
    <p class="no-colors">No color palettes generated yet. Adjust the controls above.</p>
  {/if}
</section>

<style>
  .color-display {
    padding: 0.1rem;
    background: var(--bg-secondary);
    border-radius: 2px;
    border: 1px solid var(--border);
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .color-display h2 {
    margin: 0 0 0.1rem 0;
    color: var(--text-primary);
    font-size: 0.7rem;
  }

  .palette-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin: 0.1rem 0 0.05rem 0;
  }

  .color-display h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: 0.6rem;
    text-transform: capitalize;
  }

  .hue-nudger {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .hue-nudger label {
    font-size: 0.5rem;
    color: var(--text-secondary);
  }

  .hue-nudger-input {
    width: 50px;
    padding: 2px 4px;
    border: 1px solid var(--border);
    border-radius: 2px;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 0.5rem;
    font-family: monospace;
    text-align: center;
  }

  .color-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.5rem;
  }

  .color-grid.compact {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    justify-content: flex-start;
    align-items: flex-start;
    flex: 1;
    overflow-y: auto;
  }

  .no-colors {
    text-align: center;
    color: var(--text-secondary);
    font-style: italic;
    padding: 2rem;
  }
</style>
