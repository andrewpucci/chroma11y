<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    onclick?: (event: MouseEvent) => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'ghost';
    compact?: boolean;
    type?: 'button' | 'submit' | 'reset';
    class?: string;
    id?: string;
    ariaLabel?: string;
    ariaControls?: string;
    ariaExpanded?: boolean;
    children: Snippet;
  }

  let {
    onclick,
    disabled = false,
    variant = 'secondary',
    compact = false,
    type = 'button',
    class: className = '',
    id,
    ariaLabel,
    ariaControls,
    ariaExpanded,
    children
  }: Props = $props();

  const variantClass = $derived(`btn-${variant}`);
  const compactClass = $derived(compact ? 'btn-compact' : '');
</script>

<button
  class="btn {variantClass} {compactClass} {className}"
  {id}
  {onclick}
  {disabled}
  {type}
  aria-label={ariaLabel || undefined}
  aria-controls={ariaControls || undefined}
  aria-expanded={ariaExpanded}
>
  {@render children()}
</button>

<style>
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
    transition:
      transform var(--transition-fast),
      background-color var(--transition-fast),
      border-color var(--transition-fast),
      color var(--transition-fast);
  }

  .btn:active:not(:disabled) {
    transform: translateY(0);
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
    border-color: color-mix(in oklab, var(--accent-hover) 70%, black);
  }

  .btn-secondary {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border: 1px solid var(--border);
  }

  .btn-secondary:hover:not(:disabled) {
    border-color: color-mix(in oklab, var(--border) 40%, var(--accent));
  }

  .btn-ghost {
    background: transparent;
    color: var(--text-secondary);
    border: 1px dashed color-mix(in oklab, var(--border) 72%, transparent);
  }

  .btn-ghost:hover:not(:disabled) {
    color: var(--text-primary);
    border-color: color-mix(in oklab, var(--border) 45%, var(--accent));
  }

  .btn-compact {
    min-width: var(--constraint-summary-action-min);
    padding-inline: var(--space-sm);
  }
</style>
