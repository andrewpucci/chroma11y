import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import toIco from 'to-ico';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATIC_DIR = resolve(__dirname, '..', 'static');
const SVG_PATH = resolve(STATIC_DIR, 'favicon.svg');

const ICO_SIZES = [16, 32, 48];
const APPLE_TOUCH_SIZE = 180;

export async function generateFavicons() {
	const svg = await readFile(SVG_PATH);

	// Generate PNGs for ICO (16, 32, 48)
	const pngBuffers = await Promise.all(
		ICO_SIZES.map((size) =>
			sharp(svg, { density: Math.round((72 * size) / 32) })
				.resize(size, size)
				.png()
				.toBuffer()
		)
	);

	// Bundle into ICO
	const ico = await toIco(pngBuffers);
	await writeFile(resolve(STATIC_DIR, 'favicon.ico'), ico);

	// Generate apple-touch-icon (180x180)
	await sharp(svg, { density: Math.round((72 * APPLE_TOUCH_SIZE) / 32) })
		.resize(APPLE_TOUCH_SIZE, APPLE_TOUCH_SIZE)
		.png()
		.toFile(resolve(STATIC_DIR, 'apple-touch-icon.png'));

	console.log('Generated favicon.ico and apple-touch-icon.png');
}

// Run directly
generateFavicons().catch((err) => {
	console.error(err);
	process.exit(1);
});
