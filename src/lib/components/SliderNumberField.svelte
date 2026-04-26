<script lang="ts">
  import { tick } from 'svelte';
  import HelpTooltip from './HelpTooltip.svelte';

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
  let numberInputEl: HTMLInputElement | undefined = $state();
  let numberInputRevision = $state(0);

  function updateValueFromInput(target: EventTarget | null): void {
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const nextValue = target.valueAsNumber;
    if (Number.isNaN(nextValue)) {
      return;
    }

    value = nextValue;
  }

  function handleRangeInput(event: Event): void {
    updateValueFromInput(event.currentTarget);
    onRangeInput?.(event);
  }

  function handleRangeChange(event: Event): void {
    updateValueFromInput(event.currentTarget);
    onRangeChange?.(event);
  }

  function handleNumberInput(event: Event): void {
    updateValueFromInput(event.currentTarget);
    onNumberInput?.(event);
  }

  function handleNumberChange(event: Event): void {
    updateValueFromInput(event.currentTarget);
    onNumberChange?.(event);
    void refreshCommittedNumberInput(event.currentTarget);
  }

  function handleNumberBlur(event: FocusEvent): void {
    onNumberBlur?.(event);

    if (event.currentTarget instanceof HTMLInputElement) {
      event.currentTarget.value = `${value}`;
    }
  }

  async function refreshCommittedNumberInput(target: EventTarget | null): Promise<void> {
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const shouldRestoreFocus = document.activeElement === target;
    numberInputRevision += 1;
    await tick();

    if (shouldRestoreFocus) {
      numberInputEl?.focus({ preventScroll: true });
    }
  }
</script>

<div class="field">
  <div class="label-row">
    <label class="label" id={labelId} for={id}>{label}</label>
    {#if infoButtonLabel && infoTooltipId && infoTooltipText}
      <HelpTooltip id={infoTooltipId} label={infoButtonLabel} text={infoTooltipText} align="end" />
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
        {value}
        aria-label={rangeAriaLabel}
        aria-describedby={combinedDescribedBy}
        oninput={handleRangeInput}
        onchange={handleRangeChange}
        onpointerdown={onRangePointerDown}
        tabindex="0"
      />
    </div>
    {#key `${id}-number-${numberInputRevision}`}
      <input
        bind:this={numberInputEl}
        class="input mono slider-number-input"
        type="number"
        {min}
        {max}
        {step}
        {value}
        aria-label={valueInputLabel}
        aria-describedby={combinedDescribedBy}
        oninput={handleNumberInput}
        onchange={handleNumberChange}
        onblur={handleNumberBlur}
      />
    {/key}
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

  @media (max-width: 768px) {
    input[type='range'] {
      height: var(--touch-target-comfortable);
      touch-action: manipulation;
    }
  }
</style>
