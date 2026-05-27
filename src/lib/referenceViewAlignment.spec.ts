import { describe, expect, it } from 'vitest';
import { deriveNeutralAlignment, derivePaletteAlignment } from './referenceViewAlignment';

describe('deriveNeutralAlignment', () => {
  it('produces null-padded hex arrays when current has fewer steps than reference', () => {
    const current = ['#aaa', '#bbb'];
    const reference = ['#ccc', '#ddd', '#eee'];

    const result = deriveNeutralAlignment(current, reference);

    expect(result.currentHex).toEqual(['#aaa', '#bbb', null]);
    expect(result.referenceHex).toEqual(['#ccc', '#ddd', '#eee']);
  });

  it('produces null-padded hex arrays when reference has fewer steps than current', () => {
    const current = ['#aaa', '#bbb', '#ccc'];
    const reference = ['#ddd'];

    const result = deriveNeutralAlignment(current, reference);

    expect(result.currentHex).toEqual(['#aaa', '#bbb', '#ccc']);
    expect(result.referenceHex).toEqual(['#ddd', null, null]);
  });

  it('returns equal-length arrays with no nulls when step counts match', () => {
    const current = ['#aaa', '#bbb'];
    const reference = ['#ccc', '#ddd'];

    const result = deriveNeutralAlignment(current, reference);

    expect(result.currentHex).toEqual(['#aaa', '#bbb']);
    expect(result.referenceHex).toEqual(['#ccc', '#ddd']);
    expect(result.currentHex).toHaveLength(2);
    expect(result.referenceHex).toHaveLength(2);
  });

  it('returns arrays of equal length regardless of input sizes', () => {
    const current = ['#aaa', '#bbb', '#ccc', '#ddd'];
    const reference = ['#eee', '#fff'];

    const result = deriveNeutralAlignment(current, reference);

    expect(result.currentHex).toHaveLength(result.referenceHex.length);
  });
});

describe('derivePaletteAlignment', () => {
  it('produces null outer entries when current has more palettes than reference', () => {
    const current = [
      ['#f00', '#e00'],
      ['#0f0', '#0e0'],
      ['#00f', '#00e']
    ];
    const reference = [
      ['#f00', '#e00'],
      ['#0f0', '#0e0']
    ];

    const result = derivePaletteAlignment(current, reference);

    expect(result.currentHex).toHaveLength(3);
    expect(result.referenceHex).toHaveLength(3);
    expect(result.currentHex[2]).toEqual(['#00f', '#00e']);
    expect(result.referenceHex[2]).toBeNull();
  });

  it('produces null outer entries when reference has more palettes than current', () => {
    const current = [['#f00']];
    const reference = [['#f00'], ['#0f0'], ['#00f']];

    const result = derivePaletteAlignment(current, reference);

    expect(result.currentHex).toHaveLength(3);
    expect(result.referenceHex).toHaveLength(3);
    expect(result.currentHex[1]).toBeNull();
    expect(result.currentHex[2]).toBeNull();
    expect(result.referenceHex[1]).toEqual(['#0f0']);
    expect(result.referenceHex[2]).toEqual(['#00f']);
  });

  it('produces null inner entries for missing steps within a paired palette', () => {
    const current = [['#f00', '#e00', '#d00']];
    const reference = [['#f00', '#e00']];

    const result = derivePaletteAlignment(current, reference);

    expect(result.currentHex[0]).toEqual(['#f00', '#e00', '#d00']);
    expect(result.referenceHex[0]).toEqual(['#f00', '#e00', null]);
  });

  it('pads current side with null inner entries when reference has more steps', () => {
    const current = [['#f00']];
    const reference = [['#f00', '#e00', '#d00']];

    const result = derivePaletteAlignment(current, reference);

    expect(result.currentHex[0]).toEqual(['#f00', null, null]);
    expect(result.referenceHex[0]).toEqual(['#f00', '#e00', '#d00']);
  });

  it('returns parallel arrays of equal outer length', () => {
    const current = [['#f00'], ['#0f0']];
    const reference = [['#00f'], ['#ff0'], ['#f0f']];

    const result = derivePaletteAlignment(current, reference);

    expect(result.currentHex).toHaveLength(result.referenceHex.length);
  });

  it('returns empty arrays when both sides are empty', () => {
    const result = derivePaletteAlignment([], []);

    expect(result.currentHex).toEqual([]);
    expect(result.referenceHex).toEqual([]);
  });

  it('produces a null current entry when current is empty and reference has palettes', () => {
    const result = derivePaletteAlignment([], [['#f00', '#e00']]);

    expect(result.currentHex).toHaveLength(1);
    expect(result.referenceHex).toHaveLength(1);
    expect(result.currentHex[0]).toBeNull();
    expect(result.referenceHex[0]).toEqual(['#f00', '#e00']);
  });

  it('produces a null reference entry when reference is empty and current has palettes', () => {
    const result = derivePaletteAlignment([['#f00', '#e00']], []);

    expect(result.currentHex).toHaveLength(1);
    expect(result.referenceHex).toHaveLength(1);
    expect(result.currentHex[0]).toEqual(['#f00', '#e00']);
    expect(result.referenceHex[0]).toBeNull();
  });
});
