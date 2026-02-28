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

  it('clamps saturation number input to slider max on blur', async () => {
    render(ColorControls, {
      props: {
        chromaMultiplier: 1
      }
    });

    const saturationInput = screen.getByRole('spinbutton', {
      name: 'Saturation value input'
    }) as HTMLInputElement;

    await fireEvent.input(saturationInput, { target: { value: '5' } });
    await fireEvent.blur(saturationInput);

    const saturationSlider = screen.getByRole('slider', { name: 'Saturation' }) as HTMLInputElement;
    expect(saturationSlider.value).toBe('1.3');
    expect(saturationInput.value).toBe('1.3');
  });

  it('clamps number of colors input during input to prevent oversized render state', async () => {
    render(ColorControls, {
      props: {
        numColors: 11
      }
    });

    const numColorsInput = screen.getByRole('spinbutton', {
      name: 'Number of colors value input'
    }) as HTMLInputElement;
    const numColorsSlider = screen.getByRole('slider', {
      name: 'Number of Colors'
    }) as HTMLInputElement;

    await fireEvent.input(numColorsInput, { target: { value: '999' } });

    expect(numColorsInput.value).toBe('20');
    expect(numColorsSlider.value).toBe('20');
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

    const numColorsSlider = screen.getByRole('slider', { name: 'Number of Colors' });

    await fireEvent.pointerDown(numColorsSlider, { pointerId: 1 });
    expect(onRangeDragStart).toHaveBeenCalledTimes(1);

    await fireEvent.pointerUp(window, { pointerId: 1 });

    await vi.waitFor(
      () => {
        expect(onRangeDragEnd).toHaveBeenCalledTimes(1);
      },
      { timeout: 100 }
    );
  });

  it('uses saturation slider bounds tuned for visible gamut changes', () => {
    render(ColorControls, {
      props: {
        chromaMultiplier: 1
      }
    });

    const saturationSlider = screen.getByRole('slider', { name: 'Saturation' }) as HTMLInputElement;
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

    const saturationSlider = screen.getByRole('slider', { name: 'Saturation' }) as HTMLInputElement;
    expect(saturationSlider.min).toBe('0');
    expect(saturationSlider.max).toBe('1.6');
  });

  it('renders Bezier coordinate inputs with bound values', () => {
    render(ColorControls, {
      props: {
        x1: 0.16,
        y1: 0.0,
        x2: 0.28,
        y2: 0.38
      }
    });

    const p1XInput = screen.getByLabelText(/p1 x coordinate/i) as HTMLInputElement;
    const p2YInput = screen.getByLabelText(/p2 y coordinate/i) as HTMLInputElement;

    expect(p1XInput.value).toBe('0.16');
    expect(p2YInput.value).toBe('0.38');
  });
});
