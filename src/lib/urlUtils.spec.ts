/**
 * URL Utilities Unit Tests
 */
import { describe, it, expect } from 'vitest';
import { encodeStateToUrl, decodeStateFromUrl, type UrlColorState } from './urlUtils';

describe('urlUtils', () => {
  describe('encodeStateToUrl', () => {
    it('encodes base color without hash', () => {
      const state: UrlColorState = { baseColor: '#ff0000' };
      const encoded = encodeStateToUrl(state);
      expect(encoded).toBe('c=ff0000');
    });

    it('encodes numeric values', () => {
      const state: UrlColorState = { warmth: 5, chromaMultiplier: 1.5 };
      const encoded = encodeStateToUrl(state);
      expect(encoded).toContain('w=5');
      expect(encoded).toContain('cm=1.5');
    });

    it('encodes zero chroma multiplier', () => {
      const state: UrlColorState = { chromaMultiplier: 0 };
      const encoded = encodeStateToUrl(state);
      expect(encoded).toContain('cm=0');
    });

    it('encodes bezier curve parameters', () => {
      const state: UrlColorState = { x1: 0.16, y1: 0, x2: 0.28, y2: 0.38 };
      const encoded = encodeStateToUrl(state);
      expect(encoded).toContain('x1=0.16');
      expect(encoded).toContain('y1=0');
      expect(encoded).toContain('x2=0.28');
      expect(encoded).toContain('y2=0.38');
    });

    it('encodes theme preference', () => {
      const state: UrlColorState = { themePreference: 'dark' };
      const encoded = encodeStateToUrl(state);
      expect(encoded).toContain('t=dark');
    });

    it('does not encode auto theme preference (default)', () => {
      const state: UrlColorState = { themePreference: 'auto' };
      const encoded = encodeStateToUrl(state);
      expect(encoded).not.toContain('t=');
    });

    it('encodes contrast mode', () => {
      const state: UrlColorState = { contrastMode: 'manual' };
      const encoded = encodeStateToUrl(state);
      expect(encoded).toContain('m=manual');
    });

    it('encodes lightness nudgers with index:value format', () => {
      const state: UrlColorState = {
        lightnessNudgers: [0, 0, 0.1, 0, 0, -0.05, 0, 0, 0, 0, 0]
      };
      const encoded = encodeStateToUrl(state);
      expect(encoded).toContain('ln=2%3A0.1%2C5%3A-0.05'); // URL encoded 2:0.1,5:-0.05
    });

    it('omits nudgers when all values are zero', () => {
      const state: UrlColorState = {
        lightnessNudgers: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      };
      const encoded = encodeStateToUrl(state);
      expect(encoded).not.toContain('ln=');
    });

    it('returns empty string for empty state', () => {
      const state: UrlColorState = {};
      const encoded = encodeStateToUrl(state);
      expect(encoded).toBe('');
    });
  });

  describe('decodeStateFromUrl', () => {
    it('decodes base color with hash prefix', () => {
      const params = new URLSearchParams('c=ff0000');
      const state = decodeStateFromUrl(params);
      expect(state.baseColor).toBe('#ff0000');
    });

    it('decodes numeric values', () => {
      const params = new URLSearchParams('w=-7&cm=1.14&nc=11&np=5');
      const state = decodeStateFromUrl(params);
      expect(state.warmth).toBe(-7);
      expect(state.chromaMultiplier).toBe(1.14);
      expect(state.numColors).toBe(11);
      expect(state.numPalettes).toBe(5);
    });

    it('accepts zero chroma multiplier from URL', () => {
      const params = new URLSearchParams('cm=0');
      const state = decodeStateFromUrl(params);
      expect(state.chromaMultiplier).toBe(0);
    });

    it('ignores out-of-range chroma multiplier from URL', () => {
      const params = new URLSearchParams('cm=1.8');
      const state = decodeStateFromUrl(params);
      expect(state.chromaMultiplier).toBeUndefined();
    });

    it('accepts higher chroma multiplier when gamut is p3', () => {
      const params = new URLSearchParams('gs=p3&cm=1.55');
      const state = decodeStateFromUrl(params);
      expect(state.gamutSpace).toBe('p3');
      expect(state.chromaMultiplier).toBe(1.55);
    });

    it('accepts higher chroma multiplier when gamut is rec2020', () => {
      const params = new URLSearchParams('gs=rec2020&cm=1.65');
      const state = decodeStateFromUrl(params);
      expect(state.gamutSpace).toBe('rec2020');
      expect(state.chromaMultiplier).toBe(1.65);
    });

    it('ignores out-of-range chroma multiplier for p3 gamut', () => {
      const params = new URLSearchParams('gs=p3&cm=1.8');
      const state = decodeStateFromUrl(params);
      expect(state.gamutSpace).toBe('p3');
      expect(state.chromaMultiplier).toBeUndefined();
    });

    it('decodes bezier curve parameters', () => {
      const params = new URLSearchParams('x1=0.16&y1=0&x2=0.28&y2=0.38');
      const state = decodeStateFromUrl(params);
      expect(state.x1).toBe(0.16);
      expect(state.y1).toBe(0);
      expect(state.x2).toBe(0.28);
      expect(state.y2).toBe(0.38);
    });

    it('decodes contrast mode', () => {
      const params = new URLSearchParams('m=manual');
      const state = decodeStateFromUrl(params);
      expect(state.contrastMode).toBe('manual');
    });

    it('decodes theme preference parameter', () => {
      const params = new URLSearchParams('t=dark');
      const state = decodeStateFromUrl(params);
      expect(state.themePreference).toBe('dark');
    });

    it('decodes lightness nudgers from index:value format', () => {
      const params = new URLSearchParams('ln=2:0.1,5:-0.05');
      const state = decodeStateFromUrl(params);
      expect(state.lightnessNudgers).toEqual([0, 0, 0.1, 0, 0, -0.05, 0, 0, 0, 0, 0]);
    });

    it('returns empty state for empty params', () => {
      const params = new URLSearchParams('');
      const state = decodeStateFromUrl(params);
      expect(state).toEqual({});
    });
  });

  describe('display settings encoding', () => {
    it('encodes display color space when not default', () => {
      const state: UrlColorState = { displayColorSpace: 'oklch' };
      const encoded = encodeStateToUrl(state);
      expect(encoded).toContain('ds=oklch');
    });

    it('omits display color space when default (hex)', () => {
      const state: UrlColorState = { displayColorSpace: 'hex' };
      const encoded = encodeStateToUrl(state);
      expect(encoded).not.toContain('ds=');
    });

    it('encodes gamut space when not default', () => {
      const state: UrlColorState = { gamutSpace: 'p3' };
      const encoded = encodeStateToUrl(state);
      expect(encoded).toContain('gs=p3');
    });

    it('encodes rec2020 gamut space', () => {
      const state: UrlColorState = { gamutSpace: 'rec2020' };
      const encoded = encodeStateToUrl(state);
      expect(encoded).toContain('gs=rec2020');
    });

    it('omits gamut space when default (srgb)', () => {
      const state: UrlColorState = { gamutSpace: 'srgb' };
      const encoded = encodeStateToUrl(state);
      expect(encoded).not.toContain('gs=');
    });

    it('does not encode themePreference (localStorage only)', () => {
      const state: UrlColorState = { themePreference: 'auto' };
      const encoded = encodeStateToUrl(state);
      expect(encoded).not.toContain('tp=');
    });

    it('encodes swatch labels when not default', () => {
      const state: UrlColorState = { swatchLabels: 'none' };
      const encoded = encodeStateToUrl(state);
      expect(encoded).toContain('sl=none');
    });

    it('omits swatch labels when default (both)', () => {
      const state: UrlColorState = { swatchLabels: 'both' };
      const encoded = encodeStateToUrl(state);
      expect(encoded).not.toContain('sl=');
    });

    it('encodes contrast algorithm when not default', () => {
      const state: UrlColorState = { contrastAlgorithm: 'APCA' };
      const encoded = encodeStateToUrl(state);
      expect(encoded).toContain('ca=APCA');
    });

    it('omits contrast algorithm when default (WCAG)', () => {
      const state: UrlColorState = { contrastAlgorithm: 'WCAG' };
      const encoded = encodeStateToUrl(state);
      expect(encoded).not.toContain('ca=');
    });

    it('encodes OKLCH significant digits when not default', () => {
      const state: UrlColorState = { oklchDisplaySignificantDigits: 5 };
      const encoded = encodeStateToUrl(state);
      expect(encoded).toContain('os=5');
    });

    it('omits OKLCH significant digits when default (4)', () => {
      const state: UrlColorState = { oklchDisplaySignificantDigits: 4 };
      const encoded = encodeStateToUrl(state);
      expect(encoded).not.toContain('os=');
    });
  });

  describe('display settings decoding', () => {
    it('decodes display color space', () => {
      const params = new URLSearchParams('ds=rgb');
      const state = decodeStateFromUrl(params);
      expect(state.displayColorSpace).toBe('rgb');
    });

    it('decodes gamut space', () => {
      const params = new URLSearchParams('gs=rec2020');
      const state = decodeStateFromUrl(params);
      expect(state.gamutSpace).toBe('rec2020');
    });

    it('ignores tp param (themePreference is localStorage only)', () => {
      const params = new URLSearchParams('tp=auto');
      const state = decodeStateFromUrl(params);
      expect(state.themePreference).toBeUndefined();
    });

    it('decodes swatch labels', () => {
      const params = new URLSearchParams('sl=step');
      const state = decodeStateFromUrl(params);
      expect(state.swatchLabels).toBe('step');
    });

    it('decodes contrast algorithm', () => {
      const params = new URLSearchParams('ca=APCA');
      const state = decodeStateFromUrl(params);
      expect(state.contrastAlgorithm).toBe('APCA');
    });

    it('decodes OKLCH significant digits', () => {
      const params = new URLSearchParams('os=6');
      const state = decodeStateFromUrl(params);
      expect(state.oklchDisplaySignificantDigits).toBe(6);
    });

    it('ignores invalid display settings values', () => {
      const params = new URLSearchParams('ds=invalid&gs=bad&sl=nope&ca=fake&os=99');
      const state = decodeStateFromUrl(params);
      expect(state.displayColorSpace).toBeUndefined();
      expect(state.gamutSpace).toBeUndefined();
      expect(state.swatchLabels).toBeUndefined();
      expect(state.contrastAlgorithm).toBeUndefined();
      expect(state.oklchDisplaySignificantDigits).toBeUndefined();
    });

    it('leaves display settings undefined when params are missing', () => {
      const params = new URLSearchParams('c=ff0000');
      const state = decodeStateFromUrl(params);
      expect(state.displayColorSpace).toBeUndefined();
      expect(state.gamutSpace).toBeUndefined();
      expect(state.swatchLabels).toBeUndefined();
      expect(state.contrastAlgorithm).toBeUndefined();
      expect(state.oklchDisplaySignificantDigits).toBeUndefined();
    });
  });

  describe('roundtrip encoding/decoding', () => {
    it('preserves complete state through encode/decode cycle', () => {
      const original: UrlColorState = {
        baseColor: '#1862e6',
        warmth: -7,
        chromaMultiplier: 1.14,
        numColors: 11,
        numPalettes: 5,
        x1: 0.16,
        y1: 0,
        x2: 0.28,
        y2: 0.38,
        contrastMode: 'auto',
        lowStep: 0,
        highStep: 10,
        lightnessNudgers: [0, 0, 0.1, 0, 0, -0.05, 0, 0, 0, 0, 0],
        hueNudgers: [0, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      };

      const encoded = encodeStateToUrl(original);
      const decoded = decodeStateFromUrl(new URLSearchParams(encoded));

      expect(decoded.baseColor).toBe(original.baseColor);
      expect(decoded.warmth).toBe(original.warmth);
      expect(decoded.chromaMultiplier).toBe(original.chromaMultiplier);
      expect(decoded.numColors).toBe(original.numColors);
      expect(decoded.numPalettes).toBe(original.numPalettes);
      expect(decoded.x1).toBe(original.x1);
      expect(decoded.y1).toBe(original.y1);
      expect(decoded.x2).toBe(original.x2);
      expect(decoded.y2).toBe(original.y2);
      expect(decoded.contrastMode).toBe(original.contrastMode);
      expect(decoded.lowStep).toBe(original.lowStep);
      expect(decoded.highStep).toBe(original.highStep);
      expect(decoded.lightnessNudgers).toEqual(original.lightnessNudgers);
      expect(decoded.hueNudgers).toEqual(original.hueNudgers);
    });

    it('preserves display settings through encode/decode cycle', () => {
      const original: UrlColorState = {
        displayColorSpace: 'oklch',
        gamutSpace: 'p3',
        swatchLabels: 'step',
        contrastAlgorithm: 'APCA',
        oklchDisplaySignificantDigits: 5
      };

      const encoded = encodeStateToUrl(original);
      const decoded = decodeStateFromUrl(new URLSearchParams(encoded));

      expect(decoded.displayColorSpace).toBe(original.displayColorSpace);
      expect(decoded.gamutSpace).toBe(original.gamutSpace);
      expect(decoded.swatchLabels).toBe(original.swatchLabels);
      expect(decoded.contrastAlgorithm).toBe(original.contrastAlgorithm);
      expect(decoded.oklchDisplaySignificantDigits).toBe(original.oklchDisplaySignificantDigits);
    });
  });
});
