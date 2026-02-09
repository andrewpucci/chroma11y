<script lang="ts">
  interface Props {
    logoSrc?: string;
    logoWidth?: number;
    logoHeight?: number;
    title?: string;
    tagline?: string;
  }

  let {
    logoSrc = '/logo.svg',
    logoWidth = 40,
    logoHeight = 40,
    title = 'Chroma11y',
    tagline = 'Accessible color palettes, powered by OKLCH'
  }: Props = $props();
</script>

<div class="brand">
  <img src={logoSrc} alt="" class="brand-logo" width={logoWidth} height={logoHeight} />
  <div class="brand-text">
    <h1 id="main-heading">{title}</h1>
    <p class="tagline">{tagline}</p>
  </div>
</div>

<style>
  .brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .brand-logo {
    flex-shrink: 0;
  }

  .brand-text {
    display: grid;
    gap: 0.25rem;
  }

  .brand h1 {
    font-size: 1.35rem;
    font-weight: 750;
    letter-spacing: -0.03em;
  }

  .tagline {
    font-size: 0.9rem;
    color: var(--text-secondary);
  }

  @media (max-width: 520px) {
    .brand h1 {
      font-size: 1.2rem;
    }
  }
</style>
