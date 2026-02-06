import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import ColorControls from '$lib/components/ColorControls.svelte';

describe('ColorControls', () => {
  it('renders base color controls and keeps color input in sync with hex input', async () => {
    render(ColorControls, {
      props: {
        baseColor: '#1862E6',
        warmth: 0,
        chromaMultiplier: 1,
        numColors: 11,
        numPalettes: 11,
        x1: 0.16,
        y1: 0,
        x2: 0.28,
        y2: 0.38
      }
    });

    const colorInput = screen.getByLabelText('Base Color') as HTMLInputElement;
    const hexInput = screen.getByLabelText(/base color hex value/i) as HTMLInputElement;

    expect(colorInput.value.toLowerCase()).toBe('#1862e6');

    await fireEvent.input(hexInput, { target: { value: '#00ff00' } });

    expect(colorInput.value.toLowerCase()).toBe('#00ff00');
  });

  it('updates warmth label when slider changes', async () => {
    render(ColorControls, {
      props: {
        warmth: 0
      }
    });

    const warmthSlider = screen.getByLabelText(/warmth/i) as HTMLInputElement;

    expect(screen.getByText(/warmth \(0\)/i)).toBeInTheDocument();

    await fireEvent.input(warmthSlider, { target: { value: '10' } });

    expect(warmthSlider.value).toBe('10');
    expect(screen.getByText(/warmth \(10\)/i)).toBeInTheDocument();
  });
});
