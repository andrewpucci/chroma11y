<script lang="ts">
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
  <title>Svelte Color Generator</title>
  <meta name="description" content="Advanced color generator using OKLCH color space" />
</svelte:head>

<div class="app">
  <main>
    {@render children()}
  </main>
</div>

<!-- Screen reader announcements -->
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  class="sr-only"
>
  {announceMessage}
</div>

<style>
  :global(html) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.5;
    color-scheme: light dark;
  }

  :global(:root) {
    --column-padding: 1rem;
  }

  /* Global focus styles for accessibility */
  :global(*:focus) {
    outline: none;
  }

  :global(*:focus-visible) {
    outline: 2px solid var(--accent, #1862e6);
    outline-offset: 2px;
  }

  /* Skip link for keyboard users */
  :global(.skip-link) {
    position: absolute;
    top: -100%;
    left: 0;
    background: var(--accent);
    color: white;
    padding: 0.5rem 1rem;
    z-index: 1000;
    text-decoration: none;
    font-weight: 500;
  }

  :global(.skip-link:focus) {
    top: 0;
  }

  /* Reduced motion preference */
  @media (prefers-reduced-motion: reduce) {
    :global(*),
    :global(*::before),
    :global(*::after) {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* Screen reader only utility */
  :global(.sr-only) {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    background: var(--bg-primary, #ffffff);
    color: var(--text-primary, #1a1a1a);
    transition:
      background-color 0.3s ease,
      color 0.3s ease;
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
    box-sizing: border-box;
    overflow: hidden;
  }

  /* Light theme */
  :global([data-theme='light']) {
    --bg-primary: #ffffff;
    --bg-secondary: #f8f9fa;
    --bg-tertiary: #e9ecef;
    --text-primary: #1a1a1a;
    --text-secondary: #6c757d;
    --border: #dee2e6;
    --accent: #1862e6;
    --accent-hover: #1352c4;
  }

  /* Dark theme */
  :global([data-theme='dark']) {
    --bg-primary: #0d1117;
    --bg-secondary: #161b22;
    --bg-tertiary: #21262d;
    --text-primary: #f0f6fc;
    --text-secondary: #8b949e;
    --border: #30363d;
    --accent: #58a6ff;
    --accent-hover: #79b8ff;
  }
</style>
