<script lang="ts">
  import {
    copyToClipboard,
    colorToCssHex,
    getGamutSpaceLabel,
    getRequiredWideGamut,
    getContrastForAlgorithm,
    requiresWideGamutWarning,
    MIN_CONTRAST_RATIO,
    MIN_APCA_LC_FLUENT,
    MIN_APCA_LC_BODY,
    MIN_APCA_LC_LARGE
  } from '$lib/colorUtils';
  import {
    contrastColors,
    swatchLabels,
    gamutSpace,
    showSwatchGamutWarnings,
    showSwatchContrastIndicators,
    swatchContrastIndicators,
    contrastAlgorithm
  } from '$lib/stores';
  import { openDrawer } from '$lib/drawerStore';
  import { announce } from '$lib/announce';
  import Icon from './Icon.svelte';
  import Color from 'colorjs.io';

  interface Props {
    color: string;
    displayValue?: string;
    label?: string;
    oklchColor?: Color | null;
    paletteName?: string;
    isNeutral?: boolean;
  }

  let {
    color,
    displayValue = '',
    label = '',
    oklchColor = null,
    paletteName = '',
    isNeutral = false
  }: Props = $props();

  const contrastColorsLocal = $derived($contrastColors);
  const swatchLabelsLocal = $derived($swatchLabels);
  const gamutSpaceLocal = $derived($gamutSpace);
  const showSwatchGamutWarningsLocal = $derived($showSwatchGamutWarnings);
  const showSwatchContrastIndicatorsLocal = $derived($showSwatchContrastIndicators);
  const swatchContrastIndicatorsLocal = $derived($swatchContrastIndicators);
  const contrastAlgorithmLocal = $derived($contrastAlgorithm);

  const renderedColor = $derived(displayValue || color);
  const shownValue = $derived(renderedColor);
  const renderedHex = $derived.by(() => {
    try {
      return colorToCssHex(new Color(renderedColor));
    } catch {
      return color;
    }
  });
  const sourceOklch = $derived.by(() => {
    if (oklchColor) return oklchColor;
    try {
      return new Color(color).to('oklch');
    } catch {
      try {
        return new Color(renderedColor).to('oklch');
      } catch {
        return null;
      }
    }
  });
  const warningColorSource = $derived(sourceOklch);
  const isGamutMapped = $derived.by(() => {
    if (!warningColorSource) return false;
    return requiresWideGamutWarning(warningColorSource, gamutSpaceLocal);
  });
  const showGamutWarning = $derived(showSwatchGamutWarningsLocal && isGamutMapped);
  const requiredWideGamut = $derived.by(() => {
    if (!warningColorSource) return null;
    return getRequiredWideGamut(warningColorSource, gamutSpaceLocal);
  });
  const gamutWarningLabel = $derived(
    requiredWideGamut ? getGamutSpaceLabel(requiredWideGamut) : ''
  );

  interface IndicatorBadge {
    criterion: '3:1' | 'AA' | 'AAA' | 'Large' | 'Fluent' | 'Body';
    passes: boolean;
    ariaLabel: string;
  }

  interface IndicatorGroup {
    label: 'Low' | 'High';
    badges: IndicatorBadge[];
  }

  const INDICATOR_TINT_MAX_ALPHA = 0.05;
  const INDICATOR_TINT_SEARCH_ITERATIONS = 10;

  const hasVisibleIndicatorsForAlgorithm = $derived.by(() => {
    if (contrastAlgorithmLocal === 'WCAG') {
      return (
        swatchContrastIndicatorsLocal.wcagThreeToOne ||
        swatchContrastIndicatorsLocal.wcagAA ||
        swatchContrastIndicatorsLocal.wcagAAA
      );
    }
    return (
      swatchContrastIndicatorsLocal.apcaLarge ||
      swatchContrastIndicatorsLocal.apcaFluent ||
      swatchContrastIndicatorsLocal.apcaBody
    );
  });

  const shouldShowIndicators = $derived(
    showSwatchContrastIndicatorsLocal &&
      swatchLabelsLocal !== 'none' &&
      hasVisibleIndicatorsForAlgorithm
  );

  const indicatorGroups = $derived.by((): IndicatorGroup[] => {
    const groups: IndicatorGroup[] = [];

    for (const [groupLabel, contrastColor] of [
      ['Low', contrastColorsLocal.low],
      ['High', contrastColorsLocal.high]
    ] as const) {
      const contrastValue = getContrastForAlgorithm(
        renderedColor,
        contrastColor,
        contrastAlgorithmLocal
      );
      if (contrastAlgorithmLocal === 'WCAG') {
        const threeToOnePass = contrastValue >= 3;
        const aaPass = contrastValue >= MIN_CONTRAST_RATIO;
        const aaaPass = contrastValue >= 7;
        const badges: IndicatorBadge[] = [];
        if (swatchContrastIndicatorsLocal.wcagThreeToOne) {
          badges.push({
            criterion: '3:1',
            passes: threeToOnePass,
            ariaLabel: `${groupLabel} contrast WCAG 2.2 3 to 1 ${threeToOnePass ? 'pass' : 'fail'}`
          });
        }
        if (swatchContrastIndicatorsLocal.wcagAA) {
          badges.push({
            criterion: 'AA',
            passes: aaPass,
            ariaLabel: `${groupLabel} contrast WCAG 2.2 AA ${aaPass ? 'pass' : 'fail'}`
          });
        }
        if (swatchContrastIndicatorsLocal.wcagAAA) {
          badges.push({
            criterion: 'AAA',
            passes: aaaPass,
            ariaLabel: `${groupLabel} contrast WCAG 2.2 AAA ${aaaPass ? 'pass' : 'fail'}`
          });
        }

        groups.push({
          label: groupLabel,
          badges
        });
      } else {
        const largePass = contrastValue >= MIN_APCA_LC_LARGE;
        const fluentPass = contrastValue >= MIN_APCA_LC_FLUENT;
        const bodyPass = contrastValue >= MIN_APCA_LC_BODY;
        const badges: IndicatorBadge[] = [];
        if (swatchContrastIndicatorsLocal.apcaLarge) {
          badges.push({
            criterion: 'Large',
            passes: largePass,
            ariaLabel: `${groupLabel} contrast APCA Large ${largePass ? 'pass' : 'fail'}`
          });
        }
        if (swatchContrastIndicatorsLocal.apcaFluent) {
          badges.push({
            criterion: 'Fluent',
            passes: fluentPass,
            ariaLabel: `${groupLabel} contrast APCA Fluent ${fluentPass ? 'pass' : 'fail'}`
          });
        }
        if (swatchContrastIndicatorsLocal.apcaBody) {
          badges.push({
            criterion: 'Body',
            passes: bodyPass,
            ariaLabel: `${groupLabel} contrast APCA Body ${bodyPass ? 'pass' : 'fail'}`
          });
        }

        groups.push({
          label: groupLabel,
          badges
        });
      }
    }

    return groups;
  });

  const textColor = $derived(calculateTextColor(renderedColor, contrastColorsLocal));
  const indicatorTintAlpha = $derived.by(() => {
    if (!shouldShowIndicators) return INDICATOR_TINT_MAX_ALPHA;

    const minimumContrast =
      contrastAlgorithmLocal === 'APCA' ? MIN_APCA_LC_FLUENT : MIN_CONTRAST_RATIO;
    const baseContrast = getContrastForAlgorithm(renderedColor, textColor, contrastAlgorithmLocal);
    if (baseContrast < minimumContrast) return 0;

    const contrastAtMaxTint = getContrastForAlgorithm(
      getTintedBackgroundColor(renderedColor, textColor, INDICATOR_TINT_MAX_ALPHA),
      textColor,
      contrastAlgorithmLocal
    );
    if (contrastAtMaxTint >= minimumContrast) return INDICATOR_TINT_MAX_ALPHA;

    let low = 0;
    let high = INDICATOR_TINT_MAX_ALPHA;
    for (let i = 0; i < INDICATOR_TINT_SEARCH_ITERATIONS; i++) {
      const mid = (low + high) / 2;
      const contrastAtMidTint = getContrastForAlgorithm(
        getTintedBackgroundColor(renderedColor, textColor, mid),
        textColor,
        contrastAlgorithmLocal
      );

      if (contrastAtMidTint >= minimumContrast) {
        low = mid;
      } else {
        high = mid;
      }
    }

    return low;
  });
  const indicatorTintPercent = $derived(`${(indicatorTintAlpha * 100).toFixed(2)}%`);

  /**
   * Determines the optimal text color for a swatch based on contrast ratios.
   * Prefers the contrast color that meets the accessibility threshold; if both
   * meet it (or neither does), uses the one with higher contrast.
   *
   * Note: This function's branching logic is tested indirectly through parent
   * component tests (NeutralPalette, PaletteGrid) and E2E tests. Direct unit
   * testing would require mocking the store subscriptions and contrast
   * calculations, which adds complexity without significant value since the
   * logic is straightforward and the integration is well-covered.
   */
  function calculateTextColor(bgColor: string, contrast: { low: string; high: string }): string {
    const threshold = contrastAlgorithmLocal === 'APCA' ? MIN_APCA_LC_FLUENT : MIN_CONTRAST_RATIO;
    const lowVal = getContrastForAlgorithm(bgColor, contrast.low, contrastAlgorithmLocal);
    const highVal = getContrastForAlgorithm(bgColor, contrast.high, contrastAlgorithmLocal);

    // If both meet threshold, use the one with better (higher) contrast
    if (lowVal >= threshold && highVal >= threshold) {
      return highVal > lowVal ? contrast.high : contrast.low;
    }

    // Only one meets threshold, use that one
    if (lowVal >= threshold) {
      return contrast.low;
    } else if (highVal >= threshold) {
      return contrast.high;
    } else {
      // Neither meets minimum, use the one with better contrast
      return highVal > lowVal ? contrast.high : contrast.low;
    }
  }

  function getTintedBackgroundColor(
    bgColor: string,
    textColorForTint: string,
    tintAlpha: number
  ): string {
    if (tintAlpha <= 0) return bgColor;
    try {
      return new Color(bgColor)
        .mix(new Color(textColorForTint), tintAlpha, { space: 'oklab' })
        .to('srgb')
        .toString({ format: 'hex' });
    } catch {
      return bgColor;
    }
  }
