import Color from 'colorjs.io';
import { describe, expect, it } from 'vitest';

import { buildComparisonAnnotation } from '$lib/comparisonViewAnnotations';

const baseConfig = {
  contrast: { low: '#ffffff', high: '#000000' },
  contrastAlgorithm: 'WCAG' as const,
  gamutSpace: 'srgb' as const
};

describe('comparisonViewAnnotations', () => {
  it('marks unchanged swatches as quiet', () => {
    expect(
      buildComparisonAnnotation({
        currentHex: '#ffffff',
        referenceHex: '#ffffff',
        metric: 'ok',
        threshold: 0.02,
        currentStatusConfig: baseConfig,
        referenceStatusConfig: baseConfig
      })
    ).toEqual({
      chip: null,
      quiet: true
    });
  });

  it('emits a Changed chip for color-only differences above threshold', () => {
    expect(
      buildComparisonAnnotation({
        currentHex: '#9aa6b2',
        referenceHex: '#c9d1d9',
        metric: 'ok',
        threshold: 0.02,
        currentStatusConfig: baseConfig,
        referenceStatusConfig: baseConfig
      }).chip?.label
    ).toBe('Changed');
  });

  it('detects wide-gamut color-only differences even when sRGB hex matches', () => {
    expect(
      buildComparisonAnnotation({
        currentHex: '#970000',
        referenceHex: '#970000',
        currentColor: new Color('oklch', [0.425, 0.175, 30]),
        referenceColor: new Color('oklch', [0.41, 0.19, 30]),
        metric: 'ok',
        threshold: 0.02,
        currentStatusConfig: { ...baseConfig, gamutSpace: 'p3' },
        referenceStatusConfig: { ...baseConfig, gamutSpace: 'p3' }
      }).chip?.label
    ).toBe('Changed');
  });

  it('does not emit a color-only chip when wide-gamut differences collapse in sRGB', () => {
    expect(
      buildComparisonAnnotation({
        currentHex: '#970000',
        referenceHex: '#970000',
        currentColor: new Color('oklch', [0.425, 0.175, 30]),
        referenceColor: new Color('oklch', [0.41, 0.19, 30]),
        metric: 'ok',
        threshold: 0.02,
        currentStatusConfig: baseConfig,
        referenceStatusConfig: baseConfig
      })
    ).toEqual({
      chip: null,
      quiet: true
    });
  });

  it('prioritizes contrast regressions over color-only differences', () => {
    expect(
      buildComparisonAnnotation({
        currentHex: '#777777',
        referenceHex: '#707070',
        metric: 'ok',
        threshold: 0.02,
        currentStatusConfig: baseConfig,
        referenceStatusConfig: baseConfig
      }).chip?.label
    ).toBe('Contrast down');
  });

  it('detects gamut warning additions from aligned Color objects', () => {
    const wideGamutColor = new Color('oklch', [0.95, 0.032, 230]);

    expect(
      buildComparisonAnnotation({
        currentHex: '#b9d7e5',
        referenceHex: '#b9d7e5',
        currentColor: wideGamutColor,
        referenceColor: wideGamutColor,
        metric: 'ok',
        threshold: 0.02,
        currentStatusConfig: { ...baseConfig, gamutSpace: 'p3' },
        referenceStatusConfig: { ...baseConfig, gamutSpace: 'srgb' }
      }).chip?.label
    ).toBe('Gamut added');
  });
});
