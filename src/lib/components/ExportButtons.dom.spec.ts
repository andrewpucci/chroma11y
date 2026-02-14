import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/exportUtils', () => ({
  downloadDesignTokens: vi.fn(),
  downloadCSS: vi.fn(),
  downloadSCSS: vi.fn()
}));

vi.mock('$lib/announce', () => ({
  announce: vi.fn()
}));

import ExportButtons from '$lib/components/ExportButtons.svelte';
import { downloadDesignTokens, downloadCSS, downloadSCSS } from '$lib/exportUtils';
import { announce } from '$lib/announce';

describe('ExportButtons', () => {
  it('disables export actions when there are no colors', () => {
    render(ExportButtons, { props: { neutrals: [], palettes: [] } });

    expect(screen.getByRole('button', { name: /export json design tokens/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /export css custom properties/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /export scss variables/i })).toBeDisabled();
  });

  it('exports JSON/CSS/SCSS using the provided color data', async () => {
    const user = userEvent.setup();

    const neutrals = ['#ffffff'];
    const palettes = [['#e6f0ff']];
    const displayNeutrals = ['#ffffff'];
    const displayPalettes = [['#e6f0ff']];

    render(ExportButtons, {
      props: { neutrals, palettes, displayNeutrals, displayPalettes }
    });

    await user.click(screen.getByRole('button', { name: /export json design tokens/i }));
    expect(downloadDesignTokens).toHaveBeenCalledWith(neutrals, palettes);
    expect(announce).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /export css custom properties/i }));
    expect(downloadCSS).toHaveBeenCalledWith(neutrals, palettes, displayNeutrals, displayPalettes);

    await user.click(screen.getByRole('button', { name: /export scss variables/i }));
    expect(downloadSCSS).toHaveBeenCalledWith(neutrals, palettes, displayNeutrals, displayPalettes);
  });
});
