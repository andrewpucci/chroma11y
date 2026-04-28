import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/exportUtils', async (importOriginal) => {
  const actual = (await importOriginal()) as object;
  return {
    ...actual,
    downloadDesignTokens: vi.fn(),
    downloadCSS: vi.fn(),
    downloadSCSS: vi.fn()
  };
});

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

import ExportButtons from '$lib/components/ExportButtons.svelte';
import { copyToClipboard } from '$lib/colorUtils';
import { downloadDesignTokens, downloadCSS, downloadSCSS } from '$lib/exportUtils';
import { announce } from '$lib/announce';
import { closeExportPreview, exportPreviewDialog } from '$lib/help/exportPreviewStore';
import { get } from 'svelte/store';

const sampleProps = {
  neutrals: ['#ffffff'],
  palettes: [['#e6f0ff']],
  lowContrastColor: '#ffffff',
  displayNeutrals: ['oklch(94.772434% 0.048057 208.654439)'],
  displayPalettes: [['oklch(72.618719% 0.112904 251.168672)']],
  customNeutralName: 'Canvas',
  customPaletteNames: ['Ocean']
};

describe('ExportButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disables export actions when there are no colors', () => {
    render(ExportButtons, { props: { neutrals: [], palettes: [] } });

    expect(screen.getByRole('button', { name: /explain export format/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export json design tokens/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /export css custom properties/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /export scss variables/i })).toBeDisabled();
  });

  it('downloads JSON/CSS/SCSS via the primary action click', async () => {
    const user = userEvent.setup();
    render(ExportButtons, { props: sampleProps });

    await user.click(screen.getByRole('button', { name: /export json design tokens/i }));
    expect(downloadDesignTokens).toHaveBeenCalledWith(sampleProps.neutrals, sampleProps.palettes, {
      lowContrastColor: sampleProps.lowContrastColor,
      customNeutralName: sampleProps.customNeutralName,
      customPaletteNames: sampleProps.customPaletteNames
    });
    expect(announce).toHaveBeenCalledWith('Downloaded JSON design tokens');

    await user.click(screen.getByRole('button', { name: /export css custom properties/i }));
    expect(downloadCSS).toHaveBeenCalledWith(
      sampleProps.neutrals,
      sampleProps.palettes,
      {
        lowContrastColor: sampleProps.lowContrastColor,
        customNeutralName: sampleProps.customNeutralName,
        customPaletteNames: sampleProps.customPaletteNames
      },
      sampleProps.displayNeutrals,
      sampleProps.displayPalettes
    );

    await user.click(screen.getByRole('button', { name: /export scss variables/i }));
    expect(downloadSCSS).toHaveBeenCalledWith(
      sampleProps.neutrals,
      sampleProps.palettes,
      {
        lowContrastColor: sampleProps.lowContrastColor,
        customNeutralName: sampleProps.customNeutralName,
        customPaletteNames: sampleProps.customPaletteNames
      },
      sampleProps.displayNeutrals,
      sampleProps.displayPalettes
    );
  });

  it('opens the export preview dialog with the matching format from the chevron menu', async () => {
    closeExportPreview();
    const user = userEvent.setup();
    render(ExportButtons, { props: sampleProps });

    await user.click(
      screen.getByRole('button', { name: /more options for css custom properties/i })
    );
    await user.click(screen.getByRole('menuitem', { name: /preview/i }));

    const state = get(exportPreviewDialog);
    expect(state.open).toBe(true);
    expect(state.scope).toBe('all');
    expect(state.initialFormat).toBe('css');

    closeExportPreview();
  });

  it('copies the matching format directly from the chevron menu', async () => {
    const user = userEvent.setup();
    render(ExportButtons, { props: sampleProps });

    await user.click(screen.getByRole('button', { name: /more options for json design tokens/i }));
    await user.click(screen.getByRole('menuitem', { name: 'Copy' }));

    expect(copyToClipboard).toHaveBeenCalledTimes(1);
    const copied = (copyToClipboard as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(copied).toContain('"$type": "color"');
    expect(announce).toHaveBeenCalledWith('Copied JSON design tokens to clipboard');
  });

  it('shows share button, copies current URL, and provides copy feedback', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    window.history.replaceState({}, '', '/?baseColor=%235EF784&themePreference=dark');

    render(ExportButtons);

    await user.click(screen.getByRole('button', { name: /copy shareable url to clipboard/i }));

    expect(copyToClipboard).toHaveBeenCalledWith(window.location.href);
    expect(announce).toHaveBeenCalledWith('Copied shareable URL to clipboard');
    expect(screen.getByText('Copied URL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /url copied to clipboard/i })).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(2000);
    await tick();

    expect(screen.getByText('Share URL')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /copy shareable url to clipboard/i })
    ).toBeInTheDocument();
    vi.useRealTimers();
  });
});
