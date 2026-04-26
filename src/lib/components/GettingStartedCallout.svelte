<script lang="ts">
  import { onMount } from 'svelte';
  import { GETTING_STARTED_CALLOUT_STORAGE_KEY, HELP_TOPICS } from '$lib/help/helpContent';
  import { openGettingStartedGuide } from '$lib/help/helpDialogStore';

  let ready = $state(false);
  let dismissed = $state(true);

  onMount(() => {
    try {
      dismissed = window.localStorage.getItem(GETTING_STARTED_CALLOUT_STORAGE_KEY) === 'true';
    } catch {
      dismissed = false;
    }
    ready = true;
  });

  function openGuide(event: MouseEvent): void {
    openGettingStartedGuide(event.currentTarget as HTMLElement);
  }

  function dismissCallout(): void {
    dismissed = true;
    try {
      window.localStorage.setItem(GETTING_STARTED_CALLOUT_STORAGE_KEY, 'true');
    } catch {
      // Ignore unavailable storage; dismissal still applies for this session.
    }
  }
</script>

{#if ready && !dismissed}
  <section
    class="getting-started-callout"
    aria-labelledby="getting-started-callout-title"
    data-testid="getting-started-callout"
  >
    <div class="callout-copy">
      <h2 id="getting-started-callout-title">New to Chroma11y?</h2>
      <p>
        Learn how {HELP_TOPICS.oklch.label}, curves, warmth, saturation, and contrast checks work
        together.
      </p>
    </div>
    <div class="callout-actions">
      <button type="button" class="callout-primary" onclick={openGuide}>Getting Started</button>
      <button type="button" class="callout-secondary" onclick={dismissCallout}>Dismiss</button>
    </div>
  </section>
{/if}

<style>
  .getting-started-callout {
    display: grid;
    gap: var(--space-md);
    padding: var(--space-md);
    border: var(--border-width-thin) solid color-mix(in oklab, var(--accent) 35%, var(--border));
    border-radius: var(--radius-md);
    background: color-mix(in oklab, var(--accent) 8%, var(--bg-primary));
    color: var(--text-primary);
  }

  .callout-copy {
    display: grid;
    gap: var(--space-xs);
  }

  .callout-copy h2,
  .callout-copy p {
    margin: 0;
  }

  .callout-copy h2 {
    font-size: var(--font-size-md);
    line-height: var(--line-height-tight);
    letter-spacing: var(--letter-spacing-normal);
  }

  .callout-copy p {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-normal);
  }

  .callout-actions {
    display: flex;
    gap: var(--space-sm);
    flex-wrap: wrap;
  }

  .callout-primary,
  .callout-secondary {
    min-height: var(--touch-target-comfortable);
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    font: inherit;
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
  }

  .callout-primary {
    border: var(--border-width-thin) solid color-mix(in oklab, var(--accent) 70%, black);
    background: color-mix(in oklab, var(--accent) 90%, black);
    color: white;
  }

  .callout-secondary {
    border: var(--border-width-thin) solid var(--border);
    background: var(--bg-primary);
    color: var(--text-primary);
  }
</style>
