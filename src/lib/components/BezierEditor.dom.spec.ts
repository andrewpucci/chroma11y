import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import BezierEditor from '$lib/components/BezierEditor.svelte';

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

      expect(p1).toHaveAttribute('aria-valuenow', '0.16');
      expect(p1).toHaveAttribute('aria-valuemin', '0');
      expect(p1).toHaveAttribute('aria-valuemax', '1');

      expect(p2).toHaveAttribute('aria-valuenow', '0.28');
    });

    it('displays coordinate readout with current values', () => {
      render(BezierEditor, {
        props: {
          x1: 0.16,
          y1: 0.0,
          x2: 0.28,
          y2: 0.38
        }
      });

      expect(screen.getByText('P1(0.16, 0.00)')).toBeInTheDocument();
      expect(screen.getByText('P2(0.28, 0.38)')).toBeInTheDocument();
    });

    it('renders axis labels', () => {
      render(BezierEditor);

      expect(screen.getByText('Time')).toBeInTheDocument();
      expect(screen.getByText('Progression')).toBeInTheDocument();
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

      expect(screen.getByText('P1(0.50, 0.50)')).toBeInTheDocument();

      const p1 = screen.getByRole('slider', { name: /control point p1/i });
      await user.tab();
      expect(p1).toHaveFocus();

      // Arrow right increases x1
      await user.keyboard('{ArrowRight}');
      expect(screen.getByText('P1(0.51, 0.50)')).toBeInTheDocument();

      // Arrow left decreases x1
      await user.keyboard('{ArrowLeft}');
      expect(screen.getByText('P1(0.50, 0.50)')).toBeInTheDocument();

      // Arrow up increases y1
      await user.keyboard('{ArrowUp}');
      expect(screen.getByText('P1(0.50, 0.51)')).toBeInTheDocument();

      // Arrow down decreases y1
      await user.keyboard('{ArrowDown}');
      expect(screen.getByText('P1(0.50, 0.50)')).toBeInTheDocument();
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

      expect(screen.getByText('P2(0.50, 0.50)')).toBeInTheDocument();

      const p2 = screen.getByRole('slider', { name: /control point p2/i });
      await user.tab();
      await user.tab();
      expect(p2).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(screen.getByText('P2(0.51, 0.50)')).toBeInTheDocument();

      await user.keyboard('{ArrowUp}');
      expect(screen.getByText('P2(0.51, 0.51)')).toBeInTheDocument();
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

      // Shift+Arrow uses 0.05 step instead of 0.01
      await user.keyboard('{Shift>}{ArrowRight}{/Shift}');
      expect(screen.getByText('P1(0.55, 0.50)')).toBeInTheDocument();
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

      expect(screen.getByText('P1(0.99, 0.01)')).toBeInTheDocument();

      const p1 = screen.getByRole('slider', { name: /control point p1/i });
      await user.tab();
      expect(p1).toHaveFocus();

      // Try to go beyond 1.0
      await user.keyboard('{ArrowRight}');
      await user.keyboard('{ArrowRight}');
      expect(screen.getByText('P1(1.00, 0.01)')).toBeInTheDocument();

      // Try to go below 0.0
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      expect(screen.getByText('P1(1.00, 0.00)')).toBeInTheDocument();
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

      expect(screen.getByText('P1(0.16, 0.00)')).toBeInTheDocument();
      expect(screen.getByText('P2(0.28, 0.38)')).toBeInTheDocument();
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

      expect(screen.getByText('P1(0.12, 0.99)')).toBeInTheDocument();
    });

    it('accepts default values when no props provided', () => {
      render(BezierEditor);

      expect(screen.getByText('P1(0.00, 0.00)')).toBeInTheDocument();
      expect(screen.getByText('P2(1.00, 1.00)')).toBeInTheDocument();
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

      expect(screen.getByText('P1(0.00, 0.00)')).toBeInTheDocument();
      expect(screen.getByText('P2(0.00, 0.00)')).toBeInTheDocument();
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

      expect(screen.getByText('P1(1.00, 1.00)')).toBeInTheDocument();
      expect(screen.getByText('P2(1.00, 1.00)')).toBeInTheDocument();
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

      expect(screen.getByText('P1(0.50, 0.50)')).toBeInTheDocument();
      expect(screen.getByText('P2(0.50, 0.50)')).toBeInTheDocument();
    });
  });
});
