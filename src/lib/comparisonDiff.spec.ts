import { describe, expect, it } from 'vitest';
import { diffColorStates } from './comparisonDiff';

/**
 * Test suite for Configuration Diff generation.
 *
 * Tests focus on:
 * - Detecting changes in generation settings
 * - Detecting changes in contrast settings
 * - Detecting changes in custom naming
 * - Excluding inspection-only settings from diff
 * - Comprehensive diff output suitable for presentation
 */

describe('comparisonDiff', () => {
  describe('diffColorStates', () => {
    it('identifies no changes when configurations are identical', () => {
      const config = {
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
        contrast: { low: '#ffffff', high: '#000000' }
      };

      const diff = diffColorStates(config, config);

      expect(diff.hasChanges).toBe(false);
      expect(diff.generationChanges).toHaveLength(0);
      expect(diff.contrastChanges).toHaveLength(0);
      expect(diff.namingChanges).toHaveLength(0);
    });

    it('detects generation setting changes', () => {
      const current = {
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
        contrast: { low: '#ffffff', high: '#000000' }
      };

      const reference = {
        ...current,
        numColors: 13,
        baseColor: '#00ff00'
      };

      const diff = diffColorStates(current, reference);

      expect(diff.hasChanges).toBe(true);
      expect(diff.generationChanges.length).toBeGreaterThan(0);
    });

    it('detects contrast mode changes', () => {
      const current = {
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
        contrast: { low: '#ffffff', high: '#000000' }
      };

      const reference = {
        ...current,
        contrastMode: 'manual' as const,
        contrast: { low: '#ff0000', high: '#00ff00' }
      };

      const diff = diffColorStates(current, reference);

      expect(diff.hasChanges).toBe(true);
      expect(diff.contrastChanges.length).toBeGreaterThan(0);
    });

    it('detects custom naming changes', () => {
      const current = {
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
        contrast: { low: '#ffffff', high: '#000000' },
        customNeutralName: 'Gray'
      };

      const reference = {
        ...current,
        customNeutralName: 'Neutrals'
      };

      const diff = diffColorStates(current, reference);

      expect(diff.hasChanges).toBe(true);
      expect(diff.namingChanges.length).toBeGreaterThan(0);
    });

    it('excludes inspection settings from diff', () => {
      const current = {
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
        contrast: { low: '#ffffff', high: '#000000' },
        displayColorSpace: 'hex' as const,
        cvdMode: 'none' as const
      };

      const reference = {
        ...current,
        displayColorSpace: 'oklch' as const,
        cvdMode: 'protanopia' as const
      };

      const diff = diffColorStates(current, reference);

      // Display color space and CVD mode are inspection settings, should not appear in diff
      expect(diff.hasChanges).toBe(false);
      expect(diff.generationChanges).toHaveLength(0);
      expect(diff.contrastChanges).toHaveLength(0);
    });

    it('returns structured diff suitable for presentation', () => {
      const current = {
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
        contrast: { low: '#ffffff', high: '#000000' }
      };

      const reference = {
        ...current,
        numColors: 9,
        warmth: 5
      };

      const diff = diffColorStates(current, reference);

      expect(diff).toHaveProperty('hasChanges');
      expect(diff).toHaveProperty('generationChanges');
      expect(diff).toHaveProperty('contrastChanges');
      expect(diff).toHaveProperty('namingChanges');
      expect(diff).toHaveProperty('timestamp');
    });
  });

  describe('diff categorization', () => {
    it('correctly categorizes step count changes', () => {
      const current = {
        numColors: 13,
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
        contrast: { low: '#ffffff', high: '#000000' }
      };

      const reference = {
        ...current,
        numColors: 11
      };

      const diff = diffColorStates(current, reference);

      expect(diff.hasChanges).toBe(true);
      const generationChange = diff.generationChanges.find(
        (c) => c.label.includes('color') || c.label.includes('step')
      );
      expect(generationChange).toBeDefined();
    });

    it('correctly categorizes palette count changes', () => {
      const current = {
        numColors: 11,
        numPalettes: 13,
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
        contrast: { low: '#ffffff', high: '#000000' }
      };

      const reference = {
        ...current,
        numPalettes: 11
      };

      const diff = diffColorStates(current, reference);

      expect(diff.hasChanges).toBe(true);
      const generationChange = diff.generationChanges.find((c) => c.label.includes('palette'));
      expect(generationChange).toBeDefined();
    });
  });

  describe('contrast field completeness', () => {
    const fullConfig = {
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
      lowReference: { kind: 'neutral', stepIndex: 0 },
      highReference: { kind: 'neutral', stepIndex: 10 },
      contrast: { low: '#ffffff', high: '#000000' },
      contrastAlgorithm: 'WCAG' as const,
      solveAdjacentStopLows: true
    };

    it('does not report contrast fields as changed when both sides are identical', () => {
      expect.assertions(2);
      const diff = diffColorStates(fullConfig, fullConfig);
      expect(diff.hasChanges).toBe(false);
      expect(diff.contrastChanges).toHaveLength(0);
    });

    it('reports contrastMode as changed when it differs', () => {
      expect.assertions(2);
      const diff = diffColorStates({ ...fullConfig, contrastMode: 'manual' as const }, fullConfig);
      expect(diff.hasChanges).toBe(true);
      expect(diff.contrastChanges.some((c) => c.field === 'contrastMode')).toBe(true);
    });

    it('reports lowReference as changed when it differs', () => {
      expect.assertions(2);
      const diff = diffColorStates(
        { ...fullConfig, lowReference: { kind: 'neutral', stepIndex: 2 } },
        fullConfig
      );
      expect(diff.hasChanges).toBe(true);
      expect(diff.contrastChanges.some((c) => c.field === 'lowReference')).toBe(true);
    });

    it('reports solveAdjacentStopLows as changed when it differs', () => {
      expect.assertions(2);
      const diff = diffColorStates({ ...fullConfig, solveAdjacentStopLows: false }, fullConfig);
      expect(diff.hasChanges).toBe(true);
      expect(diff.contrastChanges.some((c) => c.field === 'solveAdjacentStopLows')).toBe(true);
    });
  });
});
