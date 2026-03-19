<script lang="ts">
  import { announce } from '$lib/announce';
  import { resolveNeutralPaletteName } from '$lib/paletteNameUtils';
  import {
    contrastColors,
    customNeutralName,
    updateColorState,
    updateLightnessNudger
  } from '$lib/stores';
  import Card from '$lib/components/Card.svelte';
  import PaletteNameEditor from '$lib/components/PaletteNameEditor.svelte';
  import ColorSwatch from './ColorSwatch.svelte';
  import '$lib/styles/nudger.css';
  import type Color from 'colorjs.io';

  interface Props {
    neutrals?: Color[];
    neutralsHex?: string[];
    neutralsDisplay?: string[];
    lightnessNudgerValues?: number[];
    onHistoryCommit?: (label: string) => void;
  }

  let {
    neutrals = [],
    neutralsHex = [],
    neutralsDisplay = [],
    lightnessNudgerValues = [],
    onHistoryCommit
  }: Props = $props();

  const generatedNeutralName = $derived(
    neutralsHex.length > 0 ? resolveNeutralPaletteName(neutralsHex, $contrastColors.low) : 'Gray'
  );
  const neutralName = $derived(
    neutralsHex.length > 0
      ? resolveNeutralPaletteName(neutralsHex, $contrastColors.low, $customNeutralName)
      : 'Gray'
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
        onHistoryCommit?.('Neutral lightness adjusted');
        break;
      }
      case 'ArrowDown': {
        event.preventDefault();
        const newValueDown = Math.max(-0.5, Math.round((currentValue - step) * 100) / 100);
        target.value = newValueDown.toString();
        updateLightnessNudger(index, newValueDown);
        onHistoryCommit?.('Neutral lightness adjusted');
        break;
      }
    }
  }

  function handleNeutralNameCommit(nextValue: string | undefined): void {
    if (nextValue === $customNeutralName || (!nextValue && !$customNeutralName)) {
      return;
    }

    updateColorState({ customNeutralName: nextValue });

    if (nextValue) {
      announce(`Neutral palette renamed to ${nextValue}`);
      onHistoryCommit?.('Neutral palette name changed');
      return;
    }

    announce(`Neutral palette name reset to ${generatedNeutralName}`);
    onHistoryCommit?.('Neutral palette name reset');
  }
</script>

<Card title="Neutral Palette" subtitle="Fine-tune neutral lightness" data-testid="neutral-palette">
  {#if neutralsHex.length > 0}
    <div class="neutral-header">
      <h3 class="neutral-name-heading">
        <PaletteNameEditor
          value={$customNeutralName}
          fallbackValue={generatedNeutralName}
          editButtonAriaLabel="Edit name for neutral palette"
          inputAriaLabel="Neutral palette name"
          data-testid="neutral-palette-name"
          onCommit={handleNeutralNameCommit}
        />
      </h3>
    </div>
    <div class="neutral-grid">
      {#each neutralsHex as color, index (index)}
        <div
          class="neutral-item"
          style="--swatch-width: 100%; --swatch-flex: 0 0 auto; --swatch-border-bottom-left-radius: 0; --swatch-border-bottom-right-radius: 0; --swatch-border-bottom: none;"
        >
          <ColorSwatch
            {color}
            displayValue={neutralsDisplay[index] ?? color}
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
                    onHistoryCommit?.('Neutral lightness adjusted');
                  } else {
                    onHistoryCommit?.('Neutral lightness adjusted');
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
</Card>

<style>
  /* Neutral-specific nudger overrides */
  .nudger-input {
    padding: var(--space-xs) var(--space-xs);
    font-size: var(--font-size-xs);
  }

  .nudger-container {
    border: 1px solid color-mix(in oklab, var(--border) 50%, transparent);
    border-radius: 0;
    border-bottom-left-radius: var(--radius-md);
    border-bottom-right-radius: var(--radius-md);
  }

  @media (max-width: 768px) {
    .nudger-input {
      padding: var(--space-sm) var(--space-xs);
      font-size: var(--font-size-sm);
    }
  }

  .neutral-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
    container-type: inline-size;
  }

  .neutral-header {
    margin-bottom: var(--space-md);
  }

  .neutral-name-heading {
    color: var(--text-primary);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-bold);
    margin: 0;
  }

  .neutral-item {
    display: flex;
    flex-direction: column;
    width: var(--neutral-item-width, 148px);
  }

  .no-colors {
    text-align: center;
    color: var(--text-secondary);
    font-style: italic;
    padding: var(--space-xl);
  }

  /* Touch-friendly on mobile */
  @media (max-width: 768px) {
    .neutral-item {
      --neutral-item-width: 136px;
    }
  }

  @media (max-width: 575px) {
    .neutral-item {
      --neutral-item-width: 128px;
    }
  }
</style>
