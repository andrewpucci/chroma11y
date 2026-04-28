<script lang="ts">
  import { tick } from 'svelte';
  import { announce } from '$lib/announce';
  import { copyToClipboard } from '$lib/colorUtils';
  import {
    closeExportPreview,
    exportPreviewDialog,
    type ExportFormat,
    type ExportScope
  } from '$lib/help/exportPreviewStore';
  import {
    downloadFile,
    exportAsCSS,
    exportAsDesignTokens,
    exportAsList,
    exportAsSCSS,
    type ExportNameOptions
  } from '$lib/exportUtils';
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

  const dialogId = 'export-preview-dialog';
  const titleId = 'export-preview-dialog-title';
  const descId = 'export-preview-dialog-desc';
  const focusableSelector = [
    'button:not(:disabled)',
    '[href]',
    'input:not(:disabled)',
    'select:not(:disabled)',
    'textarea:not(:disabled)',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');

  const FORMATS: { id: ExportFormat; label: string; mime: string; extension: string }[] = [
    { id: 'list', label: 'List', mime: 'text/plain', extension: 'txt' },
    { id: 'json', label: 'JSON', mime: 'application/json', extension: 'json' },
    { id: 'css', label: 'CSS', mime: 'text/css', extension: 'css' },
    { id: 'scss', label: 'SCSS', mime: 'text/plain', extension: 'scss' }
  ];

  let dialogEl: HTMLElement | undefined = $state();
  let closeButtonEl: HTMLButtonElement | undefined = $state();
  let activeFormat = $state<ExportFormat>('list');
  let copyConfirmed = $state(false);
  let copyTimeout: ReturnType<typeof setTimeout> | null = null;

  let open = $derived($exportPreviewDialog.open);
  let opener = $derived($exportPreviewDialog.opener);
  let scope = $derived<ExportScope>($exportPreviewDialog.scope);
  let initialFormat = $derived($exportPreviewDialog.initialFormat);

  const scoped = $derived(scopeData(scope));
  const exportNameOptions = $derived<ExportNameOptions>({
    lowContrastColor,
    customNeutralName: scoped.customNeutralName,
    customPaletteNames: scoped.customPaletteNames
  });

  const previewContent = $derived(
    formatPreview(
      activeFormat,
      scoped.neutrals,
      scoped.palettes,
      exportNameOptions,
      scoped.displayNeutrals,
      scoped.displayPalettes
    )
  );

  const scopeLabel = $derived(describeScope(scope));
  const filename = $derived(buildFilename(scope, activeFormat));

  $effect(() => {
    if (open) {
      activeFormat = initialFormat;
      copyConfirmed = false;
      void focusInitialElement();
    }
  });

  async function focusInitialElement(): Promise<void> {
    await tick();
    closeButtonEl?.focus({ preventScroll: true });
  }

  async function closeDialog(): Promise<void> {
    const returnTarget = opener;
    closeExportPreview();
    if (copyTimeout) {
      clearTimeout(copyTimeout);
      copyTimeout = null;
    }
    copyConfirmed = false;
    await tick();
    if (returnTarget?.isConnected) {
      returnTarget.focus({ preventScroll: true });
    }
  }

  function selectFormat(format: ExportFormat): void {
    activeFormat = format;
    copyConfirmed = false;
  }

  function handleCopy(): void {
    if (!previewContent) return;
    copyToClipboard(previewContent);
    announce(`Copied ${formatLabel(activeFormat)} ${scopeLabel} to clipboard`);
    copyConfirmed = true;
    if (copyTimeout) clearTimeout(copyTimeout);
    copyTimeout = setTimeout(() => {
      copyConfirmed = false;
      copyTimeout = null;
    }, 2000);
  }

  function handleDownload(): void {
    if (!previewContent) return;
    const mime = FORMATS.find((f) => f.id === activeFormat)?.mime ?? 'text/plain';
    downloadFile(previewContent, filename, mime);
    announce(`Downloaded ${formatLabel(activeFormat)} ${scopeLabel}`);
  }

  function getFocusableElements(): HTMLElement[] {
    if (!dialogEl) return [];
    return Array.from(dialogEl.querySelectorAll<HTMLElement>(focusableSelector)).filter(
      (element) => !element.hasAttribute('hidden')
    );
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (!open) return;
    if (event.defaultPrevented) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      void closeDialog();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = getFocusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const activeElement = document.activeElement;

    if (!activeElement || !dialogEl?.contains(activeElement)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
      return;
    }

    const activeIndex = focusable.indexOf(activeElement as HTMLElement);
    const nextIndex = event.shiftKey
      ? activeIndex <= 0
        ? focusable.length - 1
        : activeIndex - 1
      : activeIndex === -1 || activeIndex === focusable.length - 1
        ? 0
        : activeIndex + 1;

    event.preventDefault();
    focusable[nextIndex].focus();
  }

  function handleTabKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      const next = (index + 1) % FORMATS.length;
      selectFormat(FORMATS[next].id);
      focusTab(next);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      const prev = (index - 1 + FORMATS.length) % FORMATS.length;
      selectFormat(FORMATS[prev].id);
      focusTab(prev);
    } else if (event.key === 'Home') {
      event.preventDefault();
      selectFormat(FORMATS[0].id);
      focusTab(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      selectFormat(FORMATS[FORMATS.length - 1].id);
      focusTab(FORMATS.length - 1);
    }
  }

  function focusTab(index: number): void {
    if (!dialogEl) return;
    const tabs = dialogEl.querySelectorAll<HTMLElement>('[role="tab"]');
    tabs[index]?.focus({ preventScroll: true });
  }

  function scopeData(s: ExportScope): {
    neutrals: string[];
    palettes: string[][];
    displayNeutrals: string[];
    displayPalettes: string[][];
    customNeutralName?: string;
    customPaletteNames?: string[];
  } {
    if (s === 'all') {
      return {
        neutrals,
        palettes,
        displayNeutrals,
        displayPalettes,
        customNeutralName,
        customPaletteNames
      };
    }
    if (s === 'neutral') {
      return {
        neutrals,
        palettes: [],
        displayNeutrals,
        displayPalettes: [],
        customNeutralName,
        customPaletteNames: undefined
      };
    }
    const i = s.paletteIndex;
    if (i < 0 || i >= palettes.length) {
      return {
        neutrals: [],
        palettes: [],
        displayNeutrals: [],
        displayPalettes: [],
        customNeutralName: undefined,
        customPaletteNames: undefined
      };
    }
    return {
      neutrals: [],
      palettes: [palettes[i]],
      displayNeutrals: [],
      displayPalettes: displayPalettes[i] ? [displayPalettes[i]] : [],
      customNeutralName: undefined,
      customPaletteNames: customPaletteNames?.[i] ? [customPaletteNames[i]] : undefined
    };
  }

  function formatPreview(
    format: ExportFormat,
    n: string[],
    p: string[][],
    options: ExportNameOptions,
    dn: string[],
    dp: string[][]
  ): string {
    if (n.length === 0 && p.length === 0) return '';
    if (format === 'list') return exportAsList(n, p, options, dn, dp);
    if (format === 'css') return exportAsCSS(n, p, options, dn, dp);
    if (format === 'scss') return exportAsSCSS(n, p, options, dn, dp);
    return JSON.stringify(exportAsDesignTokens(n, p, options), null, 2);
  }

  function describeScope(s: ExportScope): string {
    if (s === 'all') return 'export';
    if (s === 'neutral') return 'neutral palette';
    return 'palette';
  }

  function buildFilename(s: ExportScope, format: ExportFormat): string {
    const ext = FORMATS.find((f) => f.id === format)?.extension ?? 'txt';
    if (s === 'all') {
      if (format === 'json') return 'color-tokens.json';
      return `colors.${ext}`;
    }
    if (s === 'neutral') return `neutral-palette.${ext}`;
    return `palette-${s.paletteIndex + 1}.${ext}`;
  }

  function formatLabel(format: ExportFormat): string {
    return FORMATS.find((f) => f.id === format)?.label ?? format;
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div class="dialog-layer">
    <div class="dialog-backdrop" aria-hidden="true" onclick={() => void closeDialog()}></div>
    <div
      id={dialogId}
      class="export-preview-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      tabindex="-1"
      bind:this={dialogEl}
    >
      <div class="dialog-header">
        <div class="dialog-heading">
          <p class="eyebrow">Export preview</p>
          <h2 id={titleId}>Preview &amp; copy</h2>
          <p id={descId} class="intro">
            Inspect the generated output, copy it to your clipboard, or download it as a file.
          </p>
        </div>
        <button
          bind:this={closeButtonEl}
          type="button"
          class="dialog-close"
          aria-label="Close export preview"
          onclick={() => void closeDialog()}
        >
          <Icon name="close" size="var(--icon-size-dialog-close, 20)" />
          <span>Close</span>
        </button>
      </div>

      <div class="tab-strip" role="tablist" aria-label="Export format">
        {#each FORMATS as format, index (format.id)}
          <button
            type="button"
            role="tab"
            id={`export-preview-tab-${format.id}`}
            aria-selected={activeFormat === format.id}
            aria-controls="export-preview-panel"
            tabindex={activeFormat === format.id ? 0 : -1}
            class="tab"
            class:active={activeFormat === format.id}
            onclick={() => selectFormat(format.id)}
            onkeydown={(event) => handleTabKeydown(event, index)}
          >
            {format.label}
          </button>
        {/each}
      </div>

      <div
        id="export-preview-panel"
        role="tabpanel"
        aria-labelledby={`export-preview-tab-${activeFormat}`}
        class="dialog-body"
      >
        {#if previewContent}
          <pre class="preview" data-testid="export-preview-content">{previewContent}</pre>
        {:else}
          <p class="empty">No colors to export yet.</p>
        {/if}
      </div>

      <div class="dialog-actions">
        <button
          type="button"
          class="btn btn-secondary"
          disabled={!previewContent}
          aria-label={copyConfirmed
            ? `${formatLabel(activeFormat)} copied to clipboard`
            : `Copy ${formatLabel(activeFormat)} to clipboard`}
          onclick={handleCopy}
        >
          <Icon name={copyConfirmed ? 'status-pass' : 'copy'} />
          <span>{copyConfirmed ? 'Copied' : 'Copy'}</span>
        </button>
        <button
          type="button"
          class="btn btn-primary"
          disabled={!previewContent}
          aria-label={`Download ${formatLabel(activeFormat)} as ${filename}`}
          onclick={handleDownload}
        >
          Download
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .dialog-layer {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: grid;
    place-items: center;
    padding: var(--space-lg);
  }

  .dialog-backdrop {
    position: absolute;
    inset: 0;
    background: color-mix(in oklab, black 42%, transparent);
  }

  .export-preview-dialog {
    position: relative;
    z-index: 1;
    inline-size: min(48rem, 100%);
    max-block-size: min(44rem, calc(100vh - var(--space-xl)));
    display: grid;
    grid-template-rows: auto auto 1fr auto;
    overflow: hidden;
    border: var(--border-width-thin) solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--bg-primary);
    color: var(--text-primary);
    box-shadow: 0 var(--space-lg) var(--space-xl) color-mix(in oklab, black 24%, transparent);
  }

  .dialog-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-md);
    padding: var(--space-lg);
    border-bottom: var(--border-width-thin) solid
      color-mix(in oklab, var(--border) 60%, transparent);
  }

  .dialog-heading {
    display: grid;
    gap: var(--space-xs);
  }

  .eyebrow,
  .dialog-heading h2,
  .intro {
    margin: 0;
  }

  .eyebrow {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }

  .dialog-heading h2 {
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
  }

  .intro {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }

  .dialog-close {
    min-height: var(--touch-target-comfortable);
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    border: var(--border-width-thin) solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-tertiary);
    color: var(--text-primary);
    font: inherit;
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
  }

  .tab-strip {
    display: flex;
    gap: var(--space-2xs, 4px);
    padding: var(--space-sm) var(--space-lg) 0;
    border-bottom: var(--border-width-thin) solid
      color-mix(in oklab, var(--border) 60%, transparent);
  }

  .tab {
    appearance: none;
    background: transparent;
    border: 0;
    color: var(--text-secondary);
    padding: var(--space-sm) var(--space-md);
    font: inherit;
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    border-bottom: 2px solid transparent;
  }

  .tab.active {
    color: var(--text-primary);
    border-bottom-color: var(--accent);
  }

  .tab:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .dialog-body {
    overflow: auto;
    padding: var(--space-lg);
  }

  .preview {
    margin: 0;
    padding: var(--space-md);
    background: var(--bg-secondary);
    border: var(--border-width-thin) solid color-mix(in oklab, var(--border) 60%, transparent);
    border-radius: var(--radius-md);
    font-family: var(--text-mono);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-normal);
    color: var(--text-primary);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .empty {
    color: var(--text-secondary);
    font-style: italic;
    text-align: center;
    padding: var(--space-xl) var(--space-md);
    margin: 0;
  }

  .dialog-actions {
    display: flex;
    gap: var(--space-sm);
    justify-content: flex-end;
    padding: var(--space-md) var(--space-lg);
    border-top: var(--border-width-thin) solid color-mix(in oklab, var(--border) 60%, transparent);
    background: var(--bg-secondary);
  }

  .btn {
    appearance: none;
    border-radius: var(--radius-md);
    padding: var(--space-sm) var(--space-md);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    min-height: var(--touch-target-comfortable);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
  }

  .btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .btn-primary {
    background: color-mix(in oklab, var(--accent) 90%, black);
    color: white;
    border: 1px solid color-mix(in oklab, var(--accent) 70%, black);
  }

  .btn-primary:hover:not(:disabled) {
    background: color-mix(in oklab, var(--accent-hover) 90%, black);
  }

  .btn-secondary {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border: 1px solid var(--border);
  }

  .btn-secondary:hover:not(:disabled) {
    border-color: color-mix(in oklab, var(--border) 40%, var(--accent));
  }

  @media (max-width: 640px) {
    .dialog-layer {
      align-items: end;
      padding: var(--space-sm);
    }

    .export-preview-dialog {
      max-block-size: calc(100vh - var(--space-lg));
    }

    .dialog-header {
      flex-direction: column;
    }

    .dialog-close {
      width: 100%;
      justify-content: center;
    }

    .dialog-actions {
      flex-direction: column-reverse;
    }
  }
</style>
