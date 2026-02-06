import devtoolsJson from 'vite-plugin-devtools-json';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { faviconPlugin } from './scripts/vite-plugin-favicons.js';

export default defineConfig({
  plugins: [sveltekit(), devtoolsJson(), vanillaExtractPlugin(), faviconPlugin()],

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
