import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import PaletteNameEditor from './PaletteNameEditor.svelte';

describe('PaletteNameEditor', () => {
  it('enters edit mode and saves on Enter', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();

    render(PaletteNameEditor, {
      props: {
        fallbackValue: 'Gray',
        editButtonAriaLabel: 'Edit name for neutral palette',
        inputAriaLabel: 'Neutral palette name',
        onCommit
      }
    });

    expect(screen.getByText('Gray')).toBeInTheDocument();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /edit name for neutral palette/i
      })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /edit name for neutral palette/i }));
    const input = screen.getByRole('textbox', { name: /neutral palette name/i });
    await user.clear(input);
    await user.type(input, 'Canvas{Enter}');

    expect(onCommit).toHaveBeenCalledWith('Canvas');
    expect(
      screen.getByRole('button', { name: /edit name for neutral palette/i })
    ).toBeInTheDocument();
  });

  it('cancels edits on Escape', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();

    render(PaletteNameEditor, {
      props: {
        value: 'Ocean',
        fallbackValue: 'Blue Ribbon',
        editButtonAriaLabel: 'Edit name for palette 1',
        inputAriaLabel: 'Palette 1 name',
        onCommit
      }
    });

    await user.click(screen.getByRole('button', { name: /edit name for palette 1/i }));
    const input = screen.getByRole('textbox', { name: /palette 1 name/i });
    await user.clear(input);
    await user.type(input, 'Temp{Escape}');

    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByText('Ocean')).toBeInTheDocument();
  });

  it('commits undefined for empty values on blur', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();

    render(PaletteNameEditor, {
      props: {
        value: 'Canvas',
        fallbackValue: 'Gray',
        editButtonAriaLabel: 'Edit name for neutral palette',
        inputAriaLabel: 'Neutral palette name',
        onCommit
      }
    });

    await user.click(screen.getByRole('button', { name: /edit name for neutral palette/i }));
    const input = screen.getByRole('textbox', { name: /neutral palette name/i });
    await user.clear(input);
    await user.tab();

    expect(onCommit).toHaveBeenCalledWith(undefined);
  });

  it('does not commit a generated fallback label as a custom override', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();

    render(PaletteNameEditor, {
      props: {
        fallbackValue: 'Gray',
        editButtonAriaLabel: 'Edit name for neutral palette',
        inputAriaLabel: 'Neutral palette name',
        onCommit
      }
    });

    await user.click(screen.getByRole('button', { name: /edit name for neutral palette/i }));
    await user.keyboard('{Enter}');

    expect(onCommit).toHaveBeenCalledWith(undefined);
  });

  it('treats a typed fallback label as resetting to the generated name', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();

    render(PaletteNameEditor, {
      props: {
        value: 'Canvas',
        fallbackValue: 'Gray',
        editButtonAriaLabel: 'Edit name for neutral palette',
        inputAriaLabel: 'Neutral palette name',
        onCommit
      }
    });

    await user.click(screen.getByRole('button', { name: /edit name for neutral palette/i }));
    const input = screen.getByRole('textbox', { name: /neutral palette name/i });
    await user.clear(input);
    await user.type(input, 'Gray{Enter}');

    expect(onCommit).toHaveBeenCalledWith(undefined);
  });

  it('shows the fallback name when the current value is an empty string placeholder', () => {
    render(PaletteNameEditor, {
      props: {
        value: '',
        fallbackValue: 'Blue',
        editButtonAriaLabel: 'Edit name for palette 1',
        inputAriaLabel: 'Palette 1 name'
      }
    });

    expect(screen.getByText('Blue')).toBeInTheDocument();
  });

  it('includes the current displayed name in the edit button description', () => {
    render(PaletteNameEditor, {
      props: {
        value: 'Ocean',
        fallbackValue: 'Blue Ribbon',
        editButtonAriaLabel: 'Edit name for palette 1',
        inputAriaLabel: 'Palette 1 name'
      }
    });

    expect(
      screen.getByRole('button', {
        name: /edit name for palette 1/i
      })
    ).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /edit name for palette 1/i });
    const descriptionId = button.getAttribute('aria-describedby');

    expect(descriptionId).toBeTruthy();
    expect(document.getElementById(descriptionId as string)).toHaveTextContent(
      'Current name Ocean'
    );
  });

  it('carries the display width into edit mode to reduce layout shift', async () => {
    const user = userEvent.setup();

    render(PaletteNameEditor, {
      props: {
        value: 'Ocean',
        fallbackValue: 'Blue Ribbon',
        editButtonAriaLabel: 'Edit name for palette 1',
        inputAriaLabel: 'Palette 1 name'
      }
    });

    const button = screen.getByRole('button', {
      name: /edit name for palette 1/i
    });

    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
      width: 148,
      height: 44,
      top: 0,
      right: 148,
      bottom: 44,
      left: 0,
      x: 0,
      y: 0,
      toJSON: () => ''
    } as DOMRect);

    await user.click(button);

    expect(screen.getByRole('textbox', { name: /palette 1 name/i })).toHaveStyle({
      width: '148px'
    });
  });
});
