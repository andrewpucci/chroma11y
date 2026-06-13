<script lang="ts">
  import type { HistoryMenuEntry } from '$lib/history';
  import { gettingStartedDialog, openGettingStartedGuide } from '$lib/help/helpDialogStore';
  import Brand from './Brand.svelte';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import HistoryActionGroup from './HistoryActionGroup.svelte';
  import ReferenceControls from './ReferenceControls.svelte';

  interface Props {
    bindInner?: HTMLElement | undefined;
    canUndo?: boolean;
    canRedo?: boolean;
    undoEntries?: HistoryMenuEntry[];
    redoEntries?: HistoryMenuEntry[];
    onUndo?: () => void;
    onRedo?: () => void;
    onReset?: () => void;
    onUndoJump?: (position: number) => void;
    onRedoJump?: (position: number) => void;
    onReferenceHistoryCommit?: (label: string) => void;
  }

  let {
    bindInner = $bindable(),
    canUndo = false,
    canRedo = false,
    undoEntries = [],
    redoEntries = [],
    onUndo = () => {},
    onRedo = () => {},
    onReset = () => {},
    onUndoJump = () => {},
    onRedoJump = () => {},
    onReferenceHistoryCommit = () => {}
  }: Props = $props();

  let gettingStartedOpen = $derived($gettingStartedDialog.open);

  function handleHelpOpen(event: MouseEvent): void {
    openGettingStartedGuide(event.currentTarget as HTMLElement);
  }
</script>

<header class="topbar">
  <div class="topbar-inner" bind:this={bindInner}>
    <Brand />
    <div class="controls" aria-label="App controls">
      <ReferenceControls onHistoryCommit={onReferenceHistoryCommit} />
      <div class="history-controls" aria-label="History controls">
        <Button
          onclick={handleHelpOpen}
          variant="secondary"
          ariaLabel="Open Getting Started guide"
          ariaControls="getting-started-dialog"
          ariaExpanded={gettingStartedOpen}
        >
          <Icon name="help" />
          <span>Help</span>
        </Button>
        <Button onclick={onReset} variant="ghost" ariaLabel="Reset all settings to defaults">
          <Icon name="reset" />
          <span>Reset</span>
        </Button>
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
  </div>
</header>

<style>
  .topbar {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--bg-primary);
    border-bottom: 1px solid color-mix(in oklab, var(--border) 55%, transparent);
    container-type: inline-size;
  }

  .topbar-inner {
    max-width: var(--container-max);
    margin: 0 auto;
    padding: var(--space-lg) var(--column-padding);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-lg);
  }

  .controls {
    display: inline-flex;
    flex-wrap: wrap;
    gap: var(--space-lg);
    align-items: center;
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

    .controls,
    .history-controls {
      width: 100%;
    }
  }
</style>
