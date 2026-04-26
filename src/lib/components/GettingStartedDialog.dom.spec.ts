import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it } from 'vitest';

import { HELP_RESOURCES } from '$lib/help/helpContent';
import { closeGettingStartedGuide, gettingStartedDialog } from '$lib/help/helpDialogStore';
import AppHeader from './AppHeader.svelte';
import GettingStartedDialog from './GettingStartedDialog.svelte';

describe('GettingStartedDialog', () => {
  beforeEach(() => {
    closeGettingStartedGuide();
  });

  it('opens from the header Help trigger with an accessible dialog name', async () => {
    const user = userEvent.setup();
    render(AppHeader);
    render(GettingStartedDialog);

    await user.click(screen.getByRole('button', { name: /open getting started guide/i }));

    expect(await screen.findByRole('dialog', { name: /getting started/i })).toBeInTheDocument();
  });

  it('includes core help topics and external resource links', async () => {
    const user = userEvent.setup();
    render(AppHeader);
    render(GettingStartedDialog);

    await user.click(screen.getByRole('button', { name: /open getting started guide/i }));

    await screen.findByRole('dialog', { name: /getting started/i });

    expect(screen.getAllByText(/OKLCH/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Bezier/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/WCAG/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/APCA/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/warmth/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/saturation/i).length).toBeGreaterThan(0);

    for (const resource of HELP_RESOURCES) {
      const link = screen.getByRole('link', { name: resource.title });
      expect(link).toHaveAttribute('href', resource.url);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer');
    }
  });

  it('closes with the visible close button and returns focus to the opener', async () => {
    const user = userEvent.setup();
    render(AppHeader);
    render(GettingStartedDialog);

    const opener = screen.getByRole('button', { name: /open getting started guide/i });
    await user.click(opener);
    await screen.findByRole('dialog', { name: /getting started/i });

    await user.click(screen.getByRole('button', { name: /close getting started guide/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /getting started/i })).not.toBeInTheDocument();
    });
    expect(opener).toHaveFocus();
  });

  it('closes with Escape and returns focus to the opener', async () => {
    const user = userEvent.setup();
    render(AppHeader);
    render(GettingStartedDialog);

    const opener = screen.getByRole('button', { name: /open getting started guide/i });
    await user.click(opener);
    await screen.findByRole('dialog', { name: /getting started/i });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /getting started/i })).not.toBeInTheDocument();
    });
    expect(opener).toHaveFocus();
  });

  it('updates shared dialog state when closed', async () => {
    const user = userEvent.setup();
    render(AppHeader);
    render(GettingStartedDialog);

    await user.click(screen.getByRole('button', { name: /open getting started guide/i }));
    expect(await screen.findByRole('dialog', { name: /getting started/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close getting started guide/i }));

    await waitFor(() => {
      expect(get(gettingStartedDialog).open).toBe(false);
    });
  });
});
