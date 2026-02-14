<script lang="ts">
  import { downloadDesignTokens, downloadCSS, downloadSCSS } from '$lib/exportUtils';
  import { announce } from '$lib/announce';

  interface Props {
    neutrals?: string[];
    palettes?: string[][];
  }

  let { neutrals = [], palettes = [] }: Props = $props();

  function exportJSON() {
    downloadDesignTokens(neutrals, palettes);
    announce('Downloaded JSON design tokens');
  }

  function exportCSS() {
    downloadCSS(neutrals, palettes);
    announce('Downloaded CSS variables');
  }

  function exportSCSS() {
    downloadSCSS(neutrals, palettes);
    announce('Downloaded SCSS variables');
  }
</script>

<div class="export-buttons">
  <button
    class="btn"
    onclick={exportJSON}
    disabled={neutrals.length === 0 && palettes.length === 0}
    aria-label="Export JSON design tokens"
  >
    <span aria-hidden="true">📄</span> Export JSON
  </button>
  <button
    class="btn"
    onclick={exportCSS}
    disabled={neutrals.length === 0 && palettes.length === 0}
    aria-label="Export CSS custom properties"
  >
    <span aria-hidden="true">🎨</span> Export CSS
  </button>
  <button
    class="btn"
    onclick={exportSCSS}
    disabled={neutrals.length === 0 && palettes.length === 0}
    aria-label="Export SCSS variables"
  >
    <span aria-hidden="true">📝</span> Export SCSS
  </button>
</div>

<style>
  .export-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>
