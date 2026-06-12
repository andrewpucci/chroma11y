import { describe, expect, it } from 'vitest';

import {
  formatReferenceColors,
  generateReferenceColorObjects,
  type ReferenceRenderSettings
} from './referenceColorGeneration';
import type { ReferenceConfiguration } from './referenceConfiguration';

function generateColorsFromReference(
  reference: ReferenceConfiguration,
  settings: ReferenceRenderSettings
) {
  return formatReferenceColors(
    generateReferenceColorObjects(reference, settings.gamutSpace),
    settings
  );
}

function createReferenceConfiguration(
  overrides: Partial<ReferenceConfiguration> = {}
): ReferenceConfiguration {
  return {
    pinnedAt: Date.now(),
    baseColor: '#5EF784',
    warmth: -7,
    warmthHue: 142,
    chromaMultiplier: 1,
    numColors: 11,
    numPalettes: 11,
    x1: 0.16,
    y1: 0,
    x2: 0.28,
    y2: 0.38,
    lightnessNudgers: Array.from({ length: 11 }, () => 0),
    hueNudgers: Array.from({ length: 11 }, () => 0),
    stepSaturationNudgers: Array.from({ length: 11 }, () => 0),
    paletteSaturationNudgers: Array.from({ length: 11 }, () => 0),
    paletteChromaNudgers: Array.from({ length: 11 }, () => 1),
    contrastMode: 'auto',
    lowStep: 0,
    highStep: 10,
    lowReference: { kind: 'neutral', stepIndex: 0 },
    highReference: { kind: 'neutral', stepIndex: 10 },
    contrast: { low: '#ffffff', high: '#000000' },
    solveAdjacentStopLows: true,
    themePreference: 'auto',
    resolvedTheme: 'light',
    customNeutralName: undefined,
    customPaletteNames: undefined,
    constraints: [],
    ...overrides
  };
}

function createRenderSettings(
  overrides: Partial<ReferenceRenderSettings> = {}
): ReferenceRenderSettings {
  return {
    cvdMode: 'none',
    displayColorSpace: 'hex',
    gamutSpace: 'srgb',
    ...overrides
  };
}

describe('referenceColorGeneration', () => {
  it('uses the pinned resolved theme to generate the frozen baseline', () => {
    const lightReference = createReferenceConfiguration({ resolvedTheme: 'light' });
    const darkReference = createReferenceConfiguration({ resolvedTheme: 'dark' });

    const lightResult = generateColorsFromReference(lightReference, createRenderSettings());
    const darkResult = generateColorsFromReference(darkReference, createRenderSettings());

    expect(lightResult.neutralsHex[0]).not.toBe(darkResult.neutralsHex[0]);
    expect(lightResult.neutralsHex.at(-1)).not.toBe(darkResult.neutralsHex.at(-1));
  });

  it('applies shared display settings at read time instead of freezing them in the reference', () => {
    const reference = createReferenceConfiguration();

    const hexResult = generateColorsFromReference(
      reference,
      createRenderSettings({ displayColorSpace: 'hex', gamutSpace: 'srgb' })
    );
    const oklchResult = generateColorsFromReference(
      reference,
      createRenderSettings({ displayColorSpace: 'oklch', gamutSpace: 'p3' })
    );

    expect(hexResult.neutralsDisplay[0]).toMatch(/^#/);
    expect(oklchResult.neutralsDisplay[0]).toContain('oklch(');
  });
});
