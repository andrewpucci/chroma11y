<script lang="ts">
  import type { HistoryMenuEntry } from '$lib/history';
  import Icon from './Icon.svelte';
  import HistoryMenu from './HistoryMenu.svelte';

  interface Props {
    action: 'undo' | 'redo';
    disabled?: boolean;
    entries?: HistoryMenuEntry[];
    onAction: () => void;
    onSelect: (position: number) => void;
  }

  let { action, disabled = false, entries = [], onAction, onSelect }: Props = $props();

  const actionLabel = $derived(action === 'undo' ? 'Undo last change' : 'Redo last change');
  const iconName = $derived(action === 'undo' ? 'undo' : 'redo');
</script>

<div class="history-action-group">
  <button
    type="button"
    class="history-action-button"
    aria-label={actionLabel}
    {disabled}
    onclick={onAction}
  >
    <Icon name={iconName} />
    <span>{action === 'undo' ? 'Undo' : 'Redo'}</span>
  </button>

  <HistoryMenu {action} {entries} disabled={disabled || entries.length === 0} {onSelect} />
</div>

<style>
  .history-action-group {
    display: inline-flex;
    align-items: stretch;
    gap: var(--space-xs);
  }

  .history-action-button {
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
    border: 1px solid var(--border);
    background: var(--bg-tertiary);
    color: var(--text-primary);
    transition:
      background-color var(--transition-fast),
      border-color var(--transition-fast),
      color var(--transition-fast);
  }

  .history-action-button:hover:not(:disabled) {
    border-color: color-mix(in oklab, var(--border) 40%, var(--accent));
  }

  .history-action-button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  @media (max-width: 640px) {
    .history-action-button {
      padding-inline: var(--space-sm);
    }
  }
</style>
