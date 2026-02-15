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
<div role="status" aria-live="polite" aria-atomic="true" class="sr-only">
  {announceMessage}
</div>

<style>
  :global(html) {
    font-family:
      'Atkinson Hyperlegible Next Variable', system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
      sans-serif;
    line-height: var(--line-height-normal);
    color-scheme: light dark;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  :global(:root) {
    --column-padding: var(--space-lg);
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.08);
    --shadow-md: 0 10px 25px rgba(0, 0, 0, 0.12);
    --swatch-width: 96px;
    --swatch-gap: var(--space-sm);
    --layout-gap: var(--space-lg);
    --control-width: 440px;
    --card-padding: var(--space-lg);
    --card-border-width: 1px;
    --palette-block-padding: var(--space-md);
    --palette-block-border-width: 1px;
    --container-max-limit: 2400px;
    --container-vw: 92vw;
    --text-mono:
      'Atkinson Hyperlegible Mono Variable', ui-monospace, 'Cascadia Code', 'Source Code Pro',
      Menlo, Consolas, monospace;
  }

  /* Global focus styles for accessibility — universal double-outline pattern
     per https://www.sarasoueidan.com/blog/focus-indicators/
     White outline + black shadow guarantees ≥3:1 contrast against any background. */
  :global(*:focus-visible) {
    outline: 3px solid white;
    box-shadow: 0 0 0 6px black;
  }

  /* Skip link for keyboard users */
  :global(.skip-link) {
    position: absolute;
    top: -100%;
    left: 0;
    background: var(--accent);
    color: white;
    padding: var(--space-sm) var(--space-lg);
    z-index: 1000;
    text-decoration: none;
    font-weight: var(--font-weight-medium);
  }

  :global(.skip-link:focus) {
    top: 0;
  }

  /* Reduced motion preference - handled by design tokens */
  @media (prefers-reduced-motion: reduce) {
    :global(*),
    :global(*::before),
    :global(*::after) {
      animation-iteration-count: 1 !important;
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
      background-color var(--transition-slow),
      color var(--transition-slow);
  }

  :global(*),
  :global(*::before),
  :global(*::after) {
    box-sizing: border-box;
  }

  :global(a) {
    color: inherit;
  }

  :global(h1, h2, h3) {
    line-height: var(--line-height-tight);
    letter-spacing: var(--letter-spacing-tight);
    margin: 0;
  }

  :global(p) {
    margin: 0;
  }

  :global(code, kbd, samp, pre) {
    font-family: var(--text-mono);
  }

  :global(.card) {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
  }

  :global(.card-header) {
    padding: var(--space-md) var(--space-lg) var(--space-md) var(--space-lg);
    border-bottom: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  :global(.card-title) {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
  }

  :global(.card-subtitle) {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }

  :global(.card-body) {
    padding: var(--card-padding);
  }

  :global(.btn) {
    appearance: none;
    border: 1px solid var(--border);
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border-radius: var(--radius-md);
    padding: var(--space-sm) var(--space-md);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    min-height: var(--touch-target-comfortable);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    transition:
      transform var(--transition-fast),
      background-color var(--transition-fast),
      border-color var(--transition-fast),
      color var(--transition-fast);
  }

  :global(.btn:hover:not(:disabled)) {
    transform: translateY(-1px);
    border-color: color-mix(in oklab, var(--border) 40%, var(--accent));
  }

  :global(.btn:active:not(:disabled)) {
    transform: translateY(0);
  }

  :global(.btn:disabled) {
    opacity: 0.55;
    cursor: not-allowed;
  }

  :global(.btn-primary) {
    background: color-mix(in oklab, var(--accent) 90%, black);
    color: white;
    border-color: color-mix(in oklab, var(--accent) 70%, black);
  }

  :global(.btn-primary:hover:not(:disabled)) {
    background: color-mix(in oklab, var(--accent-hover) 90%, black);
    border-color: color-mix(in oklab, var(--accent-hover) 70%, black);
  }

  :global(.btn-ghost) {
    background: transparent;
  }

  :global(.field) {
    display: grid;
    gap: var(--space-xs);
  }

  :global(.label) {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
  }

  :global(.help) {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  :global(.input),
  :global(.select) {
    width: 100%;
    border: 1px solid var(--border);
    background: var(--bg-primary);
    color: var(--text-primary);
    border-radius: var(--radius-md);
    padding: var(--space-sm) var(--space-md);
    min-height: var(--touch-target-comfortable);
    transition: border-color var(--transition-fast);
  }

  :global(.mono) {
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
    box-sizing: border-box;
    overflow: hidden;
  }

  /* Light theme */
  :global([data-theme='light']) {
    --bg-primary: #ffffff;
    --bg-secondary: #f6f7f9;
    --bg-tertiary: #eef0f4;
    --text-primary: #1a1a1a;
    --text-secondary: #636a72;
    --border: #dee2e6;
    --accent: #1862e6;
    --accent-hover: #1352c4;
  }

  /* Dark theme */
  :global([data-theme='dark']) {
    --bg-primary: #0d1117;
    --bg-secondary: #121824;
    --bg-tertiary: #1a2231;
    --text-primary: #f0f6fc;
    --text-secondary: #8b949e;
    --border: #30363d;
    --accent: #58a6ff;
    --accent-hover: #79b8ff;
  }
</style>
