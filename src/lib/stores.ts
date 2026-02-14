import { writable, derived } from 'svelte/store';
import type Color from 'colorjs.io';
import { colorToCssHex, colorToCssDisplay } from '$lib/colorUtils';
import type {
  DisplayColorSpace,
  GamutSpace,
  ThemePreference,
  SwatchLabels,
  ContrastAlgorithm
} from '$lib/types';

/**
 * Interface for color state
 */
interface ColorState {
  numColors: number;
  numPalettes: number;
  baseColor: string;
  warmth: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  chromaMultiplier: number;
  contrastMode: 'auto' | 'manual';
  lowStep: number;
  highStep: number;
  contrast: {
    low: string;
    high: string;
  };
  neutrals: Color[];
  palettes: Color[][];
  lightnessNudgers: number[];
  hueNudgers: number[];
  currentTheme: 'light' | 'dark';
  displayColorSpace: DisplayColorSpace;
  gamutSpace: GamutSpace;
  themePreference: ThemePreference;
  swatchLabels: SwatchLabels;
  contrastAlgorithm: ContrastAlgorithm;
  _lastUpdated?: number;
}

/**
 * Default color state values for light and dark modes
 */
const THEME_PRESETS = {
  light: {
    numColors: 11,
    numPalettes: 11,
    baseColor: '#1862E6',
    warmth: -7,
    x1: 0.16,
    y1: 0.0,
    x2: 0.28,
    y2: 0.38,
    chromaMultiplier: 1.14,
    contrastMode: 'auto' as const,
    lowStep: 0,
    highStep: 10,
    contrast: {
      low: '#ffffff',
      high: '#000000'
    },
    neutrals: [],
    palettes: [],
    lightnessNudgers: [],
    hueNudgers: [],
    displayColorSpace: 'hex' as DisplayColorSpace,
    gamutSpace: 'srgb' as GamutSpace,
    swatchLabels: 'both' as SwatchLabels,
    contrastAlgorithm: 'WCAG21' as ContrastAlgorithm
  },
  dark: {
    numColors: 11,
    numPalettes: 11,
    baseColor: '#1862E6',
    warmth: -7,
    x1: 0.45,
    y1: 0.08,
    x2: 0.77,
    y2: 0.96,
    chromaMultiplier: 0.83,
    contrastMode: 'auto' as const,
    lowStep: 2,
    highStep: 10,
    contrast: {
      low: '#071531',
      high: '#ffffff'
    },
    neutrals: [],
    palettes: [],
    lightnessNudgers: [],
    hueNudgers: [],
    displayColorSpace: 'hex' as DisplayColorSpace,
    gamutSpace: 'srgb' as GamutSpace,
    swatchLabels: 'both' as SwatchLabels,
    contrastAlgorithm: 'WCAG21' as ContrastAlgorithm
  }
};

/**
 * Default color state values
 */
const DEFAULT_STATE = {
  ...THEME_PRESETS.light,
  currentTheme: 'light',
  themePreference: 'light' as ThemePreference
};

// Create the main color store
export const colorStore = writable<ColorState>({ ...DEFAULT_STATE } as ColorState);

// Derived store for current theme
export const currentTheme = derived(colorStore, ($colorStore) => $colorStore.currentTheme);

// Derived store for contrast colors
export const contrastColors = derived(colorStore, ($colorStore) => $colorStore.contrast);

// Derived store for contrast mode
export const contrastMode = derived(colorStore, ($colorStore) => $colorStore.contrastMode);

// Derived store for low step
export const lowStep = derived(colorStore, ($colorStore) => $colorStore.lowStep);

// Derived store for high step
export const highStep = derived(colorStore, ($colorStore) => $colorStore.highStep);

// Derived store for neutrals (Color objects)
export const neutrals = derived(colorStore, ($colorStore) => $colorStore.neutrals);

// Derived store for palettes (Color objects)
export const palettes = derived(colorStore, ($colorStore) => $colorStore.palettes);

