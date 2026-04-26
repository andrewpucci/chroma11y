<script lang="ts">
  import { tick } from 'svelte';
  import { GETTING_STARTED_SECTIONS, HELP_RESOURCES, HELP_TOPICS } from '$lib/help/helpContent';
  import { closeGettingStartedGuide, gettingStartedDialog } from '$lib/help/helpDialogStore';
  import Icon from './Icon.svelte';

  const dialogId = 'getting-started-dialog';
  const titleId = 'getting-started-dialog-title';
  const introId = 'getting-started-dialog-intro';
  const focusableSelector = [
    'button:not(:disabled)',
    '[href]',
    'input:not(:disabled)',
    'select:not(:disabled)',
    'textarea:not(:disabled)',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');

  let dialogEl: HTMLElement | undefined = $state();
  let closeButtonEl: HTMLButtonElement | undefined = $state();
  let open = $derived($gettingStartedDialog.open);
  let opener = $derived($gettingStartedDialog.opener);

  async function focusInitialElement(): Promise<void> {
    await tick();
    closeButtonEl?.focus({ preventScroll: true });
  }

  $effect(() => {
    if (open) {
      void focusInitialElement();
    }
  });

  async function closeDialog(): Promise<void> {
    const returnTarget = opener;
    closeGettingStartedGuide();
    await tick();

    if (returnTarget?.isConnected) {
      returnTarget.focus({ preventScroll: true });
    }
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
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div class="dialog-layer">
    <div class="dialog-backdrop" aria-hidden="true"></div>
    <div
      id={dialogId}
      class="getting-started-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={introId}
      tabindex="-1"
      bind:this={dialogEl}
    >
      <div class="dialog-header">
        <div class="dialog-heading">
          <p class="eyebrow">Help</p>
          <h2 id={titleId}>Getting Started</h2>
        </div>
        <button
          bind:this={closeButtonEl}
          type="button"
          class="dialog-close"
          aria-label="Close Getting Started guide"
          onclick={() => void closeDialog()}
        >
          <Icon name="close" size="var(--icon-size-dialog-close)" />
          <span>Close</span>
        </button>
      </div>

      <div class="dialog-body">
        <p id={introId} class="intro">
          Use this guide to connect the main controls to accessible palette decisions.
        </p>

        <div class="guide-grid">
          {#each GETTING_STARTED_SECTIONS as section (section.id)}
            <section class="guide-section" aria-labelledby={`getting-started-${section.id}`}>
              <h3 id={`getting-started-${section.id}`}>{section.title}</h3>
              {#each section.body as paragraph (paragraph)}
                <p>{paragraph}</p>
              {/each}
            </section>
          {/each}
        </div>

        <section class="guide-section resources" aria-labelledby="getting-started-resources">
          <h3 id="getting-started-resources">Learn More</h3>
          <p>
            These resources cover {HELP_TOPICS.oklch.label}, {HELP_TOPICS.wcag.label}, and
            {HELP_TOPICS.apca.label} in more depth.
          </p>
          <ul class="resource-list">
            {#each HELP_RESOURCES as resource (resource.url)}
              <li>
                <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
                <a href={resource.url} target="_blank" rel="noreferrer">{resource.title}</a>
                <span>{resource.description}</span>
              </li>
            {/each}
          </ul>
        </section>
      </div>
    </div>
  </div>
{/if}

<style>
  .dialog-layer {
    position: fixed;
    inset: 0;
    z-index: 80;
    display: grid;
    place-items: center;
    padding: var(--space-lg);
  }

  .dialog-backdrop {
    position: absolute;
    inset: 0;
    background: color-mix(in oklab, black 42%, transparent);
  }

  .getting-started-dialog {
    position: relative;
    z-index: 1;
    inline-size: min(48rem, 100%);
    max-block-size: min(44rem, calc(100vh - var(--space-xl)));
    display: grid;
    grid-template-rows: auto 1fr;
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
  .guide-section h3,
  .intro,
  .guide-section p {
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
    letter-spacing: var(--letter-spacing-normal);
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

  .dialog-body {
    display: grid;
    gap: var(--space-lg);
    overflow: auto;
    padding: var(--space-lg);
  }

  .intro {
    color: var(--text-secondary);
    font-size: var(--font-size-md);
  }

  .guide-grid {
    display: grid;
    gap: var(--space-md);
  }

  .guide-section {
    display: grid;
    gap: var(--space-sm);
  }

  .guide-section h3 {
    font-size: var(--font-size-lg);
    line-height: var(--line-height-tight);
    letter-spacing: var(--letter-spacing-normal);
  }

  .guide-section p,
  .resource-list {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-normal);
  }

  .resource-list {
    display: grid;
    gap: var(--space-sm);
    margin: 0;
    padding-inline-start: var(--space-lg);
  }

  .resource-list li {
    display: grid;
    gap: var(--space-2xs);
  }

  .resource-list a {
    color: var(--accent);
    font-weight: var(--font-weight-semibold);
  }

  @media (max-width: 640px) {
    .dialog-layer {
      align-items: end;
      padding: var(--space-sm);
    }

    .getting-started-dialog {
      max-block-size: calc(100vh - var(--space-lg));
    }

    .dialog-header {
      flex-direction: column;
    }

    .dialog-close {
      width: 100%;
      justify-content: center;
    }
  }
</style>
