import { render, screen, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Color from 'colorjs.io';
import ContrastControls from '$lib/components/ContrastControls.svelte';
import {
  contrastColors,
  contrastMode,
  highStep,
  lowStep,
  contrastAlgorithm,
  swatchContrastIndicators,
  showSwatchContrastIndicators,
  resetColorState,
  updateColorState
} from '$lib/stores';
import { announce } from '$lib/announce';

vi.mock('$lib/announce', () => ({
  announce: vi.fn()
}));

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
      ].map((hex) => new Color(hex).to('oklch')),
      contrastAlgorithm: 'WCAG',
      showSwatchContrastIndicators: true,
      swatchContrastIndicators: {
        wcagThreeToOne: true,
        wcagAA: true,
        wcagAAA: true,
        apcaLarge: true,
        apcaFluent: true,
        apcaBody: true
      }
    });
    vi.mocked(announce).mockClear();
  });

  it('renders contrast algorithm select and WCAG indicator checklist by default', () => {
    render(ContrastControls);

    expect(screen.getByLabelText(/contrast algorithm/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/show wcag 3 to 1 indicator/i)).toBeChecked();
    expect(screen.getByLabelText(/show wcag aa indicator/i)).toBeChecked();
    expect(screen.getByLabelText(/show wcag aaa indicator/i)).toBeChecked();
    expect(screen.getByLabelText(/explain wcag 3 to 1 level/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/explain wcag aa level/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/explain wcag aaa level/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/show apca large indicator/i)).not.toBeInTheDocument();
  });

  it('switches indicator checklist when changing algorithm to APCA', async () => {
    render(ContrastControls);

    await fireEvent.change(screen.getByLabelText(/contrast algorithm/i), {
      target: { value: 'APCA' }
    });

    expect(get(contrastAlgorithm)).toBe('APCA');
    expect(screen.getByLabelText(/show apca large indicator/i)).toBeChecked();
    expect(screen.getByLabelText(/show apca fluent indicator/i)).toBeChecked();
    expect(screen.getByLabelText(/show apca body indicator/i)).toBeChecked();
    expect(screen.getByLabelText(/explain apca large level/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/explain apca fluent level/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/explain apca body level/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/show wcag aa indicator/i)).not.toBeInTheDocument();
  });

  it('updates indicator selection in store when toggling checklist items', async () => {
    render(ContrastControls);

    await fireEvent.click(screen.getByLabelText(/show wcag aa indicator/i));

    expect(get(swatchContrastIndicators).wcagAA).toBe(false);
    expect(vi.mocked(announce)).toHaveBeenLastCalledWith(
      'Swatch contrast indicators showing 3:1 and AAA 7:1'
    );
  });

  it('sets overall swatch indicator visibility false when all indicators are unchecked', async () => {
    render(ContrastControls);

    await fireEvent.click(screen.getByLabelText(/show wcag 3 to 1 indicator/i));
    await fireEvent.click(screen.getByLabelText(/show wcag aa indicator/i));
    await fireEvent.click(screen.getByLabelText(/show wcag aaa indicator/i));
    await fireEvent.change(screen.getByLabelText(/contrast algorithm/i), {
      target: { value: 'APCA' }
    });
    await fireEvent.click(screen.getByLabelText(/show apca large indicator/i));
    await fireEvent.click(screen.getByLabelText(/show apca fluent indicator/i));
    await fireEvent.click(screen.getByLabelText(/show apca body indicator/i));

    expect(get(showSwatchContrastIndicators)).toBe(false);
    expect(get(swatchContrastIndicators)).toEqual({
      wcagAA: false,
      wcagAAA: false,
      wcagThreeToOne: false,
      apcaLarge: false,
      apcaFluent: false,
      apcaBody: false
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
