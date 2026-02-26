<script lang="ts">
  import { drawerIsOpen, drawerData, closeDrawer } from '$lib/drawerStore';
  import {
    copyToClipboard,
    nearestFriendlyColorName,
    getContrast,
    getPrintableContrast,
    getContrastAPCA,
    getPrintableContrastAPCA,
    MIN_CONTRAST_RATIO,
    MIN_APCA_LC_BODY,
    MIN_APCA_LC_LARGE,
    colorToCssHex,
    colorToCssRgb,
    colorToCssOklch,
    colorToCssHsl
  } from '$lib/colorUtils';
  import { contrastColors } from '$lib/stores';
  import { announce } from '$lib/announce';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';

  const WCAG_AAA_RATIO = 7;

  const isOpen = $derived($drawerIsOpen);
  const data = $derived($drawerData);

  const contrastColorsLocal = $derived($contrastColors);

  // Computed color values from OKLCH source of truth
  const colorValues = $derived.by(() => {
    if (!data) return null;
    const oklchValue =
      data.displayValue && /^oklch\(/i.test(data.displayValue)
        ? data.displayValue
        : colorToCssOklch(data.oklch);
    return {
      hex: colorToCssHex(data.oklch),
      rgb: colorToCssRgb(data.oklch),
      oklch: oklchValue,
      hsl: colorToCssHsl(data.oklch)
    };
  });

  const colorName = $derived(colorValues ? nearestFriendlyColorName(colorValues.hex) : '');
  const lightnessValue = $derived(data ? Math.round((data.oklch.oklch.l ?? 0) * 1000) / 1000 : 0);

  const lowContrast = $derived.by(() => {
    if (!data)
      return { wcag: 0, wcagAA: false, wcagAAA: false, apca: 0, apcaLarge: false, apcaBody: false };
    const hex = colorValues?.hex ?? data.hex;
    const wcag = getContrast(hex, contrastColorsLocal.low);
    const apca = getContrastAPCA(contrastColorsLocal.low, hex);
    return {
      wcag: getPrintableContrast(hex, contrastColorsLocal.low),
      wcagAA: wcag >= MIN_CONTRAST_RATIO,
      wcagAAA: wcag >= WCAG_AAA_RATIO,
      apca: getPrintableContrastAPCA(contrastColorsLocal.low, hex),
      apcaLarge: apca >= MIN_APCA_LC_LARGE,
      apcaBody: apca >= MIN_APCA_LC_BODY
    };
  });

  const highContrast = $derived.by(() => {
    if (!data)
      return { wcag: 0, wcagAA: false, wcagAAA: false, apca: 0, apcaLarge: false, apcaBody: false };
    const hex = colorValues?.hex ?? data.hex;
    const wcag = getContrast(hex, contrastColorsLocal.high);
    const apca = getContrastAPCA(contrastColorsLocal.high, hex);
    return {
      wcag: getPrintableContrast(hex, contrastColorsLocal.high),
      wcagAA: wcag >= MIN_CONTRAST_RATIO,
      wcagAAA: wcag >= WCAG_AAA_RATIO,
      apca: getPrintableContrastAPCA(contrastColorsLocal.high, hex),
      apcaLarge: apca >= MIN_APCA_LC_LARGE,
      apcaBody: apca >= MIN_APCA_LC_BODY
    };
  });

  // Focus management
  let drawerEl: HTMLElement | undefined = $state();
  let closeButtonEl: HTMLElement | undefined = $state();
  let triggerEl: HTMLElement | null = $state(null);
  let swapKey = $state(0);
  let closing = $state(false);
  let mounted = $state(true);
  const CLOSE_DURATION = 200;

  // Track the triggering element and manage focus
  $effect(() => {
    if (isOpen && closeButtonEl) {
      mounted = true;
      triggerEl = document.activeElement as HTMLElement;
      // Small delay to ensure the drawer is rendered before focusing
      requestAnimationFrame(() => {
        // Only focus if still mounted and open
        if (mounted && isOpen && closeButtonEl) {
          const button = closeButtonEl?.querySelector('button');
          button?.focus();
        }
      });
    }
  });

  // Lock body scroll while drawer is open, compensating for scrollbar width to prevent layout shift
  $effect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      const prevOverflow = document.body.style.overflow;
      const prevPaddingRight = document.documentElement.style.paddingRight;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
      }
      return () => {
        document.body.style.overflow = prevOverflow;
        document.documentElement.style.paddingRight = prevPaddingRight;
      };
    }
  });

  // Bump swap key when data changes while open (for swap animation)
  let prevComputedHex = $state('');
  $effect(() => {
    const currentHex = colorValues?.hex ?? '';
    if (data && isOpen) {
      if (prevComputedHex && prevComputedHex !== currentHex) {
        swapKey++;
      }
      prevComputedHex = currentHex;
    } else {
      prevComputedHex = '';
    }
  });

  function handleClose() {
    if (closing) return;
    closing = true;
    mounted = false;
    announce('Color info drawer closed');
    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const delay = reducedMotion ? 0 : CLOSE_DURATION;
    setTimeout(() => {
      closing = false;
      closeDrawer();
      // Return focus to the triggering element
      requestAnimationFrame(() => {
        triggerEl?.focus();
        triggerEl = null;
      });
    }, delay);
  }

  function handleDocumentKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      handleClose();
    }
  }

  $effect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleDocumentKeydown);
      return () => {
        document.removeEventListener('keydown', handleDocumentKeydown);
      };
    }
  });

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      handleClose();
      return;
    }

    // Focus trap
    if (event.key === 'Tab' && drawerEl) {
      const focusable = drawerEl.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
  }

  function handleCopyValue(label: string, value: string) {
    copyToClipboard(value);
    announce(`Copied ${label} value: ${value}`);
  }

  function handleCopyAll() {
    if (!colorValues || !data) return;
    const block = [
      `Name: ${colorName}`,
      `Step: ${data.step}`,
      `Palette: ${data.paletteName}`,
      `Hex: ${colorValues.hex}`,
      `RGB: ${colorValues.rgb}`,
      `OKLCH: ${colorValues.oklch}`,
      `HSL: ${colorValues.hsl}`,
      `Lightness (L): ${lightnessValue}`
    ].join('\n');
    copyToClipboard(block);
    announce('Copied all color values to clipboard');
  }
