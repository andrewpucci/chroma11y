<script lang="ts">
  import HelpTooltip from './HelpTooltip.svelte';

  interface Props {
    id: string;
    label: string;
    checked?: boolean;
    disabled?: boolean;
    ariaLabel?: string;
    helpLabel?: string;
    helpText?: string;
    onChange?: (checked: boolean) => void;
  }

  let {
    id,
    label,
    checked = false,
    disabled = false,
    ariaLabel,
    helpLabel,
    helpText,
    onChange = () => {}
  }: Props = $props();

  const helpId = $derived(helpText ? `${id}-help` : undefined);

  function handleChange(event: Event): void {
    onChange((event.target as HTMLInputElement).checked);
  }
</script>

<div class="check-item">
  <input
    {id}
    type="checkbox"
    {checked}
    {disabled}
    aria-label={ariaLabel || undefined}
    onchange={handleChange}
  />
  <span class="check-label-with-help">
    <label class="check-label" for={id}>{label}</label>
    {#if helpText && helpLabel && helpId}
      <HelpTooltip id={helpId} label={helpLabel} text={helpText} {disabled} />
    {/if}
  </span>
</div>

<style>
  .check-item {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    min-height: var(--touch-target-comfortable);
    font-size: var(--font-size-sm);
    color: var(--text-primary);
  }

  .check-label-with-help {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .check-label {
    cursor: pointer;
  }

  .check-item input {
    width: var(--touch-target-min);
    height: var(--touch-target-min);
    margin: 0;
    accent-color: var(--accent);
  }
</style>
