/**
 * Export utilities for color palettes
 */

import { hexToRgb, getPaletteName } from './colorUtils';

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
 * Gets the name for a palette, using dynamic color detection with fallback
 * @param palette - Array of hex colors in the palette
 * @param index - Palette index for fallback naming
 * @returns Palette name string
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
    const rgbObj = hexToRgb(color);
    const rgb = rgbObj ? ([rgbObj.r, rgbObj.g, rgbObj.b] as [number, number, number]) : null;
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
      const rgbObj = hexToRgb(color);
      const rgb = rgbObj ? ([rgbObj.r, rgbObj.g, rgbObj.b] as [number, number, number]) : null;
      if (rgb) {
        paletteTokens[`${step}`] = {
          $type: 'color',
          $value: {
            colorSpace: 'srgb',
            components: rgb,
            hex: color
          },
          $description: `${paletteName.replace(/(^|-)\w/g, (m) => m.replace('-', ' ').toUpperCase()).trim()} color step ${step}`
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
 * Exports colors as CSS custom properties
 */
export function exportAsCSS(neutrals: string[], palettes: string[][]): string {
  let css = ':root {\n';

  // Export neutral colors
  css += '  /* Neutral Colors */\n';
  neutrals.forEach((color, index) => {
    const step = index * 10;
    css += `  --color-gray-${step}: ${color};\n`;
  });

  // Export color palettes
  palettes.forEach((palette, paletteIndex) => {
    const paletteName = getPaletteNameForExport(palette, paletteIndex);
    css += `\n  /* ${paletteName.replace(/(^|-)\w/g, (m) => m.replace('-', ' ').toUpperCase()).trim()} Palette */\n`;

    palette.forEach((color, index) => {
      const step = index * 10;
      css += `  --color-${paletteName}-${step}: ${color};\n`;
    });
  });

  css += '}\n';
  return css;
}

/**
 * Exports colors as SCSS variables
 */
export function exportAsSCSS(neutrals: string[], palettes: string[][]): string {
  let scss = '// Color Variables\n';

  // Export neutral colors
  scss += '// Neutral Colors\n';
  neutrals.forEach((color, index) => {
    const step = index * 10;
    scss += `$color-gray-${step}: ${color};\n`;
  });

  // Export color palettes
  palettes.forEach((palette, paletteIndex) => {
    const paletteName = getPaletteNameForExport(palette, paletteIndex);
    scss += `\n// ${paletteName.replace(/(^|-)\w/g, (m) => m.replace('-', ' ').toUpperCase()).trim()} Palette\n`;

    palette.forEach((color, index) => {
      const step = index * 10;
      scss += `$color-${paletteName}-${step}: ${color};\n`;
    });
  });

  return scss;
}

/**
 * Downloads data as a file
 * @throws Error if running in non-browser environment or if download fails
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
export function downloadCSS(neutrals: string[], palettes: string[][]) {
  const css = exportAsCSS(neutrals, palettes);
  downloadFile(css, 'colors.css', 'text/css');
}

/**
 * Exports and downloads SCSS variables
 */
export function downloadSCSS(neutrals: string[], palettes: string[][]) {
  const scss = exportAsSCSS(neutrals, palettes);
  downloadFile(scss, 'colors.scss', 'text/plain');
}
