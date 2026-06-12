/**
 * Comparison Mapping - deterministic rules for aligning current and reference configurations
 *
 * Rules:
 * - Neutral palettes always map to neutral palettes (index 0)
 * - Generated palettes map by slot index
 * - Swatches map by step index
 * - Structural additions/removals render as aligned placeholders on the missing side
 * - Existing items are ordered before placeholders
 */

/**
 * A placeholder marker for swatches that don't exist on one side
 */
export interface PlaceholderSwatch {
  hex: string;
  isPlaceholder: true;
  stepIndex: null;
}

/**
 * A placeholder marker for palettes that don't exist on one side
 */
export interface PlaceholderPalette {
  isPlaceholder: true;
  swatches: PlaceholderSwatch[];
}

/**
 * Alignment result for a single swatch pair
 */
export interface SwatchAlignment {
  currentIndex: number | null;
  referenceIndex: number | null;
  placeholder: PlaceholderSwatch | null;
}

/**
 * Alignment result for a palette pair
 */
export interface PaletteAlignment {
  currentIndex: number | null;
  referenceIndex: number | null;
  placeholder: PlaceholderPalette | null;
}

/**
 * Complete comparison mapping between current and reference configurations
 */
export interface ComparisonMapping {
  neutrals: SwatchAlignment[];
  generatedPalettes: PaletteAlignment[];
}

/**
 * Creates a placeholder swatch marker
 */
export function createPlaceholderSwatch(): PlaceholderSwatch {
  return {
    hex: '#000000',
    isPlaceholder: true,
    stepIndex: null
  };
}

/**
 * Creates a placeholder palette with the specified step count
 */
export function createPlaceholderPalette(stepCount: number): PlaceholderPalette {
  return {
    isPlaceholder: true,
    swatches: Array(stepCount)
      .fill(null)
      .map(() => createPlaceholderSwatch())
  };
}

/**
 * Maps generated palettes by slot index, handling palette count differences.
 * Returns alignments with existing palettes first, then placeholders.
 */
export function mapGeneratedPalettes(
  currentPalettes: string[][],
  referencePalettes: string[][]
): PaletteAlignment[] {
  if (currentPalettes.length === 0 && referencePalettes.length === 0) {
    return [];
  }

  const alignments: PaletteAlignment[] = [];

  // First pass: map existing palettes
  for (let i = 0; i < Math.min(currentPalettes.length, referencePalettes.length); i++) {
    alignments.push({
      currentIndex: i,
      referenceIndex: i,
      placeholder: null
    });
  }

  // Second pass: add placeholders for extra palettes on current side
  for (
    let i = Math.min(currentPalettes.length, referencePalettes.length);
    i < currentPalettes.length;
    i++
  ) {
    alignments.push({
      currentIndex: i,
      referenceIndex: null,
      placeholder: createPlaceholderPalette(currentPalettes[i]!.length)
    });
  }

  // Third pass: add placeholders for extra palettes on reference side
  for (
    let i = Math.min(currentPalettes.length, referencePalettes.length);
    i < referencePalettes.length;
    i++
  ) {
    alignments.push({
      currentIndex: null,
      referenceIndex: i,
      placeholder: createPlaceholderPalette(referencePalettes[i]!.length)
    });
  }

  return alignments;
}

/**
 * Maps swatches within a palette by step index, handling step count differences.
 * Returns alignments with existing steps first, then placeholders.
 */
export function mapSwatchesByStepIndex(
  currentSwatches: string[],
  referenceSwatches: string[]
): SwatchAlignment[] {
  const alignments: SwatchAlignment[] = [];

  // First pass: map existing steps
  for (let i = 0; i < Math.min(currentSwatches.length, referenceSwatches.length); i++) {
    alignments.push({
      currentIndex: i,
      referenceIndex: i,
      placeholder: null
    });
  }

  // Second pass: add placeholders for extra steps on current side
  for (
    let i = Math.min(currentSwatches.length, referenceSwatches.length);
    i < currentSwatches.length;
    i++
  ) {
    alignments.push({
      currentIndex: i,
      referenceIndex: null,
      placeholder: createPlaceholderSwatch()
    });
  }

  // Third pass: add placeholders for extra steps on reference side
  for (
    let i = Math.min(currentSwatches.length, referenceSwatches.length);
    i < referenceSwatches.length;
    i++
  ) {
    alignments.push({
      currentIndex: null,
      referenceIndex: i,
      placeholder: createPlaceholderSwatch()
    });
  }

  return alignments;
}

/**
 * Maps neutral palettes (always index 0 to 0), handling step count differences.
 * Neutrals align by step index exactly like swatches within a palette.
 */
export const mapNeutrals = mapSwatchesByStepIndex;
