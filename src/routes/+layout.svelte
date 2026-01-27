<script lang="ts">
	import { onMount } from 'svelte';
	import { currentTheme } from '$lib/stores';
	import { browser } from '$app/environment';
	
	let theme: string = 'light';
	
	currentTheme.subscribe(value => {
		theme = value;
		if (browser) {
			document.documentElement.setAttribute('data-theme', theme);
		}
	});
	
	onMount(() => {
		if (browser) {
			// Apply theme to document only in browser
			document.documentElement.setAttribute('data-theme', theme);
		}
	});
	
	$: if (browser && theme) {
		document.documentElement.setAttribute('data-theme', theme);
	}
</script>

<svelte:head>
	<title>Svelte Color Generator</title>
	<meta name="description" content="Advanced color generator using OKLCH color space" />
</svelte:head>

<div class="app">
	<main>
		<slot />
	</main>
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

	:global(body) {
		margin: 0;
		padding: 0;
		background: var(--bg-primary, #ffffff);
		color: var(--text-primary, #1a1a1a);
		transition: background-color 0.3s ease, color 0.3s ease;
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
	:global([data-theme="light"]) {
		--bg-primary: #ffffff;
		--bg-secondary: #f8f9fa;
		--bg-tertiary: #e9ecef;
		--text-primary: #1a1a1a;
		--text-secondary: #6c757d;
		--border: #dee2e6;
		--accent: #1862E6;
	}

	/* Dark theme */
	:global([data-theme="dark"]) {
		--bg-primary: #0d1117;
		--bg-secondary: #161b22;
		--bg-tertiary: #21262d;
		--text-primary: #f0f6fc;
		--text-secondary: #8b949e;
		--border: #30363d;
		--accent: #58a6ff;
	}
</style>