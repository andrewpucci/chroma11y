<script lang="ts">
  import {
    contrastMode,
    contrastColors,
    lowStep,
    highStep,
    updateColorState,
    updateContrastStep
  } from '$lib/stores';
  import { getContrast, isValidHexColor } from '$lib/colorUtils';

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
  <h2>Contrast Controls</h2>

  <div class="control-group">
    <label for="contrast-mode">Contrast Mode</label>
    <select id="contrast-mode" value={contrastModeLocal} onchange={handleModeChange}>
      <option value="auto">Auto</option>
      <option value="manual">Manual</option>
    </select>
  </div>

  {#if contrastModeLocal === 'manual'}
    <div class="manual-controls">
      <div class="control-group">
        <label for="contrast-low">Low Contrast Color</label>
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
            value={contrastColorsLocal.low}
            onchange={handleLowColorChange}
            placeholder="#ffffff"
            aria-label="Low contrast color hex value"
          />
        </div>
      </div>

      <div class="control-group">
        <label for="contrast-high">High Contrast Color</label>
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
      <div class="control-group">
        <label for="low-step">Low Step</label>
        <select id="low-step" value={lowStepLocal} onchange={handleLowStepChange}>
          {#each generateStepOptions() as step (step)}
            <option value={step}>{step * 10}</option>
          {/each}
        </select>
      </div>

      <div class="control-group">
        <label for="high-step">High Step</label>
        <select id="high-step" value={highStepLocal} onchange={handleHighStepChange}>
          {#each generateStepOptions() as step (step)}
            <option value={step}>{step * 10}</option>
          {/each}
        </select>
      </div>
    </div>
  {/if}

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
    <div class="contrast-ratio">
      Contrast Ratio: {getContrast(contrastColorsLocal.low, contrastColorsLocal.high).toFixed(2)}:1
    </div>
  </div>
</section>

<style>
  .contrast-controls {
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: 6px;
    border: 1px solid var(--border);
  }

  .contrast-controls h2 {
    margin: 0 0 1rem 0;
    color: var(--text-primary);
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .control-group label {
    font-weight: 500;
    color: var(--text-primary);
    font-size: 0.9rem;
  }

  .control-group select,
  .control-group input[type='color'],
  .control-group input[type='text'] {
    padding: 0.5rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--bg-primary);
    color: var(--text-primary);
  }

  .control-group select:focus-visible,
  .control-group input:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .color-input-group {
    display: flex;
    gap: 0.5rem;
  }

  .color-input-group input[type='color'] {
    width: 60px;
    height: 40px;
    cursor: pointer;
  }

  .color-input-group input[type='text'] {
    flex: 1;
    font-family: monospace;
  }

  .contrast-preview {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }

  .contrast-preview h3 {
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
    font-size: 0.9rem;
  }

  .color-samples {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.5rem;
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

  .label {
    font-size: 0.8rem;
    color: var(--text-secondary);
    font-family: monospace;
  }

  .contrast-ratio {
    font-size: 0.8rem;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .manual-controls,
  .auto-controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
