/**
 * Export utilities for color palettes
 */

import Color from 'colorjs.io';
import { resolveExportPaletteNames } from './paletteNameUtils';

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

function escapeCommentLabel(label: string): string {
  return label.replace(/\*\//g, '* /');
}

export interface ExportNameOptions {
  lowContrastColor: string;
  customNeutralName?: string;
  customPaletteNames?: string[];
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
export function exportAsDesignTokens(
  neutrals: string[],
  palettes: string[][],
  options: ExportNameOptions = { lowContrastColor: '#ffffff' }
): DesignTokens {
  const tokens: DesignTokens = {};
  const exportNames = resolveExportPaletteNames({
    neutrals,
    palettes,
    lowContrastColor: options.lowContrastColor,
    customNeutralName: options.customNeutralName,
    customPaletteNames: options.customPaletteNames
  });

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
        $description: `${exportNames.neutral.label} color step ${step}`
      };
    }
  });

  if (Object.keys(neutralTokens).length > 0) {
    tokens[exportNames.neutral.slug] = neutralTokens;
  }

  // Export color palettes
  palettes.forEach((palette, paletteIndex) => {
    const paletteName = exportNames.palettes[paletteIndex];
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
          $description: `${paletteName.label} color step ${step}`
        };
      }
    });

    if (Object.keys(paletteTokens).length > 0) {
      tokens[paletteName.slug] = paletteTokens;
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
  options: ExportNameOptions = { lowContrastColor: '#ffffff' },
  displayNeutrals?: string[],
  displayPalettes?: string[][]
): string {
  let css = ':root {\n';
  const exportNames = resolveExportPaletteNames({
    neutrals,
    palettes,
    lowContrastColor: options.lowContrastColor,
    customNeutralName: options.customNeutralName,
    customPaletteNames: options.customPaletteNames
  });

  // Export neutral colors
  css += `  /* ${escapeCommentLabel(exportNames.neutral.label)} Palette */\n`;
  neutrals.forEach((color, index) => {
    const step = index * 10;
    const value = displayNeutrals?.[index] ?? color;
    css += `  --color-${exportNames.neutral.slug}-${step}: ${value};\n`;
  });

  // Export color palettes
  palettes.forEach((palette, paletteIndex) => {
    const paletteName = exportNames.palettes[paletteIndex];
    css += `\n  /* ${escapeCommentLabel(paletteName.label)} Palette */\n`;

    palette.forEach((color, index) => {
      const step = index * 10;
      const value = displayPalettes?.[paletteIndex]?.[index] ?? color;
      css += `  --color-${paletteName.slug}-${step}: ${value};\n`;
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
  options: ExportNameOptions = { lowContrastColor: '#ffffff' },
  displayNeutrals?: string[],
  displayPalettes?: string[][]
): string {
  let scss = '// Color Variables\n';
  const exportNames = resolveExportPaletteNames({
    neutrals,
    palettes,
    lowContrastColor: options.lowContrastColor,
    customNeutralName: options.customNeutralName,
    customPaletteNames: options.customPaletteNames
  });

  // Export neutral colors
  scss += `// ${escapeCommentLabel(exportNames.neutral.label)} Palette\n`;
  neutrals.forEach((color, index) => {
    const step = index * 10;
    const value = displayNeutrals?.[index] ?? color;
    scss += `$color-${exportNames.neutral.slug}-${step}: ${value};\n`;
  });

  // Export color palettes
  palettes.forEach((palette, paletteIndex) => {
    const paletteName = exportNames.palettes[paletteIndex];
    scss += `\n// ${escapeCommentLabel(paletteName.label)} Palette\n`;

    palette.forEach((color, index) => {
      const step = index * 10;
      const value = displayPalettes?.[paletteIndex]?.[index] ?? color;
      scss += `$color-${paletteName.slug}-${step}: ${value};\n`;
    });
  });

  return scss;
}

/**
 * Exports colors as a plain newline-separated value list, grouped by palette
 * with comment dividers. When displayNeutrals/displayPalettes are provided,
 * those formatted values are used instead of the hex values.
 */
export function exportAsList(
  neutrals: string[],
  palettes: string[][],
  options: ExportNameOptions = { lowContrastColor: '#ffffff' },
  displayNeutrals?: string[],
  displayPalettes?: string[][]
): string {
  const exportNames = resolveExportPaletteNames({
    neutrals,
    palettes,
    lowContrastColor: options.lowContrastColor,
    customNeutralName: options.customNeutralName,
    customPaletteNames: options.customPaletteNames
  });

  const sections: string[] = [];

  if (neutrals.length > 0) {
    const lines = [`/* ${escapeCommentLabel(exportNames.neutral.label)} */`];
    neutrals.forEach((color, index) => {
      lines.push(displayNeutrals?.[index] ?? color);
    });
    sections.push(lines.join('\n'));
  }

  palettes.forEach((palette, paletteIndex) => {
    const paletteName = exportNames.palettes[paletteIndex];
    const lines = [`/* ${escapeCommentLabel(paletteName.label)} */`];
    palette.forEach((color, index) => {
      lines.push(displayPalettes?.[paletteIndex]?.[index] ?? color);
    });
    sections.push(lines.join('\n'));
  });

  return sections.length > 0 ? `${sections.join('\n\n')}\n` : '';
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
      `Failed to create blob: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { cause: error }
    );
  }

  try {
    url = URL.createObjectURL(blob);
  } catch (error) {
    throw new Error(
      `Failed to create object URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { cause: error }
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
      `Failed to trigger download: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { cause: error }
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
export function downloadDesignTokens(
  neutrals: string[],
  palettes: string[][],
  options: ExportNameOptions = { lowContrastColor: '#ffffff' }
) {
  const tokens = exportAsDesignTokens(neutrals, palettes, options);
  const json = JSON.stringify(tokens, null, 2);
  downloadFile(json, 'color-tokens.json', 'application/json');
}

/**
 * Exports and downloads CSS variables
 */
export function downloadCSS(
  neutrals: string[],
  palettes: string[][],
  options: ExportNameOptions = { lowContrastColor: '#ffffff' },
  displayNeutrals?: string[],
  displayPalettes?: string[][]
) {
  const css = exportAsCSS(neutrals, palettes, options, displayNeutrals, displayPalettes);
  downloadFile(css, 'colors.css', 'text/css');
}

/**
 * Exports and downloads SCSS variables
 */
export function downloadSCSS(
  neutrals: string[],
  palettes: string[][],
  options: ExportNameOptions = { lowContrastColor: '#ffffff' },
  displayNeutrals?: string[],
  displayPalettes?: string[][]
) {
  const scss = exportAsSCSS(neutrals, palettes, options, displayNeutrals, displayPalettes);
  downloadFile(scss, 'colors.scss', 'text/plain');
}
