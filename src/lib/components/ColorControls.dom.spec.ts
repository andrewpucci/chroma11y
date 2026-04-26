import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import ColorControls from '$lib/components/ColorControls.svelte';

describe('ColorControls', () => {
  it('renders base color controls and keeps color input in sync with hex input', async () => {
    render(ColorControls, {
      props: {
        baseColor: '#5EF784',
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

    expect(colorInput.value.toLowerCase()).toBe('#5ef784');

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
    expect(saturationSlider.value).toBe('1');
    expect(saturationInput.value).toBe('1');
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

  it('uses amount-only warmth bounds while custom warmth hue is enabled and restores sign on disable', async () => {
    render(ColorControls, {
      props: {
        warmth: -12,
        warmthHue: undefined
      }
    });

    const warmthSlider = screen.getByRole('slider', { name: 'Warmth' }) as HTMLInputElement;
    const warmthInput = screen.getByRole('spinbutton', {
      name: 'Warmth value input'
    }) as HTMLInputElement;
    const customWarmthToggle = screen.getByRole('checkbox', {
      name: 'Custom Warmth Hue'
    }) as HTMLInputElement;

    expect(warmthSlider.min).toBe('-50');
    expect(warmthInput.min).toBe('-50');
    expect(warmthSlider.value).toBe('-12');

    await fireEvent.click(customWarmthToggle);

    expect(screen.getByRole('slider', { name: 'Warmth Amount' })).toHaveAttribute('min', '0');
    expect(
      screen.getByRole('spinbutton', {
        name: 'Warmth amount value input'
      })
    ).toHaveAttribute('min', '0');
    expect(warmthSlider.value).toBe('12');

    await fireEvent.click(customWarmthToggle);

    expect(screen.getByRole('slider', { name: 'Warmth' })).toHaveAttribute('min', '-50');
    expect(screen.getByRole('spinbutton', { name: 'Warmth value input' })).toHaveAttribute(
      'min',
      '-50'
    );
    expect(warmthSlider.value).toBe('-12');
  });

  it('keeps custom warmth hue controls visible when warmth amount is zero', async () => {
    render(ColorControls, {
      props: {
        warmth: 0,
        warmthHue: 180
      }
    });

    expect(screen.getByRole('checkbox', { name: 'Custom Warmth Hue' })).toBeVisible();
    expect(screen.getByRole('slider', { name: 'Warmth Hue' })).toBeVisible();
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

  it('uses normalized saturation slider bounds', () => {
    render(ColorControls, {
      props: {
        chromaMultiplier: 1
      }
    });

    const saturationSlider = screen.getByRole('slider', { name: 'Saturation' }) as HTMLInputElement;
    expect(saturationSlider.min).toBe('0');
    expect(saturationSlider.max).toBe('1');
  });

  it('uses the same normalized saturation bounds for wider gamuts', () => {
    render(ColorControls, {
      props: {
        chromaMultiplier: 1,
        gamutSpace: 'p3'
      }
    });

    const saturationSlider = screen.getByRole('slider', { name: 'Saturation' }) as HTMLInputElement;
    expect(saturationSlider.min).toBe('0');
    expect(saturationSlider.max).toBe('1');
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

  it('renders help tooltip triggers for major color controls', () => {
    render(ColorControls, {
      props: {
        warmth: 12,
        warmthHue: 180,
        advancedOpen: true
      }
    });

    expect(screen.getByRole('button', { name: 'Explain Base Color' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explain Warmth Amount' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explain Custom Warmth Hue' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explain Warmth Hue' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explain Saturation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explain Number of Colors' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explain Number of Palettes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explain Bezier Curve' })).toBeInTheDocument();
  });
});
