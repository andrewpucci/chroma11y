<script lang="ts">
  import {
    copyToClipboard,
    getPrintableContrastForAlgorithm,
    getContrastForAlgorithm,
    MIN_CONTRAST_RATIO,
    MIN_APCA_LC_BODY
  } from '$lib/colorUtils';
  import { contrastColors, swatchLabels, contrastAlgorithm } from '$lib/stores';
  import { openDrawer } from '$lib/drawerStore';
  import { announce } from '$lib/announce';
  import type Color from 'colorjs.io';

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
  const contrastAlgorithmLocal = $derived($contrastAlgorithm);

  const shownValue = $derived(displayValue || color);

  const lowContrastDisplay = $derived(
    getPrintableContrastForAlgorithm(color, contrastColorsLocal.low, contrastAlgorithmLocal)
  );
  const highContrastDisplay = $derived(
    getPrintableContrastForAlgorithm(color, contrastColorsLocal.high, contrastAlgorithmLocal)
  );

  const contrastUnit = $derived(contrastAlgorithmLocal === 'APCA' ? ' Lc' : '');

  const textColor = $derived(calculateTextColor(color, contrastColorsLocal));

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
    const threshold = contrastAlgorithmLocal === 'APCA' ? MIN_APCA_LC_BODY : MIN_CONTRAST_RATIO;
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
</script>

<button
  class="color-swatch"
  style="background-color: {displayValue || color}; color: {textColor};"
  onclick={() => {
    if (oklchColor) {
      openDrawer({ hex: color, oklch: oklchColor, step: label, paletteName, isNeutral });
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
  {#if label && (swatchLabelsLocal === 'both' || swatchLabelsLocal === 'step')}
    <span class="step">{label}</span>
  {/if}
  {#if swatchLabelsLocal === 'both' || swatchLabelsLocal === 'value'}
    <span class="hex">{shownValue}</span>
  {/if}
  {#if swatchLabelsLocal === 'both' || swatchLabelsLocal === 'value'}
    <span class="contrast-info" aria-hidden="true"
      >{lowContrastDisplay}{contrastUnit} {highContrastDisplay}{contrastUnit}</span
    >
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
      transform var(--transition-fast),
      border-color var(--transition-fast);
    width: var(--swatch-width, 96px);
    flex: var(--swatch-flex, 0 0 96px);
    min-height: 64px;
    text-align: left;
    overflow: hidden;
  }

  .color-swatch::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      color-mix(in oklab, black 34%, transparent),
      transparent 60%
    );
    opacity: 0.35;
    pointer-events: none;
  }

  /* Touch-friendly tap targets on mobile (44x44px minimum) */
  @media (max-width: 768px) {
    .color-swatch {
      width: var(--swatch-width, 96px);
      flex-basis: var(--swatch-width, 96px);
      min-height: 72px;
      touch-action: manipulation;
    }
  }

  @media (max-width: 575px) {
    .color-swatch {
      width: var(--swatch-width, 92px);
      flex-basis: var(--swatch-width, 92px);
      min-height: 64px;
    }

    .hex {
      font-size: var(--font-size-xs);
    }

    .step {
      font-size: var(--font-size-xs);
    }

    .contrast-info {
      font-size: var(--font-size-xs);
    }
  }

  .color-swatch:hover {
    transform: translateY(-2px);
    border-color: color-mix(in oklab, var(--border) 40%, var(--accent));
  }

  .color-swatch:active {
    transform: translateY(-1px);
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

  .contrast-info {
    position: relative;
    display: flex;
    justify-content: space-between;
    font-size: var(--font-size-xs);
    opacity: 0.65;
    font-family: var(--text-mono);
    white-space: nowrap;
  }
</style>
