import prettier from 'eslint-config-prettier';
import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import oxlint from 'eslint-plugin-oxlint';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default defineConfig(
  includeIgnoreFile(gitignorePath),
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  prettier,
  ...svelte.configs.prettier,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },

    rules: {
      // typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
      // see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
      'no-undef': 'off'
    }
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],

    // No `svelteConfig`: the parser only reads compilerOptions, warningFilter and
    // kit.files.routes from it, and vite.config.ts sets none of them. Loading it would
    // run the whole Vite config on every lint. If any of those get configured, move them
    // to a small module that both vite.config.ts and this file import.
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: ts.parser
      }
    }
  },
  // Keep last: turns off ESLint rules already covered by oxlint (.oxlintrc.json),
  // so the two linters don't double-report. Svelte template rules remain ESLint-only.
  ...oxlint.buildFromOxlintConfigFile('./.oxlintrc.json')
);
