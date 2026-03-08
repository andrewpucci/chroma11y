<script lang="ts">
  import {
    contrastMode,
    contrastColors,
    lowStep,
    highStep,
    contrastAlgorithm,
    swatchContrastIndicators,
    updateColorState,
    updateContrastStep
  } from '$lib/stores';
  import { announce } from '$lib/announce';
  import { isValidHexColor } from '$lib/colorUtils';
  import type { ContrastAlgorithm, SwatchContrastIndicators } from '$lib/types';

  // Derived values from stores
  let contrastModeLocal = $derived($contrastMode);
  let contrastColorsLocal = $derived($contrastColors);
  let lowStepLocal = $derived($lowStep);
  let highStepLocal = $derived($highStep);
  let contrastAlgorithmLocal = $derived($contrastAlgorithm);
  let swatchContrastIndicatorsLocal = $derived($swatchContrastIndicators);
  const APCA_LEVEL_DESCRIPTIONS = {
    large:
      'APCA Lc 45 minimum for larger, heavier text such as headlines, and for icons or pictograms with fine detail.',
    fluent:
      'APCA Lc 60 minimum for fluent content text that is not body/column text. This is text users are expected to read.',
    body: 'APCA Lc 75 minimum for columns of body text where readability is critical. APCA guidance prefers Lc 90 for body text.'
  } as const;
  const WCAG_LEVEL_DESCRIPTIONS = {
    threeToOne:
      'WCAG 2.2 3:1 threshold used for large text, UI components/graphics, and link color differentiation from surrounding text when color is used.',
    aa: 'WCAG 2.2 AA text threshold: 4.5:1 for normal-size text.',
    aaa: 'WCAG 2.2 AAA text threshold: 7:1 for normal-size text.'
  } as const;

  function handleModeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newMode = target.value as 'auto' | 'manual';
    updateColorState({
      contrastMode: newMode
    });
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
      return;
    }

    announce(`Swatch contrast indicators showing ${visibleLabels.join(' and ')}`);
  }

  function handleContrastAlgorithmChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as ContrastAlgorithm;
    updateColorState({ contrastAlgorithm: value });

    const visibleLabels = getVisibleIndicatorLabels(value, swatchContrastIndicatorsLocal);
    if (visibleLabels.length === 0) {
      announce(`Contrast algorithm changed to ${value === 'WCAG' ? 'WCAG 2.2' : 'APCA'}`);
      return;
    }

    announce(
      `Contrast algorithm changed to ${value === 'WCAG' ? 'WCAG 2.2' : 'APCA'} with ${visibleLabels.join(' and ')} indicators`
    );
  }

  function handleIndicatorToggle(key: keyof SwatchContrastIndicators, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
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
    }
  }

  function handleLowStepChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newStep = parseInt(target.value);
    updateContrastStep('low', newStep);
  }

  function handleHighStepChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newStep = parseInt(target.value);
    updateContrastStep('high', newStep);
  }

  // Generate step options (0-10 for 11 color steps)
  function generateStepOptions() {
    const options = [];
    for (let i = 0; i <= 10; i++) {
      options.push(i);
    }
    return options;
  }
</script>

