<script lang="ts">
  import type { HistoryMenuEntry } from '$lib/history';
  import Brand from './Brand.svelte';
  import HistoryActionGroup from './HistoryActionGroup.svelte';

  interface Props {
    bindInner?: HTMLElement | undefined;
    canUndo?: boolean;
    canRedo?: boolean;
    undoEntries?: HistoryMenuEntry[];
    redoEntries?: HistoryMenuEntry[];
    onUndo?: () => void;
    onRedo?: () => void;
    onUndoJump?: (position: number) => void;
    onRedoJump?: (position: number) => void;
  }

  let {
    bindInner = $bindable(),
    canUndo = false,
    canRedo = false,
    undoEntries = [],
    redoEntries = [],
    onUndo = () => {},
    onRedo = () => {},
    onUndoJump = () => {},
    onRedoJump = () => {}
  }: Props = $props();
</script>

<header class="topbar">
  <div class="topbar-inner" bind:this={bindInner}>
    <Brand />
    <div class="history-controls" aria-label="History controls">
      <HistoryActionGroup
        action="undo"
        disabled={!canUndo}
        entries={undoEntries}
        onAction={onUndo}
        onSelect={onUndoJump}
      />
      <HistoryActionGroup
        action="redo"
        disabled={!canRedo}
        entries={redoEntries}
        onAction={onRedo}
        onSelect={onRedoJump}
      />
    </div>
  </div>
</header>

<style>
  .topbar {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--bg-primary);
    border-bottom: 1px solid color-mix(in oklab, var(--border) 55%, transparent);
  }

  .topbar-inner {
    max-width: var(--container-max);
    margin: 0 auto;
    padding: var(--space-lg) var(--column-padding);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-lg);
    container-type: inline-size;
  }

  .history-controls {
    display: inline-flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    align-items: center;
  }

  @container (max-width: 520px) {
    .topbar-inner {
      flex-direction: column;
      align-items: flex-start;
    }

    .history-controls {
      width: 100%;
    }
  }
</style>
