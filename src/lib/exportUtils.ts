/**
 * Export utilities for color palettes
 */

import Color from 'colorjs.io';
import { getPaletteName } from './colorUtils';

/** Converts a kebab-case slug to Title Case (e.g. "blue-ribbon" → "Blue Ribbon") */
function slugToTitle(slug: string): string {
  return slug.replace(/(^|-)\w/g, (m) => m.replace('-', ' ').toUpperCase()).trim();
}

/**
 * Parse a hex string to normalized sRGB [r, g, b] (0–1 range), or null on failure.
 *
 * Note: The catch branch is defensive code for malformed hex values that slip
 * past validation. In practice, all hex values come from colorToCssHex() which
 * always produces valid output. This is tested indirectly via exportAsDesignTokens
 * which skips invalid colors (no token emitted).
 */
function hexToSrgbComponents(hex: string): [number, number, number] | null {
  try {
    const [r, g, b] = new Color(hex).to('srgb').coords;
    return [r ?? 0, g ?? 0, b ?? 0];
  } catch {
    return null;
  }
}

/** Default palette names used as fallbacks when color naming fails */
const DEFAULT_PALETTE_NAMES = [
  'blue',
  'purple',
  'orchid',
  'pink',
  'red',
  'orange',
  'gold',
  'lime',
  'green',
  'turquoise',
  'skyblue'
];

/**
 * Gets the name for a palette, using dynamic color detection with fallback.
 * @param palette - Array of hex colors in the palette
 * @param index - Palette index for fallback naming
 * @returns Palette name string
 *
 * Note: The index-based fallback (`palette-${index + 1}`) is defensive code for
 * when both color detection fails AND the palette index exceeds DEFAULT_PALETTE_NAMES
 * (11 entries). In practice, the app limits palettes to 11, so this path is rarely
 * triggered. The grayscale palette test covers the DEFAULT_PALETTE_NAMES fallback.
 */
