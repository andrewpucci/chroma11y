import { render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';

import ColorSwatch from '$lib/components/ColorSwatch.svelte';
import { resetColorState, updateColorState } from '$lib/stores';

describe('ColorSwatch', () => {
  beforeEach(() => {
    resetColorState('light');
    updateColorState({
      swatchLabels: 'both',
      showSwatchContrastIndicators: true,
      swatchContrastIndicators: {
        wcagThreeToOne: true,
        wcagAA: true,
        wcagAAA: true,
        apcaLarge: true,
        apcaFluent: true,
        apcaBody: true
      },
      contrastAlgorithm: 'WCAG',
      contrast: { low: '#ffffff', high: '#000000' }
    });
  });

  it('renders WCAG 3:1, AA, and AAA indicator badges for low and high contrast groups', () => {
    render(ColorSwatch, { props: { color: '#ffffff', label: '0' } });

    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Low contrast WCAG 2.2 3 to 1 (pass|fail)$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Low contrast WCAG 2.2 AA (pass|fail)$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Low contrast WCAG 2.2 AAA (pass|fail)$/)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/^High contrast WCAG 2.2 3 to 1 (pass|fail)$/)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^High contrast WCAG 2.2 AA (pass|fail)$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^High contrast WCAG 2.2 AAA (pass|fail)$/)).toBeInTheDocument();
  });

  it('renders APCA Large, Fluent, and Body indicator badges for low and high contrast groups', () => {
    updateColorState({ contrastAlgorithm: 'APCA' });

    render(ColorSwatch, { props: { color: '#3d3d3d', label: '0' } });

    expect(screen.getByLabelText(/^Low contrast APCA Large (pass|fail)$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Low contrast APCA Fluent (pass|fail)$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Low contrast APCA Body (pass|fail)$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^High contrast APCA Large (pass|fail)$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^High contrast APCA Fluent (pass|fail)$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^High contrast APCA Body (pass|fail)$/)).toBeInTheDocument();
  });

  it('renders only selected WCAG indicator levels', () => {
    updateColorState({
      swatchContrastIndicators: {
        wcagThreeToOne: true,
        wcagAA: true,
        wcagAAA: false,
        apcaLarge: true,
        apcaFluent: true,
        apcaBody: true
      }
    });

    render(ColorSwatch, { props: { color: '#ffffff', label: '0' } });

    expect(screen.getByLabelText(/^Low contrast WCAG 2.2 AA (pass|fail)$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Low contrast WCAG 2.2 3 to 1 (pass|fail)$/)).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/^Low contrast WCAG 2.2 AAA (pass|fail)$/)
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^High contrast WCAG 2.2 AA (pass|fail)$/)).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/^High contrast WCAG 2.2 AAA (pass|fail)$/)
    ).not.toBeInTheDocument();
  });

  it('hides indicators when swatch contrast indicator visibility is disabled', () => {
    updateColorState({ showSwatchContrastIndicators: false });

    render(ColorSwatch, { props: { color: '#ffffff', label: '0' } });

    expect(screen.queryByText('Low')).not.toBeInTheDocument();
    expect(screen.queryByText('High')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/contrast WCAG 2.2/)).not.toBeInTheDocument();
  });

  it('hides indicators when swatch labels are hidden', () => {
    updateColorState({ swatchLabels: 'none', showSwatchContrastIndicators: true });

    render(ColorSwatch, { props: { color: '#ffffff', label: '0' } });

    expect(screen.queryByText('Low')).not.toBeInTheDocument();
    expect(screen.queryByText('High')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/contrast WCAG 2.2/)).not.toBeInTheDocument();
  });

  it('hides indicators when no levels are selected for the active algorithm', () => {
    updateColorState({
      swatchContrastIndicators: {
        wcagThreeToOne: false,
        wcagAA: false,
        wcagAAA: false,
        apcaLarge: true,
        apcaFluent: true,
        apcaBody: true
      }
    });

    render(ColorSwatch, { props: { color: '#ffffff', label: '0' } });

    expect(screen.queryByText('Low')).not.toBeInTheDocument();
    expect(screen.queryByText('High')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/contrast WCAG 2.2/)).not.toBeInTheDocument();
  });

  it('reduces indicator tint below 5% when a 5% tint would violate contrast threshold', () => {
    const { container } = render(ColorSwatch, { props: { color: '#757575', label: '0' } });

    const swatch = container.querySelector('.color-swatch');
    expect(swatch).toBeInTheDocument();
    const style = swatch?.getAttribute('style') ?? '';
    const tintMatch = style.match(/--swatch-indicator-tint-alpha:\s*([\d.]+)%/);
    expect(tintMatch).not.toBeNull();
    expect(Number(tintMatch?.[1])).toBeLessThan(5);
  });

  it('keeps indicator tint at 5% when full tint still preserves contrast', () => {
    const { container } = render(ColorSwatch, { props: { color: '#ffffff', label: '0' } });

    const swatch = container.querySelector('.color-swatch');
    expect(swatch).toBeInTheDocument();
    const style = swatch?.getAttribute('style') ?? '';
    const tintMatch = style.match(/--swatch-indicator-tint-alpha:\s*([\d.]+)%/);
    expect(tintMatch).not.toBeNull();
    expect(Number(tintMatch?.[1])).toBe(5);
  });
});
