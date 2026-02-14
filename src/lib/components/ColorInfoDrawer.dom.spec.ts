import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Color from 'colorjs.io';
import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { openDrawer, closeDrawer, drawerIsOpen } from '$lib/drawerStore';
import { resetColorState } from '$lib/stores';

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
import { copyToClipboard } from '$lib/colorUtils';
import ColorInfoDrawer from '$lib/components/ColorInfoDrawer.svelte';

/** Helper: build a DrawerColorData payload for a given hex */
function makeDrawerData(hex = '#5a95ff', step = '500', paletteName = 'Blue') {
  const oklch = new Color(hex).to('oklch');
  return { hex, oklch, step, paletteName, isNeutral: false };
}

describe('ColorInfoDrawer', () => {
  beforeEach(() => {
    resetColorState('light');
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

  it('shows a color preview with the correct background', () => {
    const data = makeDrawerData('#ff0000');
    openDrawer(data);
    const { container } = render(ColorInfoDrawer);

    const preview = container.querySelector('.color-preview') as HTMLElement;
    expect(preview).toBeTruthy();
    expect(preview.style.backgroundColor).toBeTruthy();
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

  it('displays low step and high step contrast sections', () => {
    openDrawer(makeDrawerData());
    render(ColorInfoDrawer);

    expect(screen.getByText('Low step')).toBeInTheDocument();
    expect(screen.getByText('High step')).toBeInTheDocument();
  });

  it('shows AA and AAA badges for both contrast rows', () => {
    openDrawer(makeDrawerData());
    render(ColorInfoDrawer);

    const aaBadges = screen.getAllByText(/^AA /);
    const aaaBadges = screen.getAllByText(/^AAA /);

    expect(aaBadges).toHaveLength(2);
    expect(aaaBadges).toHaveLength(2);
  });

  it('shows contrast ratio values in N:1 format', () => {
    openDrawer(makeDrawerData());
    const { container } = render(ColorInfoDrawer);

    const ratios = container.querySelectorAll('.contrast-ratio');
    expect(ratios).toHaveLength(2);
    for (const el of ratios) {
      expect(el.textContent).toMatch(/\d+(\.\d+)?:1/);
    }
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
