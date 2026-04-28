<script lang="ts">
  import type { HistoryMenuEntry } from '$lib/history';
  import Icon from './Icon.svelte';
  import SplitButton, { type SplitButtonMenuItem } from './SplitButton.svelte';

  interface Props {
    action: 'undo' | 'redo';
    disabled?: boolean;
    entries?: HistoryMenuEntry[];
    onAction: () => void;
    onSelect: (position: number) => void;
  }

  let { action, disabled = false, entries = [], onAction, onSelect }: Props = $props();

  const actionLabel = $derived(action === 'undo' ? 'Undo last change' : 'Redo last change');
  const iconName = $derived(action === 'undo' ? 'undo' : 'redo');
  const buttonLabel = $derived(action === 'undo' ? 'Undo' : 'Redo');
  const menuLabel = $derived(action === 'undo' ? 'Undo history' : 'Redo history');
  const menuTriggerLabel = $derived(action === 'undo' ? 'Show undo history' : 'Show redo history');

  const menuItems = $derived<SplitButtonMenuItem[]>(
    entries.map((entry) => ({
      id: `history-${action}-${entry.position}`,
      label: entry.displayText,
      ariaLabel: entry.ariaLabel,
      onSelect: () => onSelect(entry.position)
    }))
  );

  const menuDisabled = $derived(disabled || entries.length === 0);
</script>

<SplitButton
  primaryAriaLabel={actionLabel}
  onPrimary={onAction}
  {menuLabel}
  {menuTriggerLabel}
  {menuItems}
  {disabled}
  {menuDisabled}
>
  <Icon name={iconName} />
  <span>{buttonLabel}</span>
</SplitButton>
