<script lang="ts">
  import {
    contrastMode,
    contrastColors,
    lowStep,
    highStep,
    updateColorState,
    updateContrastStep
  } from '$lib/stores';
  import { isValidHexColor } from '$lib/colorUtils';

  // Derived values from stores
  let contrastModeLocal = $derived($contrastMode);
  let contrastColorsLocal = $derived($contrastColors);
  let lowStepLocal = $derived($lowStep);
  let highStepLocal = $derived($highStep);

  function handleModeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newMode = target.value as 'auto' | 'manual';
    updateColorState({
      contrastMode: newMode
    });
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
    gap: 0.9rem;
  }

  .color-input-group {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .color-input-group input[type='color'] {
    width: 60px;
    height: 40px;
    cursor: pointer;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: transparent;
  }

  .contrast-preview {
    padding-top: 0.9rem;
    border-top: 1px solid var(--border);
  }

  .contrast-preview h3 {
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
    font-size: 0.95rem;
    font-weight: 650;
  }

  .color-samples {
    display: flex;
    gap: 1rem;
    justify-content: space-between;
  }

  .color-sample {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .swatch {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    border: 1px solid var(--border);
  }

  .manual-controls,
  .auto-controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
