<script lang="ts">
  import { colorStore } from '../stores';

  let palettes: any[] = [];

  colorStore.subscribe(store => {
    palettes = store.palettes || [];
  });
</script>

<div class="color-palettes">
  <h3>Color Palettes</h3>
  <div class="palettes-container">
    {#each palettes as palette, paletteIndex}
      <div class="palette">
        <h4>Palette {paletteIndex}</h4>
        <div class="palette-grid">
          {#each palette as color, colorIndex}
            <div class="color-swatch" style="background-color: {color}">
              {colorIndex}
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .color-palettes {
    margin: 2rem 0;
  }

  .palettes-container {
    display: grid;
    gap: 2rem;
    margin-top: 1rem;
  }

  .palette {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 1rem;
  }

  .palette h4 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  .palette-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
    gap: 0.5rem;
  }

  .color-swatch {
    aspect-ratio: 1;
    border-radius: 4px;
    display: grid;
    place-content: center;
    font-size: 0.75rem;
    color: white;
    text-shadow: 0 0 2px rgba(0,0,0,0.8);
  }
</style>
