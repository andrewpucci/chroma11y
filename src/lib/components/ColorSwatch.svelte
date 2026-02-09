<script lang="ts">
  import { copyToClipboard, getContrast, getPrintableContrast } from '$lib/colorUtils';
  import { contrastColors } from '$lib/stores';

  interface Props {
    color: string;
    label?: string;
  }

  let { color, label = '' }: Props = $props();

  const contrastColorsLocal = $derived($contrastColors);

  const lowContrastDisplay = $derived(getPrintableContrast(color, contrastColorsLocal.low));
  const highContrastDisplay = $derived(getPrintableContrast(color, contrastColorsLocal.high));

  const textColor = $derived(calculateTextColor(color, contrastColorsLocal));

  function calculateTextColor(bgColor: string, contrast: { low: string; high: string }): string {
    const minContrastRatio = 4.5;
    const lowRatio = getContrast(bgColor, contrast.low);
    const highRatio = getContrast(bgColor, contrast.high);

    // If both meet threshold, use the one with better (higher) contrast
    if (lowRatio >= minContrastRatio && highRatio >= minContrastRatio) {
      return highRatio > lowRatio ? contrast.high : contrast.low;
    }

    // Only one meets threshold, use that one
    if (lowRatio >= minContrastRatio) {
      return contrast.low;
    } else if (highRatio >= minContrastRatio) {
      return contrast.high;
    } else {
      // Neither meets minimum, use the one with better contrast
      return highRatio > lowRatio ? contrast.high : contrast.low;
    }
  }
</script>

<button
  class="color-swatch"
  style="background-color: {color}; color: {textColor};"
  onclick={() => copyToClipboard(color)}
  title="Click to copy {color}"
  aria-label="Color {color}{label ? `, step ${label}` : ''}. Click to copy to clipboard"
>
  <div class="overlay" aria-hidden="true"></div>
  <div class="content">
    {#if label}
      <span class="step">{label}</span>
    {/if}
    <span class="hex">{color}</span>
    <div class="contrast-info" aria-hidden="true">
      <span class="low" title="Contrast with low reference">{lowContrastDisplay}</span>
      <span class="high" title="Contrast with high reference">{highContrastDisplay}</span>
    </div>
  </div>
</button>

<style>
  .color-swatch {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-end;
    padding: 0;
    border: 1px solid color-mix(in oklab, var(--border) 70%, transparent);
    border-radius: 12px;
    cursor: pointer;
    transition:
      transform 140ms ease,
      box-shadow 140ms ease,
      border-color 140ms ease;
    width: var(--swatch-width, 96px);
    flex: 0 0 var(--swatch-width, 96px);
    min-height: 64px;
    text-align: left;
    overflow: hidden;
  }

  .overlay {
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

  .content {
    position: relative;
    z-index: 1;
    padding: 0.45rem 0.5rem;
    display: grid;
    gap: 0.25rem;
    min-width: 0;
  }

  /* Touch-friendly tap targets on mobile (44x44px minimum) */
  @media (max-width: 768px) {
    .color-swatch {
      width: var(--swatch-width-md, 96px);
      flex-basis: var(--swatch-width-md, 96px);
      min-height: 72px;
      touch-action: manipulation;
    }
  }

  @media (max-width: 575px) {
    .color-swatch {
      width: var(--swatch-width-sm, 92px);
      flex-basis: var(--swatch-width-sm, 92px);
      min-height: 64px;
    }

    .hex {
      font-size: 0.72rem;
    }

    .step {
      font-size: 0.7rem;
    }

    .contrast-info {
      font-size: 0.72rem;
    }
  }

  .color-swatch:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: color-mix(in oklab, var(--border) 40%, var(--accent));
  }

  .color-swatch:active {
    transform: translateY(-1px);
  }

  .color-swatch:focus-visible {
    outline: none;
    box-shadow: var(--ring);
  }

  .hex {
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    font-family: var(--text-mono);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1 1 auto;
    min-width: 0;
  }

  .step {
    font-size: 0.74rem;
    opacity: 0.9;
    font-weight: 650;
    font-family: var(--text-mono);
    flex: 0 0 auto;
  }

  .contrast-info {
    display: flex;
    gap: 4px;
    font-size: 0.72rem;
    opacity: 0.92;
    font-family: var(--text-mono);
    white-space: nowrap;
    justify-content: space-between;
  }

  .contrast-info .low {
    color: inherit;
    opacity: 0.7;
  }

  .contrast-info .high {
    color: inherit;
    opacity: 0.7;
  }
</style>
