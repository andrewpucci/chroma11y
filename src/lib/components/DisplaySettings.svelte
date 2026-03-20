<script lang="ts">
  import Icon from './Icon.svelte';
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
    advancedOpen?: boolean;
    onAdvancedToggle?: (open: boolean) => void;
  }

  let { onHistoryCommit, advancedOpen = false, onAdvancedToggle }: Props = $props();
  let currentAdvancedOpen = $derived(advancedOpen);

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

  function handleAdvancedToggle(event: Event): void {
    const nextOpen = (event.currentTarget as HTMLDetailsElement).open;
    currentAdvancedOpen = nextOpen;
    onAdvancedToggle?.(nextOpen);
  }
</script>

<section class="display-settings" data-testid="display-settings">
  <section class="control-subsection">
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

  <details
    class="advanced-group"
    open={currentAdvancedOpen}
    data-testid="output-advanced-group"
    ontoggle={handleAdvancedToggle}
  >
    <summary class="advanced-summary">
      <span class="advanced-heading">
        <h3 class="subsection-title">Advanced</h3>
        <span class="advanced-copy">Gamut mapping and precision</span>
      </span>
      <span class="advanced-chevron" aria-hidden="true">
        <span class="advanced-chevron-inner">
          <Icon
            name="chevron-down"
            size="var(--advanced-disclosure-icon-size)"
            stroke="var(--advanced-disclosure-icon-stroke)"
          />
        </span>
      </span>
    </summary>
    <div class="advanced-panel">
      <div class="advanced-body">
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
      </div>
    </div>
  </details>
</section>

<style>
  .display-settings {
    --advanced-disclosure-icon-size: var(--icon-size-disclosure);
    --advanced-disclosure-icon-stroke: var(--icon-stroke-disclosure);
    --advanced-expand-duration: var(--duration-normal);
    --advanced-collapse-duration: var(--duration-fast);
    --advanced-expand-ease: var(--ease-emphasized);
    --advanced-collapse-ease: var(--ease-out);
    display: grid;
    gap: var(--space-md);
  }

  .control-subsection {
    display: grid;
    gap: var(--space-md);
  }

  .advanced-heading {
    display: grid;
    gap: var(--space-xs);
  }

  .subsection-title {
    margin: 0;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    letter-spacing: var(--letter-spacing-normal);
    color: var(--text-primary);
  }

  .advanced-copy {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
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

  .advanced-group {
    border: var(--border-width-thin) solid color-mix(in oklab, var(--border) 55%, transparent);
    border-radius: var(--radius-md);
    background: color-mix(in oklab, var(--bg-primary) 92%, transparent);
    overflow: hidden;
    transition:
      border-color var(--transition-fast),
      background-color var(--transition-normal);
  }

  .advanced-summary {
    list-style: none;
    cursor: pointer;
    min-height: var(--touch-target-comfortable);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-sm);
    padding: var(--space-md);
    text-align: left;
    width: 100%;
  }

  .advanced-summary::-webkit-details-marker {
    display: none;
  }

  .advanced-summary::marker {
    content: '';
  }

  .advanced-summary:focus-visible {
    outline: none;
    box-shadow: none;
  }

  .advanced-group:has(> .advanced-summary:focus-visible) {
    outline: var(--focus-outline-width) solid var(--focus-outline-inside);
    box-shadow: 0 0 0 var(--focus-outline-offset) var(--focus-outline-outside);
  }

  .advanced-chevron {
    inline-size: calc(var(--space-md) + var(--space-2xs));
    block-size: calc(var(--space-md) + var(--space-2xs));
    flex: 0 0 calc(var(--space-md) + var(--space-2xs));
    margin-inline-start: auto;
    margin-block-start: var(--space-2xs);
    color: var(--text-primary);
    opacity: 0.92;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .advanced-chevron-inner {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition:
      transform var(--duration-normal) var(--ease-emphasized),
      opacity var(--transition-fast);
    transform-origin: center;
  }

  .advanced-group[open] .advanced-chevron-inner {
    transform: rotate(180deg);
  }

  .advanced-body {
    display: grid;
    gap: var(--space-md);
    padding: var(--space-md);
    border-top: var(--border-width-thin) solid color-mix(in oklab, var(--border) 42%, transparent);
  }

  .field-help {
    margin: var(--space-xs) 0 0;
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
  }

  @media (max-width: 980px) {
    .display-settings {
      --advanced-disclosure-icon-size: var(--icon-size-disclosure-compact);
      --advanced-disclosure-icon-stroke: var(--icon-stroke-disclosure-compact);
    }
  }

  @supports selector(::details-content) {
    @supports (interpolate-size: allow-keywords) {
      .advanced-group {
        interpolate-size: allow-keywords;
      }

      .advanced-group::details-content {
        block-size: 0;
        opacity: 0;
        overflow: clip;
        transition:
          block-size var(--advanced-collapse-duration) var(--advanced-collapse-ease),
          opacity var(--advanced-collapse-duration) var(--advanced-collapse-ease),
          content-visibility var(--advanced-collapse-duration) allow-discrete;
      }

      .advanced-group[open]::details-content {
        block-size: auto;
        opacity: 1;
        transition:
          block-size var(--advanced-expand-duration) var(--advanced-expand-ease),
          opacity var(--duration-fast) var(--ease-out),
          content-visibility var(--advanced-expand-duration) allow-discrete;
      }

      .advanced-body {
        transform: translateY(calc(var(--space-xs) * -1));
        transition: transform var(--advanced-collapse-duration) var(--advanced-collapse-ease);
      }

      .advanced-group[open] .advanced-body {
        transform: translateY(0);
        transition: transform var(--advanced-expand-duration) var(--advanced-expand-ease);
      }
    }
  }
</style>
