/**
 * Export Utilities Unit Tests
 */
import { describe, it, expect } from 'vitest';
import {
  exportAsDesignTokens,
  exportAsCSS,
  exportAsSCSS,
  exportAsList,
  type DesignTokens
} from './exportUtils';

describe('exportUtils', () => {
  const sampleNeutrals = ['#ffffff', '#e0e0e0', '#c0c0c0', '#808080', '#404040', '#000000'];
  const samplePalettes = [
    ['#e6f0ff', '#b3d1ff', '#80b3ff', '#4d94ff', '#1a75ff', '#0066ff'],
    ['#ffe6f0', '#ffb3d1', '#ff80b3', '#ff4d94', '#ff1a75', '#ff0066']
  ];
  const defaultOptions = { lowContrastColor: '#ffffff' };

  describe('exportAsDesignTokens', () => {
    it('exports neutral colors to gray palette', () => {
      const tokens = exportAsDesignTokens(sampleNeutrals, [], defaultOptions);

      const gray = tokens.gray as DesignTokens;
      expect(gray['0']).toEqual({
        $type: 'color',
        $value: {
          colorSpace: 'srgb',
          components: [1, 1, 1],
          hex: '#ffffff'
        },
        $description: 'Gray color step 0'
      });
      expect(gray['50']).toEqual({
        $type: 'color',
        $value: {
          colorSpace: 'srgb',
          components: [0, 0, 0],
          hex: '#000000'
        },
        $description: 'Gray color step 50'
      });
    });

    it('exports color palettes with correct names', () => {
      const tokens = exportAsDesignTokens([], samplePalettes, defaultOptions);

      // First palette should be 'azure' (detected from color)
      const azure = tokens.azure as DesignTokens;
      expect(azure['0']).toEqual({
        $type: 'color',
        $value: {
          colorSpace: 'srgb',
          components: [0.9019607843137255, 0.9411764705882353, 1],
          hex: '#e6f0ff'
        },
        $description: 'Azure color step 0'
      });

      // Second palette should be 'mellow-melon' (detected from color)
      const mellowMelon = tokens['mellow-melon'] as DesignTokens;
      expect(mellowMelon['0']).toEqual({
        $type: 'color',
        $value: {
          colorSpace: 'srgb',
          components: [1, 0.9019607843137255, 0.9411764705882353],
          hex: '#ffe6f0'
        },
        $description: 'Mellow Melon color step 0'
      });
    });

    it('uses step increments of 10', () => {
      const tokens = exportAsDesignTokens(sampleNeutrals, [], defaultOptions);

      const gray = tokens.gray as DesignTokens;
      expect(gray['0']).toBeDefined();
      expect(gray['10']).toBeDefined();
      expect(gray['20']).toBeDefined();
    });
  });

  describe('exportAsCSS', () => {
    it('wraps variables in :root selector', () => {
      const css = exportAsCSS(sampleNeutrals, [], defaultOptions);
      expect(css).toMatch(/^:root \{/);
      expect(css).toContain('}');
    });

    it('exports neutral colors as --color-gray-* variables', () => {
      const css = exportAsCSS(sampleNeutrals, [], defaultOptions);
      expect(css).toContain('--color-gray-0: #ffffff;');
      expect(css).toContain('--color-gray-50: #000000;');
    });

    it('exports palettes with correct naming', () => {
      const css = exportAsCSS([], samplePalettes, defaultOptions);
      expect(css).toContain('--color-azure-0: #e6f0ff;');
      expect(css).toContain('--color-mellow-melon-0: #ffe6f0;');
    });

    it('includes section comments', () => {
      const css = exportAsCSS(sampleNeutrals, samplePalettes, defaultOptions);
      expect(css).toContain('/* Gray Palette */');
      expect(css).toContain('/* Azure Palette */');
    });
  });

  describe('exportAsSCSS', () => {
    it('exports neutral colors as $color-gray-* variables', () => {
      const scss = exportAsSCSS(sampleNeutrals, [], defaultOptions);
      expect(scss).toContain('$color-gray-0: #ffffff;');
      expect(scss).toContain('$color-gray-50: #000000;');
    });

    it('exports palettes with correct naming', () => {
      const scss = exportAsSCSS([], samplePalettes, defaultOptions);
      expect(scss).toContain('$color-azure-0: #e6f0ff;');
      expect(scss).toContain('$color-mellow-melon-0: #ffe6f0;');
    });

    it('includes section comments', () => {
      const scss = exportAsSCSS(sampleNeutrals, samplePalettes, defaultOptions);
      expect(scss).toContain('// Gray Palette');
      expect(scss).toContain('// Azure Palette');
    });

    it('does not use :root selector', () => {
      const scss = exportAsSCSS(sampleNeutrals, samplePalettes, defaultOptions);
      expect(scss).not.toContain(':root');
    });
  });

  describe('exportAsList', () => {
    it('emits a comment divider followed by neutral values', () => {
      const list = exportAsList(sampleNeutrals, [], defaultOptions);
      expect(list).toContain('/* Gray */');
      expect(list).toContain('#ffffff');
      expect(list).toContain('#000000');
    });

    it('separates each palette section with a blank line', () => {
      const list = exportAsList(sampleNeutrals, samplePalettes, defaultOptions);
      expect(list).toMatch(/\n\n\/\* Azure \*\//);
      expect(list).toMatch(/\n\n\/\* Mellow Melon \*\//);
    });

    it('uses display values when provided', () => {
      const displayNeutrals = ['oklch(100% 0 0)', 'oklch(0% 0 0)'];
      const list = exportAsList(['#ffffff', '#000000'], [], defaultOptions, displayNeutrals);
      expect(list).toContain('oklch(100% 0 0)');
      expect(list).toContain('oklch(0% 0 0)');
      expect(list).not.toContain('#ffffff');
    });

    it('honors custom palette names', () => {
      const list = exportAsList(sampleNeutrals, samplePalettes, {
        lowContrastColor: '#ffffff',
        customNeutralName: 'Canvas',
        customPaletteNames: ['Ocean', 'Bloom']
      });
      expect(list).toContain('/* Canvas */');
      expect(list).toContain('/* Ocean */');
      expect(list).toContain('/* Bloom */');
    });

    it('supports single-palette scoping via single-element arrays', () => {
      const list = exportAsList([], [samplePalettes[0]], defaultOptions);
      expect(list).toContain('/* Azure */');
      expect(list).not.toContain('/* Mellow Melon */');
    });

    it('returns an empty string when there is nothing to export', () => {
      expect(exportAsList([], [], defaultOptions)).toBe('');
    });

    it('escapes embedded comment terminators in custom names', () => {
      const list = exportAsList(sampleNeutrals, [], {
        lowContrastColor: '#ffffff',
        customNeutralName: 'Canvas */ malicious'
      });
      expect(list).toContain('/* Canvas * / malicious */');
      expect(list).not.toContain('/* Canvas */ malicious');
    });
  });

  describe('palette naming edge cases', () => {
    it('handles grayscale palette gracefully', () => {
      const palettes = [['#808080', '#404040']];

      const css = exportAsCSS([], palettes, defaultOptions);

      // Should still produce valid output with some name
      expect(css).toContain('--color-');
    });

    it('uses display values when provided to CSS export', () => {
      const neutrals = ['#ffffff'];
      const palettes: string[][] = [];
      const displayNeutrals = ['oklch(100% 0 0)'];

      const css = exportAsCSS(neutrals, palettes, defaultOptions, displayNeutrals);

      expect(css).toContain('oklch(100% 0 0)');
    });

    it('uses display values when provided to SCSS export', () => {
      const neutrals = ['#ffffff'];
      const palettes: string[][] = [];
      const displayNeutrals = ['oklch(100% 0 0)'];

      const scss = exportAsSCSS(neutrals, palettes, defaultOptions, displayNeutrals);

      expect(scss).toContain('oklch(100% 0 0)');
    });

    it('uses custom neutral and palette names in exported identifiers', () => {
      const css = exportAsCSS(sampleNeutrals, samplePalettes, {
        lowContrastColor: '#ffffff',
        customNeutralName: 'Canvas',
        customPaletteNames: ['Ocean', 'Bloom']
      });

      expect(css).toContain('--color-canvas-0: #ffffff;');
      expect(css).toContain('--color-ocean-0: #e6f0ff;');
      expect(css).toContain('--color-bloom-0: #ffe6f0;');
    });

    it('deduplicates export slugs across neutral and generated palettes', () => {
      const css = exportAsCSS(sampleNeutrals, samplePalettes, {
        lowContrastColor: '#ffffff',
        customNeutralName: 'Blue',
        customPaletteNames: ['Blue', 'Blue']
      });

      expect(css).toContain('--color-blue-0: #ffffff;');
      expect(css).toContain('--color-blue-2-0: #e6f0ff;');
      expect(css).toContain('--color-blue-3-0: #ffe6f0;');
    });

    it('escapes custom names before inserting them into CSS comments', () => {
      const css = exportAsCSS(sampleNeutrals, samplePalettes, {
        lowContrastColor: '#ffffff',
        customNeutralName: 'Canvas */ :root { color: red; }',
        customPaletteNames: ['Ocean */ body { display:none; }']
      });

      expect(css).toContain('/* Canvas * / :root { color: red; } Palette */');
      expect(css).toContain('/* Ocean * / body { display:none; } Palette */');
      expect(css).not.toContain('/* Canvas */ :root');
    });

    it('escapes custom names before inserting them into SCSS comments', () => {
      const scss = exportAsSCSS(sampleNeutrals, samplePalettes, {
        lowContrastColor: '#ffffff',
        customNeutralName: 'Canvas */ $danger: red;',
        customPaletteNames: ['Ocean */ $warning: orange;']
      });

      expect(scss).toContain('// Canvas * / $danger: red; Palette');
      expect(scss).toContain('// Ocean * / $warning: orange; Palette');
    });
  });
});
