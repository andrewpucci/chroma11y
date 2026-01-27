<script lang="ts">
	import { copyToClipboard, getContrast, getPrintableContrast } from '$lib/colorUtils';
	import { contrastColors, currentTheme } from '$lib/stores';
	
	export let color: string;
	export let label: string = '';
	export let showContrast: boolean = true;
	
	let contrastColorsLocal: { low: string; high: string } = { low: '#ffffff', high: '#000000' };
	let currentThemeLocal: 'light' | 'dark' = 'light';
	
	$: contrastColors.subscribe(value => contrastColorsLocal = value);
	$: currentTheme.subscribe(value => currentThemeLocal = value);
	
	$: lowContrastRatio = getContrast(color, contrastColorsLocal.low);
	$: highContrastRatio = getContrast(color, contrastColorsLocal.high);
	$: lowContrastDisplay = getPrintableContrast(color, contrastColorsLocal.low);
	$: highContrastDisplay = getPrintableContrast(color, contrastColorsLocal.high);
	
	$: textColor = calculateTextColor(color, contrastColorsLocal, currentThemeLocal);
	
	function calculateTextColor(
		bgColor: string, 
		contrast: { low: string; high: string },
		theme: 'light' | 'dark'
	): string {
		const minContrastRatio = 4.5;
		const lowRatio = getContrast(bgColor, contrast.low);
		const highRatio = getContrast(bgColor, contrast.high);
		
		// Prefer low contrast color if it meets threshold, otherwise use high
		if (lowRatio >= minContrastRatio) {
			return contrast.low;
		} else if (highRatio >= minContrastRatio) {
			return contrast.high;
		} else {
			// Neither meets minimum, use the one with better contrast
			return highRatio > lowRatio ? contrast.high : contrast.low;
		}
	}
</script>

<button 
	class="color-swatch"
	style="background-color: {color}; color: {textColor};"
	on:click={() => copyToClipboard(color)}
	title="Click to copy {color}"
>
	<span class="hex">{color}</span>
	{#if label}
		<span class="label">{label}</span>
	{/if}
	{#if showContrast}
		<div class="contrast-info">
			<span class="low" title="Contrast with low reference">{lowContrastDisplay}</span>
			<span class="high" title="Contrast with high reference">{highContrastDisplay}</span>
		</div>
	{/if}
</button>

<style>
	.color-swatch {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4px;
		border: 1px solid var(--border);
		border-radius: 3px;
		cursor: pointer;
		transition: all 0.2s ease;
		min-width: 60px;
		min-height: 50px;
		font-family: monospace;
		text-align: center;
		gap: 2px;
	}

	.color-swatch:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.hex {
		font-size: 0.65rem;
		font-weight: 500;
	}

	.label {
		font-size: 0.5rem;
		opacity: 0.8;
	}

	.contrast-info {
		display: flex;
		gap: 4px;
		font-size: 0.5rem;
		opacity: 0.9;
	}

	.contrast-info .low {
		color: inherit;
		opacity: 0.7;
	}

	.contrast-info .high {
		color: inherit;
		opacity: 0.7;
	}
</style>
