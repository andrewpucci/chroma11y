/**
 * Export Utilities Unit Tests
 */
import { describe, it, expect } from 'vitest';
import { exportAsDesignTokens, exportAsCSS, exportAsSCSS, type DesignTokens } from './exportUtils';

describe('exportUtils', () => {
  const sampleNeutrals = ['#ffffff', '#e0e0e0', '#c0c0c0', '#808080', '#404040', '#000000'];
  const samplePalettes = [
    ['#e6f0ff', '#b3d1ff', '#80b3ff', '#4d94ff', '#1a75ff', '#0066ff'],
    ['#ffe6f0', '#ffb3d1', '#ff80b3', '#ff4d94', '#ff1a75', '#ff0066']
  ];

  describe('exportAsDesignTokens', () => {
    it('exports neutral colors to gray palette', () => {
      const tokens = exportAsDesignTokens(sampleNeutrals, []);

      const gray = tokens.gray as DesignTokens;
      expect(gray['0']).toEqual({
        $type: 'color',
        $value: {
          colorSpace: 'srgb',
          components: [1, 1, 1],
          hex: '#ffffff'
        },
        $description: 'Neutral color step 0'
      });
      expect(gray['50']).toEqual({
        $type: 'color',
        $value: {
          colorSpace: 'srgb',
          components: [0, 0, 0],
          hex: '#000000'
        },
        $description: 'Neutral color step 50'
      });
    });

    it('exports color palettes with correct names', () => {
      const tokens = exportAsDesignTokens([], samplePalettes);

      // First palette should be 'royalblue' (detected from color)
      const royalblue = tokens.royalblue as DesignTokens;
      expect(royalblue['0']).toEqual({
        $type: 'color',
        $value: {
          colorSpace: 'srgb',
          components: [0.9019607843137255, 0.9411764705882353, 1],
          hex: '#e6f0ff'
        },
        $description: 'Royalblue color step 0'
      });

      // Second palette should be 'deeppink' (detected from color)
      const deeppink = tokens.deeppink as DesignTokens;
      expect(deeppink['0']).toEqual({
        $type: 'color',
        $value: {
          colorSpace: 'srgb',
          components: [1, 0.9019607843137255, 0.9411764705882353],
          hex: '#ffe6f0'
        },
        $description: 'Deeppink color step 0'
      });
    });

    it('uses step increments of 10', () => {
      const tokens = exportAsDesignTokens(sampleNeutrals, []);

      const gray = tokens.gray as DesignTokens;
      expect(gray['0']).toBeDefined();
      expect(gray['10']).toBeDefined();
      expect(gray['20']).toBeDefined();
    });
  });

  describe('exportAsCSS', () => {
    it('wraps variables in :root selector', () => {
      const css = exportAsCSS(sampleNeutrals, []);
      expect(css).toMatch(/^:root \{/);
      expect(css).toContain('}');
    });

    it('exports neutral colors as --color-gray-* variables', () => {
      const css = exportAsCSS(sampleNeutrals, []);
      expect(css).toContain('--color-gray-0: #ffffff;');
      expect(css).toContain('--color-gray-50: #000000;');
    });

    it('exports palettes with correct naming', () => {
      const css = exportAsCSS([], samplePalettes);
      expect(css).toContain('--color-royalblue-0: #e6f0ff;');
      expect(css).toContain('--color-deeppink-0: #ffe6f0;');
    });

    it('includes section comments', () => {
      const css = exportAsCSS(sampleNeutrals, samplePalettes);
      expect(css).toContain('/* Neutral Colors */');
      expect(css).toContain('/* Royalblue Palette */');
    });
  });

  describe('exportAsSCSS', () => {
    it('exports neutral colors as $color-gray-* variables', () => {
      const scss = exportAsSCSS(sampleNeutrals, []);
      expect(scss).toContain('$color-gray-0: #ffffff;');
      expect(scss).toContain('$color-gray-50: #000000;');
    });

    it('exports palettes with correct naming', () => {
      const scss = exportAsSCSS([], samplePalettes);
      expect(scss).toContain('$color-royalblue-0: #e6f0ff;');
      expect(scss).toContain('$color-deeppink-0: #ffe6f0;');
    });

    it('includes section comments', () => {
      const scss = exportAsSCSS(sampleNeutrals, samplePalettes);
      expect(scss).toContain('// Neutral Colors');
      expect(scss).toContain('// Royalblue Palette');
    });

    it('does not use :root selector', () => {
      const scss = exportAsSCSS(sampleNeutrals, samplePalettes);
      expect(scss).not.toContain(':root');
    });
  });
});