// Derived store for neutrals as hex strings
export const neutralsHex = derived(colorStore, ($colorStore) =>
  $colorStore.neutrals.map((c) => colorToCssHex(c))
);

// Derived store for palettes as hex strings
export const palettesHex = derived(colorStore, ($colorStore) =>
  $colorStore.palettes.map((palette) => palette.map((c) => colorToCssHex(c)))
);

// Derived store for numColors
export const numColors = derived(colorStore, ($colorStore) => $colorStore.numColors);

// Derived store for numPalettes
export const numPalettes = derived(colorStore, ($colorStore) => $colorStore.numPalettes);

// Derived store for baseColor
export const baseColor = derived(colorStore, ($colorStore) => $colorStore.baseColor);

// Derived store for warmth
export const warmth = derived(colorStore, ($colorStore) => $colorStore.warmth);

// Derived store for chromaMultiplier
export const chromaMultiplier = derived(colorStore, ($colorStore) => $colorStore.chromaMultiplier);

// Derived store for x1
export const x1 = derived(colorStore, ($colorStore) => $colorStore.x1);

// Derived store for y1
export const y1 = derived(colorStore, ($colorStore) => $colorStore.y1);

// Derived store for x2
export const x2 = derived(colorStore, ($colorStore) => $colorStore.x2);

// Derived store for y2
export const y2 = derived(colorStore, ($colorStore) => $colorStore.y2);

// Derived store for lightness nudgers
export const lightnessNudgers = derived(colorStore, ($colorStore) => $colorStore.lightnessNudgers);

// Derived store for hue nudgers
export const hueNudgers = derived(colorStore, ($colorStore) => $colorStore.hueNudgers);

// Derived store for display color space
export const displayColorSpace = derived(
  colorStore,
  ($colorStore) => $colorStore.displayColorSpace
);

// Derived store for gamut space
export const gamutSpace = derived(colorStore, ($colorStore) => $colorStore.gamutSpace);

// Derived store for theme preference
export const themePreference = derived(colorStore, ($colorStore) => $colorStore.themePreference);

// Derived store for swatch labels
export const swatchLabels = derived(colorStore, ($colorStore) => $colorStore.swatchLabels);

// Derived store for contrast algorithm
export const contrastAlgorithm = derived(
  colorStore,
  ($colorStore) => $colorStore.contrastAlgorithm
);

// Derived store for neutrals formatted in the selected display color space
export const neutralsDisplay = derived(colorStore, ($colorStore) =>
  $colorStore.neutrals.map((c) =>
    colorToCssDisplay(c, $colorStore.displayColorSpace, $colorStore.gamutSpace)
  )
);

// Derived store for palettes formatted in the selected display color space
export const palettesDisplay = derived(colorStore, ($colorStore) =>
  $colorStore.palettes.map((palette) =>
    palette.map((c) =>
      colorToCssDisplay(c, $colorStore.displayColorSpace, $colorStore.gamutSpace)
    )
  )
);

/**
 * Updates the color state with new values
 */
export const updateColorState = (newState: Partial<ColorState>) => {
  colorStore.update((currentState) => {
    return { ...currentState, ...newState };
  });
};

/**
 * Applies a resolved theme (light or dark) to the store, loading the theme preset.
 * This is called when the resolved theme changes (either from explicit preference or auto detection).
 */
export const setTheme = (theme: 'light' | 'dark') => {
  if (!THEME_PRESETS[theme]) {
    console.error(`Invalid theme: ${theme}. Must be 'light' or 'dark'`);
    return;
  }

  colorStore.update((currentState) => {
    const themePreset = THEME_PRESETS[theme];
    return {
      ...currentState,
      ...themePreset,
      currentTheme: theme,
      _lastUpdated: Date.now()
    } as ColorState;
  });
};

