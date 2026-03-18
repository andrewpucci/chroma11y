<script lang="ts">
  import {
    displayColorSpace,
    oklchDisplaySignificantDigits,
    gamutSpace,
    themePreference,
    swatchLabels,
    showSwatchGamutWarnings,
    updateColorState,
    setThemePreference
  } from '$lib/stores';
  import SliderNumberField from './SliderNumberField.svelte';
  import { announce } from '$lib/announce';
  import { clampOklchDisplaySignificantDigits } from '$lib/colorUtils';
  import type {
    DisplayColorSpace,
    GamutSpace,
    ThemePreference,
    SwatchLabels,
    OklchDisplaySignificantDigits
  } from '$lib/types';

  interface Props {
    onHistoryCommit?: (label: string) => void;
  }

  let { onHistoryCommit }: Props = $props();

  interface RangeConfig {
    min: number;
    max: number;
    step: number;
  }

  const OKLCH_SIGNIFICANT_DIGITS_RANGE: RangeConfig = { min: 1, max: 6, step: 1 };

  const displayColorSpaceLocal = $derived($displayColorSpace);
  const oklchDisplaySignificantDigitsLocal = $derived($oklchDisplaySignificantDigits);
  const gamutSpaceLocal = $derived($gamutSpace);
  const themePreferenceLocal = $derived($themePreference);
  const swatchLabelsLocal = $derived($swatchLabels);
  const showSwatchGamutWarningsLocal = $derived($showSwatchGamutWarnings);
  const swatchStepLabelEnabled = $derived(
    swatchLabelsLocal === 'both' || swatchLabelsLocal === 'step'
  );
  const swatchValueLabelEnabled = $derived(
    swatchLabelsLocal === 'both' || swatchLabelsLocal === 'value'
  );

  function setOklchSignificantDigits(value: number, shouldAnnounce: boolean): void {
    const clampedValue = clampOklchDisplaySignificantDigits(value) as OklchDisplaySignificantDigits;
    updateColorState({ oklchDisplaySignificantDigits: clampedValue });
    if (shouldAnnounce) {
      announce(`OKLCH significant digits changed to ${clampedValue}`);
      onHistoryCommit?.('OKLCH significant digits changed');
    }
  }

  function handleDisplayColorSpaceChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value as DisplayColorSpace;
    if (value === 'hex') {
      updateColorState({ displayColorSpace: value, gamutSpace: 'srgb' });
      announce('Display color space changed to hex. Gamut mapping fixed to sRGB');
      onHistoryCommit?.('Display color space changed');
      return;
    }

    updateColorState({ displayColorSpace: value });
    announce(`Display color space changed to ${value}`);
    onHistoryCommit?.('Display color space changed');
  }

  function handleGamutSpaceChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value as GamutSpace;
    updateColorState({ gamutSpace: value });
    announce(
      `Gamut mapping changed to ${value === 'srgb' ? 'sRGB' : value === 'p3' ? 'Display P3' : 'Rec. 2020'}`
    );
    onHistoryCommit?.('Gamut mapping changed');
  }

  function handleOklchSignificantDigitsInput(event: Event) {
    const parsed = parseInt((event.target as HTMLInputElement).value, 10);
    setOklchSignificantDigits(parsed, false);
  }

  function handleOklchSignificantDigitsChange(event: Event) {
    const parsed = parseInt((event.target as HTMLInputElement).value, 10);
    setOklchSignificantDigits(parsed, true);
  }

  function handleThemePreferenceChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value as ThemePreference;
    setThemePreference(value);
    announce(`Theme preference changed to ${value === 'auto' ? 'auto (system)' : value}`);
    onHistoryCommit?.('Theme preference changed');
  }

  function toSwatchLabels(stepEnabled: boolean, valueEnabled: boolean): SwatchLabels {
    if (stepEnabled && valueEnabled) return 'both';
    if (stepEnabled) return 'step';
    if (valueEnabled) return 'value';
    return 'none';
  }

  function describeSwatchLabels(value: SwatchLabels): string {
    if (value === 'both') return 'step and value';
    if (value === 'step') return 'step only';
    if (value === 'value') return 'value only';
    return 'hidden';
  }

  function handleSwatchLabelsToggle(which: 'step' | 'value', event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const nextStep = which === 'step' ? checked : swatchStepLabelEnabled;
    const nextValue = which === 'value' ? checked : swatchValueLabelEnabled;
    const value = toSwatchLabels(nextStep, nextValue);

    updateColorState({ swatchLabels: value });
    announce(`Swatch labels changed to ${describeSwatchLabels(value)}`);
    onHistoryCommit?.('Swatch labels changed');
  }

  function handleSwatchGamutWarningsToggle(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    updateColorState({ showSwatchGamutWarnings: checked });
    announce(checked ? 'Swatch gamut warnings shown' : 'Swatch gamut warnings hidden');
    onHistoryCommit?.('Gamut warnings changed');
  }
