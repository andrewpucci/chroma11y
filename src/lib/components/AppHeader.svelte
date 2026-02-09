<script lang="ts">
  import Brand from './Brand.svelte';
  import ThemeToggle from './ThemeToggle.svelte';

  interface Props {
    bindInner?: HTMLElement | undefined;
  }

  let { bindInner = $bindable() }: Props = $props();
</script>

<header class="topbar">
  <div class="topbar-inner" bind:this={bindInner}>
    <Brand />
    <div class="topbar-actions">
      <ThemeToggle />
    </div>
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
    padding: 1rem var(--column-padding);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  @media (max-width: 520px) {
    .topbar-inner {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
