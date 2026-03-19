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

/** Swatch contrast indicator visibility by criterion */
export interface SwatchContrastIndicators {
  wcagThreeToOne: boolean;
  wcagAA: boolean;
  wcagAAA: boolean;
  apcaLarge: boolean;
  apcaFluent: boolean;
  apcaBody: boolean;
}

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
  showSwatchGamutWarnings?: boolean;
  showSwatchContrastIndicators?: boolean;
  swatchContrastIndicators?: SwatchContrastIndicators;
  contrastAlgorithm?: ContrastAlgorithm;
  oklchDisplaySignificantDigits?: OklchDisplaySignificantDigits;
  customNeutralName?: string;
  customPaletteNames?: string[];
}
