<script lang="ts">
  import { onDestroy } from 'svelte';
  import { downloadDesignTokens, downloadCSS, downloadSCSS } from '$lib/exportUtils';
  import { copyToClipboard } from '$lib/colorUtils';
  import { resetColorState, currentTheme } from '$lib/stores';
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

  const theme = $derived($currentTheme);
  let shareFeedbackVisible = $state(false);
  let shareFeedbackTimeout: ReturnType<typeof setTimeout> | null = null;

  onDestroy(() => {
    if (shareFeedbackTimeout) {
      clearTimeout(shareFeedbackTimeout);
      shareFeedbackTimeout = null;
    }
  });

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

  /**
   * Copies the current URL (with all state parameters) to the clipboard.
   * This allows users to share their palette configuration with others.
   */
  function shareURL() {
    const url = window.location.href;
    copyToClipboard(url);
    announce('Copied shareable URL to clipboard');
    shareFeedbackVisible = true;

    if (shareFeedbackTimeout) {
      clearTimeout(shareFeedbackTimeout);
    }

    shareFeedbackTimeout = setTimeout(() => {
      shareFeedbackVisible = false;
      shareFeedbackTimeout = null;
    }, 2000);
  }

  /**
   * Resets all color settings to default values for the current theme.
   * Preserves the current theme preference.
   */
  function handleReset() {
    const confirmed = window.confirm(
      'Reset all settings to defaults? This will clear your current palette configuration.'
    );
    if (confirmed) {
      resetColorState(theme as 'light' | 'dark');
      announce('Settings reset to defaults');
    }
  }
</script>

<div class="export-buttons">
  <Button onclick={shareURL} ariaLabel="Copy shareable URL to clipboard">
    <Icon name="share" />
    Share URL
  </Button>
  {#if shareFeedbackVisible}
    <p class="share-feedback" role="status" aria-live="polite">Copied URL</p>
  {/if}
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
  <Button onclick={handleReset} ariaLabel="Reset all settings to defaults">
    <Icon name="reset" />
    Reset
  </Button>
</div>

<style>
  .export-buttons {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .share-feedback {
    margin: 0;
    color: var(--text-color);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
  }
</style>
