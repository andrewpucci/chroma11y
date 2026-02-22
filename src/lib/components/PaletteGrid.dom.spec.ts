import { render, screen, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it } from 'vitest';
import Color from 'colorjs.io';

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

  it('handles ArrowUp key to increment hue nudger', async () => {
    const palettesHex = [['#e6f0ff', '#0066ff']];

    render(PaletteGrid, { props: { palettesHex, hueNudgerValues: [0] } });

    const hueInput = screen.getByRole('spinbutton', { name: /hue adjustment for/i });

    await fireEvent.keyDown(hueInput, { key: 'ArrowUp' });

    expect(get(hueNudgers)[0]).toBe(1);
  });

  it('handles ArrowDown key to decrement hue nudger', async () => {
    const palettesHex = [['#e6f0ff', '#0066ff']];

    render(PaletteGrid, { props: { palettesHex, hueNudgerValues: [0] } });

    const hueInput = screen.getByRole('spinbutton', { name: /hue adjustment for/i });

    await fireEvent.keyDown(hueInput, { key: 'ArrowDown' });

    expect(get(hueNudgers)[0]).toBe(-1);
  });

  it('clamps ArrowUp at max value 180', async () => {
    const palettesHex = [['#e6f0ff', '#0066ff']];

    render(PaletteGrid, { props: { palettesHex, hueNudgerValues: [180] } });

    const hueInput = screen.getByRole('spinbutton', {
      name: /hue adjustment for/i
    }) as HTMLInputElement;
    hueInput.value = '180';

    await fireEvent.keyDown(hueInput, { key: 'ArrowUp' });

    expect(get(hueNudgers)[0]).toBe(180);
  });

  it('clamps ArrowDown at min value -180', async () => {
    const palettesHex = [['#e6f0ff', '#0066ff']];

    render(PaletteGrid, { props: { palettesHex, hueNudgerValues: [-180] } });

    const hueInput = screen.getByRole('spinbutton', {
      name: /hue adjustment for/i
    }) as HTMLInputElement;
    hueInput.value = '-180';

    await fireEvent.keyDown(hueInput, { key: 'ArrowDown' });

    expect(get(hueNudgers)[0]).toBe(-180);
  });

  it('ignores partial input while typing', async () => {
    const palettesHex = [['#e6f0ff', '#0066ff']];

    render(PaletteGrid, { props: { palettesHex, hueNudgerValues: [10] } });

    const hueInput = screen.getByRole('spinbutton', {
      name: /hue adjustment for/i
    }) as HTMLInputElement;

    // First, set the store to a known value by firing a valid input
    await fireEvent.input(hueInput, { target: { value: '10' } });
    expect(get(hueNudgers)[0]).toBe(10);

    // Type partial input (just a minus sign)
    await fireEvent.input(hueInput, { target: { value: '-' } });

    // Store should retain the previous valid value
    expect(get(hueNudgers)[0]).toBe(10);
  });

  it('resets invalid input to 0 on blur', async () => {
    const palettesHex = [['#e6f0ff', '#0066ff']];

    render(PaletteGrid, { props: { palettesHex, hueNudgerValues: [50] } });

    const hueInput = screen.getByRole('spinbutton', {
      name: /hue adjustment for/i
    }) as HTMLInputElement;
    hueInput.value = 'invalid';

    await fireEvent.blur(hueInput);

    expect(get(hueNudgers)[0]).toBe(0);
  });

  it('renders with Color objects in palettes prop', () => {
    const palettes = [[new Color('#e6f0ff'), new Color('#0066ff')]];
    const palettesHex = [['#e6f0ff', '#0066ff']];

    render(PaletteGrid, {
      props: {
        palettes,
        palettesHex,
        palettesDisplay: palettesHex,
        hueNudgerValues: [0]
      }
    });

    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings).toHaveLength(1);
  });
});
