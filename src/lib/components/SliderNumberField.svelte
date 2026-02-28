<script lang="ts">
  interface Props {
    id: string;
    label: string;
    valueInputLabel: string;
    min: number;
    max: number;
    step?: number;
    value?: number;
    rangeAriaLabel?: string;
    describedBy?: string;
    groupHelpText?: string;
    infoButtonLabel?: string;
    infoTooltipId?: string;
    infoTooltipText?: string;
    onRangeInput?: (event: Event) => void;
    onRangeChange?: (event: Event) => void;
    onRangePointerDown?: (event: PointerEvent) => void;
    onNumberInput?: (event: Event) => void;
    onNumberChange?: (event: Event) => void;
    onNumberBlur?: (event: FocusEvent) => void;
  }

  let {
    id,
    label,
    valueInputLabel,
    min,
    max,
    step = 1,
    value = $bindable(0),
    rangeAriaLabel,
    describedBy,
    groupHelpText,
    infoButtonLabel,
    infoTooltipId,
    infoTooltipText,
    onRangeInput,
    onRangeChange,
    onRangePointerDown,
    onNumberInput,
    onNumberChange,
    onNumberBlur
  }: Props = $props();

  const labelId = $derived(`${id}-label`);
  const helpId = $derived(groupHelpText ? `${id}-control-help` : undefined);
  const combinedDescribedBy = $derived.by(() => {
    const ids = [describedBy, infoTooltipId, helpId].filter(Boolean);
    return ids.length > 0 ? ids.join(' ') : undefined;
  });
</script>

<div class="field">
  <div class="label-row">
    <label class="label" id={labelId} for={id}>{label}</label>
    {#if infoButtonLabel && infoTooltipId && infoTooltipText}
      <span class="help-popover">
        <button type="button" class="info-button" aria-label={infoButtonLabel}>
          <span aria-hidden="true">i</span>
        </button>
        <span id={infoTooltipId} class="help-tooltip" role="tooltip">
          {infoTooltipText}
        </span>
      </span>
    {/if}
  </div>

  <div
    class="slider-row"
    role="group"
    aria-labelledby={labelId}
    aria-describedby={combinedDescribedBy}
  >
    <div class="slider-wrapper">
      <input
        {id}
        type="range"
        {min}
        {max}
        {step}
        bind:value
        aria-label={rangeAriaLabel}
        aria-describedby={combinedDescribedBy}
        oninput={onRangeInput}
        onchange={onRangeChange}
        onpointerdown={onRangePointerDown}
        tabindex="0"
      />
    </div>
    <input
      class="input mono slider-number-input"
      type="number"
      {min}
      {max}
      {step}
      bind:value
      aria-label={valueInputLabel}
      aria-describedby={combinedDescribedBy}
      oninput={onNumberInput}
      onchange={onNumberChange}
      onblur={onNumberBlur}
    />
  </div>

  {#if groupHelpText && helpId}
    <p id={helpId} class="visually-hidden">{groupHelpText}</p>
  {/if}
</div>

<style>
  .label-row {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }

  .slider-row {
    display: grid;
    grid-template-columns: 1fr minmax(6rem, 7.5rem);
    gap: var(--space-sm);
    align-items: center;
  }

  .slider-wrapper {
    width: 100%;
    padding-inline: var(--space-sm);
    box-sizing: border-box;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .slider-wrapper:focus-within {
    outline: var(--focus-outline-width) solid var(--focus-outline-inside);
    box-shadow: 0 0 0 var(--focus-outline-offset) var(--focus-outline-outside);
  }

  .slider-wrapper input[type='range']:focus-visible {
    outline: none;
    box-shadow: none;
  }

  input[type='range'] {
    width: 100%;
  }

  .slider-number-input {
    text-align: center;
    min-height: var(--touch-target-comfortable);
    padding-block: 0;
  }

  .help-popover {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .info-button {
    width: var(--touch-target-min);
    min-width: var(--touch-target-min);
    height: var(--touch-target-min);
    border-radius: 50%;
    border: 1px solid var(--border);
    background: var(--bg-primary);
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    line-height: 1;
    cursor: help;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .help-tooltip {
    position: absolute;
    inset-block-start: calc(100% + var(--space-xs));
    inset-inline-end: 0;
    inset-inline-start: auto;
    z-index: 20;
    inline-size: min(32ch, calc(100vw - var(--space-xl)));
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    border: 1px solid var(--border);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-normal);
    box-shadow: 0 6px 16px color-mix(in oklab, black 14%, transparent);
    visibility: hidden;
    opacity: 0;
    transform: translateY(-2px);
    pointer-events: none;
    transition:
      opacity var(--transition-fast),
      transform var(--transition-fast),
      visibility var(--transition-fast);
  }

  .help-popover:hover .help-tooltip,
  .help-popover:focus-within .help-tooltip {
    visibility: visible;
    opacity: 1;
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    input[type='range'] {
      height: var(--touch-target-comfortable);
      touch-action: manipulation;
    }
  }
</style>
