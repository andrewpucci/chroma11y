<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    onclick?: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary';
    type?: 'button' | 'submit' | 'reset';
    ariaLabel?: string;
    children: Snippet;
  }

  let {
    onclick,
    disabled = false,
    variant = 'secondary',
    type = 'button',
    ariaLabel,
    children
  }: Props = $props();

  const variantClass = $derived(`btn-${variant}`);
</script>

<button class="btn {variantClass}" {onclick} {disabled} {type} aria-label={ariaLabel || undefined}>
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
</style>
