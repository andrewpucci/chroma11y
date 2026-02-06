<script lang="ts">
  import { toggleTheme, currentTheme } from '$lib/stores';

  const currentThemeValue = $derived($currentTheme);
</script>

<button
  class="btn btn-primary"
  onclick={toggleTheme}
  aria-pressed={currentThemeValue === 'dark'}
  aria-label={currentThemeValue === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
>
  <span aria-hidden="true">{currentThemeValue === 'light' ? '🌙' : '☀️'}</span>
  {currentThemeValue === 'light' ? 'Dark Mode' : 'Light Mode'}
</button>
