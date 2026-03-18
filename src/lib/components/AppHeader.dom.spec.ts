import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import AppHeader from './AppHeader.svelte';

describe('AppHeader', () => {
  it('renders componentized undo and redo controls and wires handlers', async () => {
    expect.assertions(4);
    const user = userEvent.setup();
    const onUndo = vi.fn();
    const onRedo = vi.fn();

    render(AppHeader, {
      props: {
        canUndo: true,
        canRedo: true,
        undoEntries: [
          {
            position: 1,
            label: 'Base color changed',
            displayText: 'Base color changed',
            timestamp: 1,
            ariaLabel: 'Undo to Base color changed'
          }
        ],
        redoEntries: [
          {
            position: 2,
            label: 'Warmth changed',
            displayText: 'Warmth changed',
            timestamp: 2,
            ariaLabel: 'Redo to Warmth changed'
          }
        ],
        onUndo,
        onRedo,
        onUndoJump: vi.fn(),
        onRedoJump: vi.fn()
      }
    });

    await user.click(screen.getByRole('button', { name: /undo last change/i }));
    await user.click(screen.getByRole('button', { name: /redo last change/i }));

    expect(screen.getByLabelText(/history controls/i)).toBeInTheDocument();
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onRedo).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /show undo history/i })).toBeInTheDocument();
  });
});
