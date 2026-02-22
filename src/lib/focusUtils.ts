/**
 * Global focus management utilities
 * Tracks keyboard vs mouse interaction for focus-visible behavior across components
 */

let globalListenersAttached = false;
let lastInteractionWasKeyboard = false;
const focusVisibleCallbacks = new Set<(visible: boolean) => void>();

// Store handler references for proper cleanup
let handleKeyDown: ((e: KeyboardEvent) => void) | null = null;
let handleMouseDown: (() => void) | null = null;

/**
 * Register a callback to be notified when focus-visible state changes
 */
export function registerFocusVisibleCallback(callback: (visible: boolean) => void) {
  focusVisibleCallbacks.add(callback);
  return () => focusVisibleCallbacks.delete(callback);
}

/**
 * Get the current focus-visible state
 */
export function getLastInteractionWasKeyboard(): boolean {
  return lastInteractionWasKeyboard;
}

/**
 * Initialize global document listeners (called once per app)
 */
export function initializeGlobalFocusListeners(): void {
  if (globalListenersAttached) return;

  handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      lastInteractionWasKeyboard = true;
      // Notify all callbacks that keyboard interaction is happening
      focusVisibleCallbacks.forEach((callback) => callback(true));
    }
  };

  handleMouseDown = () => {
    lastInteractionWasKeyboard = false;
    // Notify all callbacks that mouse interaction is happening
    focusVisibleCallbacks.forEach((callback) => callback(false));
  };

  document.addEventListener('keydown', handleKeyDown, true);
  document.addEventListener('mousedown', handleMouseDown, true);
  globalListenersAttached = true;
}

/**
 * Cleanup global listeners (for testing or app teardown)
 */
export function cleanupGlobalFocusListeners(): void {
  if (!globalListenersAttached) return;

  if (handleKeyDown) {
    document.removeEventListener('keydown', handleKeyDown, true);
    handleKeyDown = null;
  }
  if (handleMouseDown) {
    document.removeEventListener('mousedown', handleMouseDown, true);
    handleMouseDown = null;
  }
  globalListenersAttached = false;
  focusVisibleCallbacks.clear();
}
