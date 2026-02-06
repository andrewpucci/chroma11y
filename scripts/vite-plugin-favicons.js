import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SVG_PATH = resolve(__dirname, '..', 'static', 'favicon.svg');

/** @returns {import('vite').Plugin} */
export function faviconPlugin() {
	return {
		name: 'generate-favicons',

		async buildStart() {
			const { generateFavicons } = await import('./generate-favicons.js');
			await generateFavicons();
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
