<script lang="ts">
  import { colorStore } from '../stores';

  let neutrals: any[] = [];

  colorStore.subscribe(store => {
    neutrals = store.neutrals || [];
  });
</script>

<div class="neutral-colors">
  <h3>Neutral Colors</h3>
  <div class="neutral-grid">
    {#each neutrals as color, index}
      <div class="neutral-swatch" style="background-color: {color}">
        {index}
      </div>
    {/each}
  </div>
</div>

<style>
  .neutral-colors {
    margin: 2rem 0;
  }

  .neutral-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .neutral-swatch {
    aspect-ratio: 1;
    border-radius: 4px;
    display: grid;
    place-content: center;
    font-size: 0.75rem;
    color: white;
    text-shadow: 0 0 2px rgba(0,0,0,0.8);
  }
</style>
