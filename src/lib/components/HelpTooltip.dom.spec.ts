import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import HelpTooltip from './HelpTooltip.svelte';

const DEFAULT_VIEWPORT_WIDTH = window.innerWidth;
const DEFAULT_VIEWPORT_HEIGHT = window.innerHeight;

interface RectInit {
  x: number;
  y: number;
  width: number;
  height: number;
}

function createRect({ x, y, width, height }: RectInit): DOMRect {
  return {
    x,
    y,
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    toJSON: () => undefined
  } as DOMRect;
}

function mockElementRect(element: Element, rect: RectInit): void {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(createRect(rect));

  Object.defineProperties(element, {
    offsetWidth: {
      configurable: true,
      value: rect.width
    },
    offsetHeight: {
      configurable: true,
      value: rect.height
    },
    clientWidth: {
      configurable: true,
      value: rect.width
    },
    clientHeight: {
      configurable: true,
      value: rect.height
    }
  });
}

function setViewportSize(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width
  });

  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: height
  });

  Object.defineProperty(document.documentElement, 'clientWidth', {
    configurable: true,
    value: width
  });

  Object.defineProperty(document.documentElement, 'clientHeight', {
    configurable: true,
    value: height
  });
}

afterEach(() => {
  vi.restoreAllMocks();

  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: DEFAULT_VIEWPORT_WIDTH
  });

  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: DEFAULT_VIEWPORT_HEIGHT
  });

  Object.defineProperty(document.documentElement, 'clientWidth', {
    configurable: true,
    value: DEFAULT_VIEWPORT_WIDTH
  });

  Object.defineProperty(document.documentElement, 'clientHeight', {
    configurable: true,
    value: DEFAULT_VIEWPORT_HEIGHT
  });
});

describe('HelpTooltip', () => {
  it('renders an accessible trigger associated with tooltip content', () => {
    render(HelpTooltip, {
      props: {
        id: 'test-help',
        label: 'Explain test control',
        text: 'Short explanatory help text.'
      }
    });

    const trigger = screen.getByRole('button', { name: 'Explain test control' });
    const tooltip = screen.getByRole('tooltip', { hidden: true });

    expect(trigger).toHaveAttribute('aria-describedby', 'test-help');
    expect(tooltip).toHaveAttribute('id', 'test-help');
  });

  it('opens on focus and closes on blur', async () => {
    render(HelpTooltip, {
      props: {
        id: 'focus-help',
        label: 'Explain focus control',
        text: 'Focus help text.'
      }
    });

    const trigger = screen.getByRole('button', { name: 'Explain focus control' });

    await fireEvent.focus(trigger);
    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeVisible();
    });

    await fireEvent.blur(trigger);
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute('hidden');
  });

  it('opens on pointer hover and closes on pointer leave', async () => {
    render(HelpTooltip, {
      props: {
        id: 'hover-help',
        label: 'Explain hover control',
        text: 'Hover help text.'
      }
    });

    const trigger = screen.getByRole('button', { name: 'Explain hover control' });

    await fireEvent.pointerEnter(trigger);
    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeVisible();
    });

    await fireEvent.pointerLeave(trigger);
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute('hidden');
  });

  it('closes on Escape', async () => {
    render(HelpTooltip, {
      props: {
        id: 'escape-help',
        label: 'Explain escape control',
        text: 'Escape help text.'
      }
    });

    const trigger = screen.getByRole('button', { name: 'Explain escape control' });
    await fireEvent.focus(trigger);
    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeVisible();
    });

    await fireEvent.keyDown(trigger, { key: 'Escape' });

    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute('hidden');
  });

  it('keeps tooltip content non-interactive', async () => {
    render(HelpTooltip, {
      props: {
        id: 'plain-help',
        label: 'Explain plain control',
        text: 'Plain text only.'
      }
    });

    const trigger = screen.getByRole('button', { name: 'Explain plain control' });
    await fireEvent.focus(trigger);
    const tooltip = screen.getByRole('tooltip');
    const focusable = within(tooltip).queryAllByRole('button');

    expect(focusable).toHaveLength(0);
    expect(
      tooltip.querySelectorAll('a, input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).toHaveLength(0);
  });

  it('keeps a left-edge tooltip inside the viewport', async () => {
    setViewportSize(320, 240);

    render(HelpTooltip, {
      props: {
        id: 'left-edge-help',
        label: 'Explain left edge control',
        text: 'Left edge help text.'
      }
    });

    const trigger = screen.getByRole('button', { name: 'Explain left edge control' });
    const tooltip = screen.getByRole('tooltip', { hidden: true });

    mockElementRect(trigger, {
      x: 0,
      y: 96,
      width: 24,
      height: 24
    });

    mockElementRect(tooltip, {
      x: 0,
      y: 0,
      width: 200,
      height: 44
    });

    await fireEvent.focus(trigger);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeVisible();
      expect(Number.parseFloat(tooltip.style.left)).toBeGreaterThanOrEqual(8);
      expect(Number.parseFloat(tooltip.style.left) + 200).toBeLessThanOrEqual(320);
    });
  });

  it('keeps a right-edge tooltip inside the viewport', async () => {
    setViewportSize(320, 240);

    render(HelpTooltip, {
      props: {
        id: 'right-edge-help',
        label: 'Explain right edge control',
        text: 'Right edge help text.'
      }
    });

    const trigger = screen.getByRole('button', { name: 'Explain right edge control' });
    const tooltip = screen.getByRole('tooltip', { hidden: true });

    mockElementRect(trigger, {
      x: 296,
      y: 96,
      width: 24,
      height: 24
    });

    mockElementRect(tooltip, {
      x: 0,
      y: 0,
      width: 200,
      height: 44
    });

    await fireEvent.focus(trigger);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeVisible();
      const left = Number.parseFloat(tooltip.style.left);

      expect(left).toBeGreaterThanOrEqual(8);
      expect(left + 200).toBeLessThanOrEqual(320);
    });
  });

  it('flips below the trigger when there is not enough room above', async () => {
    setViewportSize(320, 120);

    render(HelpTooltip, {
      props: {
        id: 'flip-help',
        label: 'Explain flip control',
        text: 'Flip help text.'
      }
    });

    const trigger = screen.getByRole('button', { name: 'Explain flip control' });
    const tooltip = screen.getByRole('tooltip', { hidden: true });

    mockElementRect(trigger, {
      x: 48,
      y: 10,
      width: 24,
      height: 24
    });

    mockElementRect(tooltip, {
      x: 0,
      y: 0,
      width: 180,
      height: 44
    });

    await fireEvent.focus(trigger);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeVisible();
      expect(Number.parseFloat(tooltip.style.top)).toBeGreaterThan(34);
    });
  });
});
