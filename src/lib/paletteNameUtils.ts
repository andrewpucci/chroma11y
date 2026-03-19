import { getPaletteName } from './colorUtils';

export const DEFAULT_NEUTRAL_PALETTE_NAME = 'Gray';

const DEFAULT_GENERATED_PALETTE_NAMES = [
  'blue',
  'purple',
  'orchid',
  'pink',
  'red',
  'orange',
  'gold',
  'lime',
  'green',
  'turquoise',
  'skyblue'
] as const;

export interface ExportPaletteNameOptions {
  neutrals: string[];
  palettes: string[][];
  lowContrastColor: string;
  customNeutralName?: string;
  customPaletteNames?: string[];
}

export interface ExportPaletteNameEntry {
  label: string;
  slug: string;
}

export interface ExportPaletteNames {
  neutral: ExportPaletteNameEntry;
  palettes: ExportPaletteNameEntry[];
}

export function normalizeCustomPaletteName(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function normalizeCustomPaletteNames(
  value: unknown,
  maxLength?: number
): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const limited =
    typeof maxLength === 'number' ? value.slice(0, Math.max(0, maxLength)) : value.slice();
  const normalized = limited.map((entry) => normalizeCustomPaletteName(entry) ?? '');

  let lastNamedIndex = -1;
  for (let index = normalized.length - 1; index >= 0; index -= 1) {
    if (normalized[index]) {
      lastNamedIndex = index;
      break;
    }
  }

  return lastNamedIndex === -1 ? undefined : normalized.slice(0, lastNamedIndex + 1);
}

export function getGeneratedPaletteFallbackName(index: number): string {
  const fallbackSlug = DEFAULT_GENERATED_PALETTE_NAMES[index];
  return fallbackSlug ? slugToTitle(fallbackSlug) : `Palette ${index + 1}`;
}

export function resolveNeutralPaletteName(
  neutrals: string[],
  lowContrastColor: string,
  customNeutralName?: string
): string {
  const customName = normalizeCustomPaletteName(customNeutralName);
  if (customName) {
    return customName;
  }

  const generatedName = canonicalizeNeutralName(getPaletteName(neutrals, lowContrastColor));
  return isResolvedPaletteName(generatedName) ? generatedName : DEFAULT_NEUTRAL_PALETTE_NAME;
}

export function resolveGeneratedPaletteName(
  palette: string[],
  lowContrastColor: string,
  index: number,
  customPaletteNames?: string[]
): string {
  const customName = normalizeCustomPaletteName(customPaletteNames?.[index]);
  if (customName) {
    return customName;
  }

  const generatedName = getPaletteName(palette, lowContrastColor);
  return isResolvedPaletteName(generatedName)
    ? generatedName
    : getGeneratedPaletteFallbackName(index);
}

export function resolveGeneratedPaletteNames(
  palettes: string[][],
  lowContrastColor: string,
  customPaletteNames?: string[]
): string[] {
  return palettes.map((palette, index) =>
    resolveGeneratedPaletteName(palette, lowContrastColor, index, customPaletteNames)
  );
}

export function slugifyPaletteName(name: string): string {
  const normalized = normalizeCustomPaletteName(name);
  if (!normalized) {
    return 'palette';
  }

  return normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function resolveExportPaletteNames(options: ExportPaletteNameOptions): ExportPaletteNames {
  const usedSlugs = new Set<string>();

  const getUniqueSlug = (label: string, fallbackSlug: string): string => {
    const baseSlug = slugifyPaletteName(label) || fallbackSlug;
    let candidate = baseSlug;
    let suffix = 2;

    while (usedSlugs.has(candidate)) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    usedSlugs.add(candidate);
    return candidate;
  };

  const neutralLabel = resolveNeutralPaletteName(
    options.neutrals,
    options.lowContrastColor,
    options.customNeutralName
  );
  const neutral = {
    label: neutralLabel,
    slug:
      options.neutrals.length > 0
        ? getUniqueSlug(neutralLabel, 'gray')
        : slugifyPaletteName(neutralLabel) || 'gray'
  };

  const palettes = options.palettes.map((palette, index) => {
    const label = resolveGeneratedPaletteName(
      palette,
      options.lowContrastColor,
      index,
      options.customPaletteNames
    );

    return {
      label,
      slug: getUniqueSlug(label, `palette-${index + 1}`)
    };
  });

  return { neutral, palettes };
}

function slugToTitle(slug: string): string {
  return slug.replace(/(^|-)\w/g, (match) => match.replace('-', ' ').toUpperCase()).trim();
}

function canonicalizeNeutralName(name: string): string {
  return name.trim().toLowerCase() === 'grey' ? DEFAULT_NEUTRAL_PALETTE_NAME : name;
}

function isResolvedPaletteName(name: string): boolean {
  const normalized = normalizeCustomPaletteName(name);
  return normalized !== undefined && normalized !== 'Unnamed';
}
