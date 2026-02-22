import { render, screen, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it } from 'vitest';
import Color from 'colorjs.io';

import NeutralPalette from '$lib/components/NeutralPalette.svelte';
import { lightnessNudgers, resetColorState } from '$lib/stores';

describe('NeutralPalette', () => {
  beforeEach(() => {
    resetColorState('light');
  });

  it('shows an empty state when no neutrals are provided', () => {
    render(NeutralPalette, { props: { neutralsHex: [], lightnessNudgerValues: [] } });

    expect(screen.getByText(/no neutral colors generated yet/i)).toBeInTheDocument();
  });

  it('renders a swatch for each neutral color', () => {
    const neutralsHex = ['#ffffff', '#000000'];
    render(NeutralPalette, {
      props: {
        neutralsHex,
        lightnessNudgerValues: new Array(neutralsHex.length).fill(0)
      }
    });

    const swatches = screen.getAllByRole('button', {
      name: /(view color details|copy to clipboard)/i
    });
    expect(swatches).toHaveLength(neutralsHex.length);
  });

  it('writes lightness nudger changes to the store', async () => {
    const neutralsHex = ['#ffffff'];

    render(NeutralPalette, {
      props: {
        neutralsHex,
        lightnessNudgerValues: [0]
      }
    });

    const input = screen.getByLabelText(/lightness adjustment for step 0/i);

    await fireEvent.input(input, { target: { value: '0.1' } });

    expect(get(lightnessNudgers)[0]).toBe(0.1);
  });

  it('handles ArrowUp key to increment nudger value', async () => {
    const neutralsHex = ['#ffffff'];

    render(NeutralPalette, {
      props: {
        neutralsHex,
        lightnessNudgerValues: [0]
      }
    });

    const input = screen.getByLabelText(/lightness adjustment for step 0/i);

    await fireEvent.keyDown(input, { key: 'ArrowUp' });

    expect(get(lightnessNudgers)[0]).toBe(0.01);
  });

  it('handles ArrowDown key to decrement nudger value', async () => {
    const neutralsHex = ['#ffffff'];

    render(NeutralPalette, {
      props: {
        neutralsHex,
        lightnessNudgerValues: [0]
      }
    });

    const input = screen.getByLabelText(/lightness adjustment for step 0/i);

    await fireEvent.keyDown(input, { key: 'ArrowDown' });

    expect(get(lightnessNudgers)[0]).toBe(-0.01);
  });

  it('clamps ArrowUp at max value 0.5', async () => {
    const neutralsHex = ['#ffffff'];

    render(NeutralPalette, {
      props: {
        neutralsHex,
        lightnessNudgerValues: [0.5]
      }
    });

    const input = screen.getByLabelText(/lightness adjustment for step 0/i) as HTMLInputElement;
    input.value = '0.5';

    await fireEvent.keyDown(input, { key: 'ArrowUp' });

    expect(get(lightnessNudgers)[0]).toBe(0.5);
  });

  it('clamps ArrowDown at min value -0.5', async () => {
    const neutralsHex = ['#ffffff'];

    render(NeutralPalette, {
      props: {
        neutralsHex,
        lightnessNudgerValues: [-0.5]
      }
    });

    const input = screen.getByLabelText(/lightness adjustment for step 0/i) as HTMLInputElement;
    input.value = '-0.5';

    await fireEvent.keyDown(input, { key: 'ArrowDown' });

    expect(get(lightnessNudgers)[0]).toBe(-0.5);
  });

  it('renders with Color objects in neutrals prop', () => {
    const neutrals = [new Color('#ffffff'), new Color('#000000')];
    const neutralsHex = ['#ffffff', '#000000'];

    render(NeutralPalette, {
      props: {
        neutrals,
        neutralsHex,
        neutralsDisplay: neutralsHex,
        lightnessNudgerValues: [0, 0]
      }
    });

    const swatches = screen.getAllByRole('button', {
      name: /(view color details|copy to clipboard)/i
    });
    expect(swatches).toHaveLength(2);
  });
});
