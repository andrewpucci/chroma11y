<script lang="ts">
  import { onDestroy } from 'svelte';
  import { HELP_TOPICS } from '$lib/help/helpContent';
  import {
    downloadDesignTokens,
    downloadCSS,
    downloadSCSS,
    exportAsCSS,
    exportAsDesignTokens,
    exportAsSCSS
  } from '$lib/exportUtils';
  import { copyToClipboard } from '$lib/colorUtils';
  import { announce } from '$lib/announce';
  import { openExportPreview, type ExportFormat } from '$lib/help/exportPreviewStore';
  import Button from './Button.svelte';
  import HelpTooltip from './HelpTooltip.svelte';
  import Icon from './Icon.svelte';
  import SplitButton, { type SplitButtonMenuItem } from './SplitButton.svelte';

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
  const hasColors = $derived(neutrals.length > 0 || palettes.length > 0);

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

  function copyJSON() {
    const tokens = exportAsDesignTokens(neutrals, palettes, exportNameOptions);
    copyToClipboard(JSON.stringify(tokens, null, 2));
    announce('Copied JSON design tokens to clipboard');
  }

  function copyCSS() {
    copyToClipboard(
      exportAsCSS(neutrals, palettes, exportNameOptions, displayNeutrals, displayPalettes)
    );
    announce('Copied CSS variables to clipboard');
  }

  function copyScss() {
    copyToClipboard(
      exportAsSCSS(neutrals, palettes, exportNameOptions, displayNeutrals, displayPalettes)
    );
    announce('Copied SCSS variables to clipboard');
  }

  function preview(format: ExportFormat, event: MouseEvent | KeyboardEvent | undefined) {
    const opener = event?.currentTarget instanceof HTMLElement ? event.currentTarget : null;
    openExportPreview('all', format, opener);
  }

  function buildMenu(format: ExportFormat, copyAction: () => void): SplitButtonMenuItem[] {
    return [
      {
        id: `${format}-preview`,
        label: 'Preview…',
        onSelect: (event) => preview(format, event)
      },
      {
        id: `${format}-copy`,
        label: 'Copy',
        onSelect: () => copyAction()
      }
    ];
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
  <SplitButton
    primaryAriaLabel="Export JSON design tokens"
    onPrimary={exportJSON}
    menuLabel="More options for JSON design tokens"
    menuItems={buildMenu('json', copyJSON)}
    disabled={!hasColors}
    variant="primary"
  >
    <Icon name="json" />
    <span>Export JSON</span>
  </SplitButton>
  <SplitButton
    primaryAriaLabel="Export CSS custom properties"
    onPrimary={exportCSS}
    menuLabel="More options for CSS custom properties"
    menuItems={buildMenu('css', copyCSS)}
    disabled={!hasColors}
  >
    <Icon name="css" />
    <span>Export CSS</span>
  </SplitButton>
  <SplitButton
    primaryAriaLabel="Export SCSS variables"
    onPrimary={exportSCSS}
    menuLabel="More options for SCSS variables"
    menuItems={buildMenu('scss', copyScss)}
    disabled={!hasColors}
  >
    <Icon name="scss" />
    <span>Export SCSS</span>
  </SplitButton>
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
