import { writable } from 'svelte/store';

export interface GettingStartedDialogState {
  open: boolean;
  opener: HTMLElement | null;
}

export const gettingStartedDialog = writable<GettingStartedDialogState>({
  open: false,
  opener: null
});

/**
 * Opens the Getting Started guide and records the element that should receive
 * focus when the dialog closes.
 *
 * @param opener Element that triggered the dialog.
 */
export function openGettingStartedGuide(opener: HTMLElement | null = null): void {
  gettingStartedDialog.set({
    open: true,
    opener
  });
}

/**
 * Closes the Getting Started guide.
 */
export function closeGettingStartedGuide(): void {
  gettingStartedDialog.set({
    open: false,
    opener: null
  });
}
