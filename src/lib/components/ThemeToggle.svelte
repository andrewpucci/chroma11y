<script lang="ts">
  import { toggleTheme, currentTheme } from '$lib/stores';

  const currentThemeValue = $derived($currentTheme);
</script>

<button
  class="theme-toggle"
  onclick={toggleTheme}
  aria-pressed={currentThemeValue === 'dark'}
  aria-label={currentThemeValue === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
>
  <span aria-hidden="true">{currentThemeValue === 'light' ? '🌙' : '☀️'}</span>
  {currentThemeValue === 'light' ? 'Dark Mode' : 'Light Mode'}
</button>

<style>
  .theme-toggle {
    padding: 0.75rem 1rem;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    margin-bottom: 1rem;
    width: 100%;
    transition: all 0.2s ease;
    min-height: 44px;
  }

  /* Touch-friendly on mobile */
  @media (max-width: 768px) {
    .theme-toggle {
      padding: 1rem;
      min-height: 48px;
      touch-action: manipulation;
    }
  }

  .theme-toggle:hover {
    background: var(--accent-hover);
    transform: translateY(-1px);
  }

  .theme-toggle:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
</style>
