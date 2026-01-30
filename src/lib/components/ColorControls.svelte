<script lang="ts">
  interface Props {
    baseColor?: string;
    warmth?: number;
    chromaMultiplier?: number;
    numColors?: number;
    numPalettes?: number;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
  }

  let {
    baseColor = $bindable('#1862E6'),
    warmth = $bindable(0),
    chromaMultiplier = $bindable(1),
    numColors = $bindable(5),
    numPalettes = $bindable(1),
    x1 = $bindable(0),
    y1 = $bindable(0),
    x2 = $bindable(1),
    y2 = $bindable(1)
  }: Props = $props();
</script>

<section class="generator-controls">
  <h2>Color Generation Controls</h2>
  <div class="control-grid">
    <div class="control-group">
      <label for="baseColor">Base Color</label>
      <input id="baseColor" type="color" bind:value={baseColor} />
      <input type="text" bind:value={baseColor} placeholder="#1862E6" />
    </div>

    <div class="control-group">
      <label for="warmth">Warmth ({warmth})</label>
      <input id="warmth" type="range" min="-50" max="50" bind:value={warmth} />
    </div>

    <div class="control-group">
      <label for="chroma">Chroma Multiplier ({chromaMultiplier.toFixed(2)})</label>
      <input id="chroma" type="range" min="0.1" max="2" step="0.01" bind:value={chromaMultiplier} />
    </div>

    <div class="control-group">
      <label for="numColors">Number of Colors ({numColors})</label>
      <input id="numColors" type="range" min="2" max="20" bind:value={numColors} />
    </div>

    <div class="control-group">
      <label for="numPalettes">Number of Palettes ({numPalettes})</label>
      <input id="numPalettes" type="range" min="1" max="11" bind:value={numPalettes} />
    </div>
  </div>

  <h3>Bezier Curve Controls</h3>
  <div class="bezier-controls">
    <div class="control-group">
      <label for="x1">x1 ({x1.toFixed(2)})</label>
      <input id="x1" type="range" min="0" max="1" step="0.01" bind:value={x1} />
    </div>

    <div class="control-group">
      <label for="y1">y1 ({y1.toFixed(2)})</label>
      <input id="y1" type="range" min="0" max="1" step="0.01" bind:value={y1} />
    </div>

    <div class="control-group">
      <label for="x2">x2 ({x2.toFixed(2)})</label>
      <input id="x2" type="range" min="0" max="1" step="0.01" bind:value={x2} />
    </div>

    <div class="control-group">
      <label for="y2">y2 ({y2.toFixed(2)})</label>
      <input id="y2" type="range" min="0" max="1" step="0.01" bind:value={y2} />
    </div>
  </div>
</section>

<style>
  .generator-controls {
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: 6px;
    border: 1px solid var(--border);
  }

  .control-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .control-group label {
    font-weight: 500;
    color: var(--text-primary);
    font-size: 0.9rem;
  }

  .control-group input[type='color'] {
    width: 100%;
    height: 40px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--bg-primary);
    cursor: pointer;
  }

  .control-group input[type='text'] {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-family: monospace;
  }

  .control-group input[type='range'] {
    width: 100%;
    margin-top: 0.25rem;
  }

  .bezier-controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .generator-controls h2 {
    margin: 0 0 1rem 0;
    color: var(--text-primary);
  }

  .generator-controls h3 {
    margin: 1rem 0 0.5rem 0;
    color: var(--text-primary);
  }
</style>
