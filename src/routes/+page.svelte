<script lang="ts">
	import { onMount } from 'svelte';
	import { 
		neutrals, 
		palettes, 
		numColors, 
		numPalettes, 
		baseColor, 
		warmth, 
		chromaMultiplier, 
		x1, 
		y1, 
		x2, 
		y2,
		lightnessNudgers,
		hueNudgers,
		currentTheme,
		updateColorState,
		updateContrastFromNeutrals
	} from '$lib/stores';
	
	import { generatePalettesLegacy } from '$lib/colorUtils';
	import type { ColorGenParams } from '$lib/colorUtils';
	
	import ColorControls from '$lib/components/ColorControls.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import ExportButtons from '$lib/components/ExportButtons.svelte';
	import NeutralPalette from '$lib/components/NeutralPalette.svelte';
	import PaletteGrid from '$lib/components/PaletteGrid.svelte';
	import ContrastControls from '$lib/components/ContrastControls.svelte';
	
	// Local variables for reactive updates
	let neutralsLocal: string[] = [];
	let palettesLocal: string[][] = [];
	let lightnessNudgerValues: number[] = [];
	let hueNudgerValues: number[] = [];
	let baseColorLocal: string = '#1862E6';
	let warmthLocal: number = -7;
	let chromaMultiplierLocal: number = 1.14;
	let numColorsLocal: number = 11;
	let numPalettesLocal: number = 11;
	let x1Local: number = 0.16;
	let y1Local: number = 0.0;
	let x2Local: number = 0.28;
	let y2Local: number = 0.38;
	let currentThemeLocal: 'light' | 'dark' = 'light';
	
	onMount(() => {
		const unsubscribeNeutrals = neutrals.subscribe(value => neutralsLocal = value);
		const unsubscribePalettes = palettes.subscribe(value => palettesLocal = value);
		const unsubscribeLightnessNudgers = lightnessNudgers.subscribe(value => lightnessNudgerValues = value);
		const unsubscribeHueNudgers = hueNudgers.subscribe(value => hueNudgerValues = value);
		const unsubscribeBaseColor = baseColor.subscribe(value => baseColorLocal = value);
		const unsubscribeWarmth = warmth.subscribe(value => warmthLocal = value);
		const unsubscribeChromaMultiplier = chromaMultiplier.subscribe(value => chromaMultiplierLocal = value);
		const unsubscribeNumColors = numColors.subscribe(value => numColorsLocal = value);
		const unsubscribeNumPalettes = numPalettes.subscribe(value => numPalettesLocal = value);
		const unsubscribeX1 = x1.subscribe(value => x1Local = value);
		const unsubscribeY1 = y1.subscribe(value => y1Local = value);
		const unsubscribeX2 = x2.subscribe(value => x2Local = value);
		const unsubscribeY2 = y2.subscribe(value => y2Local = value);
		const unsubscribeCurrentTheme = currentTheme.subscribe(value => currentThemeLocal = value);

		return () => {
			unsubscribeNeutrals();
			unsubscribePalettes();
			unsubscribeLightnessNudgers();
			unsubscribeHueNudgers();
			unsubscribeBaseColor();
			unsubscribeWarmth();
			unsubscribeChromaMultiplier();
			unsubscribeNumColors();
			unsubscribeNumPalettes();
			unsubscribeX1();
			unsubscribeY1();
			unsubscribeX2();
			unsubscribeY2();
			unsubscribeCurrentTheme();
		};
	});

	$: if (baseColorLocal && warmthLocal !== undefined && chromaMultiplierLocal && numColorsLocal && numPalettesLocal && x1Local !== undefined && y1Local !== undefined && x2Local !== undefined && y2Local !== undefined && currentThemeLocal) {
		generateColors();
	}
	
	$: if (lightnessNudgerValues || hueNudgerValues) {
		generateColors();
	}
	
	function generateColors() {
		const params: ColorGenParams = {
			numColors: numColorsLocal,
			numPalettes: numPalettesLocal,
			baseColor: baseColorLocal,
			warmth: warmthLocal,
			x1: x1Local,
			y1: y1Local,
			x2: x2Local,
			y2: y2Local,
			chromaMultiplier: chromaMultiplierLocal,
			currentTheme: currentThemeLocal,
			lightnessNudgers: lightnessNudgerValues,
			hueNudgers: hueNudgerValues
		};

		try {
			// Use the legacy algorithm which handles everything in one call
			const result = generatePalettesLegacy(params, true);
			
			// Update stores
			updateColorState({
				neutrals: result.neutrals,
				palettes: result.palettes
			});
			
			// Update contrast colors from neutrals if in auto mode
			updateContrastFromNeutrals();
		} catch (error) {
			console.error('Error generating colors:', error);
			updateColorState({
				neutrals: [],
				palettes: []
			});
		}
	}
</script>

<div class="container">
	<!-- Left Column: Controls -->
	<div class="controls-column">
		<header class="header">
			<h1>Svelte Color Generator</h1>
			<p>Advanced color generation using OKLCH color space</p>
		</header>

		<section class="controls">
			<ThemeToggle />
			<ExportButtons neutrals={neutralsLocal} palettes={palettesLocal} />
			<ContrastControls />
		</section>

		<ColorControls 
			bind:baseColor={baseColorLocal}
			bind:warmth={warmthLocal}
			bind:chromaMultiplier={chromaMultiplierLocal}
			bind:numColors={numColorsLocal}
			bind:numPalettes={numPalettesLocal}
			bind:x1={x1Local}
			bind:y1={y1Local}
			bind:x2={x2Local}
			bind:y2={y2Local}
		/>
	</div>

	<!-- Right Column: Palettes -->
	<div class="palettes-column">
		<NeutralPalette bind:neutrals={neutralsLocal} bind:lightnessNudgerValues={lightnessNudgerValues} />
		<PaletteGrid palettes={palettesLocal} bind:hueNudgerValues={hueNudgerValues} />
	</div>
</div>

<style>
	.container {
		height: 100vh;
		padding: 0;
		box-sizing: border-box;
		overflow: hidden;
		display: flex;
		flex-direction: row;
	}

	.controls-column {
		width: 420px;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: var(--column-padding);
		background: var(--bg-primary);
		border-right: 1px solid var(--border);
		overflow-y: auto;
	}

	.palettes-column {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-height: 0;
		overflow-y: auto;
		padding: var(--column-padding);
		container-type: inline-size;
	}

	/* Responsive chip sizing */
	.palettes-column {
		--chip-size: 15px;
		--show-names: 0;
	}

	/* When space is tight, hide names and make chips smaller */
	@container (max-height: 800px) {
		.palettes-column {
			--chip-size: 12px;
			--show-names: 0;
		}
	}

	@container (max-height: 600px) {
		.palettes-column {
			--chip-size: 10px;
			--show-names: 0;
		}
	}

	.header {
		text-align: center;
		margin-bottom: 1rem;
	}

	.header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		background: linear-gradient(135deg, var(--accent), var(--accent-hover));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.header p {
		color: var(--text-secondary);
		font-size: 1rem;
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>