import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import pngToIco from 'png-to-ico';
import { JSDOM } from 'jsdom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATIC_DIR = resolve(__dirname, '..', 'static');
const SVG_PATH = resolve(STATIC_DIR, 'favicon.svg');

// Best practice: single 32x32 for legacy browsers
const ICO_SIZE = 32;
const APPLE_TOUCH_SIZE = 180;
const MANIFEST_SIZES = [192, 512];
const MASKABLE_SIZE = 512;

/**
 * Parses an SVG string and returns its viewBox and inner content
 * @param {string} svgString
 */
function parseSvg(svgString) {
  const dom = new JSDOM(svgString, { contentType: 'image/svg+xml' });
  const svgEl = dom.window.document.querySelector('svg');

  if (!svgEl) {
    throw new Error('No SVG element found in input');
  }

  const viewBox = svgEl.getAttribute('viewBox') || '0 0 100 100';
  const innerContent = svgEl.innerHTML;

  return { viewBox, innerContent };
}

/**
 * @param {string} svg
 * @param {number} size
 * @param {number} padding
 */
function wrapSvgWithPadding(svg, size, padding) {
  const { viewBox, innerContent } = parseSvg(svg);
  const contentSize = size - padding * 2;

  // Create a new DOM for the wrapped SVG
  const wrappedDom = new JSDOM(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" fill="#fafafa"/>
      <svg x="${padding}" y="${padding}" width="${contentSize}" height="${contentSize}" viewBox="${viewBox}">
        ${innerContent}
      </svg>
    </svg>`,
    { contentType: 'image/svg+xml' }
  );

  return wrappedDom.serialize();
}

/**
 * @param {string} svg
 * @param {number} size
 */
function createMaskableSvg(svg, size) {
  // Safe zone is 409×409 circle centered in 512×512
  // So padding = (512 - 409) / 2 = 51.5px on each side
  // We use 410 for the safe zone to get an integer padding of 51px
  const safeZoneSize = 410;
  const padding = (size - safeZoneSize) / 2;
  const { viewBox, innerContent } = parseSvg(svg);

  const wrappedDom = new JSDOM(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" fill="#fafafa"/>
      <svg x="${padding}" y="${padding}" width="${safeZoneSize}" height="${safeZoneSize}" viewBox="${viewBox}">
        ${innerContent}
      </svg>
    </svg>`,
    { contentType: 'image/svg+xml' }
  );

  return wrappedDom.serialize();
}

export async function generateFavicons() {
  const svg = await readFile(SVG_PATH, 'utf8');

  // Generate 32x32 PNG for ICO
  const icoPng = new Resvg(svg, { fitTo: { mode: 'width', value: ICO_SIZE } }).render().asPng();

  // Create ICO file
  const ico = await pngToIco([icoPng]);
  await writeFile(resolve(STATIC_DIR, 'favicon.ico'), ico);

  // Generate apple-touch-icon (180x180) with 20px padding
  const appleTouchSvg = wrapSvgWithPadding(svg, APPLE_TOUCH_SIZE, 20);
  const appleResvg = new Resvg(appleTouchSvg, {
    fitTo: { mode: 'width', value: APPLE_TOUCH_SIZE }
  });
  await writeFile(resolve(STATIC_DIR, 'apple-touch-icon.png'), appleResvg.render().asPng());

  // Generate Android/Manifest icons (192, 512)
  for (const size of MANIFEST_SIZES) {
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
    await writeFile(resolve(STATIC_DIR, `icon-${size}.png`), resvg.render().asPng());
  }

  // Generate maskable icon (512x512 with safe zone padding)
  const maskableSvg = createMaskableSvg(svg, MASKABLE_SIZE);
  const maskableResvg = new Resvg(maskableSvg, { fitTo: { mode: 'width', value: MASKABLE_SIZE } });
  await writeFile(resolve(STATIC_DIR, 'icon-maskable.png'), maskableResvg.render().asPng());

  console.log(
    'Generated favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png, and icon-maskable.png'
  );
}

// Run directly
generateFavicons().catch((err) => {
  console.error(err);
  process.exit(1);
});
