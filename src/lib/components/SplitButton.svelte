<script lang="ts">
  import { tick, type Snippet } from 'svelte';
  import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';
  import Icon from './Icon.svelte';

  const MENU_OFFSET_PX = 4;
  const MENU_VIEWPORT_PADDING_PX = 8;

  export interface SplitButtonMenuItem {
    id: string;
    label: string;
    /**
     * Optional accessible name for the item; falls back to `label` when omitted.
     * Use this when the visible label and the assistive-tech label should differ
     * (e.g. truncated displayText vs. a fully descriptive ariaLabel).
     */
    ariaLabel?: string;
    onSelect: (event: MouseEvent | KeyboardEvent) => void;
    disabled?: boolean;
  }

  interface Props {
    primaryLabel?: string;
    primaryAriaLabel: string;
    onPrimary: (event: MouseEvent) => void;
    /** Accessible name for the menu container (e.g. "Undo history"). */
    menuLabel: string;
    /** Accessible name for the chevron trigger; defaults to `menuLabel`. */
    menuTriggerLabel?: string;
    menuItems: SplitButtonMenuItem[];
    /** Disables both halves. */
    disabled?: boolean;
    /**
     * Disables only the chevron trigger, independent of the primary action.
     * Useful when the primary is available but the menu would be empty.
     * Defaults to `disabled`.
     */
    menuDisabled?: boolean;
    variant?: 'primary' | 'secondary' | 'ghost';
    children?: Snippet;
  }

  let {
    primaryLabel,
    primaryAriaLabel,
    onPrimary,
    menuLabel,
    menuTriggerLabel,
    menuItems,
    disabled = false,
    menuDisabled,
    variant = 'secondary',
    children
  }: Props = $props();

  const triggerAriaLabel = $derived(menuTriggerLabel ?? menuLabel);
  const chevronDisabled = $derived(menuDisabled ?? disabled);

  let menuOpen = $state(false);
  let containerEl: HTMLDivElement | undefined = $state();
  let chevronEl: HTMLButtonElement | undefined = $state();
  let menuEl: HTMLDivElement | undefined = $state();
  let activeIndex = $state(0);
  let menuX = $state(0);
  let menuY = $state(0);
  let menuMinWidth = $state(0);

  const variantClass = $derived(`btn-${variant}`);

  /**
   * Move the open menu out to <body> so it escapes any ancestor `overflow:
   * hidden` (the export Card uses it for collapse animation). Mirrors the
   * approach used by HelpTooltip.svelte.
   */
  $effect(() => {
    if (!menuOpen || !menuEl || menuEl.parentElement === document.body) {
      return;
    }

    document.body.appendChild(menuEl);
    return () => {
      if (menuEl?.parentElement === document.body) {
        // eslint-disable-next-line svelte/no-dom-manipulating
        menuEl.remove();
      }
    };
  });

  /**
   * Position + auto-update the menu via floating-ui, with flip + shift so it
   * stays on-screen on small viewports or near the page bottom.
   */
  $effect(() => {
    if (!menuOpen || !containerEl || !menuEl) {
      return;
    }
    const referenceElement = containerEl;
    const floatingElement = menuEl;
    let cancelled = false;

    const updateMenuPosition = async (): Promise<void> => {
      const { x, y } = await computePosition(referenceElement, floatingElement, {
        placement: 'bottom-end',
        strategy: 'fixed',
        middleware: [
          offset(MENU_OFFSET_PX),
          flip({ padding: MENU_VIEWPORT_PADDING_PX }),
          shift({ padding: MENU_VIEWPORT_PADDING_PX })
        ]
      });

      if (!cancelled) {
        menuX = x;
        menuY = y;
        menuMinWidth = referenceElement.getBoundingClientRect().width;
      }
    };

    void updateMenuPosition();

    const stopAutoUpdate = autoUpdate(referenceElement, floatingElement, () => {
      void updateMenuPosition();
    });

    return () => {
      cancelled = true;
      stopAutoUpdate();
    };
  });

  async function openMenu(focusFirst = true): Promise<void> {
    if (chevronDisabled) return;
    menuOpen = true;
    activeIndex = 0;
    if (focusFirst) {
      await tick();
      focusActiveMenuItem();
    }
  }

  async function closeMenu(returnFocusToChevron = true): Promise<void> {
    if (!menuOpen) return;
    menuOpen = false;
    if (returnFocusToChevron) {
      await tick();
      chevronEl?.focus({ preventScroll: true });
    }
  }

  function toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    if (chevronDisabled && !menuOpen) return;
    if (menuOpen) {
      void closeMenu();
    } else {
      void openMenu();
    }
  }

  function focusActiveMenuItem(): void {
    if (!menuEl) return;
    const items = menuEl.querySelectorAll<HTMLElement>('[role="menuitem"]');
    items[activeIndex]?.focus({ preventScroll: true });
  }

  function moveActive(delta: number): void {
    const enabled = menuItems.filter((item) => !item.disabled);
    if (enabled.length === 0) return;
    const enabledIndices = menuItems
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !item.disabled)
      .map(({ index }) => index);
    const currentEnabledPos = enabledIndices.indexOf(activeIndex);
    const nextEnabledPos =
      currentEnabledPos === -1
        ? 0
        : (currentEnabledPos + delta + enabledIndices.length) % enabledIndices.length;
    activeIndex = enabledIndices[nextEnabledPos];
    focusActiveMenuItem();
  }

  function handleMenuKeydown(event: KeyboardEvent): void {
    if (!menuOpen) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        void closeMenu();
        break;
      case 'ArrowDown':
        event.preventDefault();
        moveActive(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveActive(-1);
        break;
      case 'Home': {
        event.preventDefault();
        const firstEnabled = menuItems.findIndex((item) => !item.disabled);
        if (firstEnabled !== -1) {
          activeIndex = firstEnabled;
          focusActiveMenuItem();
        }
        break;
      }
      case 'End': {
        event.preventDefault();
        const lastEnabled = [...menuItems].reverse().findIndex((item) => !item.disabled);
        if (lastEnabled !== -1) {
          activeIndex = menuItems.length - 1 - lastEnabled;
          focusActiveMenuItem();
        }
        break;
      }
      case 'Tab':
        void closeMenu(false);
        break;
    }
  }

  function selectItem(item: SplitButtonMenuItem, event: MouseEvent | KeyboardEvent): void {
    if (item.disabled) return;
    item.onSelect(event);
    void closeMenu();
  }

  function handleDocumentClick(event: MouseEvent): void {
    if (!menuOpen) return;
    if (!(event.target instanceof Node)) return;
    if (containerEl?.contains(event.target)) return;
    if (menuEl?.contains(event.target)) return;
    void closeMenu(false);
  }

  function handlePrimaryClick(event: MouseEvent): void {
    if (disabled) return;
    onPrimary(event);
  }
