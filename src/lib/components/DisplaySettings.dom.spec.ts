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
  showSwatchGamutWarnings,
  oklchDisplaySignificantDigits,
  updateColorState,
  setThemePreference
} from '$lib/stores';
import { announce } from '$lib/announce';

describe('DisplaySettings', () => {
  function getAdvancedSummary(): HTMLElement {
    const summary = document.querySelector('[data-testid="output-advanced-group"] summary');
    if (!(summary instanceof HTMLElement)) {
      throw new Error('Expected output advanced summary to exist');
    }

    return summary;
  }

  beforeEach(() => {
    updateColorState({
      displayColorSpace: 'hex',
      gamutSpace: 'srgb',
      swatchLabels: 'both',
      showSwatchGamutWarnings: true,
      oklchDisplaySignificantDigits: 4
    });
    setThemePreference('auto');
    vi.mocked(announce).mockClear();
  });

  it('renders basic settings and keeps advanced output controls collapsed by default', () => {
    render(DisplaySettings);
    const advancedGroup = screen.getByTestId('output-advanced-group') as HTMLDetailsElement;
    const advancedSummary = getAdvancedSummary();

    expect(screen.getByLabelText('Display color space format')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explain Color Space' })).toBeInTheDocument();
    expect(screen.getByLabelText('Theme preference')).toBeInTheDocument();
    expect(screen.getByLabelText('Show step labels on swatches')).toBeInTheDocument();
    expect(screen.getByLabelText('Show value labels on swatches')).toBeInTheDocument();
    expect(advancedGroup.open).toBe(false);
    expect(advancedSummary).toBeInTheDocument();
    expect(screen.queryByLabelText('OKLCH display significant digits')).not.toBeInTheDocument();
  });

  it('shows advanced controls and OKLCH significant digits only after expanding advanced output', async () => {
    const user = userEvent.setup();
    render(DisplaySettings);

    expect(screen.queryByLabelText('OKLCH display significant digits')).not.toBeInTheDocument();

    await user.click(getAdvancedSummary());
    expect(screen.getByLabelText('Gamut mapping target')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explain Gamut Mapping' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explain Gamut Warnings' })).toBeInTheDocument();

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
  });

  it('allows keyboard users to focus the significant digits info icon', async () => {
    const user = userEvent.setup();
    render(DisplaySettings);

    await user.click(getAdvancedSummary());
    await user.selectOptions(screen.getByLabelText('Display color space format'), 'oklch');
    const infoButton = screen.getByRole('button', { name: 'Explain OKLCH significant digits' });

    infoButton.focus();

    expect(infoButton).toHaveFocus();
  });

  it('changes display color space and announces', async () => {
    const user = userEvent.setup();
    render(DisplaySettings);

    await user.click(getAdvancedSummary());
    await user.selectOptions(screen.getByLabelText('Display color space format'), 'oklch');

    expect(get(displayColorSpace)).toBe('oklch');
    expect(announce).toHaveBeenCalledWith('Display color space changed to oklch');
  });

  it('changes gamut space and announces', async () => {
    const user = userEvent.setup();
    render(DisplaySettings);

    await user.click(getAdvancedSummary());
    await user.selectOptions(screen.getByLabelText('Display color space format'), 'oklch');
    await user.selectOptions(screen.getByLabelText('Gamut mapping target'), 'p3');

    expect(get(gamutSpace)).toBe('p3');
    expect(announce).toHaveBeenCalledWith('Gamut mapping changed to Display P3');
  });

  it('forces sRGB gamut and disables gamut selector when display color space is hex', async () => {
    const user = userEvent.setup();
    updateColorState({ displayColorSpace: 'oklch', gamutSpace: 'p3' });
    render(DisplaySettings);

    await user.click(getAdvancedSummary());
    const gamutSelect = screen.getByLabelText('Gamut mapping target');
    expect(gamutSelect).not.toBeDisabled();

    await user.selectOptions(screen.getByLabelText('Display color space format'), 'hex');

    expect(get(displayColorSpace)).toBe('hex');
    expect(get(gamutSpace)).toBe('srgb');
    expect(gamutSelect).toBeDisabled();
    expect(screen.getByText(/hex output is fixed to srgb/i)).toBeInTheDocument();
    expect(announce).toHaveBeenCalledWith(
      'Display color space changed to hex. Gamut mapping fixed to sRGB'
    );
  });

  it('changes theme preference and announces', async () => {
    const user = userEvent.setup();
    render(DisplaySettings);

    await user.selectOptions(screen.getByLabelText('Theme preference'), 'dark');

    expect(get(themePreference)).toBe('dark');
    expect(announce).toHaveBeenCalledWith('Theme preference changed to dark');
  });

  it('changes swatch labels from checklist and announces', async () => {
    const user = userEvent.setup();
    render(DisplaySettings);

    await user.click(screen.getByLabelText('Show step labels on swatches'));
    await user.click(screen.getByLabelText('Show value labels on swatches'));

    expect(get(swatchLabels)).toBe('none');
    expect(announce).toHaveBeenCalledWith('Swatch labels changed to hidden');
  });

  it('changes swatch gamut warnings visibility and announces', async () => {
    const user = userEvent.setup();
    render(DisplaySettings);

    await user.click(getAdvancedSummary());
    await user.click(screen.getByLabelText('Show gamut warnings on mapped swatches'));

    expect(get(showSwatchGamutWarnings)).toBe(false);
    expect(announce).toHaveBeenCalledWith('Swatch gamut warnings hidden');
  });

  it('changes OKLCH significant digits from number input and announces', async () => {
    const user = userEvent.setup();
    render(DisplaySettings);

    await user.click(getAdvancedSummary());
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
