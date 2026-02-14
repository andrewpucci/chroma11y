/**
 * Color Utilities Unit Tests
 * Tests our custom color generation logic
 */
import { describe, it, expect } from 'vitest';
import {
  getContrast,
  getPrintableContrast,
  getPaletteName,
  nearestFriendlyColorName,
  generatePalettes,
  colorToCssHex,
  colorToCssRgb,
  colorToCssOklch,
  colorToCssHsl,
  colorToCssP3,
  colorToCssRec2020,
  colorToCssDisplay,
  getContrastAPCA,
  getContrastForAlgorithm,
  getPrintableContrastForAlgorithm,
  type ColorGenParams
} from './colorUtils';

import Color from 'colorjs.io';

/** Helper: convert Color[] to hex[] for string-based assertions */
const toHexArray = (colors: InstanceType<typeof Color>[]) => colors.map((c) => colorToCssHex(c));

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

  describe('nearestFriendlyColorName', () => {
    it('returns a human-friendly name for a hex color', () => {
      const name = nearestFriendlyColorName('#ff0000');
      expect(name).toBeTruthy();
      expect(typeof name).toBe('string');
      expect(name).not.toBe('Unnamed');
    });

    it('returns consistent results for the same input', () => {
      const name1 = nearestFriendlyColorName('#3366cc');
      const name2 = nearestFriendlyColorName('#3366cc');
      expect(name1).toBe(name2);
    });

    it('returns different names for very different colors', () => {
      const red = nearestFriendlyColorName('#ff0000');
      const blue = nearestFriendlyColorName('#0000ff');
      expect(red).not.toBe(blue);
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

    it('does not always return white when palette includes white and reference is dark', () => {
      const palette = ['#051534', '#102c60', '#ff0000', '#9dc1ff', '#ffffff'];
      const name = getPaletteName(palette, '#071531');
      expect(name).toBeTruthy();
      expect(name).not.toBe('Unnamed');
      const normalized = name.trim().toLowerCase();
      expect(normalized).not.toBe('white');
      expect(normalized).not.toBe('black');
    });

    it('honors numeric index reference when provided', () => {
      const palette = ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff'];
      const nameAt0 = getPaletteName(palette, 0);
      const nameAt2 = getPaletteName(palette, 2);
      expect(nameAt0).toBeTruthy();
      expect(nameAt2).toBeTruthy();
      expect(nameAt2).not.toBe('Unnamed');
      expect(nameAt0).not.toBe('Unnamed');
      expect(nameAt2).not.toBe(nameAt0);
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

  describe('generatePalettes', () => {
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
      const result = generatePalettes(baseParams, true);
      expect(result.neutrals).toHaveLength(11);
    });

    it('generates correct number of palettes', () => {
      const params = { ...baseParams, numPalettes: 5 };
      const result = generatePalettes(params, true);
      expect(result.palettes).toHaveLength(5);
    });

    it('generates valid hex colors', () => {
      const result = generatePalettes(baseParams, true);
      const hexRegex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

      toHexArray(result.neutrals).forEach((color) => {
        expect(color).toMatch(hexRegex);
      });

      result.palettes.forEach((palette) => {
        toHexArray(palette).forEach((color) => {
          expect(color).toMatch(hexRegex);
        });
      });
    });

    it('light theme neutrals start with white and end with black', () => {
      const result = generatePalettes(baseParams, true);
      const hex = toHexArray(result.neutrals);
      expect(['#ffffff', '#fff']).toContain(hex[0].toLowerCase());
      expect(['#000000', '#000']).toContain(hex[10].toLowerCase());
    });

    it('light theme palette step 0 should be white (regression)', () => {
      const result = generatePalettes(baseParams, true);
      for (const palette of result.palettes) {
        const hex = colorToCssHex(palette[0]).toLowerCase();
        expect(['#ffffff', '#fff']).toContain(hex);
      }
    });

    it('light theme palette step 10 should be black (regression)', () => {
      const result = generatePalettes(baseParams, true);
      for (const palette of result.palettes) {
        const hex = colorToCssHex(palette[10]).toLowerCase();
        expect(['#000000', '#000']).toContain(hex);
      }
    });

    it('dark theme neutrals are reversed from light theme', () => {
      const lightParams = { ...baseParams, currentTheme: 'light' as const };
      const darkParams = { ...baseParams, currentTheme: 'dark' as const };
      const lightResult = generatePalettes(lightParams, true);
      const darkResult = generatePalettes(darkParams, true);
      // Dark theme first color should be darker than light theme first color
      expect(colorToCssHex(darkResult.neutrals[0])).not.toBe(
        colorToCssHex(lightResult.neutrals[0])
      );
    });

    it('applies lightness nudgers to neutrals', () => {
      const withoutNudger = generatePalettes(baseParams, true);

      const nudgers = new Array(11).fill(0);
      nudgers[5] = 0.1;
      const params = { ...baseParams, lightnessNudgers: nudgers };
      const withNudger = generatePalettes(params, true);

      const hexWithout = toHexArray(withoutNudger.neutrals);
      const hexWith = toHexArray(withNudger.neutrals);

      // Middle neutral should be different
      expect(hexWith[5]).not.toBe(hexWithout[5]);
      // Other neutrals should be the same
      expect(hexWith[0]).toBe(hexWithout[0]);
      expect(hexWith[10]).toBe(hexWithout[10]);
    });

    it('applies hue nudgers to palettes', () => {
      const params1 = { ...baseParams, numPalettes: 1, hueNudgers: [0] };
      const result1 = generatePalettes(params1, true);

      const params2 = { ...baseParams, numPalettes: 1, hueNudgers: [60] };
      const result2 = generatePalettes(params2, true);

      // Palette colors should be different with different hue nudger
      expect(colorToCssHex(result2.palettes[0][5])).not.toBe(colorToCssHex(result1.palettes[0][5]));
    });

    it('warmth affects neutral color temperature', () => {
      const coolParams = { ...baseParams, warmth: -20 };
      const warmParams = { ...baseParams, warmth: 20 };

      const coolResult = generatePalettes(coolParams, true);
      const warmResult = generatePalettes(warmParams, true);

      // Mid-tone neutrals should differ with different warmth
      expect(colorToCssHex(coolResult.neutrals[5])).not.toBe(colorToCssHex(warmResult.neutrals[5]));
    });

    it('produces deterministic output for same inputs', () => {
      const result1 = generatePalettes(baseParams, true);
      const result2 = generatePalettes(baseParams, true);

      expect(toHexArray(result1.neutrals)).toEqual(toHexArray(result2.neutrals));
      expect(result1.palettes.map(toHexArray)).toEqual(result2.palettes.map(toHexArray));
    });

    it('returns Color objects for neutrals and palettes', () => {
      const result = generatePalettes(baseParams, true);

      for (const color of result.neutrals) {
        expect(color).toBeInstanceOf(Color);
        const l = color.oklch.l ?? 0;
        expect(l).toBeGreaterThanOrEqual(-1e-10);
        expect(l).toBeLessThanOrEqual(1 + 1e-10);
      }

      for (const palette of result.palettes) {
        expect(palette).toHaveLength(result.neutrals.length);
      }
    });
  });

  describe('colorToCssHex', () => {
    it('converts a blue OKLCH color to hex', () => {
      const blue = new Color('oklch', [0.55, 0.19, 264]);
      const hex = colorToCssHex(blue);
      expect(hex).toMatch(/^#[0-9a-f]{3,6}$/i);
    });

    it('converts pure white', () => {
      const white = new Color('oklch', [1, 0, 0]);
      expect(colorToCssHex(white)).toMatch(/^#f{3,6}$/i);
    });

    it('converts pure black', () => {
      const black = new Color('oklch', [0, 0, 0]);
      expect(colorToCssHex(black)).toMatch(/^#0{3,6}$/i);
    });
  });

  describe('colorToCssRgb', () => {
    it('returns rgb() format string with percentages (CSS Color 4)', () => {
      const color = new Color('oklch', [0.55, 0.19, 264]);
      const result = colorToCssRgb(color);
      expect(result).toMatch(/^rgb\([\d.]+% [\d.]+% [\d.]+%\)$/);
    });

    it('converts white to rgb(100% 100% 100%)', () => {
      const white = new Color('oklch', [1, 0, 0]);
      expect(colorToCssRgb(white)).toBe('rgb(100% 100% 100%)');
    });

    it('converts black to rgb(0% 0% 0%)', () => {
      const black = new Color('oklch', [0, 0, 0]);
      expect(colorToCssRgb(black)).toBe('rgb(0% 0% 0%)');
    });
  });

  describe('colorToCssOklch', () => {
    it('returns oklch() format string with percentage lightness (CSS Color 4)', () => {
      const color = new Color('oklch', [0.55, 0.19, 264]);
      expect(colorToCssOklch(color)).toBe('oklch(55% 0.19 264)');
    });

    it('handles zero chroma and hue', () => {
      const gray = new Color('oklch', [0.5, 0, 0]);
      expect(colorToCssOklch(gray)).toBe('oklch(50% 0 0)');
    });

    it('handles NaN hue (achromatic) without producing NaN in output', () => {
      const gray = new Color('oklch', [0.5, 0, NaN]);
      const result = colorToCssOklch(gray);
      expect(result).not.toContain('NaN');
      expect(result).not.toContain('none');
      expect(result).toMatch(/^oklch\(/);
    });
  });

  describe('colorToCssHsl', () => {
    it('returns hsl() format string (CSS Color 4 space-separated)', () => {
      const color = new Color('oklch', [0.55, 0.19, 264]);
      const result = colorToCssHsl(color);
      expect(result).toMatch(/^hsl\([\d.]+ [\d.]+% [\d.]+%\)$/);
    });

    it('converts white with 100% lightness', () => {
      const white = new Color('oklch', [1, 0, 0]);
      const result = colorToCssHsl(white);
      expect(result).toMatch(/hsl\([\d.]+ [\d.]+% 100%\)/);
    });

    it('converts black with 0% lightness and no "none" keyword', () => {
      const black = new Color('oklch', [0, 0, 0]);
      const result = colorToCssHsl(black);
      expect(result).toMatch(/hsl\([\d.]+ [\d.]+% 0%\)/);
      expect(result).not.toContain('none');
    });
  });

  describe('colorToCssP3', () => {
    it('converts a color to Display P3 format', () => {
      const blue = new Color('oklch', [0.5, 0.2, 264]);
      const result = colorToCssP3(blue);
      expect(result).toMatch(/^color\(display-p3 [\d.-]+ [\d.-]+ [\d.-]+\)$/);
    });

    it('returns fallback for invalid input', () => {
      const result = colorToCssP3(null as unknown as InstanceType<typeof Color>);
      expect(result).toBe('color(display-p3 0 0 0)');
    });
  });

  describe('colorToCssRec2020', () => {
    it('converts a color to Rec. 2020 format', () => {
      const blue = new Color('oklch', [0.5, 0.2, 264]);
      const result = colorToCssRec2020(blue);
      expect(result).toMatch(/^color\(rec2020 [\d.-]+ [\d.-]+ [\d.-]+\)$/);
    });

    it('returns fallback for invalid input', () => {
      const result = colorToCssRec2020(null as unknown as InstanceType<typeof Color>);
      expect(result).toBe('color(rec2020 0 0 0)');
    });
  });

  describe('colorToCssDisplay', () => {
    it('dispatches hex + srgb to colorToCssHex', () => {
      const blue = new Color('oklch', [0.5, 0.2, 264]);
      const result = colorToCssDisplay(blue, 'hex', 'srgb');
      expect(result).toMatch(/^#[0-9a-f]{6}$/);
    });

    it('dispatches rgb + srgb to colorToCssRgb', () => {
      const blue = new Color('oklch', [0.5, 0.2, 264]);
      const result = colorToCssDisplay(blue, 'rgb', 'srgb');
      expect(result).toMatch(/^rgb\(/);
    });

    it('dispatches oklch to colorToCssOklch regardless of gamut', () => {
      const blue = new Color('oklch', [0.5, 0.2, 264]);
      const result = colorToCssDisplay(blue, 'oklch', 'p3');
      expect(result).toMatch(/^oklch\(/);
    });

    it('dispatches hex + p3 to colorToCssP3', () => {
      const blue = new Color('oklch', [0.5, 0.2, 264]);
      const result = colorToCssDisplay(blue, 'hex', 'p3');
      expect(result).toMatch(/^color\(display-p3/);
    });

    it('dispatches hsl + rec2020 to colorToCssRec2020', () => {
      const blue = new Color('oklch', [0.5, 0.2, 264]);
      const result = colorToCssDisplay(blue, 'hsl', 'rec2020');
      expect(result).toMatch(/^color\(rec2020/);
    });
  });

  describe('getContrastAPCA', () => {
    it('returns high Lc for black text on white background', () => {
      const lc = getContrastAPCA('#000000', '#ffffff');
      expect(lc).toBeGreaterThan(100);
    });

    it('returns 0 for same colors', () => {
      const lc = getContrastAPCA('#808080', '#808080');
      expect(lc).toBeCloseTo(0, 0);
    });

    it('returns absolute value (always positive)', () => {
      const lc = getContrastAPCA('#ffffff', '#000000');
      expect(lc).toBeGreaterThan(0);
    });

    it('returns 0 for invalid input', () => {
      const lc = getContrastAPCA('invalid', '#ffffff');
      expect(lc).toBe(0);
    });
  });

  describe('getContrastForAlgorithm', () => {
    it('dispatches to WCAG21 when algorithm is WCAG21', () => {
      const result = getContrastForAlgorithm('#ffffff', '#000000', 'WCAG21');
      expect(result).toBeCloseTo(21, 0);
    });

    it('dispatches to APCA when algorithm is APCA', () => {
      const result = getContrastForAlgorithm('#000000', '#ffffff', 'APCA');
      expect(result).toBeGreaterThan(100);
    });
  });

  describe('getPrintableContrastForAlgorithm', () => {
    it('returns rounded value for WCAG21', () => {
      const result = getPrintableContrastForAlgorithm('#ffffff', '#000000', 'WCAG21');
      expect(result).toBe(21);
    });

    it('returns rounded Lc value for APCA', () => {
      const result = getPrintableContrastForAlgorithm('#000000', '#ffffff', 'APCA');
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });
  });
});
