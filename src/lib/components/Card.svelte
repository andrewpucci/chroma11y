<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    subtitle?: string;
    children: Snippet;
  }

  let { title, subtitle, children }: Props = $props();
</script>

<section class="card">
  <div class="card-header">
    <div class="card-title">{title}</div>
    {#if subtitle}
      <div class="card-subtitle">{subtitle}</div>
    {/if}
  </div>
  <div class="card-body">
    {@render children()}
  </div>
</section>
