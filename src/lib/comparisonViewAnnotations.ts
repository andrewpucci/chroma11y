import Color from 'colorjs.io';

import {
  colorToCssOklch,
  getContrastForAlgorithm,
  MIN_APCA_LC_BODY,
  MIN_APCA_LC_FLUENT,
  MIN_APCA_LC_LARGE,
  MIN_CONTRAST_RATIO,
  requiresWideGamutWarning
} from '$lib/colorUtils';
import type { ColorDifferenceMetric, ContrastAlgorithm, GamutSpace } from '$lib/types';

export interface ComparisonChip {
  label: 'Changed' | 'Contrast down' | 'Contrast up' | 'Gamut added' | 'Gamut cleared';
  ariaLabel: string;
  tone: 'neutral' | 'improved' | 'regressed' | 'warning';
}

export interface ComparisonAnnotation {
  chip: ComparisonChip | null;
  quiet: boolean;
}

export interface ComparisonStatusConfig {
  contrast: { low: string; high: string };
  contrastAlgorithm: ContrastAlgorithm;
  gamutSpace: GamutSpace;
}

function toComparisonCssColor(color: Color | string, gamutSpace: GamutSpace): string {
  if (typeof color === 'string') {
    return color;
  }

  return colorToCssOklch(color, gamutSpace);
}

function computeColorDifference(
  currentColor: Color | string,
  referenceColor: Color | string,
  currentGamutSpace: GamutSpace,
  referenceGamutSpace: GamutSpace,
  metric: ColorDifferenceMetric
): number {
  try {
    const current = new Color(toComparisonCssColor(currentColor, currentGamutSpace));
    const reference = new Color(toComparisonCssColor(referenceColor, referenceGamutSpace));

    return metric === 'ok' ? current.deltaEOK(reference) : current.deltaE2000(reference);
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function getContrastStatusVector(
  color: Color | string,
  { contrast, contrastAlgorithm, gamutSpace }: ComparisonStatusConfig
): boolean[] {
  const comparisonColor = toComparisonCssColor(color, gamutSpace);
  const lowContrast = getContrastForAlgorithm(comparisonColor, contrast.low, contrastAlgorithm);
  const highContrast = getContrastForAlgorithm(comparisonColor, contrast.high, contrastAlgorithm);

  if (contrastAlgorithm === 'APCA') {
    return [
      lowContrast >= MIN_APCA_LC_LARGE,
      lowContrast >= MIN_APCA_LC_FLUENT,
      lowContrast >= MIN_APCA_LC_BODY,
      highContrast >= MIN_APCA_LC_LARGE,
      highContrast >= MIN_APCA_LC_FLUENT,
      highContrast >= MIN_APCA_LC_BODY
    ];
  }

  return [
    lowContrast >= 3,
    lowContrast >= MIN_CONTRAST_RATIO,
    lowContrast >= 7,
    highContrast >= 3,
    highContrast >= MIN_CONTRAST_RATIO,
    highContrast >= 7
  ];
}

function getContrastDirection(
  currentColor: Color | string,
  referenceColor: Color | string,
  currentConfig: ComparisonStatusConfig,
  referenceConfig: ComparisonStatusConfig
): 'up' | 'down' | null {
  const currentStatuses = getContrastStatusVector(currentColor, currentConfig);
  const referenceStatuses = getContrastStatusVector(referenceColor, referenceConfig);

  let improved = false;
  let regressed = false;

  for (
    let index = 0;
    index < Math.min(currentStatuses.length, referenceStatuses.length);
    index += 1
  ) {
    if (referenceStatuses[index] && !currentStatuses[index]) {
      regressed = true;
    }

    if (!referenceStatuses[index] && currentStatuses[index]) {
      improved = true;
    }
  }

  if (regressed) {
    return 'down';
  }

  if (improved) {
    return 'up';
  }

  return null;
}

function hasGamutWarning(color: Color | string, gamutSpace: GamutSpace): boolean {
  try {
    const sourceColor =
      typeof color === 'string' ? new Color(color).to('oklch') : color.to('oklch');
    return requiresWideGamutWarning(sourceColor, gamutSpace);
  } catch {
    return false;
  }
}

function getGamutDirection(
  currentColor: Color | string,
  referenceColor: Color | string,
  currentConfig: ComparisonStatusConfig,
  referenceConfig: ComparisonStatusConfig
): 'added' | 'cleared' | null {
  const currentWarning = hasGamutWarning(currentColor, currentConfig.gamutSpace);
  const referenceWarning = hasGamutWarning(referenceColor, referenceConfig.gamutSpace);

  if (!referenceWarning && currentWarning) {
    return 'added';
  }

  if (referenceWarning && !currentWarning) {
    return 'cleared';
  }

  return null;
}

export function buildComparisonAnnotation(params: {
  currentHex: string;
  referenceHex: string;
  currentColor?: Color | null;
  referenceColor?: Color | null;
  metric: ColorDifferenceMetric;
  threshold: number;
  currentStatusConfig: ComparisonStatusConfig;
  referenceStatusConfig: ComparisonStatusConfig;
}): ComparisonAnnotation {
  const {
    currentHex,
    referenceHex,
    currentColor = null,
    referenceColor = null,
    metric,
    threshold,
    currentStatusConfig,
    referenceStatusConfig
  } = params;

  const contrastDirection = getContrastDirection(
    currentColor ?? currentHex,
    referenceColor ?? referenceHex,
    currentStatusConfig,
    referenceStatusConfig
  );
  if (contrastDirection === 'down') {
    return {
      chip: {
        label: 'Contrast down',
        ariaLabel: 'Contrast regressed compared with reference',
        tone: 'regressed'
      },
      quiet: false
    };
  }

  if (contrastDirection === 'up') {
    return {
      chip: {
        label: 'Contrast up',
        ariaLabel: 'Contrast improved compared with reference',
        tone: 'improved'
      },
      quiet: false
    };
  }

  const gamutDirection = getGamutDirection(
    currentColor ?? currentHex,
    referenceColor ?? referenceHex,
    currentStatusConfig,
    referenceStatusConfig
  );
  if (gamutDirection === 'added') {
    return {
      chip: {
        label: 'Gamut added',
        ariaLabel: 'Gamut warning added compared with reference',
        tone: 'warning'
      },
      quiet: false
    };
  }

  if (gamutDirection === 'cleared') {
    return {
      chip: {
        label: 'Gamut cleared',
        ariaLabel: 'Gamut warning cleared compared with reference',
        tone: 'improved'
      },
      quiet: false
    };
  }

  const colorDifference = computeColorDifference(
    currentColor ?? currentHex,
    referenceColor ?? referenceHex,
    currentStatusConfig.gamutSpace,
    referenceStatusConfig.gamutSpace,
    metric
  );
  if (colorDifference > threshold) {
    return {
      chip: {
        label: 'Changed',
        ariaLabel: 'Color changed compared with reference',
        tone: 'neutral'
      },
      quiet: false
    };
  }

  return {
    chip: null,
    quiet: true
  };
}
