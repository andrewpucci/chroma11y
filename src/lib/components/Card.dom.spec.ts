import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { Snippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';

import Card from '$lib/components/Card.svelte';

const testSnippet = (() => {}) as unknown as Snippet;

describe('Card', () => {
  it('renders as a regular card by default', () => {
    const { container } = render(Card, {
      props: {
        title: 'Generation',
        subtitle: 'Core palette controls',
        children: testSnippet
      }
    });

    expect(screen.getByRole('heading', { name: 'Generation' })).toBeInTheDocument();
    expect(container.querySelector('section.card')).toBeInTheDocument();
    expect(container.querySelector('.card-collapsible')).not.toBeInTheDocument();
  });

  it('initializes collapsible cards with defaultOpen=false', () => {
    const { container } = render(Card, {
      props: {
        title: 'Generation',
        subtitle: 'Core palette controls',
        collapsible: true,
        defaultOpen: false,
        children: testSnippet
      }
    });

    const card = container.querySelector('details.card-collapsible') as HTMLDetailsElement;
    const summary = container.querySelector('summary.card-summary') as HTMLElement;
    const panel = container.querySelector('.card-panel') as HTMLDivElement;
    expect(card).toBeInTheDocument();
    expect(summary).toBeInTheDocument();
    expect(card.open).toBe(false);
    expect(panel).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Generation' })).toBeInTheDocument();
  });

  it('initializes collapsible cards with defaultOpen=true', () => {
    const { container } = render(Card, {
      props: {
        title: 'Generation',
        subtitle: 'Core palette controls',
        collapsible: true,
        defaultOpen: true,
        children: testSnippet
      }
    });

    const card = container.querySelector('details.card-collapsible') as HTMLDetailsElement;
    const summary = container.querySelector('summary.card-summary') as HTMLElement;
    expect(card).toBeInTheDocument();
    expect(summary).toBeInTheDocument();
    expect(card.open).toBe(true);
    expect(screen.getByRole('heading', { name: 'Generation' })).toBeInTheDocument();
  });

  it('supports pointer toggling and keyboard focus in collapsible mode', async () => {
    const user = userEvent.setup();

    const { container } = render(Card, {
      props: {
        title: 'Generation',
        subtitle: 'Core palette controls',
        collapsible: true,
        defaultOpen: false,
        children: testSnippet
      }
    });

    const card = container.querySelector('details.card-collapsible') as HTMLDetailsElement;
    const summary = container.querySelector('summary.card-summary') as HTMLElement;
    expect(card.open).toBe(false);

    await user.click(summary);
    expect(card.open).toBe(true);

    summary.focus();
    expect(document.activeElement).toBe(summary);

    await user.click(summary);
    expect(card.open).toBe(false);
  });

  it('shows summary text when collapsed and reports controlled toggles', async () => {
    expect.assertions(3);
    const user = userEvent.setup();
    const onToggle = vi.fn();

    const { container } = render(Card, {
      props: {
        title: 'Output',
        subtitle: 'Formats and labels',
        summary: 'Hex, Auto, Step + Value',
        collapsible: true,
        open: false,
        onToggle,
        children: testSnippet
      }
    });

    expect(screen.getByText('Hex, Auto, Step + Value')).toBeInTheDocument();

    await user.click(container.querySelector('summary.card-summary') as HTMLElement);

    expect(onToggle).toHaveBeenCalledWith(true);
    expect(screen.queryByText('Formats and labels')).not.toBeInTheDocument();
  });
});
