import { describe, expect, it } from 'vitest';

import {
  CHROMA_MULTIPLIER_MIN,
  getChromaMultiplierBounds,
  clampChromaMultiplier
} from './chromaMultiplier';

describe('chromaMultiplier', () => {
  it('returns gamut-aware max bounds', () => {
    expect(getChromaMultiplierBounds('srgb').max).toBe(1.3);
    expect(getChromaMultiplierBounds('p3').max).toBe(1.6);
    expect(getChromaMultiplierBounds('rec2020').max).toBe(1.7);
  });

  it('uses zero as the shared lower bound', () => {
    expect(getChromaMultiplierBounds('srgb').min).toBe(CHROMA_MULTIPLIER_MIN);
    expect(CHROMA_MULTIPLIER_MIN).toBe(0);
  });

  it('clamps to the active gamut range', () => {
    expect(clampChromaMultiplier(-0.4, 'srgb')).toBe(0);
    expect(clampChromaMultiplier(1.9, 'srgb')).toBe(1.3);
    expect(clampChromaMultiplier(1.9, 'p3')).toBe(1.6);
    expect(clampChromaMultiplier(1.9, 'rec2020')).toBe(1.7);
  });

  it('returns min for non-finite values', () => {
    expect(clampChromaMultiplier(Infinity, 'srgb')).toBe(0);
    expect(clampChromaMultiplier(NaN, 'srgb')).toBe(0);
    expect(clampChromaMultiplier(-Infinity, 'p3')).toBe(0);
  });
});
