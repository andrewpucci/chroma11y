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
  colorToCssOklchSwatch,
  colorToCssHsl,
  colorToCssP3,
  colorToCssRec2020,
  colorToCssRender,
  colorToCssSwatchRender,
  clampOklchDisplaySignificantDigits,
  getContrastAPCA,
  getPrintableContrastAPCA,
  getContrastForAlgorithm,
  getPrintableContrastForAlgorithm,
  maxChromaInGamut,
  clearNearestColorCache,
  isValidHexColor,
  generateBaseNeutrals,
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
      hueNudgers: new Array(11).fill(0),
      gamutSpace: 'srgb'
    };

    it('generates correct number of neutral colors', () => {
      const result = generatePalettes(baseParams);
      expect(result.neutrals).toHaveLength(11);
    });

    it('generates correct number of palettes', () => {
      const params = { ...baseParams, numPalettes: 5 };
      const result = generatePalettes(params);
      expect(result.palettes).toHaveLength(5);
    });

    it('generates valid hex colors', () => {
      const result = generatePalettes(baseParams);
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
      const result = generatePalettes(baseParams);
      const hex = toHexArray(result.neutrals);
      expect(['#ffffff', '#fff']).toContain(hex[0].toLowerCase());
      expect(['#000000', '#000']).toContain(hex[10].toLowerCase());
    });

    it('light theme palette step 0 should be white (regression)', () => {
      const result = generatePalettes(baseParams);
      for (const palette of result.palettes) {
        const hex = colorToCssHex(palette[0]).toLowerCase();
        expect(['#ffffff', '#fff']).toContain(hex);
      }
    });

    it('light theme palette step 10 should be black (regression)', () => {
      const result = generatePalettes(baseParams);
      for (const palette of result.palettes) {
        const hex = colorToCssHex(palette[10]).toLowerCase();
        expect(['#000000', '#000']).toContain(hex);
      }
    });

    it('dark theme neutrals are reversed from light theme', () => {
      const lightParams = { ...baseParams, currentTheme: 'light' as const };
      const darkParams = { ...baseParams, currentTheme: 'dark' as const };
      const lightResult = generatePalettes(lightParams);
      const darkResult = generatePalettes(darkParams);
      // Dark theme first color should be darker than light theme first color
      expect(colorToCssHex(darkResult.neutrals[0])).not.toBe(
        colorToCssHex(lightResult.neutrals[0])
      );
    });

    it('applies lightness nudgers to neutrals', () => {
      const withoutNudger = generatePalettes(baseParams);

      const nudgers = new Array(11).fill(0);
      nudgers[5] = 0.1;
      const params = { ...baseParams, lightnessNudgers: nudgers };
      const withNudger = generatePalettes(params);

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
      const result1 = generatePalettes(params1);

      const params2 = { ...baseParams, numPalettes: 1, hueNudgers: [60] };
      const result2 = generatePalettes(params2);

      // Palette colors should be different with different hue nudger
      expect(colorToCssHex(result2.palettes[0][5])).not.toBe(colorToCssHex(result1.palettes[0][5]));
    });

    it('warmth affects neutral color temperature', () => {
      const coolParams = { ...baseParams, warmth: -20 };
      const warmParams = { ...baseParams, warmth: 20 };

      const coolResult = generatePalettes(coolParams);
      const warmResult = generatePalettes(warmParams);

      // Mid-tone neutrals should differ with different warmth
      expect(colorToCssHex(coolResult.neutrals[5])).not.toBe(colorToCssHex(warmResult.neutrals[5]));
    });

    it('produces deterministic output for same inputs', () => {
      const result1 = generatePalettes(baseParams);
      const result2 = generatePalettes(baseParams);

      expect(toHexArray(result1.neutrals)).toEqual(toHexArray(result2.neutrals));
      expect(result1.palettes.map(toHexArray)).toEqual(result2.palettes.map(toHexArray));
    });

    it('returns Color objects for neutrals and palettes', () => {
      const result = generatePalettes(baseParams);

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

    it('preserves higher precision for non-integer values', () => {
      const color = new Color('oklch', [0.94772436, 0.048057, 208.654542]);
      const result = colorToCssOklch(color);
      const match = result.match(/^oklch\(([-\d.]+)% ([-\d.]+) ([-\d.]+)\)$/);
      expect(match).toBeTruthy();
      const [, lStr, cStr, hStr] = match ?? [];
      expect((lStr.split('.')[1] ?? '').length).toBeGreaterThanOrEqual(4);
      expect((cStr.split('.')[1] ?? '').length).toBeGreaterThanOrEqual(4);
      expect((hStr.split('.')[1] ?? '').length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('colorToCssOklchSwatch', () => {
    it('uses readable default significant digits for swatch display', () => {
      const color = new Color('oklch', [0.94772436, 0.048057, 208.654542]);
      const result = colorToCssOklchSwatch(color);
      const match = result.match(/^oklch\(([-\d.]+)% ([-\d.]+) ([-\d.]+)\)$/);
      expect(match).toBeTruthy();
      const [, lStr, cStr, hStr] = match ?? [];
      const countSignificantDigits = (value: string): number => {
        const normalized = value.replace('-', '').replace('.', '').replace(/^0+/, '');
        return normalized.length;
      };
      expect(countSignificantDigits(lStr)).toBeLessThanOrEqual(4);
      expect(countSignificantDigits(cStr)).toBeLessThanOrEqual(4);
      expect(countSignificantDigits(hStr)).toBeLessThanOrEqual(4);
    });

    it('applies custom significant digits value', () => {
      const color = new Color('oklch', [0.94772436, 0.048057, 208.654542]);
      expect(colorToCssOklchSwatch(color, 'srgb', 2)).toBe('oklch(95% 0.048 210)');
    });

    it('keeps hue in canonical CSS range after significant-digit rounding', () => {
      const nearBoundary = new Color('oklch', [0.62, 0.08, 359]);
      const result = colorToCssOklchSwatch(nearBoundary, 'srgb', 1);
      const match = result.match(/^oklch\(([-\d.]+)% ([-\d.]+) ([-\d.]+)\)$/);
      expect(match).toBeTruthy();
      const hue = Number(match?.[3] ?? NaN);
      expect(Number.isFinite(hue)).toBe(true);
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThan(360);
    });

    it('returns fallback for invalid input', () => {
      const result = colorToCssOklchSwatch(null as unknown as InstanceType<typeof Color>);
      expect(result).toBe('oklch(0% 0 0)');
    });
  });

  describe('clampOklchDisplaySignificantDigits', () => {
    it('returns default digits for non-finite input', () => {
      expect(clampOklchDisplaySignificantDigits(NaN)).toBe(4);
      expect(clampOklchDisplaySignificantDigits(Infinity)).toBe(4);
      expect(clampOklchDisplaySignificantDigits(-Infinity)).toBe(4);
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

  describe('colorToCssRender', () => {
    it('dispatches hex + srgb to colorToCssHex', () => {
      const blue = new Color('oklch', [0.5, 0.2, 264]);
      const result = colorToCssRender(blue, 'hex', 'srgb');
      expect(result).toMatch(/^#[0-9a-f]{6}$/);
    });

    it('dispatches rgb + srgb to colorToCssRgb', () => {
      const blue = new Color('oklch', [0.5, 0.2, 264]);
      const result = colorToCssRender(blue, 'rgb', 'srgb');
      expect(result).toMatch(/^rgb\(/);
    });

    it('dispatches oklch to colorToCssOklch regardless of gamut', () => {
      const blue = new Color('oklch', [0.5, 0.2, 264]);
      const result = colorToCssRender(blue, 'oklch', 'p3');
      expect(result).toMatch(/^oklch\(/);
    });

    it('dispatches hex + p3 to colorToCssP3', () => {
      const blue = new Color('oklch', [0.5, 0.2, 264]);
      const result = colorToCssRender(blue, 'hex', 'p3');
      expect(result).toMatch(/^color\(display-p3/);
    });

    it('dispatches hsl + rec2020 to colorToCssRec2020', () => {
      const blue = new Color('oklch', [0.5, 0.2, 264]);
      const result = colorToCssRender(blue, 'hsl', 'rec2020');
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

  describe('getPrintableContrastAPCA', () => {
    it('returns rounded Lc value with 1 decimal place', () => {
      const lc = getPrintableContrastAPCA('#000000', '#ffffff');
      expect(lc).toBeGreaterThan(100);
      // Should be rounded to 1 decimal place
      const decimalStr = lc.toString();
      const decimalPart = decimalStr.split('.')[1] || '';
      expect(decimalPart.length).toBeLessThanOrEqual(1);
    });

    it('returns 0 for same colors', () => {
      const lc = getPrintableContrastAPCA('#808080', '#808080');
      expect(lc).toBe(0);
    });
  });

  describe('isValidHexColor', () => {
    it('returns true for valid 6-digit hex', () => {
      expect(isValidHexColor('#ff0000')).toBe(true);
      expect(isValidHexColor('#FF0000')).toBe(true);
      expect(isValidHexColor('#123abc')).toBe(true);
    });

    it('returns true for valid 3-digit hex', () => {
      expect(isValidHexColor('#fff')).toBe(true);
      expect(isValidHexColor('#FFF')).toBe(true);
      expect(isValidHexColor('#abc')).toBe(true);
    });

    it('returns false for invalid hex colors', () => {
      expect(isValidHexColor('ff0000')).toBe(false);
      expect(isValidHexColor('#gg0000')).toBe(false);
      expect(isValidHexColor('#ff00')).toBe(false);
      expect(isValidHexColor('#ff00000')).toBe(false);
      expect(isValidHexColor('red')).toBe(false);
      expect(isValidHexColor('')).toBe(false);
    });
  });

  describe('generateBaseNeutrals', () => {
    const baseParams: ColorGenParams = {
      numColors: 5,
      numPalettes: 1,
      baseColor: '#1862e6',
      warmth: 0,
      x1: 0.16,
      y1: 0,
      x2: 0.28,
      y2: 0.38,
      chromaMultiplier: 1,
      currentTheme: 'light'
    };

    it('generates correct number of neutral colors', () => {
      const neutrals = generateBaseNeutrals(baseParams);
      expect(neutrals).toHaveLength(5);
    });

    it('generates Color objects', () => {
      const neutrals = generateBaseNeutrals(baseParams);
      for (const color of neutrals) {
        expect(color).toBeInstanceOf(Color);
      }
    });

    it('applies warmth as chroma', () => {
      const warmParams = { ...baseParams, warmth: 20 };
      const neutrals = generateBaseNeutrals(warmParams);
      // Mid-tone neutrals should have some chroma when warmth is applied
      const midNeutral = neutrals[2];
      expect(midNeutral.oklch.c).toBeGreaterThan(0);
    });

    it('uses cool hue for negative warmth', () => {
      const coolParams = { ...baseParams, warmth: -20 };
      const neutrals = generateBaseNeutrals(coolParams);
      const midNeutral = neutrals[2];
      // Cool hue is 250
      expect(midNeutral.oklch.h).toBeCloseTo(250, 0);
    });

    it('uses warm hue for positive warmth', () => {
      const warmParams = { ...baseParams, warmth: 20 };
      const neutrals = generateBaseNeutrals(warmParams);
      const midNeutral = neutrals[2];
      // Warm hue is 60
      expect(midNeutral.oklch.h).toBeCloseTo(60, 0);
    });
  });

  describe('getContrastForAlgorithm', () => {
    it('dispatches to WCAG when algorithm is WCAG (bgColor, fgColor)', () => {
      const result = getContrastForAlgorithm('#ffffff', '#000000', 'WCAG');
      expect(result).toBeCloseTo(21, 0);
    });

    it('dispatches to APCA with swapped args (bgColor, fgColor → textColor, bgColor)', () => {
      const result = getContrastForAlgorithm('#000000', '#ffffff', 'APCA');
      expect(result).toBeGreaterThan(100);
    });
  });

  describe('maxChromaInGamut', () => {
    it('returns 0 for near-black lightness', () => {
      expect(maxChromaInGamut(0, 264)).toBe(0);
    });

    it('returns 0 for near-white lightness', () => {
      expect(maxChromaInGamut(1, 264)).toBe(0);
    });

    it('returns positive chroma for mid-lightness', () => {
      const c = maxChromaInGamut(0.5, 264);
      expect(c).toBeGreaterThan(0);
    });

    it('yellow hue has wider sRGB gamut boundary than blue at high lightness', () => {
      const yellowMax = maxChromaInGamut(0.85, 100, 'srgb');
      const blueMax = maxChromaInGamut(0.85, 264, 'srgb');
      expect(yellowMax).toBeGreaterThan(blueMax);
    });

    it('P3 gamut boundary is wider than sRGB for the same hue', () => {
      const srgbMax = maxChromaInGamut(0.6, 150, 'srgb');
      const p3Max = maxChromaInGamut(0.6, 150, 'p3');
      expect(p3Max).toBeGreaterThanOrEqual(srgbMax);
    });

    it('defaults to sRGB when no gamut is specified', () => {
      const defaultMax = maxChromaInGamut(0.5, 264);
      const srgbMax = maxChromaInGamut(0.5, 264, 'srgb');
      expect(defaultMax).toBeCloseTo(srgbMax, 6);
    });
  });

  describe('cross-hue chroma consistency', () => {
    it('keeps each step close to the base color gamut fraction', () => {
      const params: ColorGenParams = {
        numColors: 11,
        numPalettes: 4,
        baseColor: '#1862e6',
        warmth: 0,
        x1: 0.16,
        y1: 0,
        x2: 0.28,
        y2: 0.38,
        chromaMultiplier: 1,
        currentTheme: 'light',
        lightnessNudgers: new Array(11).fill(0),
        hueNudgers: new Array(4).fill(0),
        gamutSpace: 'srgb'
      };

      const result = generatePalettes(params);
      const base = new Color(params.baseColor).to('oklch');
      const baseL = base.oklch.l ?? 0;
      const baseH = base.oklch.h ?? 0;
      const baseC = base.oklch.c ?? 0;
      const referenceMax = maxChromaInGamut(baseL, baseH, 'srgb');
      const targetFraction = referenceMax > 1e-6 ? baseC / referenceMax : 0;
      let assertionsMade = 0;

      for (let step = 1; step < params.numColors - 1; step++) {
        const fractions = result.palettes.map((palette) => {
          const color = palette[step];
          const l = color.oklch.l ?? 0;
          const h = color.oklch.h ?? 0;
          const c = color.oklch.c ?? 0;
          const maxC = maxChromaInGamut(l, h, 'srgb');
          return maxC > 1e-6 ? c / maxC : 0;
        });

        const nonZero = fractions.filter((f) => f > 0.01);
        if (nonZero.length < 2) continue;

        const avg = nonZero.reduce((a, b) => a + b, 0) / nonZero.length;
        expect(avg).toBeGreaterThan(targetFraction - 0.05);
        expect(avg).toBeLessThan(targetFraction + 0.05);
        assertionsMade += 2;
      }

      expect(assertionsMade).toBeGreaterThan(0);
    });

    it('palettes use a consistent fraction of their gamut boundary across hues', () => {
      const params: ColorGenParams = {
        numColors: 11,
        numPalettes: 4,
        baseColor: '#1862e6',
        warmth: 0,
        x1: 0.16,
        y1: 0,
        x2: 0.28,
        y2: 0.38,
        chromaMultiplier: 1,
        currentTheme: 'light',
        lightnessNudgers: new Array(11).fill(0),
        hueNudgers: new Array(4).fill(0),
        gamutSpace: 'srgb'
      };

      const result = generatePalettes(params);
      let assertionsMade = 0;

      // For each step (excluding endpoints which are black/white),
      // compute each palette's chroma as a fraction of its hue's gamut boundary
      for (let step = 1; step < params.numColors - 1; step++) {
        const fractions = result.palettes.map((palette) => {
          const color = palette[step];
          const l = color.oklch.l ?? 0;
          const h = color.oklch.h ?? 0;
          const c = color.oklch.c ?? 0;
          const maxC = maxChromaInGamut(l, h, 'srgb');
          return maxC > 1e-6 ? c / maxC : 0;
        });

        const nonZero = fractions.filter((f) => f > 0.01);
        if (nonZero.length < 2) continue; // skip steps with insufficient data

        const avg = nonZero.reduce((a, b) => a + b, 0) / nonZero.length;

        // Each palette's gamut fraction should be within 5% of the mean
        for (const f of nonZero) {
          expect(f).toBeGreaterThan(avg - 0.05);
          expect(f).toBeLessThan(avg + 0.05);
          assertionsMade += 2;
        }
      }

      expect(assertionsMade).toBeGreaterThan(0);
    });
  });

  describe('getPrintableContrastForAlgorithm', () => {
    it('returns rounded value for WCAG (bgColor, fgColor)', () => {
      const result = getPrintableContrastForAlgorithm('#ffffff', '#000000', 'WCAG');
      expect(result).toBe(21);
    });

    it('returns rounded Lc value for APCA (bgColor, fgColor)', () => {
      const result = getPrintableContrastForAlgorithm('#000000', '#ffffff', 'APCA');
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('colorToCssRender additional branches', () => {
    it('dispatches rgb + p3 to colorToCssP3', () => {
      const blue = new Color('oklch', [0.5, 0.2, 264]);
      const result = colorToCssRender(blue, 'rgb', 'p3');
      expect(result).toMatch(/^color\(display-p3/);
    });

    it('dispatches rgb + rec2020 to colorToCssRec2020', () => {
      const blue = new Color('oklch', [0.5, 0.2, 264]);
      const result = colorToCssRender(blue, 'rgb', 'rec2020');
      expect(result).toMatch(/^color\(rec2020/);
    });

    it('dispatches hsl + p3 to colorToCssP3', () => {
      const blue = new Color('oklch', [0.5, 0.2, 264]);
      const result = colorToCssRender(blue, 'hsl', 'p3');
      expect(result).toMatch(/^color\(display-p3/);
    });

    it('dispatches hsl + srgb to colorToCssHsl', () => {
      const blue = new Color('oklch', [0.5, 0.2, 264]);
      const result = colorToCssRender(blue, 'hsl', 'srgb');
      expect(result).toMatch(/^hsl\(/);
    });
  });

  describe('colorToCssSwatchRender', () => {
    it('uses compact OKLCH formatting for swatches', () => {
      const color = new Color('oklch', [0.94772436, 0.048057, 208.654542]);
      const result = colorToCssSwatchRender(color, 'oklch', 'srgb', 2);
      expect(result).toBe('oklch(95% 0.048 210)');
    });

    it('keeps non-OKLCH formats unchanged', () => {
      const color = new Color('#ff0000');
      const swatch = colorToCssSwatchRender(color, 'hex', 'srgb');
      const regular = colorToCssRender(color, 'hex', 'srgb');
      expect(swatch).toBe(regular);
    });
  });

  describe('getContrast error handling', () => {
    it('returns 1 for invalid color input', () => {
      const result = getContrast('invalid', '#ffffff');
      expect(result).toBe(1);
    });
  });

  describe('colorToCssHex error handling', () => {
    it('returns #000000 for invalid input', () => {
      const result = colorToCssHex(null as unknown as InstanceType<typeof Color>);
      expect(result).toBe('#000000');
    });
  });

  describe('colorToCssRgb error handling', () => {
    it('returns fallback for invalid input', () => {
      const result = colorToCssRgb(null as unknown as InstanceType<typeof Color>);
      expect(result).toBe('rgb(0% 0% 0%)');
    });
  });

  describe('colorToCssOklch error handling', () => {
    it('returns fallback for invalid input', () => {
      const result = colorToCssOklch(null as unknown as InstanceType<typeof Color>);
      expect(result).toBe('oklch(0% 0 0)');
    });
  });

  describe('colorToCssHsl error handling', () => {
    it('returns fallback for invalid input', () => {
      const result = colorToCssHsl(null as unknown as InstanceType<typeof Color>);
      expect(result).toBe('hsl(0 0% 0%)');
    });
  });

  describe('generatePalettes error handling', () => {
    it('throws for invalid base color', () => {
      const params: ColorGenParams = {
        numColors: 11,
        numPalettes: 1,
        baseColor: 'not-a-color',
        warmth: 0,
        x1: 0.16,
        y1: 0,
        x2: 0.28,
        y2: 0.38,
        chromaMultiplier: 1,
        currentTheme: 'light'
      };
      expect(() => generatePalettes(params)).toThrow('Invalid base color');
    });
  });

  describe('getPaletteName edge cases', () => {
    it('handles palette with invalid hex values gracefully', () => {
      const palette = ['not-hex', '#ff0000', '#00ff00'];
      const name = getPaletteName(palette);
      expect(name).toBeTruthy();
    });

    it('handles palette where all colors are extremes', () => {
      const palette = ['#ffffff', '#000000'];
      const name = getPaletteName(palette);
      expect(name).toBeTruthy();
    });

    it('handles string reference that is invalid hex', () => {
      const palette = ['#ff0000', '#00ff00', '#0000ff'];
      const name = getPaletteName(palette, 'invalid-hex');
      expect(name).toBe('Unnamed');
    });

    it('handles numeric index out of bounds', () => {
      const palette = ['#ff0000', '#00ff00'];
      const name = getPaletteName(palette, 100);
      expect(name).toBeTruthy();
      expect(name).not.toBe('Unnamed');
    });

    it('finds alternate candidate when best match names to white/black', () => {
      // Palette where the best contrast match would name to "white" or "black"
      // but there are chromatic alternatives available
      const palette = ['#ffffff', '#f0f0f0', '#3366cc', '#000000'];
      const name = getPaletteName(palette, 0);
      // Should find a chromatic color name, not "White" or "Black"
      expect(name).toBeTruthy();
      expect(name.toLowerCase()).not.toBe('white');
      expect(name.toLowerCase()).not.toBe('black');
    });
  });

  describe('nearestFriendlyColorName cache', () => {
    it('caches results for repeated lookups', () => {
      clearNearestColorCache();

      // First call computes the result
      const name1 = nearestFriendlyColorName('#336699');
      // Second call should return cached result (same value)
      const name2 = nearestFriendlyColorName('#336699');

      expect(name1).toBe(name2);
      expect(typeof name1).toBe('string');
      expect(name1.length).toBeGreaterThan(0);
    });

    it('handles cache clearing', () => {
      // Add an entry
      const name1 = nearestFriendlyColorName('#445566');
      clearNearestColorCache();
      // After clearing, should still work (recomputes)
      const name2 = nearestFriendlyColorName('#445566');

      expect(name1).toBe(name2);
      expect(typeof name2).toBe('string');
    });
  });
});
