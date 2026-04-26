<script lang="ts">
  import {
    contrastMode,
    contrastColors,
    lowReference,
    highReference,
    contrastAlgorithm,
    swatchContrastIndicators,
    activeSwatchPicker,
    neutralsHex,
    palettesHex,
    customNeutralName,
    customPaletteNames,
    updateColorState
  } from '$lib/stores';
  import { announce } from '$lib/announce';
  import { isValidHexColor } from '$lib/colorUtils';
  import {
    DEFAULT_NEUTRAL_PALETTE_NAME,
    resolveGeneratedPaletteNames,
    resolveNeutralPaletteName
  } from '$lib/paletteNameUtils';
  import { HELP_TOPICS } from '$lib/help/helpContent';
  import CheckboxRow from './CheckboxRow.svelte';
  import HelpTooltip from './HelpTooltip.svelte';
  import type { ContrastAlgorithm, SwatchContrastIndicators } from '$lib/types';

  interface Props {
    onHistoryCommit?: (label: string) => void;
  }

  let { onHistoryCommit }: Props = $props();

  // Derived values from stores
  let contrastModeLocal = $derived($contrastMode);
  let contrastColorsLocal = $derived($contrastColors);
  let lowReferenceLocal = $derived($lowReference);
  let highReferenceLocal = $derived($highReference);
  let contrastAlgorithmLocal = $derived($contrastAlgorithm);
  let swatchContrastIndicatorsLocal = $derived($swatchContrastIndicators);
  let activeSwatchPickerLocal = $derived($activeSwatchPicker);
  let neutralsHexLocal = $derived($neutralsHex);
  let palettesHexLocal = $derived($palettesHex);
  let customNeutralNameLocal = $derived($customNeutralName);
  let customPaletteNamesLocal = $derived($customPaletteNames);
  let neutralLabel = $derived(
    neutralsHexLocal.length > 0
      ? resolveNeutralPaletteName(neutralsHexLocal, contrastColorsLocal.low, customNeutralNameLocal)
      : DEFAULT_NEUTRAL_PALETTE_NAME
  );
  let paletteLabels = $derived(
    palettesHexLocal.length > 0
      ? resolveGeneratedPaletteNames(
          palettesHexLocal,
          contrastColorsLocal.low,
          customPaletteNamesLocal
        )
      : []
  );
  function handleModeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newMode = target.value as 'auto' | 'manual';
    updateColorState({
      contrastMode: newMode
    });
    onHistoryCommit?.('Contrast mode changed');
  }

  function getVisibleIndicatorLabels(
    algorithm: ContrastAlgorithm,
    indicators: SwatchContrastIndicators
  ): string[] {
    if (algorithm === 'WCAG') {
      return [
        ...(indicators.wcagThreeToOne ? ['3:1'] : []),
        ...(indicators.wcagAA ? ['AA 4.5:1'] : []),
        ...(indicators.wcagAAA ? ['AAA 7:1'] : [])
      ];
    }

    return [
      ...(indicators.apcaLarge ? ['Large'] : []),
      ...(indicators.apcaFluent ? ['Fluent'] : []),
      ...(indicators.apcaBody ? ['Body'] : [])
    ];
  }

  function updateIndicatorState(nextIndicators: SwatchContrastIndicators): void {
    const hasAnyVisible = Object.values(nextIndicators).some(Boolean);
    updateColorState({
      swatchContrastIndicators: nextIndicators,
      showSwatchContrastIndicators: hasAnyVisible
    });

    const visibleLabels = getVisibleIndicatorLabels(contrastAlgorithmLocal, nextIndicators);
    if (visibleLabels.length === 0) {
      announce('Swatch contrast indicators hidden');
      onHistoryCommit?.('Contrast indicators changed');
      return;
    }

    announce(`Swatch contrast indicators showing ${visibleLabels.join(' and ')}`);
    onHistoryCommit?.('Contrast indicators changed');
  }

  function handleContrastAlgorithmChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as ContrastAlgorithm;
    updateColorState({ contrastAlgorithm: value });

    const visibleLabels = getVisibleIndicatorLabels(value, swatchContrastIndicatorsLocal);
    if (visibleLabels.length === 0) {
      announce(`Contrast algorithm changed to ${value === 'WCAG' ? 'WCAG 2.2' : 'APCA'}`);
      onHistoryCommit?.('Contrast algorithm changed');
      return;
    }

    announce(
      `Contrast algorithm changed to ${value === 'WCAG' ? 'WCAG 2.2' : 'APCA'} with ${visibleLabels.join(' and ')} indicators`
    );
    onHistoryCommit?.('Contrast algorithm changed');
  }

  function handleIndicatorToggle(key: keyof SwatchContrastIndicators, checked: boolean): void {
    const nextIndicators = {
      ...swatchContrastIndicatorsLocal,
      [key]: checked
    };

    updateIndicatorState(nextIndicators);
  }

  function handleLowColorChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const newColor = target.value;

    // Validate hex color format to prevent invalid colors
    if (isValidHexColor(newColor)) {
      updateColorState({
        contrast: {
          ...contrastColorsLocal,
          low: newColor
        },
        contrastMode: 'manual'
      });
      onHistoryCommit?.('Low contrast color changed');
    }
  }

  function handleHighColorChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const newColor = target.value;

    // Validate hex color format to prevent invalid colors
    if (isValidHexColor(newColor)) {
      updateColorState({
        contrast: {
          ...contrastColorsLocal,
          high: newColor
        },
        contrastMode: 'manual'
      });
      onHistoryCommit?.('High contrast color changed');
    }
  }

  function describeReference(
    reference: typeof lowReferenceLocal,
    color: string
  ): { label: string; valid: boolean; color: string } {
    if (reference.kind === 'neutral') {
      return {
        label: `${neutralLabel}, step ${reference.stepIndex * 10}`,
        valid: reference.stepIndex >= 0 && reference.stepIndex < neutralsHexLocal.length,
        color
      };
    }

    const palette = palettesHexLocal[reference.paletteIndex ?? -1];
    const paletteLabel = paletteLabels[reference.paletteIndex ?? -1] ?? 'Palette';
    return {
      label: `${paletteLabel}, step ${reference.stepIndex * 10}`,
      valid: !!palette && reference.stepIndex >= 0 && reference.stepIndex < palette.length,
      color
    };
  }

  let lowReferenceSummary = $derived(describeReference(lowReferenceLocal, contrastColorsLocal.low));
  let highReferenceSummary = $derived(
    describeReference(highReferenceLocal, contrastColorsLocal.high)
  );

  function beginReferencePick(target: 'low' | 'high'): void {
    activeSwatchPicker.set({
      kind: 'contrast-reference',
      target
    });
    announce(`Pick a swatch for the ${target} reference`);
  }

  function cancelReferencePick(): void {
    activeSwatchPicker.set(null);
    announce('Contrast reference picker cancelled');
  }

  function handleWindowKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && activeSwatchPickerLocal?.kind === 'contrast-reference') {
      cancelReferencePick();
    }
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<section class="contrast-controls">
  <div class="field">
    <div class="label-row">
      <label class="label" for="contrast-algorithm">Contrast Algorithm</label>
      <HelpTooltip
        id="contrast-algorithm-help"
        label="Explain Contrast Algorithm"
        text={HELP_TOPICS.contrastAlgorithm.tooltip}
      />
    </div>
    <select
      class="select"
      id="contrast-algorithm"
      value={contrastAlgorithmLocal}
      onchange={handleContrastAlgorithmChange}
      aria-label="Contrast algorithm"
    >
      <option value="WCAG">WCAG 2.2</option>
      <option value="APCA">APCA</option>
    </select>
  </div>

  <div class="field">
    <div class="label-row">
      <span class="label">Swatch Contrast Indicators</span>
      <HelpTooltip
        id="indicator-levels-help"
        label="Explain Swatch Contrast Indicators"
        text={HELP_TOPICS.indicatorLevels.tooltip}
      />
    </div>
    <div class="checklist" role="group" aria-label="Swatch contrast indicators">
      {#if contrastAlgorithmLocal === 'WCAG'}
        <CheckboxRow
          id="indicator-wcag-3to1"
          label="3:1 (Large/UI/Links)"
          checked={swatchContrastIndicatorsLocal.wcagThreeToOne}
          ariaLabel="Show WCAG 3 to 1 indicator"
          helpLabel="Explain WCAG 3 to 1 level"
          helpText={HELP_TOPICS.wcagThreeToOne.tooltip}
          onChange={(checked) => handleIndicatorToggle('wcagThreeToOne', checked)}
        />
        <CheckboxRow
          id="indicator-wcag-aa"
          label="AA (4.5:1)"
          checked={swatchContrastIndicatorsLocal.wcagAA}
          ariaLabel="Show WCAG AA indicator"
          helpLabel="Explain WCAG AA level"
          helpText={HELP_TOPICS.wcagAA.tooltip}
          onChange={(checked) => handleIndicatorToggle('wcagAA', checked)}
        />
        <CheckboxRow
          id="indicator-wcag-aaa"
          label="AAA (7:1)"
          checked={swatchContrastIndicatorsLocal.wcagAAA}
          ariaLabel="Show WCAG AAA indicator"
          helpLabel="Explain WCAG AAA level"
          helpText={HELP_TOPICS.wcagAAA.tooltip}
          onChange={(checked) => handleIndicatorToggle('wcagAAA', checked)}
        />
      {:else}
        <CheckboxRow
          id="indicator-apca-large"
          label="Large"
          checked={swatchContrastIndicatorsLocal.apcaLarge}
          ariaLabel="Show APCA Large indicator"
          helpLabel="Explain APCA Large level"
          helpText={HELP_TOPICS.apcaLarge.tooltip}
          onChange={(checked) => handleIndicatorToggle('apcaLarge', checked)}
        />
        <CheckboxRow
          id="indicator-apca-fluent"
          label="Fluent"
          checked={swatchContrastIndicatorsLocal.apcaFluent}
          ariaLabel="Show APCA Fluent indicator"
          helpLabel="Explain APCA Fluent level"
          helpText={HELP_TOPICS.apcaFluent.tooltip}
          onChange={(checked) => handleIndicatorToggle('apcaFluent', checked)}
        />
        <CheckboxRow
          id="indicator-apca-body"
          label="Body"
          checked={swatchContrastIndicatorsLocal.apcaBody}
          ariaLabel="Show APCA Body indicator"
          helpLabel="Explain APCA Body level"
          helpText={HELP_TOPICS.apcaBody.tooltip}
          onChange={(checked) => handleIndicatorToggle('apcaBody', checked)}
        />
      {/if}
    </div>
  </div>

  <div class="field">
    <div class="label-row">
      <label class="label" for="contrast-mode">Contrast Mode</label>
      <HelpTooltip
        id="contrast-mode-help"
        label="Explain Contrast Mode"
        text={HELP_TOPICS.contrastMode.tooltip}
      />
    </div>
    <select class="select" id="contrast-mode" value={contrastModeLocal} onchange={handleModeChange}>
      <option value="auto">Auto</option>
      <option value="manual">Manual</option>
    </select>
  </div>

  {#if contrastModeLocal === 'manual'}
    <div class="manual-controls">
      <div class="field">
        <div class="label-row">
          <label class="label" for="contrast-low">Low Contrast Color</label>
          <HelpTooltip
            id="low-reference-help"
            label="Explain Low Reference"
            text={HELP_TOPICS.lowReference.tooltip}
          />
        </div>
        <div class="color-input-group">
          <input
            id="contrast-low"
            type="color"
            value={contrastColorsLocal.low}
            onchange={handleLowColorChange}
            aria-describedby="contrast-low-hex"
          />
          <input
            id="contrast-low-hex"
            type="text"
            class="input mono"
            value={contrastColorsLocal.low}
            onchange={handleLowColorChange}
            placeholder="#ffffff"
            aria-label="Low contrast color hex value"
          />
        </div>
      </div>

      <div class="field">
        <div class="label-row">
          <label class="label" for="contrast-high">High Contrast Color</label>
          <HelpTooltip
            id="high-reference-help"
            label="Explain High Reference"
            text={HELP_TOPICS.highReference.tooltip}
          />
        </div>
        <div class="color-input-group">
          <input
            id="contrast-high"
            type="color"
            value={contrastColorsLocal.high}
            onchange={handleHighColorChange}
            aria-describedby="contrast-high-hex"
          />
          <input
            id="contrast-high-hex"
            type="text"
            class="input mono"
            value={contrastColorsLocal.high}
            onchange={handleHighColorChange}
            placeholder="#000000"
            aria-label="High contrast color hex value"
          />
        </div>
      </div>
    </div>
  {:else}
    <div class="auto-controls">
      <div class="field">
        <div class="label-row">
          <span class="label">Low Reference</span>
          <HelpTooltip
            id="low-reference-help"
            label="Explain Low Reference"
            text={HELP_TOPICS.lowReference.tooltip}
          />
        </div>
        <div class="reference-row">
          <div class="reference-chip" class:reference-chip--invalid={!lowReferenceSummary.valid}>
            <span
              class="reference-chip-swatch"
              style="background-color: {lowReferenceSummary.color};"
              aria-hidden="true"
            ></span>
            <span>{lowReferenceSummary.label}</span>
          </div>
          <button type="button" class="picker-button" onclick={() => beginReferencePick('low')}
            >Pick low reference</button
          >
        </div>
      </div>

      <div class="field">
        <div class="label-row">
          <span class="label">High Reference</span>
          <HelpTooltip
            id="high-reference-help"
            label="Explain High Reference"
            text={HELP_TOPICS.highReference.tooltip}
          />
        </div>
        <div class="reference-row">
          <div class="reference-chip" class:reference-chip--invalid={!highReferenceSummary.valid}>
            <span
              class="reference-chip-swatch"
              style="background-color: {highReferenceSummary.color};"
              aria-hidden="true"
            ></span>
            <span>{highReferenceSummary.label}</span>
          </div>
          <button type="button" class="picker-button" onclick={() => beginReferencePick('high')}
            >Pick high reference</button
          >
        </div>
      </div>

      {#if activeSwatchPickerLocal?.kind === 'contrast-reference'}
        <div class="picker-banner" role="status">
          <span>Select a swatch to set the {activeSwatchPickerLocal.target} reference.</span>
          <button type="button" class="picker-button" onclick={cancelReferencePick}>Cancel</button>
        </div>
      {/if}
    </div>
  {/if}
</section>

<style>
  .contrast-controls {
    display: grid;
    gap: var(--space-md);
  }

  .checklist {
    display: grid;
    gap: var(--space-xs);
    padding: var(--space-xs) 0;
  }

  .label-row {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }

  .color-input-group {
    display: flex;
    gap: var(--space-sm);
    align-items: center;
  }

  .reference-row {
    display: flex;
    gap: var(--space-sm);
    align-items: center;
    flex-wrap: wrap;
  }

  .reference-chip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
    min-height: var(--touch-target-comfortable);
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  .reference-chip--invalid {
    border-color: color-mix(in oklab, var(--gamut-warning-border) 75%, var(--border));
  }

  .reference-chip-swatch {
    width: var(--space-lg);
    height: var(--space-lg);
    border-radius: var(--radius-sm);
    border: 1px solid color-mix(in oklab, var(--border) 70%, transparent);
    flex: 0 0 auto;
  }

  .picker-button {
    min-height: var(--touch-target-comfortable);
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-primary);
    color: var(--text-primary);
    font: inherit;
    cursor: pointer;
  }

  .picker-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    border: 1px solid color-mix(in oklab, var(--accent) 35%, var(--border));
    border-radius: var(--radius-md);
    background: color-mix(in oklab, var(--accent) 8%, var(--bg-primary));
    color: var(--text-primary);
    font-size: var(--font-size-sm);
  }

  .color-input-group input[type='color'] {
    width: 60px;
    height: var(--touch-target-min);
    cursor: pointer;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: transparent;
  }

  .manual-controls,
  .auto-controls {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }
</style>
