import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/colorUtils', async (importOriginal) => {
  const actual = (await importOriginal()) as object;
  return {
    ...actual,
    copyToClipboard: vi.fn()
  };
});

vi.mock('$lib/announce', () => ({
  announce: vi.fn()
}));

import ExportPreviewDialog from '$lib/components/ExportPreviewDialog.svelte';
import { copyToClipboard } from '$lib/colorUtils';
import { announce } from '$lib/announce';
import { closeExportPreview, openExportPreview } from '$lib/help/exportPreviewStore';

const sampleProps = {
  neutrals: ['#ffffff', '#000000'],
  palettes: [
    ['#e6f0ff', '#1a75ff'],
    ['#ffe6f0', '#ff1a75']
  ],
  lowContrastColor: '#ffffff',
  displayNeutrals: ['#ffffff', '#000000'],
  displayPalettes: [
    ['#e6f0ff', '#1a75ff'],
    ['#ffe6f0', '#ff1a75']
  ]
};

describe('ExportPreviewDialog', () => {
  beforeEach(() => {
    closeExportPreview();
    vi.clearAllMocks();
  });

  afterEach(() => {
    closeExportPreview();
  });

  it('does not render when closed', () => {
    render(ExportPreviewDialog, sampleProps);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the requested initial format and shows preview content', async () => {
    render(ExportPreviewDialog, sampleProps);
    openExportPreview('all', 'css');
    await Promise.resolve();

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    const cssTab = screen.getByRole('tab', { name: 'CSS' });
    expect(cssTab).toHaveAttribute('aria-selected', 'true');

    const preview = screen.getByTestId('export-preview-content');
    expect(preview.textContent).toContain(':root');
    expect(preview.textContent).toContain('--color-');
  });

  it('switches between format tabs and updates the preview', async () => {
    const user = userEvent.setup();
    render(ExportPreviewDialog, sampleProps);
    openExportPreview('all', 'list');
    await Promise.resolve();

    await screen.findByRole('dialog');
    expect(screen.getByTestId('export-preview-content').textContent).not.toContain(':root');

    await user.click(screen.getByRole('tab', { name: 'JSON' }));
    expect(screen.getByTestId('export-preview-content').textContent).toContain('"$type": "color"');

    await user.click(screen.getByRole('tab', { name: 'SCSS' }));
    expect(screen.getByTestId('export-preview-content').textContent).toContain('$color-');
  });

  it('copies the active preview to the clipboard with announcement', async () => {
    const user = userEvent.setup();
    render(ExportPreviewDialog, sampleProps);
    openExportPreview('all', 'list');
    await Promise.resolve();

    await screen.findByRole('dialog');

    await user.click(screen.getByRole('button', { name: /copy list to clipboard/i }));
    expect(copyToClipboard).toHaveBeenCalledTimes(1);
    const copied = (copyToClipboard as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(copied).toContain('#ffffff');
    expect(announce).toHaveBeenCalledWith('Copied List export to clipboard');
  });

  it('scopes content to a single palette when scope is a paletteIndex', async () => {
    render(ExportPreviewDialog, sampleProps);
    openExportPreview({ paletteIndex: 1 }, 'list');
    await Promise.resolve();

    await screen.findByRole('dialog');
    const content = screen.getByTestId('export-preview-content').textContent ?? '';
    expect(content).toContain('#ffe6f0');
    expect(content).not.toContain('#e6f0ff');
    expect(content).not.toContain('#ffffff');
  });

  it('falls back to palette hex for a single-palette scope when displayPalettes is absent', async () => {
    // No displayPalettes provided: single-palette scope should still render the hex,
    // consistent with the "all" scope's hex fallback.
    const propsWithoutDisplay = { ...sampleProps, displayPalettes: undefined };
    render(ExportPreviewDialog, propsWithoutDisplay);
    openExportPreview({ paletteIndex: 1 }, 'css');
    await Promise.resolve();

    await screen.findByRole('dialog');
    const content = screen.getByTestId('export-preview-content').textContent ?? '';
    expect(content).toContain('#ffe6f0');
    expect(content).toContain('#ff1a75');
  });

  it('scopes content to neutrals only when scope is "neutral"', async () => {
    render(ExportPreviewDialog, sampleProps);
    openExportPreview('neutral', 'list');
    await Promise.resolve();

    await screen.findByRole('dialog');
    const content = screen.getByTestId('export-preview-content').textContent ?? '';
    expect(content).toContain('#ffffff');
    expect(content).toContain('#000000');
    expect(content).not.toContain('#e6f0ff');
  });

  it('closes via Escape and restores focus to opener', async () => {
    const user = userEvent.setup();
    const opener = document.createElement('button');
    opener.textContent = 'Open';
    document.body.appendChild(opener);
    opener.focus();

    render(ExportPreviewDialog, sampleProps);
    openExportPreview('all', 'list', opener);
    await Promise.resolve();

    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();

    opener.remove();
  });
});
