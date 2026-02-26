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

  const displayColorSpaceLocal = $derived($displayColorSpace);
  const oklchDisplaySignificantDigitsLocal = $derived($oklchDisplaySignificantDigits);
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

  function handleOklchSignificantDigitsInput(event: Event) {
    const parsed = parseInt((event.target as HTMLInputElement).value, 10);
    const value = clampOklchDisplaySignificantDigits(parsed) as OklchDisplaySignificantDigits;
    updateColorState({ oklchDisplaySignificantDigits: value });
  }

  function handleOklchSignificantDigitsChange(event: Event) {
    const parsed = parseInt((event.target as HTMLInputElement).value, 10);
    const value = clampOklchDisplaySignificantDigits(parsed) as OklchDisplaySignificantDigits;
    updateColorState({ oklchDisplaySignificantDigits: value });
    announce(`OKLCH significant digits changed to ${value}`);
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
    <div class="field">
      <div class="label-with-help">
        <label class="label" for="oklch-significant-digits">
          OKLCH Significant Digits ({oklchDisplaySignificantDigitsLocal})
        </label>
        <span class="help-popover">
          <button type="button" class="info-button" aria-label="Explain OKLCH significant digits">
            <span aria-hidden="true">i</span>
          </button>
          <span id="oklch-significant-digits-help" class="help-tooltip" role="tooltip">
            Controls how many significant digits OKLCH swatches use for rendering and labels.
          </span>
        </span>
      </div>
      <div class="slider-wrapper">
        <input
          id="oklch-significant-digits"
          type="range"
          min="1"
          max="6"
          step="1"
          value={String(oklchDisplaySignificantDigitsLocal)}
          oninput={handleOklchSignificantDigitsInput}
          onchange={handleOklchSignificantDigitsChange}
          aria-label="OKLCH display significant digits"
          aria-describedby="oklch-significant-digits-help"
          tabindex="0"
        />
      </div>
    </div>
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

  input[type='range'] {
    width: 100%;
  }

  .slider-wrapper:focus-within {
    outline: 3px solid white;
    box-shadow: 0 0 0 6px black;
  }

  .slider-wrapper input:focus-visible {
    outline: none;
    box-shadow: none;
  }

  .slider-wrapper {
    width: 100%;
    padding: 0 var(--space-sm);
    box-sizing: border-box;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .label-with-help {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }

  .help-popover {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .info-button {
    width: var(--touch-target-min);
    min-width: var(--touch-target-min);
    height: var(--touch-target-min);
    border-radius: 50%;
    border: 1px solid var(--border);
    background: var(--bg-primary);
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    line-height: 1;
    cursor: help;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .help-tooltip {
    position: absolute;
    inset-block-start: calc(100% + var(--space-xs));
    inset-inline-end: 0;
    inset-inline-start: auto;
    z-index: 20;
    inline-size: min(32ch, calc(100vw - var(--space-xl)));
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    border: 1px solid var(--border);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-normal);
    box-shadow: 0 6px 16px color-mix(in oklab, black 14%, transparent);
    visibility: hidden;
    opacity: 0;
    transform: translateY(-2px);
    pointer-events: none;
    transition:
      opacity var(--transition-fast),
      transform var(--transition-fast),
      visibility var(--transition-fast);
  }

  .help-popover:hover .help-tooltip,
  .help-popover:focus-within .help-tooltip {
    visibility: visible;
    opacity: 1;
    transform: translateY(0);
  }
</style>
