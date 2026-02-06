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

const ICO_SIZES = [16, 32, 48];
const APPLE_TOUCH_SIZE = 180;

async function generateFaviconsFromSvg(svgContent: string, outputDir: string) {
  const pngBuffers = ICO_SIZES.map((size) => {
    const resvg = new Resvg(svgContent, { fitTo: { mode: 'width', value: size } });
    return resvg.render().asPng();
  });

  const ico = await pngToIco(pngBuffers);
  await writeFile(resolve(outputDir, 'favicon.ico'), ico);

  const appleResvg = new Resvg(svgContent, { fitTo: { mode: 'width', value: APPLE_TOUCH_SIZE } });
  await writeFile(resolve(outputDir, 'apple-touch-icon.png'), appleResvg.render().asPng());

  return { ico, pngBuffers };
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
    it('should render SVG to PNG at specified sizes', () => {
      expect.assertions(ICO_SIZES.length * 2);

      for (const size of ICO_SIZES) {
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
    it('should bundle multiple PNGs into ICO format', async () => {
      expect.assertions(2);

      const pngBuffers = ICO_SIZES.map((size) => {
        const resvg = new Resvg(VALID_SVG, { fitTo: { mode: 'width', value: size } });
        return resvg.render().asPng();
      });

      const ico = await pngToIco(pngBuffers);

      expect(ico).toBeInstanceOf(Buffer);
      expect(ico.length).toBeGreaterThan(0);
    });

    it('should create valid ICO with correct header', async () => {
      expect.assertions(3);

      const pngBuffers = ICO_SIZES.map((size) => {
        const resvg = new Resvg(VALID_SVG, { fitTo: { mode: 'width', value: size } });
        return resvg.render().asPng();
      });

      const ico = await pngToIco(pngBuffers);

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
      // PNG magic bytes: 137 80 78 71 13 10 26 10
      expect(pngData[0]).toBe(137);
      expect(pngData.subarray(1, 4).toString()).toBe('PNG');
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
    it('should use correct ICO sizes (16, 32, 48)', () => {
      expect.assertions(1);
      expect(ICO_SIZES).toEqual([16, 32, 48]);
    });

    it('should use 180px for apple-touch-icon', () => {
      expect.assertions(1);
      expect(APPLE_TOUCH_SIZE).toBe(180);
    });
  });
});
