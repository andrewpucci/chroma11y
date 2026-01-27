<script lang="ts">
	import { copyToClipboard } from '$lib/colorUtils';

	export let palettes: string[][] = [];
</script>

<section class="color-display">
	<h2>Generated Color Palettes</h2>
	{#if palettes.length > 0}
		{#each palettes as palette, paletteIndex}
			<h3>Palette {paletteIndex + 1}</h3>
			<div class="color-grid compact">
				{#each palette as color, index}
					<button 
						class="color-item compact"
						on:click={() => copyToClipboard(color)}
						title="Click to copy {color}"
					>
						<div class="color-swatch" style="background-color: {color};"></div>
						<div class="color-info">
							<span class="color-hex">{color}</span>
							<span class="color-index">P{paletteIndex + 1}-{index}</span>
						</div>
					</button>
				{/each}
			</div>
		{/each}
	{:else}
		<p class="no-colors">No color palettes generated yet. Adjust the controls above.</p>
	{/if}
</section>

<style>
	.color-display {
		padding: 0.1rem;
		background: var(--bg-secondary);
		border-radius: 2px;
		border: 1px solid var(--border);
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.color-display h2 {
		margin: 0 0 0.1rem 0;
		color: var(--text-primary);
		font-size: 0.7rem;
	}

	.color-display h3 {
		margin: 0.1rem 0 0.05rem 0;
		color: var(--text-primary);
		font-size: 0.6rem;
	}

	.color-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: 0.5rem;
	}

	.color-grid.compact {
		display: flex;
		flex-wrap: wrap;
		gap: 3px;
		justify-content: flex-start;
		align-items: flex-start;
		flex: 1;
		overflow-y: auto;
	}

	.color-item {
		padding: 0.5rem;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--bg-primary);
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: center;
	}

	.color-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.color-item.compact {
		padding: 4px;
		border-radius: 3px;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: center;
		min-width: 60px;
		width: fit-content;
		height: 60px;
		overflow: hidden;
	}

	.color-swatch {
		flex: 1;
		width: 100%;
		height: 16px;
		border-radius: 2px;
		border: 1px solid var(--border);
		margin-bottom: 2px;
	}

	.color-info {
		display: flex;
		flex-direction: column;
		gap: 1px;
		font-size: 8px;
		width: 100%;
	}

	.color-hex {
		font-size: 0.875rem;
		font-family: monospace;
		color: var(--text-secondary);
	}

	.color-index {
		font-size: 7px;
		color: var(--text-secondary);
	}

	.no-colors {
		text-align: center;
		color: var(--text-secondary);
		font-style: italic;
		padding: 2rem;
	}
</style>
