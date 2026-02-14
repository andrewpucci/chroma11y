<script lang="ts">
  import { getPaletteName } from '$lib/colorUtils';
  import { contrastColors, updateLightnessNudger } from '$lib/stores';
  import ColorSwatch from './ColorSwatch.svelte';
  import '$lib/styles/nudger.css';
  import type Color from 'colorjs.io';

  interface Props {
    neutrals?: Color[];
    neutralsHex?: string[];
    lightnessNudgerValues?: number[];
  }

  let { neutrals = [], neutralsHex = [], lightnessNudgerValues = [] }: Props = $props();

  const neutralName = $derived(
    neutralsHex.length > 0 ? getPaletteName(neutralsHex, $contrastColors.low) : 'Neutral'
  );

  let inputEls: HTMLInputElement[] = $state([]);

  // Sync input DOM values when store values change (Bug 6 fix)
  $effect(() => {
    for (let i = 0; i < lightnessNudgerValues.length; i++) {
      const el = inputEls[i];
      if (el && document.activeElement !== el) {
        el.value = String(lightnessNudgerValues[i] ?? 0);
      }
    }
  });

  function handleKeyDown(index: number, event: KeyboardEvent) {
    const target = event.target as HTMLInputElement;
    const currentValue = parseFloat(target.value) || 0;
    const step = 0.01;

    switch (event.key) {
      case 'ArrowUp': {
        event.preventDefault();
        const newValueUp = Math.min(0.5, Math.round((currentValue + step) * 100) / 100);
        target.value = newValueUp.toString();
        updateLightnessNudger(index, newValueUp);
        break;
      }
      case 'ArrowDown': {
        event.preventDefault();
        const newValueDown = Math.max(-0.5, Math.round((currentValue - step) * 100) / 100);
        target.value = newValueDown.toString();
        updateLightnessNudger(index, newValueDown);
        break;
      }
    }
  }
</script>

<section class="card neutral-palette" data-testid="neutral-palette">
  <div class="card-header">
    <div class="card-title">Neutral Palette</div>
    <div class="card-subtitle">Adjust nudgers to fine-tune each neutral step's lightness</div>
  </div>

  <div class="card-body">
    {#if neutralsHex.length > 0}
      <div class="neutral-grid">
        {#each neutralsHex as color, index (index)}
          <div class="neutral-item">
            <ColorSwatch
              {color}
              label={String(index * 10)}
              oklchColor={neutrals[index] ?? null}
              paletteName={neutralName}
              isNeutral={true}
            />
            <div class="nudger-container">
              <label for="lightness-nudger-{index}" class="visually-hidden"
                >Lightness adjustment for step {index}</label
              >
              <input
                bind:this={inputEls[index]}
                id="lightness-nudger-{index}"
                type="number"
                min="-0.5"
                max="0.5"
                step="0.01"
                value={lightnessNudgerValues[index] ?? 0}
                data-nonzero={(lightnessNudgerValues[index] ?? 0) !== 0 ? '' : undefined}
                oninput={(e) => {
                  if (e && e.target) {
                    const inputValue = (e.target as HTMLInputElement).value;
                    // Allow empty string, "-", "." while typing (don't reset to 0)
                    if (inputValue === '' || inputValue === '-' || inputValue === '.') {
                      return;
                    }
                    const newValue = parseFloat(inputValue);
                    // Validate before updating to prevent NaN propagation
                    if (!isNaN(newValue) && isFinite(newValue)) {
                      // Clamp to valid range
                      const clampedValue = Math.max(-0.5, Math.min(0.5, newValue));
                      // Only update the store, let the parent handle reactivity
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
                      (e.target as HTMLInputElement).value = '0';
                      updateLightnessNudger(index, 0);
                    }
                  }
                }}
                onkeydown={(e) => handleKeyDown(index, e)}
                class="nudger-input"
                aria-label="Lightness adjustment for step {index}"
              />
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <p class="no-colors">No neutral colors generated yet. Adjust the controls above.</p>
    {/if}
  </div>
</section>

<style>
  .neutral-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--swatch-gap, 0.5rem);
  }

  .neutral-item {
    display: flex;
    flex-direction: column;
    width: var(--swatch-width, 96px);
    border-radius: 12px;
    background: var(--bg-primary);
    box-shadow: var(--shadow-sm);
    transition:
      transform 140ms ease,
      box-shadow 140ms ease;
  }

  /* Ensure ColorSwatch fits nicely inside */
  .neutral-item :global(.color-swatch) {
    width: 100%;
    flex: 0 0 auto;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border-bottom: none;
    box-shadow: none; /* Let parent handle shadow */
  }

  .neutral-item:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .neutral-item:focus-within {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .no-colors {
    text-align: center;
    color: var(--text-secondary);
    font-style: italic;
    padding: 2rem;
  }

  /* Touch-friendly on mobile */
  @media (max-width: 768px) {
    .neutral-item {
      width: var(--swatch-width-md, 96px);
    }
  }

  @media (max-width: 575px) {
    .neutral-item {
      width: var(--swatch-width-sm, 92px);
    }
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