<section class="contrast-controls">
  <div class="field">
    <label class="label" for="contrast-algorithm">Contrast Algorithm</label>
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
    <span class="label">Swatch Contrast Indicators</span>
    <div class="checklist" role="group" aria-label="Swatch contrast indicators">
      {#if contrastAlgorithmLocal === 'WCAG'}
        <div class="check-item">
          <input
            id="indicator-wcag-3to1"
            type="checkbox"
            checked={swatchContrastIndicatorsLocal.wcagThreeToOne}
            onchange={(event) => handleIndicatorToggle('wcagThreeToOne', event)}
            aria-label="Show WCAG 3 to 1 indicator"
          />
          <span class="check-label-with-help">
            <label class="check-label" for="indicator-wcag-3to1">3:1 (Large/UI/Links)</label>
            <span class="help-popover">
              <button
                type="button"
                class="info-button"
                aria-label="Explain WCAG 3 to 1 level"
                aria-describedby="wcag-3to1-help"
              >
                <span aria-hidden="true">i</span>
              </button>
              <span id="wcag-3to1-help" class="help-tooltip" role="tooltip">
                {WCAG_LEVEL_DESCRIPTIONS.threeToOne}
              </span>
            </span>
          </span>
        </div>
        <div class="check-item">
          <input
            id="indicator-wcag-aa"
            type="checkbox"
            checked={swatchContrastIndicatorsLocal.wcagAA}
            onchange={(event) => handleIndicatorToggle('wcagAA', event)}
            aria-label="Show WCAG AA indicator"
          />
          <span class="check-label-with-help">
            <label class="check-label" for="indicator-wcag-aa">AA (4.5:1)</label>
            <span class="help-popover">
              <button
                type="button"
                class="info-button"
                aria-label="Explain WCAG AA level"
                aria-describedby="wcag-aa-help"
              >
                <span aria-hidden="true">i</span>
              </button>
              <span id="wcag-aa-help" class="help-tooltip" role="tooltip">
                {WCAG_LEVEL_DESCRIPTIONS.aa}
              </span>
            </span>
          </span>
        </div>
        <div class="check-item">
          <input
            id="indicator-wcag-aaa"
            type="checkbox"
            checked={swatchContrastIndicatorsLocal.wcagAAA}
            onchange={(event) => handleIndicatorToggle('wcagAAA', event)}
            aria-label="Show WCAG AAA indicator"
          />
          <span class="check-label-with-help">
            <label class="check-label" for="indicator-wcag-aaa">AAA (7:1)</label>
            <span class="help-popover">
              <button
                type="button"
                class="info-button"
                aria-label="Explain WCAG AAA level"
                aria-describedby="wcag-aaa-help"
              >
                <span aria-hidden="true">i</span>
              </button>
              <span id="wcag-aaa-help" class="help-tooltip" role="tooltip">
                {WCAG_LEVEL_DESCRIPTIONS.aaa}
              </span>
            </span>
          </span>
        </div>
      {:else}
        <div class="check-item">
          <input
            id="indicator-apca-large"
            type="checkbox"
            checked={swatchContrastIndicatorsLocal.apcaLarge}
            onchange={(event) => handleIndicatorToggle('apcaLarge', event)}
            aria-label="Show APCA Large indicator"
          />
          <span class="check-label-with-help">
            <label class="check-label" for="indicator-apca-large">Large</label>
            <span class="help-popover">
              <button
                type="button"
                class="info-button"
                aria-label="Explain APCA Large level"
                aria-describedby="apca-large-help"
              >
                <span aria-hidden="true">i</span>
              </button>
              <span id="apca-large-help" class="help-tooltip" role="tooltip">
                {APCA_LEVEL_DESCRIPTIONS.large}
              </span>
            </span>
          </span>
        </div>
        <div class="check-item">
          <input
            id="indicator-apca-fluent"
            type="checkbox"
            checked={swatchContrastIndicatorsLocal.apcaFluent}
            onchange={(event) => handleIndicatorToggle('apcaFluent', event)}
            aria-label="Show APCA Fluent indicator"
          />
          <span class="check-label-with-help">
            <label class="check-label" for="indicator-apca-fluent">Fluent</label>
            <span class="help-popover">
              <button
                type="button"
                class="info-button"
                aria-label="Explain APCA Fluent level"
                aria-describedby="apca-fluent-help"
              >
                <span aria-hidden="true">i</span>
              </button>
              <span id="apca-fluent-help" class="help-tooltip" role="tooltip">
                {APCA_LEVEL_DESCRIPTIONS.fluent}
              </span>
            </span>
          </span>
        </div>
        <div class="check-item">
          <input
            id="indicator-apca-body"
            type="checkbox"
            checked={swatchContrastIndicatorsLocal.apcaBody}
            onchange={(event) => handleIndicatorToggle('apcaBody', event)}
            aria-label="Show APCA Body indicator"
          />
          <span class="check-label-with-help">
            <label class="check-label" for="indicator-apca-body">Body</label>
            <span class="help-popover">
              <button
                type="button"
                class="info-button"
                aria-label="Explain APCA Body level"
                aria-describedby="apca-body-help"
              >
                <span aria-hidden="true">i</span>
              </button>
              <span id="apca-body-help" class="help-tooltip" role="tooltip">
                {APCA_LEVEL_DESCRIPTIONS.body}
              </span>
            </span>
          </span>
        </div>
      {/if}
    </div>
  </div>

  <div class="field">
    <label class="label" for="contrast-mode">Contrast Mode</label>
    <select class="select" id="contrast-mode" value={contrastModeLocal} onchange={handleModeChange}>
      <option value="auto">Auto</option>
      <option value="manual">Manual</option>
    </select>
  </div>

  {#if contrastModeLocal === 'manual'}
    <div class="manual-controls">
      <div class="field">
        <label class="label" for="contrast-low">Low Contrast Color</label>
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
        <label class="label" for="contrast-high">High Contrast Color</label>
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
        <label class="label" for="low-step">Low Step</label>
        <select class="select" id="low-step" value={lowStepLocal} onchange={handleLowStepChange}>
          {#each generateStepOptions() as step (step)}
            <option value={step}>{step * 10}</option>
          {/each}
        </select>
      </div>

      <div class="field">
        <label class="label" for="high-step">High Step</label>
        <select class="select" id="high-step" value={highStepLocal} onchange={handleHighStepChange}>
          {#each generateStepOptions() as step (step)}
            <option value={step}>{step * 10}</option>
          {/each}
        </select>
      </div>
    </div>
  {/if}

  {#if contrastModeLocal === 'auto'}
    <div class="contrast-preview">
      <h3>Current Contrast Colors</h3>
      <div class="color-samples" role="group" aria-label="Current contrast color preview">
        <div class="color-sample">
          <div
            class="swatch"
            style="background-color: {contrastColorsLocal.low};"
            aria-hidden="true"
          ></div>
          <span class="label">Low: {contrastColorsLocal.low}</span>
        </div>
        <div class="color-sample">
          <div
            class="swatch"
            style="background-color: {contrastColorsLocal.high};"
            aria-hidden="true"
          ></div>
          <span class="label">High: {contrastColorsLocal.high}</span>
        </div>
      </div>
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
    padding: var(--space-sm);
    border: var(--border-width-thin) solid var(--border);
    border-radius: var(--radius-md);
    background: color-mix(in oklab, var(--bg-primary) 88%, transparent);
  }

  .check-item {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    min-height: var(--touch-target-comfortable);
    font-size: var(--font-size-sm);
    color: var(--text-primary);
  }

  .check-label-with-help {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .check-label {
    cursor: pointer;
  }

  .check-item input {
    width: var(--touch-target-min);
    height: var(--touch-target-min);
    margin: 0;
    accent-color: var(--accent);
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
    padding: 0;
  }

  .help-tooltip {
    position: absolute;
    inset-block-start: calc(100% + var(--space-xs));
    inset-inline-start: 0;
    z-index: 20;
    inline-size: min(40ch, calc(100vw - var(--space-xl)));
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

  .color-input-group {
    display: flex;
    gap: var(--space-sm);
    align-items: center;
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

  .contrast-preview {
    padding-top: var(--space-md);
    border-top: 1px solid var(--border);
  }

  .contrast-preview h3 {
    margin: 0 0 var(--space-sm) 0;
    color: var(--text-primary);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
  }

  .color-samples {
    display: flex;
    gap: var(--space-lg);
    justify-content: space-between;
  }

  .color-sample {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .swatch {
    width: var(--touch-target-min);
    height: var(--touch-target-min);
    border-radius: var(--radius-xs);
    border: 1px solid var(--border);
  }

  .manual-controls,
  .auto-controls {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
  }
</style>
