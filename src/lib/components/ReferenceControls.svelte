<script lang="ts">
  import { referenceConfiguration } from '$lib/stores';
  import { pinReferenceConfiguration, clearReferenceConfiguration } from '$lib/stores';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';

  let hasReference = $derived($referenceConfiguration !== null);

  function handlePin(): void {
    pinReferenceConfiguration();
  }

  function handleClear(): void {
    clearReferenceConfiguration();
  }
</script>

<div class="reference-controls" aria-label="Reference configuration controls">
  {#if hasReference}
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
