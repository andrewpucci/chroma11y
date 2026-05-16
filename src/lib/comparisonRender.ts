/**
 * Reference View Structural Rendering.
 *
 * Builds aligned structural pairs for side-by-side display when palette or step counts differ.
 * Applies deterministic Comparison Mapping and generates aligned placeholders.
 * Reference side remains read-only while supporting inspection and copy/export.
 */

import {
  mapNeutrals,
  mapGeneratedPalettes,
  mapSwatchesByStepIndex,
  createPlaceholderSwatch,
  type SwatchAlignment,
  type PaletteAlignment
} from './comparisonMapping';

/**
 * A renderable swatch with optional placeholder marker
 */
export interface RenderableSwatch {
  hex: string;
  isPlaceholder: boolean;
  stepIndex: number | null;
}

/**
 * A renderable palette with swatches and read-only semantics
 */
export interface RenderablePalette {
  swatches: RenderableSwatch[];
  isPlaceholder: boolean;
  readOnly: boolean;
  paletteIndex: number | null;
}

/**
 * A pair of neutral palettes aligned for side-by-side display
 */
export interface AlignedNeutralPair {
  current: RenderablePalette;
  reference: RenderablePalette;
  alignmentMap: SwatchAlignment[];
}

/**
 * A pair of palettes aligned for side-by-side display
 */
export interface AlignedPalettePair {
  current: RenderablePalette;
  reference: RenderablePalette;
  alignmentMap: PaletteAlignment[];
  swatchAlignmentMap: SwatchAlignment[];
}

/**
 * Convert a swatch hex string to a renderable swatch
 */
function hexToSwatch(hex: string, stepIndex: number): RenderableSwatch {
  return {
    hex,
    isPlaceholder: false,
    stepIndex
  };
}

/**
 * Convert a placeholder swatch marker to a renderable swatch
 */
function placeholderToSwatch(
  placeholder: ReturnType<typeof createPlaceholderSwatch>
): RenderableSwatch {
  return {
    hex: placeholder.hex,
    isPlaceholder: true,
    stepIndex: null
  };
}

/**
 * Build aligned neutral pair for side-by-side display.
 *
 * Applies swatch-level comparison mapping and creates placeholders
 * for missing steps. Reference side is marked read-only.
 *
 * @param currentNeutrals Current-side neutral hex colors
 * @param referenceNeutrals Reference-side neutral hex colors
 * @returns Aligned pair ready for rendering
 */
export function buildSideBySideNeutralAlignment(
  currentNeutrals: string[],
  referenceNeutrals: string[]
): AlignedNeutralPair {
  const alignmentMap = mapNeutrals(currentNeutrals, referenceNeutrals);

  const currentSwatches: RenderableSwatch[] = [];
  const referenceSwatches: RenderableSwatch[] = [];

  for (const alignment of alignmentMap) {
    // Current side
    if (alignment.currentIndex !== null) {
      currentSwatches.push(
        hexToSwatch(currentNeutrals[alignment.currentIndex]!, alignment.currentIndex)
      );
    } else {
      currentSwatches.push(placeholderToSwatch(alignment.placeholder!));
    }

    // Reference side
    if (alignment.referenceIndex !== null) {
      referenceSwatches.push(
        hexToSwatch(referenceNeutrals[alignment.referenceIndex]!, alignment.referenceIndex)
      );
    } else {
      referenceSwatches.push(placeholderToSwatch(alignment.placeholder!));
    }
  }

  return {
    current: {
      swatches: currentSwatches,
      isPlaceholder: false,
      readOnly: false,
      paletteIndex: 0
    },
    reference: {
      swatches: referenceSwatches,
      isPlaceholder: false,
      readOnly: true,
      paletteIndex: 0
    },
    alignmentMap
  };
}

