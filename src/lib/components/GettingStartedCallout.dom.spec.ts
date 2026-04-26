import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { GETTING_STARTED_CALLOUT_STORAGE_KEY } from '$lib/help/helpContent';
import { closeGettingStartedGuide } from '$lib/help/helpDialogStore';
import GettingStartedCallout from './GettingStartedCallout.svelte';
import GettingStartedDialog from './GettingStartedDialog.svelte';

describe('GettingStartedCallout', () => {
  beforeEach(() => {
    window.localStorage.clear();
    closeGettingStartedGuide();
  });

  it('renders when not dismissed', async () => {
    render(GettingStartedCallout);

    expect(await screen.findByTestId('getting-started-callout')).toBeInTheDocument();
  });

  it('opens the Getting Started guide', async () => {
    const user = userEvent.setup();
    render(GettingStartedCallout);
    render(GettingStartedDialog);

    await user.click(await screen.findByRole('button', { name: 'Getting Started' }));

    expect(await screen.findByRole('dialog', { name: /getting started/i })).toBeInTheDocument();
  });

  it('dismisses and persists dismissal in localStorage', async () => {
    const user = userEvent.setup();
    render(GettingStartedCallout);

    await user.click(await screen.findByRole('button', { name: 'Dismiss' }));

    await waitFor(() => {
      expect(screen.queryByTestId('getting-started-callout')).not.toBeInTheDocument();
    });
    expect(window.localStorage.getItem(GETTING_STARTED_CALLOUT_STORAGE_KEY)).toBe('true');
  });

  it('remains hidden after dismissal', async () => {
    window.localStorage.setItem(GETTING_STARTED_CALLOUT_STORAGE_KEY, 'true');

    render(GettingStartedCallout);

    await waitFor(() => {
      expect(screen.queryByTestId('getting-started-callout')).not.toBeInTheDocument();
    });
  });
});
