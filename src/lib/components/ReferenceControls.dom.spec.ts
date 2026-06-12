import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/announce', () => ({
  announce: vi.fn()
}));

import ReferenceControls from '$lib/components/ReferenceControls.svelte';
import { announce } from '$lib/announce';
import {
  colorStore,
  pinReferenceConfiguration,
  referenceConfiguration,
  resetColorState,
  updateColorState
} from '$lib/stores';

describe('ReferenceControls', () => {
  beforeEach(() => {
    resetColorState('light');
  });

  describe('when no reference is pinned', () => {
    it('shows only the Pin Reference button', () => {
      expect.assertions(3);
      render(ReferenceControls);

      expect(
        screen.getByRole('button', {
          name: /pin current palette configuration as reference for side-by-side comparison/i
        })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /replace reference configuration/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /restore reference configuration/i })
      ).not.toBeInTheDocument();
    });

    it('announces when the current palette is pinned as the reference configuration', async () => {
      expect.assertions(1);
      const user = userEvent.setup();

      render(ReferenceControls);

      await user.click(
        screen.getByRole('button', {
          name: /pin current palette configuration as reference for side-by-side comparison/i
        })
      );

      expect(announce).toHaveBeenCalledWith('Reference configuration pinned');
    });
  });

  describe('when a reference is pinned', () => {
    beforeEach(() => {
      pinReferenceConfiguration();
    });

    it('shows the Replace Reference button', () => {
      expect.assertions(1);
      render(ReferenceControls);

      expect(
        screen.getByRole('button', {
          name: /replace reference configuration with current palette/i
        })
      ).toBeInTheDocument();
    });

    it('shows the Restore Reference button', () => {
      expect.assertions(1);
      render(ReferenceControls);

      expect(
        screen.getByRole('button', {
          name: /restore reference configuration into current palette/i
        })
      ).toBeInTheDocument();
    });

    it('does not show Pin Reference button', () => {
      expect.assertions(1);
      render(ReferenceControls);

      expect(
        screen.queryByRole('button', {
          name: /pin current palette configuration as reference for side-by-side comparison/i
        })
      ).not.toBeInTheDocument();
    });

    it('calls replaceReferenceConfiguration when Replace Reference is clicked', async () => {
      expect.assertions(1);
      const user = userEvent.setup();
      const spy = vi.spyOn(await import('$lib/stores'), 'replaceReferenceConfiguration');

      render(ReferenceControls);

      await user.click(
        screen.getByRole('button', {
          name: /replace reference configuration with current palette/i
        })
      );

      expect(spy).toHaveBeenCalledTimes(1);
      spy.mockRestore();
    });

    it('updates the reference to the current palette state when Replace Reference is clicked', async () => {
      expect.assertions(2);
      const user = userEvent.setup();

      // Pin with current baseColor (#5EF784 from light defaults)
      const pinnedBaseColor = get(colorStore).baseColor;

      // Change the base color so it differs from the pinned one
      updateColorState({ baseColor: '#FF0000' });

      render(ReferenceControls);

      const refBefore = get(referenceConfiguration);
      expect(refBefore?.baseColor).toBe(pinnedBaseColor);

      await user.click(
        screen.getByRole('button', {
          name: /replace reference configuration with current palette/i
        })
      );

      const refAfter = get(referenceConfiguration);
      expect(refAfter?.baseColor).toBe('#FF0000');
    });

    it('calls restoreReferenceConfiguration when Restore Reference is clicked', async () => {
      expect.assertions(1);
      const user = userEvent.setup();
      const spy = vi.spyOn(await import('$lib/stores'), 'restoreReferenceConfiguration');

      render(ReferenceControls);

      await user.click(
        screen.getByRole('button', {
          name: /restore reference configuration into current palette/i
        })
      );

      expect(spy).toHaveBeenCalledTimes(1);
      spy.mockRestore();
    });

    it('restores the pinned base color into current palette when Restore Reference is clicked', async () => {
      expect.assertions(2);
      const user = userEvent.setup();

      const pinnedBaseColor = get(colorStore).baseColor;

      // Change the base color after pinning
      updateColorState({ baseColor: '#FF0000' });
      expect(get(colorStore).baseColor).toBe('#FF0000');

      render(ReferenceControls);

      await user.click(
        screen.getByRole('button', {
          name: /restore reference configuration into current palette/i
        })
      );

      // After restore, current palette should reflect the pinned base color
      expect(get(colorStore).baseColor).toBe(pinnedBaseColor);
    });

    it('keeps the reference pinned after restoring', async () => {
      expect.assertions(1);
      const user = userEvent.setup();

      render(ReferenceControls);

      await user.click(
        screen.getByRole('button', {
          name: /restore reference configuration into current palette/i
        })
      );

      expect(get(referenceConfiguration)).not.toBeNull();
    });

    it('announces replace, restore, and clear reference actions', async () => {
      expect.assertions(3);
      const user = userEvent.setup();

      render(ReferenceControls);

      await user.click(
        screen.getByRole('button', {
          name: /replace reference configuration with current palette/i
        })
      );
      expect(announce).toHaveBeenCalledWith('Reference configuration replaced');

      await user.click(
        screen.getByRole('button', {
          name: /restore reference configuration into current palette/i
        })
      );
      expect(announce).toHaveBeenCalledWith('Reference configuration restored');

      await user.click(
        screen.getByRole('button', {
          name: /clear reference configuration and return to default view/i
        })
      );
      expect(announce).toHaveBeenCalledWith('Reference configuration cleared');
    });
  });
});
