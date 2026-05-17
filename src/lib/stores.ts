import { writable, derived } from 'svelte/store';
import type Color from 'colorjs.io';
import { colorToCssHex, colorToCssRender, colorToCssSwatchRender } from '$lib/colorUtils';
import { normalizeCustomPaletteName, normalizeCustomPaletteNames } from '$lib/paletteNameUtils';
import { createReferenceConfiguration } from '$lib/referenceConfiguration';
import type {
  DisplayColorSpace,
  GamutSpace,
  ThemePreference,
  SwatchLabels,
  ContrastAlgorithm,
  OklchDisplaySignificantDigits,
  SwatchContrastIndicators,
  ContrastReference,
  Constraint,
  SolverAdjustmentSnapshot,
  ConstraintSolverSummary,
  ConstraintSolveRunState,
  CvdMode,
  ColorDifferenceMetric
} from '$lib/types';
import type { ReferenceConfiguration } from '$lib/referenceConfiguration';

/**
 * Interface for color state
 */
export interface ColorState {
  numColors: number;
  numPalettes: number;
  baseColor: string;
  warmth: number;
  warmthHue?: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  chromaMultiplier: number;
  contrastMode: 'auto' | 'manual';
  lowStep: number;
  highStep: number;
  lowReference: ContrastReference;
  highReference: ContrastReference;
  contrast: {
    low: string;
    high: string;
  };
  neutrals: Color[];
  palettes: Color[][];
  lightnessNudgers: number[];
  hueNudgers: number[];
  stepSaturationNudgers: number[];
  paletteSaturationNudgers: number[];
  paletteChromaNudgers: number[];
  currentTheme: 'light' | 'dark';
  displayColorSpace: DisplayColorSpace;
  gamutSpace: GamutSpace;
  themePreference: ThemePreference;
  swatchLabels: SwatchLabels;
  showSwatchGamutWarnings: boolean;
  showSwatchContrastIndicators: boolean;
  swatchContrastIndicators: SwatchContrastIndicators;
  contrastAlgorithm: ContrastAlgorithm;
  solveAdjacentStopLows: boolean;
  oklchDisplaySignificantDigits: OklchDisplaySignificantDigits;
  cvdMode: CvdMode;
  customNeutralName?: string;
  customPaletteNames?: string[];
  constraints: Constraint[];
  solverAdjustmentSnapshot: SolverAdjustmentSnapshot | null;
  constraintSolverSummary: ConstraintSolverSummary | null;
  referenceConfiguration: ReferenceConfiguration | null;
  comparisonMetric: ColorDifferenceMetric;
  swatchChangeThreshold: number;
  _lastUpdated?: number;
}

export interface ActiveSwatchPicker {
  kind: 'contrast-reference' | 'constraint-target';
  target: 'low' | 'high' | string;
}

function createNeutralContrastReference(stepIndex: number): ContrastReference {
  return {
    kind: 'neutral',
    stepIndex
  };
}

/**
 * Default color state values for light and dark modes
 */
const THEME_PRESETS = {
  light: {
    numColors: 11,
    numPalettes: 11,
    baseColor: '#5EF784',
    warmth: -7,
    x1: 0.16,
    y1: 0.0,
    x2: 0.28,
    y2: 0.38,
    chromaMultiplier: 1,
    contrastMode: 'auto' as const,
    lowStep: 0,
    highStep: 10,
    lowReference: createNeutralContrastReference(0),
    highReference: createNeutralContrastReference(10),
    contrast: {
      low: '#ffffff',
      high: '#000000'
    }
  },
  dark: {
    numColors: 11,
    numPalettes: 11,
    baseColor: '#5EF784',
    warmth: -7,
    x1: 0.45,
    y1: 0.08,
    x2: 0.77,
    y2: 0.96,
    chromaMultiplier: 0.83,
    contrastMode: 'auto' as const,
    lowStep: 2,
    highStep: 10,
    lowReference: createNeutralContrastReference(2),
    highReference: createNeutralContrastReference(10),
    contrast: {
      low: '#071531',
      high: '#ffffff'
    }
  }
};

/**
 * Default color state values
 */
