import type { GamutSpace } from '$lib/types';

/** Saturation slider minimum, shared across all gamuts. */
export const CHROMA_MULTIPLIER_MIN = 0;
/** Saturation slider maximum for normalized chroma mode. */
export const CHROMA_MULTIPLIER_MAX = 1;

/** Upper bounds for saturation control (normalized across gamuts). */
export const CHROMA_MULTIPLIER_MAX_BY_GAMUT: Record<GamutSpace, number> = {
  srgb: CHROMA_MULTIPLIER_MAX,
  p3: CHROMA_MULTIPLIER_MAX,
  rec2020: CHROMA_MULTIPLIER_MAX
};

/**
 * Returns gamut-aware chroma multiplier bounds used by UI and URL/state validation.
 */
export function getChromaMultiplierBounds(gamut: GamutSpace = 'srgb'): {
  min: number;
  max: number;
} {
  return {
    min: CHROMA_MULTIPLIER_MIN,
    max: CHROMA_MULTIPLIER_MAX_BY_GAMUT[gamut]
  };
}

/**
 * Clamps a chroma multiplier to the valid range for the provided gamut.
 */
export function clampChromaMultiplier(value: number, gamut: GamutSpace = 'srgb'): number {
  if (!isFinite(value)) return getChromaMultiplierBounds(gamut).min;
  const { min, max } = getChromaMultiplierBounds(gamut);
  return Math.max(min, Math.min(max, value));
}
