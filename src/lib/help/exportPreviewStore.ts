import { writable } from 'svelte/store';

export type ExportFormat = 'list' | 'json' | 'css' | 'scss';

export type ExportScope = 'all' | 'neutral' | { paletteIndex: number };

export interface ExportPreviewState {
  open: boolean;
  opener: HTMLElement | null;
  scope: ExportScope;
  initialFormat: ExportFormat;
}

const INITIAL_STATE: ExportPreviewState = {
  open: false,
  opener: null,
  scope: 'all',
  initialFormat: 'list'
};

export const exportPreviewDialog = writable<ExportPreviewState>({ ...INITIAL_STATE });

export function openExportPreview(
  scope: ExportScope,
  initialFormat: ExportFormat,
  opener: HTMLElement | null = null
): void {
  exportPreviewDialog.set({
    open: true,
    opener,
    scope,
    initialFormat
  });
}

export function closeExportPreview(): void {
  exportPreviewDialog.set({ ...INITIAL_STATE });
}