const DEFAULT_STATE = {
  ...THEME_PRESETS.light,
  neutrals: [] as Color[],
  palettes: [] as Color[][],
  lightnessNudgers: [] as number[],
  hueNudgers: [] as number[],
  stepSaturationNudgers: [] as number[],
  paletteSaturationNudgers: [] as number[],
  paletteChromaNudgers: [] as number[],
  currentTheme: 'light',
  themePreference: 'auto' as ThemePreference,
  displayColorSpace: 'hex' as DisplayColorSpace,
  gamutSpace: 'srgb' as GamutSpace,
  swatchLabels: 'both' as SwatchLabels,
  showSwatchGamutWarnings: true,
  showSwatchContrastIndicators: true,
  swatchContrastIndicators: {
    wcagThreeToOne: true,
    wcagAA: true,
    wcagAAA: true,
    apcaLarge: true,
    apcaFluent: true,
    apcaBody: true
  } as SwatchContrastIndicators,
  contrastAlgorithm: 'WCAG' as ContrastAlgorithm,
  solveAdjacentStopLows: true,
  oklchDisplaySignificantDigits: 4 as OklchDisplaySignificantDigits,
  cvdMode: 'none' as CvdMode,
  constraints: [] as Constraint[],
  solverAdjustmentSnapshot: null as SolverAdjustmentSnapshot | null,
  constraintSolverSummary: null as ConstraintSolverSummary | null,
  referenceConfiguration: null as ReferenceConfiguration | null,
  comparisonMetric: 'ok' as ColorDifferenceMetric,
  swatchChangeThreshold: 1
};

function normalizeDisplayState(state: ColorState): ColorState {
  const normalizedState: ColorState = {
    ...state,
    lowReference: state.lowReference ?? createNeutralContrastReference(state.lowStep),
    highReference: state.highReference ?? createNeutralContrastReference(state.highStep),
    customNeutralName: normalizeCustomPaletteName(state.customNeutralName),
    customPaletteNames: normalizeCustomPaletteNames(state.customPaletteNames, state.numPalettes)
  };

  normalizedState.lowStep = normalizedState.lowReference.stepIndex;
  normalizedState.highStep = normalizedState.highReference.stepIndex;

  if (normalizedState.displayColorSpace === 'hex' && normalizedState.gamutSpace !== 'srgb') {
    return {
      ...normalizedState,
      gamutSpace: 'srgb'
    };
  }

  return normalizedState;
}

// Create the main color store
export const colorStore = writable<ColorState>({ ...DEFAULT_STATE } as ColorState);
export const activeSwatchPicker = writable<ActiveSwatchPicker | null>(null);
export const constraintSolveRunState = writable<ConstraintSolveRunState>({
  status: 'idle'
});

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
export const lowReference = derived(colorStore, ($colorStore) => $colorStore.lowReference);
export const highReference = derived(colorStore, ($colorStore) => $colorStore.highReference);

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
export const warmthHue = derived(colorStore, ($colorStore) => $colorStore.warmthHue);

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

// Derived store for step saturation nudgers
export const stepSaturationNudgers = derived(
  colorStore,
  ($colorStore) => $colorStore.stepSaturationNudgers
);

// Derived store for palette saturation nudgers
export const paletteSaturationNudgers = derived(
  colorStore,
  ($colorStore) => $colorStore.paletteSaturationNudgers
);

// Derived store for palette chroma nudgers
export const paletteChromaNudgers = derived(
  colorStore,
  ($colorStore) => $colorStore.paletteChromaNudgers
);

// Derived store for CVD simulation mode
export const cvdMode = derived(colorStore, ($colorStore) => $colorStore.cvdMode);

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

// Derived store for swatch gamut warning visibility
export const showSwatchGamutWarnings = derived(
  colorStore,
  ($colorStore) => $colorStore.showSwatchGamutWarnings
);

// Derived store for swatch contrast indicator visibility
export const showSwatchContrastIndicators = derived(
  colorStore,
  ($colorStore) => $colorStore.showSwatchContrastIndicators
);

// Derived store for swatch contrast indicator criterion visibility
export const swatchContrastIndicators = derived(
  colorStore,
  ($colorStore) => $colorStore.swatchContrastIndicators
);

// Derived store for contrast algorithm
export const contrastAlgorithm = derived(
  colorStore,
  ($colorStore) => $colorStore.contrastAlgorithm
);
export const solveAdjacentStopLows = derived(
  colorStore,
  ($colorStore) => $colorStore.solveAdjacentStopLows
);

// Derived store for OKLCH display significant digits
export const oklchDisplaySignificantDigits = derived(
  colorStore,
  ($colorStore) => $colorStore.oklchDisplaySignificantDigits
);

// Derived store for custom neutral palette name
export const customNeutralName = derived(
  colorStore,
  ($colorStore) => $colorStore.customNeutralName
);

// Derived store for custom generated palette names
export const customPaletteNames = derived(
  colorStore,
  ($colorStore) => $colorStore.customPaletteNames
);
export const constraints = derived(colorStore, ($colorStore) => $colorStore.constraints);
export const solverAdjustmentSnapshot = derived(
  colorStore,
  ($colorStore) => $colorStore.solverAdjustmentSnapshot
);
export const constraintSolverSummary = derived(
  colorStore,
  ($colorStore) => $colorStore.constraintSolverSummary
);
export const activeConstraintSolveRunState = derived(
  constraintSolveRunState,
  ($constraintSolveRunState) => $constraintSolveRunState
);

