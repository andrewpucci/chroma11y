/**
 * Stores unit tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import Color from 'colorjs.io';
import { colorToCssOklch, colorToCssOklchSwatch } from './colorUtils';
import {
  colorStore,
  currentTheme,
  contrastColors,
  contrastMode,
  lowStep,
  highStep,
  lowReference,
  highReference,
  neutrals,
  palettes,
  neutralsHex,
  palettesHex,
  numColors,
  numPalettes,
  baseColor,
  warmth,
  chromaMultiplier,
  x1,
  y1,
  x2,
  y2,
  lightnessNudgers,
  hueNudgers,
  displayColorSpace,
  gamutSpace,
  themePreference,
  swatchLabels,
  showSwatchGamutWarnings,
  showSwatchContrastIndicators,
  swatchContrastIndicators,
  contrastAlgorithm,
  solveAdjacentStopLows,
  oklchDisplaySignificantDigits,
  constraints,
  solverAdjustmentSnapshot,
  constraintSolverSummary,
  neutralsDisplay,
  palettesDisplay,
  neutralsSwatchDisplay,
  palettesSwatchDisplay,
  referenceConfiguration,
  comparisonMetric,
  swatchChangeThreshold,
  updateColorState,
  setTheme,
  setThemePreference,
  setComparisonMetric,
  setSwatchChangeThreshold,
  updateLightnessNudger,
  updateHueNudger,
  updateContrastFromNeutrals,
  updateContrastStep,
  updateContrastReference,
  addConstraint,
  removeConstraint,
  setSolverAdjustmentSnapshot,
  setConstraintSolverSummary,
  pinReferenceConfiguration,
  clearReferenceConfiguration,
  restoreReferenceConfiguration,
  replaceReferenceConfiguration,
  resetColorState
} from './stores';

describe('stores', () => {
  beforeEach(() => {
    resetColorState('light');
  });

  describe('derived stores', () => {
    it('currentTheme reflects colorStore.currentTheme', () => {
      expect.assertions(1);
      expect(get(currentTheme)).toBe('light');
    });

    it('contrastColors reflects colorStore.contrast', () => {
      expect.assertions(1);
      const colors = get(contrastColors);
      expect(colors).toEqual({ low: '#ffffff', high: '#000000' });
    });

    it('contrastMode reflects colorStore.contrastMode', () => {
      expect.assertions(1);
      expect(get(contrastMode)).toBe('auto');
    });

    it('lowStep reflects colorStore.lowStep', () => {
      expect.assertions(1);
      expect(get(lowStep)).toBe(0);
    });

    it('highStep reflects colorStore.highStep', () => {
      expect.assertions(1);
      expect(get(highStep)).toBe(10);
    });

    it('contrast references reflect colorStore references', () => {
      expect.assertions(2);
      expect(get(lowReference)).toEqual({ kind: 'neutral', stepIndex: 0 });
      expect(get(highReference)).toEqual({ kind: 'neutral', stepIndex: 10 });
    });

    it('neutrals reflects colorStore.neutrals', () => {
      expect.assertions(1);
      expect(get(neutrals)).toEqual([]);
    });

    it('palettes reflects colorStore.palettes', () => {
      expect.assertions(1);
      expect(get(palettes)).toEqual([]);
    });

    it('numColors reflects colorStore.numColors', () => {
      expect.assertions(1);
      expect(get(numColors)).toBe(11);
    });

    it('numPalettes reflects colorStore.numPalettes', () => {
      expect.assertions(1);
      expect(get(numPalettes)).toBe(11);
    });

    it('baseColor reflects colorStore.baseColor', () => {
      expect.assertions(1);
      expect(get(baseColor)).toBe('#5EF784');
    });

    it('warmth reflects colorStore.warmth', () => {
      expect.assertions(1);
      expect(get(warmth)).toBe(-7);
    });

    it('chromaMultiplier reflects colorStore.chromaMultiplier', () => {
      expect.assertions(1);
      expect(get(chromaMultiplier)).toBe(1);
    });

    it('bezier control points reflect colorStore values', () => {
      expect.assertions(4);
      expect(get(x1)).toBe(0.16);
      expect(get(y1)).toBe(0.0);
      expect(get(x2)).toBe(0.28);
      expect(get(y2)).toBe(0.38);
    });

    it('lightnessNudgers reflects colorStore.lightnessNudgers', () => {
      expect.assertions(1);
      expect(get(lightnessNudgers)).toEqual([]);
    });

    it('hueNudgers reflects colorStore.hueNudgers', () => {
      expect.assertions(1);
      expect(get(hueNudgers)).toEqual([]);
    });

    it('displayColorSpace reflects colorStore.displayColorSpace', () => {
      expect.assertions(1);
      expect(get(displayColorSpace)).toBe('hex');
    });

    it('gamutSpace reflects colorStore.gamutSpace', () => {
      expect.assertions(1);
      expect(get(gamutSpace)).toBe('srgb');
    });

    it('themePreference reflects colorStore.themePreference', () => {
      expect.assertions(1);
      expect(get(themePreference)).toBe('auto');
    });

    it('swatchLabels reflects colorStore.swatchLabels', () => {
      expect.assertions(1);
      expect(get(swatchLabels)).toBe('both');
    });

    it('showSwatchContrastIndicators reflects colorStore.showSwatchContrastIndicators', () => {
      expect.assertions(1);
      expect(get(showSwatchContrastIndicators)).toBe(true);
    });

    it('showSwatchGamutWarnings reflects colorStore.showSwatchGamutWarnings', () => {
      expect.assertions(1);
      expect(get(showSwatchGamutWarnings)).toBe(true);
    });

    it('swatchContrastIndicators reflects colorStore.swatchContrastIndicators', () => {
      expect.assertions(1);
      expect(get(swatchContrastIndicators)).toEqual({
        wcagThreeToOne: true,
        wcagAA: true,
        wcagAAA: true,
        apcaLarge: true,
        apcaFluent: true,
        apcaBody: true
      });
    });

    it('contrastAlgorithm reflects colorStore.contrastAlgorithm', () => {
      expect.assertions(1);
      expect(get(contrastAlgorithm)).toBe('WCAG');
    });

    it('solveAdjacentStopLows reflects colorStore.solveAdjacentStopLows', () => {
      expect.assertions(1);
      expect(get(solveAdjacentStopLows)).toBe(true);
    });

    it('oklchDisplaySignificantDigits reflects colorStore.oklchDisplaySignificantDigits', () => {
      expect.assertions(1);
      expect(get(oklchDisplaySignificantDigits)).toBe(4);
    });

    it('constraints and solver metadata default to empty values', () => {
      expect.assertions(3);
      expect(get(constraints)).toEqual([]);
      expect(get(solverAdjustmentSnapshot)).toBeNull();
      expect(get(constraintSolverSummary)).toBeNull();
    });

    it('comparison settings default to Delta E OK with its default threshold', () => {
      expect.assertions(2);
      expect(get(comparisonMetric)).toBe('ok');
      expect(get(swatchChangeThreshold)).toBe(0.02);
    });
  });

  describe('comparison settings', () => {
    it('restores the remembered swatch change threshold for each comparison metric', () => {
      expect.assertions(5);

      setSwatchChangeThreshold(0.04);
      expect(get(swatchChangeThreshold)).toBe(0.04);

      setComparisonMetric('2000');
      expect(get(comparisonMetric)).toBe('2000');
      expect(get(swatchChangeThreshold)).toBe(2);

      setSwatchChangeThreshold(3);
      setComparisonMetric('ok');
      expect(get(swatchChangeThreshold)).toBe(0.04);

      setComparisonMetric('2000');
      expect(get(swatchChangeThreshold)).toBe(3);
    });
  });

  describe('neutralsHex derived store', () => {
    it('converts Color objects to hex strings', () => {
      expect.assertions(2);
      const testNeutrals = [new Color('#ffffff'), new Color('#000000')];
      updateColorState({ neutrals: testNeutrals });

      const hexValues = get(neutralsHex);
      expect(hexValues[0]).toBe('#ffffff');
      expect(hexValues[1]).toBe('#000000');
    });
  });

  describe('palettesHex derived store', () => {
    it('converts nested Color arrays to hex strings', () => {
      expect.assertions(2);
      const testPalettes = [[new Color('#ff0000'), new Color('#00ff00')]];
      updateColorState({ palettes: testPalettes });

      const hexValues = get(palettesHex);
      expect(hexValues[0][0]).toBe('#ff0000');
      expect(hexValues[0][1]).toBe('#00ff00');
    });
  });

  describe('neutralsDisplay derived store', () => {
    it('formats colors according to displayColorSpace', () => {
      expect.assertions(1);
      const testNeutrals = [new Color('#ffffff')];
      updateColorState({ neutrals: testNeutrals, displayColorSpace: 'hex' });

      const displayValues = get(neutralsDisplay);
      expect(displayValues[0]).toBe('#ffffff');
    });
  });

  describe('palettesDisplay derived store', () => {
    it('formats colors according to displayColorSpace', () => {
      expect.assertions(1);
      const testPalettes = [[new Color('#ff0000')]];
      updateColorState({ palettes: testPalettes, displayColorSpace: 'hex' });

      const displayValues = get(palettesDisplay);
      expect(displayValues[0][0]).toBe('#ff0000');
    });
  });

  describe('neutralsSwatchDisplay derived store', () => {
    it('uses compact OKLCH values for swatches', () => {
      expect.assertions(1);
      const testNeutrals = [new Color('oklch', [0.94772436, 0.048057, 208.654542])];
      updateColorState({ neutrals: testNeutrals, displayColorSpace: 'oklch', gamutSpace: 'srgb' });

      const swatchValues = get(neutralsSwatchDisplay);
      expect(swatchValues[0]).toBe(colorToCssOklchSwatch(testNeutrals[0], 'srgb'));
    });
  });

  describe('palettesSwatchDisplay derived store', () => {
    it('uses compact OKLCH values for swatches', () => {
      expect.assertions(1);
      const testPalettes = [[new Color('oklch', [0.94772436, 0.048057, 208.654542])]];
      updateColorState({ palettes: testPalettes, displayColorSpace: 'oklch', gamutSpace: 'srgb' });

      const swatchValues = get(palettesSwatchDisplay);
      expect(swatchValues[0][0]).toBe(colorToCssOklchSwatch(testPalettes[0][0], 'srgb'));
    });
  });

  describe('display vs swatch OKLCH significant digits', () => {
    it('keeps full precision in display stores and compact precision in swatch stores', () => {
      expect.assertions(2);
      const testNeutrals = [new Color('oklch', [0.94772436, 0.048057, 208.654542])];
      updateColorState({ neutrals: testNeutrals, displayColorSpace: 'oklch', gamutSpace: 'srgb' });

      const displayValues = get(neutralsDisplay);
      const swatchValues = get(neutralsSwatchDisplay);

      expect(displayValues[0]).toBe(colorToCssOklch(testNeutrals[0], 'srgb'));
      expect(swatchValues[0]).toBe(colorToCssOklchSwatch(testNeutrals[0], 'srgb'));
    });

    it('uses configured oklchDisplaySignificantDigits for swatch output', () => {
      expect.assertions(1);
      const testNeutrals = [new Color('oklch', [0.94772436, 0.048057, 208.654542])];
      updateColorState({
        neutrals: testNeutrals,
        displayColorSpace: 'oklch',
        gamutSpace: 'srgb',
        oklchDisplaySignificantDigits: 2
      });

      const swatchValues = get(neutralsSwatchDisplay);
      expect(swatchValues[0]).toBe(colorToCssOklchSwatch(testNeutrals[0], 'srgb', 2));
    });
  });

  describe('updateColorState', () => {
    it('updates partial state', () => {
      expect.assertions(2);
      updateColorState({ warmth: 5 });

      expect(get(warmth)).toBe(5);
      expect(get(baseColor)).toBe('#5EF784');
    });

    it('updates multiple properties at once', () => {
      expect.assertions(2);
      updateColorState({ warmth: 10, chromaMultiplier: 0.5 });

      expect(get(warmth)).toBe(10);
      expect(get(chromaMultiplier)).toBe(0.5);
    });

    it('updates swatch contrast indicator visibility', () => {
      expect.assertions(1);
      updateColorState({ showSwatchContrastIndicators: false });

      expect(get(showSwatchContrastIndicators)).toBe(false);
    });

    it('updates swatch gamut warning visibility', () => {
      expect.assertions(1);
      updateColorState({ showSwatchGamutWarnings: false });

      expect(get(showSwatchGamutWarnings)).toBe(false);
    });

    it('updates swatch contrast indicator criterion visibility', () => {
      expect.assertions(1);
      updateColorState({
        swatchContrastIndicators: {
          wcagThreeToOne: true,
          wcagAA: false,
          wcagAAA: true,
          apcaLarge: true,
          apcaFluent: true,
          apcaBody: false
        }
      });

      expect(get(swatchContrastIndicators)).toEqual({
        wcagThreeToOne: true,
        wcagAA: false,
        wcagAAA: true,
        apcaLarge: true,
        apcaFluent: true,
        apcaBody: false
      });
    });

    it('updates solveAdjacentStopLows', () => {
      expect.assertions(1);
      updateColorState({ solveAdjacentStopLows: false });

      expect(get(solveAdjacentStopLows)).toBe(false);
    });

    it('forces gamutSpace to sRGB when displayColorSpace is hex', () => {
      expect.assertions(2);
      updateColorState({ displayColorSpace: 'oklch', gamutSpace: 'p3' });
      updateColorState({ displayColorSpace: 'hex' });

      expect(get(displayColorSpace)).toBe('hex');
      expect(get(gamutSpace)).toBe('srgb');
    });

    it('keeps non-sRGB gamut when displayColorSpace is not hex', () => {
      expect.assertions(2);
      updateColorState({ displayColorSpace: 'oklch', gamutSpace: 'rec2020' });

      expect(get(displayColorSpace)).toBe('oklch');
      expect(get(gamutSpace)).toBe('rec2020');
    });
  });

  describe('setTheme', () => {
    it('applies light theme preset', () => {
      expect.assertions(3);
      setTheme('dark');
      setTheme('light');

      expect(get(currentTheme)).toBe('light');
      expect(get(x1)).toBe(0.16);
      expect(get(chromaMultiplier)).toBe(1);
    });

    it('applies dark theme preset', () => {
      expect.assertions(3);
      setTheme('dark');

      expect(get(currentTheme)).toBe('dark');
      expect(get(x1)).toBe(0.45);
      expect(get(chromaMultiplier)).toBe(0.83);
    });

    it('logs error for invalid theme', () => {
      expect.assertions(2);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalTheme = get(currentTheme);

      // @ts-expect-error Testing invalid input
      setTheme('invalid');

      expect(get(currentTheme)).toBe(originalTheme);
      expect(errorSpy).toHaveBeenCalledWith("Invalid theme: invalid. Must be 'light' or 'dark'");

      errorSpy.mockRestore();
    });
  });

  describe('setThemePreference', () => {
    it('sets preference to light and applies preset', () => {
      expect.assertions(2);
      setThemePreference('light');

      expect(get(themePreference)).toBe('light');
      expect(get(currentTheme)).toBe('light');
    });

    it('sets preference to dark and applies preset', () => {
      expect.assertions(2);
      setThemePreference('dark');

      expect(get(themePreference)).toBe('dark');
      expect(get(currentTheme)).toBe('dark');
    });

    it('sets preference to auto without changing theme', () => {
      expect.assertions(2);
      setTheme('dark');
      setThemePreference('auto');

      expect(get(themePreference)).toBe('auto');
      expect(get(currentTheme)).toBe('dark');
    });
  });

  describe('updateLightnessNudger', () => {
    it('updates nudger at specific index', () => {
      expect.assertions(2);
      updateColorState({ lightnessNudgers: [0, 0, 0] });

      updateLightnessNudger(1, 5);

      const nudgers = get(lightnessNudgers);
      expect(nudgers[1]).toBe(5);
      expect(nudgers[0]).toBe(0);
    });
  });

  describe('updateHueNudger', () => {
    it('updates nudger at specific index', () => {
      expect.assertions(2);
      updateColorState({ hueNudgers: [0, 0, 0] });

      updateHueNudger(2, 15);

      const nudgers = get(hueNudgers);
      expect(nudgers[2]).toBe(15);
      expect(nudgers[0]).toBe(0);
    });
  });

  describe('updateContrastFromNeutrals', () => {
    it('updates contrast colors from neutrals in auto mode', () => {
      expect.assertions(2);
      const testNeutrals = [new Color('#ffffff'), new Color('#cccccc'), new Color('#000000')];
      updateColorState({
        neutrals: testNeutrals,
        contrastMode: 'auto',
        lowStep: 0,
        highStep: 2
      });

      updateContrastFromNeutrals();

      const colors = get(contrastColors);
      expect(colors.low).toBe('#ffffff');
      expect(colors.high).toBe('#000000');
    });

    it('does nothing in manual mode', () => {
      expect.assertions(1);
      const originalColors = get(contrastColors);
      updateColorState({ contrastMode: 'manual' });

      updateContrastFromNeutrals();

      expect(get(contrastColors)).toEqual(originalColors);
    });

    it('does nothing with empty neutrals', () => {
      expect.assertions(1);
      const originalColors = get(contrastColors);
      updateColorState({ neutrals: [], contrastMode: 'auto' });

      updateContrastFromNeutrals();

      expect(get(contrastColors)).toEqual(originalColors);
    });

    it('clamps step indices to valid bounds', () => {
      expect.assertions(2);
      const testNeutrals = [new Color('#ffffff'), new Color('#000000')];
      updateColorState({
        neutrals: testNeutrals,
        contrastMode: 'auto',
        lowStep: 0,
        highStep: 100
      });

      updateContrastFromNeutrals();

      const colors = get(contrastColors);
      expect(colors.low).toBe('#ffffff');
      expect(colors.high).toBe('#000000');
    });
  });

  describe('updateContrastStep', () => {
    it('updates low step and derives contrast colors', () => {
      expect.assertions(2);
      const testNeutrals = [new Color('#ffffff'), new Color('#cccccc'), new Color('#000000')];
      updateColorState({ neutrals: testNeutrals });

      updateContrastStep('low', 1);

      expect(get(lowStep)).toBe(1);
      expect(get(contrastColors).low).toBe('#cccccc');
    });

    it('updates high step and derives contrast colors', () => {
      expect.assertions(2);
      const testNeutrals = [new Color('#ffffff'), new Color('#cccccc'), new Color('#000000')];
      updateColorState({ neutrals: testNeutrals });

      updateContrastStep('high', 1);

      expect(get(highStep)).toBe(1);
      expect(get(contrastColors).high).toBe('#cccccc');
    });

    it('sets contrastMode to auto', () => {
      expect.assertions(1);
      updateColorState({ contrastMode: 'manual' });
      const testNeutrals = [new Color('#ffffff')];
      updateColorState({ neutrals: testNeutrals });

      updateContrastStep('low', 0);

      expect(get(contrastMode)).toBe('auto');
    });

    it('clamps step to valid bounds', () => {
      expect.assertions(1);
      const testNeutrals = [new Color('#ffffff'), new Color('#000000')];
      updateColorState({ neutrals: testNeutrals });

      updateContrastStep('low', 100);

      expect(get(lowStep)).toBe(1);
    });
  });

  describe('updateContrastReference', () => {
    it('updates a palette-backed low contrast reference and derived contrast color', () => {
      expect.assertions(2);
      updateColorState({
        palettes: [[new Color('#ff0000'), new Color('#00ff00')]],
        contrastMode: 'auto'
      });

      updateContrastReference('low', { kind: 'palette', paletteIndex: 0, stepIndex: 1 });

      expect(get(lowReference)).toEqual({ kind: 'palette', paletteIndex: 0, stepIndex: 1 });
      expect(get(contrastColors).low).toBe('#00ff00');
    });
  });

  describe('constraint store helpers', () => {
    it('adds and removes constraints', () => {
      expect.assertions(2);
      const constraint = {
        id: 'constraint-1',
        type: 'target-color' as const,
        enabled: true,
        targetHex: '#5ef784'
      };

      addConstraint(constraint);
      expect(get(constraints)).toEqual([constraint]);

      removeConstraint(constraint.id);
      expect(get(constraints)).toEqual([]);
    });

    it('stores solver snapshot and summary values', () => {
      expect.assertions(2);
      setSolverAdjustmentSnapshot({
        baseColor: '#5EF784',
        warmth: -7,
        chromaMultiplier: 1,
        x1: 0.16,
        y1: 0,
        x2: 0.28,
        y2: 0.38,
        lightnessNudgers: [0],
        hueNudgers: [0]
      });
      setConstraintSolverSummary({
        solvedAt: 123,
        passCount: 1,
        warningCount: 1,
        failCount: 0,
        applied: true,
        changed: true,
        scoreBefore: 1.25,
        scoreAfter: 0.5
      });

      expect(get(solverAdjustmentSnapshot)?.baseColor).toBe('#5EF784');
      expect(get(constraintSolverSummary)?.warningCount).toBe(1);
    });
  });

  describe('resetColorState', () => {
    it('resets to light theme preset while preserving theme preference and constraints', () => {
      expect.assertions(6);
      updateColorState({
        warmth: 100,
        chromaMultiplier: 5,
        lightnessNudgers: [0.02, -0.01],
        hueNudgers: [4, -3]
      });
      addConstraint({
        id: 'constraint-1',
        type: 'target-color',
        enabled: true,
        targetHex: '#5EF784',
        metric: 'ok'
      });
      setThemePreference('light');

      resetColorState('light');

      expect(get(warmth)).toBe(-7);
      expect(get(chromaMultiplier)).toBe(1);
      expect(get(lightnessNudgers)).toEqual([]);
      expect(get(hueNudgers)).toEqual([]);
      expect(get(themePreference)).toBe('light');
      expect(get(constraints)).toHaveLength(1);
    });

    it('resets to dark theme preset while preserving theme preference', () => {
      expect.assertions(3);
      setThemePreference('dark');
      resetColorState('dark');

      expect(get(currentTheme)).toBe('dark');
      expect(get(chromaMultiplier)).toBe(0.83);
      expect(get(themePreference)).toBe('dark');
    });

    it('uses current theme when no theme specified', () => {
      expect.assertions(1);
      setTheme('dark');

      resetColorState();

      expect(get(currentTheme)).toBe('dark');
    });

    it('falls back to current theme for invalid theme', () => {
      expect.assertions(1);
      setTheme('dark');

      // @ts-expect-error Testing invalid input
      resetColorState('invalid');

      expect(get(currentTheme)).toBe('dark');
    });
  });

  describe('reference configuration', () => {
    it('referenceConfiguration derived store is null by default', () => {
      expect.assertions(1);
      expect(get(referenceConfiguration)).toBe(null);
    });

    it('pinReferenceConfiguration captures the current state', () => {
      expect.assertions(1);
      pinReferenceConfiguration();

      const ref = get(referenceConfiguration);
      expect(ref).not.toBe(null);
    });

    it('pinReferenceConfiguration captures all core parameters', () => {
      expect.assertions(6);
      updateColorState({
        baseColor: '#FF0000',
        warmth: 5,
        chromaMultiplier: 0.8,
        numColors: 9,
        numPalettes: 6
      });

      pinReferenceConfiguration();

      const ref = get(referenceConfiguration);
      expect(ref?.baseColor).toBe('#FF0000');
      expect(ref?.warmth).toBe(5);
      expect(ref?.chromaMultiplier).toBe(0.8);
      expect(ref?.numColors).toBe(9);
      expect(ref?.numPalettes).toBe(6);
      expect(ref?.pinnedAt).toBeDefined();
    });

    it('pinReferenceConfiguration captures authored theme and constraints but excludes shared inspection settings', () => {
      expect.assertions(8);

      updateColorState({
        themePreference: 'auto',
        currentTheme: 'dark',
        displayColorSpace: 'oklch',
        gamutSpace: 'p3',
        contrastAlgorithm: 'APCA',
        swatchLabels: 'none',
        constraints: [
          {
            id: 'constraint-1',
            type: 'target-color',
            enabled: true,
            targetHex: '#5EF784',
            metric: 'ok'
          }
        ]
      });

      pinReferenceConfiguration();

      const ref = get(referenceConfiguration);
      expect(ref?.themePreference).toBe('auto');
      expect(ref?.resolvedTheme).toBe('dark');
      expect(ref?.constraints).toEqual([
        {
          id: 'constraint-1',
          type: 'target-color',
          enabled: true,
          targetHex: '#5EF784',
          metric: 'ok'
        }
      ]);
      expect('displayColorSpace' in (ref ?? {})).toBe(false);
      expect('gamutSpace' in (ref ?? {})).toBe(false);
      expect('swatchLabels' in (ref ?? {})).toBe(false);
      expect('showSwatchGamutWarnings' in (ref ?? {})).toBe(false);
      expect('contrastAlgorithm' in (ref ?? {})).toBe(false);
    });

    it('clearReferenceConfiguration sets it to null', () => {
      expect.assertions(2);
      pinReferenceConfiguration();
      expect(get(referenceConfiguration)).not.toBe(null);

      clearReferenceConfiguration();

      expect(get(referenceConfiguration)).toBe(null);
    });

    it('pinReferenceConfiguration can be called multiple times (overwrites previous)', () => {
      expect.assertions(2);
      updateColorState({ baseColor: '#FF0000' });
      pinReferenceConfiguration();
      const firstRef = get(referenceConfiguration);

      updateColorState({ baseColor: '#00FF00' });
      pinReferenceConfiguration();
      const secondRef = get(referenceConfiguration);

      expect(firstRef?.baseColor).toBe('#FF0000');
      expect(secondRef?.baseColor).toBe('#00FF00');
    });

    it('resetColorState clears the reference configuration', () => {
      expect.assertions(2);
      pinReferenceConfiguration();
      expect(get(referenceConfiguration)).not.toBe(null);

      resetColorState('light');

      expect(get(referenceConfiguration)).toBe(null);
    });

    it('replaceReferenceConfiguration replaces the pinned config with the current palette state', () => {
      expect.assertions(2);

      updateColorState({ baseColor: '#FF0000' });
      pinReferenceConfiguration();

      updateColorState({ baseColor: '#00FF00' });
      replaceReferenceConfiguration();

      const ref = get(referenceConfiguration);
      expect(ref?.baseColor).toBe('#00FF00');
      expect(ref?.pinnedAt).toBeDefined();
    });

    it('replaceReferenceConfiguration is a no-op when no reference is pinned', () => {
      expect.assertions(1);

      replaceReferenceConfiguration();

      expect(get(referenceConfiguration)).toBeNull();
    });

    it('restoreReferenceConfiguration applies pinned config as current palette without clearing the reference', () => {
      expect.assertions(3);

      updateColorState({ baseColor: '#FF0000', numColors: 9 });
      pinReferenceConfiguration();

      updateColorState({ baseColor: '#00FF00', numColors: 13 });
      restoreReferenceConfiguration();

      const colorState = get(colorStore);
      expect(colorState.baseColor).toBe('#FF0000');
      expect(colorState.numColors).toBe(9);
      expect(get(referenceConfiguration)).not.toBeNull();
    });

    it('restoreReferenceConfiguration reproduces the pinned theme while preserving shared inspection settings', () => {
      expect.assertions(6);

      updateColorState({
        themePreference: 'auto',
        currentTheme: 'light',
        displayColorSpace: 'hex',
        gamutSpace: 'srgb',
        swatchLabels: 'both',
        contrastAlgorithm: 'WCAG'
      });
      pinReferenceConfiguration();

      updateColorState({
        themePreference: 'dark',
        currentTheme: 'dark',
        displayColorSpace: 'oklch',
        gamutSpace: 'p3',
        swatchLabels: 'none',
        contrastAlgorithm: 'APCA'
      });

      restoreReferenceConfiguration();

      const colorState = get(colorStore);
      expect(colorState.themePreference).toBe('auto');
      expect(colorState.currentTheme).toBe('light');
      expect(colorState.displayColorSpace).toBe('oklch');
      expect(colorState.gamutSpace).toBe('p3');
      expect(colorState.swatchLabels).toBe('none');
      expect(colorState.contrastAlgorithm).toBe('APCA');
    });

    it('restoreReferenceConfiguration is a no-op when no reference is pinned', () => {
      expect.assertions(1);

      const before = get(colorStore).baseColor;
      restoreReferenceConfiguration();

      expect(get(colorStore).baseColor).toBe(before);
    });
  });
});
