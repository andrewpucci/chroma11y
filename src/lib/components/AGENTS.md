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
- **`DynamicSvg.svelte`** — dynamic SVG rendering with DOMPurify sanitization
- **`ThemeToggle.svelte`** — light/dark theme switcher
- **`AppHeader.svelte`** / **`Sidebar.svelte`** / **`Card.svelte`** / **`Brand.svelte`** — layout components

## Accessibility requirements

This is an accessibility-focused project. Every component must maintain:

- **ARIA labels** on all interactive elements
- **Keyboard navigation** support (focus management, key handlers)
- **Screen reader announcements** via `announce()` for state changes
- Never remove ARIA attributes, keyboard handlers, or screen reader announcements without replacement

## Svelte 5 patterns

- Use `$props()` for component props (not `export let`)
- Use `onclick={handler}` event attributes (not `on:click`)
- Use `$state()` / `$derived()` / `$effect()` for local reactivity
- Use `{#snippet}` and `{@render}` instead of slots where applicable
- Use `bind:` for two-way bindings
