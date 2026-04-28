import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import SplitButton from '$lib/components/SplitButton.svelte';

function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    primaryLabel: 'Download',
    primaryAriaLabel: 'Download file',
    onPrimary: vi.fn(),
    menuLabel: 'More download options',
    menuItems: [
      { id: 'preview', label: 'Preview…', onSelect: vi.fn() },
      { id: 'copy', label: 'Copy', onSelect: vi.fn() }
    ],
    ...overrides
  };
}

function renderSplitButton(props: ReturnType<typeof makeProps>) {
  // Cast to ComponentProps for testing with vi.fn() mocks.
  return render(SplitButton, props as unknown as Record<string, unknown>);
}

describe('SplitButton', () => {
  it('renders the primary action and chevron toggle', () => {
    renderSplitButton(makeProps());
    expect(screen.getByRole('button', { name: 'Download file' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More download options' })).toBeInTheDocument();
  });

  it('invokes onPrimary when the primary action is clicked', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    renderSplitButton(props);

    await user.click(screen.getByRole('button', { name: 'Download file' }));
    expect(props.onPrimary).toHaveBeenCalledTimes(1);
  });

  it('opens the menu and selects an item via click', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    renderSplitButton(props);

    await user.click(screen.getByRole('button', { name: 'More download options' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.click(screen.getByRole('menuitem', { name: 'Copy' }));
    expect(props.menuItems[1].onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes the menu when Escape is pressed and restores focus to the chevron', async () => {
    const user = userEvent.setup();
    renderSplitButton(makeProps());

    const chevron = screen.getByRole('button', { name: 'More download options' });
    await user.click(chevron);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(chevron).toHaveFocus();
  });

  it('moves focus through menu items with ArrowDown / ArrowUp', async () => {
    const user = userEvent.setup();
    renderSplitButton(makeProps());

    await user.click(screen.getByRole('button', { name: 'More download options' }));

    const items = screen.getAllByRole('menuitem');
    expect(items[0]).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(items[1]).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(items[0]).toHaveFocus();

    await user.keyboard('{ArrowUp}');
    expect(items[1]).toHaveFocus();
  });

  it('closes the menu when clicking outside', async () => {
    const user = userEvent.setup();
    renderSplitButton(makeProps());

    await user.click(screen.getByRole('button', { name: 'More download options' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.click(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('disables both buttons when disabled prop is true', () => {
    renderSplitButton(makeProps({ disabled: true }));
    expect(screen.getByRole('button', { name: 'Download file' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'More download options' })).toBeDisabled();
  });
});
