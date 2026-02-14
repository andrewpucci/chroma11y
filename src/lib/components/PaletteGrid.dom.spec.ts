import { render, screen, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it } from 'vitest';

import PaletteGrid from '$lib/components/PaletteGrid.svelte';
import { hueNudgers, resetColorState } from '$lib/stores';

describe('PaletteGrid', () => {
  beforeEach(() => {
    resetColorState('light');
  });

  it('shows an empty state when no palettes are provided', () => {
    render(PaletteGrid, { props: { palettesHex: [], hueNudgerValues: [] } });

    expect(screen.getByText(/no color palettes generated yet/i)).toBeInTheDocument();
  });

  it('renders a heading for each palette', () => {
    const palettesHex = [
      ['#e6f0ff', '#0066ff'],
      ['#ffe6f0', '#ff0066']
    ];

    render(PaletteGrid, { props: { palettesHex, hueNudgerValues: [0, 0] } });

    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings).toHaveLength(palettesHex.length);
    for (const h of headings) {
      expect((h.textContent || '').trim().length).toBeGreaterThan(0);
    }
  });

  it('clamps hue nudger values and writes them to the store', async () => {
    const palettesHex = [['#e6f0ff', '#0066ff']];

    render(PaletteGrid, { props: { palettesHex, hueNudgerValues: [0] } });

    const hueInput = screen.getByRole('spinbutton', { name: /hue adjustment for/i });

    await fireEvent.input(hueInput, { target: { value: '999' } });

    expect(get(hueNudgers)[0]).toBe(180);
  });
});
