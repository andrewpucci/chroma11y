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
- Derived stores expose individual slices: `neutrals`, `palettes`, `neutralsHex`, `palettesHex`, `baseColor`, `warmth`, `chromaMultiplier`, bezier params, `lightnessNudgers`, `hueNudgers`, `currentTheme`, `contrastMode`, etc.
- **`neutralsHex`** and **`palettesHex`** are centralized derived stores that convert Color objects to hex strings — these are the intended place to swap output format when configurable color spaces are added
- Helper functions mutate the store: `updateColorState()`, `setTheme()`, `toggleTheme()`, `updateLightnessNudger()`, `updateHueNudger()`, `updateContrastFromNeutrals()`, `updateContrastStep()`, `resetColorState()`
- Theme presets (`THEME_PRESETS.light` / `THEME_PRESETS.dark`) define default bezier curves, chroma multipliers, and contrast steps per theme

## Color generation pipeline

Defined in `colorUtils.ts`. The algorithm:

1. **Generate base neutrals** — bezier-eased lightness ramp from white→black (light mode) or dark-start→white (dark mode), with warmth applied as OKLCH chroma
2. **Generate palettes** — for each of `numPalettes`, hue-shift the base color by `(360/numPalettes)*i + hueNudger[i]`, then map base neutral lightness values onto that hue with the chroma multiplier
3. **Normalize chroma** — transpose the chroma matrix across palettes and average each column for consistent saturation per step
4. **Apply lightness nudgers** — final step, adds per-step lightness offsets to both neutrals and palettes

Key functions: `generatePalettes()`, `generateBaseNeutrals()`, `getContrast()`, `getPaletteName()`, `colorToCssHex()`, `colorToCssRgb()`, `colorToCssOklch()`, `colorToCssHsl()`

## Export formats

Defined in `exportUtils.ts`:

- **JSON Design Tokens** — compliant with [Design Tokens Format Module](https://www.designtokens.org/tr/2025.10/), includes sRGB components + hex
- **CSS Custom Properties** — `:root { --color-{name}-{step}: #hex; }`
- **SCSS Variables** — `$color-{name}-{step}: #hex;`

Palette names are auto-detected via CIEDE2000 nearest color matching, with fallback defaults.

## Persistence

- **URL state** (`urlUtils.ts`) — all parameters encoded as compact query params (`c`, `w`, `cm`, `x1`…`y2`, `t`, `m`, `ls`, `hs`, `ln`, `hn`). Updated via `replaceState` (no history pollution). Debounced 500ms.
- **localStorage** (`storageUtils.ts`) — mirrors URL state under key `chroma11y-state`. URL takes priority on load.

## Testing conventions

- Pure logic tests: `*.spec.ts` alongside source (e.g., `colorUtils.spec.ts`)
- Run with `npm run test:unit` (Vitest, server project for Node environment)
- `expect.requireAssertions` is enabled globally — every test must contain at least one assertion
