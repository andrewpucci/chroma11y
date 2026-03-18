<script lang="ts">
  import type { HistoryMenuEntry } from '$lib/history';

  interface Props {
    entry: HistoryMenuEntry;
    onclick: (position: number) => void;
    buttonEl?: HTMLButtonElement | undefined;
  }

  let { entry, onclick, buttonEl = $bindable() }: Props = $props();
</script>

<button
  bind:this={buttonEl}
  type="button"
  class="history-menu-item"
  role="menuitem"
  aria-label={entry.ariaLabel}
  onclick={() => onclick(entry.position)}
>
  <span class="history-menu-item-label">{entry.displayText}</span>
</button>

<style>
  .history-menu-item {
    width: 100%;
    appearance: none;
    border: 0;
    background: transparent;
    color: var(--text-primary);
    text-align: left;
    padding: var(--space-sm) var(--space-md);
    font-size: var(--font-size-sm);
    min-height: var(--touch-target-comfortable);
    cursor: pointer;
    border-radius: var(--radius-sm);
  }

  .history-menu-item:hover,
  .history-menu-item:focus-visible {
    background: color-mix(in oklab, var(--accent) 12%, var(--bg-secondary));
    outline: none;
  }

  .history-menu-item-label {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