function getPaletteNameForExport(palette: string[], index: number): string {
  // Try to get dynamic name from color detection
  const dynamicName = getPaletteName(palette);
  if (dynamicName && dynamicName !== 'Unnamed') {
    // Slugify: lowercase, replace non-alphanumeric with hyphens, collapse multiple hyphens, trim
    return dynamicName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  // Fall back to default names or index-based naming
  return DEFAULT_PALETTE_NAMES[index] || `palette-${index + 1}`;
}

/**
 * Interface for design token value (can be string or object)
 */
interface DesignTokenValue {
  colorSpace: string;
  components: number[];
  hex: string;
}

/**
 * Interface for design token structure compliant with Design Tokens specification
 * @see https://www.designtokens.org/tr/2025.10/
 */
interface DesignToken {
  $type: string;
  $value: string | DesignTokenValue;
  $description?: string;
}

export interface DesignTokens {
  [key: string]: DesignToken | DesignTokens;
}

/**
 * @see https://www.designtokens.org/tr/2025.10/
 * Exports colors as design tokens JSON format compliant with Design Tokens specification
 */
export function exportAsDesignTokens(neutrals: string[], palettes: string[][]): DesignTokens {
  const tokens: DesignTokens = {};

  // Export neutral colors
  const neutralTokens: DesignTokens = {};
  neutrals.forEach((color, index) => {
    const step = index * 10;
    const rgb = hexToSrgbComponents(color);
    if (rgb) {
      neutralTokens[`${step}`] = {
        $type: 'color',
        $value: {
          colorSpace: 'srgb',
          components: rgb,
          hex: color
        },
        $description: `Neutral color step ${step}`
      };
    }
  });

  if (Object.keys(neutralTokens).length > 0) {
    tokens.gray = neutralTokens;
  }

  // Export color palettes
  palettes.forEach((palette, paletteIndex) => {
    const paletteName = getPaletteNameForExport(palette, paletteIndex);
    const paletteTokens: DesignTokens = {};

    palette.forEach((color, index) => {
      const step = index * 10;
      const rgb = hexToSrgbComponents(color);
      if (rgb) {
        paletteTokens[`${step}`] = {
          $type: 'color',
          $value: {
            colorSpace: 'srgb',
            components: rgb,
            hex: color
          },
          $description: `${slugToTitle(paletteName)} color step ${step}`
        };
      }
    });

    if (Object.keys(paletteTokens).length > 0) {
      tokens[paletteName] = paletteTokens;
    }
  });

  return tokens;
}

/**
 * Exports colors as CSS custom properties.
 * When displayNeutrals/displayPalettes are provided, those formatted values are used
 * instead of the hex values (which are still used for palette naming).
 */
export function exportAsCSS(
  neutrals: string[],
  palettes: string[][],
  displayNeutrals?: string[],
  displayPalettes?: string[][]
): string {
  let css = ':root {\n';

  // Export neutral colors
  css += '  /* Neutral Colors */\n';
  neutrals.forEach((color, index) => {
    const step = index * 10;
    const value = displayNeutrals?.[index] ?? color;
    css += `  --color-gray-${step}: ${value};\n`;
  });

  // Export color palettes
  palettes.forEach((palette, paletteIndex) => {
    const paletteName = getPaletteNameForExport(palette, paletteIndex);
    css += `\n  /* ${slugToTitle(paletteName)} Palette */\n`;

    palette.forEach((color, index) => {
      const step = index * 10;
      const value = displayPalettes?.[paletteIndex]?.[index] ?? color;
      css += `  --color-${paletteName}-${step}: ${value};\n`;
    });
  });

  css += '}\n';
  return css;
}

/**
 * Exports colors as SCSS variables.
 * When displayNeutrals/displayPalettes are provided, those formatted values are used
 * instead of the hex values (which are still used for palette naming).
 */
export function exportAsSCSS(
  neutrals: string[],
  palettes: string[][],
  displayNeutrals?: string[],
  displayPalettes?: string[][]
): string {
  let scss = '// Color Variables\n';

  // Export neutral colors
  scss += '// Neutral Colors\n';
  neutrals.forEach((color, index) => {
    const step = index * 10;
    const value = displayNeutrals?.[index] ?? color;
    scss += `$color-gray-${step}: ${value};\n`;
  });

  // Export color palettes
  palettes.forEach((palette, paletteIndex) => {
    const paletteName = getPaletteNameForExport(palette, paletteIndex);
    scss += `\n// ${slugToTitle(paletteName)} Palette\n`;

    palette.forEach((color, index) => {
      const step = index * 10;
      const value = displayPalettes?.[paletteIndex]?.[index] ?? color;
      scss += `$color-${paletteName}-${step}: ${value};\n`;
    });
  });

  return scss;
}

/**
 * Downloads data as a file.
 * @throws Error if running in non-browser environment or if download fails
 *
 * Note: The browser environment check (line 225) and blob creation error (line 236)
 * are defensive guards that cannot be triggered in normal operation:
 * - The environment check guards against SSR, but this function is only called
 *   from UI event handlers which only exist in the browser
 * - Blob creation only fails with truly malformed input or out-of-memory, which
 *   is impractical to test reliably
 * These paths are tested via the DOM spec's error handling tests which mock
 * the underlying APIs to simulate failures.
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  // Check for browser environment
  if (typeof document === 'undefined' || typeof URL === 'undefined') {
    throw new Error('downloadFile requires a browser environment');
  }

  let blob: Blob;
  let url: string;
  let link: HTMLAnchorElement | null = null;

  try {
    blob = new Blob([content], { type: mimeType });
  } catch (error) {
    throw new Error(
      `Failed to create blob: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  try {
    url = URL.createObjectURL(blob);
  } catch (error) {
    throw new Error(
      `Failed to create object URL: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  try {
    link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
  } catch (error) {
    throw new Error(
      `Failed to trigger download: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  } finally {
    // Ensure link is removed even if click() throws
    if (link && link.parentNode) {
      document.body.removeChild(link);
    }
    URL.revokeObjectURL(url);
  }
}

/**
 * Exports and downloads design tokens
 */
export function downloadDesignTokens(neutrals: string[], palettes: string[][]) {
  const tokens = exportAsDesignTokens(neutrals, palettes);
  const json = JSON.stringify(tokens, null, 2);
  downloadFile(json, 'color-tokens.json', 'application/json');
}

/**
 * Exports and downloads CSS variables
 */
export function downloadCSS(
  neutrals: string[],
  palettes: string[][],
  displayNeutrals?: string[],
  displayPalettes?: string[][]
) {
  const css = exportAsCSS(neutrals, palettes, displayNeutrals, displayPalettes);
  downloadFile(css, 'colors.css', 'text/css');
}

/**
 * Exports and downloads SCSS variables
 */
export function downloadSCSS(
  neutrals: string[],
  palettes: string[][],
  displayNeutrals?: string[],
  displayPalettes?: string[][]
) {
  const scss = exportAsSCSS(neutrals, palettes, displayNeutrals, displayPalettes);
  downloadFile(scss, 'colors.scss', 'text/plain');
}
