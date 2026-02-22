/**
 * Focus utilities tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  registerFocusVisibleCallback,
  getLastInteractionWasKeyboard,
  initializeGlobalFocusListeners,
  cleanupGlobalFocusListeners
} from './focusUtils';

describe('focusUtils', () => {
  beforeEach(() => {
    cleanupGlobalFocusListeners();
  });

  afterEach(() => {
    cleanupGlobalFocusListeners();
  });

  describe('getLastInteractionWasKeyboard', () => {
    it('returns false by default', () => {
      expect.assertions(1);
      expect(getLastInteractionWasKeyboard()).toBe(false);
    });
  });

  describe('registerFocusVisibleCallback', () => {
    it('returns an unsubscribe function', () => {
      expect.assertions(1);
      const callback = vi.fn();
      const unsubscribe = registerFocusVisibleCallback(callback);
      expect(typeof unsubscribe).toBe('function');
    });

    it('callback is called on Tab keydown', () => {
      expect.assertions(2);
      const callback = vi.fn();
      registerFocusVisibleCallback(callback);
      initializeGlobalFocusListeners();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(true);
    });

    it('callback is called on mousedown', () => {
      expect.assertions(2);
      const callback = vi.fn();
      registerFocusVisibleCallback(callback);
      initializeGlobalFocusListeners();

      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(false);
    });

    it('unsubscribe removes callback', () => {
      expect.assertions(1);
      const callback = vi.fn();
      const unsubscribe = registerFocusVisibleCallback(callback);
      initializeGlobalFocusListeners();

      unsubscribe();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('initializeGlobalFocusListeners', () => {
    it('sets lastInteractionWasKeyboard to true on Tab', () => {
      expect.assertions(1);
      initializeGlobalFocusListeners();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

      expect(getLastInteractionWasKeyboard()).toBe(true);
    });

    it('sets lastInteractionWasKeyboard to false on mousedown', () => {
      expect.assertions(1);
      initializeGlobalFocusListeners();

      // First set to true via Tab
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      // Then set to false via mousedown
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      expect(getLastInteractionWasKeyboard()).toBe(false);
    });

    it('does not respond to non-Tab keys', () => {
      expect.assertions(1);
      const callback = vi.fn();
      registerFocusVisibleCallback(callback);
      initializeGlobalFocusListeners();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(callback).not.toHaveBeenCalled();
    });

    it('only attaches listeners once', () => {
      expect.assertions(1);
      const callback = vi.fn();
      registerFocusVisibleCallback(callback);

      initializeGlobalFocusListeners();
      initializeGlobalFocusListeners();
      initializeGlobalFocusListeners();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanupGlobalFocusListeners', () => {
    it('removes event listeners', () => {
      expect.assertions(1);
      const callback = vi.fn();
      registerFocusVisibleCallback(callback);
      initializeGlobalFocusListeners();

      cleanupGlobalFocusListeners();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

      expect(callback).not.toHaveBeenCalled();
    });

    it('clears all callbacks', () => {
      expect.assertions(1);
      const callback = vi.fn();
      registerFocusVisibleCallback(callback);
      initializeGlobalFocusListeners();

      cleanupGlobalFocusListeners();
      initializeGlobalFocusListeners();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

      expect(callback).not.toHaveBeenCalled();
    });

    it('does nothing if not initialized', () => {
      expect.assertions(1);
      // Should not throw
      cleanupGlobalFocusListeners();
      expect(true).toBe(true);
    });
  });
});
