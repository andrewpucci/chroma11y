export interface PaletteGenParams {
	baseColor: string;
	warmth: number;
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	chromaMultiplier: number;
	numColors: number;
	numPalettes: number;
	contrastLow?: string;
	contrastHigh?: string;
	lightnessNudgers?: number[];
	hueNudgers?: number[];
}

export interface ColorState {
	neutrals: string[];
	palettes: string[][];
}

export interface ComponentProps {
	neutrals: string[];
	palettes: string[][];
	lightnessNudgerValues: number[];
	hueNudgerValues: number[];
	baseColor: string;
	warmth: number;
	chromaMultiplier: number;
	numColors: number;
	numPalettes: number;
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}
