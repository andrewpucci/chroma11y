<script lang="ts">
  import {
    displayColorSpace,
    oklchDisplaySignificantDigits,
    gamutSpace,
    themePreference,
    swatchLabels,
    contrastAlgorithm,
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
    ContrastAlgorithm,
    OklchDisplaySignificantDigits
  } from '$lib/types';

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
  const contrastAlgorithmLocal = $derived($contrastAlgorithm);

  function setOklchSignificantDigits(value: number, shouldAnnounce: boolean): void {
    const clampedValue = clampOklchDisplaySignificantDigits(value) as OklchDisplaySignificantDigits;
    updateColorState({ oklchDisplaySignificantDigits: clampedValue });
    if (shouldAnnounce) {
      announce(`OKLCH significant digits changed to ${clampedValue}`);
    }
  }

  function handleDisplayColorSpaceChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value as DisplayColorSpace;
    updateColorState({ displayColorSpace: value });
    announce(`Display color space changed to ${value}`);
  }

  function handleGamutSpaceChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value as GamutSpace;
    updateColorState({ gamutSpace: value });
    announce(
      `Gamut mapping changed to ${value === 'srgb' ? 'sRGB' : value === 'p3' ? 'Display P3' : 'Rec. 2020'}`
    );
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
  }

  function handleSwatchLabelsChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value as SwatchLabels;
    updateColorState({ swatchLabels: value });
    announce(
      `Swatch labels changed to ${value === 'both' ? 'step and value' : value === 'none' ? 'hidden' : value + ' only'}`
    );
  }

  function handleContrastAlgorithmChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value as ContrastAlgorithm;
    updateColorState({ contrastAlgorithm: value });
    announce(`Contrast algorithm changed to ${value === 'WCAG' ? 'WCAG 2.1' : 'APCA'}`);
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
    >
      <option value="srgb">sRGB</option>
      <option value="p3">Display P3</option>
      <option value="rec2020">Rec. 2020</option>
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
    <label class="label" for="swatch-labels">Swatch Labels</label>
    <select
      class="select"
      id="swatch-labels"
      value={swatchLabelsLocal}
      onchange={handleSwatchLabelsChange}
      aria-label="Swatch label display"
    >
      <option value="both">Step + Value</option>
      <option value="step">Step Only</option>
      <option value="value">Value Only</option>
      <option value="none">None</option>
    </select>
  </div>

  <div class="field">
    <label class="label" for="contrast-algorithm">Contrast Algorithm</label>
    <select
      class="select"
      id="contrast-algorithm"
      value={contrastAlgorithmLocal}
      onchange={handleContrastAlgorithmChange}
      aria-label="Contrast algorithm"
    >
      <option value="WCAG">WCAG 2.1</option>
      <option value="APCA">APCA</option>
    </select>
  </div>
</section>

<style>
  .display-settings {
    display: grid;
    gap: var(--space-md);
  }
</style>
