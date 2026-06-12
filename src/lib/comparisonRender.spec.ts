import { describe, expect, it } from 'vitest';
import {
  buildSideBySideNeutralAlignment,
  buildSideBySidePaletteAlignments
} from './comparisonRender';

/**
 * Test suite for Reference View structural rendering.
 *
 * Tests focus on:
 * - Building aligned neutral pairs for side-by-side display
 * - Building aligned palette pairs with swatch alignment
 * - Rendering structural placeholders for missing items
 * - Preserving read-only semantics on reference side
 */

describe('comparisonRender', () => {
  describe('buildSideBySideNeutralAlignment', () => {
    it('aligns neutral swatches when both sides have same step count', () => {
      const currentNeutrals = ['#ffffff', '#cccccc', '#999999'];
      const referenceNeutrals = ['#ffffff', '#dddddd', '#888888'];

      const alignment = buildSideBySideNeutralAlignment(currentNeutrals, referenceNeutrals);

      expect(alignment.current.swatches).toHaveLength(3);
      expect(alignment.reference.swatches).toHaveLength(3);
      expect(alignment.alignmentMap).toHaveLength(3);

      // All steps should have valid mappings
      for (const map of alignment.alignmentMap) {
        expect(map.currentIndex).toBeDefined();
        expect(map.referenceIndex).toBeDefined();
      }
    });

    it('creates placeholder swatches when step counts differ', () => {
      const currentNeutrals = ['#ffffff', '#dddddd'];
      const referenceNeutrals = ['#ffffff', '#cccccc', '#999999', '#333333'];

      const alignment = buildSideBySideNeutralAlignment(currentNeutrals, referenceNeutrals);

      expect(alignment.current.swatches).toHaveLength(4);
      expect(alignment.reference.swatches).toHaveLength(4);

      // Current side should have placeholders for steps 2-3
      expect(alignment.current.swatches[2]?.isPlaceholder).toBe(true);
      expect(alignment.current.swatches[3]?.isPlaceholder).toBe(true);

      // Reference side should not have placeholders
      expect(alignment.reference.swatches[2]?.isPlaceholder).toBe(false);
      expect(alignment.reference.swatches[3]?.isPlaceholder).toBe(false);
    });

    it('marks current side as read-only false and reference side as read-only true', () => {
      const currentNeutrals = ['#ffffff', '#cccccc'];
      const referenceNeutrals = ['#ffffff', '#cccccc'];

      const alignment = buildSideBySideNeutralAlignment(currentNeutrals, referenceNeutrals);

      expect(alignment.current.readOnly).toBe(false);
      expect(alignment.reference.readOnly).toBe(true);
    });

    it('preserves color values for non-placeholder swatches', () => {
      const currentNeutrals = ['#ffffff', '#aaaaaa'];
      const referenceNeutrals = ['#ffffff', '#bbbbbb'];

      const alignment = buildSideBySideNeutralAlignment(currentNeutrals, referenceNeutrals);

      expect(alignment.current.swatches[0]?.hex).toBe('#ffffff');
      expect(alignment.current.swatches[1]?.hex).toBe('#aaaaaa');

      expect(alignment.reference.swatches[0]?.hex).toBe('#ffffff');
      expect(alignment.reference.swatches[1]?.hex).toBe('#bbbbbb');
    });
  });

  describe('buildSideBySidePaletteAlignments', () => {
    it('aligns palettes when both sides have same palette count', () => {
      const currentPalettes = [
        ['#ff0000', '#cc0000'],
        ['#00ff00', '#00cc00']
      ];
      const referencePalettes = [
        ['#ff0000', '#dd0000'],
        ['#00ff00', '#00dd00']
      ];

      const alignments = buildSideBySidePaletteAlignments(currentPalettes, referencePalettes);

      expect(alignments).toHaveLength(2);

      for (const alignment of alignments) {
        expect(alignment.current.swatches).toBeDefined();
        expect(alignment.reference.swatches).toBeDefined();
      }
    });

    it('creates placeholder palettes when palette counts differ', () => {
      const currentPalettes = [
        ['#ff0000', '#cc0000'],
        ['#00ff00', '#00cc00'],
        ['#0000ff', '#0000cc']
      ];
      const referencePalettes = [
        ['#ff0000', '#dd0000'],
        ['#00ff00', '#00dd00']
      ];

      const alignments = buildSideBySidePaletteAlignments(currentPalettes, referencePalettes);

      expect(alignments).toHaveLength(3);

      // Palette 0 and 1 should be normal
      expect(alignments[0]?.current.isPlaceholder).toBe(false);
      expect(alignments[0]?.reference.isPlaceholder).toBe(false);

      expect(alignments[1]?.current.isPlaceholder).toBe(false);
      expect(alignments[1]?.reference.isPlaceholder).toBe(false);

      // Palette 2 should have placeholder on reference side
      expect(alignments[2]?.current.isPlaceholder).toBe(false);
      expect(alignments[2]?.reference.isPlaceholder).toBe(true);
    });

    it('creates swatch alignment within each palette pair', () => {
      const currentPalettes = [['#ff0000', '#cc0000', '#990000']];
      const referencePalettes = [['#ff0000', '#dd0000']];

      const alignments = buildSideBySidePaletteAlignments(currentPalettes, referencePalettes);

      const paletteAlignment = alignments[0]!;

      expect(paletteAlignment.swatchAlignmentMap).toBeDefined();
      expect(paletteAlignment.swatchAlignmentMap.length).toBe(3);

      // Steps 0-1 have both sides
      expect(paletteAlignment.swatchAlignmentMap[0]?.currentIndex).toBe(0);
      expect(paletteAlignment.swatchAlignmentMap[0]?.referenceIndex).toBe(0);

      // Step 2 has only current side
      expect(paletteAlignment.swatchAlignmentMap[2]?.currentIndex).toBe(2);
      expect(paletteAlignment.swatchAlignmentMap[2]?.referenceIndex).toBeNull();
    });

    it('marks reference side as read-only for all palettes', () => {
      const currentPalettes = [['#ff0000', '#cc0000']];
      const referencePalettes = [['#ff0000', '#cc0000']];

      const alignments = buildSideBySidePaletteAlignments(currentPalettes, referencePalettes);

      for (const alignment of alignments) {
        expect(alignment.current.readOnly).toBe(false);
        expect(alignment.reference.readOnly).toBe(true);
      }
    });

    it('handles empty palette arrays', () => {
      const alignments = buildSideBySidePaletteAlignments([], []);
      expect(alignments).toEqual([]);
    });

    it('handles reference with more palettes than current', () => {
      const currentPalettes = [['#ff0000']];
      const referencePalettes = [['#ff0000'], ['#00ff00'], ['#0000ff']];

      const alignments = buildSideBySidePaletteAlignments(currentPalettes, referencePalettes);

      expect(alignments).toHaveLength(3);

      // Palette 0: both sides present
      expect(alignments[0]?.current.isPlaceholder).toBe(false);
      expect(alignments[0]?.reference.isPlaceholder).toBe(false);

      // Palettes 1-2: current side has placeholders
      expect(alignments[1]?.current.isPlaceholder).toBe(true);
      expect(alignments[1]?.reference.isPlaceholder).toBe(false);

      expect(alignments[2]?.current.isPlaceholder).toBe(true);
      expect(alignments[2]?.reference.isPlaceholder).toBe(false);
    });
  });

  describe('structural alignment edge cases', () => {
    it('handles single-step palettes', () => {
      const currentPalettes = [['#ff0000']];
      const referencePalettes = [['#ff0000']];

      const alignments = buildSideBySidePaletteAlignments(currentPalettes, referencePalettes);

      expect(alignments[0]?.current.swatches).toHaveLength(1);
      expect(alignments[0]?.reference.swatches).toHaveLength(1);
    });

    it('handles large step count differences', () => {
      const currentPalettes = [Array(3).fill('#ff0000')];
      const referencePalettes = [Array(15).fill('#ff0000')];

      const alignments = buildSideBySidePaletteAlignments(currentPalettes, referencePalettes);

      expect(alignments[0]?.current.swatches).toHaveLength(15);
      expect(alignments[0]?.reference.swatches).toHaveLength(15);

      // Current side has placeholders for steps 3-14
      for (let i = 3; i < 15; i++) {
        expect(alignments[0]?.current.swatches[i]?.isPlaceholder).toBe(true);
      }
    });

    it('handles many palette structural changes', () => {
      const currentPalettes = Array(20).fill(['#ff0000']);
      const referencePalettes = Array(8).fill(['#ff0000']);

      const alignments = buildSideBySidePaletteAlignments(currentPalettes, referencePalettes);

      expect(alignments).toHaveLength(20);

      // First 8 are non-placeholder pairs
      for (let i = 0; i < 8; i++) {
        expect(alignments[i]?.current.isPlaceholder).toBe(false);
        expect(alignments[i]?.reference.isPlaceholder).toBe(false);
      }

      // Last 12 have placeholder on reference side
      for (let i = 8; i < 20; i++) {
        expect(alignments[i]?.current.isPlaceholder).toBe(false);
        expect(alignments[i]?.reference.isPlaceholder).toBe(true);
      }
    });
  });

  describe('rendering semantics', () => {
    it('maintains swatch ordering for copy/export from reference side', () => {
      const currentPalettes = [['#ff0000', '#dd0000']];
      const referencePalettes = [['#ff0000', '#dd0000', '#bb0000']];

      const alignments = buildSideBySidePaletteAlignments(currentPalettes, referencePalettes);

      const refSwatches = alignments[0]?.reference.swatches ?? [];

      expect(refSwatches).toHaveLength(3);
      expect(refSwatches[0]?.hex).toBe('#ff0000');
      expect(refSwatches[1]?.hex).toBe('#dd0000');
      expect(refSwatches[2]?.hex).toBe('#bb0000');
    });

    it('preserves placeholder markers for layout correspondence', () => {
      const currentPalettes = [['#ff0000', '#cc0000']];
      const referencePalettes = [['#ff0000', '#dd0000', '#bb0000']];

      const alignments = buildSideBySidePaletteAlignments(currentPalettes, referencePalettes);

      const alignment = alignments[0]!;

      // Current side should have a placeholder at step 2
      expect(alignment.current.swatches[2]?.isPlaceholder).toBe(true);

      // This ensures the layout stays aligned visually
      expect(alignment.current.swatches).toHaveLength(3);
      expect(alignment.reference.swatches).toHaveLength(3);
    });
  });
});
