import { render, screen, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it } from 'vitest';

import Color from 'colorjs.io';
import ContrastControls from '$lib/components/ContrastControls.svelte';
import {
  contrastColors,
  contrastMode,
  highStep,
  lowStep,
  resetColorState,
  updateColorState
} from '$lib/stores';

function hexToRgb(hex: string): string {
  let normalized = hex.trim();
  if (normalized.startsWith('#')) normalized = normalized.slice(1);

  if (normalized.length === 3) {
    normalized = normalized
      .split('')
      .map((c) => `${c}${c}`)
      .join('');
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgb(${r}, ${g}, ${b})`;
}

describe('ContrastControls', () => {
  beforeEach(() => {
    resetColorState('light');

    updateColorState({
      neutrals: [
        '#ffffff',
        '#eeeeee',
        '#dddddd',
        '#cccccc',
        '#bbbbbb',
        '#aaaaaa',
        '#999999',
        '#888888',
        '#777777',
        '#666666',
        '#000000'
      ].map((hex) => new Color(hex).to('oklch'))
    });
  });

  it('renders auto-mode preview with current low/high values and swatches', () => {
    const { container } = render(ContrastControls);

    expect(screen.getByLabelText(/contrast mode/i)).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: /current contrast color preview/i })
    ).toBeInTheDocument();

    expect(screen.getByText('Low: #ffffff')).toBeInTheDocument();
    expect(screen.getByText('High: #000000')).toBeInTheDocument();

    const swatches = container.querySelectorAll('.contrast-preview .swatch');
    expect(swatches).toHaveLength(2);
    expect(getComputedStyle(swatches[0] as Element).backgroundColor).toBe(hexToRgb('#ffffff'));
    expect(getComputedStyle(swatches[1] as Element).backgroundColor).toBe(hexToRgb('#000000'));
  });

  it('switches to manual mode and shows manual color inputs', async () => {
    render(ContrastControls);

    const modeSelect = screen.getByLabelText(/contrast mode/i);
    await fireEvent.change(modeSelect, { target: { value: 'manual' } });

    expect(get(contrastMode)).toBe('manual');
    expect(
      screen.queryByRole('group', { name: /current contrast color preview/i })
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/low contrast color hex value/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/high contrast color hex value/i)).toBeInTheDocument();
  });

  it('does not update store when given an invalid manual hex value', async () => {
    render(ContrastControls);

    await fireEvent.change(screen.getByLabelText(/contrast mode/i), {
      target: { value: 'manual' }
    });

    const before = get(contrastColors).low;
    const lowHex = screen.getByLabelText(/low contrast color hex value/i);

    await fireEvent.change(lowHex, { target: { value: '#GGGGGG' } });

    expect(get(contrastColors).low).toBe(before);
  });

  it('updates low step selection in auto mode', async () => {
    const { container } = render(ContrastControls);

    const lowStepSelect = screen.getByLabelText(/low step/i);

    await fireEvent.change(lowStepSelect, { target: { value: '2' } });

    expect(get(lowStep)).toBe(2);
    const lowColor = get(contrastColors).low;
    expect(hexToRgb(lowColor)).toBe(hexToRgb('#dddddd'));

    expect(screen.getByText(`Low: ${lowColor}`)).toBeInTheDocument();
    const swatches = container.querySelectorAll('.contrast-preview .swatch');
    expect(getComputedStyle(swatches[0] as Element).backgroundColor).toBe(hexToRgb('#dddddd'));
  });

  it('updates high step selection in auto mode and updates preview', async () => {
    const { container } = render(ContrastControls);

    const highStepSelect = screen.getByLabelText(/high step/i);

    await fireEvent.change(highStepSelect, { target: { value: '9' } });

    expect(get(highStep)).toBe(9);
    const highColor = get(contrastColors).high;
    expect(hexToRgb(highColor)).toBe(hexToRgb('#666666'));

    expect(screen.getByText(`High: ${highColor}`)).toBeInTheDocument();
    const swatches = container.querySelectorAll('.contrast-preview .swatch');
    expect(getComputedStyle(swatches[1] as Element).backgroundColor).toBe(hexToRgb('#666666'));
  });
});
