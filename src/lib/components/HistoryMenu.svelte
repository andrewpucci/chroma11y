<script lang="ts">
  import { onMount, tick } from 'svelte';

  import type { HistoryMenuEntry } from '$lib/history';
  import Icon from './Icon.svelte';
  import HistoryMenuItem from './HistoryMenuItem.svelte';

  interface Props {
    action: 'undo' | 'redo';
    entries?: HistoryMenuEntry[];
    disabled?: boolean;
    onSelect: (position: number) => void;
  }

  let { action, entries = [], disabled = false, onSelect }: Props = $props();

  const menuLabel = $derived(action === 'undo' ? 'Undo history' : 'Redo history');
  const triggerLabel = $derived(action === 'undo' ? 'Show undo history' : 'Show redo history');

  let open = $state(false);
  let rootEl: HTMLDivElement | undefined = $state();
  let itemEls: HTMLButtonElement[] = $state([]);

  function closeMenu(): void {
    open = false;
  }

  async function toggleMenu(): Promise<void> {
    if (disabled || entries.length === 0) {
      return;
    }

    open = !open;
    if (open) {
      await tick();
      itemEls[0]?.focus();
    }
  }

  function selectEntry(position: number): void {
    onSelect(position);
    closeMenu();
  }

  function moveFocus(nextIndex: number): void {
    itemEls[nextIndex]?.focus();
  }

  function handleDocumentPointerDown(event: PointerEvent): void {
    if (!open || !rootEl) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Node) || rootEl.contains(target)) {
      return;
    }

    closeMenu();
  }

  function handleDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      closeMenu();
    }
  }

  function handleMenuKeydown(event: KeyboardEvent): void {
    if (!open || itemEls.length === 0) {
      return;
    }

    const currentIndex = itemEls.findIndex((button) => button === document.activeElement);

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % itemEls.length : 0;
        moveFocus(nextIndex);
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const nextIndex =
          currentIndex >= 0 ? (currentIndex - 1 + itemEls.length) % itemEls.length : 0;
        moveFocus(nextIndex);
        break;
      }
      case 'Home':
        event.preventDefault();
        moveFocus(0);
        break;
      case 'End':
        event.preventDefault();
        moveFocus(itemEls.length - 1);
        break;
    }
  }

  onMount(() => {
    document.addEventListener('pointerdown', handleDocumentPointerDown, true);
    document.addEventListener('keydown', handleDocumentKeydown, true);

    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown, true);
      document.removeEventListener('keydown', handleDocumentKeydown, true);
    };
  });
</script>

<div class="history-menu" bind:this={rootEl}>
  <button
    type="button"
    class="history-menu-trigger"
    aria-label={triggerLabel}
    aria-haspopup="menu"
    aria-expanded={open}
    disabled={disabled || entries.length === 0}
    onclick={toggleMenu}
  >
    <Icon name="chevron-down" />
  </button>

  {#if open}
    <div
      class="history-menu-popover"
      role="menu"
      aria-label={menuLabel}
      tabindex="-1"
      onkeydown={handleMenuKeydown}
    >
      {#each entries as entry, index (entry.position)}
        <HistoryMenuItem bind:buttonEl={itemEls[index]} {entry} onclick={selectEntry} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .history-menu {
    position: relative;
    display: flex;
  }

  .history-menu-trigger {
    appearance: none;
    min-height: var(--touch-target-comfortable);
    min-width: var(--touch-target-comfortable);
    border-radius: var(--radius-md);
    border: 1px solid var(--border);
    background: var(--bg-tertiary);
    color: var(--text-primary);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition:
      background-color var(--transition-fast),
      border-color var(--transition-fast),
      color var(--transition-fast);
  }

  .history-menu-trigger:hover:not(:disabled) {
    border-color: color-mix(in oklab, var(--border) 40%, var(--accent));
  }

  .history-menu-trigger:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .history-menu-popover {
    position: absolute;
    inset-block-start: calc(100% + var(--space-xs));
    inset-inline-end: 0;
    width: min(280px, 70vw);
    max-height: min(320px, 60vh);
    overflow: auto;
    display: grid;
    gap: var(--space-xs);
    padding: var(--space-xs);
    border-radius: var(--radius-md);
    border: 1px solid var(--border);
    background: var(--bg-primary);
    box-shadow: 0 12px 32px color-mix(in oklab, black 14%, transparent);
    z-index: 20;
  }
</style>
