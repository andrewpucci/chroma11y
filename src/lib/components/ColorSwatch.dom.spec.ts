import { render, screen } from '@testing-library/svelte';
import Color from 'colorjs.io';
import { beforeEach, describe, expect, it } from 'vitest';

import ColorSwatch from '$lib/components/ColorSwatch.svelte';
import { resetColorState, updateColorState } from '$lib/stores';

describe('ColorSwatch', () => {
  beforeEach(() => {
    resetColorState('light');
    updateColorState({
      swatchLabels: 'both',
      showSwatchGamutWarnings: true,
      showSwatchContrastIndicators: true,
      swatchContrastIndicators: {
        wcagThreeToOne: true,
        wcagAA: true,
        wcagAAA: true,
        apcaLarge: true,
        apcaFluent: true,
        apcaBody: true
      },
      gamutSpace: 'srgb',
      contrastAlgorithm: 'WCAG',
      contrast: { low: '#ffffff', high: '#000000' }
    });
  });

  it('uses black text for very light swatches in light theme when step and value labels are shown', () => {
    const { container } = render(ColorSwatch, { props: { color: '#ffffff', label: '0' } });

    const swatch = container.querySelector('.color-swatch');
    expect(swatch).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('#ffffff')).toBeInTheDocument();
    expect(window.getComputedStyle(swatch as HTMLElement).color).toBe('rgb(0, 0, 0)');
  });

  it('uses white text for very dark swatches in dark theme when step and value labels are shown', () => {
    resetColorState('dark');

    const { container } = render(ColorSwatch, { props: { color: '#161719', label: '0' } });

    const swatch = container.querySelector('.color-swatch');
    expect(swatch).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('#161719')).toBeInTheDocument();
    expect(window.getComputedStyle(swatch as HTMLElement).color).toBe('rgb(255, 255, 255)');
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

  it('shows gamut warning tag and outline for gamut-mapped swatches in Display P3', () => {
    updateColorState({ displayColorSpace: 'oklch', gamutSpace: 'p3' });
    const outOfP3Color = new Color('oklch', [0.62, 0.4, 35]);
    const { container } = render(ColorSwatch, {
      props: {
        color: '#ff5500',
        label: '50',
        oklchColor: outOfP3Color
      }
    });

    expect(container.querySelector('.color-swatch--gamut-warning')).toBeInTheDocument();
    expect(screen.getByText('P3')).toBeInTheDocument();
  });

  it('does not show gamut warning for in-gamut swatches in Display P3', () => {
    updateColorState({ displayColorSpace: 'oklch', gamutSpace: 'p3' });
    const inGamutColor = new Color('#00ff00').to('oklch');
    const { container } = render(ColorSwatch, {
      props: {
        color: '#00ff00',
        label: '50',
        oklchColor: inGamutColor
      }
    });

    expect(container.querySelector('.color-swatch--gamut-warning')).not.toBeInTheDocument();
    expect(screen.queryByText('P3')).not.toBeInTheDocument();
  });

  it('shows gamut warning for P3 colors that are still outside sRGB', () => {
    updateColorState({ displayColorSpace: 'oklch', gamutSpace: 'p3' });
    const inP3ButNotSrgb = new Color('oklch', [0.95, 0.032, 230]);
    const { container } = render(ColorSwatch, {
      props: {
        color: '#b9d7e5',
        displayValue: 'oklch(95% 0.032 230)',
        label: '10',
        oklchColor: inP3ButNotSrgb
      }
    });

    expect(container.querySelector('.color-swatch--gamut-warning')).toBeInTheDocument();
    expect(screen.getByText('P3')).toBeInTheDocument();
  });

  it('shows a P3 label in Rec. 2020 mode when the displayed color still fits in P3', () => {
    updateColorState({ displayColorSpace: 'oklch', gamutSpace: 'rec2020' });
    const inP3ButNotSrgb = new Color('oklch', [0.95, 0.032, 230]);
    const { container } = render(ColorSwatch, {
      props: {
        color: '#b9d7e5',
        displayValue: 'oklch(95% 0.032 230)',
        label: '10',
        oklchColor: inP3ButNotSrgb
      }
    });

    expect(container.querySelector('.color-swatch--gamut-warning')).toBeInTheDocument();
    expect(screen.getByText('P3')).toBeInTheDocument();
    expect(screen.queryByText('Rec. 2020')).not.toBeInTheDocument();
  });

  it('shows a Rec. 2020 label only when P3 is insufficient', () => {
    updateColorState({ displayColorSpace: 'oklch', gamutSpace: 'rec2020' });
    const rec2020Only = new Color('oklch', [0.72, 0.32, 155]);
    const { container } = render(ColorSwatch, {
      props: {
        color: '#00d45f',
        displayValue: 'oklch(72% 0.32 155)',
        label: '50',
        oklchColor: rec2020Only
      }
    });

    expect(container.querySelector('.color-swatch--gamut-warning')).toBeInTheDocument();
    expect(screen.getByText('Rec. 2020')).toBeInTheDocument();
  });

  it('does not show gamut warning for white swatches in Display P3', () => {
    updateColorState({ displayColorSpace: 'oklch', gamutSpace: 'p3' });
    const whiteOklch = new Color('oklch', [1, 0, 330]);
    const { container } = render(ColorSwatch, {
      props: {
        color: '#ffffff',
        displayValue: 'oklch(100% 0 0)',
        label: '0',
        oklchColor: whiteOklch
      }
    });

    expect(container.querySelector('.color-swatch--gamut-warning')).not.toBeInTheDocument();
    expect(screen.queryByText('P3')).not.toBeInTheDocument();
  });

  it('never shows gamut warning in sRGB even for out-of-sRGB colors', () => {
    updateColorState({ displayColorSpace: 'oklch', gamutSpace: 'srgb' });
    const outOfSrgbColor = new Color('oklch', [0.62, 0.4, 320]);
    const { container } = render(ColorSwatch, {
      props: {
        color: '#cc00ff',
        label: '50',
        oklchColor: outOfSrgbColor
      }
    });

    expect(container.querySelector('.color-swatch--gamut-warning')).not.toBeInTheDocument();
    expect(screen.queryByText('sRGB')).not.toBeInTheDocument();
  });

  it('hides gamut warning when warning toggle is disabled', () => {
    updateColorState({
      displayColorSpace: 'oklch',
      gamutSpace: 'rec2020',
      showSwatchGamutWarnings: false
    });
    const outOfRec2020Color = new Color('oklch', [0.9, 0.45, 120]);
    const { container } = render(ColorSwatch, {
      props: {
        color: '#99ff00',
        label: '50',
        oklchColor: outOfRec2020Color
      }
    });

    expect(container.querySelector('.color-swatch--gamut-warning')).not.toBeInTheDocument();
    expect(screen.queryByText('Rec. 2020')).not.toBeInTheDocument();
  });
});
