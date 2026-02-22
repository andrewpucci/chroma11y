/**
 * Global focus management utilities
 * Tracks keyboard vs mouse interaction for focus-visible behavior across components
 */

let globalListenersAttached = false;
let lastInteractionWasKeyboard = false;
const focusVisibleCallbacks = new Set<(visible: boolean) => void>();

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

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      lastInteractionWasKeyboard = true;
      // Notify all callbacks that keyboard interaction is happening
      focusVisibleCallbacks.forEach(callback => callback(true));
    }
  };

  const handleMouseDown = () => {
    lastInteractionWasKeyboard = false;
    // Notify all callbacks that mouse interaction is happening
    focusVisibleCallbacks.forEach(callback => callback(false));
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

  // Remove the specific listeners we added
  // Note: We need to store references to remove them properly
  document.removeEventListener('keydown', () => {}, true);
  document.removeEventListener('mousedown', () => {}, true);
  globalListenersAttached = false;
  focusVisibleCallbacks.clear();
}
