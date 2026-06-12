<script lang="ts">
  import { announce } from '$lib/announce';
  import { referenceConfiguration } from '$lib/stores';
  import {
    pinReferenceConfiguration,
    clearReferenceConfiguration,
    replaceReferenceConfiguration,
    restoreReferenceConfiguration
  } from '$lib/stores';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';

  interface Props {
    onHistoryCommit?: (label: string) => void;
  }

  let { onHistoryCommit = () => {} }: Props = $props();

  let hasReference = $derived($referenceConfiguration !== null);

  function handlePin(): void {
    pinReferenceConfiguration();
    announce('Reference configuration pinned');
    onHistoryCommit('Reference pinned');
  }

  function handleClear(): void {
    clearReferenceConfiguration();
    announce('Reference configuration cleared');
    onHistoryCommit('Reference cleared');
  }

  function handleReplace(): void {
    replaceReferenceConfiguration();
    announce('Reference configuration replaced');
    onHistoryCommit('Reference replaced');
  }

  function handleRestore(): void {
    restoreReferenceConfiguration();
    announce('Reference configuration restored');
    onHistoryCommit('Reference restored');
  }
</script>

<div class="reference-controls" aria-label="Reference configuration controls">
  {#if hasReference}
    <Button
      onclick={handleReplace}
      variant="secondary"
      ariaLabel="Replace reference configuration with current palette"
    >
      <Icon name="reset" />
      <span>Replace Reference</span>
    </Button>
    <Button
      onclick={handleRestore}
      variant="secondary"
      ariaLabel="Restore reference configuration into current palette"
    >
      <Icon name="undo" />
      <span>Restore Reference</span>
    </Button>
    <Button
      onclick={handleClear}
      variant="secondary"
      ariaLabel="Clear reference configuration and return to default view"
    >
      <Icon name="close" />
      <span>Clear Reference</span>
    </Button>
  {:else}
    <Button
      onclick={handlePin}
      variant="secondary"
      ariaLabel="Pin current palette configuration as reference for side-by-side comparison"
    >
      <Icon name="check" />
      <span>Pin Reference</span>
    </Button>
  {/if}
</div>

<style>
  .reference-controls {
    display: inline-flex;
    align-items: center;
  }
</style>
