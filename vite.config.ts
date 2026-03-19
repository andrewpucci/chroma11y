import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { faviconPlugin } from './scripts/vite-plugin-favicons.js';
import { browserslistToTargets } from 'lightningcss';
import browserslist from 'browserslist';

export default defineConfig({
  plugins: [sveltekit(), ...(process.env.VITEST ? [] : [faviconPlugin()])],

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
          name: 'server',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['src/**/*.dom.{test,spec}.{js,ts}']
        }
      }
    ]
  }
});
