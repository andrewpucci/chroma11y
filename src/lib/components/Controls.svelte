<script lang="ts">
  import { colorStore, toggleTheme, currentTheme } from '../stores';
  import { downloadDesignTokens } from '../exportUtils';

  let numColors: number;
  let numPalettes: number;
  let baseColor: string;
  let warmth: number;
  let x1: number;
  let y1: number;
  let x2: number;
  let y2: number;
  let chromaMultiplier: number;
  let contrastMode: string;
  let lowStep: number;
  let highStep: number;
  let lowValue: string;
  let highValue: string;
  let currentThemeValue: string;

  // Subscribe to store changes
  colorStore.subscribe(store => {
    numColors = store.numColors;
    numPalettes = store.numPalettes;
    baseColor = store.baseColor;
    warmth = store.warmth;
    x1 = store.x1;
    y1 = store.y1;
    x2 = store.x2;
    y2 = store.y2;
    chromaMultiplier = store.chromaMultiplier;
    contrastMode = store.contrastMode;
    lowStep = store.lowStep;
    highStep = store.highStep;
    lowValue = store.contrast.low;
    highValue = store.contrast.high;
  });

  currentTheme.subscribe(theme => {
    currentThemeValue = theme;
  });

  function updateStore(key: string, value: unknown) {
    colorStore.update(store => ({
      ...store,
      [key]: value
    }));
  }

  function updateContrast(key: string, value: unknown) {
    colorStore.update(store => ({
      ...store,
      contrast: {
        ...store.contrast,
        [key]: value
      }
    }));
  }

  function handleDownload() {
    // This function would need access to neutrals and palettes from parent
    // For now, let's just log a message
    console.log('Download functionality needs to be connected to main page state');
  }
</script>

<div class="row">
  <div class="control-group">
    <label for="color-count">Number of steps</label>
    <input id="color-count" type="number" bind:value={numColors} on:change={() => updateStore('numColors', numColors)} />
  </div>
  
  <div class="control-group">
    <label for="palette-count">Number of palettes</label>
    <input id="palette-count" type="number" bind:value={numPalettes} on:change={() => updateStore('numPalettes', numPalettes)} />
  </div>
  
  <button type="button" class="theme-toggle" on:click={toggleTheme} title="Toggle between light and dark mode generation">
    <span class="theme-icon">{currentThemeValue === 'light' ? '🌙' : '☀️'}</span>
    Toggle Theme
  </button>
  
  <button type="button" class="button" on:click={handleDownload}>
    Download as JSON
  </button>
</div>

<div class="row">
  <div class="control-group">
    <label for="color-value">Base Color</label>
    <input id="color-value" type="color" bind:value={baseColor} on:change={() => updateStore('baseColor', baseColor)} />
  </div>
  
  <div class="control-group">
    <label for="warmth-value">Gray Warmth</label>
    <input id="warmth-value" type="number" step=1 min=-100 max=100 bind:value={warmth} on:change={() => updateStore('warmth', warmth)} />
  </div>
  
  <div class="control-group">
    <label for="contrast-mode">Contrast Mode</label>
    <select id="contrast-mode" bind:value={contrastMode} on:change={() => updateStore('contrastMode', contrastMode)}>
      <option value="auto">Auto</option>
      <option value="manual">Manual</option>
    </select>
  </div>
  
  <div class="control-group manual-mode" class:hidden={contrastMode !== 'manual'}>
    <label for="low-value">Contrast: Low</label>
    <input id="low-value" type="color" bind:value={lowValue} on:change={() => updateContrast('low', lowValue)} />
  </div>
  
  <div class="control-group manual-mode" class:hidden={contrastMode !== 'manual'}>
    <label for="high-value">Contrast: High</label>
    <input id="high-value" type="color" bind:value={highValue} on:change={() => updateContrast('high', highValue)} />
  </div>
  
  <div class="control-group auto-mode" class:hidden={contrastMode !== 'auto'}>
    <label for="low-step">Low Step</label>
    <select id="low-step" bind:value={lowStep} on:change={() => updateStore('lowStep', lowStep)}>
      {#each Array(11) as _, i}
        <option value={i}>{i}</option>
      {/each}
    </select>
  </div>
  
  <div class="control-group auto-mode" class:hidden={contrastMode !== 'auto'}>
    <label for="high-step">High Step</label>
    <select id="high-step" bind:value={highStep} on:change={() => updateStore('highStep', highStep)}>
      {#each Array(11) as _, i}
        <option value={i}>{i}</option>
      {/each}
    </select>
  </div>
</div>

<div class="row">
  <div class="control-group">
    <label for="x1-value">x1</label>
    <input id="x1-value" type="number" step=0.01 min="0" max="1" bind:value={x1} on:change={() => updateStore('x1', x1)} />
  </div>
  
  <div class="control-group">
    <label for="y1-value">y1</label>
    <input id="y1-value" type="number" step=0.01 min="0" max="1" bind:value={y1} on:change={() => updateStore('y1', y1)} />
  </div>
  
  <div class="control-group">
    <label for="x2-value">x2</label>
    <input id="x2-value" type="number" step=0.01 min="0" max="1" bind:value={x2} on:change={() => updateStore('x2', x2)} />
  </div>
  
  <div class="control-group">
    <label for="y2-value">y2</label>
    <input id="y2-value" type="number" step=0.01 min="0" max="1" bind:value={y2} on:change={() => updateStore('y2', y2)} />
  </div>
  
  <div class="control-group">
    <label for="chroma-mult-value">Chroma Multiplier</label>
    <input id="chroma-mult-value" type="number" step=0.01 min=0.01 bind:value={chromaMultiplier} on:change={() => updateStore('chromaMultiplier', chromaMultiplier)} />
  </div>
</div>

<style>
  .row {
    display: grid;
    gap: 0.5em;
    grid-auto-columns: minmax(0, 1fr);
    grid-auto-flow: column;
    margin-bottom: 1rem;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.25em;
    padding: 0.5em;
  }

  .control-group label {
    font-size: 0.875em;
    font-weight: 500;
  }

  .control-group input,
  .control-group select {
    padding: 0.5em;
    border: 1px solid var(--border-color, #ccc);
    border-radius: 4px;
    background-color: var(--bg-color, #fff);
    color: var(--text-color, #000);
  }

  .theme-icon {
    font-size: 1.2em;
  }

  .theme-toggle, .button {
    padding: 0.5em 1em;
    border: 1px solid var(--border-color, #ccc);
    border-radius: 4px;
    background-color: var(--bg-color, #fff);
    color: var(--text-color, #000);
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .theme-toggle:hover, .button:hover {
    background-color: var(--border-color, #ccc);
  }

  .manual-mode {
    display: block;
  }

  .auto-mode {
    display: block;
  }

  :global([hidden]) {
    display: none;
  }
</style>
