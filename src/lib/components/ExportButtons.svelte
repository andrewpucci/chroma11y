<script lang="ts">
  import { onDestroy } from 'svelte';
  import { HELP_TOPICS } from '$lib/help/helpContent';
  import { downloadDesignTokens, downloadCSS, downloadSCSS } from '$lib/exportUtils';
  import { copyToClipboard } from '$lib/colorUtils';
  import { announce } from '$lib/announce';
  import Button from './Button.svelte';
  import HelpTooltip from './HelpTooltip.svelte';
  import Icon from './Icon.svelte';

  interface Props {
    neutrals?: string[];
    palettes?: string[][];
    lowContrastColor?: string;
    displayNeutrals?: string[];
    displayPalettes?: string[][];
    customNeutralName?: string;
    customPaletteNames?: string[];
  }

  let {
    neutrals = [],
    palettes = [],
    lowContrastColor = '#ffffff',
    displayNeutrals = [],
    displayPalettes = [],
    customNeutralName,
    customPaletteNames
  }: Props = $props();

  const exportNameOptions = $derived({
    lowContrastColor,
    customNeutralName,
    customPaletteNames
  });
  let copyConfirmed = $state(false);
  let copyFeedbackTimeout: ReturnType<typeof setTimeout> | null = null;

  onDestroy(() => {
    if (copyFeedbackTimeout) {
      clearTimeout(copyFeedbackTimeout);
      copyFeedbackTimeout = null;
    }
  });

  function exportJSON() {
    downloadDesignTokens(neutrals, palettes, exportNameOptions);
    announce('Downloaded JSON design tokens');
  }

  function exportCSS() {
    downloadCSS(neutrals, palettes, exportNameOptions, displayNeutrals, displayPalettes);
    announce('Downloaded CSS variables');
  }

  function exportSCSS() {
    downloadSCSS(neutrals, palettes, exportNameOptions, displayNeutrals, displayPalettes);
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
    copyConfirmed = true;

    if (copyFeedbackTimeout) {
      clearTimeout(copyFeedbackTimeout);
    }

    copyFeedbackTimeout = setTimeout(() => {
      copyConfirmed = false;
      copyFeedbackTimeout = null;
    }, 2000);
  }
</script>

<div class="export-buttons">
  <div class="label-row">
    <span class="label">Export Format</span>
    <HelpTooltip
      id="export-format-help"
      label="Explain Export Format"
      text={HELP_TOPICS.exportFormat.tooltip}
    />
  </div>
  <Button
    onclick={shareURL}
    ariaLabel={copyConfirmed ? 'URL copied to clipboard' : 'Copy shareable URL to clipboard'}
  >
    <Icon name="share" />
    <span class:label-enter={copyConfirmed}>{copyConfirmed ? 'Copied URL' : 'Share URL'}</span>
  </Button>
  <Button
    onclick={exportJSON}
    disabled={neutrals.length === 0 && palettes.length === 0}
    variant="primary"
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

  .label-row {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }

  .label-enter {
    animation: label-pop var(--duration-fast) var(--ease-emphasized);
  }

  @keyframes label-pop {
    from {
      opacity: 0;
      transform: translateY(0.1em) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
</style>
