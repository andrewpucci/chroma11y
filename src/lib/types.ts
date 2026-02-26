/** Supported display color space formats */
export type DisplayColorSpace = 'hex' | 'rgb' | 'oklch' | 'hsl';

/** Supported gamut mapping targets */
export type GamutSpace = 'srgb' | 'p3' | 'rec2020';

/** Theme preference (auto follows prefers-color-scheme) */
export type ThemePreference = 'light' | 'dark' | 'auto';

/** Swatch label display options */
export type SwatchLabels = 'both' | 'step' | 'value' | 'none';

/** Supported contrast algorithm identifiers */
export type ContrastAlgorithm = 'WCAG' | 'APCA';

/** User-selectable significant digits for OKLCH display values */
export type OklchDisplaySignificantDigits = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Serializable color state for URL and localStorage persistence.
 * All fields are optional to support partial state updates.
 */
export interface SerializableColorState {
  baseColor?: string;
  warmth?: number;
  chromaMultiplier?: number;
  numColors?: number;
  numPalettes?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  theme?: 'light' | 'dark';
  contrastMode?: 'auto' | 'manual';
  lowStep?: number;
  highStep?: number;
  lightnessNudgers?: number[];
  hueNudgers?: number[];
  displayColorSpace?: DisplayColorSpace;
  gamutSpace?: GamutSpace;
  themePreference?: ThemePreference;
  swatchLabels?: SwatchLabels;
  contrastAlgorithm?: ContrastAlgorithm;
  oklchDisplaySignificantDigits?: OklchDisplaySignificantDigits;
}
