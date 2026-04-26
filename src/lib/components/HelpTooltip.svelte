<script lang="ts">
  import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';

  import Icon from './Icon.svelte';

  interface Props {
    id: string;
    label: string;
    text: string;
    align?: 'start' | 'end';
    disabled?: boolean;
  }

  // Floating UI needs numeric values for middleware. These fallbacks mirror the
  // minimum spacing tokens used by the design system and keep the math stable in jsdom.
  const HELP_TOOLTIP_OFFSET_PX = 4;
  const HELP_TOOLTIP_VIEWPORT_PADDING_PX = 8;

  let { id, label, text, align = 'start', disabled = false }: Props = $props();
  let open = $state(false);
  let triggerElement: HTMLButtonElement | null = null;
  let tooltipElement: HTMLSpanElement | null = null;
  let tooltipX = $state(0);
  let tooltipY = $state(0);
  const alignEnd = $derived(align === 'end');
  const placement = $derived(alignEnd ? 'top-end' : 'top-start');

  function show(): void {
    if (!disabled) {
      open = true;
    }
  }

  function hide(): void {
    open = false;
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      hide();
    }
  }

  $effect(() => {
    if (!open || !triggerElement || !tooltipElement) {
      return;
    }

    const referenceElement = triggerElement;
    const floatingElement = tooltipElement;
    let cancelled = false;

    const updateTooltipPosition = async (): Promise<void> => {
      const { x, y } = await computePosition(referenceElement, floatingElement, {
        placement,
        strategy: 'fixed',
        middleware: [
          offset(HELP_TOOLTIP_OFFSET_PX),
          flip({ padding: HELP_TOOLTIP_VIEWPORT_PADDING_PX }),
          shift({
            padding: HELP_TOOLTIP_VIEWPORT_PADDING_PX,
            crossAxis: true
          })
        ]
      });

      if (!cancelled) {
        tooltipX = x;
        tooltipY = y;
      }
    };

    void updateTooltipPosition();

    const stopAutoUpdate = autoUpdate(referenceElement, floatingElement, () => {
      void updateTooltipPosition();
    });

    return () => {
      cancelled = true;
      stopAutoUpdate();
    };
  });
</script>

<span class="help-tooltip-wrapper">
  <button
    type="button"
    class="help-tooltip-trigger"
    bind:this={triggerElement}
    aria-label={label}
    aria-describedby={id}
    onpointerenter={show}
    onpointerleave={hide}
    onfocus={show}
    onblur={hide}
    onkeydown={handleKeydown}
    {disabled}
  >
    <Icon name="help" size="var(--icon-size-help)" stroke="var(--icon-stroke-help)" />
  </button>
  <span
    {id}
    bind:this={tooltipElement}
    class="help-tooltip"
    class:help-tooltip--open={open}
    role="tooltip"
    hidden={!open}
    style:left={`${tooltipX}px`}
    style:top={`${tooltipY}px`}
  >
    {text}
  </span>
</span>

<style>
  .help-tooltip-wrapper {
    --help-tooltip-inline-size: min(36ch, calc(100vw - var(--space-xl)));
    position: relative;
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
  }

  .help-tooltip-trigger {
    width: var(--touch-target-min);
    min-width: var(--touch-target-min);
    height: var(--touch-target-min);
    border-radius: var(--radius-full);
    border: var(--border-width-thin) solid var(--border);
    background: var(--bg-primary);
    color: var(--text-secondary);
    cursor: help;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition:
      border-color var(--transition-fast),
      color var(--transition-fast),
      background-color var(--transition-fast);
  }

  .help-tooltip-trigger:hover:not(:disabled),
  .help-tooltip-trigger:focus-visible {
    color: var(--text-primary);
    border-color: color-mix(in oklab, var(--border) 45%, var(--accent));
  }

  .help-tooltip-trigger:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .help-tooltip {
    position: fixed;
    inset-block-start: 0;
    inset-inline-start: 0;
    z-index: 30;
    inline-size: var(--help-tooltip-inline-size);
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    border: var(--border-width-thin) solid var(--border);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-normal);
    box-shadow: 0 var(--space-sm) var(--space-lg) color-mix(in oklab, black 16%, transparent);
    opacity: 0;
    transform: translateY(calc(var(--space-2xs) * -1));
    pointer-events: none;
    transition:
      opacity var(--transition-fast),
      transform var(--transition-fast);
  }

  .help-tooltip--open {
    opacity: 1;
    transform: translateY(0);
  }
</style>
