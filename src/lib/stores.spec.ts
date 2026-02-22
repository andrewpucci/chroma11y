/**
 * Stores unit tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import Color from 'colorjs.io';
import {
  currentTheme,
  contrastColors,
  contrastMode,
  lowStep,
  highStep,
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
  contrastAlgorithm,
  neutralsDisplay,
  palettesDisplay,
  updateColorState,
  setTheme,
  setThemePreference,
  updateLightnessNudger,
  updateHueNudger,
  updateContrastFromNeutrals,
  updateContrastStep,
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
      expect(get(baseColor)).toBe('#1862E6');
    });

    it('warmth reflects colorStore.warmth', () => {
      expect.assertions(1);
      expect(get(warmth)).toBe(-7);
    });

    it('chromaMultiplier reflects colorStore.chromaMultiplier', () => {
      expect.assertions(1);
      expect(get(chromaMultiplier)).toBe(1.14);
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

    it('contrastAlgorithm reflects colorStore.contrastAlgorithm', () => {
      expect.assertions(1);
      expect(get(contrastAlgorithm)).toBe('WCAG');
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

  describe('updateColorState', () => {
    it('updates partial state', () => {
      expect.assertions(2);
      updateColorState({ warmth: 5 });

      expect(get(warmth)).toBe(5);
      expect(get(baseColor)).toBe('#1862E6');
    });

    it('updates multiple properties at once', () => {
      expect.assertions(2);
      updateColorState({ warmth: 10, chromaMultiplier: 0.5 });

      expect(get(warmth)).toBe(10);
      expect(get(chromaMultiplier)).toBe(0.5);
    });
  });

  describe('setTheme', () => {
    it('applies light theme preset', () => {
      expect.assertions(3);
      setTheme('dark');
      setTheme('light');

      expect(get(currentTheme)).toBe('light');
      expect(get(x1)).toBe(0.16);
      expect(get(chromaMultiplier)).toBe(1.14);
    });

    it('applies dark theme preset', () => {
      expect.assertions(3);
      setTheme('dark');

      expect(get(currentTheme)).toBe('dark');
      expect(get(x1)).toBe(0.45);
      expect(get(chromaMultiplier)).toBe(0.83);
    });

    it('logs error for invalid theme', () => {
      expect.assertions(1);
      const originalTheme = get(currentTheme);

      // @ts-expect-error Testing invalid input
      setTheme('invalid');

      expect(get(currentTheme)).toBe(originalTheme);
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

  describe('resetColorState', () => {
    it('resets to light theme preset', () => {
      expect.assertions(3);
      updateColorState({ warmth: 100, chromaMultiplier: 5 });

      resetColorState('light');

      expect(get(warmth)).toBe(-7);
      expect(get(chromaMultiplier)).toBe(1.14);
      expect(get(themePreference)).toBe('auto');
    });

    it('resets to dark theme preset', () => {
      expect.assertions(3);
      resetColorState('dark');

      expect(get(currentTheme)).toBe('dark');
      expect(get(chromaMultiplier)).toBe(0.83);
      expect(get(themePreference)).toBe('auto');
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
});
