import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SVG_PATH = resolve(__dirname, '..', 'static', 'favicon.svg');

/** @returns {import('vite').Plugin} */
export function faviconPlugin() {
  let isBuild = false;

  return {
    name: 'generate-favicons',

    configResolved(config) {
      isBuild = config.command === 'build';
    },

    async buildStart() {
      if (!isBuild) {
        return;
      }

      const { generateFaviconsIfNeeded } = await import('./generate-favicons.js');
      await generateFaviconsIfNeeded();
    },

    configureServer(server) {
      server.watcher.add(SVG_PATH);
      server.watcher.on('change', async (path) => {
        if (path === SVG_PATH) {
          const { generateFavicons } = await import('./generate-favicons.js');
          await generateFavicons();
        }
      });
    }
  };
}