</script>

<svelte:window onclick={handleDocumentClick} onkeydown={handleMenuKeydown} />

<div class="split-button" class:menu-open={menuOpen} bind:this={containerEl}>
  <button
    type="button"
    class="btn {variantClass} primary-action"
    aria-label={primaryAriaLabel}
    {disabled}
    onclick={handlePrimaryClick}
  >
    {#if children}
      {@render children()}
    {:else}
      {primaryLabel}
    {/if}
  </button>
  <button
    bind:this={chevronEl}
    type="button"
    class="btn {variantClass} chevron-toggle"
    aria-label={triggerAriaLabel}
    aria-haspopup="menu"
    aria-expanded={menuOpen}
    disabled={chevronDisabled}
    onclick={toggleMenu}
  >
    <Icon name="chevron-down" />
  </button>

  {#if menuOpen}
    <div
      bind:this={menuEl}
      class="split-button-menu"
      role="menu"
      aria-label={menuLabel}
      style:left={`${menuX}px`}
      style:top={`${menuY}px`}
      style:min-width={`${menuMinWidth}px`}
    >
      {#each menuItems as item, index (item.id)}
        <button
          type="button"
          role="menuitem"
          class="menu-item"
          aria-label={item.ariaLabel}
          tabindex={index === activeIndex ? 0 : -1}
          disabled={item.disabled}
          onclick={(event) => selectItem(item, event)}
        >
          <span class="menu-item-label">{item.label}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .split-button {
    position: relative;
    display: inline-flex;
    align-items: stretch;
  }

  .split-button.menu-open {
    z-index: 90;
  }

  .btn {
    appearance: none;
    padding: var(--space-sm) var(--space-md);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    min-height: var(--touch-target-comfortable);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    transition:
      background-color var(--transition-fast),
      border-color var(--transition-fast),
      color var(--transition-fast);
  }

  .btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .btn-primary {
    background: color-mix(in oklab, var(--accent) 90%, black);
    color: white;
    border: 1px solid color-mix(in oklab, var(--accent) 70%, black);
  }

  .btn-primary:hover:not(:disabled) {
    background: color-mix(in oklab, var(--accent-hover) 90%, black);
    border-color: color-mix(in oklab, var(--accent-hover) 70%, black);
  }

  .btn-secondary {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border: 1px solid var(--border);
  }

  .btn-secondary:hover:not(:disabled) {
    border-color: color-mix(in oklab, var(--border) 40%, var(--accent));
  }

  .btn-ghost {
    background: transparent;
    color: var(--text-secondary);
    border: 1px dashed color-mix(in oklab, var(--border) 72%, transparent);
  }

  .btn-ghost:hover:not(:disabled) {
    color: var(--text-primary);
    border-color: color-mix(in oklab, var(--border) 45%, var(--accent));
  }

  .primary-action {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    border-top-left-radius: var(--radius-md);
    border-bottom-left-radius: var(--radius-md);
    flex: 1 1 auto;
  }

  .chevron-toggle {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-top-right-radius: var(--radius-md);
    border-bottom-right-radius: var(--radius-md);
    /* Overlap the primary action's right border with our left border so the
       seam reads as a single hairline. Combined with z-index on hover/focus,
       this lets the hovered or focused half outline cleanly all the way
       around — including the inner edge. */
    margin-left: -1px;
    min-width: var(--touch-target-comfortable);
    padding-inline: var(--space-sm);
    flex: 0 0 auto;
  }

  /* Lift the hovered half above its sibling so its full border (including
     the seam edge) is visible. */
  .primary-action:hover:not(:disabled),
  .chevron-toggle:hover:not(:disabled) {
    z-index: 1;
  }

  /* When a half is focused, fully round it and raise it above the sibling so
     the global focus ring traces a clean rounded shape instead of clipping at
     the split boundary. */
  .primary-action:focus-visible,
  .chevron-toggle:focus-visible {
    border-radius: var(--radius-md);
    z-index: 2;
  }

  .split-button-menu {
    /* Floating-ui places the menu via inline left/top with a fixed strategy,
       so it escapes any ancestor `overflow: hidden`. */
    position: fixed;
    inset-block-start: 0;
    inset-inline-start: 0;
    z-index: 90;
    display: flex;
    flex-direction: column;
    max-height: min(320px, 60vh);
    overflow: auto;
    background: var(--bg-primary);
    border: var(--border-width-thin) solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: 0 var(--space-md) var(--space-lg) color-mix(in oklab, black 20%, transparent);
    padding-block: var(--space-2xs, 4px);
  }

  .menu-item {
    appearance: none;
    background: transparent;
    border: 0;
    color: var(--text-primary);
    text-align: start;
    padding: var(--space-sm) var(--space-md);
    font: inherit;
    cursor: pointer;
    min-height: var(--touch-target-comfortable);
  }

  .menu-item-label {
    display: block;
    inline-size: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .menu-item:hover:not(:disabled) {
    background: color-mix(in oklab, var(--accent) 14%, transparent);
  }

  /* Suppress the global double-ring inside the menu and use a tighter inset
     ring instead, so the indicator fits cleanly within the menu chrome. */
  .menu-item:focus-visible {
    background: color-mix(in oklab, var(--accent) 14%, transparent);
    outline: none;
    box-shadow: inset 0 0 0 2px var(--accent);
  }

  .menu-item:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
</style>
