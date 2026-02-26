import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

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

  it('calls onRangeDragStart on pointerdown and onRangeDragEnd on pointerup', async () => {
    const onRangeDragStart = vi.fn();
    const onRangeDragEnd = vi.fn();

    render(ColorControls, {
      props: {
        numColors: 11,
        onRangeDragStart,
        onRangeDragEnd
      }
    });

    const numColorsSlider = screen.getByLabelText(/number of colors/i);

    await fireEvent.pointerDown(numColorsSlider, { pointerId: 1 });
    expect(onRangeDragStart).toHaveBeenCalledTimes(1);

    await fireEvent.pointerUp(window, { pointerId: 1 });

    // onRangeDragEnd is called in requestAnimationFrame, so we need to flush it
    await vi.waitFor(
      () => {
        expect(onRangeDragEnd).toHaveBeenCalledTimes(1);
      },
      { timeout: 100 }
    );
  });

  it('updates saturation slider value on input', async () => {
    render(ColorControls, {
      props: {
        chromaMultiplier: 1
      }
    });

    const saturationSlider = screen.getByLabelText(/saturation/i) as HTMLInputElement;
    expect(saturationSlider.value).toBe('1');

    await fireEvent.input(saturationSlider, { target: { value: '1.25' } });

    expect(saturationSlider.value).toBe('1.25');
  });

  it('uses saturation slider bounds tuned for visible gamut changes', () => {
    render(ColorControls, {
      props: {
        chromaMultiplier: 1
      }
    });

    const saturationSlider = screen.getByLabelText(/saturation/i) as HTMLInputElement;
    expect(saturationSlider.min).toBe('0');
    expect(saturationSlider.max).toBe('1.3');
  });

  it('uses wider saturation bounds for wider gamuts', () => {
    render(ColorControls, {
      props: {
        chromaMultiplier: 1,
        gamutSpace: 'p3'
      }
    });

    const saturationSlider = screen.getByLabelText(/saturation/i) as HTMLInputElement;
    expect(saturationSlider.min).toBe('0');
    expect(saturationSlider.max).toBe('1.6');
  });

  it('updates number of palettes slider value on input', async () => {
    render(ColorControls, {
      props: {
        numPalettes: 5
      }
    });

    const palettesSlider = screen.getByLabelText(/number of palettes/i) as HTMLInputElement;
    expect(palettesSlider.value).toBe('5');

    await fireEvent.input(palettesSlider, { target: { value: '8' } });

    expect(palettesSlider.value).toBe('8');
  });
});