// Derived store for reference configuration
export const referenceConfiguration = derived(
  colorStore,
  ($colorStore) => $colorStore.referenceConfiguration
);

// Derived store for comparison metric (Delta E OK or 2000)
export const comparisonMetric = derived(colorStore, ($colorStore) => $colorStore.comparisonMetric);

// Derived store for swatch change threshold
export const swatchChangeThreshold = derived(
  colorStore,
  ($colorStore) => $colorStore.swatchChangeThreshold
);

// Derived store for neutrals formatted in the selected display color space
export const neutralsDisplay = derived(colorStore, ($colorStore) =>
  $colorStore.neutrals.map((c) =>
    colorToCssRender(c, $colorStore.displayColorSpace, $colorStore.gamutSpace)
  )
);

// Derived store for palettes formatted in the selected display color space
export const palettesDisplay = derived(colorStore, ($colorStore) =>
  $colorStore.palettes.map((palette) =>
    palette.map((c) => colorToCssRender(c, $colorStore.displayColorSpace, $colorStore.gamutSpace))
  )
);

// Derived store for neutrals formatted for swatch labels
export const neutralsSwatchDisplay = derived(colorStore, ($colorStore) =>
  $colorStore.neutrals.map((c) =>
    colorToCssSwatchRender(
      c,
      $colorStore.displayColorSpace,
      $colorStore.gamutSpace,
      $colorStore.oklchDisplaySignificantDigits
    )
  )
);

// Derived store for palettes formatted for swatch labels
export const palettesSwatchDisplay = derived(colorStore, ($colorStore) =>
  $colorStore.palettes.map((palette) =>
    palette.map((c) =>
      colorToCssSwatchRender(
        c,
        $colorStore.displayColorSpace,
        $colorStore.gamutSpace,
        $colorStore.oklchDisplaySignificantDigits
      )
    )
  )
);

// Derived store for neutrals simulated background colors (CVD mode applied, no label rounding)
export const neutralsSimulatedDisplay = derived(colorStore, ($colorStore) =>
  $colorStore.cvdMode === 'none'
    ? null
    : $colorStore.neutrals.map((c) =>
        colorToCssRender(
          c,
          $colorStore.displayColorSpace,
          $colorStore.gamutSpace,
          $colorStore.cvdMode
        )
      )
);

// Derived store for palettes simulated background colors (CVD mode applied, no label rounding)
export const palettesSimulatedDisplay = derived(colorStore, ($colorStore) =>
  $colorStore.cvdMode === 'none'
    ? null
    : $colorStore.palettes.map((palette) =>
        palette.map((c) =>
          colorToCssRender(
            c,
            $colorStore.displayColorSpace,
            $colorStore.gamutSpace,
            $colorStore.cvdMode
          )
        )
      )
);

/**
 * Updates the color state with new values
 */
export const updateColorState = (newState: Partial<ColorState>) => {
  colorStore.update((currentState) => {
    return normalizeDisplayState({ ...currentState, ...newState } as ColorState);
  });
};

function resolveContrastReferenceHex(
  state: ColorState,
  reference: ContrastReference,
  fallbackKey: 'low' | 'high'
): string | null {
  const source =
    reference.kind === 'palette'
      ? state.palettes[reference.paletteIndex ?? -1]?.[reference.stepIndex]
      : state.neutrals[reference.stepIndex];

  if (!source) {
    return state.contrast[fallbackKey] ?? null;
  }

  return colorToCssHex(source);
}

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
    return normalizeDisplayState({
      ...currentState,
      ...themePreset,
      currentTheme: theme,
      _lastUpdated: Date.now()
    } as ColorState);
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
      return normalizeDisplayState({
        ...newState,
        ...themePreset,
        currentTheme: preference,
        _lastUpdated: Date.now()
      } as ColorState);
    }
    return normalizeDisplayState(newState as ColorState);
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
 * Updates individual step saturation nudger value
 */
export const updateStepSaturationNudger = (index: number, value: number) => {
  colorStore.update((currentState) => {
    const newNudgers = [...currentState.stepSaturationNudgers];
    newNudgers[index] = value;
    return { ...currentState, stepSaturationNudgers: newNudgers };
  });
};

/**
 * Updates individual palette saturation nudger value
 */
