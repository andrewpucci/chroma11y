<script lang="ts">
  import {
    IconAlertCircle,
    IconBraces,
    IconBrandSass,
    IconCheck,
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
    scss: IconBrandSass,
    'status-pass': IconCheck,
    'status-fail': IconX
  } as const satisfies Record<IconName, typeof IconCopy>;

  let { name, size = 16, stroke = 1.75 }: Props = $props();
  const IconComponent = $derived(ICONS[name] ?? IconAlertCircle);
</script>

<IconComponent {size} {stroke} aria-hidden="true" />
