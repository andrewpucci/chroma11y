# Library (src/lib)

Core logic, stores, and utilities for Chroma11y. Unit tests are co-located alongside source files as `*.spec.ts`.

## Module inventory

- **`colorUtils.ts`** — core color generation algorithms (OKLCH, bezier, contrast, naming)
- **`exportUtils.ts`** — export format generators (JSON design tokens, CSS, SCSS)
- **`stores.ts`** — Svelte writable/derived stores (central state)
- **`storageUtils.ts`** — localStorage persistence
- **`urlUtils.ts`** — URL state encoding/decoding
- **`drawerStore.ts`** — color info drawer state
- **`announce.ts`** — screen reader announcement utility (aria-live)
- **`types.ts`** — shared TypeScript interfaces

## Store patterns

Stores use the classic `writable`/`derived` API from `svelte/store` (not runes) — this is intentional for cross-module shared state.

- **`colorStore`** — single writable store holding all color state (`ColorState` interface)
- Derived stores expose individual slices: `neutrals`, `palettes`, `neutralsHex`, `palettesHex`, `neutralsDisplay`, `palettesDisplay`, `baseColor`, `warmth`, `chromaMultiplier`, bezier params, `lightnessNudgers`, `hueNudgers`, `currentTheme`, `contrastMode`, `displayColorSpace`, `gamutSpace`, `themePreference`, `swatchLabels`, `contrastAlgorithm`, etc.
- **`neutralsHex`** and **`palettesHex`** convert Color objects to hex strings (always sRGB); **`neutralsDisplay`** and **`palettesDisplay`** format colors according to the selected `displayColorSpace` and `gamutSpace`
- Helper functions mutate the store: `updateColorState()`, `setTheme()`, `setThemePreference()`, `updateLightnessNudger()`, `updateHueNudger()`, `updateContrastFromNeutrals()`, `updateContrastStep()`, `resetColorState()`
- Theme presets (`THEME_PRESETS.light` / `THEME_PRESETS.dark`) define default bezier curves, chroma multipliers, and contrast steps per theme

## Color generation pipeline

Defined in `colorUtils.ts`. The algorithm:

1. **Generate base neutrals** — bezier-eased lightness ramp from white→black (light mode) or dark-start→white (dark mode), with warmth applied as OKLCH chroma
2. **Generate palettes** — for each of `numPalettes`, hue-shift the base color by `(360/numPalettes)*i + hueNudger[i]`, then map base neutral lightness values onto that hue using gamut-boundary-relative chroma: each palette's chroma is scaled as the same proportion of its hue's maximum in-gamut chroma as the base color uses of the reference hue's boundary, producing visually even saturation across hues
3. **Apply lightness nudgers** — final step, adds per-step lightness offsets to both neutrals and palettes

Key functions: `generatePalettes()`, `generateBaseNeutrals()`, `getContrast()`, `getContrastAPCA()`, `getContrastForAlgorithm()`, `getPaletteName()`, `colorToCssHex()`, `colorToCssRgb()`, `colorToCssOklch()`, `colorToCssHsl()`, `colorToCssP3()`, `colorToCssRec2020()`, `colorToCssRender()`

## Export formats

Defined in `exportUtils.ts`:

- **JSON Design Tokens** — compliant with [Design Tokens Format Module](https://www.designtokens.org/tr/2025.10/), includes sRGB components + hex
- **CSS Custom Properties** — `:root { --color-{name}-{step}: <value>; }` (respects display color space setting)
- **SCSS Variables** — `$color-{name}-{step}: <value>;` (respects display color space setting)

Palette names are auto-detected via CIEDE2000 nearest color matching, with fallback defaults.

## Persistence

- **URL state** (`urlUtils.ts`) — all parameters encoded as compact query params (`c`, `w`, `cm`, `x1`…`y2`, `t`, `m`, `ls`, `hs`, `ln`, `hn`, `ds`, `gs`, `sl`, `ca`). Updated via `replaceState` (no history pollution). Debounced 500ms.
- **localStorage** (`storageUtils.ts`) — mirrors URL state under key `chroma11y-state`, plus `themePreference` (localStorage-only, not in URL). URL takes priority on load; display settings are validated on read.

## Testing conventions

- Pure logic tests: `*.spec.ts` alongside source (e.g., `colorUtils.spec.ts`)
- DOM-dependent tests: `*.dom.spec.ts` (jsdom environment)
- Run with `npm run test:unit` (Vitest, server project for Node environment)
- `expect.requireAssertions` is enabled globally — every test must contain at least one assertion
- Design token integrity: run `npm run test:unit -- --run src/lib/styles/tokens.spec.ts` when touching CSS variables. This test fails if any `var(--token)` usage has no matching definition.

### What to test

- **Test**: Your wrapper functions' input/output behavior, error handling, edge cases
- **Don't test**: That `colorjs.io` calculates contrast correctly — that's the library's job
- **Test**: Store mutations produce expected state changes
- **Don't test**: The same logic in multiple places unless testing different integration points

### Documenting untestable code

Some code paths are intentionally not unit tested. When adding defensive code that can't be reliably tested, add a JSDoc comment explaining:

1. What the code guards against
2. Why it can't be unit tested
3. How it's covered (E2E test, manual testing, or truly defensive)

Example:

```typescript
/**
 * Note: The catch branch is defensive code for malformed hex values that slip
 * past validation. In practice, all hex values come from colorToCssHex() which
 * always produces valid output. This is tested indirectly via exportAsDesignTokens
 * which skips invalid colors (no token emitted).
 */
```
