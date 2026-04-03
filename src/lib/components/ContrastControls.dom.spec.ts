import { render, screen, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Color from 'colorjs.io';
import ContrastControls from '$lib/components/ContrastControls.svelte';
import {
  activeSwatchPicker,
  contrastColors,
  contrastMode,
  contrastAlgorithm,
  swatchContrastIndicators,
  showSwatchContrastIndicators,
  highReference,
  lowReference,
  resetColorState,
  updateColorState
} from '$lib/stores';
import { announce } from '$lib/announce';

vi.mock('$lib/announce', () => ({
  announce: vi.fn()
}));

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

  it('renders auto-mode reference controls', () => {
    render(ContrastControls);

    expect(screen.getByLabelText(/contrast mode/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pick low reference/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pick high reference/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('group', { name: /current contrast color preview/i })
    ).not.toBeInTheDocument();
  });

  it('switches to manual mode and shows manual color inputs', async () => {
    render(ContrastControls);

    const modeSelect = screen.getByLabelText(/contrast mode/i);
    await fireEvent.change(modeSelect, { target: { value: 'manual' } });

    expect(get(contrastMode)).toBe('manual');
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

  it('arms the low reference picker and shows the picker banner', async () => {
    render(ContrastControls);

    await fireEvent.click(screen.getByRole('button', { name: /pick low reference/i }));

    expect(get(activeSwatchPicker)).toEqual({ kind: 'contrast-reference', target: 'low' });
    expect(screen.getByText(/select a swatch to set the low reference/i)).toBeInTheDocument();
  });

  it('cancels the reference picker from the banner', async () => {
    render(ContrastControls);

    await fireEvent.click(screen.getByRole('button', { name: /pick high reference/i }));
    await fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

    expect(get(activeSwatchPicker)).toBeNull();
    expect(
      screen.queryByText(/select a swatch to set the high reference/i)
    ).not.toBeInTheDocument();
  });

  it('cancels the reference picker on Escape', async () => {
    render(ContrastControls);

    await fireEvent.click(screen.getByRole('button', { name: /pick low reference/i }));
    await fireEvent.keyDown(window, { key: 'Escape' });

    expect(get(activeSwatchPicker)).toBeNull();
  });

  it('renders the current low and high reference summaries', () => {
    updateColorState({
      lowReference: { kind: 'neutral', stepIndex: 0 },
      highReference: { kind: 'neutral', stepIndex: 10 }
    });

    render(ContrastControls);

    expect(get(lowReference)).toEqual({ kind: 'neutral', stepIndex: 0 });
    expect(get(highReference)).toEqual({ kind: 'neutral', stepIndex: 10 });
    expect(screen.getByText(/step 0/i)).toBeInTheDocument();
    expect(screen.getByText(/step 100/i)).toBeInTheDocument();
  });
});
