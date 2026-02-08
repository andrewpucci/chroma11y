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
<div role="status" aria-live="polite" aria-atomic="true" class="sr-only">
  {announceMessage}
</div>

<style>
  :global(html) {
    font-family:
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      Roboto,
      'Helvetica Neue',
      Arial,
      'Apple Color Emoji',
      'Segoe UI Emoji',
      sans-serif;
    line-height: 1.5;
    color-scheme: light dark;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  :global(:root) {
    --column-padding: 1rem;
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.08);
    --shadow-md: 0 10px 25px rgba(0, 0, 0, 0.12);
    --ring: 0 0 0 4px color-mix(in oklab, var(--accent) 25%, transparent);
    --swatch-width: 96px;
    --swatch-gap: 0.5rem;
    --layout-gap: 1rem;
    --control-width: 440px;
    --card-padding: 1rem;
    --card-border-width: 1px;
    --container-max-limit: 2400px;
    --container-vw: 92vw;
    --text-mono:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
      monospace;
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

  :global(*),
  :global(*::before),
  :global(*::after) {
    box-sizing: border-box;
  }

  :global(a) {
    color: inherit;
  }

  :global(h1, h2, h3) {
    line-height: 1.2;
    letter-spacing: -0.02em;
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
    padding: 0.875rem 1rem 0.75rem 1rem;
    border-bottom: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  :global(.card-title) {
    font-size: 0.95rem;
    font-weight: 650;
  }

  :global(.card-subtitle) {
    color: var(--text-secondary);
    font-size: 0.85rem;
  }

  :global(.card-body) {
    padding: var(--card-padding);
  }

  :global(.btn) {
    appearance: none;
    border: 1px solid var(--border);
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border-radius: 10px;
    padding: 0.65rem 0.9rem;
    font-weight: 600;
    cursor: pointer;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition:
      transform 120ms ease,
      background-color 120ms ease,
      border-color 120ms ease,
      box-shadow 120ms ease,
      color 120ms ease;
  }

  :global(.btn:hover:not(:disabled)) {
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
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
    gap: 0.4rem;
  }

  :global(.label) {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  :global(.help) {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  :global(.input),
  :global(.select) {
    width: 100%;
    border: 1px solid var(--border);
    background: var(--bg-primary);
    color: var(--text-primary);
    border-radius: 10px;
    padding: 0.6rem 0.75rem;
    min-height: 44px;
    outline: none;
    transition:
      border-color 120ms ease,
      box-shadow 120ms ease;
  }

  :global(.input:focus-visible),
  :global(.select:focus-visible) {
    border-color: color-mix(in oklab, var(--accent) 60%, var(--border));
    box-shadow: var(--ring);
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
    --text-secondary: #6c757d;
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
