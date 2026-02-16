<script lang="ts">
  import '@fontsource-variable/atkinson-hyperlegible-next';
  import '@fontsource-variable/atkinson-hyperlegible-mono';
  import '$lib/styles/tokens.css';
  import { currentTheme } from '$lib/stores';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();

  const theme = $derived($currentTheme);
  let announceMessage = $state('');

  $effect(() => {
    if (browser && theme) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  });

  onMount(() => {
    const handleAnnounce = (event: CustomEvent<string>) => {
      announceMessage = '';
      // Small delay to ensure screen readers pick up the change
      setTimeout(() => {
        announceMessage = event.detail;
      }, 50);
    };

    window.addEventListener('app:announce', handleAnnounce as EventListener);
    return () => {
      window.removeEventListener('app:announce', handleAnnounce as EventListener);
    };
  });
</script>

<svelte:head>
  <title>Chroma11y</title>
  <meta name="description" content="Accessible color palette generator powered by OKLCH" />
</svelte:head>

<div class="app">
  <main>
    {@render children()}
  </main>
</div>

<!-- Screen reader announcements -->
<div role="status" aria-live="polite" aria-atomic="true" class="visually-hidden">
  {announceMessage}
</div>

<style>
  :global {
    @import '$lib/styles/reset.css';
    @import '$lib/styles/utilities.css';
  }

  /* App-specific font configuration */
  :global(html) {
    font-family:
      'Atkinson Hyperlegible Next Variable', system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
      sans-serif;
    line-height: var(--line-height-normal);
    text-rendering: optimizeLegibility;
  }

  :global(:root) {
    --column-padding: var(--space-lg);
    --text-mono:
      'Atkinson Hyperlegible Mono Variable', ui-monospace, 'Cascadia Code', 'Source Code Pro',
      Menlo, Consolas, monospace;
  }

  /* Global focus styles for accessibility — universal double-outline pattern
     per https://www.sarasoueidan.com/blog/focus-indicators/
     Theme-aware outline + shadow guarantees ≥3:1 contrast against any background. */
  :global(*:focus-visible) {
    outline: var(--focus-outline-width) solid var(--focus-outline-inside);
    box-shadow: 0 0 0 var(--focus-outline-offset) var(--focus-outline-outside);
  }

  /* Reduced motion preference - handled by design tokens */
  @media (prefers-reduced-motion: reduce) {
    :global(*),
    :global(*::before),
    :global(*::after) {
      scroll-behavior: auto !important;
    }
  }

  /* App-specific global styles */
  :global(body) {
    background: var(--bg-primary, #ffffff);
    color: var(--text-primary, #1a1a1a);
    transition:
      background-color var(--transition-slow),
      color var(--transition-slow);
  }

  :global(a) {
    color: inherit;
  }

  :global(h1, h2, h3) {
    line-height: var(--line-height-tight);
    letter-spacing: var(--letter-spacing-tight);
  }

  :global(code, kbd, samp, pre) {
    font-family: var(--text-mono);
  }

  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  main {
    flex: 1;
    margin: 0 auto;
    width: 100%;
    overflow: hidden;
  }

  /* Light theme */
  :global([data-theme='light']) {
    color-scheme: light;
  }

  /* Dark theme */
  :global([data-theme='dark']) {
    color-scheme: dark;
  }
</style>
