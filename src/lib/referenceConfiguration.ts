import type { ColorState } from './stores';
import type { ContrastReference } from './types';

export interface ReferenceConfiguration {
  pinnedAt: number;

  baseColor: string;
  warmth: number;
  warmthHue?: number;
  chromaMultiplier: number;
  numColors: number;
  numPalettes: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;

  lightnessNudgers: number[];
  hueNudgers: number[];
  stepSaturationNudgers: number[];
  paletteSaturationNudgers: number[];
  paletteChromaNudgers: number[];

  contrastMode: 'auto' | 'manual';
  lowStep: number;
  highStep: number;
  lowReference: ContrastReference;
  highReference: ContrastReference;
  contrast: { low: string; high: string };
  solveAdjacentStopLows: boolean;

  displayColorSpace: ColorState['displayColorSpace'];
  gamutSpace: ColorState['gamutSpace'];
  swatchLabels: ColorState['swatchLabels'];
  showSwatchGamutWarnings: boolean;
  showSwatchContrastIndicators: boolean;
  swatchContrastIndicators: ColorState['swatchContrastIndicators'];
  contrastAlgorithm: ColorState['contrastAlgorithm'];

  customNeutralName?: string;
  customPaletteNames?: string[];
}

export function createReferenceConfiguration(colorState: ColorState): ReferenceConfiguration {
  return {
    pinnedAt: Date.now(),
    baseColor: colorState.baseColor,
    warmth: colorState.warmth,
    warmthHue: colorState.warmthHue,
    chromaMultiplier: colorState.chromaMultiplier,
    numColors: colorState.numColors,
    numPalettes: colorState.numPalettes,
    x1: colorState.x1,
    y1: colorState.y1,
    x2: colorState.x2,
    y2: colorState.y2,
    lightnessNudgers: [...colorState.lightnessNudgers],
    hueNudgers: [...colorState.hueNudgers],
    stepSaturationNudgers: [...colorState.stepSaturationNudgers],
    paletteSaturationNudgers: [...colorState.paletteSaturationNudgers],
    paletteChromaNudgers: [...colorState.paletteChromaNudgers],
    contrastMode: colorState.contrastMode,
    lowStep: colorState.lowStep,
    highStep: colorState.highStep,
    lowReference: structuredClone(colorState.lowReference),
    highReference: structuredClone(colorState.highReference),
    contrast: { low: colorState.contrast.low, high: colorState.contrast.high },
    solveAdjacentStopLows: colorState.solveAdjacentStopLows,
    displayColorSpace: colorState.displayColorSpace,
    gamutSpace: colorState.gamutSpace,
    swatchLabels: colorState.swatchLabels,
    showSwatchGamutWarnings: colorState.showSwatchGamutWarnings,
    showSwatchContrastIndicators: colorState.showSwatchContrastIndicators,
    swatchContrastIndicators: structuredClone(colorState.swatchContrastIndicators),
    contrastAlgorithm: colorState.contrastAlgorithm,
    customNeutralName: colorState.customNeutralName,
    customPaletteNames: colorState.customPaletteNames
      ? [...colorState.customPaletteNames]
      : undefined
  };
}
