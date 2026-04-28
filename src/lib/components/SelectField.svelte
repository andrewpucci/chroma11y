<script lang="ts">
  import HelpTooltip from './HelpTooltip.svelte';

  interface SelectOption {
    value: string;
    label: string;
  }

  interface Props {
    id: string;
    label: string;
    value: string;
    options: SelectOption[];
    ariaLabel?: string;
    helpId?: string;
    helpLabel?: string;
    helpText?: string;
    disabled?: boolean;
    describedById?: string;
    fieldHelp?: string;
    onchange: (value: string) => void;
  }

  let {
    id,
    label,
    value,
    options,
    ariaLabel,
    helpId,
    helpLabel,
    helpText,
    disabled = false,
    describedById,
    fieldHelp,
    onchange
  }: Props = $props();

  function handleChange(event: Event) {
    onchange((event.target as HTMLSelectElement).value);
  }
</script>

<div class="field">
  <div class="label-row">
    <label class="label" for={id}>{label}</label>
    {#if helpId && helpLabel && helpText}
      <HelpTooltip id={helpId} label={helpLabel} text={helpText} />
    {/if}
  </div>
  <select
    class="select"
    {id}
    {value}
    {disabled}
    aria-label={ariaLabel}
    aria-describedby={describedById}
    onchange={handleChange}
  >
    {#each options as option (option.value)}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
  {#if fieldHelp}
    <p id={describedById} class="field-help">{fieldHelp}</p>
  {/if}
</div>

<style>
  .field {
    display: grid;
    gap: var(--space-xs);
  }

  .label-row {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }
</style>
