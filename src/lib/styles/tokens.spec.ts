/**
 * Design Token Unit Tests
 * Verifies CSS custom properties are defined correctly,
 * token values compute to expected ranges, and relationships are maintained.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Design Tokens', () => {
  let testElement: HTMLDivElement;

  beforeEach(() => {
    // Create a test element attached to the document
    testElement = document.createElement('div');
    document.body.appendChild(testElement);
  });

  afterEach(() => {
    document.body.removeChild(testElement);
  });

  describe('Typography Tokens', () => {
    it('defines all font size tokens', () => {
      const styles = getComputedStyle(document.documentElement);

      expect(styles.getPropertyValue('--font-size-xs')).toBeTruthy();
      expect(styles.getPropertyValue('--font-size-sm')).toBeTruthy();
      expect(styles.getPropertyValue('--font-size-md')).toBeTruthy();
      expect(styles.getPropertyValue('--font-size-lg')).toBeTruthy();
      expect(styles.getPropertyValue('--font-size-xl')).toBeTruthy();
    });

    it('defines all font weight tokens', () => {
      const styles = getComputedStyle(document.documentElement);

      expect(styles.getPropertyValue('--font-weight-normal')).toBe('400');
      expect(styles.getPropertyValue('--font-weight-medium')).toBe('500');
      expect(styles.getPropertyValue('--font-weight-semibold')).toBe('600');
      expect(styles.getPropertyValue('--font-weight-bold')).toBe('700');
    });

    it('defines line height tokens', () => {
      const styles = getComputedStyle(document.documentElement);

      expect(styles.getPropertyValue('--line-height-tight')).toBe('1.2');
      expect(styles.getPropertyValue('--line-height-normal')).toBe('1.5');
      expect(styles.getPropertyValue('--line-height-relaxed')).toBe('1.75');
    });

    it('defines letter spacing tokens', () => {
      const styles = getComputedStyle(document.documentElement);

      expect(styles.getPropertyValue('--letter-spacing-tight')).toBe('-0.02em');
      expect(styles.getPropertyValue('--letter-spacing-normal')).toBe('0');
      expect(styles.getPropertyValue('--letter-spacing-wide')).toBe('0.025em');
    });
  });

  describe('Spacing Tokens', () => {
    it('defines all spacing tokens', () => {
      const styles = getComputedStyle(document.documentElement);

      expect(styles.getPropertyValue('--space-xs')).toBeTruthy();
      expect(styles.getPropertyValue('--space-sm')).toBeTruthy();
      expect(styles.getPropertyValue('--space-md')).toBeTruthy();
      expect(styles.getPropertyValue('--space-lg')).toBeTruthy();
      expect(styles.getPropertyValue('--space-xl')).toBeTruthy();
    });

    it('maintains proportional relationships (xs < sm < md < lg < xl)', () => {
      const styles = getComputedStyle(document.documentElement);

      const xs = parseFloat(styles.getPropertyValue('--space-xs'));
      const sm = parseFloat(styles.getPropertyValue('--space-sm'));
      const md = parseFloat(styles.getPropertyValue('--space-md'));
      const lg = parseFloat(styles.getPropertyValue('--space-lg'));
      const xl = parseFloat(styles.getPropertyValue('--space-xl'));

      expect(sm).toBeGreaterThan(xs);
      expect(md).toBeGreaterThan(sm);
      expect(lg).toBeGreaterThan(md);
      expect(xl).toBeGreaterThan(lg);
    });

    it('computes to expected pixel ranges', () => {
      const styles = getComputedStyle(document.documentElement);

      const xs = parseFloat(styles.getPropertyValue('--space-xs'));
      const sm = parseFloat(styles.getPropertyValue('--space-sm'));
      const md = parseFloat(styles.getPropertyValue('--space-md'));
      const lg = parseFloat(styles.getPropertyValue('--space-lg'));
      const xl = parseFloat(styles.getPropertyValue('--space-xl'));

      // Based on clamp() definitions, check reasonable ranges
      expect(xs).toBeGreaterThanOrEqual(4); // 0.25rem min
      expect(xs).toBeLessThanOrEqual(5); // 0.3125rem max

      expect(sm).toBeGreaterThanOrEqual(8); // 0.5rem min
      expect(sm).toBeLessThanOrEqual(10); // 0.625rem max

      expect(md).toBeGreaterThanOrEqual(12); // 0.75rem min
      expect(md).toBeLessThanOrEqual(16); // 1rem max

      expect(lg).toBeGreaterThanOrEqual(16); // 1rem min
      expect(lg).toBeLessThanOrEqual(22); // 1.375rem max

      expect(xl).toBeGreaterThanOrEqual(24); // 1.5rem min
      expect(xl).toBeLessThanOrEqual(36); // 2.25rem max
    });
  });

  describe('Border Radius Tokens', () => {
    it('defines all radius tokens', () => {
      const styles = getComputedStyle(document.documentElement);

      expect(styles.getPropertyValue('--radius-xs')).toBeTruthy();
      expect(styles.getPropertyValue('--radius-sm')).toBeTruthy();
      expect(styles.getPropertyValue('--radius-md')).toBeTruthy();
      expect(styles.getPropertyValue('--radius-lg')).toBeTruthy();
      expect(styles.getPropertyValue('--radius-xl')).toBeTruthy();
      expect(styles.getPropertyValue('--radius-full')).toBe('100%');
    });

    it('maintains proportional relationships (xs < sm < md < lg < xl)', () => {
      const styles = getComputedStyle(document.documentElement);

      const xs = parseFloat(styles.getPropertyValue('--radius-xs'));
      const sm = parseFloat(styles.getPropertyValue('--radius-sm'));
      const md = parseFloat(styles.getPropertyValue('--radius-md'));
      const lg = parseFloat(styles.getPropertyValue('--radius-lg'));
      const xl = parseFloat(styles.getPropertyValue('--radius-xl'));

      expect(sm).toBeGreaterThan(xs);
      expect(md).toBeGreaterThan(sm);
      expect(lg).toBeGreaterThan(md);
      expect(xl).toBeGreaterThan(lg);
    });
  });

  describe('Animation Tokens', () => {
    it('defines duration tokens', () => {
      const styles = getComputedStyle(document.documentElement);

      expect(styles.getPropertyValue('--duration-instant')).toBe('0ms');
      expect(styles.getPropertyValue('--duration-fast')).toBeTruthy();
      expect(styles.getPropertyValue('--duration-normal')).toBeTruthy();
      expect(styles.getPropertyValue('--duration-slow')).toBeTruthy();
    });

    it('defines easing tokens', () => {
      const styles = getComputedStyle(document.documentElement);

      expect(styles.getPropertyValue('--ease-in')).toContain('cubic-bezier');
      expect(styles.getPropertyValue('--ease-out')).toContain('cubic-bezier');
      expect(styles.getPropertyValue('--ease-in-out')).toContain('cubic-bezier');
      expect(styles.getPropertyValue('--ease-spring')).toContain('cubic-bezier');
    });

    it('defines transition tokens', () => {
      const styles = getComputedStyle(document.documentElement);

      expect(styles.getPropertyValue('--transition-fast')).toBeTruthy();
      expect(styles.getPropertyValue('--transition-normal')).toBeTruthy();
      expect(styles.getPropertyValue('--transition-slow')).toBeTruthy();
    });
  });

  describe('Touch Target Tokens', () => {
    it('defines WCAG 2.2 AA minimum (24px)', () => {
      const styles = getComputedStyle(document.documentElement);

      expect(styles.getPropertyValue('--touch-target-min')).toBe('24px');
    });

    it('defines comfortable target (44px)', () => {
      const styles = getComputedStyle(document.documentElement);

      expect(styles.getPropertyValue('--touch-target-comfortable')).toBe('44px');
    });
  });

  describe('T-shirt Size Visual Consistency', () => {
    it('spacing and radius tokens use similar scales', () => {
      const styles = getComputedStyle(document.documentElement);

      const spaceXs = parseFloat(styles.getPropertyValue('--space-xs'));
      const radiusXs = parseFloat(styles.getPropertyValue('--radius-xs'));

      const spaceSm = parseFloat(styles.getPropertyValue('--space-sm'));
      const radiusSm = parseFloat(styles.getPropertyValue('--radius-sm'));

      const spaceMd = parseFloat(styles.getPropertyValue('--space-md'));
      const radiusMd = parseFloat(styles.getPropertyValue('--radius-md'));

      // Spacing and radius should be visually consistent (within ~20% tolerance)
      expect(Math.abs(spaceXs - radiusXs)).toBeLessThan(spaceXs * 0.2);
      expect(Math.abs(spaceSm - radiusSm)).toBeLessThan(spaceSm * 0.2);
      expect(Math.abs(spaceMd - radiusMd)).toBeLessThan(spaceMd * 0.2);
    });
  });
});
