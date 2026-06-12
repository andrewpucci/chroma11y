import { getConstraintThresholdLabel, getTargetColorMetricLabel } from '$lib/constraintUtils';
import { normalizeCustomPaletteName, normalizeCustomPaletteNames } from '$lib/paletteNameUtils';
import { themePresets } from '$lib/themePresets';
import type {
  ColorDifferenceMetric,
  Constraint,
  ConstraintThresholdKey,
  ContrastAlgorithm,
  ContrastReference
} from '$lib/types';

export interface DiffEntry {
  field: string;
  label: string;
  kind: 'changed' | 'added' | 'removed';
  referenceValue?: string;
  currentValue?: string;
}

export interface ConfigurationDiff {
  hasChanges: boolean;
  generationChanges: DiffEntry[];
  contrastChanges: DiffEntry[];
  constraintChanges: DiffEntry[];
  namingChanges: DiffEntry[];
  timestamp: number;
}

const DEFAULT_NUM_COLORS = 11;
const DEFAULT_NUM_PALETTES = 11;

const GENERATION_FIELD_LABELS: Record<string, string> = {
  numColors: 'Number of steps',
  numPalettes: 'Number of palettes',
  baseColor: 'Base color',
  warmth: 'Warmth',
  warmthHue: 'Warmth hue',
  x1: 'Low contrast X',
  y1: 'Low contrast Y',
  x2: 'High contrast X',
  y2: 'High contrast Y',
  chromaMultiplier: 'Chroma multiplier',
  themePreference: 'Theme'
};

const THEME_PRESET_BACKED_GENERATION_FIELDS = new Set([
  'numColors',
  'numPalettes',
  'baseColor',
  'warmth',
  'x1',
  'y1',
  'x2',
  'y2',
  'chromaMultiplier'
]);

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function asString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (value === undefined || value === null) {
    return '';
  }

  return JSON.stringify(value);
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asNumberArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value.map((entry) => (typeof entry === 'number' && Number.isFinite(entry) ? entry : 0))
    : [];
}

function asConstraints(value: unknown): Constraint[] {
  return Array.isArray(value) ? (value as Constraint[]) : [];
}

function createChangedEntry(
  field: string,
  label: string,
  currentValue: unknown,
  referenceValue: unknown
): DiffEntry {
  return {
    field,
    label,
    kind: 'changed',
    referenceValue: asString(referenceValue),
    currentValue: asString(currentValue)
  };
}

