<script lang="ts" module>
  let paletteNameEditorDescriptionId = 0;

  function getNextDescriptionId(): string {
    paletteNameEditorDescriptionId += 1;
    return `palette-name-editor-description-${paletteNameEditorDescriptionId}`;
  }
</script>

<script lang="ts">
  import { tick } from 'svelte';

  import { normalizeCustomPaletteName } from '$lib/paletteNameUtils';
  import Icon from './Icon.svelte';

  interface Props {
    value?: string;
    fallbackValue: string;
    editButtonAriaLabel: string;
    inputAriaLabel: string;
    onCommit?: (value: string | undefined) => void;
    'data-testid'?: string;
  }

  let {
    value,
    fallbackValue,
    editButtonAriaLabel,
    inputAriaLabel,
    onCommit,
    'data-testid': dataTestId
  }: Props = $props();

  let isEditing = $state(false);
  let draftValue = $state('');
  let buttonEl: HTMLButtonElement | null = $state(null);
  let inputEl: HTMLInputElement | null = $state(null);
  let editorWidthPx: number | undefined = $state(undefined);
  let isFinishingEdit = false;
  const descriptionId = getNextDescriptionId();

  const normalizedValue = $derived(normalizeCustomPaletteName(value));
  const displayedValue = $derived(normalizedValue ?? fallbackValue);
  const normalizedFallbackValue = $derived(normalizeCustomPaletteName(fallbackValue));
  const editorWidth = $derived(editorWidthPx ? `${editorWidthPx}px` : undefined);

  async function startEditing(): Promise<void> {
    draftValue = normalizedValue ?? fallbackValue;
    editorWidthPx = buttonEl ? Math.ceil(buttonEl.getBoundingClientRect().width) : undefined;
    isEditing = true;
    await tick();
    inputEl?.focus();
    inputEl?.select();
  }

  async function finishEditing(commit: boolean, restoreFocus: boolean = false): Promise<void> {
    if (!isEditing || isFinishingEdit) {
      return;
    }

    isFinishingEdit = true;
    const nextValue = normalizeCustomPaletteName(draftValue);
    const resolvedValue = nextValue === normalizedFallbackValue ? undefined : nextValue;

    isEditing = false;
    if (commit) {
      onCommit?.(resolvedValue);
    }

    await tick();
    if (restoreFocus) {
      buttonEl?.focus();
    }

    isFinishingEdit = false;
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      void finishEditing(true, true);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      draftValue = normalizedValue ?? fallbackValue;
      void finishEditing(false, true);
    }
  }
</script>

<div class="palette-name-editor" data-testid={dataTestId}>
  {#if isEditing}
    <input
      bind:this={inputEl}
      class="name-input"
      type="text"
      bind:value={draftValue}
      style:width={editorWidth}
      aria-label={inputAriaLabel}
      onblur={() => void finishEditing(true)}
      onkeydown={handleKeydown}
    />
  {:else}
    <button
      bind:this={buttonEl}
      class="name-button"
      type="button"
      aria-label={editButtonAriaLabel}
      aria-describedby={descriptionId}
      onclick={() => void startEditing()}
    >
      <span class="name-button-text">{displayedValue}</span>
      <span class="edit-hint" aria-hidden="true">
        <Icon name="edit" size={14} stroke={2} />
      </span>
      <span id={descriptionId} class="visually-hidden">Current name {displayedValue}</span>
    </button>
  {/if}
</div>

<style>
  .palette-name-editor {
    display: inline-grid;
    margin-left: calc(var(--space-sm) * -1);
    min-width: 0;
    max-width: 100%;
    justify-items: start;
  }

  .name-button {
    appearance: none;
    align-items: center;
    background: transparent;
    border: var(--border-width-thin) solid transparent;
    border-radius: var(--radius-sm);
    box-sizing: border-box;
    color: inherit;
    cursor: pointer;
    display: inline-flex;
    flex-wrap: wrap;
    font: inherit;
    font-weight: inherit;
    gap: var(--space-xs);
    letter-spacing: inherit;
    max-width: 100%;
    min-height: var(--touch-target-comfortable);
    padding: var(--space-xs) var(--space-sm);
    text-align: left;
  }

  .name-button-text {
    display: inline;
    overflow-wrap: anywhere;
    text-decoration-line: underline;
    text-decoration-style: dashed;
    text-decoration-color: transparent;
    text-underline-offset: 0.16em;
    transition: text-decoration-color var(--transition-fast);
  }

  .name-button:hover .name-button-text,
  .name-button:focus-visible .name-button-text {
    text-decoration-color: color-mix(in oklab, var(--accent) 70%, var(--border));
  }

  .edit-hint {
    align-items: center;
    color: var(--text-secondary);
    display: inline-flex;
    flex: 0 0 auto;
    line-height: 1;
    opacity: 0.6;
    transform: translateY(calc(var(--border-width-thin) * -1));
    transition:
      color var(--transition-fast),
      opacity var(--transition-fast),
      transform var(--transition-fast);
  }

  .name-button:hover .edit-hint,
  .name-button:focus-visible .edit-hint {
    color: color-mix(in oklab, var(--text-primary) 72%, var(--accent));
    opacity: 1;
  }

  .name-input {
    appearance: none;
    background: var(--bg-primary);
    border: var(--border-width-thin) solid var(--border);
    border-radius: var(--radius-sm);
    box-sizing: border-box;
    color: var(--text-primary);
    display: block;
    font: inherit;
    font-weight: inherit;
    letter-spacing: inherit;
    line-height: inherit;
    margin: 0;
    max-width: min(100%, 22rem);
    min-height: var(--touch-target-comfortable);
    padding: var(--space-xs) var(--space-sm);
    text-align: left;
    width: auto;
  }
</style>
