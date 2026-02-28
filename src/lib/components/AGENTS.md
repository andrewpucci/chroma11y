# Components

Svelte 5 components with co-located DOM tests. All components use scoped `<style>` blocks — no Tailwind, no CSS-in-JS.

## File conventions

- Components: `ComponentName.svelte`
- DOM tests: `ComponentName.dom.spec.ts` (jsdom + @testing-library/svelte, `render()` + `screen` queries)
- Every component test must contain at least one assertion (`expect.requireAssertions` is enabled globally)

## Component inventory

- **`ColorControls.svelte`** — base color picker, warmth, chroma, bezier curve, num colors/palettes sliders
- **`BezierEditor.svelte`** — interactive SVG bezier curve editor
- **`ContrastControls.svelte`** — auto/manual contrast mode, step selectors
- **`ExportButtons.svelte`** — JSON/CSS/SCSS export triggers
- **`NeutralPalette.svelte`** — neutral (gray) palette display with lightness nudgers
- **`PaletteGrid.svelte`** — color palette grid with hue nudgers
- **`ColorSwatch.svelte`** — individual color swatch (click-to-copy, drawer trigger)
- **`ColorInfoDrawer.svelte`** — slide-out panel showing color details (hex, rgb, oklch, hsl, contrast, name)
- **`DisplaySettings.svelte`** — settings card with color space, gamut, theme, swatch labels, and contrast algorithm options
- **`SliderNumberField.svelte`** — reusable grouped range + number input control with shared accessibility semantics
- **`DynamicSvg.svelte`** — dynamic SVG rendering with DOMPurify sanitization
- **`AppHeader.svelte`** / **`Sidebar.svelte`** / **`Card.svelte`** / **`Brand.svelte`** — layout components

## Accessibility requirements

This is an accessibility-focused project. Every component must maintain:

- **ARIA labels** on all interactive elements
- **Keyboard navigation** support (focus management, key handlers)
- **Inline slider number inputs** with native spinbutton behavior and synced range values
- **Screen reader announcements** via `announce()` for state changes
- Never remove ARIA attributes, keyboard handlers, or screen reader announcements without replacement

## Svelte 5 patterns

- Use `$props()` for component props (not `export let`)
- Use `onclick={handler}` event attributes (not `on:click`)
- Use `$state()` / `$derived()` / `$effect()` for local reactivity
- Use `{#snippet}` and `{@render}` instead of slots where applicable
- Use `bind:` for two-way bindings

## Testing guidelines

### What to test in component DOM tests

- **Rendering**: Component renders with expected structure, ARIA attributes present
- **User events**: Click, input, keyboard interactions update state correctly
- **Inline slider number input behavior**: native spinbutton controls, slider/input sync, range clamping
- **Store integration**: Component reads from and writes to stores as expected
- **Accessibility**: ARIA labels, roles, keyboard navigation work correctly

### What NOT to test in component DOM tests

- **Pointer capture / drag interactions** — jsdom doesn't support `getBoundingClientRect` or pointer capture; use E2E tests
- **SVG coordinate transforms** — Require actual rendering; use E2E tests
- **CSS styling / visual appearance** — Use E2E visual regression tests (see `e2e/AGENTS.md` for current coverage)
- **Internal implementation details** — Test behavior, not implementation

### Documenting untestable code

When component code can't be reliably unit tested, add a JSDoc comment in the source file explaining:

1. What the code does
2. Why it can't be unit tested (jsdom limitation, requires real rendering, etc.)
3. Where it IS tested (reference the E2E test file)

Example from `BezierEditor.svelte`:

```typescript
/**
 * Note: This function and the pointer event handlers below are not covered
 * by unit tests because:
 * - getBoundingClientRect() returns zeros in jsdom
 * - Pointer capture APIs are mocked/stubbed and don't behave realistically
 *
 * These interactions are tested via E2E tests in e2e/bezier-editor.spec.ts
 */
```

### Test file structure

```typescript
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import ComponentName from './ComponentName.svelte';

describe('ComponentName', () => {
  describe('Rendering', () => {
    it('renders with expected structure', () => {
      // ...
    });
  });

  describe('User Interactions', () => {
    it('handles click events', async () => {
      const user = userEvent.setup();
      // ...
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      // ...
    });
  });
});
```
