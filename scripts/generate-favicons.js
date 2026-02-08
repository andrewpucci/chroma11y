import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import pngToIco from 'png-to-ico';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATIC_DIR = resolve(__dirname, '..', 'static');
const SVG_PATH = resolve(STATIC_DIR, 'favicon.svg');

// Best practice: single 32x32 for legacy browsers
const ICO_SIZE = 32;
const APPLE_TOUCH_SIZE = 180;
const MANIFEST_SIZES = [192, 512];

export async function generateFavicons() {
  const svg = await readFile(SVG_PATH, 'utf8');

  // Generate 32x32 PNG for ICO
  const icoPng = new Resvg(svg, { fitTo: { mode: 'width', value: ICO_SIZE } }).render().asPng();

  // Create ICO file
  const ico = await pngToIco([icoPng]);
  await writeFile(resolve(STATIC_DIR, 'favicon.ico'), ico);

  // Generate apple-touch-icon (180x180)
  const appleResvg = new Resvg(svg, { fitTo: { mode: 'width', value: APPLE_TOUCH_SIZE } });
  await writeFile(resolve(STATIC_DIR, 'apple-touch-icon.png'), appleResvg.render().asPng());

  // Generate Android/Manifest icons (192, 512)
  for (const size of MANIFEST_SIZES) {
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
    await writeFile(resolve(STATIC_DIR, `icon-${size}.png`), resvg.render().asPng());
  }

  console.log('Generated favicon.ico, apple-touch-icon.png, and manifest icons');
}

// Run directly
generateFavicons().catch((err) => {
  console.error(err);
  process.exit(1);
});
