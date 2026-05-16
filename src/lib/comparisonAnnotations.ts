/**
 * Comparison View Change Annotations
 *
 * Provides annotation of differences between current and reference palettes
 * at three levels:
 * - Swatch-level: Individual color differences with metrics
 * - Structural: Palette/step count changes and additions/removals
 * - Visual: De-emphasis markers for unchanged content
 *
 * Annotations are computed live as the current palette configuration changes,
 * and respect a configurable threshold for change significance.
 */

import type { ColorDifferenceMetric } from './types';
import Color from 'colorjs.io';

/**
 * Annotation for a single swatch comparison
 */
export interface AnnotatedSwatch {
  /** Hex representation of the swatch */
  hex: string;
  /** Whether this swatch changed compared to reference */
  changed: boolean;
  /** Current-side hex (may differ from hex if changed) */
  currentHex: string;
  /** Reference-side hex */
  referenceHex: string;
  /** Color difference metric value (undefined if unchanged) */
  colorDifference?: number;
  /** Whether this swatch should be visually de-emphasized */
  quiet?: boolean;
}

/**
 * Annotation for a palette (collection of swatches)
 */
export interface AnnotatedPalette {
  /** Swatches with annotations */
  swatches: AnnotatedSwatch[];
  /** Index of this palette (null for placeholders) */
  paletteIndex: number | null;
  /** Whether this is a structural placeholder */
  isPlaceholder: boolean;
  /** Whether this palette is read-only (reference side) */
  readOnly: boolean;
}

/**
 * Change annotation for a single difference
 */
export interface ChangeAnnotation {
  /** Type of change detected */
  type: 'swatch-color-change' | 'swatch-added' | 'swatch-removed';
  /** Magnitude of change (for color changes) */
  magnitude?: number;
  /** Additional context about the change */
  metadata?: Record<string, unknown>;
}

/**
 * Structural change annotation
 */
export interface StructuralChangeAnnotation {
  /** Type of structural change */
  type: 'neutral-steps-added' | 'neutral-steps-removed' | 'palettes-added' | 'palettes-removed';
  /** Count before change */
  previousCount: number;
  /** Count after change */
  currentCount: number;
}

/**
 * Result of structural change annotation
 */
export interface StructuralChangeResult {
  /** Whether any structural changes were detected */
  hasChanges: boolean;
  /** List of detected changes */
  changes: StructuralChangeAnnotation[];
}

/**
 * Helper to parse hex colors and compute difference using specified metric
 */
function computeColorDifference(hex1: string, hex2: string, metric: ColorDifferenceMetric): number {
  try {
    const color1 = new Color(hex1);
    const color2 = new Color(hex2);

    const difference = metric === 'ok' ? color1.deltaEOK(color2) : color1.deltaE2000(color2);
    return difference;
  } catch {
    // If color parsing fails, return a high difference
    return 100;
  }
}

/**
 * Annotate swatch-level color differences between current and reference swatches.
 *
 * Compares hex colors using the specified metric and threshold to determine
 * if each swatch has changed. Returns annotated swatches suitable for rendering.
 *
 * @param currentSwatches Current-side hex colors
 * @param referenceSwatches Reference-side hex colors
 * @param metric Color difference metric to use (ok, lab, or deltaE2000)
 * @param thresholdPercent Minimum change magnitude to consider as significant (0-100)
 * @returns Annotated swatches with change markers
 */
export function annotateColorDifferences(
  currentSwatches: string[],
  referenceSwatches: string[],
  metric: ColorDifferenceMetric,
  thresholdPercent: number
): AnnotatedSwatch[] {
  const annotations: AnnotatedSwatch[] = [];

  // Process each swatch, aligning by index
  const length = Math.max(currentSwatches.length, referenceSwatches.length);

  for (let i = 0; i < length; i++) {
    const currentHex = currentSwatches[i];
    const referenceHex = referenceSwatches[i];

    // If either side is missing, mark as changed (structural change)
    if (!currentHex || !referenceHex) {
      const hex = currentHex || referenceHex || '#000000';
      annotations.push({
        hex,
        currentHex: currentHex || '#000000',
        referenceHex: referenceHex || '#000000',
        changed: true
      });
      continue;
    }

    // Compute color difference
    const colorDifference = computeColorDifference(currentHex, referenceHex, metric);

    // Normalize to 0-100 range for easier threshold comparison
    // OkLCH differences typically range 0-3, Lab differences 0-100+, so normalize
    const normalizedDifference = Math.min(colorDifference, 100);

    const changed = normalizedDifference > thresholdPercent;

    annotations.push({
      hex: currentHex,
      currentHex,
      referenceHex,
      changed,
      colorDifference: changed ? colorDifference : undefined
    });
  }

  return annotations;
}

/**
 * Annotate structural changes between current and reference palette configurations.
 *
 * Detects changes in:
 * - Number of neutral steps
 * - Number of generated palettes
 * - Steps per palette (stride changes)
 *
 * @param currentStructure Current palette structure
 * @param referenceStructure Reference palette structure
 * @returns Structural change annotations and summary
 */
export function annotateStructuralChanges(
  currentStructure: {
    numNeutralSteps: number;
    numPalettes: number;
    stepsPerPalette: number;
  },
  referenceStructure: {
    numNeutralSteps: number;
    numPalettes: number;
    stepsPerPalette: number;
  }
): StructuralChangeResult {
  const changes: StructuralChangeAnnotation[] = [];

  // Check neutral steps
  if (currentStructure.numNeutralSteps !== referenceStructure.numNeutralSteps) {
    if (currentStructure.numNeutralSteps > referenceStructure.numNeutralSteps) {
      changes.push({
        type: 'neutral-steps-added',
        previousCount: referenceStructure.numNeutralSteps,
        currentCount: currentStructure.numNeutralSteps
      });
    } else {
      changes.push({
        type: 'neutral-steps-removed',
        previousCount: referenceStructure.numNeutralSteps,
        currentCount: currentStructure.numNeutralSteps
      });
    }
  }

  // Check palette count
  if (currentStructure.numPalettes !== referenceStructure.numPalettes) {
    if (currentStructure.numPalettes > referenceStructure.numPalettes) {
      changes.push({
        type: 'palettes-added',
        previousCount: referenceStructure.numPalettes,
        currentCount: currentStructure.numPalettes
      });
    } else {
      changes.push({
        type: 'palettes-removed',
        previousCount: referenceStructure.numPalettes,
        currentCount: currentStructure.numPalettes
      });
    }
  }

  return {
    hasChanges: changes.length > 0,
    changes
  };
}

/**
 * Mark unchanged swatches as "quiet" for visual de-emphasis.
 *
 * Swatches that haven't changed are marked with quiet=true, which allows
 * rendering to reduce visual prominence while keeping them visible.
 * This supports the design goal of keeping unchanged content visible but
 * visually quieter.
 *
 * @param swatches Annotated swatches to mark
 * @returns Swatches with quiet markers added
 */
export function markUnchangedAsQuiet(swatches: AnnotatedSwatch[]): AnnotatedSwatch[] {
  return swatches.map((swatch) => ({
    ...swatch,
    quiet: !swatch.changed
  }));
}
