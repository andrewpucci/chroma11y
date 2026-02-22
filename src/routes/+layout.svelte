<script lang="ts">
  import '@fontsource-variable/atkinson-hyperlegible-next';
  import '@fontsource-variable/atkinson-hyperlegible-mono';
  import '$lib/styles/reset.css';
  import '$lib/styles/utilities.css';
  import '$lib/styles/tokens.css';
  import '$lib/styles/global.css';
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
</style>
