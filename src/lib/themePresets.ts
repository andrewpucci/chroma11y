import type { ContrastReference } from '$lib/types';

function createNeutralContrastReference(stepIndex: number): ContrastReference {
  return {
    kind: 'neutral',
    stepIndex
  };
}

export const themePresets = {
  light: {
    numColors: 11,
    numPalettes: 11,
    baseColor: '#5EF784',
    warmth: -7,
    x1: 0.16,
    y1: 0.0,
    x2: 0.28,
    y2: 0.38,
    chromaMultiplier: 1,
    contrastMode: 'auto' as const,
    lowStep: 0,
    highStep: 10,
    lowReference: createNeutralContrastReference(0),
    highReference: createNeutralContrastReference(10),
    contrast: {
      low: '#ffffff',
      high: '#000000'
    }
  },
  dark: {
    numColors: 11,
    numPalettes: 11,
    baseColor: '#5EF784',
    warmth: -7,
    x1: 0.45,
    y1: 0.08,
    x2: 0.77,
    y2: 0.96,
    chromaMultiplier: 0.83,
    contrastMode: 'auto' as const,
    lowStep: 2,
    highStep: 10,
    lowReference: createNeutralContrastReference(2),
    highReference: createNeutralContrastReference(10),
    contrast: {
      low: '#071531',
      high: '#ffffff'
    }
  }
} as const;

export type ThemePresetName = keyof typeof themePresets;
