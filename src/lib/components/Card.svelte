<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    subtitle?: string;
    children: Snippet;
    // Allow specific HTML attributes that are commonly needed
    id?: string;
    class?: string;
    'data-testid'?: string;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
  }

  let {
    title,
    subtitle,
    children,
    id,
    class: className,
    'data-testid': dataTestId,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy
  }: Props = $props();
</script>

<section
  class="card {className || ''}"
  {id}
  data-testid={dataTestId}
  aria-label={ariaLabel}
  aria-labelledby={ariaLabelledBy}
  aria-describedby={ariaDescribedBy}
>
  <div class="card-header">
    <h2 class="card-title">{title}</h2>
    {#if subtitle}
      <div class="card-subtitle">{subtitle}</div>
    {/if}
  </div>
  <div class="card-body">
    {@render children()}
  </div>
</section>

<style>
  .card {
    background: var(--bg-secondary);
    border: var(--border-width-thin) solid var(--border);
    border-radius: var(--radius-md);
  }

  .card-header {
    padding: var(--space-md) var(--space-lg) var(--space-md) var(--space-lg);
    border-bottom: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .card-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
  }

  .card-subtitle {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }

  .card-body {
    padding: var(--space-lg);
  }
</style>