function createOneSidedEntry(
  kind: 'added' | 'removed',
  field: string,
  label: string,
  value: unknown
): DiffEntry {
  return kind === 'added'
    ? {
        field,
        label,
        kind,
        currentValue: asString(value)
      }
    : {
        field,
        label,
        kind,
        referenceValue: asString(value)
      };
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getResolvedTheme(config: Record<string, unknown>): 'light' | 'dark' | undefined {
  const theme = config.resolvedTheme ?? config.currentTheme;
  return theme === 'light' || theme === 'dark' ? theme : undefined;
}

function isPureResolvedThemeDrift(
  current: Record<string, unknown>,
  reference: Record<string, unknown>
): boolean {
  return (
    current.themePreference === 'auto' &&
    reference.themePreference === 'auto' &&
    getResolvedTheme(current) !== undefined &&
    getResolvedTheme(reference) !== undefined &&
    getResolvedTheme(current) !== getResolvedTheme(reference)
  );
}

function matchesThemePresetValue(
  config: Record<string, unknown>,
  theme: 'light' | 'dark',
  field: keyof (typeof themePresets)['light']
): boolean {
  return deepEqual(config[field], themePresets[theme][field]);
}

function shouldIgnoreThemePresetBackedField(
  current: Record<string, unknown>,
  reference: Record<string, unknown>,
  field: keyof (typeof themePresets)['light']
): boolean {
  if (!isPureResolvedThemeDrift(current, reference)) {
    return false;
  }

  const currentTheme = getResolvedTheme(current);
  const referenceTheme = getResolvedTheme(reference);
  if (!currentTheme || !referenceTheme) {
    return false;
  }

  return (
    matchesThemePresetValue(current, currentTheme, field) &&
    matchesThemePresetValue(reference, referenceTheme, field)
  );
}

function formatThemePreference(
  preference: unknown,
  resolvedTheme: 'light' | 'dark' | undefined
): string {
  if (preference === 'auto') {
    return resolvedTheme ? `Auto (resolved ${titleCase(resolvedTheme)})` : 'Auto';
  }

  if (preference === 'light' || preference === 'dark') {
    return titleCase(preference);
  }

  return asString(preference);
}

function formatContrastReference(reference: unknown): string {
  if (!reference || typeof reference !== 'object') {
    return asString(reference);
  }

  const candidate = reference as ContrastReference;
  const hasStep = typeof candidate.stepIndex === 'number' && Number.isFinite(candidate.stepIndex);
  const stepSuffix = hasStep ? `, step ${candidate.stepIndex * 10}` : '';
  if (candidate.kind === 'palette') {
    return `Palette ${(candidate.paletteIndex ?? 0) + 1}${stepSuffix}`;
  }

  return `Neutral${stepSuffix}`;
}

function formatContrastMode(value: unknown): string {
  return value === 'manual' ? 'Manual' : 'Auto';
}

function formatTargetConstraint(constraint: Extract<Constraint, { type: 'target-color' }>): string {
  const metricLabel = getTargetColorMetricLabel(
    (constraint.metric ?? 'ok') as ColorDifferenceMetric
  );
  const parts = [constraint.targetHex.toUpperCase(), metricLabel];

  if (constraint.mustPass) {
    parts.push('Must pass');
  }

  if (!constraint.enabled) {
    parts.push('Disabled');
  }

  return parts.join(' · ');
}

function formatRuleConstraint(constraint: Extract<Constraint, { type: 'contrast-rule' }>): string {
  const scopeLabel = constraint.scope === 'neutral' ? 'Neutral' : 'All palettes';
  const referenceLabel = constraint.reference === 'low' ? 'Low ref' : 'High ref';
  const thresholdLabel = getConstraintThresholdLabel(constraint.level as ConstraintThresholdKey);
  const parts = [
    scopeLabel,
    `Step ${constraint.stepIndex * 10}`,
    referenceLabel,
    `${constraint.algorithm as ContrastAlgorithm} ${thresholdLabel}`
  ];

  if (!constraint.enabled) {
    parts.push('Disabled');
  }

  return parts.join(' · ');
}

function formatConstraint(constraint: Constraint): string {
  return constraint.type === 'target-color'
    ? formatTargetConstraint(constraint)
    : formatRuleConstraint(constraint);
}

function formatConstraintLabel(constraint: Constraint): string {
  return constraint.type === 'target-color' ? 'Target color' : 'Contrast rule';
}

function constraintContentEqual(left: Constraint, right: Constraint): boolean {
  return deepEqual({ ...left, id: undefined }, { ...right, id: undefined });
}

function buildIndexedEntries(options: {
  field: string;
  labelForIndex: (index: number) => string;
  currentValues: number[];
  referenceValues: number[];
  currentCount: number;
  referenceCount: number;
  defaultValue: number;
}): DiffEntry[] {
  const entries: DiffEntry[] = [];
  const maxCount = Math.max(options.currentCount, options.referenceCount);

  for (let index = 0; index < maxCount; index += 1) {
    const currentPresent = index < options.currentCount;
    const referencePresent = index < options.referenceCount;
    const currentValue = currentPresent
      ? (options.currentValues[index] ?? options.defaultValue)
      : options.defaultValue;
    const referenceValue = referencePresent
      ? (options.referenceValues[index] ?? options.defaultValue)
      : options.defaultValue;

    if (currentPresent && referencePresent) {
      if (currentValue !== referenceValue) {
        entries.push(
          createChangedEntry(
            `${options.field}.${index}`,
            options.labelForIndex(index),
            currentValue,
            referenceValue
          )
        );
      }

      continue;
    }

    if (!referencePresent && currentPresent && currentValue !== options.defaultValue) {
      entries.push(
        createOneSidedEntry(
          'added',
          `${options.field}.${index}`,
          options.labelForIndex(index),
          currentValue
        )
      );
    }

    if (!currentPresent && referencePresent && referenceValue !== options.defaultValue) {
      entries.push(
        createOneSidedEntry(
          'removed',
          `${options.field}.${index}`,
          options.labelForIndex(index),
          referenceValue
        )
      );
    }
  }

  return entries;
}

function buildNamedEntries(options: {
  field: string;
  labelForIndex: (index: number) => string;
  currentValues?: string[];
  referenceValues?: string[];
  currentCount: number;
  referenceCount: number;
}): DiffEntry[] {
  const currentValues =
    normalizeCustomPaletteNames(options.currentValues, options.currentCount) ?? [];
  const referenceValues =
    normalizeCustomPaletteNames(options.referenceValues, options.referenceCount) ?? [];
  const entries: DiffEntry[] = [];
  const maxCount = Math.max(options.currentCount, options.referenceCount);

  for (let index = 0; index < maxCount; index += 1) {
    const currentPresent = index < options.currentCount;
    const referencePresent = index < options.referenceCount;
    const currentValue = normalizeCustomPaletteName(currentValues[index]) ?? '';
    const referenceValue = normalizeCustomPaletteName(referenceValues[index]) ?? '';

    if (currentPresent && referencePresent) {
      if (currentValue && referenceValue && currentValue !== referenceValue) {
        entries.push(
          createChangedEntry(
            `${options.field}.${index}`,
            options.labelForIndex(index),
            currentValue,
            referenceValue
          )
        );
      } else if (!referenceValue && currentValue) {
        entries.push(
          createOneSidedEntry(
            'added',
            `${options.field}.${index}`,
            options.labelForIndex(index),
            currentValue
          )
        );
      } else if (referenceValue && !currentValue) {
        entries.push(
          createOneSidedEntry(
            'removed',
            `${options.field}.${index}`,
            options.labelForIndex(index),
            referenceValue
          )
        );
      }

      continue;
    }

    if (!referencePresent && currentPresent && currentValue) {
      entries.push(
        createOneSidedEntry(
          'added',
          `${options.field}.${index}`,
          options.labelForIndex(index),
          currentValue
        )
      );
    }

    if (!currentPresent && referencePresent && referenceValue) {
      entries.push(
        createOneSidedEntry(
          'removed',
          `${options.field}.${index}`,
          options.labelForIndex(index),
          referenceValue
        )
      );
    }
  }

  return entries;
}

export function diffColorStates(
  current: Record<string, unknown>,
  reference: Record<string, unknown>
): ConfigurationDiff {
  const generationChanges: DiffEntry[] = [];
  const contrastChanges: DiffEntry[] = [];
  const constraintChanges: DiffEntry[] = [];
  const namingChanges: DiffEntry[] = [];

  for (const field of [
    'numColors',
    'numPalettes',
    'baseColor',
    'warmth',
    'warmthHue',
    'x1',
    'y1',
    'x2',
    'y2',
    'chromaMultiplier'
  ]) {
    if (!deepEqual(current[field], reference[field])) {
      if (
        THEME_PRESET_BACKED_GENERATION_FIELDS.has(field) &&
        shouldIgnoreThemePresetBackedField(
          current,
          reference,
          field as keyof (typeof themePresets)['light']
        )
      ) {
        continue;
      }

      generationChanges.push(
        createChangedEntry(
          field,
          GENERATION_FIELD_LABELS[field] ?? field,
          current[field],
          reference[field]
        )
      );
    }
  }

  if (current.themePreference !== reference.themePreference) {
    generationChanges.push({
      field: 'themePreference',
      label: GENERATION_FIELD_LABELS.themePreference,
      kind: 'changed',
      referenceValue: formatThemePreference(reference.themePreference, getResolvedTheme(reference)),
      currentValue: formatThemePreference(current.themePreference, getResolvedTheme(current))
    });
  }

  generationChanges.push(
    ...buildIndexedEntries({
      field: 'lightnessNudgers',
      labelForIndex: (index) => `Neutral step ${index * 10} lightness adjustment`,
      currentValues: asNumberArray(current.lightnessNudgers),
      referenceValues: asNumberArray(reference.lightnessNudgers),
      currentCount: asNumber(current.numColors, DEFAULT_NUM_COLORS),
      referenceCount: asNumber(reference.numColors, DEFAULT_NUM_COLORS),
      defaultValue: 0
    }),
    ...buildIndexedEntries({
      field: 'hueNudgers',
      labelForIndex: (index) => `Palette ${index + 1} hue adjustment`,
      currentValues: asNumberArray(current.hueNudgers),
      referenceValues: asNumberArray(reference.hueNudgers),
      currentCount: asNumber(current.numPalettes, DEFAULT_NUM_PALETTES),
      referenceCount: asNumber(reference.numPalettes, DEFAULT_NUM_PALETTES),
      defaultValue: 0
    }),
    ...buildIndexedEntries({
      field: 'stepSaturationNudgers',
      labelForIndex: (index) => `Step ${index * 10} saturation adjustment`,
      currentValues: asNumberArray(current.stepSaturationNudgers),
      referenceValues: asNumberArray(reference.stepSaturationNudgers),
      currentCount: asNumber(current.numColors, DEFAULT_NUM_COLORS),
      referenceCount: asNumber(reference.numColors, DEFAULT_NUM_COLORS),
      defaultValue: 0
    }),
    ...buildIndexedEntries({
      field: 'paletteSaturationNudgers',
      labelForIndex: (index) => `Palette ${index + 1} saturation adjustment`,
      currentValues: asNumberArray(current.paletteSaturationNudgers),
      referenceValues: asNumberArray(reference.paletteSaturationNudgers),
      currentCount: asNumber(current.numPalettes, DEFAULT_NUM_PALETTES),
      referenceCount: asNumber(reference.numPalettes, DEFAULT_NUM_PALETTES),
      defaultValue: 0
    }),
    ...buildIndexedEntries({
      field: 'paletteChromaNudgers',
      labelForIndex: (index) => `Palette ${index + 1} chroma adjustment`,
      currentValues: asNumberArray(current.paletteChromaNudgers),
      referenceValues: asNumberArray(reference.paletteChromaNudgers),
      currentCount: asNumber(current.numPalettes, DEFAULT_NUM_PALETTES),
      referenceCount: asNumber(reference.numPalettes, DEFAULT_NUM_PALETTES),
      defaultValue: 1
    })
  );

  if (current.contrastMode !== reference.contrastMode) {
    contrastChanges.push({
      field: 'contrastMode',
      label: 'Contrast mode',
      kind: 'changed',
      referenceValue: formatContrastMode(reference.contrastMode),
      currentValue: formatContrastMode(current.contrastMode)
    });
  }

  const currentAuto = current.contrastMode === 'auto';
  const referenceAuto = reference.contrastMode === 'auto';
  const currentManual = current.contrastMode === 'manual';
  const referenceManual = reference.contrastMode === 'manual';

  if (currentAuto && referenceAuto) {
    if (
      !deepEqual(current.lowReference, reference.lowReference) &&
      !shouldIgnoreThemePresetBackedField(current, reference, 'lowReference')
    ) {
      contrastChanges.push({
        field: 'lowReference',
        label: 'Low contrast reference',
        kind: 'changed',
        referenceValue: formatContrastReference(reference.lowReference),
        currentValue: formatContrastReference(current.lowReference)
      });
    }

    if (
      !deepEqual(current.highReference, reference.highReference) &&
      !shouldIgnoreThemePresetBackedField(current, reference, 'highReference')
    ) {
      contrastChanges.push({
        field: 'highReference',
        label: 'High contrast reference',
        kind: 'changed',
        referenceValue: formatContrastReference(reference.highReference),
        currentValue: formatContrastReference(current.highReference)
      });
    }
  }

  if (currentManual || referenceManual) {
    const currentContrast = (current.contrast as Record<string, unknown> | undefined) ?? {};
    const referenceContrast = (reference.contrast as Record<string, unknown> | undefined) ?? {};

    if (currentContrast.low !== referenceContrast.low) {
      contrastChanges.push({
        field: 'contrast.low',
        label: 'Low contrast color',
        kind: 'changed',
        referenceValue: asString(referenceContrast.low),
        currentValue: asString(currentContrast.low)
      });
    }

    if (currentContrast.high !== referenceContrast.high) {
      contrastChanges.push({
        field: 'contrast.high',
        label: 'High contrast color',
        kind: 'changed',
        referenceValue: asString(referenceContrast.high),
        currentValue: asString(currentContrast.high)
      });
    }
  }

  if (!deepEqual(current.solveAdjacentStopLows, reference.solveAdjacentStopLows)) {
    contrastChanges.push(
      createChangedEntry(
        'solveAdjacentStopLows',
        'Solve adjacent stops',
        current.solveAdjacentStopLows,
        reference.solveAdjacentStopLows
      )
    );
  }

  const currentConstraints = asConstraints(current.constraints);
  const referenceConstraints = asConstraints(reference.constraints);
  const referenceConstraintMap = new Map(
    referenceConstraints.map((constraint) => [constraint.id, constraint])
  );
  const currentConstraintMap = new Map(
    currentConstraints.map((constraint) => [constraint.id, constraint])
  );
  const referenceConstraintIndexById = new Map(
    referenceConstraints.map((constraint, index) => [constraint.id, index])
  );
  let referenceCursor = 0;

  for (const constraint of currentConstraints) {
    const referenceConstraint = referenceConstraintMap.get(constraint.id);

    if (!referenceConstraint) {
      constraintChanges.push({
        field: `constraint.${constraint.id}`,
        label: formatConstraintLabel(constraint),
        kind: 'added',
        currentValue: formatConstraint(constraint)
      });
      continue;
    }

    const targetReferenceIndex = referenceConstraintIndexById.get(constraint.id) ?? referenceCursor;
    while (referenceCursor < targetReferenceIndex) {
      const missingReferenceConstraint = referenceConstraints[referenceCursor];
      if (!currentConstraintMap.has(missingReferenceConstraint.id)) {
        constraintChanges.push({
          field: `constraint.${missingReferenceConstraint.id}`,
          label: formatConstraintLabel(missingReferenceConstraint),
          kind: 'removed',
          referenceValue: formatConstraint(missingReferenceConstraint)
        });
      }
      referenceCursor += 1;
    }

    if (!constraintContentEqual(constraint, referenceConstraint)) {
      constraintChanges.push({
        field: `constraint.${constraint.id}`,
        label: formatConstraintLabel(constraint),
        kind: 'changed',
        referenceValue: formatConstraint(referenceConstraint),
        currentValue: formatConstraint(constraint)
      });
    }

    referenceCursor = targetReferenceIndex + 1;
  }

  while (referenceCursor < referenceConstraints.length) {
    const missingReferenceConstraint = referenceConstraints[referenceCursor];
    if (!currentConstraintMap.has(missingReferenceConstraint.id)) {
      constraintChanges.push({
        field: `constraint.${missingReferenceConstraint.id}`,
        label: formatConstraintLabel(missingReferenceConstraint),
        kind: 'removed',
        referenceValue: formatConstraint(missingReferenceConstraint)
      });
    }
    referenceCursor += 1;
  }

  const currentNeutralName = normalizeCustomPaletteName(current.customNeutralName);
  const referenceNeutralName = normalizeCustomPaletteName(reference.customNeutralName);

  if (currentNeutralName && referenceNeutralName && currentNeutralName !== referenceNeutralName) {
    namingChanges.push({
      field: 'customNeutralName',
      label: 'Neutral palette name',
      kind: 'changed',
      referenceValue: referenceNeutralName,
      currentValue: currentNeutralName
    });
  } else if (currentNeutralName && !referenceNeutralName) {
    namingChanges.push({
      field: 'customNeutralName',
      label: 'Neutral palette name',
      kind: 'added',
      currentValue: currentNeutralName
    });
  } else if (!currentNeutralName && referenceNeutralName) {
    namingChanges.push({
      field: 'customNeutralName',
      label: 'Neutral palette name',
      kind: 'removed',
      referenceValue: referenceNeutralName
    });
  }

  namingChanges.push(
    ...buildNamedEntries({
      field: 'customPaletteNames',
      labelForIndex: (index) => `Palette ${index + 1} name`,
      currentValues: current.customPaletteNames as string[] | undefined,
      referenceValues: reference.customPaletteNames as string[] | undefined,
      currentCount: asNumber(current.numPalettes, DEFAULT_NUM_PALETTES),
      referenceCount: asNumber(reference.numPalettes, DEFAULT_NUM_PALETTES)
    })
  );

  const hasChanges =
    generationChanges.length > 0 ||
    contrastChanges.length > 0 ||
    constraintChanges.length > 0 ||
    namingChanges.length > 0;

  return {
    hasChanges,
    generationChanges,
    contrastChanges,
    constraintChanges,
    namingChanges,
    timestamp: Date.now()
  };
}
