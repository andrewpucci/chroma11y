import { writable, derived } from 'svelte/store';
import type Color from 'colorjs.io';

/**
 * Data passed to the drawer when opening it for a specific swatch
 */
export interface DrawerColorData {
  /** The hex color string */
  hex: string;
  /** The rendered swatch value string, if available */
  displayValue?: string;
  /** The OKLCH color object (source of truth) */
  oklch: Color;
  /** Step label, e.g. "50" */
  step: string;
  /** Name of the palette this swatch belongs to */
  paletteName: string;
  /** Whether this is a neutral palette swatch */
  isNeutral: boolean;
}

interface DrawerState {
  isOpen: boolean;
  data: DrawerColorData | null;
}

const store = writable<DrawerState>({
  isOpen: false,
  data: null
});

/**
 * Opens the drawer with the given color data.
 * If already open, swaps content in-place.
 */
export function openDrawer(data: DrawerColorData): void {
  store.set({ isOpen: true, data });
}

/**
 * Closes the drawer
 */
export function closeDrawer(): void {
  store.set({ isOpen: false, data: null });
}

/** Whether the drawer is currently open */
export const drawerIsOpen = derived(store, ($s) => $s.isOpen);

/** The current drawer color data (null when closed) */
export const drawerData = derived(store, ($s) => $s.data);
