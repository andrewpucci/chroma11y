import { test, expect } from '@playwright/test';
import { waitForAppReady, waitForColorGeneration } from './test-utils';

/**
 * Performance Benchmarking Test Suite
 * Measures load times, color generation performance, and re-render efficiency
 */

// Performance thresholds (in milliseconds)
const THRESHOLDS = {
  INITIAL_LOAD: 3000, // Max acceptable initial load time
  COLOR_GENERATION: 500, // Max acceptable color generation time
  THEME_SWITCH: 500, // Max acceptable theme switch time
  SLIDER_UPDATE: 200, // Max acceptable slider update time
  EXPORT_GENERATION: 500 // Max acceptable export generation time
};

interface PerformanceMetrics {
  name: string;
  duration: number;
  threshold: number;
  passed: boolean;
}

const metrics: PerformanceMetrics[] = [];

function recordMetric(name: string, duration: number, threshold: number): void {
  metrics.push({
    name,
    duration: Math.round(duration * 100) / 100,
    threshold,
    passed: duration <= threshold
  });
}

test.describe('Performance Benchmarking', () => {
  test.describe('Initial Load Performance', () => {
    test('measures time to first meaningful paint', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');

      // Wait for the app to be fully interactive
      await waitForAppReady(page);

      const loadTime = Date.now() - startTime;
      recordMetric('Initial Load', loadTime, THRESHOLDS.INITIAL_LOAD);

      console.log(`Initial load time: ${loadTime}ms (threshold: ${THRESHOLDS.INITIAL_LOAD}ms)`);
      expect(loadTime).toBeLessThan(THRESHOLDS.INITIAL_LOAD);
    });

    test('measures time to render all color swatches', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');
      await waitForAppReady(page);

      // Wait for all 132 swatches (11 neutrals + 11 palettes × 11 colors)
      await page.waitForFunction(
        () => {
          const swatches = document.querySelectorAll('.color-swatch');
          return swatches.length >= 132;
        },
        { timeout: 10000 }
      );

      const renderTime = Date.now() - startTime;
      console.log(`Time to render all swatches: ${renderTime}ms`);

      // Verify all swatches are rendered
      const swatchCount = await page.locator('.color-swatch').count();
      expect(swatchCount).toBeGreaterThanOrEqual(132);
    });

    test('measures DOM content loaded timing', async ({ page }) => {
      await page.goto('/');

      const timing = await page.evaluate(() => {
        const perf = window.performance;
        const timing = perf.timing || {};
        return {
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart || perf.now(),
          domInteractive: timing.domInteractive - timing.navigationStart || perf.now(),
          loadComplete: timing.loadEventEnd - timing.navigationStart || perf.now()
        };
      });

      console.log('DOM Timing Metrics:');
      console.log(`  - DOM Content Loaded: ${timing.domContentLoaded}ms`);
      console.log(`  - DOM Interactive: ${timing.domInteractive}ms`);
      console.log(`  - Load Complete: ${timing.loadComplete}ms`);

      // DOM should be interactive within reasonable time
      expect(timing.domInteractive).toBeLessThan(2000);
    });
  });

  test.describe('Color Generation Performance', () => {
    test('measures color generation time on parameter change', async ({ page }) => {
      await page.goto('/');
      await waitForAppReady(page);

      // Measure time to regenerate colors when base color changes
      const baseColorInput = page.locator('#baseColor');

      const startTime = Date.now();
      await baseColorInput.fill('#ff0000');
      await waitForColorGeneration(page);
      const generationTime = Date.now() - startTime;

      recordMetric('Color Generation (base color)', generationTime, THRESHOLDS.COLOR_GENERATION);
      console.log(
        `Color generation time (base color change): ${generationTime}ms (threshold: ${THRESHOLDS.COLOR_GENERATION}ms)`
      );

      expect(generationTime).toBeLessThan(THRESHOLDS.COLOR_GENERATION);
    });

    test('measures warmth slider update performance', async ({ page }) => {
      await page.goto('/');
      await waitForAppReady(page);

      const warmthSlider = page.locator('#warmth');

      const startTime = Date.now();
      await warmthSlider.fill('10');
      await waitForColorGeneration(page);
      const updateTime = Date.now() - startTime;

      recordMetric('Warmth Slider Update', updateTime, THRESHOLDS.SLIDER_UPDATE);
      console.log(
        `Warmth slider update time: ${updateTime}ms (threshold: ${THRESHOLDS.SLIDER_UPDATE}ms)`
      );

      expect(updateTime).toBeLessThan(THRESHOLDS.SLIDER_UPDATE);
    });

    test('measures chroma multiplier update performance', async ({ page }) => {
      await page.goto('/');
      await waitForAppReady(page);

      const chromaSlider = page.locator('#chroma');

      const startTime = Date.now();
      await chromaSlider.fill('1.5');
      await waitForColorGeneration(page);
      const updateTime = Date.now() - startTime;

      recordMetric('Chroma Multiplier Update', updateTime, THRESHOLDS.SLIDER_UPDATE);
      console.log(
        `Chroma multiplier update time: ${updateTime}ms (threshold: ${THRESHOLDS.SLIDER_UPDATE}ms)`
      );

      expect(updateTime).toBeLessThan(THRESHOLDS.SLIDER_UPDATE);
    });

    test('measures bezier curve parameter update performance', async ({ page }) => {
      await page.goto('/');
      await waitForAppReady(page);

      const x1Slider = page.locator('#x1');

      const startTime = Date.now();
      await x1Slider.fill('0.5');
      await waitForColorGeneration(page);
      const updateTime = Date.now() - startTime;

      recordMetric('Bezier Curve Update', updateTime, THRESHOLDS.SLIDER_UPDATE);
      console.log(
        `Bezier curve update time: ${updateTime}ms (threshold: ${THRESHOLDS.SLIDER_UPDATE}ms)`
      );

      expect(updateTime).toBeLessThan(THRESHOLDS.SLIDER_UPDATE);
    });

    test('measures rapid parameter changes (stress test)', async ({ page }) => {
      await page.goto('/');
      await waitForAppReady(page);

      const warmthSlider = page.locator('#warmth');
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const value = (i % 20) - 10; // Oscillate between -10 and 9
        const startTime = Date.now();
        await warmthSlider.fill(String(value));
        await page.waitForTimeout(50); // Small delay to allow render
        times.push(Date.now() - startTime);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`Rapid parameter changes (${iterations} iterations):`);
      console.log(`  - Average time: ${avgTime.toFixed(2)}ms`);
      console.log(`  - Max time: ${maxTime}ms`);

      // Average should be reasonable even under stress
      expect(avgTime).toBeLessThan(THRESHOLDS.SLIDER_UPDATE * 2);
    });
  });

  test.describe('Theme Switch Performance', () => {
    test('measures light to dark theme switch time', async ({ page }) => {
      await page.goto('/');
      await waitForAppReady(page);

      const themeToggle = page.locator('.theme-toggle');

      const startTime = Date.now();
      await themeToggle.click();
      await waitForColorGeneration(page);
      const switchTime = Date.now() - startTime;

      recordMetric('Theme Switch (light→dark)', switchTime, THRESHOLDS.THEME_SWITCH);
      console.log(
        `Theme switch time (light→dark): ${switchTime}ms (threshold: ${THRESHOLDS.THEME_SWITCH}ms)`
      );

      expect(switchTime).toBeLessThan(THRESHOLDS.THEME_SWITCH);
    });

    test('measures dark to light theme switch time', async ({ page }) => {
      await page.goto('/');
      await waitForAppReady(page);

      const themeToggle = page.locator('.theme-toggle');

      // Switch to dark first
      await themeToggle.click();
      await waitForColorGeneration(page);

      // Now measure switch back to light
      const startTime = Date.now();
      await themeToggle.click();
      await waitForColorGeneration(page);
      const switchTime = Date.now() - startTime;

      recordMetric('Theme Switch (dark→light)', switchTime, THRESHOLDS.THEME_SWITCH);
      console.log(
        `Theme switch time (dark→light): ${switchTime}ms (threshold: ${THRESHOLDS.THEME_SWITCH}ms)`
      );

      expect(switchTime).toBeLessThan(THRESHOLDS.THEME_SWITCH);
    });
  });

  test.describe('Export Performance', () => {
    test('measures JSON export generation time', async ({ page }) => {
      await page.goto('/');
      await waitForAppReady(page);

      // Set up download listener
      const downloadPromise = page.waitForEvent('download');

      const startTime = Date.now();
      await page.locator('button', { has: page.locator('text=Export JSON') }).click();
      await downloadPromise;
      const exportTime = Date.now() - startTime;

      recordMetric('JSON Export', exportTime, THRESHOLDS.EXPORT_GENERATION);
      console.log(
        `JSON export time: ${exportTime}ms (threshold: ${THRESHOLDS.EXPORT_GENERATION}ms)`
      );

      expect(exportTime).toBeLessThan(THRESHOLDS.EXPORT_GENERATION);
    });

    test('measures CSS export generation time', async ({ page }) => {
      await page.goto('/');
      await waitForAppReady(page);

      const downloadPromise = page.waitForEvent('download');

      const startTime = Date.now();
      await page.locator('button:has-text("Export CSS")').click();
      await downloadPromise;
      const exportTime = Date.now() - startTime;

      recordMetric('CSS Export', exportTime, THRESHOLDS.EXPORT_GENERATION);
      console.log(
        `CSS export time: ${exportTime}ms (threshold: ${THRESHOLDS.EXPORT_GENERATION}ms)`
      );

      expect(exportTime).toBeLessThan(THRESHOLDS.EXPORT_GENERATION);
    });

    test('measures SCSS export generation time', async ({ page }) => {
      await page.goto('/');
      await waitForAppReady(page);

      const downloadPromise = page.waitForEvent('download');

      const startTime = Date.now();
      await page.locator('button:has-text("Export SCSS")').click();
      await downloadPromise;
      const exportTime = Date.now() - startTime;

      recordMetric('SCSS Export', exportTime, THRESHOLDS.EXPORT_GENERATION);
      console.log(
        `SCSS export time: ${exportTime}ms (threshold: ${THRESHOLDS.EXPORT_GENERATION}ms)`
      );

      expect(exportTime).toBeLessThan(THRESHOLDS.EXPORT_GENERATION);
    });
  });

  test.describe('Re-render Efficiency', () => {
    test('verifies minimal DOM mutations on parameter change', async ({ page }) => {
      await page.goto('/');
      await waitForAppReady(page);

      // Count initial swatches
      const initialSwatchCount = await page.locator('.color-swatch').count();

      // Change a parameter
      await page.locator('#warmth').fill('5');
      await waitForColorGeneration(page);

      // Count swatches after change - should be the same (no unnecessary re-renders)
      const afterSwatchCount = await page.locator('.color-swatch').count();

      console.log(`Swatch count before: ${initialSwatchCount}, after: ${afterSwatchCount}`);
      expect(afterSwatchCount).toBe(initialSwatchCount);
    });

    test('verifies efficient updates on nudger changes', async ({ page }) => {
      await page.goto('/');
      await waitForAppReady(page);

      // Get initial state
      const initialSwatchCount = await page.locator('.color-swatch').count();

      // Change a lightness nudger
      const nudgerInput = page.locator('.color-display input[type="number"]').first();
      await nudgerInput.fill('0.05');
      await waitForColorGeneration(page);

      // Verify swatch count remains stable
      const afterSwatchCount = await page.locator('.color-swatch').count();
      expect(afterSwatchCount).toBe(initialSwatchCount);
    });

    test('measures memory usage stability', async ({ page }) => {
      await page.goto('/');
      await waitForAppReady(page);

      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as unknown as { memory: { usedJSHeapSize: number } }).memory
            .usedJSHeapSize;
        }
        return 0;
      });

      // Perform multiple operations
      for (let i = 0; i < 5; i++) {
        await page.locator('#warmth').fill(String(i - 2));
        await page.waitForTimeout(100);
      }

      // Get final memory usage
      const finalMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as unknown as { memory: { usedJSHeapSize: number } }).memory
            .usedJSHeapSize;
        }
        return 0;
      });

      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        const memoryIncreaseMB = memoryIncrease / (1024 * 1024);
        console.log(`Memory increase after operations: ${memoryIncreaseMB.toFixed(2)}MB`);

        // Memory increase should be minimal (less than 10MB for these operations)
        expect(memoryIncreaseMB).toBeLessThan(10);
      } else {
        console.log('Memory API not available in this browser');
      }
    });
  });

  test.describe('Interaction Responsiveness', () => {
    test('measures click-to-copy responsiveness', async ({ page }) => {
      await page.goto('/');
      await waitForAppReady(page);

      const swatch = page.locator('.color-swatch').first();

      const startTime = Date.now();
      await swatch.click();
      // Wait for click to complete
      await page.waitForTimeout(50);
      const clickTime = Date.now() - startTime;

      console.log(`Click-to-copy response time: ${clickTime}ms`);
      expect(clickTime).toBeLessThan(200);
    });

    test('measures contrast mode switch responsiveness', async ({ page }) => {
      await page.goto('/');
      await waitForAppReady(page);

      const contrastModeSelect = page.locator('#contrast-mode');

      const startTime = Date.now();
      await contrastModeSelect.selectOption('manual');
      await page.waitForTimeout(50); // Allow for UI update
      const switchTime = Date.now() - startTime;

      console.log(`Contrast mode switch time: ${switchTime}ms`);
      expect(switchTime).toBeLessThan(200);
    });
  });

  test.describe('Bundle Size Analysis', () => {
    test('analyzes transferred resources', async ({ page }) => {
      const resources: { name: string; size: number; type: string }[] = [];

      page.on('response', async (response) => {
        const url = response.url();
        const headers = response.headers();
        const contentLength = parseInt(headers['content-length'] || '0', 10);
        const contentType = headers['content-type'] || 'unknown';

        if (url.includes('localhost') && contentLength > 0) {
          resources.push({
            name: url.split('/').pop() || url,
            size: contentLength,
            type: contentType.split(';')[0]
          });
        }
      });

      await page.goto('/');
      await waitForAppReady(page);

      // Wait for all resources to load
      await page.waitForLoadState('networkidle');

      // Calculate totals by type
      const byType: Record<string, number> = {};
      let totalSize = 0;

      resources.forEach((r) => {
        byType[r.type] = (byType[r.type] || 0) + r.size;
        totalSize += r.size;
      });

      console.log('\nBundle Size Analysis:');
      console.log(`Total transferred: ${(totalSize / 1024).toFixed(2)}KB`);
      console.log('\nBy type:');
      Object.entries(byType).forEach(([type, size]) => {
        console.log(`  - ${type}: ${(size / 1024).toFixed(2)}KB`);
      });

      // Total bundle should be reasonable (less than 500KB for a color generator)
      expect(totalSize).toBeLessThan(500 * 1024);
    });

    test('measures JavaScript bundle size', async ({ page }) => {
      let jsSize = 0;

      page.on('response', async (response) => {
        const url = response.url();
        const contentType = response.headers()['content-type'] || '';

        if (contentType.includes('javascript') && url.includes('localhost')) {
          try {
            const body = await response.body();
            jsSize += body.length;
          } catch {
            // Ignore errors for redirects etc.
          }
        }
      });

      await page.goto('/');
      await waitForAppReady(page);
      await page.waitForLoadState('networkidle');

      const jsSizeKB = jsSize / 1024;
      console.log(`JavaScript bundle size: ${jsSizeKB.toFixed(2)}KB`);

      // JS bundle should be reasonable (less than 350KB)
      // Note: Includes mathjs, culori, bezier-easing libraries for color calculations
      expect(jsSizeKB).toBeLessThan(350);
    });
  });

  test.describe('Performance Summary', () => {
    test('generates performance report', async ({ page }) => {
      await page.goto('/');
      await waitForAppReady(page);

      // Run a comprehensive test
      const results: Record<string, number> = {};

      // Initial load
      const loadStart = Date.now();
      await page.reload();
      await waitForAppReady(page);
      results['Initial Load'] = Date.now() - loadStart;

      // Color generation
      const genStart = Date.now();
      await page.locator('#baseColor').fill('#00ff00');
      await waitForColorGeneration(page);
      results['Color Generation'] = Date.now() - genStart;

      // Theme switch
      const themeStart = Date.now();
      await page.locator('.theme-toggle').click();
      await waitForColorGeneration(page);
      results['Theme Switch'] = Date.now() - themeStart;

      // Slider update
      const sliderStart = Date.now();
      await page.locator('#warmth').fill('5');
      await waitForColorGeneration(page);
      results['Slider Update'] = Date.now() - sliderStart;

      console.log('\n========== PERFORMANCE SUMMARY ==========');
      console.log('Metric                  | Time (ms) | Status');
      console.log('------------------------|-----------|--------');

      Object.entries(results).forEach(([name, time]) => {
        const threshold =
          name === 'Initial Load'
            ? THRESHOLDS.INITIAL_LOAD
            : name === 'Color Generation'
              ? THRESHOLDS.COLOR_GENERATION
              : name === 'Theme Switch'
                ? THRESHOLDS.THEME_SWITCH
                : THRESHOLDS.SLIDER_UPDATE;

        const status = time <= threshold ? '✓ PASS' : '✗ FAIL';
        const paddedName = name.padEnd(22);
        const paddedTime = String(time).padStart(9);
        console.log(`${paddedName} | ${paddedTime} | ${status}`);
      });

      console.log('==========================================\n');

      // All metrics should pass
      expect(results['Initial Load']).toBeLessThan(THRESHOLDS.INITIAL_LOAD);
      expect(results['Color Generation']).toBeLessThan(THRESHOLDS.COLOR_GENERATION);
      expect(results['Theme Switch']).toBeLessThan(THRESHOLDS.THEME_SWITCH);
      expect(results['Slider Update']).toBeLessThan(THRESHOLDS.SLIDER_UPDATE);
    });
  });
});
