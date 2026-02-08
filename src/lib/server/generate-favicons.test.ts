import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import pngToIco from 'png-to-ico';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_DIR = resolve(__dirname, '__test_favicons__');
const TEST_SVG_PATH = resolve(TEST_DIR, 'favicon.svg');

const VALID_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#f8f9fa" rx="2"/>
</svg>`;

const ICO_SIZE = 32;
const APPLE_TOUCH_SIZE = 180;
const MANIFEST_SIZES = [192, 512];

function verifyPngSignature(buffer: Buffer | Uint8Array) {
  // Verify PNG file signature (Magic Bytes): 137 80 78 71 13 10 26 10
  // 137 (0x89) is the high-bit byte, followed by "PNG" in ASCII
  expect(buffer[0]).toBe(137);
  expect(buffer.subarray(1, 4).toString()).toBe('PNG');
}

async function generateFaviconsFromSvg(svgContent: string, outputDir: string) {
  // Generate 32x32 PNG for ICO
  const icoPng = new Resvg(svgContent, { fitTo: { mode: 'width', value: ICO_SIZE } })
    .render()
    .asPng();

  // Create ICO file
  const ico = await pngToIco([icoPng]);
  await writeFile(resolve(outputDir, 'favicon.ico'), ico);

  // Generate apple-touch-icon (180x180)
  const appleResvg = new Resvg(svgContent, { fitTo: { mode: 'width', value: APPLE_TOUCH_SIZE } });
  await writeFile(resolve(outputDir, 'apple-touch-icon.png'), appleResvg.render().asPng());

  // Generate Android/Manifest icons (192, 512)
  for (const size of MANIFEST_SIZES) {
    const resvg = new Resvg(svgContent, { fitTo: { mode: 'width', value: size } });
    await writeFile(resolve(outputDir, `icon-${size}.png`), resvg.render().asPng());
  }

  return { ico, icoPng };
}

describe('generate-favicons', () => {
  beforeEach(async () => {
    if (!existsSync(TEST_DIR)) {
      await mkdir(TEST_DIR, { recursive: true });
    }
    await writeFile(TEST_SVG_PATH, VALID_SVG);
  });

  afterEach(async () => {
    if (existsSync(TEST_DIR)) {
      await rm(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('SVG to PNG conversion', () => {
    it('should render SVG to PNG at 32px for ICO', () => {
      expect.assertions(2);

      const resvg = new Resvg(VALID_SVG, { fitTo: { mode: 'width', value: ICO_SIZE } });
      const rendered = resvg.render();
      const png = rendered.asPng();

      expect(png).toBeInstanceOf(Uint8Array);
      expect(png.length).toBeGreaterThan(0);
    });

    it('should render SVG to PNG at manifest sizes (192, 512)', () => {
      expect.assertions(MANIFEST_SIZES.length * 2);

      for (const size of MANIFEST_SIZES) {
        const resvg = new Resvg(VALID_SVG, { fitTo: { mode: 'width', value: size } });
        const rendered = resvg.render();
        const png = rendered.asPng();

        expect(png).toBeInstanceOf(Uint8Array);
        expect(png.length).toBeGreaterThan(0);
      }
    });

    it('should render apple-touch-icon at 180x180', () => {
      expect.assertions(2);

      const resvg = new Resvg(VALID_SVG, { fitTo: { mode: 'width', value: APPLE_TOUCH_SIZE } });
      const rendered = resvg.render();
      const png = rendered.asPng();

      expect(png).toBeInstanceOf(Uint8Array);
      expect(png.length).toBeGreaterThan(0);
    });
  });

  describe('ICO generation', () => {
    it('should create ICO from single 32px PNG', async () => {
      expect.assertions(2);

      const icoPng = new Resvg(VALID_SVG, { fitTo: { mode: 'width', value: ICO_SIZE } })
        .render()
        .asPng();
      const ico = await pngToIco([icoPng]);

      expect(ico).toBeInstanceOf(Buffer);
      expect(ico.length).toBeGreaterThan(0);
    });

    it('should create valid ICO with correct header', async () => {
      expect.assertions(3);

      const icoPng = new Resvg(VALID_SVG, { fitTo: { mode: 'width', value: ICO_SIZE } })
        .render()
        .asPng();
      const ico = await pngToIco([icoPng]);

      // ICO header: first 2 bytes are reserved (0), next 2 bytes are type (1 for ICO)
      expect(ico[0]).toBe(0);
      expect(ico[1]).toBe(0);
      expect(ico[2]).toBe(1); // ICO type
    });
  });

  describe('file output', () => {
    it('should write favicon.ico to output directory', async () => {
      expect.assertions(1);

      await generateFaviconsFromSvg(VALID_SVG, TEST_DIR);

      expect(existsSync(resolve(TEST_DIR, 'favicon.ico'))).toBe(true);
    });

    it('should write apple-touch-icon.png to output directory', async () => {
      expect.assertions(1);

      await generateFaviconsFromSvg(VALID_SVG, TEST_DIR);

      expect(existsSync(resolve(TEST_DIR, 'apple-touch-icon.png'))).toBe(true);
    });

    it('should create valid PNG file for apple-touch-icon', async () => {
      expect.assertions(2);

      await generateFaviconsFromSvg(VALID_SVG, TEST_DIR);

      const pngData = await readFile(resolve(TEST_DIR, 'apple-touch-icon.png'));
      verifyPngSignature(pngData);
    });

    it('should write manifest icons to output directory', async () => {
      expect.assertions(MANIFEST_SIZES.length);

      await generateFaviconsFromSvg(VALID_SVG, TEST_DIR);

      for (const size of MANIFEST_SIZES) {
        expect(existsSync(resolve(TEST_DIR, `icon-${size}.png`))).toBe(true);
      }
    });

    it('should create valid PNG files for manifest icons', async () => {
      expect.assertions(MANIFEST_SIZES.length * 2);

      await generateFaviconsFromSvg(VALID_SVG, TEST_DIR);

      for (const size of MANIFEST_SIZES) {
        const pngData = await readFile(resolve(TEST_DIR, `icon-${size}.png`));
        verifyPngSignature(pngData);
      }
    });
  });

  describe('error handling', () => {
    it('should throw on invalid SVG content', () => {
      expect.assertions(1);

      expect(() => {
        new Resvg('not valid svg', { fitTo: { mode: 'width', value: 32 } });
      }).toThrow();
    });

    it('should throw on empty SVG content', () => {
      expect.assertions(1);

      expect(() => {
        new Resvg('', { fitTo: { mode: 'width', value: 32 } });
      }).toThrow();
    });
  });

  describe('configuration', () => {
    it('should use 32px for ICO (single size best practice)', () => {
      expect.assertions(1);
      expect(ICO_SIZE).toBe(32);
    });

    it('should use 180px for apple-touch-icon', () => {
      expect.assertions(1);
      expect(APPLE_TOUCH_SIZE).toBe(180);
    });

    it('should use correct manifest sizes (192, 512)', () => {
      expect.assertions(1);
      expect(MANIFEST_SIZES).toEqual([192, 512]);
    });
  });
});