export const updatePaletteSaturationNudger = (paletteIndex: number, value: number) => {
  colorStore.update((currentState) => {
    const newNudgers = [...currentState.paletteSaturationNudgers];
    newNudgers[paletteIndex] = value;
    return { ...currentState, paletteSaturationNudgers: newNudgers };
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
    const lowColor = resolveContrastReferenceHex(currentState, currentState.lowReference, 'low');
    const highColor = resolveContrastReferenceHex(currentState, currentState.highReference, 'high');

    return {
      ...currentState,
      contrast: {
        low: lowColor ?? currentState.contrast.low,
        high: highColor ?? currentState.contrast.high
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
    const referenceKey = stepType === 'low' ? 'lowReference' : 'highReference';

    const newState = {
      ...currentState,
      contrastMode: 'auto' as const,
      [stepType === 'low' ? 'lowStep' : 'highStep']: clampedStep,
      [referenceKey]: createNeutralContrastReference(clampedStep)
    };

    // Immediately derive contrast colors from neutrals
    if (newState.neutrals.length > 0) {
      const lowColor = resolveContrastReferenceHex(newState, newState.lowReference, 'low');
      const highColor = resolveContrastReferenceHex(newState, newState.highReference, 'high');
      if (lowColor && highColor) {
        newState.contrast = { low: lowColor, high: highColor };
      }
    }

    return newState;
  });
};

export const updateContrastReference = (target: 'low' | 'high', reference: ContrastReference) => {
  colorStore.update((currentState) => {
    const nextState = {
      ...currentState,
      contrastMode: 'auto' as const,
      [target === 'low' ? 'lowReference' : 'highReference']: reference,
      [target === 'low' ? 'lowStep' : 'highStep']: reference.stepIndex
    };
    const lowColor = resolveContrastReferenceHex(nextState, nextState.lowReference, 'low');
    const highColor = resolveContrastReferenceHex(nextState, nextState.highReference, 'high');
    if (lowColor && highColor) {
      nextState.contrast = { low: lowColor, high: highColor };
    }
    return nextState;
  });
};

export const setConstraints = (nextConstraints: Constraint[]) => {
  updateColorState({ constraints: nextConstraints });
};

export const updateConstraint = (id: string, updater: (constraint: Constraint) => Constraint) => {
  colorStore.update((currentState) => ({
    ...currentState,
    constraints: currentState.constraints.map((constraint) =>
      constraint.id === id ? updater(constraint) : constraint
    )
  }));
};

export const addConstraint = (constraint: Constraint) => {
  colorStore.update((currentState) => ({
    ...currentState,
    constraints: [constraint, ...currentState.constraints]
  }));
};

export const removeConstraint = (id: string) => {
  colorStore.update((currentState) => ({
    ...currentState,
    constraints: currentState.constraints.filter((constraint) => constraint.id !== id)
  }));
};

export const setSolverAdjustmentSnapshot = (snapshot: SolverAdjustmentSnapshot | null) => {
  updateColorState({ solverAdjustmentSnapshot: snapshot });
};

export const setConstraintSolverSummary = (summary: ConstraintSolverSummary | null) => {
  updateColorState({ constraintSolverSummary: summary });
};

export const setConstraintSolveRunState = (runState: ConstraintSolveRunState) => {
  constraintSolveRunState.set(runState);
};

export const pinReferenceConfiguration = () => {
  colorStore.update((currentState) => ({
    ...currentState,
    referenceConfiguration: createReferenceConfiguration(currentState)
  }));
};

export const clearReferenceConfiguration = () => {
  colorStore.update((currentState) => ({
    ...currentState,
    referenceConfiguration: null
  }));
};

export const setComparisonMetric = (metric: ColorDifferenceMetric) => {
  colorStore.update((currentState) => ({
    ...currentState,
    comparisonMetric: metric
  }));
};

export const setSwatchChangeThreshold = (threshold: number) => {
  colorStore.update((currentState) => ({
    ...currentState,
    swatchChangeThreshold: Math.max(0, threshold)
  }));
};

/**
 * Resets the color state to default values
 */
export const resetColorState = (theme?: 'light' | 'dark') => {
  constraintSolveRunState.set({ status: 'idle' });
  colorStore.update((currentState) => {
    const targetTheme =
      theme && THEME_PRESETS[theme] ? theme : (currentState.currentTheme as 'light' | 'dark');
    const themePreset = THEME_PRESETS[targetTheme];

    return normalizeDisplayState({
      ...currentState,
      ...themePreset,
      currentTheme: targetTheme,
      themePreference: currentState.themePreference,
      lightnessNudgers: [],
      hueNudgers: [],
      stepSaturationNudgers: [],
      paletteSaturationNudgers: [],
      paletteChromaNudgers: [],
      customNeutralName: undefined,
      customPaletteNames: undefined,
      solverAdjustmentSnapshot: null,
      constraintSolverSummary: null,
      referenceConfiguration: null,
      comparisonMetric: 'ok' as ColorDifferenceMetric,
      swatchChangeThreshold: 1,
      _lastUpdated: Date.now()
    } as ColorState);
  });
};
