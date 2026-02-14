import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/announce', () => ({
  announce: vi.fn()
}));

import DisplaySettings from '$lib/components/DisplaySettings.svelte';
import {
  displayColorSpace,
  gamutSpace,
  themePreference,
  swatchLabels,
  contrastAlgorithm,
  updateColorState,
  setThemePreference
} from '$lib/stores';
import { announce } from '$lib/announce';

describe('DisplaySettings', () => {
  beforeEach(() => {
    updateColorState({
      displayColorSpace: 'hex',
      gamutSpace: 'srgb',
      swatchLabels: 'both',
      contrastAlgorithm: 'WCAG21'
    });
    setThemePreference('auto');
    vi.mocked(announce).mockClear();
  });

  it('renders all five settings dropdowns with accessible labels', () => {
    render(DisplaySettings);

    expect(screen.getByLabelText('Display color space format')).toBeInTheDocument();
    expect(screen.getByLabelText('Gamut mapping target')).toBeInTheDocument();
    expect(screen.getByLabelText('Theme preference')).toBeInTheDocument();
    expect(screen.getByLabelText('Swatch label display')).toBeInTheDocument();
    expect(screen.getByLabelText('Contrast algorithm')).toBeInTheDocument();
  });

  it('changes display color space and announces', async () => {
    const user = userEvent.setup();
    render(DisplaySettings);

    await user.selectOptions(screen.getByLabelText('Display color space format'), 'oklch');

    expect(get(displayColorSpace)).toBe('oklch');
    expect(announce).toHaveBeenCalledWith('Display color space changed to oklch');
  });

  it('changes gamut space and announces', async () => {
    const user = userEvent.setup();
    render(DisplaySettings);

    await user.selectOptions(screen.getByLabelText('Gamut mapping target'), 'p3');

    expect(get(gamutSpace)).toBe('p3');
    expect(announce).toHaveBeenCalledWith('Gamut mapping changed to Display P3');
  });

  it('changes theme preference and announces', async () => {
    const user = userEvent.setup();
    render(DisplaySettings);

    await user.selectOptions(screen.getByLabelText('Theme preference'), 'dark');

    expect(get(themePreference)).toBe('dark');
    expect(announce).toHaveBeenCalledWith('Theme preference changed to dark');
  });

  it('changes swatch labels and announces', async () => {
    const user = userEvent.setup();
    render(DisplaySettings);

    await user.selectOptions(screen.getByLabelText('Swatch label display'), 'none');

    expect(get(swatchLabels)).toBe('none');
    expect(announce).toHaveBeenCalledWith('Swatch labels changed to hidden');
  });

  it('changes contrast algorithm and announces', async () => {
    const user = userEvent.setup();
    render(DisplaySettings);

    await user.selectOptions(screen.getByLabelText('Contrast algorithm'), 'APCA');

    expect(get(contrastAlgorithm)).toBe('APCA');
    expect(announce).toHaveBeenCalledWith('Contrast algorithm changed to APCA');
  });
});
