/**
 * Export Utilities Unit Tests
 */
import { describe, it, expect } from 'vitest';
import { exportAsDesignTokens, exportAsCSS, exportAsSCSS } from './exportUtils';

describe('exportUtils', () => {
  const sampleNeutrals = ['#ffffff', '#e0e0e0', '#c0c0c0', '#808080', '#404040', '#000000'];
  const samplePalettes = [
    ['#e6f0ff', '#b3d1ff', '#80b3ff', '#4d94ff', '#1a75ff', '#0066ff'],
    ['#ffe6f0', '#ffb3d1', '#ff80b3', '#ff4d94', '#ff1a75', '#ff0066']
  ];

  describe('exportAsDesignTokens', () => {
    it('exports neutral colors to gray palette', () => {
      const tokens = exportAsDesignTokens(sampleNeutrals, []);

      expect(tokens.color._base.gray['0']).toEqual({
        name: '_base/gray/0',
        description: '',
        value: '#ffffff',
        type: 'color'
      });
      expect(tokens.color._base.gray['50']).toEqual({
        name: '_base/gray/50',
        description: '',
        value: '#000000',
        type: 'color'
      });
    });

    it('exports color palettes with correct names', () => {
      const tokens = exportAsDesignTokens([], samplePalettes);

      // First palette should be 'blue'
      expect(tokens.color._base.blue['0']).toEqual({
        name: '_base/blue/0',
        description: '',
        value: '#e6f0ff',
        type: 'color'
      });

      // Second palette should be 'purple'
      expect(tokens.color._base.purple['0']).toEqual({
        name: '_base/purple/0',
        description: '',
        value: '#ffe6f0',
        type: 'color'
      });
    });

    it('uses step increments of 10', () => {
      const tokens = exportAsDesignTokens(sampleNeutrals, []);

      expect(tokens.color._base.gray['0']).toBeDefined();
      expect(tokens.color._base.gray['10']).toBeDefined();
      expect(tokens.color._base.gray['20']).toBeDefined();
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
      expect(css).toContain('--color-blue-0: #e6f0ff;');
      expect(css).toContain('--color-purple-0: #ffe6f0;');
    });

    it('includes section comments', () => {
      const css = exportAsCSS(sampleNeutrals, samplePalettes);
      expect(css).toContain('/* Neutral Colors */');
      expect(css).toContain('/* Blue Palette */');
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
      expect(scss).toContain('$color-blue-0: #e6f0ff;');
      expect(scss).toContain('$color-purple-0: #ffe6f0;');
    });

    it('includes section comments', () => {
      const scss = exportAsSCSS(sampleNeutrals, samplePalettes);
      expect(scss).toContain('// Neutral Colors');
      expect(scss).toContain('// Blue Palette');
    });

    it('does not use :root selector', () => {
      const scss = exportAsSCSS(sampleNeutrals, samplePalettes);
      expect(scss).not.toContain(':root');
    });
  });
});
