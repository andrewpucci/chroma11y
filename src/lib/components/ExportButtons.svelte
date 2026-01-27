<script lang="ts">
	import { downloadDesignTokens, downloadCSS, downloadSCSS } from '$lib/exportUtils';

	export let neutrals: string[] = [];
	export let palettes: string[][] = [];

	function exportJSON() {
		downloadDesignTokens(neutrals, palettes);
	}
	
	function exportCSS() {
		downloadCSS(neutrals, palettes);
	}
	
	function exportSCSS() {
		downloadSCSS(neutrals, palettes);
	}
</script>

<div class="export-buttons">
	<button 
		class="export-button"
		on:click={exportJSON}
		disabled={neutrals.length === 0 && palettes.length === 0}
	>
		📄 Export JSON
	</button>
	<button 
		class="export-button"
		on:click={exportCSS}
		disabled={neutrals.length === 0 && palettes.length === 0}
	>
		🎨 Export CSS
	</button>
	<button 
		class="export-button"
		on:click={exportSCSS}
		disabled={neutrals.length === 0 && palettes.length === 0}
	>
		📝 Export SCSS
	</button>
</div>

<style>
	.export-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.export-button {
		padding: 0.75rem 1rem;
		background: var(--bg-tertiary);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.export-button:hover:not(:disabled) {
		background: var(--accent);
		color: white;
		transform: translateY(-1px);
	}

	.export-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
