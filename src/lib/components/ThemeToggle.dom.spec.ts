import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it } from 'vitest';

import ThemeToggle from '$lib/components/ThemeToggle.svelte';
import { currentTheme, setTheme } from '$lib/stores';

describe('ThemeToggle', () => {
  beforeEach(() => {
    setTheme('light');
  });

  it('renders a toggle button with an accessible label', () => {
    render(ThemeToggle);

    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
  });

  it('toggles the theme on click', async () => {
    const user = userEvent.setup();
    render(ThemeToggle);

    await user.click(screen.getByRole('button', { name: /switch to dark mode/i }));

    expect(get(currentTheme)).toBe('dark');
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
  });
});
