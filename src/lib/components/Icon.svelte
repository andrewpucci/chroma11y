<script lang="ts">
  import {
    IconAlertCircle,
    IconBraces,
    IconBrandSass,
    IconCopy,
    IconFileTypeCss,
    IconRefresh,
    IconShare,
    IconX
  } from '@tabler/icons-svelte-runes';

  type IconName = 'copy' | 'close' | 'json' | 'css' | 'scss' | 'share' | 'reset';

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
    scss: IconBrandSass
  } as const satisfies Record<IconName, typeof IconCopy>;

  let { name, size = 16, stroke = 1.75 }: Props = $props();
  const IconComponent = $derived(ICONS[name] ?? IconAlertCircle);
</script>

<IconComponent {size} {stroke} aria-hidden="true" />
