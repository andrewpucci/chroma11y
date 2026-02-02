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
    class="export-button"
    onclick={exportJSON}
    disabled={neutrals.length === 0 && palettes.length === 0}
    aria-label="Export colors as JSON design tokens"
  >
    <span aria-hidden="true">📄</span> Export JSON
  </button>
  <button
    class="export-button"
    onclick={exportCSS}
    disabled={neutrals.length === 0 && palettes.length === 0}
    aria-label="Export colors as CSS custom properties"
  >
    <span aria-hidden="true">🎨</span> Export CSS
  </button>
  <button
    class="export-button"
    onclick={exportSCSS}
    disabled={neutrals.length === 0 && palettes.length === 0}
    aria-label="Export colors as SCSS variables"
  >
    <span aria-hidden="true">📝</span> Export SCSS
  </button>
</div>

<style>
  .export-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .export-button {
    padding: 0.75rem 1rem;
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border: 1px solid var(--border);
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
    min-height: 44px;
  }

  /* Touch-friendly on mobile */
  @media (max-width: 768px) {
    .export-button {
      padding: 1rem;
      min-height: 48px;
      touch-action: manipulation;
    }
  }

  .export-button:hover:not(:disabled) {
    background: var(--accent);
    color: white;
    transform: translateY(-1px);
  }

  .export-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .export-button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
</style>