/**
 * Sets the theme preference (light, dark, or auto).
 * When 'auto', the resolved theme is determined by the caller via matchMedia.
 * When 'light' or 'dark', also applies the theme preset immediately.
 */
export const setThemePreference = (preference: ThemePreference) => {
  colorStore.update((currentState) => {
    const newState = { ...currentState, themePreference: preference };
    if (preference !== 'auto') {
      const themePreset = THEME_PRESETS[preference];
      return {
        ...newState,
        ...themePreset,
        currentTheme: preference,
        _lastUpdated: Date.now()
      } as ColorState;
    }
    return newState;
  });
};

/**
 * Updates individual lightness nudger value
 */
export const updateLightnessNudger = (index: number, value: number) => {
  colorStore.update((currentState) => {
    const newNudgers = [...currentState.lightnessNudgers];
    newNudgers[index] = value;
    return { ...currentState, lightnessNudgers: newNudgers };
  });
};

/**
 * Updates individual hue nudger value
 */
export const updateHueNudger = (paletteIndex: number, value: number) => {
  colorStore.update((currentState) => {
    const newNudgers = [...currentState.hueNudgers];
    newNudgers[paletteIndex] = value;
    return { ...currentState, hueNudgers: newNudgers };
  });
};

/**
 * Updates contrast colors from neutrals based on lowStep and highStep (auto mode)
 */
export const updateContrastFromNeutrals = () => {
  colorStore.update((currentState) => {
    if (currentState.contrastMode !== 'auto' || currentState.neutrals.length === 0) {
      return currentState;
    }

    // Clamp step indices to valid bounds
    const maxIndex = currentState.neutrals.length - 1;
    const clampedLowStep = Math.max(0, Math.min(currentState.lowStep, maxIndex));
    const clampedHighStep = Math.max(0, Math.min(currentState.highStep, maxIndex));

    const lowColor = colorToCssHex(
      currentState.neutrals[clampedLowStep] || currentState.neutrals[0]
    );
    const highColor = colorToCssHex(
      currentState.neutrals[clampedHighStep] ||
        currentState.neutrals[currentState.neutrals.length - 1]
    );

    return {
      ...currentState,
      contrast: {
        low: lowColor,
        high: highColor
      }
    };
  });
};

/**
 * Updates contrast step and immediately updates contrast colors from neutrals
 */
export const updateContrastStep = (stepType: 'low' | 'high', step: number) => {
  colorStore.update((currentState) => {
    // Validate step is within valid bounds
    const maxIndex = Math.max(0, currentState.neutrals.length - 1);
    const clampedStep = Math.max(0, Math.min(step, maxIndex));

    const newState = {
      ...currentState,
      contrastMode: 'auto' as const,
      [stepType === 'low' ? 'lowStep' : 'highStep']: clampedStep
    };

    // Immediately derive contrast colors from neutrals
    if (newState.neutrals.length > 0) {
      const clampedLowStep = Math.max(0, Math.min(newState.lowStep, maxIndex));
      const clampedHighStep = Math.max(0, Math.min(newState.highStep, maxIndex));

      const lowColor = colorToCssHex(newState.neutrals[clampedLowStep] || newState.neutrals[0]);
      const highColor = colorToCssHex(
        newState.neutrals[clampedHighStep] || newState.neutrals[newState.neutrals.length - 1]
      );
      if (lowColor && highColor) {
        newState.contrast = { low: lowColor, high: highColor };
      }
    }

    return newState;
  });
};

/**
 * Resets the color state to default values
 */
export const resetColorState = (theme?: 'light' | 'dark') => {
  colorStore.update((currentState) => {
    const targetTheme =
      theme && THEME_PRESETS[theme] ? theme : (currentState.currentTheme as 'light' | 'dark');
    const themePreset = THEME_PRESETS[targetTheme];

    return {
      ...themePreset,
      currentTheme: targetTheme,
      themePreference: targetTheme as ThemePreference,
      _lastUpdated: Date.now()
    } as ColorState;
  });
};
