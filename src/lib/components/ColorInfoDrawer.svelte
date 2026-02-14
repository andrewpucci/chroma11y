<script lang="ts">
  import { drawerIsOpen, drawerData, closeDrawer } from '$lib/drawerStore';
  import {
    copyToClipboard,
    nearestFriendlyColorName,
    getContrast,
    getPrintableContrast,
    MIN_CONTRAST_RATIO,
    colorToCssHex,
    colorToCssRgb,
    colorToCssOklch,
    colorToCssHsl
  } from '$lib/colorUtils';
  import { contrastColors } from '$lib/stores';
  import { announce } from '$lib/announce';

  const WCAG_AAA_RATIO = 7;

  const isOpen = $derived($drawerIsOpen);
  const data = $derived($drawerData);
  const contrastColorsLocal = $derived($contrastColors);

  // Computed color values from OKLCH source of truth
  const colorValues = $derived.by(() => {
    if (!data) return null;
    return {
      hex: colorToCssHex(data.oklch),
      rgb: colorToCssRgb(data.oklch),
      oklch: colorToCssOklch(data.oklch),
      hsl: colorToCssHsl(data.oklch)
    };
  });

  const colorName = $derived(colorValues ? nearestFriendlyColorName(colorValues.hex) : '');
  const lightnessValue = $derived(data ? Math.round((data.oklch.oklch.l ?? 0) * 1000) / 1000 : 0);

  const lowContrast = $derived.by(() => {
    if (!data) return { ratio: 0, printable: 0, passAA: false, passAAA: false };
    const hex = colorValues?.hex ?? data.hex;
    const ratio = getContrast(hex, contrastColorsLocal.low);
    return {
      ratio,
      printable: getPrintableContrast(hex, contrastColorsLocal.low),
      passAA: ratio >= MIN_CONTRAST_RATIO,
      passAAA: ratio >= WCAG_AAA_RATIO
    };
  });

  const highContrast = $derived.by(() => {
    if (!data) return { ratio: 0, printable: 0, passAA: false, passAAA: false };
    const hex = colorValues?.hex ?? data.hex;
    const ratio = getContrast(hex, contrastColorsLocal.high);
    return {
      ratio,
      printable: getPrintableContrast(hex, contrastColorsLocal.high),
      passAA: ratio >= MIN_CONTRAST_RATIO,
      passAAA: ratio >= WCAG_AAA_RATIO
    };
  });

  // Focus management
  let drawerEl: HTMLElement | undefined = $state();
  let closeButtonEl: HTMLButtonElement | undefined = $state();
  let triggerEl: HTMLElement | null = $state(null);
  let swapKey = $state(0);
  let closing = $state(false);
  const CLOSE_DURATION = 200;

  // Track the triggering element and manage focus
  $effect(() => {
    if (isOpen && closeButtonEl) {
      triggerEl = document.activeElement as HTMLElement;
      // Small delay to ensure the drawer is rendered before focusing
      requestAnimationFrame(() => {
        closeButtonEl?.focus();
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
      <button
        class="drawer-close btn btn-ghost"
        bind:this={closeButtonEl}
        onclick={handleClose}
        aria-label="Close color info drawer"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M15 5L5 15M5 5l10 10"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </button>
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
                <button
                  class="copy-btn btn btn-ghost"
                  onclick={() => handleCopyValue(label, value)}
                  aria-label="Copy {label} value: {value}"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <rect
                      x="5"
                      y="5"
                      width="9"
                      height="9"
                      rx="1.5"
                      stroke="currentColor"
                      stroke-width="1.5"
                    />
                    <path
                      d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5"
                      stroke="currentColor"
                      stroke-width="1.5"
                    />
                  </svg>
                </button>
              </li>
            {/each}
          </ul>
          <button
            class="copy-all-btn btn"
            onclick={handleCopyAll}
            aria-label="Copy all color values to clipboard"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect
                x="5"
                y="5"
                width="9"
                height="9"
                rx="1.5"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <path
                d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5"
                stroke="currentColor"
                stroke-width="1.5"
              />
            </svg>
            Copy All
          </button>
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
                <span class="contrast-ratio mono">{lowContrast.printable}:1</span>
                <span
                  class="badge"
                  class:badge--pass={lowContrast.passAA}
                  class:badge--fail={!lowContrast.passAA}
                >
                  AA {lowContrast.passAA ? 'Pass' : 'Fail'}
                </span>
                <span
                  class="badge"
                  class:badge--pass={lowContrast.passAAA}
                  class:badge--fail={!lowContrast.passAAA}
                >
                  AAA {lowContrast.passAAA ? 'Pass' : 'Fail'}
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
                <span class="contrast-ratio mono">{highContrast.printable}:1</span>
                <span
                  class="badge"
                  class:badge--pass={highContrast.passAA}
                  class:badge--fail={!highContrast.passAA}
                >
                  AA {highContrast.passAA ? 'Pass' : 'Fail'}
                </span>
                <span
                  class="badge"
                  class:badge--pass={highContrast.passAAA}
                  class:badge--fail={!highContrast.passAAA}
                >
                  AAA {highContrast.passAAA ? 'Pass' : 'Fail'}
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
    padding: 0.875rem 1rem;
    border-bottom: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
    flex-shrink: 0;
  }

  .drawer-title {
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0;
    text-transform: capitalize;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .drawer-close {
    flex-shrink: 0;
    padding: 0.4rem;
    min-height: 36px;
    min-width: 36px;
  }

  .drawer-body {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    animation: swapIn 180ms ease;
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
    gap: 1rem;
    flex-wrap: wrap;
  }

  .meta-item {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    flex: 1;
    min-width: 80px;
  }

  .meta-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .meta-value {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-primary);
    text-transform: capitalize;
  }

  .mono {
    font-family: var(--text-mono);
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .section-title {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
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
    gap: 0.5rem;
    padding: 0.5rem 0.65rem;
    background: var(--bg-primary);
  }

  .color-value-row + .color-value-row {
    border-top: 1px solid color-mix(in oklab, var(--border) 50%, transparent);
  }

  .color-value-label {
    font-size: 0.78rem;
    font-weight: 650;
    color: var(--text-secondary);
    width: 48px;
    flex-shrink: 0;
  }

  .color-value-code {
    font-size: 0.82rem;
    font-family: var(--text-mono);
    color: var(--text-primary);
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .copy-btn {
    flex-shrink: 0;
    padding: 0.3rem;
    min-height: 32px;
    min-width: 32px;
    border-radius: 8px;
    color: var(--text-secondary);
  }

  .copy-btn:hover {
    color: var(--accent);
  }

  .copy-all-btn {
    align-self: stretch;
    font-size: 0.85rem;
  }

  .contrast-rows {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .contrast-row {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.6rem 0.75rem;
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
    font-size: 0.82rem;
    font-weight: 650;
    color: var(--text-primary);
  }

  .contrast-swatch-pair {
    display: flex;
    gap: 2px;
  }

  .contrast-mini-swatch {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    border: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
  }

  .contrast-detail {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .contrast-ratio {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text-primary);
    min-width: 56px;
  }

  .badge {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.15rem 0.45rem;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    white-space: nowrap;
  }

  .badge--pass {
    background: color-mix(in oklab, #22c55e 18%, transparent);
    color: #16a34a;
    border: 1px solid color-mix(in oklab, #22c55e 30%, transparent);
  }

  :global([data-theme='dark']) .badge--pass {
    background: color-mix(in oklab, #22c55e 15%, transparent);
    color: #4ade80;
    border-color: color-mix(in oklab, #22c55e 25%, transparent);
  }

  .badge--fail {
    background: color-mix(in oklab, #ef4444 14%, transparent);
    color: #dc2626;
    border: 1px solid color-mix(in oklab, #ef4444 25%, transparent);
  }

  :global([data-theme='dark']) .badge--fail {
    background: color-mix(in oklab, #ef4444 12%, transparent);
    color: #f87171;
    border-color: color-mix(in oklab, #ef4444 20%, transparent);
  }
</style>
