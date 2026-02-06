import { render, screen, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it } from 'vitest';

import ContrastControls from '$lib/components/ContrastControls.svelte';
import {
  contrastColors,
  contrastMode,
  lowStep,
  resetColorState,
  updateColorState
} from '$lib/stores';

describe('ContrastControls', () => {
  beforeEach(() => {
    resetColorState('light');

    updateColorState({
      neutrals: [
        '#ffffff',
        '#eeeeee',
        '#dddddd',
        '#cccccc',
        '#bbbbbb',
        '#aaaaaa',
        '#999999',
        '#888888',
        '#777777',
        '#666666',
        '#000000'
      ]
    });
  });

  it('renders contrast mode selector and preview group', () => {
    render(ContrastControls);

    expect(screen.getByLabelText(/contrast mode/i)).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: /current contrast color preview/i })
    ).toBeInTheDocument();
  });

  it('switches to manual mode and shows manual color inputs', async () => {
    render(ContrastControls);

    const modeSelect = screen.getByLabelText(/contrast mode/i);
    await fireEvent.change(modeSelect, { target: { value: 'manual' } });

    expect(get(contrastMode)).toBe('manual');
    expect(screen.getByLabelText(/low contrast color hex value/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/high contrast color hex value/i)).toBeInTheDocument();
  });

  it('does not update store when given an invalid manual hex value', async () => {
    render(ContrastControls);

    await fireEvent.change(screen.getByLabelText(/contrast mode/i), {
      target: { value: 'manual' }
    });

    const before = get(contrastColors).low;
    const lowHex = screen.getByLabelText(/low contrast color hex value/i);

    await fireEvent.change(lowHex, { target: { value: '#GGGGGG' } });

    expect(get(contrastColors).low).toBe(before);
  });

  it('updates low step selection in auto mode', async () => {
    render(ContrastControls);

    const lowStepSelect = screen.getByLabelText(/low step/i);

    await fireEvent.change(lowStepSelect, { target: { value: '2' } });

    expect(get(lowStep)).toBe(2);
  });
});
