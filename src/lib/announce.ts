/**
 * Screen reader announcement utility
 * Dispatches a custom event that is picked up by the global aria-live region
 */

export function announce(message: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:announce', { detail: message }));
  }
}
