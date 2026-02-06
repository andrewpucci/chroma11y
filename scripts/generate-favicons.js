import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import pngToIco from 'png-to-ico';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATIC_DIR = resolve(__dirname, '..', 'static');
const SVG_PATH = resolve(STATIC_DIR, 'favicon.svg');

const ICO_SIZES = [16, 32, 48];
const APPLE_TOUCH_SIZE = 180;

export async function generateFavicons() {
  const svg = await readFile(SVG_PATH, 'utf8');

  // Generate PNGs for ICO (16, 32, 48)
  const pngBuffers = ICO_SIZES.map((size) => {
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
    return resvg.render().asPng();
  });

  // Bundle into ICO
  const ico = await pngToIco(pngBuffers);
  await writeFile(resolve(STATIC_DIR, 'favicon.ico'), ico);

  // Generate apple-touch-icon (180x180)
  const appleResvg = new Resvg(svg, { fitTo: { mode: 'width', value: APPLE_TOUCH_SIZE } });
  await writeFile(resolve(STATIC_DIR, 'apple-touch-icon.png'), appleResvg.render().asPng());

  console.log('Generated favicon.ico and apple-touch-icon.png');
}

// Run directly
generateFavicons().catch((err) => {
  console.error(err);
  process.exit(1);
});
