<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';

  interface Props {
    title: string;
    subtitle?: string;
    summary?: string;
    children: Snippet;
    collapsible?: boolean;
    open?: boolean;
    defaultOpen?: boolean;
    onToggle?: (open: boolean) => void;
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
    summary,
    children,
    collapsible = false,
    open,
    defaultOpen = true,
    onToggle,
    id,
    class: className,
    'data-testid': dataTestId,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy
  }: Props = $props();

  let uncontrolledOpen = $state(false);
  let uncontrolledOpenInitialized = $state(false);
  const isControlled = $derived(open !== undefined);
  const isOpen = $derived(isControlled ? (open ?? defaultOpen) : uncontrolledOpen);

  $effect(() => {
    if (uncontrolledOpenInitialized) {
      return;
    }

    uncontrolledOpen = defaultOpen;
    uncontrolledOpenInitialized = true;
  });

  function handleToggle(event: Event): void {
    const nextOpen = (event.currentTarget as HTMLDetailsElement).open;

    if (!isControlled) {
      uncontrolledOpen = nextOpen;
    }

    onToggle?.(nextOpen);
  }
</script>

{#if collapsible}
  <details
    class="card card-collapsible {className || ''}"
    {id}
    open={isOpen}
    data-testid={dataTestId}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledBy}
    aria-describedby={ariaDescribedBy}
    ontoggle={handleToggle}
  >
    <summary class="card-header card-summary">
      <span class="card-header-text">
        <h2 class="card-title">{title}</h2>
        {#if summary}
          <span class="card-summary-text">{summary}</span>
        {:else if subtitle}
          <span class="card-subtitle">{subtitle}</span>
        {/if}
      </span>
      <span class="card-chevron" aria-hidden="true">
        <span class="card-chevron-inner">
          <Icon
            name="chevron-down"
            size="var(--disclosure-icon-size)"
            stroke="var(--disclosure-icon-stroke)"
          />
        </span>
      </span>
    </summary>
    <div class="card-panel">
      <div class="card-body">
        {@render children()}
      </div>
    </div>
  </details>
{:else}
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
{/if}

<style>
  .card {
    --disclosure-icon-size: var(--icon-size-disclosure);
    --disclosure-icon-stroke: var(--icon-stroke-disclosure);
    --disclosure-expand-duration: var(--duration-slow);
    --disclosure-collapse-duration: var(--duration-normal);
    --disclosure-expand-ease: var(--ease-emphasized);
    --disclosure-collapse-ease: var(--ease-out);
    background: color-mix(in oklab, var(--bg-secondary) 94%, transparent);
    border: var(--border-width-thin) solid color-mix(in oklab, var(--border) 60%, transparent);
    border-radius: var(--radius-sm);
  }

  .card-header {
    padding: var(--space-md) var(--space-md) var(--space-sm) var(--space-md);
    border-bottom: 1px solid color-mix(in oklab, var(--border) 42%, transparent);
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .card-header-text {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    text-align: left;
    flex: 1;
    min-width: 0;
  }

  .card-title {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
  }

  .card-subtitle {
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
  }

  .card-summary-text {
    color: color-mix(in oklab, var(--text-secondary) 88%, transparent);
    font-size: var(--font-size-xs);
  }

  .card-body {
    padding: var(--space-md);
  }

  .card-collapsible {
    overflow: hidden;
    transition:
      border-color var(--transition-fast),
      background-color var(--transition-normal);
  }

  .card-summary {
    list-style: none;
    cursor: pointer;
    min-height: var(--touch-target-comfortable);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-sm);
    flex-direction: row;
    text-align: left;
    width: 100%;
  }

  .card-summary::-webkit-details-marker {
    display: none;
  }

  .card-summary::marker {
    content: '';
  }

  .card-summary:focus-visible {
    outline: none;
    box-shadow: none;
  }

  .card-collapsible:has(> .card-summary:focus-visible) {
    outline: var(--focus-outline-width) solid var(--focus-outline-inside);
    box-shadow: 0 0 0 var(--focus-outline-offset) var(--focus-outline-outside);
  }

  .card-chevron {
    inline-size: calc(var(--space-md) + var(--space-2xs));
    block-size: calc(var(--space-md) + var(--space-2xs));
    flex: 0 0 calc(var(--space-md) + var(--space-2xs));
    margin-inline-start: auto;
    margin-block-start: var(--space-2xs);
    color: var(--text-primary);
    opacity: 0.92;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .card-collapsible[open] > .card-summary {
    border-bottom: var(--border-width-thin) solid
      color-mix(in oklab, var(--border) 42%, transparent);
  }

  .card-chevron-inner {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition:
      transform var(--duration-normal) var(--ease-emphasized),
      opacity var(--transition-fast);
    transform-origin: center;
  }

  .card-collapsible[open] > .card-summary .card-chevron-inner {
    transform: rotate(180deg);
  }

  @supports selector(::details-content) {
    @supports (interpolate-size: allow-keywords) {
      .card-collapsible {
        interpolate-size: allow-keywords;
      }

      .card-collapsible::details-content {
        block-size: 0;
        opacity: 0;
        overflow: clip;
        transition:
          block-size var(--disclosure-collapse-duration) var(--disclosure-collapse-ease),
          opacity var(--disclosure-collapse-duration) var(--disclosure-collapse-ease),
          content-visibility var(--disclosure-collapse-duration) allow-discrete;
      }

      .card-collapsible[open]::details-content {
        block-size: auto;
        opacity: 1;
        transition:
          block-size var(--disclosure-expand-duration) var(--disclosure-expand-ease),
          opacity var(--duration-normal) var(--ease-out),
          content-visibility var(--disclosure-expand-duration) allow-discrete;
      }

      .card-collapsible > .card-panel .card-body {
        transform: translateY(calc(var(--space-xs) * -1));
        transition: transform var(--disclosure-collapse-duration) var(--disclosure-collapse-ease);
      }

      .card-collapsible[open] > .card-panel .card-body {
        transform: translateY(0);
        transition: transform var(--disclosure-expand-duration) var(--disclosure-expand-ease);
      }
    }
  }

  @media (max-width: 980px) {
    .card {
      --disclosure-icon-size: var(--icon-size-disclosure-compact);
      --disclosure-icon-stroke: var(--icon-stroke-disclosure-compact);
    }
  }
</style>
