<script lang="ts">
  import { announce } from '$lib/announce';
  import { resolveGeneratedPaletteNames } from '$lib/paletteNameUtils';
  import {
    contrastColors,
    customPaletteNames,
    updateColorState,
    updateHueNudger
  } from '$lib/stores';
  import Card from '$lib/components/Card.svelte';
  import PaletteNameEditor from '$lib/components/PaletteNameEditor.svelte';
  import ColorSwatch from './ColorSwatch.svelte';
  import '$lib/styles/nudger.css';
  import type Color from 'colorjs.io';

  interface Props {
    palettes?: Color[][];
    palettesHex?: string[][];
    palettesDisplay?: string[][];
    hueNudgerValues?: number[];
    onHistoryCommit?: (label: string) => void;
  }

  let {
    palettes = [],
    palettesHex = [],
    palettesDisplay = [],
    hueNudgerValues = [],
    onHistoryCommit
  }: Props = $props();

  const generatedPaletteNames = $derived(
    palettesHex.length === 0 ? [] : resolveGeneratedPaletteNames(palettesHex, $contrastColors.low)
  );
  const paletteNames = $derived(
    palettesHex.length === 0
      ? []
      : resolveGeneratedPaletteNames(palettesHex, $contrastColors.low, $customPaletteNames)
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
        onHistoryCommit?.('Palette hue adjusted');
        break;
      }
      case 'ArrowDown': {
        event.preventDefault();
        const newValueDown = Math.max(-180, currentValue - step);
        target.value = newValueDown.toString();
        updateHueNudger(paletteIndex, newValueDown);
        onHistoryCommit?.('Palette hue adjusted');
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
    onHistoryCommit?.('Palette hue adjusted');
  }

  function handlePaletteNameCommit(paletteIndex: number, nextValue: string | undefined): void {
    const currentNames = $customPaletteNames ? [...$customPaletteNames] : [];
    const currentValue = currentNames[paletteIndex];

    if (nextValue === currentValue || (!nextValue && !currentValue)) {
      return;
    }

    if (nextValue) {
      currentNames[paletteIndex] = nextValue;
      updateColorState({ customPaletteNames: currentNames });
      announce(`Palette ${paletteIndex + 1} renamed to ${nextValue}`);
      onHistoryCommit?.('Palette name changed');
      return;
    }

    if (paletteIndex < currentNames.length) {
      currentNames[paletteIndex] = '';
    }

    updateColorState({ customPaletteNames: currentNames });
    announce(`Palette ${paletteIndex + 1} name reset to ${generatedPaletteNames[paletteIndex]}`);
    onHistoryCommit?.('Palette name reset');
  }
</script>

<Card title="Generated Palettes" subtitle="Adjust hue per palette" data-testid="generated-palettes">
  <div class="color-display">
    {#if palettesHex.length > 0}
      {#each palettesHex as palette, paletteIndex (paletteIndex)}
        <div class="palette-block">
          <div class="palette-header">
            <h3 class="palette-title">
              <PaletteNameEditor
                value={$customPaletteNames?.[paletteIndex]}
                fallbackValue={generatedPaletteNames[paletteIndex]}
                editButtonAriaLabel={`Edit name for palette ${paletteIndex + 1}`}
                inputAriaLabel={`Palette ${paletteIndex + 1} name`}
                data-testid={`generated-palette-name-${paletteIndex}`}
                onCommit={(value) => handlePaletteNameCommit(paletteIndex, value)}
              />
            </h3>
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
                  class="nudger-input input mono hue-input"
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

  .hue-nudger .nudger-container {
    background: transparent;
    border: 0;
    border-radius: 0;
    overflow: visible;
  }

  .hue-input {
    background: var(--bg-primary);
    border: var(--border-width-thin) solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    min-height: var(--touch-target-comfortable);
    padding: var(--space-sm) var(--space-md);
    text-align: center;
  }

  .hue-input:focus-visible {
    background: var(--bg-primary);
    color: var(--text-primary);
  }

  .hue-input[data-nonzero] {
    border-color: color-mix(in oklab, var(--border) 45%, var(--accent));
    color: var(--text-primary);
    font-weight: var(--font-weight-normal);
  }

  @media (max-width: 768px) {
    .nudger-input {
      width: 110px;
    }
  }

  .color-display {
    display: grid;
    gap: var(--space-md);
    container-type: inline-size;
  }

  .palette-block {
    display: grid;
    gap: var(--space-sm);
    padding-block: var(--space-sm);
  }

  .palette-block + .palette-block {
    border-top: var(--border-width-thin) solid color-mix(in oklab, var(--border) 42%, transparent);
  }

  .palette-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-md);
    flex-wrap: wrap;
  }

  .palette-title {
    margin: 0;
    color: var(--text-primary);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-bold);
    flex: 1 1 16rem;
    min-width: 0;
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
