<script lang="ts">
  import { downloadDesignTokens, downloadCSS, downloadSCSS } from '$lib/exportUtils';
  import { announce } from '$lib/announce';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';

  interface Props {
    neutrals?: string[];
    palettes?: string[][];
    displayNeutrals?: string[];
    displayPalettes?: string[][];
  }

  let {
    neutrals = [],
    palettes = [],
    displayNeutrals = [],
    displayPalettes = []
  }: Props = $props();

  function exportJSON() {
    downloadDesignTokens(neutrals, palettes);
    announce('Downloaded JSON design tokens');
  }

  function exportCSS() {
    downloadCSS(neutrals, palettes, displayNeutrals, displayPalettes);
    announce('Downloaded CSS variables');
  }

  function exportSCSS() {
    downloadSCSS(neutrals, palettes, displayNeutrals, displayPalettes);
    announce('Downloaded SCSS variables');
  }
</script>

<div class="export-buttons">
  <Button
    onclick={exportJSON}
    disabled={neutrals.length === 0 && palettes.length === 0}
    ariaLabel="Export JSON design tokens"
  >
    <Icon name="json" />
    Export JSON
  </Button>
  <Button
    onclick={exportCSS}
    disabled={neutrals.length === 0 && palettes.length === 0}
    ariaLabel="Export CSS custom properties"
  >
    <Icon name="css" />
    Export CSS
  </Button>
  <Button
    onclick={exportSCSS}
    disabled={neutrals.length === 0 && palettes.length === 0}
    ariaLabel="Export SCSS variables"
  >
    <Icon name="scss" />
    Export SCSS
  </Button>
</div>

<style>
  .export-buttons {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }
</style>
