import { fireEvent, render, screen } from '@testing-library/svelte';
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
  oklchDisplaySignificantDigits,
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
      contrastAlgorithm: 'WCAG',
      oklchDisplaySignificantDigits: 4
    });
    setThemePreference('auto');
    vi.mocked(announce).mockClear();
  });

  it('renders base settings without OKLCH significant digits slider by default', () => {
    render(DisplaySettings);

    expect(screen.getByLabelText('Display color space format')).toBeInTheDocument();
    expect(screen.getByLabelText('Gamut mapping target')).toBeInTheDocument();
    expect(screen.getByLabelText('Theme preference')).toBeInTheDocument();
    expect(screen.getByLabelText('Swatch label display')).toBeInTheDocument();
    expect(screen.getByLabelText('Contrast algorithm')).toBeInTheDocument();
    expect(screen.queryByLabelText('OKLCH display significant digits')).not.toBeInTheDocument();
  });

  it('shows OKLCH significant digits slider and number input only when OKLCH color space is selected', async () => {
    const user = userEvent.setup();
    render(DisplaySettings);

    expect(screen.queryByLabelText('OKLCH display significant digits')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Display color space format'), 'oklch');

    expect(screen.getByLabelText('OKLCH display significant digits')).toBeInTheDocument();
    expect(
      screen.getByRole('spinbutton', { name: 'OKLCH significant digits value input' })
    ).toHaveValue(4);
    expect(
      screen.getByRole('button', { name: 'Explain OKLCH significant digits' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Controls how many significant digits OKLCH swatches use for rendering and labels.'
      )
    ).toBeInTheDocument();
    const colorSpaceField = screen.getByLabelText('Display color space format').closest('.field');
    const significantDigitsField = screen
      .getByLabelText('OKLCH display significant digits')
      .closest('.field');
    const gamutField = screen.getByLabelText('Gamut mapping target').closest('.field');

    expect(colorSpaceField?.nextElementSibling).toBe(significantDigitsField);
    expect(significantDigitsField?.nextElementSibling).toBe(gamutField);
  });

  it('allows keyboard users to focus the significant digits info icon', async () => {
    const user = userEvent.setup();
    render(DisplaySettings);

    await user.selectOptions(screen.getByLabelText('Display color space format'), 'oklch');
    const infoButton = screen.getByRole('button', { name: 'Explain OKLCH significant digits' });

    infoButton.focus();

    expect(infoButton).toHaveFocus();
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

  it('changes OKLCH significant digits from number input and announces', async () => {
    const user = userEvent.setup();
    render(DisplaySettings);

    await user.selectOptions(screen.getByLabelText('Display color space format'), 'oklch');
    const input = screen.getByRole('spinbutton', {
      name: 'OKLCH significant digits value input'
    }) as HTMLInputElement;

    await fireEvent.input(input, { target: { value: '5' } });
    await fireEvent.change(input, { target: { value: '5' } });

    expect(get(oklchDisplaySignificantDigits)).toBe(5);
    expect(input.value).toBe('5');
    expect(announce).toHaveBeenCalledWith('OKLCH significant digits changed to 5');
  });
});
