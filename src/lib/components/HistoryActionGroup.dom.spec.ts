import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import HistoryActionGroup from './HistoryActionGroup.svelte';

describe('HistoryActionGroup', () => {
  it('calls the primary action handler', async () => {
    expect.assertions(1);
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(HistoryActionGroup, {
      props: {
        action: 'undo',
        onAction,
        onSelect: vi.fn(),
        entries: [
          {
            position: 1,
            label: 'Warmth changed',
            displayText: 'Warmth changed',
            timestamp: 1,
            ariaLabel: 'Undo to Warmth changed'
          }
        ]
      }
    });

    await user.click(screen.getByRole('button', { name: /undo last change/i }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('disables both controls when disabled', () => {
    expect.assertions(2);
    render(HistoryActionGroup, {
      props: {
        action: 'redo',
        disabled: true,
        onAction: vi.fn(),
        onSelect: vi.fn(),
        entries: []
      }
    });

    expect(screen.getByRole('button', { name: /redo last change/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /show redo history/i })).toBeDisabled();
  });
});