</script>

{#if (isOpen || closing) && data && colorValues}
  <button
    class="drawer-backdrop"
    class:drawer-backdrop--closing={closing}
    onclick={handleClose}
    aria-label="Close drawer"
    tabindex="-1"
  ></button>

  <div
    class="drawer"
    class:drawer--closing={closing}
    role="dialog"
    aria-modal="true"
    aria-labelledby="drawer-title"
    tabindex="-1"
    bind:this={drawerEl}
    onkeydown={handleKeydown}
  >
    <div class="drawer-header">
      <h2 id="drawer-title" class="drawer-title">{colorName}</h2>
      <div bind:this={closeButtonEl}>
        <Button onclick={handleClose} ariaLabel="Close color info drawer" variant="secondary">
          <Icon name="close" size={20} />
        </Button>
      </div>
    </div>

    {#key swapKey}
      <div class="drawer-body">
        <!-- Large color preview -->
        <div
          class="color-preview"
          style="background-color: {colorValues.hex};"
          role="img"
          aria-label="Color preview: {colorName}, {colorValues.hex}"
        ></div>

        <!-- Palette context -->
        <div class="meta-row">
          <div class="meta-item">
            <span class="meta-label">Palette</span>
            <span class="meta-value">{data.paletteName}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Step</span>
            <span class="meta-value">{data.step}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Lightness</span>
            <span class="meta-value mono">{lightnessValue}</span>
          </div>
        </div>

        <!-- Color values -->
        <div class="section">
          <h3 class="section-title">Color Values</h3>
          <ul class="color-values" role="list">
            {#each [{ label: 'Hex', value: colorValues.hex }, { label: 'RGB', value: colorValues.rgb }, { label: 'OKLCH', value: colorValues.oklch }, { label: 'HSL', value: colorValues.hsl }] as { label, value } (label)}
              <li class="color-value-row">
                <span class="color-value-label">{label}</span>
                <code class="color-value-code">{value}</code>
                <Button
                  onclick={() => handleCopyValue(label, value)}
                  ariaLabel="Copy {label} value: {value}"
                  variant="secondary"
                >
                  <Icon name="copy" />
                </Button>
              </li>
            {/each}
          </ul>
          <Button onclick={handleCopyAll} ariaLabel="Copy all color values to clipboard">
            <Icon name="copy" />
            Copy All
          </Button>
        </div>

        <!-- Contrast ratios -->
        <div class="section">
          <h3 class="section-title">Contrast Ratios</h3>
          <div class="contrast-rows">
            <div class="contrast-row">
              <div class="contrast-header">
                <span class="contrast-label">Low step</span>
                <div class="contrast-swatch-pair" aria-hidden="true">
                  <span
                    class="contrast-mini-swatch"
                    style="background-color: {contrastColorsLocal.low};"
                  ></span>
                  <span class="contrast-mini-swatch" style="background-color: {colorValues.hex};"
                  ></span>
                </div>
              </div>
              <div class="contrast-detail">
                <span class="contrast-algo-label">WCAG 2.1</span>
                <span class="contrast-ratio mono">{lowContrast.wcag}:1</span>
                <span
                  class="badge"
                  class:badge--pass={lowContrast.wcagAA}
                  class:badge--fail={!lowContrast.wcagAA}
                >
                  AA {lowContrast.wcagAA ? 'Pass' : 'Fail'}
                </span>
                <span
                  class="badge"
                  class:badge--pass={lowContrast.wcagAAA}
                  class:badge--fail={!lowContrast.wcagAAA}
                >
                  AAA {lowContrast.wcagAAA ? 'Pass' : 'Fail'}
                </span>
              </div>
              <div class="contrast-detail">
                <span class="contrast-algo-label">APCA</span>
                <span class="contrast-ratio mono">{lowContrast.apca} Lc</span>
                <span
                  class="badge"
                  class:badge--pass={lowContrast.apcaLarge}
                  class:badge--fail={!lowContrast.apcaLarge}
                >
                  Large {lowContrast.apcaLarge ? 'Pass' : 'Fail'}
                </span>
                <span
                  class="badge"
                  class:badge--pass={lowContrast.apcaBody}
                  class:badge--fail={!lowContrast.apcaBody}
                >
                  Body {lowContrast.apcaBody ? 'Pass' : 'Fail'}
                </span>
              </div>
            </div>

            <div class="contrast-row">
              <div class="contrast-header">
                <span class="contrast-label">High step</span>
                <div class="contrast-swatch-pair" aria-hidden="true">
                  <span
                    class="contrast-mini-swatch"
                    style="background-color: {contrastColorsLocal.high};"
                  ></span>
                  <span class="contrast-mini-swatch" style="background-color: {colorValues.hex};"
                  ></span>
                </div>
              </div>
              <div class="contrast-detail">
                <span class="contrast-algo-label">WCAG 2.1</span>
                <span class="contrast-ratio mono">{highContrast.wcag}:1</span>
                <span
                  class="badge"
                  class:badge--pass={highContrast.wcagAA}
                  class:badge--fail={!highContrast.wcagAA}
                >
                  AA {highContrast.wcagAA ? 'Pass' : 'Fail'}
                </span>
                <span
                  class="badge"
                  class:badge--pass={highContrast.wcagAAA}
                  class:badge--fail={!highContrast.wcagAAA}
                >
                  AAA {highContrast.wcagAAA ? 'Pass' : 'Fail'}
                </span>
              </div>
              <div class="contrast-detail">
                <span class="contrast-algo-label">APCA</span>
                <span class="contrast-ratio mono">{highContrast.apca} Lc</span>
                <span
                  class="badge"
                  class:badge--pass={highContrast.apcaLarge}
                  class:badge--fail={!highContrast.apcaLarge}
                >
                  Large {highContrast.apcaLarge ? 'Pass' : 'Fail'}
                </span>
                <span
                  class="badge"
                  class:badge--pass={highContrast.apcaBody}
                  class:badge--fail={!highContrast.apcaBody}
                >
                  Body {highContrast.apcaBody ? 'Pass' : 'Fail'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/key}
  </div>
{/if}

<style>
  .drawer-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.15);
    z-index: 900;
    pointer-events: auto;
    cursor: default;
    opacity: 0;
    animation: fadeIn 200ms ease forwards;
    border: none;
    padding: 0;
    margin: 0;
    appearance: none;
  }

  .drawer {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 380px;
    max-width: 100vw;
    background: var(--bg-secondary);
    border-left: 1px solid var(--border);
    box-shadow: -8px 0 30px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: slideIn 250ms ease forwards;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(100%);
    }
  }

  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  .drawer--closing {
    animation: slideOut 200ms ease forwards;
  }

  .drawer-backdrop--closing {
    animation: fadeOut 200ms ease forwards;
  }

  @media (prefers-reduced-motion: reduce) {
    .drawer {
      animation: none;
    }
    .drawer--closing {
      animation: none;
    }
    .drawer-backdrop {
      animation: none;
      opacity: 1;
    }
    .drawer-backdrop--closing {
      animation: none;
      opacity: 0;
    }
    .drawer-body {
      animation: none !important;
    }
  }

  @media (max-width: 768px) {
    .drawer {
      width: 100vw;
    }
  }

  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md) var(--space-lg);
    border-bottom: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
    flex-shrink: 0;
  }

  .drawer-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    margin: 0;
    text-transform: capitalize;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .drawer-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
    animation: swapIn var(--transition-normal) var(--ease-out);
  }

  @keyframes swapIn {
    from {
      opacity: 0.3;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .color-preview {
    width: 100%;
    height: 120px;
    border-radius: var(--radius-md);
    border: 1px solid color-mix(in oklab, var(--border) 70%, transparent);
  }

  .meta-row {
    display: flex;
    gap: var(--space-lg);
    flex-wrap: wrap;
  }

  .meta-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    flex: 1;
    min-width: 80px;
  }

  .meta-label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide);
  }

  .meta-value {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    text-transform: capitalize;
  }

  .mono {
    font-family: var(--text-mono);
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .section-title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide);
    margin: 0;
  }

  .color-values {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
    border: 1px solid color-mix(in oklab, var(--border) 70%, transparent);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .color-value-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-sm);
    background: var(--bg-primary);
  }

  .color-value-row + .color-value-row {
    border-top: 1px solid color-mix(in oklab, var(--border) 50%, transparent);
  }

  .color-value-label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--text-secondary);
    width: 48px;
    flex-shrink: 0;
  }

  .color-value-code {
    font-size: var(--font-size-sm);
    font-family: var(--text-mono);
    color: var(--text-primary);
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .contrast-rows {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .contrast-row {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--space-sm) var(--space-md);
    background: var(--bg-primary);
    border: 1px solid color-mix(in oklab, var(--border) 70%, transparent);
    border-radius: var(--radius-md);
  }

  .contrast-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .contrast-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
  }

  .contrast-swatch-pair {
    display: flex;
    gap: var(--space-xs);
  }

  .contrast-mini-swatch {
    width: 1.125rem;
    height: 1.125rem;
    border-radius: var(--radius-xs);
    border: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
  }

  .contrast-detail {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex-wrap: wrap;
  }

  .contrast-algo-label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide);
    min-width: 3.25rem;
  }

  .contrast-ratio {
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    min-width: 3.5rem;
  }

  .badge {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-sm);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide);
    white-space: nowrap;
  }

  .badge--pass {
    background: var(--badge-pass-bg);
    color: var(--badge-pass-text);
    border: 1px solid var(--badge-pass-border);
  }

  .badge--fail {
    background: var(--badge-fail-bg);
    color: var(--badge-fail-text);
    border: 1px solid var(--badge-fail-border);
  }
</style>
