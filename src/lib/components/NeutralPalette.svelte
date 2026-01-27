<script lang="ts">
	import { copyToClipboard, updateLightnessNudgerValue } from '$lib/colorUtils';
	import { updateLightnessNudger } from '$lib/stores';

	export let neutrals: string[] = [];
	export let lightnessNudgerValues: number[] = [];
</script>

<section class="color-display">
	<h2>Neutral Palette</h2>
	{#if neutrals.length > 0}
		<div class="color-grid compact">
			{#each neutrals as color, index}
				<button 
					class="color-item compact"
					on:click={() => copyToClipboard(color)}
					title="Click to copy {color}"
				>
					<div class="color-swatch" style="background-color: {color};"></div>
					<div class="color-info">
						<span class="color-hex">{color}</span>
						<span class="color-index">N{index}</span>
					</div>
				</button>
			{/each}
		</div>
		
		<h3>Lightness Nudgers</h3>
		<div class="nudger-grid-compact">
			{#each neutrals as color, index}
				<div class="nudger-item-aligned">
					<div class="nudger-color-aligned" style="background-color: {color};"></div>
					<input 
						type="number" 
						min="-0.5" 
						max="0.5" 
						step="0.01"
						bind:value={lightnessNudgerValues[index]}
						on:input={(e) => {
	if (e && e.target) {
		updateLightnessNudgerValue(index, parseFloat((e.target as HTMLInputElement).value), lightnessNudgerValues, updateLightnessNudger);
	}
}}
						class="nudger-input"
						title="Lightness adjustment for step {index}"
					/>
				</div>
			{/each}
		</div>
	{:else}
		<p class="no-colors">No neutral colors generated yet. Adjust the controls above.</p>
	{/if}
</section>

<style>
	.color-display {
		padding: 0.1rem;
		background: var(--bg-secondary);
		border-radius: 2px;
		border: 1px solid var(--border);
		flex: 0 0 auto;
		display: flex;
		flex-direction: column;
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
		flex: 0 0 auto;
		overflow-y: auto;
	}

	.color-item {
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
		background: var(--bg-primary);
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: center;
	}

	.color-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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

	.nudger-grid-compact {
		display: flex;
		flex-wrap: wrap;
		gap: 3px;
		padding: 6px;
		background: var(--bg-tertiary);
		border-radius: 2px;
		border: 1px solid var(--border);
	}

	.nudger-item-aligned {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
		padding: 4px;
		min-width: 60px;
		width: fit-content;
		height: 60px;
	}

	.nudger-color-aligned {
		flex: 1;
		width: 100%;
		height: 16px;
		border-radius: 2px;
		border: 1px solid var(--border);
		margin-bottom: 2px;
	}

	.nudger-input {
		flex: 1;
		padding: 3px;
		border: 1px solid var(--border);
		border-radius: 2px;
		background: var(--bg-primary);
		color: var(--text-primary);
		font-size: 11px;
		font-family: monospace;
		text-align: center;
		min-width: 0;
	}
</style>
