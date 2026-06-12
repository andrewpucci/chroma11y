import { describe, expect, it } from 'vitest';

import { diffColorStates } from './comparisonDiff';

function createConfig(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    numColors: 11,
    numPalettes: 11,
    baseColor: '#5EF784',
    warmth: -7,
    warmthHue: 142,
    x1: 0.16,
    y1: 0,
    x2: 0.28,
    y2: 0.38,
    chromaMultiplier: 1,
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
    currentTheme: 'light',
    customNeutralName: undefined,
    customPaletteNames: undefined,
    constraints: [],
    displayColorSpace: 'hex',
    gamutSpace: 'srgb',
    swatchLabels: 'both',
    showSwatchGamutWarnings: true,
    showSwatchContrastIndicators: true,
    swatchContrastIndicators: {
      wcagThreeToOne: true,
      wcagAA: true,
      wcagAAA: true,
      apcaLarge: true,
      apcaFluent: true,
      apcaBody: true
    },
    contrastAlgorithm: 'WCAG',
    cvdMode: 'none',
    ...overrides
  };
}

describe('comparisonDiff', () => {
  it('ignores shared inspection changes and resolved auto-theme drift when authored configuration matches', () => {
    const reference = createConfig({
      displayColorSpace: 'oklch',
      gamutSpace: 'p3',
      swatchLabels: 'none',
      contrastAlgorithm: 'APCA',
      cvdMode: 'deuteranopia',
      currentTheme: 'light',
      resolvedTheme: 'light'
    });
    const current = createConfig({
      displayColorSpace: 'hex',
      gamutSpace: 'srgb',
      swatchLabels: 'both',
      contrastAlgorithm: 'WCAG',
      cvdMode: 'none',
      currentTheme: 'dark'
    });

    const diff = diffColorStates(current, reference);

    expect(diff.hasChanges).toBe(false);
    expect(diff.generationChanges).toHaveLength(0);
    expect(diff.contrastChanges).toHaveLength(0);
    expect(diff.constraintChanges).toHaveLength(0);
    expect(diff.namingChanges).toHaveLength(0);
  });

  it('reports theme preference as a generation change and includes resolved theme detail for auto', () => {
    const reference = createConfig({
      themePreference: 'auto',
      resolvedTheme: 'light'
    });
    const current = createConfig({
      themePreference: 'light',
      currentTheme: 'light'
    });

    const diff = diffColorStates(current, reference);

    expect(diff.generationChanges).toContainEqual(
      expect.objectContaining({
        field: 'themePreference',
        label: 'Theme',
        kind: 'changed',
        referenceValue: 'Auto (resolved Light)',
        currentValue: 'Light'
      })
    );
  });

  it('ignores preset-backed generation and auto-reference drift when both sides are still authored auto', () => {
    const reference = createConfig({
      themePreference: 'auto',
      resolvedTheme: 'light',
      currentTheme: 'light',
      x1: 0.16,
      y1: 0,
      x2: 0.28,
      y2: 0.38,
      chromaMultiplier: 1,
      lowReference: { kind: 'neutral', stepIndex: 0 },
      highReference: { kind: 'neutral', stepIndex: 10 }
    });
    const current = createConfig({
      themePreference: 'auto',
      currentTheme: 'dark',
      x1: 0.45,
      y1: 0.08,
      x2: 0.77,
      y2: 0.96,
      chromaMultiplier: 0.83,
      lowReference: { kind: 'neutral', stepIndex: 2 },
      highReference: { kind: 'neutral', stepIndex: 10 }
    });

    const diff = diffColorStates(current, reference);

    expect(diff.hasChanges).toBe(false);
    expect(diff.generationChanges).toHaveLength(0);
    expect(diff.contrastChanges).toHaveLength(0);
  });

  it('uses contrast references in auto mode and ignores resolved contrast-color drift alone', () => {
    const reference = createConfig({
      contrastMode: 'auto',
      lowReference: { kind: 'neutral', stepIndex: 0 },
      highReference: { kind: 'neutral', stepIndex: 10 },
      contrast: { low: '#ffffff', high: '#000000' }
    });
    const current = createConfig({
      contrastMode: 'auto',
      lowReference: { kind: 'neutral', stepIndex: 0 },
      highReference: { kind: 'neutral', stepIndex: 10 },
      contrast: { low: '#fefefe', high: '#010101' }
    });

    const driftOnly = diffColorStates(current, reference);
    expect(driftOnly.contrastChanges).toHaveLength(0);

    const withReferenceChange = diffColorStates(
      createConfig({
        lowReference: { kind: 'neutral', stepIndex: 2 }
      }),
      reference
    );

    expect(withReferenceChange.contrastChanges).toContainEqual(
      expect.objectContaining({
        field: 'lowReference',
        label: 'Low contrast reference',
        kind: 'changed',
        referenceValue: 'Neutral, step 0',
        currentValue: 'Neutral, step 20'
      })
    );
  });

  it('does not render NaN for a contrast reference missing a valid stepIndex', () => {
    const reference = createConfig({
      // Malformed/legacy reference object: passes the typeof-object guard but has no stepIndex
      lowReference: { kind: 'neutral' }
    });
    const current = createConfig({
      lowReference: { kind: 'neutral', stepIndex: 2 }
    });

    const diff = diffColorStates(current, reference);
    const lowEntry = diff.contrastChanges.find((entry) => entry.field === 'lowReference');

    expect(lowEntry?.referenceValue).not.toContain('NaN');
    expect(lowEntry?.referenceValue).toBe('Neutral');
  });

  it('reports manual contrast colors individually', () => {
    const reference = createConfig({
      contrastMode: 'manual',
      contrast: { low: '#111111', high: '#eeeeee' }
    });
    const current = createConfig({
      contrastMode: 'manual',
      contrast: { low: '#222222', high: '#eeeeee' }
    });

    const diff = diffColorStates(current, reference);

    expect(diff.contrastChanges).toContainEqual(
      expect.objectContaining({
        field: 'contrast.low',
        label: 'Low contrast color',
        kind: 'changed',
        referenceValue: '#111111',
        currentValue: '#222222'
      })
    );
  });

  it('explains constraint edits, additions, and removals as individual entries', () => {
    const reference = createConfig({
      constraints: [
        {
          id: 'target-1',
          type: 'target-color',
          enabled: true,
          targetHex: '#5EF784',
          metric: 'ok'
        },
        {
          id: 'rule-1',
          type: 'contrast-rule',
          enabled: true,
          scope: 'neutral',
          stepIndex: 4,
          reference: 'low',
          algorithm: 'WCAG',
          level: 'wcagAA'
        }
      ]
    });
    const current = createConfig({
      constraints: [
        {
          id: 'target-1',
          type: 'target-color',
          enabled: false,
          targetHex: '#00FF00',
          metric: 'ok'
        },
        {
          id: 'rule-2',
          type: 'contrast-rule',
          enabled: true,
          scope: 'all-palettes',
          stepIndex: 4,
          reference: 'low',
          algorithm: 'APCA',
          level: 'apcaBody'
        }
      ]
    });

    const diff = diffColorStates(current, reference);

    expect(diff.constraintChanges).toContainEqual(
      expect.objectContaining({
        kind: 'changed',
        referenceValue: '#5EF784 · ΔEOK',
        currentValue: '#00FF00 · ΔEOK · Disabled'
      })
    );
    expect(diff.constraintChanges).toContainEqual(
      expect.objectContaining({
        kind: 'removed',
        referenceValue: 'Neutral · Step 40 · Low ref · WCAG AA'
      })
    );
    expect(diff.constraintChanges).toContainEqual(
      expect.objectContaining({
        kind: 'added',
        currentValue: 'All palettes · Step 40 · Low ref · APCA Body'
      })
    );
  });

  it('keeps constraint diff entries in authored order when removals and additions are mixed', () => {
    const reference = createConfig({
      constraints: [
        {
          id: 'rule-1',
          type: 'contrast-rule',
          enabled: true,
          scope: 'neutral',
          stepIndex: 1,
          reference: 'low',
          algorithm: 'WCAG',
          level: 'wcagAA'
        },
        {
          id: 'rule-2',
          type: 'contrast-rule',
          enabled: true,
          scope: 'neutral',
          stepIndex: 2,
          reference: 'low',
          algorithm: 'WCAG',
          level: 'wcagAA'
        },
        {
          id: 'rule-3',
          type: 'contrast-rule',
          enabled: true,
          scope: 'neutral',
          stepIndex: 3,
          reference: 'low',
          algorithm: 'WCAG',
          level: 'wcagAA'
        }
      ]
    });
    const current = createConfig({
      constraints: [
        {
          id: 'rule-1',
          type: 'contrast-rule',
          enabled: false,
          scope: 'neutral',
          stepIndex: 1,
          reference: 'low',
          algorithm: 'WCAG',
          level: 'wcagAA'
        },
        {
          id: 'rule-3',
          type: 'contrast-rule',
          enabled: false,
          scope: 'neutral',
          stepIndex: 3,
          reference: 'low',
          algorithm: 'WCAG',
          level: 'wcagAA'
        },
        {
          id: 'rule-4',
          type: 'contrast-rule',
          enabled: true,
          scope: 'all-palettes',
          stepIndex: 4,
          reference: 'high',
          algorithm: 'APCA',
          level: 'apcaBody'
        }
      ]
    });

    const diff = diffColorStates(current, reference);

    expect(diff.constraintChanges.map((entry) => `${entry.field}:${entry.kind}`)).toEqual([
      'constraint.rule-1:changed',
      'constraint.rule-2:removed',
      'constraint.rule-3:changed',
      'constraint.rule-4:added'
    ]);
  });

  it('suppresses incidental default additions from structural growth', () => {
    const reference = createConfig({
      numColors: 11,
      lightnessNudgers: Array.from({ length: 11 }, () => 0)
    });
    const current = createConfig({
      numColors: 13,
      lightnessNudgers: Array.from({ length: 13 }, () => 0)
    });

    const diff = diffColorStates(current, reference);

    expect(diff.generationChanges).toContainEqual(
      expect.objectContaining({
        field: 'numColors',
        label: 'Number of steps'
      })
    );
    expect(
      diff.generationChanges.some((entry) => entry.label.includes('lightness adjustment'))
    ).toBe(false);
  });

  it('keeps removed non-default authored overrides visible when structure shrinks', () => {
    const reference = createConfig({
      numPalettes: 3,
      hueNudgers: [0, 0, 15],
      customPaletteNames: ['', '', 'Accent']
    });
    const current = createConfig({
      numPalettes: 2,
      hueNudgers: [0, 0],
      customPaletteNames: ['', '']
    });

    const diff = diffColorStates(current, reference);

    expect(diff.generationChanges).toContainEqual(
      expect.objectContaining({
        field: 'numPalettes',
        label: 'Number of palettes'
      })
    );
    expect(diff.generationChanges).toContainEqual(
      expect.objectContaining({
        kind: 'removed',
        label: 'Palette 3 hue adjustment',
        referenceValue: '15'
      })
    );
    expect(diff.namingChanges).toContainEqual(
      expect.objectContaining({
        kind: 'removed',
        label: 'Palette 3 name',
        referenceValue: 'Accent'
      })
    );
  });
});
