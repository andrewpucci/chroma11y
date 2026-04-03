<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'pass' | 'warning' | 'fail' | 'muted' | 'accent' | 'disabled';
    uppercase?: boolean;
    class?: string;
    children: Snippet;
  }

  let { variant = 'muted', uppercase = false, class: className = '', children }: Props = $props();
</script>

<span class="badge badge--{variant} {uppercase ? 'badge--uppercase' : ''} {className}">
  {@render children()}
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    min-height: 0;
    padding: var(--space-xs) var(--space-sm);
    border: var(--border-width-thin) solid transparent;
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    line-height: 1;
    white-space: nowrap;
  }

  .badge--uppercase {
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide);
  }

  .badge--muted {
    background: color-mix(in oklab, var(--bg-primary) 92%, var(--bg-tertiary));
    border-color: color-mix(in oklab, var(--border) 72%, transparent);
    color: var(--text-primary);
  }

  .badge--pass {
    background: var(--badge-pass-bg);
    color: var(--badge-pass-text);
    border-color: var(--badge-pass-border);
  }

  .badge--warning {
    background: var(--badge-warning-bg);
    color: var(--badge-warning-text);
    border-color: var(--badge-warning-border);
  }

  .badge--fail {
    background: var(--badge-fail-bg);
    color: var(--badge-fail-text);
    border-color: var(--badge-fail-border);
  }

  .badge--accent {
    background: color-mix(in oklab, var(--accent) 12%, var(--bg-primary));
    color: color-mix(in oklab, var(--accent) 82%, var(--text-primary));
    border-color: color-mix(in oklab, var(--accent) 35%, var(--border));
  }

  .badge--disabled {
    background: color-mix(in oklab, var(--text-secondary) 14%, var(--bg-primary));
    color: var(--text-secondary);
    border-color: color-mix(in oklab, var(--text-secondary) 26%, var(--border));
  }
</style>
