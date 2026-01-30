/**
 * Local Storage Persistence Utilities
 * Saves and restores color generator state to/from localStorage
 */

const STORAGE_KEY = 'svelte-color-generator-state';

export interface StoredColorState {
  baseColor?: string;
  warmth?: number;
  chromaMultiplier?: number;
  numColors?: number;
  numPalettes?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  theme?: 'light' | 'dark';
  contrastMode?: 'auto' | 'manual';
  lowStep?: number;
  highStep?: number;
  lightnessNudgers?: number[];
  hueNudgers?: number[];
}

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

/**
 * Checks if localStorage is available
 */
export function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}
