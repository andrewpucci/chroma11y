import type { PaletteGenParams } from '$lib/types/colorTypes';

export function copyToClipboard(text: string): void {
	navigator.clipboard.writeText(text).then(() => {
		console.log(`Copied ${text} to clipboard`);
	});
}

export function updateLightnessNudgerValue(
	index: number, 
	value: number, 
	values: number[], 
	updateFn: (index: number, value: number) => void
): void {
	values[index] = value;
	updateFn(index, value);
}

export function generateColorPalette(params: PaletteGenParams): string[] {
	// This would contain the actual color generation logic
	// For now, return a placeholder array
	return Array.from({ length: params.numColors }, () => `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`);
}

export function generateNeutralPalette(params: PaletteGenParams, _nudgers: number[]): string[] {
	// This would contain neutral palette generation logic
	return Array.from({ length: params.numColors }, () => `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`);
}

export function generateMultiplePalettes(params: PaletteGenParams): string[][] {
	// This would contain multiple palette generation logic
	return Array.from({ length: params.numPalettes }, () => 
		generateColorPalette(params)
	);
}
