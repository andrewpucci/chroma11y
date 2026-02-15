<script lang="ts">
  import DynamicSvg from '$lib/components/DynamicSvg.svelte';

  interface Props {
    title?: string;
    tagline?: string;
  }

  let { title = 'Chroma11y', tagline = 'Accessible color palettes, powered by OKLCH' }: Props =
    $props();
</script>

<div class="brand">
  <div class="brand-logo">
    <DynamicSvg src="/favicon.svg" class="brand-svg" />
  </div>
  <div class="brand-text">
    <h1 id="main-heading">{title}</h1>
    <p class="tagline">{tagline}</p>
  </div>
</div>

<style>
  .brand {
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }

  .brand-logo {
    flex-shrink: 0;
    height: 2.5rem; /* Approximate height of h1 + tagline */
    width: auto;
  }

  .brand-text {
    display: grid;
    gap: var(--space-xs);
  }

  .brand h1 {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    letter-spacing: var(--letter-spacing-tight);
  }

  .tagline {
    font-size: var(--font-size-md);
    color: var(--text-secondary);
  }

  @media (max-width: 520px) {
    .brand h1 {
      font-size: var(--font-size-lg);
    }

    .brand-logo {
      height: 2.2rem; /* Slightly smaller for mobile */
    }
  }
</style>
