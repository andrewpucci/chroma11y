<script lang="ts">
	import { toggleTheme, currentTheme } from '$lib/stores';

	let currentThemeValue = '';
	currentTheme.subscribe(value => currentThemeValue = value);
</script>

<button 
	class="theme-toggle"
	on:click={toggleTheme}
>
	{currentThemeValue === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
</button>

<style>
	.theme-toggle {
		padding: 0.75rem 1rem;
		background: var(--accent);
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		margin-bottom: 1rem;
		width: 100%;
		transition: all 0.2s ease;
	}

	.theme-toggle:hover {
		background: var(--accent-hover);
		transform: translateY(-1px);
	}
</style>
