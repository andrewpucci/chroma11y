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
  import Button from './Button.svelte';
  import ColorSwatch from './ColorSwatch.svelte';
  import Icon from './Icon.svelte';
  import { openExportPreview } from '$lib/help/exportPreviewStore';
  import '$lib/styles/nudger.css';
  import { SvelteMap } from 'svelte/reactivity';
  import type Color from 'colorjs.io';

  interface Props {
    palettes?: (Color[] | null)[];
    palettesHex?: ((string | null)[] | null)[];
    palettesDisplay?: ((string | null)[] | null)[];
    palettesSimulatedDisplay?: ((string | null)[] | null)[] | null;
    hueNudgerValues?: number[];
    onHistoryCommit?: (label: string) => void;
    readonly?: boolean;
    contrastColorsOverride?: { low: string; high: string };
  }

  let {
    palettes = [],
    palettesHex = [],
    palettesDisplay = [],
    palettesSimulatedDisplay = null,
    hueNudgerValues = [],
    onHistoryCommit,
    readonly = false,
    contrastColorsOverride = undefined
  }: Props = $props();

  const effectiveContrastLow = $derived(contrastColorsOverride?.low ?? $contrastColors.low);

  const nonNullPalettesHex = $derived(
    palettesHex
      .filter((p): p is string[] => p !== null)
      .map((p) => p.filter((s): s is string => s !== null))
  );

  const generatedPaletteNames = $derived(
    nonNullPalettesHex.length === 0
      ? []
      : resolveGeneratedPaletteNames(nonNullPalettesHex, effectiveContrastLow)
  );
  const paletteNames = $derived(
    nonNullPalettesHex.length === 0
      ? []
      : resolveGeneratedPaletteNames(nonNullPalettesHex, effectiveContrastLow, $customPaletteNames)
  );

  let nonNullPaletteNameIndex = $derived.by(() => {
    const map = new SvelteMap<number, number>();
    let nameIdx = 0;
    for (let i = 0; i < palettesHex.length; i++) {
      if (palettesHex[i] !== null) {
        map.set(i, nameIdx++);
      }
    }
    return map;
  });

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

  function handleCopyClick(paletteIndex: number, event: MouseEvent): void {
    const opener = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
    openExportPreview({ paletteIndex }, 'list', opener);
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
        {#if palette === null}
          <div
            class="palette-block palette-placeholder"
            data-testid="palette-placeholder"
            aria-hidden="true"
          ></div>
        {:else}
          {@const nameIndex = nonNullPaletteNameIndex.get(paletteIndex) ?? paletteIndex}
          <div class="palette-block">
            <div class="palette-header">
              <h3 class="palette-title">
                <PaletteNameEditor
                  value={$customPaletteNames?.[nameIndex]}
                  fallbackValue={generatedPaletteNames[nameIndex]}
                  editButtonAriaLabel={`Edit name for palette ${nameIndex + 1}`}
                  inputAriaLabel={`Palette ${nameIndex + 1} name`}
                  data-testid={`generated-palette-name-${paletteIndex}`}
                  onCommit={(value) => handlePaletteNameCommit(nameIndex, value)}
                />
              </h3>
              <div class="palette-header-controls">
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
                      disabled={readonly}
                      oninput={(e) => {
                        if (readonly) return;
                        handleHueNudgerChange(paletteIndex, e);
                      }}
                      onblur={(e) => {
                        if (readonly) return;
                        handleHueNudgerBlur(paletteIndex, e);
                      }}
                      onkeydown={(e) => {
                        if (readonly) return;
                        handleKeyDown(paletteIndex, e);
                      }}
                      class="nudger-input input mono hue-input"
                      aria-label="Hue adjustment for {paletteNames[
                        nameIndex
                      ]} palette, -180 to 180 degrees"
                    />
                  </div>
                </div>
                <Button
                  ariaLabel={`Copy ${paletteNames[nameIndex]} palette`}
                  data-testid={`copy-palette-${paletteIndex}`}
                  onclick={(e) => handleCopyClick(nameIndex, e)}
                >
                  <Icon name="copy" />
                  <span>Copy</span>
                </Button>
              </div>
            </div>
            <div class="swatches">
              {#each palette as color, index (`${paletteIndex}-${index}`)}
                {#if color === null}
                  <div
                    class="swatch-placeholder"
                    data-testid="swatch-placeholder"
                    aria-hidden="true"
                  ></div>
                {:else}
                  <ColorSwatch
                    {color}
                    displayValue={palettesDisplay[paletteIndex]?.[index] ?? color}
                    simulatedColor={palettesSimulatedDisplay?.[paletteIndex]?.[index] ?? ''}
                    label={String(index * 10)}
                    oklchColor={palettes[paletteIndex]?.[index] ?? null}
                    paletteName={paletteNames[nameIndex]}
                    stepIndex={index}
                    {paletteIndex}
                    {onHistoryCommit}
                    {contrastColorsOverride}
                  />
                {/if}
              {/each}
            </div>
          </div>
        {/if}
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

  .palette-header-controls {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex-wrap: wrap;
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

  .palette-placeholder {
    background: repeating-linear-gradient(
      45deg,
      var(--bg-tertiary),
      var(--bg-tertiary) 4px,
      transparent 4px,
      transparent 10px
    );
    border-radius: var(--radius-md);
    opacity: 0.4;
    min-height: 80px;
  }

  .swatch-placeholder {
    width: 72px;
    height: 72px;
    background: repeating-linear-gradient(
      45deg,
      var(--bg-tertiary),
      var(--bg-tertiary) 4px,
      transparent 4px,
      transparent 10px
    );
    border-radius: var(--radius-sm);
    opacity: 0.4;
    flex-shrink: 0;
  }

  .no-colors {
    text-align: center;
    color: var(--text-secondary);
    font-style: italic;
    padding: var(--space-xl);
  }
</style>
