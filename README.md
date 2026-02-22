# Chroma11y

Accessible color palette generator powered by OKLCH, with WCAG contrast checking and multiple export formats. Built with Svelte 5.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Svelte 5](https://img.shields.io/badge/Svelte-5-orange.svg)](https://svelte.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![CI](https://github.com/andrewpucci/chroma11y/actions/workflows/unit-tests.yml/badge.svg)](https://github.com/andrewpucci/chroma11y/actions/workflows/unit-tests.yml)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://chroma11y.netlify.app)

<p align="center">
  <img src="docs/screenshot.png" alt="Chroma11y screenshot showing color palette generator" width="800">
</p>

**[Try the Live Demo →](https://chroma11y.netlify.app)**

---

## Overview

This tool generates accessible color palettes using the OKLCH color space. It provides fine-grained control over color generation with bezier curves, chroma normalization, and per-step adjustments. Perfect for designers and developers who need consistent, accessible color systems.

### Why OKLCH?

OKLCH (Oklch) is a perceptually uniform color space that ensures:

- **Consistent lightness** across different hues
- **Predictable color relationships** for better palette cohesiveness
- **Better accessibility** with accurate contrast calculations
- **Wider gamut support** for modern displays

<details>
<summary>📑 Table of Contents</summary>

- [Features](#features)
- [Installation & Setup](#installation--setup)
- [Usage Guide](#usage-guide)
- [Technical Details](#technical-details)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)

</details>

---

## Features

### Color Generation

- **Customizable color palettes** - Generate multiple palettes with customizable steps
- **OKLCH color space** - Perceptually uniform color generation
- **Neutral palette** - Separate gray palette with warmth control
- **Bezier curve controls** - Precise lightness distribution (x1, y1, x2, y2)
- **Chroma normalization** - Consistent saturation across palettes
- **Named color detection** - CIEDE2000-based color naming

### Accessibility

- **WCAG 2.2 AA compliant** - 24px minimum touch targets, fluid typography, text zoom support
- **WCAG 2.2 & APCA contrast** - Choose between contrast algorithms
- **Auto/manual contrast modes** - Choose contrast colors automatically or manually
- **Contrast ratio display** - See low/high contrast ratios for each color
- **Keyboard navigation** - Full keyboard accessibility
- **Screen reader support** - ARIA labels and announcements
- **Touch-friendly controls** - Comfortable 44px touch targets
- **Motion preferences** - Respects `prefers-reduced-motion`

### Customization

- **Lightness nudgers** - Fine-tune individual color steps
- **Hue nudgers** - Adjust hue per palette
- **Warmth control** - Add warmth to neutral palette
- **Chroma multiplier** - Control overall saturation

### Display Settings

- **Color space display** - View colors as Hex, RGB, OKLCH, or HSL
- **Gamut mapping** - Clamp to sRGB, Display P3, or Rec. 2020
- **Swatch labels** - Show step numbers, color values, both, or none
- **Contrast algorithm** - Switch between WCAG 2.1 ratios and APCA Lc values

### Export & Sharing

- **JSON design tokens** - Export as design token format (always sRGB per spec)
- **CSS custom properties** - Generate CSS variables in selected color space
- **SCSS variables** - Export as SCSS in selected color space
- **Click-to-copy** - Copy individual colors instantly
- **URL state sharing** - Share configurations via URL
- **Local storage** - Save preferences automatically

### Experience

- **Design token system** - Fluid typography and spacing that scales with viewport
- **Theme switching** - Light, dark, and auto (follows system preference)
- **Responsive** - Container queries and modern CSS for all screen sizes
- **Fast performance** - All operations <200ms
- **Intuitive controls** - Easy-to-use interface

<p align="right"><a href="#chroma11y">↑ back to top</a></p>

---

## Quick Start

```bash
git clone https://github.com/andrewpucci/chroma11y.git && cd chroma11y && npm install && npm run dev
```

Or **[try the live demo](https://chroma11y.netlify.app)** instantly.

---

## Installation & Setup

1. Clone the repository:

```bash
git clone https://github.com/andrewpucci/chroma11y.git
```

2. Navigate to the project directory:

```bash
cd chroma11y
```

3. Install dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm run dev
```

5. Open in browser (usually http://localhost:5173)

<p align="right"><a href="#chroma11y">↑ back to top</a></p>

---

## Usage Guide

### Basic Workflow

1. **Choose a base color** - Click the color picker or enter a hex value
2. **Adjust parameters** - Modify warmth, chroma, and bezier curve controls
3. **Fine-tune colors** - Use lightness and hue nudgers for precise adjustments
4. **Set contrast mode** - Choose auto or manual contrast for text colors
5. **Export** - Download as JSON, CSS, or SCSS

### Control Explanations

#### Base Color

The starting color for palette generation. All palettes derive from this color with hue variations.

#### Warmth (-20 to +20)

Adds warmth to the neutral palette. Negative values = cooler grays, positive = warmer grays.

#### Chroma Multiplier (0.1 to 2.0)

Controls overall saturation. Higher values = more vibrant colors.

#### Bezier Curve (x1, y1, x2, y2)

Controls lightness distribution across the color steps:

- **x1, y1** - First control point
- **x2, y2** - Second control point

#### Lightness Nudgers

Adjust lightness up or down for specific steps.

#### Hue Nudgers

Adjust hue for entire palettes.

#### Contrast Mode

- **Auto** - Automatically selects contrast colors from neutral palette
- **Manual** - Choose custom low/high contrast colors

### Export Instructions

**JSON Design Tokens**
Compliant with the [Design Tokens Format Module](https://www.designtokens.org/tr/2025.10/).

```json
{
  "gray": {
    "0": {
      "$type": "color",
      "$value": {
        "colorSpace": "srgb",
        "components": [1, 1, 1],
        "hex": "#ffffff"
      },
      "$description": "Neutral color step 0"
    },
    "10": {
      "$type": "color",
      "$value": {
        "colorSpace": "srgb",
        "components": [0.878, 0.878, 0.878],
        "hex": "#e0e0e0"
      },
      "$description": "Neutral color step 10"
    }
  },
  "blue": {
    "0": {
      "$type": "color",
      "$value": {
        "colorSpace": "srgb",
        "components": [0.902, 0.941, 1],
        "hex": "#e6f0ff"
      },
      "$description": "Blue color step 0"
    }
  }
}
```

**CSS Custom Properties**

```css
:root {
  --color-gray-0: #ffffff;
  --color-gray-10: #f1f3f5;
  --color-blue-0: #ffffff;
}
```

**SCSS Variables**

```scss
$color-gray-0: #ffffff;
$color-gray-10: #f1f3f5;
$color-blue-0: #ffffff;
```

### URL Sharing

Share your color configuration by copying the URL. All parameters are encoded in the URL for easy sharing.

<p align="right"><a href="#chroma11y">↑ back to top</a></p>

---

## Technical Details

### Architecture

**Component-Based Structure**

```
src/
├── lib/
│   ├── components/              # UI components (controls, swatches, drawer, etc.)
│   ├── styles/
│   │   ├── tokens.css           # Design token system (typography, spacing, motion)
│   │   └── nudger.css           # Shared nudger input styles
│   ├── colorUtils.ts            # Color generation algorithms
│   ├── exportUtils.ts           # Export format generators
│   ├── stores.ts                # Svelte stores (state)
│   ├── storageUtils.ts          # LocalStorage persistence
│   ├── urlUtils.ts              # URL state encoding
│   ├── drawerStore.ts           # Color info drawer state
│   ├── announce.ts              # Screen reader announcements
│   └── types.ts                 # Shared TypeScript types
└── routes/
    └── +page.svelte             # Main application page
```

### Tech Stack

- **Framework**: Svelte 5 (reactive components, runes)
- **Language**: TypeScript (type safety)
- **Build Tool**: Vite + SvelteKit
- **Color Library**: colorjs.io (OKLCH, contrast, color conversion)
- **Easing**: bezier-easing (lightness curves)
- **Testing**: Playwright (E2E), Vitest (unit)
- **Styling**: Scoped Svelte CSS with design token system (fluid typography, container queries)

### Key Algorithms

#### OKLCH Color Generation

Uses the OKLCH color space for perceptually uniform colors:

```typescript
const color = {
  mode: 'oklch',
  l: lightness, // 0-1
  c: chroma, // 0-0.4
  h: hue // 0-360
};
```

#### Bezier Curve Lightness Distribution

Applies bezier easing to create smooth lightness transitions:

```typescript
const easingFunction = bezier(x1, y1, x2, y2);
const lightness = easingFunction(step / totalSteps);
```

#### Chroma Normalization

Normalizes chroma values across all palettes using matrix transpose and mean:

```typescript
const normalizedChroma = transpose(chromaMatrix).map((column) => mean(column));
// transpose() and mean() are internal helpers in colorUtils.ts
```

#### WCAG Contrast Calculation

Calculates contrast ratios for accessibility:

```typescript
const ratio = getContrast(backgroundColor, textColor);
// Returns 1-21, where 4.5+ is WCAG AA compliant
```

### State Management

Uses Svelte 5 stores for reactive state:

- `colorState` - Base color, warmth, chroma, bezier params
- `lightnessNudgers` - Per-step lightness adjustments
- `hueNudgers` - Per-palette hue adjustments
- `contrastMode` - Auto/manual contrast mode
- `contrastColors` - Low/high contrast colors
- `theme` - Light/dark theme preference

### Performance

- **Initial load**: <200ms
- **Color generation**: <50ms (11 palettes × 11 colors)
- **Export operations**: <100ms
- **Bundle size**: ~316KB (includes dependencies)
- **Memory usage**: Stable, no memory leaks

<p align="right"><a href="#chroma11y">↑ back to top</a></p>

---

## Development

### Running Tests

Run all tests (unit + E2E):

```bash
npm test
```

Run unit tests only:

```bash
npm run test:unit
```

Run E2E tests only:

```bash
npm run test:e2e
```

Run E2E tests in UI mode:

```bash
npx playwright test --ui
```

### Test Coverage

**E2E Tests** (`e2e/`):

- Algorithm validation, export formats, mobile responsiveness
- Design token system (fluid typography, spacing, touch targets, motion preferences)
- URL/localStorage persistence, UI interactions
- Bezier editor interaction, focus indicators
- Visual regression tests (themes, palettes, mobile layouts, bezier editor)

**Unit & DOM Tests** (`src/`):

- Color utility functions, export format generators, URL encoding/decoding
- Component DOM tests (BezierEditor, ColorControls, ColorInfoDrawer, ContrastControls, DisplaySettings, ExportButtons, NeutralPalette, PaletteGrid)
- Favicon generation

### Linting & Formatting

Check code style:

```bash
npm run lint
```

Format code:

```bash
npm run format
```

Type checking:

```bash
npm run check
```

### Building

Create production build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

<p align="right"><a href="#chroma11y">↑ back to top</a></p>

---

## Contributing

Contributions are welcome! Please follow these guidelines:

### Code Style

- Use TypeScript for type safety
- Follow existing code formatting (Prettier)
- Add JSDoc comments for public functions
- Keep components focused and single-purpose

### Testing Requirements

- Add E2E tests for new features
- Ensure all tests pass before submitting PR
- Maintain test coverage for critical paths

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

<p align="right"><a href="#chroma11y">↑ back to top</a></p>

---

## License

This project is licensed under the GPL v3 License - see the [LICENSE](LICENSE) file for details.

---

## Credits

### Migration

Chroma11y is a complete rewrite of the [original vanilla JavaScript color generator](https://codepen.io/andrewpucci/pen/xxQqjvr), achieving feature parity with modern improvements.

### Dependencies

- [colorjs.io](https://colorjs.io/) - Color manipulation and conversion
- [bezier-easing](https://github.com/gre/bezier-easing) - Bezier curve calculations
- [Svelte](https://svelte.dev/) - Reactive UI framework
- [SvelteKit](https://kit.svelte.dev/) - Application framework
- [Playwright](https://playwright.dev/) - End-to-end testing

### Color Science

- OKLCH color space based on [Oklab](https://bottosson.github.io/posts/oklab/)
- WCAG contrast calculations following [WCAG 2.2 guidelines](https://www.w3.org/TR/WCAG22/)
- CIEDE2000 color difference algorithm for named color detection

---
