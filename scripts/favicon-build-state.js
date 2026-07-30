import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';

export const GENERATED_FAVICON_FILES = [
  'favicon.ico',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable.png'
];

/**
 * Returns whether favicon artifacts should be regenerated.
 * Regeneration is required when any output is missing or older than the source SVG.
 *
 * @param {{ sourcePath: string, outputDir: string }} options
 * @returns {Promise<boolean>}
 */
export async function shouldGenerateFavicons({ sourcePath, outputDir }) {
  const sourceStat = await stat(sourcePath);
  const sourceMtimeMs = sourceStat.mtimeMs;

  for (const filename of GENERATED_FAVICON_FILES) {
    try {
      const outputStat = await stat(resolve(outputDir, filename));

      if (outputStat.mtimeMs < sourceMtimeMs) {
        return true;
      }
    } catch {
      return true;
    }
  }

  return false;
}
