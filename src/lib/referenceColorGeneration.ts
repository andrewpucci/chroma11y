/**
 * Reference color generation utilities for rendering frozen reference configurations
 */

import { generatePalettes, type ColorGenParams } from '$lib/colorUtils';
import { colorToCssHex, colorToCssRender, colorToCssSwatchRender } from '$lib/colorUtils';
import type Color from 'colorjs.io';
import type { ReferenceConfiguration } from './referenceConfiguration';
import type { CvdMode, DisplayColorSpace, GamutSpace } from './types';

/**
 * Generated colors from a reference configuration
 */
export interface ReferenceGeneratedColors {
  neutrals: Color[];
  palettes: Color[][];
  neutralsHex: string[];
  palettesHex: string[][];
  neutralsDisplay: string[];
  palettesDisplay: string[][];
  neutralsSwatchDisplay: string[];
  palettesSwatchDisplay: string[][];
  neutralsSimulatedDisplay: string[] | null;
  palettesSimulatedDisplay: string[][] | null;
}

export interface ReferenceRenderSettings {
  cvdMode?: CvdMode;
  displayColorSpace: DisplayColorSpace;
  gamutSpace: GamutSpace;
}

/**
 * The solved reference Color objects, before any display formatting. Depends only
 * on the frozen reference configuration and the gamut used during generation.
 */
export interface ReferenceColorObjects {
  neutrals: Color[];
  palettes: Color[][];
}

/**
 * Runs the (expensive) palette solve for a frozen reference configuration.
 * Display-only settings (color space, CVD simulation) are intentionally excluded
 * so this only needs to re-run when the reference or gamut actually changes.
 */
export function generateReferenceColorObjects(
  reference: ReferenceConfiguration,
  gamutSpace: GamutSpace
): ReferenceColorObjects {
  const params: ColorGenParams = {
    numColors: reference.numColors,
    numPalettes: reference.numPalettes,
    baseColor: reference.baseColor,
    warmth: reference.warmth,
    warmthHue: reference.warmthHue,
    x1: reference.x1,
    y1: reference.y1,
    x2: reference.x2,
    y2: reference.y2,
    chromaMultiplier: reference.chromaMultiplier,
    currentTheme: reference.resolvedTheme,
    lightnessNudgers: reference.lightnessNudgers,
    hueNudgers: reference.hueNudgers,
    stepSaturationNudgers: reference.stepSaturationNudgers,
    paletteSaturationNudgers: reference.paletteSaturationNudgers,
    paletteChromaNudgers: reference.paletteChromaNudgers,
    gamutSpace
  };

  const result = generatePalettes(params);
  return { neutrals: result.neutrals, palettes: result.palettes };
}

/**
 * Formats already-solved reference Color objects into the hex/display strings
 * the UI reads. Cheap relative to the solve, so it can re-run on display-only
 * setting changes without re-solving the palettes.
 */
export function formatReferenceColors(
  colors: ReferenceColorObjects,
  settings: ReferenceRenderSettings
): ReferenceGeneratedColors {
  const { cvdMode = 'none', displayColorSpace, gamutSpace } = settings;
  const { neutrals, palettes } = colors;

  const neutralsHex = neutrals.map((c) => colorToCssHex(c));
  const palettesHex = palettes.map((palette) => palette.map((c) => colorToCssHex(c)));

  const neutralsDisplay = neutrals.map((c) => colorToCssRender(c, displayColorSpace, gamutSpace));
  const palettesDisplay = palettes.map((palette) =>
    palette.map((c) => colorToCssRender(c, displayColorSpace, gamutSpace))
  );

  const neutralsSwatchDisplay = neutrals.map((c) =>
    colorToCssSwatchRender(c, displayColorSpace, gamutSpace, 4)
  );
  const palettesSwatchDisplay = palettes.map((palette) =>
    palette.map((c) => colorToCssSwatchRender(c, displayColorSpace, gamutSpace, 4))
  );

  const neutralsSimulatedDisplay =
    cvdMode === 'none'
      ? null
      : neutrals.map((c) => colorToCssRender(c, displayColorSpace, gamutSpace, cvdMode));

  const palettesSimulatedDisplay =
    cvdMode === 'none'
      ? null
      : palettes.map((palette) =>
          palette.map((c) => colorToCssRender(c, displayColorSpace, gamutSpace, cvdMode))
        );

  return {
    neutrals,
    palettes,
    neutralsHex,
    palettesHex,
    neutralsDisplay,
    palettesDisplay,
    neutralsSwatchDisplay,
    palettesSwatchDisplay,
    neutralsSimulatedDisplay,
    palettesSimulatedDisplay
  };
}

/**
 * Convenience composition of {@link generateReferenceColorObjects} and
 * {@link formatReferenceColors}. Prefer calling the two halves separately when
 * display settings change independently of the reference configuration.
 */
export function generateColorsFromReference(
  reference: ReferenceConfiguration,
  settings: ReferenceRenderSettings
): ReferenceGeneratedColors {
  const colors = generateReferenceColorObjects(reference, settings.gamutSpace);
  return formatReferenceColors(colors, settings);
}
