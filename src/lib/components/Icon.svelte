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
    IconHelpCircle,
    IconPencil,
    IconRefresh,
    IconShare,
    IconX,
    IconSettings,
    IconContrast
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
    | 'edit'
    | 'help'
    | 'chevron-down'
    | 'status-pass'
    | 'status-fail'
    | 'settings'
    | 'contrast'
    | 'check';

  interface Props {
    name: IconName;
    size?: number | string;
    stroke?: number | string;
    class?: string;
    style?: string;
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
    edit: IconPencil,
    help: IconHelpCircle,
    'chevron-down': IconChevronDown,
    scss: IconBrandSass,
    'status-pass': IconCheck,
    'status-fail': IconX,
    settings: IconSettings,
    contrast: IconContrast,
    check: IconCheck
  } as const satisfies Record<IconName, typeof IconCopy>;

  let {
    name,
    size = 16,
    stroke = 1.75,
    class: className = '',
    style: styleText = ''
  }: Props = $props();
  const IconComponent = $derived(ICONS[name] ?? IconAlertCircle);
  const resolvedSize = $derived(typeof size === 'number' ? `${size}px` : size);
  const resolvedStroke = $derived(typeof stroke === 'number' ? `${stroke}` : stroke);
  const iconStyle = $derived(
    `inline-size: ${resolvedSize}; block-size: ${resolvedSize}; stroke-width: ${resolvedStroke};${styleText ? ` ${styleText}` : ''}`
  );
</script>

<IconComponent class={className} style={iconStyle} aria-hidden="true" />
