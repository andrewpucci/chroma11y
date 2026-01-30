import { writable, derived } from 'svelte/store';

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
  neutrals: string[];
  palettes: string[][];
  lightnessNudgers: number[];
  hueNudgers: number[];
  currentTheme: 'light' | 'dark';
  THEME_PRESETS: {
    light: Omit<ColorState, 'currentTheme' | 'THEME_PRESETS'>;
    dark: Omit<ColorState, 'currentTheme' | 'THEME_PRESETS'>;
  };
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
    hueNudgers: []
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
    hueNudgers: []
  }
};

/**
 * Default color state values
 */
const DEFAULT_STATE = {
  ...THEME_PRESETS.light,
  currentTheme: 'light',
  THEME_PRESETS
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

// Derived store for neutrals
export const neutrals = derived(colorStore, ($colorStore) => $colorStore.neutrals);

// Derived store for palettes
export const palettes = derived(colorStore, ($colorStore) => $colorStore.palettes);

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

/**
 * Updates the color state with new values
 */
export const updateColorState = (newState: Partial<ColorState>) => {
  colorStore.update((currentState) => {
    return { ...currentState, ...newState };
  });
};

/**
 * Switches between light and dark themes
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
 * Toggles between light and dark themes
 */
export const toggleTheme = () => {
  colorStore.update((currentState) => {
    const newTheme = currentState.currentTheme === 'light' ? 'dark' : 'light';
    const themePreset = THEME_PRESETS[newTheme];

    return {
      ...currentState,
      ...themePreset,
      currentTheme: newTheme,
      _lastUpdated: Date.now()
    } as ColorState;
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

    const lowColor = currentState.neutrals[currentState.lowStep] || currentState.neutrals[0];
    const highColor =
      currentState.neutrals[currentState.highStep] ||
      currentState.neutrals[currentState.neutrals.length - 1];

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
    const newState = {
      ...currentState,
      contrastMode: 'auto' as const,
      [stepType === 'low' ? 'lowStep' : 'highStep']: step
    };

    // Immediately derive contrast colors from neutrals
    if (newState.neutrals.length > 0) {
      const lowColor = newState.neutrals[newState.lowStep] || newState.neutrals[0];
      const highColor =
        newState.neutrals[newState.highStep] || newState.neutrals[newState.neutrals.length - 1];
      newState.contrast = { low: lowColor, high: highColor };
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
      THEME_PRESETS,
      _lastUpdated: Date.now()
    } as ColorState;
  });
};
