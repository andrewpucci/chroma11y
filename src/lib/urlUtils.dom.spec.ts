/**
 * URL Utilities DOM Tests
 * Tests for browser-dependent functions (updateBrowserUrl, getUrlState)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { updateBrowserUrl, getUrlState } from './urlUtils';

describe('urlUtils DOM', () => {
  let replaceStateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('updateBrowserUrl', () => {
    it('updates URL with encoded state', () => {
      expect.assertions(2);

      updateBrowserUrl({ baseColor: '#ff0000', warmth: 5 });

      expect(replaceStateSpy).toHaveBeenCalledTimes(1);
      const newUrl = replaceStateSpy.mock.calls[0][2] as string;
      expect(newUrl).toContain('c=ff0000');
    });

    it('uses pathname when state is empty', () => {
      expect.assertions(2);

      updateBrowserUrl({});

      expect(replaceStateSpy).toHaveBeenCalledTimes(1);
      const newUrl = replaceStateSpy.mock.calls[0][2] as string;
      expect(newUrl).toBe(window.location.pathname);
    });

    it('includes query string prefix', () => {
      expect.assertions(1);

      updateBrowserUrl({ warmth: 10 });

      const newUrl = replaceStateSpy.mock.calls[0][2] as string;
      expect(newUrl).toMatch(/^\?/);
    });
  });

  describe('getUrlState', () => {
    it('returns empty object when no query params', () => {
      expect.assertions(1);

      // Mock location.search to be empty
      Object.defineProperty(window, 'location', {
        value: { ...window.location, search: '' },
        writable: true
      });

      const state = getUrlState();
      expect(state).toEqual({});
    });

    it('decodes state from URL query params', () => {
      expect.assertions(2);

      Object.defineProperty(window, 'location', {
        value: { ...window.location, search: '?c=ff0000&w=5' },
        writable: true
      });

      const state = getUrlState();
      expect(state.baseColor).toBe('#ff0000');
      expect(state.warmth).toBe(5);
    });
  });
});
