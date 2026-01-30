/**
 * Export utilities for color palettes
 */

/**
 * Interface for design token structure
 */
interface DesignToken {
  name: string;
  description: string;
  value: string;
  type: string;
}

interface DesignTokens {
  color: {
    name: string;
    _base: {
      gray: Record<string, DesignToken>;
      blue: Record<string, DesignToken>;
      purple: Record<string, DesignToken>;
      orchid: Record<string, DesignToken>;
      pink: Record<string, DesignToken>;
      red: Record<string, DesignToken>;
      orange: Record<string, DesignToken>;
      gold: Record<string, DesignToken>;
      lime: Record<string, DesignToken>;
      green: Record<string, DesignToken>;
      turquoise: Record<string, DesignToken>;
      skyblue: Record<string, DesignToken>;
    };
  };
}

/**
 * Palette names in order
 */
const PALETTE_NAMES = [
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
 * Exports colors as design tokens JSON format
 */
export function exportAsDesignTokens(neutrals: string[], palettes: string[][]): DesignTokens {
  const exportedData: DesignTokens = {
    color: {
      name: 'color',
      _base: {
        gray: {},
        blue: {},
        purple: {},
        orchid: {},
        pink: {},
        red: {},
        orange: {},
        gold: {},
        lime: {},
        green: {},
        turquoise: {},
        skyblue: {}
      }
    }
  };

  // Export neutral colors
  neutrals.forEach((color, index) => {
    const step = index * 10;
    exportedData.color._base.gray[step] = {
      name: `_base/gray/${step}`,
      description: '',
      value: color,
      type: 'color'
    };
  });

  // Export color palettes
  palettes.forEach((palette, paletteIndex) => {
    const paletteName = PALETTE_NAMES[paletteIndex] || `palette-${paletteIndex + 1}`;

    if (exportedData.color._base[paletteName as keyof typeof exportedData.color._base]) {
      palette.forEach((color, index) => {
        const step = index * 10;
        exportedData.color._base[paletteName as keyof typeof exportedData.color._base][step] = {
          name: `_base/${paletteName}/${step}`,
          description: '',
          value: color,
          type: 'color'
        };
      });
    }
  });

  return exportedData;
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
    const paletteName = PALETTE_NAMES[paletteIndex] || `palette-${paletteIndex + 1}`;
    css += `\n  /* ${paletteName.charAt(0).toUpperCase() + paletteName.slice(1)} Palette */\n`;

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
    const paletteName = PALETTE_NAMES[paletteIndex] || `palette-${paletteIndex + 1}`;
    scss += `\n// ${paletteName.charAt(0).toUpperCase() + paletteName.slice(1)} Palette\n`;

    palette.forEach((color, index) => {
      const step = index * 10;
      scss += `$color-${paletteName}-${step}: ${color};\n`;
    });
  });

  return scss;
}

/**
 * Downloads data as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
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
