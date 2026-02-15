<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<aside class="sidebar" aria-label="Controls" data-testid="app-sidebar">
  <div class="sidebar-inner">
    {@render children()}
  </div>
</aside>

<style>
  .sidebar {
    min-height: 0;
  }

  .sidebar-inner {
    position: sticky;
    top: 86px;
    display: grid;
    gap: var(--space-md);
    container-type: inline-size;
  }

  @media (max-height: 900px) {
    .sidebar-inner {
      max-height: calc(100vh - 110px);
      overflow: auto;
      padding-right: 2px;
    }
  }

  @media (max-width: 980px) {
    .sidebar-inner {
      position: static;
      max-height: none;
      overflow: visible;
    }
  }
</style>
