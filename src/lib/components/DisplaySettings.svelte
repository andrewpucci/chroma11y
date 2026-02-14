<script lang="ts">
  import {
    displayColorSpace,
    gamutSpace,
    themePreference,
    swatchLabels,
    contrastAlgorithm,
    updateColorState,
    setThemePreference
  } from '$lib/stores';
  import { announce } from '$lib/announce';
  import type {
    DisplayColorSpace,
    GamutSpace,
    ThemePreference,
    SwatchLabels,
    ContrastAlgorithm
  } from '$lib/types';

  const displayColorSpaceLocal = $derived($displayColorSpace);
  const gamutSpaceLocal = $derived($gamutSpace);
  const themePreferenceLocal = $derived($themePreference);
  const swatchLabelsLocal = $derived($swatchLabels);
  const contrastAlgorithmLocal = $derived($contrastAlgorithm);

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
    announce(`Contrast algorithm changed to ${value === 'WCAG21' ? 'WCAG 2.1' : 'APCA'}`);
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
      <option value="WCAG21">WCAG 2.1</option>
      <option value="APCA">APCA</option>
    </select>
  </div>
</section>

<style>
  .display-settings {
    display: grid;
    gap: 0.9rem;
  }
</style>