/**
 * Build aligned palette pair for side-by-side display.
 *
 * Applies palette-level and swatch-level comparison mapping.
 * Creates placeholders for missing palettes and swatches.
 * Reference side is marked read-only.
 *
 * @param currentPalettes Current-side palettes
 * @param referencePalettes Reference-side palettes
 * @returns Aligned pairs ready for rendering
 */
export function buildSideBySidePaletteAlignments(
  currentPalettes: string[][],
  referencePalettes: string[][]
): AlignedPalettePair[] {
  const paletteAlignmentMap = mapGeneratedPalettes(currentPalettes, referencePalettes);

  const alignedPairs: AlignedPalettePair[] = [];

  for (const paletteAlignment of paletteAlignmentMap) {
    const currentSwatches: RenderableSwatch[] = [];
    const referenceSwatches: RenderableSwatch[] = [];

    let swatchAlignmentMap: SwatchAlignment[] = [];

    // If both sides have palettes, map their swatches
    if (paletteAlignment.currentIndex !== null && paletteAlignment.referenceIndex !== null) {
      const currentPalette = currentPalettes[paletteAlignment.currentIndex]!;
      const referencePalette = referencePalettes[paletteAlignment.referenceIndex]!;

      swatchAlignmentMap = mapSwatchesByStepIndex(currentPalette, referencePalette);

      for (const swatchAlignment of swatchAlignmentMap) {
        // Current side
        if (swatchAlignment.currentIndex !== null) {
          currentSwatches.push(
            hexToSwatch(currentPalette[swatchAlignment.currentIndex]!, swatchAlignment.currentIndex)
          );
        } else {
          currentSwatches.push(placeholderToSwatch(swatchAlignment.placeholder!));
        }

        // Reference side
        if (swatchAlignment.referenceIndex !== null) {
          referenceSwatches.push(
            hexToSwatch(
              referencePalette[swatchAlignment.referenceIndex]!,
              swatchAlignment.referenceIndex
            )
          );
        } else {
          referenceSwatches.push(placeholderToSwatch(swatchAlignment.placeholder!));
        }
      }
    } else if (paletteAlignment.currentIndex !== null && paletteAlignment.placeholder) {
      // Current has palette, reference doesn't
      const currentPalette = currentPalettes[paletteAlignment.currentIndex]!;
      const refPlaceholder = paletteAlignment.placeholder;

      swatchAlignmentMap = Array(currentPalette.length)
        .fill(null)
        .map((_, i) => ({
          currentIndex: i,
          referenceIndex: null,
          placeholder: createPlaceholderSwatch()
        }));

      for (let i = 0; i < currentPalette.length; i++) {
        currentSwatches.push(hexToSwatch(currentPalette[i]!, i));
        referenceSwatches.push(placeholderToSwatch(refPlaceholder.swatches[i]!));
      }
    } else if (paletteAlignment.referenceIndex !== null && paletteAlignment.placeholder) {
      // Reference has palette, current doesn't
      const referencePalette = referencePalettes[paletteAlignment.referenceIndex]!;
      const refPlaceholder = paletteAlignment.placeholder;

      swatchAlignmentMap = Array(referencePalette.length)
        .fill(null)
        .map((_, i) => ({
          currentIndex: null,
          referenceIndex: i,
          placeholder: createPlaceholderSwatch()
        }));

      for (let i = 0; i < referencePalette.length; i++) {
        currentSwatches.push(placeholderToSwatch(refPlaceholder.swatches[i]!));
        referenceSwatches.push(hexToSwatch(referencePalette[i]!, i));
      }
    }

    alignedPairs.push({
      current: {
        swatches: currentSwatches,
        isPlaceholder: paletteAlignment.currentIndex === null,
        readOnly: false,
        paletteIndex: paletteAlignment.currentIndex
      },
      reference: {
        swatches: referenceSwatches,
        isPlaceholder: paletteAlignment.referenceIndex === null,
        readOnly: true,
        paletteIndex: paletteAlignment.referenceIndex
      },
      alignmentMap: [paletteAlignment],
      swatchAlignmentMap
    });
  }

  return alignedPairs;
}
