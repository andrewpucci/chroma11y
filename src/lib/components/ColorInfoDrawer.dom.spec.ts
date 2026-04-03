import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Color from 'colorjs.io';
import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { openDrawer, closeDrawer, drawerIsOpen } from '$lib/drawerStore';
import { resetColorState, updateColorState } from '$lib/stores';

vi.mock('$lib/announce', () => ({
  announce: vi.fn()
}));

vi.mock('$lib/colorUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('$lib/colorUtils')>();
  return {
    ...actual,
    copyToClipboard: vi.fn()
  };
});

import { announce } from '$lib/announce';
import { copyToClipboard, colorToCssOklch, colorToCssOklchSwatch } from '$lib/colorUtils';
import ColorInfoDrawer from '$lib/components/ColorInfoDrawer.svelte';
import ColorSwatch from '$lib/components/ColorSwatch.svelte';

/** Helper: build a DrawerColorData payload for a given hex */
function makeDrawerData(hex = '#5a95ff', step = '500', paletteName = 'Blue') {
  const oklch = new Color(hex).to('oklch');
  return { hex, oklch, step, paletteName, isNeutral: false };
}

describe('ColorInfoDrawer', () => {
  beforeEach(() => {
    resetColorState('light');
    updateColorState({ gamutSpace: 'srgb' });
    closeDrawer();
    vi.clearAllMocks();
  });

  afterEach(() => {
    closeDrawer();
  });

  // ── Rendering ──────────────────────────────────────────────

  it('does not render when the drawer is closed', () => {
    render(ColorInfoDrawer);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders a dialog when the drawer is opened', () => {
    openDrawer(makeDrawerData());
    render(ColorInfoDrawer);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('displays the color name as the drawer title', () => {
    openDrawer(makeDrawerData());
    render(ColorInfoDrawer);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent?.trim().length).toBeGreaterThan(0);
  });

  // ── Metadata ───────────────────────────────────────────────

  it('shows palette name, step, and lightness metadata', () => {
    openDrawer(makeDrawerData('#5a95ff', '500', 'Blue'));
    render(ColorInfoDrawer);

    expect(screen.getByText('Blue')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('Lightness')).toBeInTheDocument();
  });

  // ── Color values section ───────────────────────────────────

  it('renders all four color format rows', () => {
    openDrawer(makeDrawerData());
    render(ColorInfoDrawer);

    for (const label of ['Hex', 'RGB', 'OKLCH', 'HSL']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('shows gamut mapping alert when selected swatch is mapped in a non-sRGB gamut', () => {
    updateColorState({ displayColorSpace: 'oklch', gamutSpace: 'p3' });
    const mappedColor = new Color('oklch', [0.62, 0.4, 35]);
    openDrawer({
      hex: '#ff5500',
      oklch: mappedColor,
      step: '500',
      paletteName: 'Orange',
      isNeutral: false
    });
    const { container } = render(ColorInfoDrawer);

    expect(screen.getByRole('alert', { name: /gamut mapping warning/i })).toBeInTheDocument();
    expect(container.querySelector('.color-preview--gamut-warning')).toBeInTheDocument();
    expect(container.querySelector('.color-preview-gamut-tag')).toHaveTextContent('P3');
  });

  it('shows the same gamut warning treatment in drawer after opening from a swatch', async () => {
    const user = userEvent.setup();
    updateColorState({ displayColorSpace: 'oklch', gamutSpace: 'p3' });
    const outOfP3Color = new Color('oklch', [0.62, 0.4, 35]);
    const swatchValue = colorToCssOklchSwatch(outOfP3Color, 'p3');
    const swatchRender = render(ColorSwatch, {
      color: '#ff5500',
      displayValue: swatchValue,
      label: '500',
      oklchColor: outOfP3Color,
      paletteName: 'Orange',
      isNeutral: false
    });
    const drawerRender = render(ColorInfoDrawer);

    await user.click(swatchRender.container.querySelector('.color-swatch') as HTMLButtonElement);
    await screen.findByRole('dialog');

    expect(screen.getByRole('alert', { name: /gamut mapping warning/i })).toBeInTheDocument();
    expect(
      drawerRender.container.querySelector('.color-preview--gamut-warning')
    ).toBeInTheDocument();
    expect(drawerRender.container.querySelector('.color-preview-gamut-tag')).toHaveTextContent(
      'P3'
    );
  });

  it('does not show gamut mapping alert in sRGB gamut', () => {
    updateColorState({ displayColorSpace: 'oklch', gamutSpace: 'srgb' });
    openDrawer(makeDrawerData());
    render(ColorInfoDrawer);

    expect(screen.queryByRole('alert', { name: /gamut mapping warning/i })).not.toBeInTheDocument();
  });

  it('shows gamut mapping alert for P3 colors that are outside sRGB', () => {
    updateColorState({ displayColorSpace: 'oklch', gamutSpace: 'p3' });
    const inP3ButNotSrgb = new Color('oklch', [0.95, 0.032, 230]);
    openDrawer({
      hex: '#b9d7e5',
      displayValue: 'oklch(95% 0.032 230)',
      oklch: inP3ButNotSrgb,
      step: '10',
      paletteName: 'Swimmer',
      isNeutral: false
    });
    const { container } = render(ColorInfoDrawer);

    expect(screen.getByRole('alert', { name: /gamut mapping warning/i })).toBeInTheDocument();
    expect(container.querySelector('.color-preview--gamut-warning')).toBeInTheDocument();
    expect(container.querySelector('.color-preview-gamut-tag')).toHaveTextContent('P3');
    expect(screen.getAllByText('Out of sRGB gamut').length).toBeGreaterThanOrEqual(3);
  });

  it('shows a P3 warning in Rec. 2020 mode when the displayed color still fits in P3', () => {
    updateColorState({ displayColorSpace: 'oklch', gamutSpace: 'rec2020' });
    const inP3ButNotSrgb = new Color('oklch', [0.95, 0.032, 230]);
    openDrawer({
      hex: '#b9d7e5',
      displayValue: 'oklch(95% 0.032 230)',
      oklch: inP3ButNotSrgb,
      step: '10',
      paletteName: 'Swimmer',
      isNeutral: false
    });
    const { container } = render(ColorInfoDrawer);

    expect(screen.getByRole('alert', { name: /gamut mapping warning/i })).toBeInTheDocument();
    expect(container.querySelector('.color-preview-gamut-tag')).toHaveTextContent('P3');
    expect(screen.queryByText('Rec. 2020')).not.toBeInTheDocument();
  });

  it('shows a Rec. 2020 warning only when P3 is insufficient', () => {
    updateColorState({ displayColorSpace: 'oklch', gamutSpace: 'rec2020' });
    const rec2020Only = new Color('oklch', [0.72, 0.32, 155]);
    openDrawer({
      hex: '#00d45f',
      displayValue: 'oklch(72% 0.32 155)',
      oklch: rec2020Only,
      step: '50',
      paletteName: 'Aurora',
      isNeutral: false
    });
    const { container } = render(ColorInfoDrawer);

    expect(screen.getByRole('alert', { name: /gamut mapping warning/i })).toBeInTheDocument();
    expect(container.querySelector('.color-preview-gamut-tag')).toHaveTextContent('Rec. 2020');
  });

  it('does not show gamut mapping alert for white in Display P3', () => {
    updateColorState({ displayColorSpace: 'oklch', gamutSpace: 'p3' });
    const white = new Color('oklch', [1, 0, 330]);
    openDrawer({
      hex: '#ffffff',
      displayValue: 'oklch(100% 0 0)',
      oklch: white,
      step: '0',
      paletteName: 'Ironside',
      isNeutral: false
    });
    const { container } = render(ColorInfoDrawer);

    expect(screen.queryByRole('alert', { name: /gamut mapping warning/i })).not.toBeInTheDocument();
    expect(container.querySelector('.color-preview--gamut-warning')).not.toBeInTheDocument();
    expect(container.querySelector('.color-preview-gamut-tag')).not.toBeInTheDocument();
  });

  it('marks strict sRGB rows unavailable when color cannot be represented in sRGB', () => {
    updateColorState({ displayColorSpace: 'oklch', gamutSpace: 'rec2020' });
    const outOfSrgbColor = new Color('oklch', [0.7, 0.4, 300]);
    openDrawer({
      hex: '#ff00ff',
      oklch: outOfSrgbColor,
      step: '500',
      paletteName: 'Magenta',
      isNeutral: false
    });
    render(ColorInfoDrawer);

    const unavailableValues = screen.getAllByText('Unavailable');
    expect(unavailableValues.length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText('Out of sRGB gamut').length).toBeGreaterThanOrEqual(3);

    const unavailableButtons = screen.getAllByRole('button', { name: /value unavailable/i });
    expect(unavailableButtons.length).toBeGreaterThanOrEqual(3);
    for (const button of unavailableButtons) {
      expect(button).toBeDisabled();
    }
  });

  it('keeps strict sRGB rows available when the mapped P3 result is in sRGB', () => {
    updateColorState({ displayColorSpace: 'oklch', gamutSpace: 'p3' });
    const sourceColor = new Color('oklch', [0.05, 0.05, 240]);
    openDrawer({
      hex: '#000006',
      oklch: sourceColor,
      step: '500',
      paletteName: 'Indigo',
      isNeutral: false
    });
    render(ColorInfoDrawer);

    expect(screen.queryByText('Unavailable')).not.toBeInTheDocument();
    expect(screen.queryByText('Out of sRGB gamut')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /hex value unavailable/i })
    ).not.toBeInTheDocument();
  });

  it('shows the swatch-rendered OKLCH value in the drawer', async () => {
    const user = userEvent.setup();
    const preciseOklch = new Color('oklch', [0.94772436, 0.048057, 208.654542]);
    const swatchValue = colorToCssOklchSwatch(preciseOklch);
    const fullPrecisionValue = colorToCssOklch(preciseOklch);
    const swatchRender = render(ColorSwatch, {
      color: '#b9f2ff',
      displayValue: swatchValue,
      label: '500',
      oklchColor: preciseOklch,
      paletteName: 'Cyan',
      isNeutral: false
    });
    const drawerRender = render(ColorInfoDrawer);

    await user.click(swatchRender.container.querySelector('.color-swatch') as HTMLButtonElement);
    await screen.findByRole('dialog');

    const rows = drawerRender.container.querySelectorAll('.color-value-row');
    const oklchRow = Array.from(rows).find((row) =>
      row.querySelector('.color-value-label')?.textContent?.includes('OKLCH')
    );
    const value = oklchRow?.querySelector('.color-value-code')?.textContent ?? '';

    expect(swatchValue).not.toBe(fullPrecisionValue);
    expect(value).toBe(swatchValue);
  });

  it('shows a color preview with the correct background', () => {
    const data = makeDrawerData('#ff0000');
    openDrawer(data);
    const { container } = render(ColorInfoDrawer);

    const preview = container.querySelector('.color-preview') as HTMLElement;
    expect(preview).toBeTruthy();
    expect(preview.style.backgroundColor).toBeTruthy();
  });

  it('updates the preview when gamut changes while drawer is open', async () => {
    updateColorState({ displayColorSpace: 'oklch', gamutSpace: 'p3' });
    const rec2020Only = new Color('oklch', [0.72, 0.32, 155]);
    openDrawer({
      hex: '#00d45f',
      displayValue: 'oklch(72% 0.32 155)',
      oklch: rec2020Only,
      step: '50',
      paletteName: 'Aurora',
      isNeutral: false
    });
    const { container } = render(ColorInfoDrawer);

    const preview = container.querySelector('.color-preview') as HTMLElement;
    const initialStyle = preview.getAttribute('style');
    expect(initialStyle).toBeTruthy();

    updateColorState({ gamutSpace: 'rec2020' });

    await waitFor(() => {
      expect(preview.getAttribute('style')).not.toBe(initialStyle);
    });
  });

  // ── Copy buttons ───────────────────────────────────────────

  it('copies an individual color value when its copy button is clicked', async () => {
    const user = userEvent.setup();
    openDrawer(makeDrawerData());
    render(ColorInfoDrawer);

    const copyButtons = screen.getAllByRole('button', { name: /^copy hex value/i });
    expect(copyButtons.length).toBeGreaterThan(0);

    await user.click(copyButtons[0]);

    expect(copyToClipboard).toHaveBeenCalled();
    expect(announce).toHaveBeenCalledWith(expect.stringMatching(/copied hex value/i));
  });

  it('copies all color values when "Copy All" is clicked', async () => {
    const user = userEvent.setup();
    openDrawer(makeDrawerData());
    render(ColorInfoDrawer);

    const copyAllBtn = screen.getByRole('button', {
      name: /copy all color values to clipboard/i
    });
    await user.click(copyAllBtn);

    expect(copyToClipboard).toHaveBeenCalled();
    expect(announce).toHaveBeenCalledWith(expect.stringMatching(/copied all color values/i));
  });

  // ── Contrast ratios ────────────────────────────────────────

  it('displays low and high reference contrast sections', () => {
    openDrawer(makeDrawerData());
    render(ColorInfoDrawer);

    expect(screen.getByText('Low reference')).toBeInTheDocument();
    expect(screen.getByText('High reference')).toBeInTheDocument();
  });

  it('shows iconized WCAG and APCA badges for both contrast rows', () => {
    openDrawer(makeDrawerData());
    render(ColorInfoDrawer);

    const threeToOneBadges = screen.getAllByText('3:1');
    const aaBadges = screen.getAllByText('AA');
    const aaaBadges = screen.getAllByText('AAA');
    const largeBadges = screen.getAllByText('Large');
    const fluentBadges = screen.getAllByText('Fluent');
    const bodyBadges = screen.getAllByText('Body');
    const labeledBadges = screen.getAllByLabelText(
      /(Low|High) contrast (WCAG 2.1|WCAG 2.2|APCA) (3 to 1|AA|AAA|Large|Fluent|Body) (pass|fail)/
    );

    expect(threeToOneBadges).toHaveLength(2);
    expect(aaBadges).toHaveLength(2);
    expect(aaaBadges).toHaveLength(2);
    expect(largeBadges).toHaveLength(2);
    expect(fluentBadges).toHaveLength(2);
    expect(bodyBadges).toHaveLength(2);
    expect(labeledBadges).toHaveLength(12);
  });

  it('shows WCAG ratios in N:1 format and APCA values in Lc format', () => {
    openDrawer(makeDrawerData());
    const { container } = render(ColorInfoDrawer);

    const ratios = container.querySelectorAll('.contrast-ratio');
    expect(ratios).toHaveLength(4);

    const wcagRatios = Array.from(ratios).filter((el) => el.textContent?.includes(':1'));
    const apcaRatios = Array.from(ratios).filter((el) => el.textContent?.includes('Lc'));
    expect(wcagRatios).toHaveLength(2);
    expect(apcaRatios).toHaveLength(2);
  });

  // ── Close behaviour ────────────────────────────────────────

  it('closes the drawer when the close button is clicked', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    openDrawer(makeDrawerData());
    render(ColorInfoDrawer);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /close color info drawer/i });
    await user.click(closeBtn);
    await vi.advanceTimersByTimeAsync(300);

    expect(get(drawerIsOpen)).toBe(false);
    expect(announce).toHaveBeenCalledWith('Color info drawer closed');
    vi.useRealTimers();
  });

  it('closes the drawer when Escape is pressed', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    openDrawer(makeDrawerData());
    render(ColorInfoDrawer);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await vi.advanceTimersByTimeAsync(300);

    expect(get(drawerIsOpen)).toBe(false);
    expect(announce).toHaveBeenCalledWith('Color info drawer closed');
    vi.useRealTimers();
  });

  // ── Accessibility ──────────────────────────────────────────

  it('has aria-modal and aria-labelledby on the dialog', () => {
    openDrawer(makeDrawerData());
    render(ColorInfoDrawer);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'drawer-title');
  });

  it('provides an accessible label on the color preview', () => {
    openDrawer(makeDrawerData());
    render(ColorInfoDrawer);

    expect(screen.getByRole('img', { name: /color preview/i })).toBeInTheDocument();
  });

  it('renders a backdrop when the drawer is open', () => {
    openDrawer(makeDrawerData());
    const { container } = render(ColorInfoDrawer);

    expect(container.querySelector('.drawer-backdrop')).toBeInTheDocument();
  });
});
