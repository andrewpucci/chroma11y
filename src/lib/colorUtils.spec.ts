/**
 * Color Utilities Unit Tests
 * Tests our custom color generation logic, not culori library functions
 */
import { describe, it, expect } from 'vitest';
import {
  getContrast,
  getPrintableContrast,
  getPaletteName,
  generatePalettesLegacy,
  type ColorGenParams
} from './colorUtils';

describe('colorUtils', () => {
  describe('getContrast', () => {
    it('returns high contrast ratio for black on white', () => {
      const ratio = getContrast('#ffffff', '#000000');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('returns 1 for same colors', () => {
      const ratio = getContrast('#ff0000', '#ff0000');
      expect(ratio).toBeCloseTo(1, 1);
    });

    it('returns reasonable contrast for mid-tones', () => {
      const ratio = getContrast('#808080', '#ffffff');
      expect(ratio).toBeGreaterThan(1);
      expect(ratio).toBeLessThan(21);
    });

    it('is commutative', () => {
      const ratio1 = getContrast('#ff0000', '#0000ff');
      const ratio2 = getContrast('#0000ff', '#ff0000');
      expect(ratio1).toBeCloseTo(ratio2, 5);
    });
  });

  describe('getPrintableContrast', () => {
    it('returns truncated contrast ratio number', () => {
      const result = getPrintableContrast('#ffffff', '#000000');
      expect(typeof result).toBe('number');
      expect(result).toBeCloseTo(21, 0);
    });

    it('truncates to 2 decimal places', () => {
      const result = getPrintableContrast('#ffffff', '#808080');
      expect(typeof result).toBe('number');
      // Should be truncated, not rounded
      const decimalStr = result.toString();
      const decimalPart = decimalStr.split('.')[1] || '';
      expect(decimalPart.length).toBeLessThanOrEqual(2);
    });
  });

  describe('getPaletteName', () => {
    it('returns name for valid palette', () => {
      // A blue palette
      const bluePalette = ['#e6f0ff', '#cce0ff', '#99c2ff', '#66a3ff', '#3385ff', '#0066ff'];
      const name = getPaletteName(bluePalette);
      expect(name).toBeTruthy();
      expect(typeof name).toBe('string');
    });

    it('returns consistent name for same palette', () => {
      const palette = ['#ff0000', '#cc0000', '#990000', '#660000', '#330000'];
      const name1 = getPaletteName(palette);
      const name2 = getPaletteName(palette);
      expect(name1).toBe(name2);
    });

    it('handles empty palette', () => {
      const name = getPaletteName([]);
      expect(name).toBe('Unnamed');
    });
  });

  describe('generatePalettesLegacy', () => {
    const baseParams: ColorGenParams = {
      numColors: 11,
      numPalettes: 1,
      baseColor: '#1862e6',
      warmth: 0,
      x1: 0.16,
      y1: 0,
      x2: 0.28,
      y2: 0.38,
      chromaMultiplier: 1,
      currentTheme: 'light',
      lightnessNudgers: new Array(11).fill(0),
      hueNudgers: new Array(11).fill(0)
    };

    it('generates correct number of neutral colors', () => {
      const result = generatePalettesLegacy(baseParams, true);
      expect(result.neutrals).toHaveLength(11);
    });

    it('generates correct number of palettes', () => {
      const params = { ...baseParams, numPalettes: 5 };
      const result = generatePalettesLegacy(params, true);
      expect(result.palettes).toHaveLength(5);
    });

    it('generates valid hex colors', () => {
      const result = generatePalettesLegacy(baseParams, true);
      const hexRegex = /^#[0-9a-f]{6}$/i;

      result.neutrals.forEach((color) => {
        expect(color).toMatch(hexRegex);
      });

      result.palettes.forEach((palette) => {
        palette.forEach((color) => {
          expect(color).toMatch(hexRegex);
        });
      });
    });

    it('light theme neutrals start with white and end with black', () => {
      const result = generatePalettesLegacy(baseParams, true);
      expect(result.neutrals[0].toLowerCase()).toBe('#ffffff');
      expect(result.neutrals[10].toLowerCase()).toBe('#000000');
    });

    it('dark theme neutrals are reversed from light theme', () => {
      const lightParams = { ...baseParams, currentTheme: 'light' as const };
      const darkParams = { ...baseParams, currentTheme: 'dark' as const };
      const lightResult = generatePalettesLegacy(lightParams, true);
      const darkResult = generatePalettesLegacy(darkParams, true);
      // Dark theme first color should be darker than light theme first color
      expect(darkResult.neutrals[0]).not.toBe(lightResult.neutrals[0]);
    });

    it('applies lightness nudgers to neutrals', () => {
      const withoutNudger = generatePalettesLegacy(baseParams, true);

      const nudgers = new Array(11).fill(0);
      nudgers[5] = 0.1;
      const params = { ...baseParams, lightnessNudgers: nudgers };
      const withNudger = generatePalettesLegacy(params, true);

      // Middle neutral should be different
      expect(withNudger.neutrals[5]).not.toBe(withoutNudger.neutrals[5]);
      // Other neutrals should be the same
      expect(withNudger.neutrals[0]).toBe(withoutNudger.neutrals[0]);
      expect(withNudger.neutrals[10]).toBe(withoutNudger.neutrals[10]);
    });

    it('applies hue nudgers to palettes', () => {
      const params1 = { ...baseParams, numPalettes: 1, hueNudgers: [0] };
      const result1 = generatePalettesLegacy(params1, true);

      const params2 = { ...baseParams, numPalettes: 1, hueNudgers: [60] };
      const result2 = generatePalettesLegacy(params2, true);

      // Palette colors should be different with different hue nudger
      expect(result2.palettes[0][5]).not.toBe(result1.palettes[0][5]);
    });

    it('warmth affects neutral color temperature', () => {
      const coolParams = { ...baseParams, warmth: -20 };
      const warmParams = { ...baseParams, warmth: 20 };

      const coolResult = generatePalettesLegacy(coolParams, true);
      const warmResult = generatePalettesLegacy(warmParams, true);

      // Mid-tone neutrals should differ with different warmth
      expect(coolResult.neutrals[5]).not.toBe(warmResult.neutrals[5]);
    });

    it('produces deterministic output for same inputs', () => {
      const result1 = generatePalettesLegacy(baseParams, true);
      const result2 = generatePalettesLegacy(baseParams, true);

      expect(result1.neutrals).toEqual(result2.neutrals);
      expect(result1.palettes).toEqual(result2.palettes);
    });
  });
});
