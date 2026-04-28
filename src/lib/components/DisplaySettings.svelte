<script lang="ts">
  import { HELP_TOPICS } from '$lib/help/helpContent';
  import Icon from './Icon.svelte';
  import CheckboxRow from './CheckboxRow.svelte';
  import HelpTooltip from './HelpTooltip.svelte';
  import SelectField from './SelectField.svelte';
  import {
    displayColorSpace,
    oklchDisplaySignificantDigits,
    gamutSpace,
    themePreference,
    swatchLabels,
    showSwatchGamutWarnings,
    cvdMode,
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
    OklchDisplaySignificantDigits,
    CvdMode
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
  const cvdModeLocal = $derived($cvdMode);
  const swatchStepLabelEnabled = $derived(
    swatchLabelsLocal === 'both' || swatchLabelsLocal === 'step'
  );
  const swatchValueLabelEnabled = $derived(
    swatchLabelsLocal === 'both' || swatchLabelsLocal === 'value'
  );

  const CVD_OPTIONS: { value: CvdMode; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'protanopia', label: 'Protanopia (red-blind)' },
    { value: 'deuteranopia', label: 'Deuteranopia (green-blind)' },
    { value: 'tritanopia', label: 'Tritanopia (blue-blind)' },
    { value: 'achromatopsia', label: 'Achromatopsia (full)' }
  ];

  function setOklchSignificantDigits(value: number, shouldAnnounce: boolean): void {
    const clampedValue = clampOklchDisplaySignificantDigits(value) as OklchDisplaySignificantDigits;
    updateColorState({ oklchDisplaySignificantDigits: clampedValue });
    if (shouldAnnounce) {
      announce(`OKLCH significant digits changed to ${clampedValue}`);
      onHistoryCommit?.('OKLCH significant digits changed');
    }
  }

  function handleDisplayColorSpaceChange(value: string) {
    const space = value as DisplayColorSpace;
    if (space === 'hex') {
      updateColorState({ displayColorSpace: space, gamutSpace: 'srgb' });
      announce('Display color space changed to hex. Gamut mapping fixed to sRGB');
      onHistoryCommit?.('Display color space changed');
      return;
    }

    updateColorState({ displayColorSpace: space });
    announce(`Display color space changed to ${space}`);
    onHistoryCommit?.('Display color space changed');
  }

  function handleGamutSpaceChange(value: string) {
    const space = value as GamutSpace;
    updateColorState({ gamutSpace: space });
    announce(
      `Gamut mapping changed to ${space === 'srgb' ? 'sRGB' : space === 'p3' ? 'Display P3' : 'Rec. 2020'}`
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

  function handleThemePreferenceChange(value: string) {
    const pref = value as ThemePreference;
    setThemePreference(pref);
    announce(`Theme preference changed to ${pref === 'auto' ? 'auto (system)' : pref}`);
    onHistoryCommit?.('Theme preference changed');
  }

  function handleCvdModeChange(value: string) {
    const mode = value as CvdMode;
    updateColorState({ cvdMode: mode });
    announce(
      mode === 'none'
        ? 'Color vision simulation off'
        : `Simulating ${CVD_OPTIONS.find((o) => o.value === mode)?.label ?? mode}`
    );
    onHistoryCommit?.('CVD simulation changed');
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

  function handleSwatchLabelsToggle(which: 'step' | 'value', checked: boolean) {
    const nextStep = which === 'step' ? checked : swatchStepLabelEnabled;
    const nextValue = which === 'value' ? checked : swatchValueLabelEnabled;
    const value = toSwatchLabels(nextStep, nextValue);

    updateColorState({ swatchLabels: value });
    announce(`Swatch labels changed to ${describeSwatchLabels(value)}`);
    onHistoryCommit?.('Swatch labels changed');
  }

  function handleSwatchGamutWarningsToggle(checked: boolean) {
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
    <SelectField
      id="display-color-space"
      label="Color Space"
      value={displayColorSpaceLocal}
      options={[
        { value: 'hex', label: 'Hex' },
        { value: 'rgb', label: 'RGB' },
        { value: 'oklch', label: 'OKLCH' },
        { value: 'hsl', label: 'HSL' }
      ]}
      ariaLabel="Display color space format"
      helpId="color-space-help"
      helpLabel="Explain Color Space"
      helpText={HELP_TOPICS.colorSpace.tooltip}
      onchange={handleDisplayColorSpaceChange}
    />

    <SelectField
      id="theme-preference"
      label="Theme"
      value={themePreferenceLocal}
      options={[
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'auto', label: 'Auto (System)' }
      ]}
      ariaLabel="Theme preference"
      onchange={handleThemePreferenceChange}
    />

    <SelectField
      id="cvd-mode"
      label="Color Vision Simulation"
      value={cvdModeLocal}
      options={CVD_OPTIONS}
      ariaLabel="Color vision deficiency simulation"
      helpId="cvd-mode-help"
      helpLabel="Explain Color Vision Simulation"
      helpText={HELP_TOPICS.cvdSimulation.tooltip}
      onchange={handleCvdModeChange}
    />

    <div class="field">
      <span class="label">Swatch Labels</span>
      <div class="checklist" role="group" aria-label="Swatch label display options">
        <CheckboxRow
          id="swatch-label-step"
          label="Step"
          checked={swatchStepLabelEnabled}
          ariaLabel="Show step labels on swatches"
          onChange={(checked) => handleSwatchLabelsToggle('step', checked)}
        />
        <CheckboxRow
          id="swatch-label-value"
          label="Value"
          checked={swatchValueLabelEnabled}
          ariaLabel="Show value labels on swatches"
          onChange={(checked) => handleSwatchLabelsToggle('value', checked)}
        />
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
            infoTooltipText={HELP_TOPICS.oklchPrecision.tooltip}
            onRangeInput={handleOklchSignificantDigitsInput}
            onRangeChange={handleOklchSignificantDigitsChange}
            onNumberInput={handleOklchSignificantDigitsInput}
            onNumberChange={handleOklchSignificantDigitsChange}
          />
        {/if}

        <SelectField
          id="gamut-space"
          label="Gamut Mapping"
          value={gamutSpaceLocal}
          options={[
            { value: 'srgb', label: 'sRGB' },
            { value: 'p3', label: 'Display P3' },
            { value: 'rec2020', label: 'Rec. 2020' }
          ]}
          ariaLabel="Gamut mapping target"
          helpId="gamut-mapping-help"
          helpLabel="Explain Gamut Mapping"
          helpText={HELP_TOPICS.gamutMapping.tooltip}
          disabled={displayColorSpaceLocal === 'hex'}
          describedById={displayColorSpaceLocal === 'hex' ? 'gamut-space-help' : undefined}
          fieldHelp={displayColorSpaceLocal === 'hex'
            ? 'Hex output is fixed to sRGB, so gamut mapping cannot be changed.'
            : undefined}
          onchange={handleGamutSpaceChange}
        />

        <div class="field">
          <div class="label-row">
            <span class="label">Gamut Warnings</span>
            <HelpTooltip
              id="gamut-warnings-help"
              label="Explain Gamut Warnings"
              text={HELP_TOPICS.gamutWarnings.tooltip}
            />
          </div>
          <CheckboxRow
            id="show-swatch-gamut-warnings"
            label="Show warnings on gamut-mapped swatches"
            checked={showSwatchGamutWarningsLocal}
            ariaLabel="Show gamut warnings on mapped swatches"
            helpLabel="Explain gamut-mapped swatch warnings"
            helpText={HELP_TOPICS.gamutWarnings.tooltip}
            onChange={handleSwatchGamutWarningsToggle}
          />
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

  .label-row {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    flex-wrap: wrap;
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