</script>

<button
  class="color-swatch"
  class:color-swatch--gamut-warning={showGamutWarning}
  style="background-color: {renderedColor}; color: {textColor}; --swatch-indicator-tint-alpha: {indicatorTintPercent};"
  onclick={() => {
    if (sourceOklch) {
      openDrawer({
        hex: renderedHex,
        displayValue: shownValue,
        oklch: sourceOklch,
        step: label,
        paletteName,
        isNeutral
      });
      announce(`Opened color info for ${shownValue}, step ${label}`);
    } else {
      copyToClipboard(shownValue);
    }
  }}
  title={oklchColor ? `View color details for ${shownValue}` : `Click to copy ${shownValue}`}
  aria-label="{label ? `${label} ` : ''}{shownValue}{oklchColor
    ? ' — view color details'
    : ' — copy to clipboard'}"
>
  {#if showGamutWarning}
    <span class="gamut-warning-tag" aria-label={`Gamut mapped to ${gamutWarningLabel}`}>
      {gamutWarningLabel}
    </span>
  {/if}
  {#if label && (swatchLabelsLocal === 'both' || swatchLabelsLocal === 'step')}
    <span class="step">{label}</span>
  {/if}
  {#if swatchLabelsLocal === 'both' || swatchLabelsLocal === 'value'}
    <span class="hex">{shownValue}</span>
  {/if}
  {#if shouldShowIndicators}
    <div
      class="contrast-indicators"
      class:contrast-indicators--apca={contrastAlgorithmLocal === 'APCA'}
    >
      {#each indicatorGroups as group (group.label)}
        <div class="indicator-group">
          <span class="indicator-group-label" aria-hidden="true">{group.label}</span>
          <div class="indicator-badges">
            {#each group.badges as badge (`${group.label}-${badge.criterion}`)}
              <span
                class="badge"
                class:badge--pass={badge.passes}
                class:badge--fail={!badge.passes}
                aria-label={badge.ariaLabel}
              >
                <span class="badge-icon">
                  <Icon name={badge.passes ? 'status-pass' : 'status-fail'} size={12} stroke={2} />
                </span>
                <span class="badge-label">{badge.criterion}</span>
              </span>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</button>

<style>
  .color-swatch {
    position: relative;
    display: grid;
    gap: var(--space-xs);
    align-content: end;
    padding: var(--space-xs) var(--space-sm);
    border: 1px solid color-mix(in oklab, var(--border) 70%, transparent);
    border-bottom: var(
      --swatch-border-bottom,
      1px solid color-mix(in oklab, var(--border) 70%, transparent)
    );
    border-radius: var(--radius-md);
    border-bottom-left-radius: var(--swatch-border-bottom-left-radius, var(--radius-md));
    border-bottom-right-radius: var(--swatch-border-bottom-right-radius, var(--radius-md));
    cursor: pointer;
    transition:
      border-color var(--transition-fast),
      box-shadow var(--transition-fast);
    width: var(--swatch-width, 148px);
    flex: var(--swatch-flex, 0 0 148px);
    min-height: 64px;
    text-align: left;
    overflow: hidden;
    /* Subtle inset shadow for better swatch visibility against backgrounds */
    box-shadow: inset 0 0 0 var(--border-width-thin) var(--swatch-inset-shadow-color);
  }

  /* Touch-friendly tap targets on mobile (44x44px minimum) */
  @media (max-width: 768px) {
    .color-swatch {
      width: var(--swatch-width, 136px);
      flex-basis: var(--swatch-width, 136px);
      min-height: 72px;
      touch-action: manipulation;
    }
  }

  @media (max-width: 575px) {
    .color-swatch {
      width: var(--swatch-width, 128px);
      flex-basis: var(--swatch-width, 128px);
      min-height: 64px;
    }

    .hex {
      font-size: var(--font-size-xs);
    }

    .step {
      font-size: var(--font-size-xs);
    }

    .indicator-group-label {
      font-size: var(--font-size-xs);
    }

    .contrast-indicators {
      grid-template-columns: 1fr;
    }
  }

  .color-swatch:hover {
    border-color: color-mix(in oklab, var(--border) 40%, var(--accent));
  }

  .color-swatch--gamut-warning {
    border-color: var(--gamut-warning-border);
    border-width: var(--border-width-medium);
    padding-top: calc(var(--space-md) + var(--space-xs));
    box-shadow: inset 0 0 0 var(--border-width-thin) var(--swatch-inset-shadow-color);
  }

  .gamut-warning-tag {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 2;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    letter-spacing: var(--letter-spacing-wide);
    text-transform: uppercase;
    line-height: 1;
    border-top-right-radius: calc(var(--radius-md) - var(--border-width-medium));
    border-bottom-left-radius: var(--radius-sm);
    border-bottom-right-radius: 0;
    border-top-left-radius: 0;
    padding: calc(var(--space-xs) * 0.75) var(--space-xs);
    background: var(--gamut-warning-bg);
    border-top: 0;
    border-right: 0;
    border-left: var(--border-width-medium) solid var(--gamut-warning-border);
    border-bottom: var(--border-width-medium) solid var(--gamut-warning-border);
    color: var(--gamut-warning-text);
    font-family: var(--text-mono);
  }

  .hex {
    position: relative;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    letter-spacing: var(--letter-spacing-normal);
    font-family: var(--text-mono);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1 1 auto;
    min-width: 0;
  }

  .step {
    position: relative;
    font-size: var(--font-size-xs);
    opacity: 0.9;
    font-weight: var(--font-weight-semibold);
    font-family: var(--text-mono);
    flex: 0 0 auto;
  }

  .contrast-indicators {
    position: relative;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-xs);
  }

  .contrast-indicators--apca {
    grid-template-columns: 1fr;
  }

  .indicator-group {
    display: grid;
    align-content: start;
    gap: var(--space-xs);
    padding: var(--space-xs);
    border: none;
    border-radius: var(--radius-sm);
    background: color-mix(
      in oklab,
      currentColor var(--swatch-indicator-tint-alpha, 5%),
      transparent
    );
    min-width: 0;
    overflow: hidden;
    box-sizing: border-box;
  }

  .indicator-group-label {
    font-size: var(--font-size-xs);
    opacity: 1;
    font-family: var(--text-mono);
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide);
    font-weight: var(--font-weight-semibold);
    color: color-mix(in oklab, currentColor 90%, transparent);
  }

  .indicator-badges {
    display: grid;
    gap: var(--space-xs);
    justify-items: start;
    width: 100%;
    min-width: 0;
  }

  .badge {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: calc(var(--space-xs) * 0.5);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    padding: 0 calc(var(--space-xs) * 0.5);
    border-radius: var(--radius-sm);
    line-height: var(--line-height-tight);
    justify-content: flex-start;
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }

  .badge-icon {
    display: inline-grid;
    place-items: center;
    width: 12px;
    height: 12px;
    flex: 0 0 12px;
  }

  .badge-label {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .badge--pass {
    background: color-mix(in oklab, var(--badge-pass-bg) 70%, transparent);
    color: var(--badge-pass-text);
    border: 1px solid color-mix(in oklab, var(--badge-pass-border) 76%, transparent);
  }

  .badge--fail {
    background: color-mix(in oklab, var(--badge-fail-bg) 70%, transparent);
    color: var(--badge-fail-text);
    border: 1px solid color-mix(in oklab, var(--badge-fail-border) 76%, transparent);
  }
</style>
