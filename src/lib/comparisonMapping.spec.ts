import { describe, expect, it } from 'vitest';
import {
  mapNeutrals,
  mapGeneratedPalettes,
  mapSwatchesByStepIndex,
  createPlaceholderSwatch,
  createPlaceholderPalette
} from './comparisonMapping';

/**
 * Test suite for deterministic comparison mapping rules.
 *
 * Tests focus on:
 * - Neutral-to-neutral mapping (always index 0)
 * - Generated palettes mapped by slot index
 * - Swatches mapped by step index
 * - Structural placeholder generation for missing palettes or steps
 */

describe('comparisonMapping', () => {
  describe('mapNeutrals', () => {
    it('always maps neutral to neutral regardless of step count', () => {
      const currentNeutrals = ['#ffffff', '#cccccc', '#999999', '#333333'];
      const referenceNeutrals = ['#ffffff', '#aaaaaa'];

      const mapping = mapNeutrals(currentNeutrals, referenceNeutrals);

      expect(mapping.length).toBeGreaterThan(0);
      expect(mapping[0]).toEqual({
        currentIndex: 0,
        referenceIndex: 0,
        placeholder: null
      });
    });

    it('creates placeholder on reference side when current has more steps', () => {
      const currentNeutrals = ['#ffffff', '#cccccc', '#999999'];
      const referenceNeutrals = ['#ffffff', '#888888'];

      const mapping = mapNeutrals(currentNeutrals, referenceNeutrals);

      const mappedCurrentIndices = mapping.map((m) => m.currentIndex);
      const mappedRefIndices = mapping.map((m) => m.referenceIndex);

      expect(mappedCurrentIndices).toContain(2);
      expect(mappedRefIndices).toContain(null);
    });

    it('creates placeholder on current side when reference has more steps', () => {
      const currentNeutrals = ['#ffffff', '#888888'];
      const referenceNeutrals = ['#ffffff', '#cccccc', '#999999', '#333333'];

      const mapping = mapNeutrals(currentNeutrals, referenceNeutrals);

      const mappedCurrentIndices = mapping.map((m) => m.currentIndex);
      const mappedRefIndices = mapping.map((m) => m.referenceIndex);

      expect(mappedCurrentIndices).toContain(null);
      expect(mappedRefIndices).toContain(2);
    });

    it('maintains deterministic order: existing steps first, then placeholders', () => {
      const currentNeutrals = ['#ffffff', '#eeeeee'];
      const referenceNeutrals = ['#ffffff', '#dddddd', '#cccccc'];

      const mapping = mapNeutrals(currentNeutrals, referenceNeutrals);

      // First steps should be non-placeholder mappings
      expect(mapping[0]?.currentIndex).toBe(0);
      expect(mapping[0]?.referenceIndex).toBe(0);

      expect(mapping[1]?.currentIndex).toBe(1);
      expect(mapping[1]?.referenceIndex).toBe(1);

      // Placeholders come after
      const firstPlaceholder = mapping.find((m) => m.placeholder !== null);
      expect(firstPlaceholder).toBeDefined();
    });
  });

  describe('mapGeneratedPalettes', () => {
    it('maps generated palettes by slot index deterministically', () => {
      const currentPalettes = [
        ['#ff0000', '#cc0000', '#990000'],
        ['#00ff00', '#00cc00', '#009900'],
        ['#0000ff', '#0000cc', '#000099']
      ];
      const referencePalettes = [
        ['#ff0000', '#ee0000'],
        ['#00ff00', '#00ee00']
      ];

      const mapping = mapGeneratedPalettes(currentPalettes, referencePalettes);

      // First palette current maps to first reference palette
      expect(mapping[0]?.currentIndex).toBe(0);
      expect(mapping[0]?.referenceIndex).toBe(0);

      // Second palette current maps to second reference palette
      expect(mapping[1]?.currentIndex).toBe(1);
      expect(mapping[1]?.referenceIndex).toBe(1);

      // Third palette current has no reference, placeholder on ref side
      expect(mapping[2]?.currentIndex).toBe(2);
      expect(mapping[2]?.referenceIndex).toBeNull();
    });

    it('creates placeholder on current side when reference has more palettes', () => {
      const currentPalettes = [['#ff0000', '#cc0000']];
      const referencePalettes = [
        ['#ff0000', '#cc0000'],
        ['#00ff00', '#00cc00'],
        ['#0000ff', '#0000cc']
      ];

      const mapping = mapGeneratedPalettes(currentPalettes, referencePalettes);

      expect(mapping.length).toBe(3);
      expect(mapping[0]?.currentIndex).toBe(0);
      expect(mapping[0]?.referenceIndex).toBe(0);

      expect(mapping[1]?.currentIndex).toBeNull();
      expect(mapping[1]?.referenceIndex).toBe(1);

      expect(mapping[2]?.currentIndex).toBeNull();
      expect(mapping[2]?.referenceIndex).toBe(2);
    });

    it('returns empty array when both sides have no generated palettes', () => {
      const mapping = mapGeneratedPalettes([], []);
      expect(mapping).toEqual([]);
    });
  });

  describe('mapSwatchesByStepIndex', () => {
    it('maps swatches by step index deterministically', () => {
      const currentSwatches = ['#ff0000', '#ee0000', '#cc0000', '#990000'];
      const referenceSwatches = ['#ff0000', '#dd0000'];

      const mapping = mapSwatchesByStepIndex(currentSwatches, referenceSwatches);

      expect(mapping[0]).toEqual({
        currentIndex: 0,
        referenceIndex: 0,
        placeholder: null
      });

      expect(mapping[1]).toEqual({
        currentIndex: 1,
        referenceIndex: 1,
        placeholder: null
      });

      // Step 2 has no reference, gets placeholder
      expect(mapping[2]?.currentIndex).toBe(2);
      expect(mapping[2]?.referenceIndex).toBeNull();
    });

    it('creates placeholders on both sides as needed', () => {
      const currentSwatches = ['#ff0000', '#cc0000'];
      const referenceSwatches = ['#ff0000', '#dd0000', '#bb0000', '#990000'];

      const mapping = mapSwatchesByStepIndex(currentSwatches, referenceSwatches);

      expect(mapping.length).toBe(4);

      // Steps 0-1 map normally
      expect(mapping[0]?.currentIndex).toBe(0);
      expect(mapping[0]?.referenceIndex).toBe(0);

      expect(mapping[1]?.currentIndex).toBe(1);
      expect(mapping[1]?.referenceIndex).toBe(1);

      // Steps 2-3 only exist on reference, current side gets placeholders
      expect(mapping[2]?.currentIndex).toBeNull();
      expect(mapping[2]?.referenceIndex).toBe(2);

      expect(mapping[3]?.currentIndex).toBeNull();
      expect(mapping[3]?.referenceIndex).toBe(3);
    });
  });

  describe('createPlaceholderSwatch', () => {
    it('creates a placeholder swatch marker', () => {
      const placeholder = createPlaceholderSwatch();

      expect(placeholder.hex).toBe('#000000');
      expect(placeholder.isPlaceholder).toBe(true);
      expect(placeholder.stepIndex).toBeNull();
    });
  });

  describe('createPlaceholderPalette', () => {
    it('creates a placeholder palette with correct step count', () => {
      const placeholder = createPlaceholderPalette(5);

      expect(placeholder.isPlaceholder).toBe(true);
      expect(placeholder.swatches).toHaveLength(5);
      expect(placeholder.swatches.every((s) => s.isPlaceholder)).toBe(true);
    });

    it('preserves step count when creating placeholder for different swatch counts', () => {
      expect(createPlaceholderPalette(3).swatches).toHaveLength(3);
      expect(createPlaceholderPalette(11).swatches).toHaveLength(11);
      expect(createPlaceholderPalette(1).swatches).toHaveLength(1);
    });
  });

  describe('integration: divergent palette and step counts', () => {
    it('handles current with 11 palettes, 11 steps vs reference with 5 palettes, 7 steps', () => {
      const paletteMapping = mapGeneratedPalettes(
        Array(11).fill(['#000000']),
        Array(5).fill(['#000000'])
      );

      expect(paletteMapping).toHaveLength(11);

      // First 5 have both sides, rest have placeholder on ref side
      expect(
        paletteMapping
          .slice(0, 5)
          .every((m) => m.currentIndex !== null && m.referenceIndex !== null)
      ).toBe(true);
      expect(paletteMapping.slice(5).every((m) => m.referenceIndex === null)).toBe(true);
    });

    it('handles reference with more palettes than current', () => {
      const currentCount = 3;
      const referenceCount = 8;

      const paletteMapping = mapGeneratedPalettes(
        Array(currentCount).fill(['#000000']),
        Array(referenceCount).fill(['#000000'])
      );

      expect(paletteMapping).toHaveLength(8);
      expect(paletteMapping.slice(3).every((m) => m.currentIndex === null)).toBe(true);
    });

    it('handles structural changes in both palette count and step count', () => {
      // Current: 7 palettes, 9 steps
      // Reference: 5 palettes, 11 steps
      const currentPalettes = Array(7).fill(Array(9).fill('#000000'));
      const referencePalettes = Array(5).fill(Array(11).fill('#000000'));

      const paletteMapping = mapGeneratedPalettes(currentPalettes, referencePalettes);
      expect(paletteMapping).toHaveLength(7);

      // Test step mapping for palette 0 (exists on both sides)
      const swatchMapping = mapSwatchesByStepIndex(currentPalettes[0]!, referencePalettes[0]!);
      expect(swatchMapping).toHaveLength(11); // Max of 9 and 11
    });
  });

  describe('deterministic ordering guarantees', () => {
    it('always outputs existing items before placeholders', () => {
      const currentSwatches = ['#ffffff', '#888888'];
      const referenceSwatches = ['#ffffff', '#cccccc', '#999999'];

      const mapping = mapSwatchesByStepIndex(currentSwatches, referenceSwatches);

      // All non-placeholder entries should come before placeholder entries
      let seenPlaceholder = false;
      for (const entry of mapping) {
        if (entry.placeholder !== null) {
          seenPlaceholder = true;
        } else if (seenPlaceholder) {
          throw new Error('Non-placeholder entry found after placeholder entry');
        }
      }

      expect(seenPlaceholder).toBe(true);
    });

    it('maintains consistent behavior across multiple calls with same inputs', () => {
      const currentPalettes = [
        ['#ff0000', '#cc0000'],
        ['#00ff00', '#00cc00']
      ];
      const referencePalettes = [
        ['#ff0000', '#dd0000'],
        ['#00ff00', '#00dd00'],
        ['#0000ff', '#0000dd']
      ];

      const mapping1 = mapGeneratedPalettes(currentPalettes, referencePalettes);
      const mapping2 = mapGeneratedPalettes(currentPalettes, referencePalettes);

      expect(mapping1).toEqual(mapping2);
    });
  });
});
