/**
 * Design Token Unit Tests
 * Verifies CSS token file contains all required custom properties.
 * Note: Runtime token behavior is tested in E2E tests (design-tokens.spec.ts).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Design Tokens CSS File', () => {
  const tokensPath = join(__dirname, 'tokens.css');
  const tokensCSS = readFileSync(tokensPath, 'utf-8');

  describe('Typography Tokens', () => {
    it('defines all font size tokens', () => {
      expect(tokensCSS).toContain('--font-size-xs:');
      expect(tokensCSS).toContain('--font-size-sm:');
      expect(tokensCSS).toContain('--font-size-md:');
      expect(tokensCSS).toContain('--font-size-lg:');
      expect(tokensCSS).toContain('--font-size-xl:');
    });

    it('uses clamp() for fluid typography', () => {
      expect(tokensCSS).toContain('clamp(');
      expect(tokensCSS.match(/--font-size-\w+:\s*clamp\(/g)?.length).toBeGreaterThanOrEqual(5);
    });

    it('defines all font weight tokens', () => {
      expect(tokensCSS).toContain('--font-weight-normal: 400');
      expect(tokensCSS).toContain('--font-weight-medium: 500');
      expect(tokensCSS).toContain('--font-weight-semibold: 600');
      expect(tokensCSS).toContain('--font-weight-bold: 700');
    });

    it('defines line height tokens', () => {
      expect(tokensCSS).toContain('--line-height-tight: 1.2');
      expect(tokensCSS).toContain('--line-height-normal: 1.5');
      expect(tokensCSS).toContain('--line-height-relaxed: 1.75');
    });

    it('defines letter spacing tokens', () => {
      expect(tokensCSS).toContain('--letter-spacing-tight: -0.02em');
      expect(tokensCSS).toContain('--letter-spacing-normal: 0');
      expect(tokensCSS).toContain('--letter-spacing-wide: 0.025em');
    });
  });

  describe('Spacing Tokens', () => {
    it('defines all spacing tokens with t-shirt sizing', () => {
      expect(tokensCSS).toContain('--space-xs:');
      expect(tokensCSS).toContain('--space-sm:');
      expect(tokensCSS).toContain('--space-md:');
      expect(tokensCSS).toContain('--space-lg:');
      expect(tokensCSS).toContain('--space-xl:');
    });

    it('uses clamp() for fluid spacing', () => {
      expect(tokensCSS.match(/--space-\w+:\s*clamp\(/g)?.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Border Radius Tokens', () => {
    it('defines all radius tokens with t-shirt sizing', () => {
      expect(tokensCSS).toContain('--radius-xs:');
      expect(tokensCSS).toContain('--radius-sm:');
      expect(tokensCSS).toContain('--radius-md:');
      expect(tokensCSS).toContain('--radius-lg:');
      expect(tokensCSS).toContain('--radius-xl:');
      expect(tokensCSS).toContain('--radius-full: 100%');
    });

    it('uses clamp() for fluid radii', () => {
      expect(tokensCSS.match(/--radius-\w+:\s*clamp\(/g)?.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Animation Tokens', () => {
    it('defines duration tokens', () => {
      expect(tokensCSS).toContain('--duration-instant: 0ms');
      expect(tokensCSS).toContain('--duration-fast: 100ms');
      expect(tokensCSS).toContain('--duration-normal: 200ms');
      expect(tokensCSS).toContain('--duration-slow: 300ms');
    });

    it('defines easing tokens with cubic-bezier', () => {
      expect(tokensCSS).toContain('--ease-in: cubic-bezier');
      expect(tokensCSS).toContain('--ease-out: cubic-bezier');
      expect(tokensCSS).toContain('--ease-in-out: cubic-bezier');
      expect(tokensCSS).toContain('--ease-spring: cubic-bezier');
    });

    it('defines transition tokens', () => {
      expect(tokensCSS).toContain('--transition-fast:');
      expect(tokensCSS).toContain('--transition-normal:');
      expect(tokensCSS).toContain('--transition-slow:');
    });

    it('includes prefers-reduced-motion media query', () => {
      expect(tokensCSS).toContain('@media (prefers-reduced-motion: reduce)');
      expect(tokensCSS).toContain('--duration-fast: 0ms');
      expect(tokensCSS).toContain('--duration-normal: 0ms');
      expect(tokensCSS).toContain('--duration-slow: 0ms');
    });
  });

  describe('Touch Target Tokens', () => {
    it('defines WCAG 2.2 AA minimum (24px)', () => {
      expect(tokensCSS).toContain('--touch-target-min: 24px');
    });

    it('defines comfortable target (44px)', () => {
      expect(tokensCSS).toContain('--touch-target-comfortable: 44px');
    });
  });

  describe('File Structure', () => {
    it('uses :root selector for token definitions', () => {
      expect(tokensCSS).toContain(':root {');
    });

    it('includes documentation comments', () => {
      expect(tokensCSS).toContain('/**');
      expect(tokensCSS).toContain('Typography Tokens');
      expect(tokensCSS).toContain('Spacing Tokens');
      expect(tokensCSS).toContain('Border Radius Tokens');
      expect(tokensCSS).toContain('Animation/Transition Tokens');
      expect(tokensCSS).toContain('Touch Target Tokens');
    });
  });
});
