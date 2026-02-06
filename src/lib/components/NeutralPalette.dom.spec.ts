import { render, screen, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it } from 'vitest';

import NeutralPalette from '$lib/components/NeutralPalette.svelte';
import { lightnessNudgers, resetColorState } from '$lib/stores';

describe('NeutralPalette', () => {
  beforeEach(() => {
    resetColorState('light');
  });

  it('shows an empty state when no neutrals are provided', () => {
    render(NeutralPalette, { props: { neutrals: [], lightnessNudgerValues: [] } });

    expect(screen.getByText(/no neutral colors generated yet/i)).toBeInTheDocument();
  });

  it('renders a swatch for each neutral color', () => {
    const neutrals = ['#ffffff', '#000000'];
    render(NeutralPalette, {
      props: {
        neutrals,
        lightnessNudgerValues: new Array(neutrals.length).fill(0)
      }
    });

    const swatches = screen.getAllByRole('button', { name: /click to copy to clipboard/i });
    expect(swatches).toHaveLength(neutrals.length);
  });

  it('writes lightness nudger changes to the store', async () => {
    const neutrals = ['#ffffff'];

    render(NeutralPalette, {
      props: {
        neutrals,
        lightnessNudgerValues: [0]
      }
    });

    const input = screen.getByLabelText(/lightness adjustment for step 0/i);

    await fireEvent.input(input, { target: { value: '0.1' } });

    expect(get(lightnessNudgers)[0]).toBe(0.1);
  });
});
