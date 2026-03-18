<script lang="ts">
  import {
    IconArrowBackUp,
    IconArrowForwardUp,
    IconAlertCircle,
    IconBraces,
    IconBrandSass,
    IconCheck,
    IconChevronDown,
    IconCopy,
    IconFileTypeCss,
    IconRefresh,
    IconShare,
    IconX
  } from '@tabler/icons-svelte-runes';

  type IconName =
    | 'copy'
    | 'close'
    | 'json'
    | 'css'
    | 'scss'
    | 'share'
    | 'reset'
    | 'undo'
    | 'redo'
    | 'chevron-down'
    | 'status-pass'
    | 'status-fail';

  interface Props {
    name: IconName;
    size?: number;
    stroke?: number;
  }

  const ICONS = {
    copy: IconCopy,
    close: IconX,
    json: IconBraces,
    css: IconFileTypeCss,
    share: IconShare,
    reset: IconRefresh,
    undo: IconArrowBackUp,
    redo: IconArrowForwardUp,
    'chevron-down': IconChevronDown,
    scss: IconBrandSass,
    'status-pass': IconCheck,
    'status-fail': IconX
  } as const satisfies Record<IconName, typeof IconCopy>;

  let { name, size = 16, stroke = 1.75 }: Props = $props();
  const IconComponent = $derived(ICONS[name] ?? IconAlertCircle);
</script>

<IconComponent {size} {stroke} aria-hidden="true" />
