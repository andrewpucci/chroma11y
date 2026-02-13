<script lang="ts">
  import DOMPurify from 'dompurify';

  interface Props {
    src: string;
    class?: string;
    width?: string | number;
    height?: string | number;
  }

  let { src, class: className = '', width = '100%', height = '100%' }: Props = $props();

  let svgContent = $state('');
  let error = $state(false);

  const svgCache = new Map<string, string>();

  async function loadSvg(url: string) {
    try {
      const cached = svgCache.get(url);
      if (cached) {
        svgContent = cached;
        error = false;
        return;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load SVG: ${response.status}`);
      const raw = await response.text();
      const sanitized = DOMPurify.sanitize(raw, {
        USE_PROFILES: { svg: true },
        ADD_TAGS: ['style']
      });
      svgCache.set(url, sanitized);
      svgContent = sanitized;
      error = false;
    } catch (err) {
      console.error('Error loading SVG:', err);
      error = true;
      svgContent = '';
    }
  }

  $effect(() => {
    loadSvg(src);
  });
</script>

{#if error}
  <div class="svg-error">
    Failed to load SVG
  </div>
{:else if svgContent}
  <div class="svg-container {className}" style="width: {width}; height: {height};">
    {@html svgContent}
  </div>
{/if}

<style>
  .svg-container {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .svg-error {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    font-size: 0.8rem;
    background: var(--bg-tertiary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 0.5rem;
  }
</style>
