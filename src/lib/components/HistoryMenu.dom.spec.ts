import { fireEvent, render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import HistoryMenu from './HistoryMenu.svelte';

describe('HistoryMenu', () => {
  it('opens the menu and selects an entry', async () => {
    expect.assertions(4);
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(HistoryMenu, {
      props: {
        action: 'undo',
        entries: [
          {
            position: 2,
            label: 'Warmth changed',
            displayText: 'Warmth changed',
            timestamp: 1,
            ariaLabel: 'Undo to Warmth changed'
          },
          {
            position: 1,
            label: 'Base color changed',
            displayText: 'Base color changed',
            timestamp: 2,
            ariaLabel: 'Undo to Base color changed'
          }
        ],
        onSelect
      }
    });

    await user.click(screen.getByRole('button', { name: /show undo history/i }));

    const menu = screen.getByRole('menu', { name: /undo history/i });
    expect(menu).toBeInTheDocument();
    expect(within(menu).getAllByRole('menuitem')).toHaveLength(2);

    await user.click(screen.getByRole('menuitem', { name: /undo to warmth changed/i }));

    expect(onSelect).toHaveBeenCalledWith(2);
    expect(screen.queryByRole('menu', { name: /undo history/i })).not.toBeInTheDocument();
  });

  it('supports keyboard navigation within the menu', async () => {
    expect.assertions(2);
    const user = userEvent.setup();

    render(HistoryMenu, {
      props: {
        action: 'redo',
        entries: [
          {
            position: 1,
            label: 'Base color changed',
            displayText: 'Base color changed',
            timestamp: 1,
            ariaLabel: 'Redo to Base color changed'
          },
          {
            position: 2,
            label: 'Warmth changed',
            displayText: 'Warmth changed',
            timestamp: 2,
            ariaLabel: 'Redo to Warmth changed'
          }
        ],
        onSelect: vi.fn()
      }
    });

    await user.click(screen.getByRole('button', { name: /show redo history/i }));

    const menu = screen.getByRole('menu', { name: /redo history/i });
    const menuItems = within(menu).getAllByRole('menuitem');
    expect(menuItems[0]).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(menuItems[1]).toHaveFocus();
  });

  it('closes when a touch-style pointerdown lands outside the menu', async () => {
    expect.assertions(2);
    const user = userEvent.setup();

    render(HistoryMenu, {
      props: {
        action: 'undo',
        entries: [
          {
            position: 1,
            label: 'Base color changed',
            displayText: 'Base color changed',
            timestamp: 1,
            ariaLabel: 'Undo to Base color changed'
          }
        ],
        onSelect: vi.fn()
      }
    });

    await user.click(screen.getByRole('button', { name: /show undo history/i }));
    expect(screen.getByRole('menu', { name: /undo history/i })).toBeInTheDocument();

    await fireEvent.pointerDown(document.body, { pointerType: 'touch' });
    expect(screen.queryByRole('menu', { name: /undo history/i })).not.toBeInTheDocument();
  });
});
