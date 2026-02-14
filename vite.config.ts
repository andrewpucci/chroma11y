import devtoolsJson from 'vite-plugin-devtools-json';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import { faviconPlugin } from './scripts/vite-plugin-favicons.js';
import { browserslistToTargets } from 'lightningcss';
import browserslist from 'browserslist';

export default defineConfig({
  plugins: [sveltekit(), devtoolsJson(), faviconPlugin()],

  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: browserslistToTargets(browserslist())
    }
  },

  test: {
    expect: { requireAssertions: true },

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
