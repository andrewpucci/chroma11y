import { describe, expect, it, vi } from 'vitest';

import * as colorUtils from './colorUtils';
import {
  normalizeCustomPaletteName,
  normalizeCustomPaletteNames,
  resolveExportPaletteNames,
  resolveGeneratedPaletteName,
  resolveNeutralPaletteName
} from './paletteNameUtils';

describe('paletteNameUtils', () => {
  it('normalizes empty custom names to undefined', () => {
    expect(normalizeCustomPaletteName('   ')).toBeUndefined();
  });

  it('trims and trims trailing empty palette names', () => {
    expect(normalizeCustomPaletteNames([' Ocean ', '', '   ', ''], 4)).toEqual(['Ocean']);
  });

  it('resolves neutral fallback to Gray when generated naming fails', () => {
    expect(resolveNeutralPaletteName([], '#ffffff')).toBe('Gray');
  });

  it('falls back when generated palette naming returns an empty string', () => {
    const getPaletteNameSpy = vi.spyOn(colorUtils, 'getPaletteName').mockReturnValue('');

    expect(resolveGeneratedPaletteName(['#ffffff', '#1862e6'], '#ffffff', 0)).toBe('Blue');

    getPaletteNameSpy.mockRestore();
  });

  it('deduplicates export slugs across neutral and generated palettes', () => {
    const exportNames = resolveExportPaletteNames({
      neutrals: ['#ffffff', '#000000'],
      palettes: [
        ['#e6f0ff', '#0066ff'],
        ['#ffe6f0', '#ff0066']
      ],
      lowContrastColor: '#ffffff',
      customNeutralName: 'Blue',
      customPaletteNames: ['Blue', 'Blue']
    });

    expect(exportNames.neutral.slug).toBe('blue');
    expect(exportNames.palettes[0]?.slug).toBe('blue-2');
    expect(exportNames.palettes[1]?.slug).toBe('blue-3');
  });

  it('does not reserve the neutral slug when no neutrals are exported', () => {
    const exportNames = resolveExportPaletteNames({
      neutrals: [],
      palettes: [['#ff0000', '#cc0000']],
      lowContrastColor: '#ffffff',
      customNeutralName: 'Gray',
      customPaletteNames: ['Gray']
    });

    expect(exportNames.neutral.slug).toBe('gray');
    expect(exportNames.palettes[0]?.slug).toBe('gray');
  });
});
