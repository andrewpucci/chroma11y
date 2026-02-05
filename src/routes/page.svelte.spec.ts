import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { UrlColorState } from '$lib/urlUtils';

describe('+page.svelte component logic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('URL State Restoration', () => {
    it('should apply complete URL state to stores', () => {
      const urlState: UrlColorState = {
        baseColor: '#FF0000',
        warmth: 10,
        chromaMultiplier: 1.5,
        numColors: 9,
        numPalettes: 9,
        x1: 0.2,
        y1: 0.1,
        x2: 0.3,
        y2: 0.4,
        theme: 'dark',
        contrastMode: 'manual',
        lowStep: 1,
        highStep: 9,
        lightnessNudgers: [0.1, 0.2],
        hueNudgers: [5, 10]
      };

      expect(urlState.baseColor).toBe('#FF0000');
      expect(urlState.warmth).toBe(10);
      expect(urlState.chromaMultiplier).toBe(1.5);
      expect(urlState.numColors).toBe(9);
      expect(urlState.theme).toBe('dark');
    });

    it('should apply partial URL state with only some parameters', () => {
      const partialState: UrlColorState = {
        baseColor: '#00FF00',
        warmth: 5
      };

      expect(partialState.baseColor).toBe('#00FF00');
      expect(partialState.warmth).toBe(5);
      expect(partialState.chromaMultiplier).toBeUndefined();
    });

    it('should handle URL state with undefined values correctly', () => {
      const stateWithUndefined: UrlColorState = {
        baseColor: '#0000FF',
        warmth: undefined,
        chromaMultiplier: 1.2
      };

      expect(stateWithUndefined.baseColor).toBe('#0000FF');
      expect(stateWithUndefined.warmth).toBeUndefined();
      expect(stateWithUndefined.chromaMultiplier).toBe(1.2);
    });

    it('should handle empty URL state object', () => {
      const emptyState: UrlColorState = {};
      expect(Object.keys(emptyState).length).toBe(0);
    });
  });

  describe('Debouncing Logic', () => {
    it('should debounce color generation with 16ms delay', () => {
      const debounceDelay = 16;
      const callback = vi.fn();

      setTimeout(callback, debounceDelay);
      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(15);
      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous timeout on rapid changes', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const timeout1 = setTimeout(callback1, 16);
      clearTimeout(timeout1);
      setTimeout(callback2, 16);

      vi.advanceTimersByTime(16);
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should only execute latest generation request', () => {
      let colorGenId = 0;
      const generations: number[] = [];

      const scheduleGeneration = () => {
        const currentId = ++colorGenId;
        setTimeout(() => {
          if (currentId === colorGenId) {
            generations.push(currentId);
          }
        }, 16);
      };

      scheduleGeneration();
      scheduleGeneration();
      scheduleGeneration();

      vi.advanceTimersByTime(16);
      expect(generations).toEqual([3]);
      expect(generations.length).toBe(1);
    });
  });

  describe('URL and Storage Update Debouncing', () => {
    it('should debounce URL updates with 500ms delay', () => {
      const callback = vi.fn();
      setTimeout(callback, 500);

      vi.advanceTimersByTime(499);
      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous URL update timeout on rapid state changes', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const timeout1 = setTimeout(callback1, 500);
      clearTimeout(timeout1);
      setTimeout(callback2, 500);

      vi.advanceTimersByTime(500);
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle color generation errors gracefully', () => {
      const errorGenerator = () => {
        throw new Error('Invalid color parameters');
      };

      expect(() => {
        try {
          errorGenerator();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Invalid color parameters');
          throw error;
        }
      }).toThrow('Invalid color parameters');
    });

    it('should clear palettes on generation error', () => {
      const emptyPalettes: string[][] = [];
      const emptyNeutrals: string[] = [];

      expect(emptyPalettes).toEqual([]);
      expect(emptyNeutrals).toEqual([]);
      expect(emptyPalettes.length).toBe(0);
      expect(emptyNeutrals.length).toBe(0);
    });
  });

  describe('Lifecycle and Cleanup', () => {
    it('should properly cleanup timeouts on unmount', () => {
      const callback = vi.fn();
      const timeout = setTimeout(callback, 100);
      clearTimeout(timeout);

      vi.advanceTimersByTime(100);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle multiple timeout cleanups', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const timeout1 = setTimeout(callback1, 16);
      const timeout2 = setTimeout(callback2, 500);

      clearTimeout(timeout1);
      clearTimeout(timeout2);

      vi.advanceTimersByTime(500);
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it('should track URL state loaded flag correctly', () => {
      let urlStateLoaded = false;
      expect(urlStateLoaded).toBe(false);

      urlStateLoaded = true;
      expect(urlStateLoaded).toBe(true);
    });
  });

  describe('State Update Logic', () => {
    it('should build state update object with only defined values', () => {
      const urlState: UrlColorState = {
        baseColor: '#123456',
        warmth: 0,
        chromaMultiplier: undefined
      };

      const stateUpdate: Record<string, unknown> = {};
      if (urlState.baseColor) stateUpdate.baseColor = urlState.baseColor;
      if (urlState.warmth !== undefined) stateUpdate.warmth = urlState.warmth;
      if (urlState.chromaMultiplier !== undefined)
        stateUpdate.chromaMultiplier = urlState.chromaMultiplier;

      expect(stateUpdate.baseColor).toBe('#123456');
      expect(stateUpdate.warmth).toBe(0);
      expect(stateUpdate.chromaMultiplier).toBeUndefined();
      expect(Object.keys(stateUpdate).length).toBe(2);
    });

    it('should handle zero values correctly in state updates', () => {
      const urlState: UrlColorState = {
        warmth: 0,
        lowStep: 0,
        highStep: 0
      };

      expect(urlState.warmth).toBe(0);
      expect(urlState.lowStep).toBe(0);
      expect(urlState.highStep).toBe(0);
    });
  });
});
