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

    it('encodes bezier curve parameters', () => {
      const state: UrlColorState = { x1: 0.16, y1: 0, x2: 0.28, y2: 0.38 };
      const encoded = encodeStateToUrl(state);
      expect(encoded).toContain('x1=0.16');
      expect(encoded).toContain('y1=0');
      expect(encoded).toContain('x2=0.28');
      expect(encoded).toContain('y2=0.38');
    });

    it('encodes theme and contrast mode', () => {
      const state: UrlColorState = { theme: 'dark', contrastMode: 'manual' };
      const encoded = encodeStateToUrl(state);
      expect(encoded).toContain('t=dark');
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

    it('decodes bezier curve parameters', () => {
      const params = new URLSearchParams('x1=0.16&y1=0&x2=0.28&y2=0.38');
      const state = decodeStateFromUrl(params);
      expect(state.x1).toBe(0.16);
      expect(state.y1).toBe(0);
      expect(state.x2).toBe(0.28);
      expect(state.y2).toBe(0.38);
    });

    it('decodes theme and contrast mode', () => {
      const params = new URLSearchParams('t=dark&m=manual');
      const state = decodeStateFromUrl(params);
      expect(state.theme).toBe('dark');
      expect(state.contrastMode).toBe('manual');
    });

    it('ignores invalid theme values', () => {
      const params = new URLSearchParams('t=invalid');
      const state = decodeStateFromUrl(params);
      expect(state.theme).toBeUndefined();
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
        theme: 'dark',
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
      expect(decoded.theme).toBe(original.theme);
      expect(decoded.contrastMode).toBe(original.contrastMode);
      expect(decoded.lowStep).toBe(original.lowStep);
      expect(decoded.highStep).toBe(original.highStep);
      expect(decoded.lightnessNudgers).toEqual(original.lightnessNudgers);
      expect(decoded.hueNudgers).toEqual(original.hueNudgers);
    });
  });
});
