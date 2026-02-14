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
    <h2 class="card-title">{title}</h2>
    {#if subtitle}
      <div class="card-subtitle">{subtitle}</div>
    {/if}
  </div>
  <div class="card-body">
    {@render children()}
  </div>
</section>
