import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import BezierEditor from '$lib/components/BezierEditor.svelte';

function getCoordinateInput(label: RegExp): HTMLInputElement {
  return screen.getByLabelText(label) as HTMLInputElement;
}

function expectCoordinates(expected: { p1x: number; p1y: number; p2x: number; p2y: number }) {
  expect(parseFloat(getCoordinateInput(/p1 x coordinate/i).value)).toBeCloseTo(expected.p1x, 2);
  expect(parseFloat(getCoordinateInput(/p1 y coordinate/i).value)).toBeCloseTo(expected.p1y, 2);
  expect(parseFloat(getCoordinateInput(/p2 x coordinate/i).value)).toBeCloseTo(expected.p2x, 2);
  expect(parseFloat(getCoordinateInput(/p2 y coordinate/i).value)).toBeCloseTo(expected.p2y, 2);
}

describe('BezierEditor', () => {
  describe('Rendering', () => {
    it('renders the SVG canvas with proper structure', () => {
      render(BezierEditor, {
        props: {
          x1: 0.16,
          y1: 0.0,
          x2: 0.28,
          y2: 0.38
        }
      });

      const svg = screen.getByRole('group', { name: /bezier curve editor/i });
      expect(svg).toBeInTheDocument();
      expect(svg.tagName).toBe('svg');
    });

    it('renders both control points with correct ARIA attributes', () => {
      render(BezierEditor, {
        props: {
          x1: 0.16,
          y1: 0.0,
          x2: 0.28,
          y2: 0.38
        }
      });

      const p1 = screen.getByRole('slider', { name: /control point p1/i });
      const p2 = screen.getByRole('slider', { name: /control point p2/i });

      expect(p1).toBeInTheDocument();
      expect(p2).toBeInTheDocument();
      expect(p1.tagName).toBe('rect');
      expect(p2.tagName).toBe('rect');
      expect(p1).toHaveAttribute('width', '24');
      expect(p1).toHaveAttribute('height', '24');
      expect(p2).toHaveAttribute('width', '24');
      expect(p2).toHaveAttribute('height', '24');

      expect(p1).toHaveAttribute('aria-valuenow', '0.16');
      expect(p1).toHaveAttribute('aria-valuemin', '0');
      expect(p1).toHaveAttribute('aria-valuemax', '1');

      expect(p2).toHaveAttribute('aria-valuenow', '0.28');
    });

    it('renders coordinate inputs with current values', () => {
      render(BezierEditor, {
        props: {
          x1: 0.16,
          y1: 0.0,
          x2: 0.28,
          y2: 0.38
        }
      });

      expectCoordinates({ p1x: 0.16, p1y: 0, p2x: 0.28, p2y: 0.38 });
    });

    it('renders axis labels', () => {
      render(BezierEditor);

      expect(screen.getByText('Step')).toBeInTheDocument();
      expect(screen.getByText('Lightness')).toBeInTheDocument();
    });
  });

  describe('Keyboard Interaction', () => {
    it('moves P1 with arrow keys', async () => {
      const user = userEvent.setup();
      render(BezierEditor, {
        props: {
          x1: 0.5,
          y1: 0.5,
          x2: 0.5,
          y2: 0.5
        }
      });

      expectCoordinates({ p1x: 0.5, p1y: 0.5, p2x: 0.5, p2y: 0.5 });

      const p1 = screen.getByRole('slider', { name: /control point p1/i });
      await user.tab();
      expect(p1).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expectCoordinates({ p1x: 0.51, p1y: 0.5, p2x: 0.5, p2y: 0.5 });

      await user.keyboard('{ArrowLeft}');
      expectCoordinates({ p1x: 0.5, p1y: 0.5, p2x: 0.5, p2y: 0.5 });

      await user.keyboard('{ArrowUp}');
      expectCoordinates({ p1x: 0.5, p1y: 0.51, p2x: 0.5, p2y: 0.5 });

      await user.keyboard('{ArrowDown}');
      expectCoordinates({ p1x: 0.5, p1y: 0.5, p2x: 0.5, p2y: 0.5 });
    });

    it('moves P2 with arrow keys', async () => {
      const user = userEvent.setup();
      render(BezierEditor, {
        props: {
          x1: 0.5,
          y1: 0.5,
          x2: 0.5,
          y2: 0.5
        }
      });

      expectCoordinates({ p1x: 0.5, p1y: 0.5, p2x: 0.5, p2y: 0.5 });

      const p2 = screen.getByRole('slider', { name: /control point p2/i });
      await user.tab();
      await user.tab();
      expect(p2).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expectCoordinates({ p1x: 0.5, p1y: 0.5, p2x: 0.51, p2y: 0.5 });

      await user.keyboard('{ArrowUp}');
      expectCoordinates({ p1x: 0.5, p1y: 0.5, p2x: 0.51, p2y: 0.51 });
    });

    it('uses larger step size with Shift key', async () => {
      const user = userEvent.setup();
      render(BezierEditor, {
        props: {
          x1: 0.5,
          y1: 0.5,
          x2: 0.5,
          y2: 0.5
        }
      });

      const p1 = screen.getByRole('slider', { name: /control point p1/i });
      await user.tab();
      expect(p1).toHaveFocus();

      await user.keyboard('{Shift>}{ArrowRight}{/Shift}');
      expectCoordinates({ p1x: 0.55, p1y: 0.5, p2x: 0.5, p2y: 0.5 });
    });

    it('clamps values to 0-1 range with keyboard', async () => {
      const user = userEvent.setup();
      render(BezierEditor, {
        props: {
          x1: 0.99,
          y1: 0.01,
          x2: 0.5,
          y2: 0.5
        }
      });

      expectCoordinates({ p1x: 0.99, p1y: 0.01, p2x: 0.5, p2y: 0.5 });

      const p1 = screen.getByRole('slider', { name: /control point p1/i });
      await user.tab();
      expect(p1).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      await user.keyboard('{ArrowRight}');
      expectCoordinates({ p1x: 1, p1y: 0.01, p2x: 0.5, p2y: 0.5 });

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      expectCoordinates({ p1x: 1, p1y: 0, p2x: 0.5, p2y: 0.5 });
    });

    it('allows tabbing between control points', async () => {
      const user = userEvent.setup();
      render(BezierEditor);

      const p1 = screen.getByRole('slider', { name: /control point p1/i });
      const p2 = screen.getByRole('slider', { name: /control point p2/i });

      await user.tab();
      expect(p1).toHaveFocus();

      await user.tab();
      expect(p2).toHaveFocus();
    });
  });

  describe('Value Binding', () => {
    it('displays initial prop values correctly', () => {
      render(BezierEditor, {
        props: {
          x1: 0.16,
          y1: 0.0,
          x2: 0.28,
          y2: 0.38
        }
      });

      expectCoordinates({ p1x: 0.16, p1y: 0, p2x: 0.28, p2y: 0.38 });
    });

    it('rounds values to 2 decimal places', () => {
      render(BezierEditor, {
        props: {
          x1: 0.123456,
          y1: 0.987654,
          x2: 0.5,
          y2: 0.5
        }
      });

      expectCoordinates({ p1x: 0.12, p1y: 0.99, p2x: 0.5, p2y: 0.5 });
    });

    it('accepts default values when no props provided', () => {
      render(BezierEditor);

      expectCoordinates({ p1x: 0, p1y: 0, p2x: 1, p2y: 1 });
    });
  });

  describe('Coordinate Inputs', () => {
    it('renders inline coordinate inputs for both points', () => {
      render(BezierEditor);

      expect(screen.getByLabelText(/p1 x coordinate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/p1 y coordinate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/p2 x coordinate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/p2 y coordinate/i)).toBeInTheDocument();
    });

    it('updates slider aria-valuetext when editing coordinate input', async () => {
      render(BezierEditor, {
        props: {
          x1: 0.16,
          y1: 0.0,
          x2: 0.28,
          y2: 0.38
        }
      });

      const p1XInput = getCoordinateInput(/p1 x coordinate/i);
      const p1Slider = screen.getByRole('slider', { name: /control point p1/i });

      await fireEvent.input(p1XInput, { target: { value: '0.42' } });

      expectCoordinates({ p1x: 0.42, p1y: 0, p2x: 0.28, p2y: 0.38 });
      expect(p1Slider).toHaveAttribute('aria-valuenow', '0.42');
      expect(p1Slider).toHaveAttribute('aria-valuetext', 'x=0.42, y=0.00');
    });

    it('clamps coordinate input values to valid 0-1 range', async () => {
      render(BezierEditor, {
        props: {
          x1: 0.5,
          y1: 0.5,
          x2: 0.5,
          y2: 0.5
        }
      });

      const p2XInput = getCoordinateInput(/p2 x coordinate/i);
      const p2YInput = getCoordinateInput(/p2 y coordinate/i);

      await fireEvent.input(p2XInput, { target: { value: '1.7' } });
      await fireEvent.input(p2YInput, { target: { value: '-0.4' } });

      expectCoordinates({ p1x: 0.5, p1y: 0.5, p2x: 1, p2y: 0 });
    });

    it('restores displayed value on blur after clearing input', async () => {
      render(BezierEditor, {
        props: {
          x1: 0.16,
          y1: 0.0,
          x2: 0.28,
          y2: 0.38
        }
      });

      const p1XInput = getCoordinateInput(/p1 x coordinate/i);
      const p1Slider = screen.getByRole('slider', { name: /control point p1/i });

      await fireEvent.input(p1XInput, { target: { value: '' } });
      expect(p1XInput.value).toBe('');

      await fireEvent.blur(p1XInput);

      expect(p1XInput.value).toBe('0.16');
      expect(p1Slider).toHaveAttribute('aria-valuenow', '0.16');
      expect(p1Slider).toHaveAttribute('aria-valuetext', 'x=0.16, y=0.00');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA roles and labels', () => {
      render(BezierEditor, {
        props: {
          x1: 0.16,
          y1: 0.0,
          x2: 0.28,
          y2: 0.38
        }
      });

      const svg = screen.getByRole('group', { name: /bezier curve editor/i });
      expect(svg).toHaveAttribute('role', 'group');

      const p1 = screen.getByRole('slider', { name: /control point p1/i });
      expect(p1).toHaveAttribute('aria-valuetext', 'x=0.16, y=0.00');

      const p2 = screen.getByRole('slider', { name: /control point p2/i });
      expect(p2).toHaveAttribute('aria-valuetext', 'x=0.28, y=0.38');
    });

    it('control points are keyboard focusable', () => {
      render(BezierEditor);

      const p1 = screen.getByRole('slider', { name: /control point p1/i });
      const p2 = screen.getByRole('slider', { name: /control point p2/i });

      expect(p1).toHaveAttribute('tabindex', '0');
      expect(p2).toHaveAttribute('tabindex', '0');
    });
  });

  describe('Edge Cases', () => {
    it('handles extreme values (0, 0, 0, 0)', () => {
      render(BezierEditor, {
        props: {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0
        }
      });

      expectCoordinates({ p1x: 0, p1y: 0, p2x: 0, p2y: 0 });
    });

    it('handles extreme values (1, 1, 1, 1)', () => {
      render(BezierEditor, {
        props: {
          x1: 1,
          y1: 1,
          x2: 1,
          y2: 1
        }
      });

      expectCoordinates({ p1x: 1, p1y: 1, p2x: 1, p2y: 1 });
    });

    it('handles mid-range values', () => {
      render(BezierEditor, {
        props: {
          x1: 0.5,
          y1: 0.5,
          x2: 0.5,
          y2: 0.5
        }
      });

      expectCoordinates({ p1x: 0.5, p1y: 0.5, p2x: 0.5, p2y: 0.5 });
    });
  });
});
