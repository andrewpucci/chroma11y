import { writable } from 'svelte/store';

export type ExportFormat = 'list' | 'json' | 'css' | 'scss';

export type ExportScope = 'all' | 'neutral' | { paletteIndex: number };

export interface ExportPreviewData {
  neutrals: string[];
  palettes: string[][];
  lowContrastColor?: string;
  displayNeutrals?: string[];
  displayPalettes?: string[][];
  customNeutralName?: string;
  customPaletteNames?: string[];
}

export interface ExportPreviewState {
  open: boolean;
  opener: HTMLElement | null;
  scope: ExportScope;
  initialFormat: ExportFormat;
  dataOverride: ExportPreviewData | null;
}

const INITIAL_STATE: ExportPreviewState = {
  open: false,
  opener: null,
  scope: 'all',
  initialFormat: 'list',
  dataOverride: null
};

export const exportPreviewDialog = writable<ExportPreviewState>({ ...INITIAL_STATE });

export function openExportPreview(
  scope: ExportScope,
  initialFormat: ExportFormat,
  opener: HTMLElement | null = null,
  dataOverride: ExportPreviewData | null = null
): void {
  exportPreviewDialog.set({
    open: true,
    opener,
    scope,
    initialFormat,
    dataOverride
  });
}

export function closeExportPreview(): void {
  exportPreviewDialog.set({ ...INITIAL_STATE });
}
