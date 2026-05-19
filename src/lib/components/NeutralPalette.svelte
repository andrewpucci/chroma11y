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
  import Button from './Button.svelte';
  import ColorSwatch from './ColorSwatch.svelte';
  import Icon from './Icon.svelte';
  import { openExportPreview } from '$lib/help/exportPreviewStore';
  import '$lib/styles/nudger.css';
  import type Color from 'colorjs.io';

  interface Props {
    neutrals?: (Color | null)[];
    neutralsHex?: (string | null)[];
    neutralsDisplay?: (string | null)[];
    neutralsSimulatedDisplay?: (string | null)[] | null;
    lightnessNudgerValues?: number[];
    onHistoryCommit?: (label: string) => void;
    readonly?: boolean;
    contrastColorsOverride?: { low: string; high: string };
  }

  let {
    neutrals = [],
    neutralsHex = [],
    neutralsDisplay = [],
    neutralsSimulatedDisplay = null,
    lightnessNudgerValues = [],
    onHistoryCommit,
    readonly = false,
    contrastColorsOverride = undefined
  }: Props = $props();

  const effectiveContrastLow = $derived(contrastColorsOverride?.low ?? $contrastColors.low);

  const nonNullNeutralsHex = $derived(neutralsHex.filter((h): h is string => h !== null));

  const generatedNeutralName = $derived(
    nonNullNeutralsHex.length > 0
      ? resolveNeutralPaletteName(nonNullNeutralsHex, effectiveContrastLow)
      : 'Gray'
  );
  const neutralName = $derived(
    nonNullNeutralsHex.length > 0
      ? resolveNeutralPaletteName(nonNullNeutralsHex, effectiveContrastLow, $customNeutralName)
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

  function handleCopyClick(event: MouseEvent): void {
    const opener = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
    openExportPreview('neutral', 'list', opener);
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
      <Button
        ariaLabel={`Copy ${neutralName} palette`}
        data-testid="copy-neutral-palette"
        onclick={handleCopyClick}
      >
        <Icon name="copy" />
        <span>Copy</span>
      </Button>
    </div>
    <div class="neutral-grid">
      {#each neutralsHex as color, index (index)}
        {#if color === null}
          <div
            class="neutral-item neutral-placeholder"
            data-testid="neutral-placeholder"
            aria-hidden="true"
          ></div>
        {:else}
          <div
            class="neutral-item"
            style="--swatch-width: 100%; --swatch-flex: 0 0 auto; --swatch-border-bottom-left-radius: 0; --swatch-border-bottom-right-radius: 0; --swatch-border-bottom: none;"
          >
            <ColorSwatch
              {color}
              displayValue={neutralsDisplay[index] ?? color}
              simulatedColor={neutralsSimulatedDisplay?.[index] ?? ''}
              label={String(index * 10)}
              oklchColor={neutrals[index] ?? null}
              paletteName={neutralName}
              isNeutral={true}
              stepIndex={index}
              {onHistoryCommit}
              {contrastColorsOverride}
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
                disabled={readonly}
                oninput={(e) => {
                  if (readonly || !e || !e.target) return;
                  const inputValue = (e.target as HTMLInputElement).value;
                  if (inputValue === '' || inputValue === '-' || inputValue === '.') {
                    return;
                  }
                  const newValue = parseFloat(inputValue);
                  if (!isNaN(newValue) && isFinite(newValue)) {
                    const clampedValue = Math.max(-0.5, Math.min(0.5, newValue));
                    updateLightnessNudger(index, clampedValue);
                  }
                }}
                onblur={(e) => {
                  if (readonly || !e || !e.target) return;
                  const inputValue = (e.target as HTMLInputElement).value;
                  const newValue = parseFloat(inputValue);
                  if (isNaN(newValue) || !isFinite(newValue)) {
                    (e.target as HTMLInputElement).value = '0';
                    updateLightnessNudger(index, 0);
                    onHistoryCommit?.('Neutral lightness adjusted');
                  } else {
                    onHistoryCommit?.('Neutral lightness adjusted');
                  }
                }}
                onkeydown={(e) => {
                  if (readonly) return;
                  handleKeyDown(index, e);
                }}
                class="nudger-input"
                aria-label="Lightness adjustment for step {index}"
              />
            </div>
          </div>
        {/if}
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
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    flex-wrap: wrap;
    margin-bottom: var(--space-md);
  }

  .neutral-name-heading {
    color: var(--text-primary);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-bold);
    margin: 0;
    flex: 1 1 auto;
  }

  .neutral-item {
    display: flex;
    flex-direction: column;
    width: var(--neutral-item-width, 148px);
  }

  .neutral-placeholder {
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
