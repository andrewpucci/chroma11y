import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import SliderNumberField from '$lib/components/SliderNumberField.svelte';

describe('SliderNumberField', () => {
  it('renders grouped slider controls with shared described-by content', () => {
    render(SliderNumberField, {
      props: {
        id: 'test-slider',
        label: 'Test Slider',
        valueInputLabel: 'Test slider value input',
        min: 1,
        max: 10,
        step: 1,
        value: 4,
        groupHelpText:
          'Range 1 to 10. Use slider for coarse adjustment and number input for precise adjustment.',
        infoButtonLabel: 'Explain test slider',
        infoTooltipId: 'test-slider-tooltip',
        infoTooltipText: 'Tooltip help text'
      }
    });

    const group = screen.getByRole('group', { name: 'Test Slider' });
    const slider = screen.getByRole('slider', { name: 'Test Slider' }) as HTMLInputElement;
    const numberInput = screen.getByRole('spinbutton', {
      name: 'Test slider value input'
    }) as HTMLInputElement;

    expect(group.getAttribute('aria-describedby')).toContain('test-slider-tooltip');
    expect(group.getAttribute('aria-describedby')).toContain('test-slider-control-help');
    expect(slider.getAttribute('aria-describedby')).toContain('test-slider-tooltip');
    expect(slider.getAttribute('aria-describedby')).toContain('test-slider-control-help');
    expect(numberInput.getAttribute('aria-describedby')).toContain('test-slider-tooltip');
    expect(numberInput.getAttribute('aria-describedby')).toContain('test-slider-control-help');
    expect(screen.getByRole('button', { name: 'Explain test slider' })).toBeInTheDocument();
  });

  it('keeps range slider and number input values in sync', async () => {
    render(SliderNumberField, {
      props: {
        id: 'sync-slider',
        label: 'Sync Slider',
        valueInputLabel: 'Sync slider value input',
        min: 1,
        max: 10,
        step: 1,
        value: 5
      }
    });

    const slider = screen.getByRole('slider', { name: 'Sync Slider' }) as HTMLInputElement;
    const numberInput = screen.getByRole('spinbutton', {
      name: 'Sync slider value input'
    }) as HTMLInputElement;

    await fireEvent.input(numberInput, { target: { value: '8' } });
    expect(slider.value).toBe('8');

    await fireEvent.input(slider, { target: { value: '3' } });
    expect(numberInput.value).toBe('3');
  });

  it('invokes supplied range and number callbacks', async () => {
    const onRangeInput = vi.fn();
    const onRangeChange = vi.fn();
    const onRangePointerDown = vi.fn();
    const onNumberInput = vi.fn();
    const onNumberChange = vi.fn();
    const onNumberBlur = vi.fn();

    render(SliderNumberField, {
      props: {
        id: 'callbacks-slider',
        label: 'Callbacks Slider',
        valueInputLabel: 'Callbacks slider value input',
        min: 1,
        max: 10,
        step: 1,
        value: 5,
        onRangeInput,
        onRangeChange,
        onRangePointerDown,
        onNumberInput,
        onNumberChange,
        onNumberBlur
      }
    });

    const slider = screen.getByRole('slider', { name: 'Callbacks Slider' });
    const numberInput = screen.getByRole('spinbutton', {
      name: 'Callbacks slider value input'
    });

    await fireEvent.pointerDown(slider, { pointerId: 1 });
    await fireEvent.input(slider, { target: { value: '6' } });
    await fireEvent.change(slider, { target: { value: '6' } });
    await fireEvent.input(numberInput, { target: { value: '7' } });
    await fireEvent.change(numberInput, { target: { value: '7' } });
    await fireEvent.blur(numberInput);

    expect(onRangePointerDown).toHaveBeenCalledTimes(1);
    expect(onRangeInput).toHaveBeenCalledTimes(1);
    expect(onRangeChange).toHaveBeenCalledTimes(1);
    expect(onNumberInput).toHaveBeenCalledTimes(1);
    expect(onNumberChange).toHaveBeenCalledTimes(1);
    expect(onNumberBlur).toHaveBeenCalledTimes(1);
  });
});
