<script lang="ts">
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
    {#if helpText && helpLabel}
      <span class="help-popover">
        <button
          type="button"
          class="info-button"
          aria-label={helpLabel}
          aria-describedby={helpId}
          {disabled}
        >
          <span aria-hidden="true">i</span>
        </button>
        <span id={helpId} class="help-tooltip" role="tooltip">
          {helpText}
        </span>
      </span>
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
    padding: 0;
  }

  .info-button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .help-tooltip {
    position: absolute;
    inset-block-start: calc(100% + var(--space-xs));
    inset-inline-start: 0;
    z-index: 20;
    inline-size: min(40ch, calc(100vw - var(--space-xl)));
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
</style>
