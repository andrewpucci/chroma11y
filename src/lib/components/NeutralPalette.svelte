<script lang="ts">
  import { getPaletteName } from '$lib/colorUtils';
  import { updateLightnessNudger } from '$lib/stores';
  import ColorSwatch from './ColorSwatch.svelte';

  interface Props {
    neutrals?: string[];
    lightnessNudgerValues?: number[];
  }

  let { neutrals = $bindable([]), lightnessNudgerValues = $bindable([]) }: Props = $props();

  const neutralName = $derived(neutrals.length > 0 ? getPaletteName(neutrals) : 'Neutral');
</script>

<section class="card" data-testid="neutral-palette">
  <div class="card-header">
    <div class="card-title">Neutral Palette</div>
    <div class="card-subtitle">{neutralName}</div>
  </div>

  <div class="card-body">
    {#if neutrals.length > 0}
      <div class="swatches">
        {#each neutrals as color, index (index)}
          <ColorSwatch {color} label="N{index}" />
        {/each}
      </div>

      <div class="nudgers-title">Lightness Nudgers</div>
      <div class="nudger-grid-compact">
        {#each neutrals as color, index (index)}
          <div class="nudger-item-aligned">
            <div
              class="nudger-color-aligned"
              style="background-color: {color};"
              aria-hidden="true"
            ></div>
            <label for="lightness-nudger-{index}" class="visually-hidden"
              >Lightness adjustment for step {index}</label
            >
            <input
              id="lightness-nudger-{index}"
              type="number"
              min="-0.5"
              max="0.5"
              step="0.01"
              value={lightnessNudgerValues[index]}
              oninput={(e) => {
                if (e && e.target) {
                  const inputValue = (e.target as HTMLInputElement).value;
                  // Allow empty string or just "-" while typing (don't reset to 0)
                  if (inputValue === '' || inputValue === '-' || inputValue === '.') {
                    return;
                  }
                  const newValue = parseFloat(inputValue);
                  // Validate before updating to prevent NaN propagation
                  if (!isNaN(newValue) && isFinite(newValue)) {
                    // Clamp to valid range
                    const clampedValue = Math.max(-0.5, Math.min(0.5, newValue));
                    lightnessNudgerValues[index] = clampedValue;
                    updateLightnessNudger(index, clampedValue);
                  }
                  // Don't reset on invalid - let the user continue typing
                }
              }}
              onblur={(e) => {
                // On blur, reset invalid values to 0
                if (e && e.target) {
                  const inputValue = (e.target as HTMLInputElement).value;
                  const newValue = parseFloat(inputValue);
                  if (isNaN(newValue) || !isFinite(newValue)) {
                    lightnessNudgerValues[index] = 0;
                    updateLightnessNudger(index, 0);
                    (e.target as HTMLInputElement).value = '0';
                  }
                }
              }}
              class="nudger-input"
              aria-label="Lightness adjustment for step {index}"
            />
          </div>
        {/each}
      </div>
    {:else}
      <p class="no-colors">No neutral colors generated yet. Adjust the controls above.</p>
    {/if}
  </div>
</section>

<style>
  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: var(--swatch-gap, 0.5rem);
  }

  .nudgers-title {
    margin-top: 1rem;
    font-size: 0.95rem;
    font-weight: 650;
    color: var(--text-primary);
  }

  .no-colors {
    text-align: center;
    color: var(--text-secondary);
    font-style: italic;
    padding: 2rem;
  }

  .nudger-grid-compact {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.75rem;
    background: color-mix(in oklab, var(--bg-tertiary) 82%, transparent);
    border-radius: var(--radius-md);
    border: 1px solid color-mix(in oklab, var(--border) 70%, transparent);
  }

  .nudger-item-aligned {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem;
    min-width: 92px;
    width: fit-content;
    height: auto;
    border-radius: 12px;
    background: color-mix(in oklab, var(--bg-primary) 70%, transparent);
    border: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
  }

  .nudger-color-aligned {
    flex: 1;
    width: 100%;
    height: 18px;
    border-radius: 10px;
    border: 1px solid color-mix(in oklab, var(--border) 70%, transparent);
  }

  .nudger-input {
    flex: 1;
    padding: 0.45rem 0.5rem;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 0.85rem;
    font-family: var(--text-mono);
    text-align: center;
    min-width: 0;
  }

  /* Touch-friendly on mobile */
  @media (max-width: 768px) {
    .nudger-input {
      padding: 0.65rem 0.6rem;
      font-size: 1rem;
      min-height: 44px;
      touch-action: manipulation;
    }

    .nudger-item-aligned {
      min-width: 120px;
      padding: 0.65rem;
    }

    .nudger-color-aligned {
      height: 22px;
    }
  }

  .nudger-input:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
