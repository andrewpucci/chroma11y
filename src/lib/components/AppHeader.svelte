<script lang="ts">
  import Brand from './Brand.svelte';

  interface Props {
    bindInner?: HTMLElement | undefined;
  }

  let { bindInner = $bindable() }: Props = $props();
</script>

<header class="topbar">
  <div class="topbar-inner" bind:this={bindInner}>
    <Brand />
  </div>
</header>

<style>
  .topbar {
    position: sticky;
    top: 0;
    z-index: 10;
    background: color-mix(in oklab, var(--bg-primary) 88%, transparent);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid color-mix(in oklab, var(--border) 70%, transparent);
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

  @container (max-width: 520px) {
    .topbar-inner {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
