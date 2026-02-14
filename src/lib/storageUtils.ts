/**
 * Local Storage Persistence Utilities
 * Saves and restores Chroma11y state to/from localStorage
 */

import type { SerializableColorState } from './types';

export type StoredColorState = SerializableColorState;

const STORAGE_KEY = 'chroma11y-state';

/**
 * Saves state to localStorage
 */
export function saveStateToStorage(state: StoredColorState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save state to localStorage:', error);
  }
}

/**
 * Loads state from localStorage
 */
export function loadStateFromStorage(): StoredColorState | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const state = JSON.parse(stored) as StoredColorState;

    // Validate the loaded state has expected shape
    if (typeof state !== 'object' || state === null) {
      return null;
    }

    return state;
  } catch (error) {
    console.warn('Failed to load state from localStorage:', error);
    return null;
  }
}

/**
 * Clears saved state from localStorage
 */
export function clearStoredState(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
  }
}