</script>

<section class="display-settings" data-testid="display-settings">
  <div class="field">
    <label class="label" for="display-color-space">Color Space</label>
    <select
      class="select"
      id="display-color-space"
      value={displayColorSpaceLocal}
      onchange={handleDisplayColorSpaceChange}
      aria-label="Display color space format"
    >
      <option value="hex">Hex</option>
      <option value="rgb">RGB</option>
      <option value="oklch">OKLCH</option>
      <option value="hsl">HSL</option>
    </select>
  </div>

  {#if displayColorSpaceLocal === 'oklch'}
    <SliderNumberField
      id="oklch-significant-digits"
      label="OKLCH Significant Digits"
      rangeAriaLabel="OKLCH display significant digits"
      valueInputLabel="OKLCH significant digits value input"
      min={OKLCH_SIGNIFICANT_DIGITS_RANGE.min}
      max={OKLCH_SIGNIFICANT_DIGITS_RANGE.max}
      step={OKLCH_SIGNIFICANT_DIGITS_RANGE.step}
      value={oklchDisplaySignificantDigitsLocal}
      groupHelpText="Use slider for coarse adjustment and number input for precise adjustment."
      infoButtonLabel="Explain OKLCH significant digits"
      infoTooltipId="oklch-significant-digits-help"
      infoTooltipText="Controls how many significant digits OKLCH swatches use for rendering and labels."
      onRangeInput={handleOklchSignificantDigitsInput}
      onRangeChange={handleOklchSignificantDigitsChange}
      onNumberInput={handleOklchSignificantDigitsInput}
      onNumberChange={handleOklchSignificantDigitsChange}
    />
  {/if}

  <div class="field">
    <label class="label" for="gamut-space">Gamut Mapping</label>
    <select
      class="select"
      id="gamut-space"
      value={gamutSpaceLocal}
      onchange={handleGamutSpaceChange}
      aria-label="Gamut mapping target"
      disabled={displayColorSpaceLocal === 'hex'}
      aria-describedby={displayColorSpaceLocal === 'hex' ? 'gamut-space-help' : undefined}
    >
      <option value="srgb">sRGB</option>
      <option value="p3">Display P3</option>
      <option value="rec2020">Rec. 2020</option>
    </select>
    {#if displayColorSpaceLocal === 'hex'}
      <p id="gamut-space-help" class="field-help">
        Hex output is fixed to sRGB, so gamut mapping cannot be changed.
      </p>
    {/if}
  </div>

  <div class="field">
    <span class="label">Gamut Warnings</span>
    <label class="check-item" for="show-swatch-gamut-warnings">
      <input
        id="show-swatch-gamut-warnings"
        type="checkbox"
        checked={showSwatchGamutWarningsLocal}
        onchange={handleSwatchGamutWarningsToggle}
        aria-label="Show gamut warnings on mapped swatches"
      />
      <span>Show warnings on gamut-mapped swatches</span>
    </label>
  </div>

  <div class="field">
    <label class="label" for="theme-preference">Theme</label>
    <select
      class="select"
      id="theme-preference"
      value={themePreferenceLocal}
      onchange={handleThemePreferenceChange}
      aria-label="Theme preference"
    >
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="auto">Auto (System)</option>
    </select>
  </div>

  <div class="field">
    <span class="label">Swatch Labels</span>
    <div class="checklist" role="group" aria-label="Swatch label display options">
      <label class="check-item" for="swatch-label-step">
        <input
          id="swatch-label-step"
          type="checkbox"
          checked={swatchStepLabelEnabled}
          onchange={(event) => handleSwatchLabelsToggle('step', event)}
          aria-label="Show step labels on swatches"
        />
        <span>Step</span>
      </label>
      <label class="check-item" for="swatch-label-value">
        <input
          id="swatch-label-value"
          type="checkbox"
          checked={swatchValueLabelEnabled}
          onchange={(event) => handleSwatchLabelsToggle('value', event)}
          aria-label="Show value labels on swatches"
        />
        <span>Value</span>
      </label>
    </div>
  </div>
</section>

<style>
  .display-settings {
    display: grid;
    gap: var(--space-md);
  }

  .checklist {
    display: grid;
    gap: var(--space-xs);
    padding: var(--space-xs) 0;
  }

  .check-item {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    min-height: var(--touch-target-comfortable);
    font-size: var(--font-size-sm);
    color: var(--text-primary);
  }

  .check-item input {
    width: var(--touch-target-min);
    height: var(--touch-target-min);
    margin: 0;
    accent-color: var(--accent);
  }

  .field-help {
    margin: var(--space-xs) 0 0;
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
  }
</style>
