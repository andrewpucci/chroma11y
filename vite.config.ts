import devtoolsJson from 'vite-plugin-devtools-json';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import { faviconPlugin } from './scripts/vite-plugin-favicons.js';
import { browserslistToTargets } from 'lightningcss';
import browserslist from 'browserslist';

// Plugin to filter LightningCSS :global() warnings
//
// LightningCSS incorrectly warns about Svelte's :global() syntax, even though
// the functionality works correctly. This is a known issue that affects
// Svelte projects using LightningCSS.
//
// We filter these warnings to keep the console clean while maintaining
// full functionality. The same approach was used by Astro:
// https://github.com/withastro/astro/commit/3aa5337eaf01dbcc987dee9413c6985514ef7d6b
//
// The filter is tightly scoped and only matches:
// "[lightningcss] 'global' is not recognized as a valid pseudo-class"
//
// This preserves all other warnings including:
// - Other LightningCSS warnings (syntax errors, deprecations, etc.)
// - Vite warnings
// - Svelte warnings
// - TypeScript warnings
// - ESLint warnings

// Apply the filter immediately when this module is loaded
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args.join(' ');
  if (/\[lightningcss\] 'global'.*not recognized.*pseudo-class/.test(message)) {
    return; // Filter out LightningCSS :global() warnings
  }
  originalWarn(...args);
};

function filterLightningCssWarnings() {
  return {
    name: 'filter-lightningcss-warnings',
    buildStart() {
      // Re-apply filter during build processes
      const originalWarn = console.warn;
      console.warn = (...args) => {
        const message = args.join(' ');
        if (/\[lightningcss\] 'global'.*not recognized.*pseudo-class/.test(message)) {
          return; // Filter out LightningCSS :global() warnings
        }
        originalWarn(...args);
      };
    }
  };
}

export default defineConfig({
  plugins: [sveltekit(), devtoolsJson(), faviconPlugin(), filterLightningCssWarnings()],

  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: browserslistToTargets(browserslist())
    }
  },

  test: {
    expect: { requireAssertions: true },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage'
    },

    projects: [
      {
        extends: './vite.config.ts',

        resolve: {
          conditions: ['browser']
        },

        test: {
          name: 'dom',

          environment: 'jsdom',
          setupFiles: ['./src/vitest.setup.ts'],

          include: ['src/**/*.dom.{test,spec}.{js,ts}'],
          exclude: ['src/lib/server/**']
        }
      },

      {
        extends: './vite.config.ts',

        test: {
          name: 'client',

          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium', headless: true }]
          },

          include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
          exclude: ['src/lib/server/**']
        }
      },

      {
        extends: './vite.config.ts',

        test: {
          name: 'server',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['src/**/*.svelte.{test,spec}.{js,ts}', 'src/**/*.dom.{test,spec}.{js,ts}']
        }
      }
    ]
  }
});
