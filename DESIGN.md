---
name: Chroma11y
description: Accessible color palette generator powered by OKLCH, with WCAG contrast checking and multiple export formats
colors:
  # Primary accent
  accent: '#1862e6'
  accent-hover: '#1352c4'
  # Neutral surfaces (light theme)
  bg-primary: '#ffffff'
  bg-secondary: '#f6f7f9'
  bg-tertiary: '#eef0f4'
  # Text
  text-primary: '#1a1a1a'
  text-secondary: '#636a72'
  # Structural
  border: '#dee2e6'
  # Status semantics
  status-pass-bg: '#166534'
  status-pass-text: '#f0fdf4'
  status-warning-bg: '#9a3412'
  status-warning-text: '#fff7ed'
  status-fail-bg: '#991b1b'
  status-fail-text: '#fef2f2'
  # Dark theme overrides
  dark-bg-primary: '#0d1117'
  dark-bg-secondary: '#121824'
  dark-bg-tertiary: '#1a2231'
  dark-text-primary: '#f0f6fc'
  dark-text-secondary: '#8b949e'
  dark-border: '#30363d'
  dark-accent: '#58a6ff'
  dark-accent-hover: '#79b8ff'
typography:
  display:
    fontFamily: "'Atkinson Hyperlegible Next Variable', system-ui, 'Segoe UI', sans-serif"
    fontSize: 'clamp(1.125rem, 1rem + 0.625vw, 1.5rem)'
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: '-0.02em'
  title:
    fontFamily: "'Atkinson Hyperlegible Next Variable', system-ui, 'Segoe UI', sans-serif"
    fontSize: 'clamp(0.95rem, 0.875rem + 0.375vw, 1.125rem)'
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: '-0.02em'
  body:
    fontFamily: "'Atkinson Hyperlegible Next Variable', system-ui, 'Segoe UI', sans-serif"
    fontSize: 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)'
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: '0'
  label:
    fontFamily: "'Atkinson Hyperlegible Next Variable', system-ui, 'Segoe UI', sans-serif"
    fontSize: 'clamp(0.8rem, 0.75rem + 0.25vw, 0.875rem)'
    fontWeight: 600
    lineHeight: 1
    letterSpacing: '0'
  caption:
    fontFamily: "'Atkinson Hyperlegible Next Variable', system-ui, 'Segoe UI', sans-serif"
    fontSize: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.8rem)'
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: '0'
  mono:
    fontFamily: "'Atkinson Hyperlegible Mono Variable', ui-monospace, 'Cascadia Code', monospace"
    fontSize: 'clamp(0.8rem, 0.75rem + 0.25vw, 0.875rem)'
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: '0'
rounded:
  xs: '5px'
  sm: '10px'
  md: '12px'
  lg: '16px'
  xl: '22px'
  full: '100%'
spacing:
  2xs: '3px'
  xs: '5px'
  sm: '10px'
  md: '16px'
  lg: '22px'
  xl: '36px'
components:
  button-primary:
    backgroundColor: '{colors.accent}'
    textColor: '#ffffff'
    rounded: '{rounded.md}'
    padding: '10px 16px'
  button-primary-hover:
    backgroundColor: '{colors.accent-hover}'
    textColor: '#ffffff'
    rounded: '{rounded.md}'
    padding: '10px 16px'
  button-secondary:
    backgroundColor: '{colors.bg-tertiary}'
    textColor: '{colors.text-primary}'
    rounded: '{rounded.md}'
    padding: '10px 16px'
  button-ghost:
    backgroundColor: 'transparent'
    textColor: '{colors.text-secondary}'
    rounded: '{rounded.md}'
    padding: '10px 16px'
  badge-pass:
    backgroundColor: '{colors.status-pass-bg}'
    textColor: '{colors.status-pass-text}'
    rounded: '{rounded.sm}'
    padding: '3px 8px'
  badge-warning:
    backgroundColor: '{colors.status-warning-bg}'
    textColor: '{colors.status-warning-text}'
    rounded: '{rounded.sm}'
    padding: '3px 8px'
  badge-fail:
    backgroundColor: '{colors.status-fail-bg}'
    textColor: '{colors.status-fail-text}'
    rounded: '{rounded.sm}'
    padding: '3px 8px'
  card:
    backgroundColor: '{colors.bg-secondary}'
    rounded: '{rounded.sm}'
    padding: '16px'
---

# Design System: Chroma11y

## 1. Overview

**Creative North Star: "The Considered Tool"**

Chroma11y is expert tooling that has thought deeply about its own UX. It does not demonstrate sophistication through ornamentation — it communicates it through the quality of its constraints, the clarity of its controls, and the completeness of its output. Every element has earned its place. The surface stays calm so the color can speak.

The design is accessibility-first not as a gesture but as doctrine. The product's reason for existing is WCAG-compliant color systems, and the interface embodies that commitment in its own construction. WCAG 2.2 AA holds everywhere: in the focus ring, in the type scale, in the status badge contrast triads. The font was designed by the Braille Institute for low-vision readers. None of this is incidental.

It rejects three failure modes explicitly: the visual noise of dense enterprise ERP software; the glossy surface of generic SaaS products that flatten every domain into a growth dashboard; and the playful lightness of consumer color tools that undervalue the serious design-system workflow happening here. Chroma11y is not for picking a brand color. It is for building the palette that ships to production.

**Key Characteristics:**

- Flat surfaces with tonal depth — no shadows at rest, depth through background steps
- Atkinson Hyperlegible: a low-vision font that doubles as the brand voice
- A single blue accent reserved strictly for primary actions, focus, and selection state
- Light and dark themes as first-class citizens — both specified, both tested
- Fluid type scale that scales with viewport as an accessibility feature, not decoration

## 2. Colors

The palette is restrained and semantic: one accent, two neutral surface layers, two text weights, one structural border color, and three status roles (pass, warning, fail). Color earns its place by communicating state. It is never decorative.

### Primary

- **Instrument Blue** (`#1862e6` / dark: `#58a6ff`): The single accent. Used only for primary action button fills, focus rings, and active selection states. Its scarcity is intentional — when it appears, it means something.
- **Pressed Blue** (`#1352c4` / dark: `#79b8ff`): The hover and active state of Instrument Blue. Never used at rest.

### Neutral

- **Reference White** (`#ffffff`): Primary canvas. Body background in light mode.
- **Interface Grey** (`#f6f7f9`): Secondary surface. Card and panel backgrounds, the layer just below the canvas.
- **Elevated Surface** (`#eef0f4`): Tertiary level. Secondary button fills, control affordances, the top of the tonal stack.
- **Deep Ink** (`#1a1a1a`): Primary text. Headings, labels, body copy, the darkest neutral in the system.
- **Annotation Grey** (`#636a72`): Secondary text. Supporting labels, taglines, helper descriptions — commentary, not instruction.
- **Structural Mist** (`#dee2e6`): Borders and dividers. Always rendered at reduced opacity via `color-mix` so it reads as structure, not weight.

### Status

- **Accessible Green** (`#166534` bg / `#f0fdf4` text / `#14532d` border): Pass state. WCAG AA or AAA contrast confirmed.
- **Warning Amber** (`#9a3412` bg / `#fff7ed` text / `#c2410c` border): Near-miss or conditional pass. The user's palette is close but not there.
- **Fail Red** (`#991b1b` bg / `#fef2f2` text / `#7f1d1d` border): Contrast failure. An action is required.

**The One Voice Rule.** Instrument Blue appears on ≤10% of any given screen. It marks the primary action, current selection, and keyboard focus only. It is never used as a decorative accent, a section highlight, or a data-viz color.

**The Status Vocabulary Rule.** Green/amber/red are reserved for contrast pass/warning/fail. Never repurpose these colors for any other meaning. In a tool whose entire output is about color decisions, semantic ambiguity in status signals is a serious failure.

## 3. Typography

**Body Font:** Atkinson Hyperlegible Next Variable (`system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif` fallback)
**Mono Font:** Atkinson Hyperlegible Mono Variable (`ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Monaco, Consolas, monospace` fallback)

**Character:** A single-family system using a typeface built for low-vision readers. Atkinson Hyperlegible was created by the Braille Institute to maximize legibility at small sizes and for users with visual impairments — using it is a design statement about the product's values, not only a font choice. The mono variant carries all color values, export output, and code-adjacent content. The type system is single-family, not a display/body pairing — it earns authority through optical clarity, not contrast between styles.

### Hierarchy

- **Display** (bold/700, `clamp(1.125rem → 1.5rem)`, leading 1.2, tracking −0.02em): Brand name and page-level heading. Used once per view.
- **Title** (semibold/600, `clamp(0.95rem → 1.125rem)`, leading 1.5, tracking −0.02em): Card headings, section titles within the interface.
- **Body** (regular/400, `clamp(0.875rem → 1rem)`, leading 1.5): Form labels, descriptions, help text, general copy.
- **Label** (semibold/600, `clamp(0.8rem → 0.875rem)`, leading 1): Button text, badge text, tight control labels.
- **Caption** (regular/400, `clamp(0.75rem → 0.8rem)`, leading 1.5): Taglines, secondary annotations, export option descriptions.
- **Mono** (regular/400, `clamp(0.8rem → 0.875rem)`, leading 1.5): Color values (hex, OKLCH, HSL, RGB), exported CSS/SCSS/JSON output, keyboard shortcut hints.

Note: All type sizes are fluid `clamp()` values. This is an intentional accessibility feature — the type scale responds to viewport width, improving readability on smaller screens without sacrificing density on larger ones.

**The Atkinson Rule.** Never substitute a different typeface. Not for display headings, not for data output, not for decorative quotes. Atkinson Hyperlegible is the brand voice. Its legibility-first design is load-bearing: it is what makes "expert without being intimidating" true at the character level.

## 4. Elevation

This system is flat by default. Card and panel surfaces are differentiated through tonal background steps (`--bg-primary` → `--bg-secondary` → `--bg-tertiary`) and border lines rendered at 40–60% opacity — not through box-shadows. Depth is earned through contrast between tonal layers.

The sole exception: floating UI elements that escape the document flow (dropdowns, tooltips, popovers, dialogs) may use a subtle shadow to communicate their position above the page. This shadow exists for one reason — "I am detached from the layout" — not as decoration.

### Shadow Vocabulary

- **Floating layer** (`box-shadow: 0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)`): Dropdowns, tooltips, popover panels, dialog boxes. Only on elements that visually escape the document.

**The Flat-by-Default Rule.** If an element is part of the document layout, it has no shadow. Reach for a border or a tonal background step instead. If you find yourself adding a shadow to a card, you have the wrong solution.

## 5. Components

### Buttons

Three variants sharing the same geometry: `border-radius: ~12px` (`--radius-md`), `min-height: 44px` (WCAG 2.2 touch target), semibold/600 label text, 100ms ease-out transitions on background, border, color, and transform.

- **Primary:** Instrument Blue fill, white text, 1px accent-tinted border. Reserved for the single most important action in any given context.
- **Secondary:** Elevated Surface (`--bg-tertiary`) fill, Deep Ink text, Structural Mist 1px border. Tints toward Instrument Blue on hover.
- **Ghost:** Transparent fill, Annotation Grey text, dashed 1px Structural Mist border (72% opacity). Used for low-weight actions (Reset, navigation controls). Elevates to Deep Ink on hover.
- **Disabled (all variants):** 55% opacity, `cursor: not-allowed`. No style change beyond opacity.
- **Focus:** `outline: 2px solid var(--accent)` at 2px offset. Accent-colored, consistent with the global focus pattern.

### Cards / Containers

Background: `--bg-secondary` at 94% opacity. Border: 1px `--border` at 60% opacity. Radius: ~10px (`--radius-sm`). Internal padding: `--space-md` (16px).

Collapsible cards use the native `<details>`/`<summary>` HTML element — full keyboard accessibility and screen reader announcement without JavaScript. Card headers carry a bottom divider at 42% border opacity. Cards are never nested.

### Badges

Compact inline status indicators. Six variants: `pass`, `warning`, `fail`, `muted`, `accent`, `disabled`. Each variant defines a three-way triad (background / text / border) that must be used as a unit — never mix colors from different triads. Uppercase + letter-spacing variant available for WCAG/APCA algorithm labels.

### Inputs and Sliders

1px border, `--radius-sm` edges, form-control vocabulary consistent with the button system. Focus uses the global double-outline pattern: `outline: 3px solid var(--focus-outline-inside); box-shadow: 0 0 0 6px var(--focus-outline-outside)` — the two-ring system guarantees ≥3:1 contrast on both light and dark backgrounds by inverting theme-appropriately.

Slider inputs sit beside inline number inputs (native steppers) for precise value entry without mouse precision.

### Navigation / Header

Sticky header, `z-index: 10`, `--bg-primary` fill, 1px bottom border at 55% opacity. Brand (favicon + h1 + tagline) left-aligned; action controls (Help, Reset, Undo/Redo) right-aligned with `--space-xs` gaps. Collapses to stacked layout below 520px container width.

### Color Swatches (Signature Component)

The primary output surface. Each swatch presents a generated color with:

- PASS/WARNING/FAIL badges for both low-contrast and high-contrast text
- The color value in the user's chosen format (hex / RGB / OKLCH / HSL)
- A click-to-copy affordance on the color value
- An accessible name for screen readers

Swatches must never be mistaken for navigation or action elements. Their role is presentation and contrast communication. Do not add hover animations, card-like shadows, or decorative borders that imply interactivity beyond the copy action.

## 6. Do's and Don'ts

### Do:

- **Do** use Instrument Blue (`#1862e6`) only for primary actions, active selection, and focus rings. Its scarcity is the point.
- **Do** use the double-outline focus pattern (`outline` + `box-shadow`) on every interactive element — it is the only focus treatment that guarantees ≥3:1 contrast on both light and dark backgrounds simultaneously.
- **Do** maintain WCAG 2.2 AA minimum contrast everywhere — 4.5:1 for body text, 3:1 for large text — including in dark theme.
- **Do** keep status colors (green/amber/red) reserved for contrast pass/warning/fail only. Their meaning must be unambiguous in a tool that is itself about color decisions.
- **Do** use tonal background steps (`--bg-secondary`, `--bg-tertiary`) and reduced-opacity borders to create surface depth. This is the depth system.
- **Do** use the full 44px minimum touch target (`--touch-target-comfortable`) on all interactive controls.
- **Do** honor `prefers-reduced-motion` — the duration token system collapses to 0ms automatically; do not override this.
- **Do** use `<details>`/`<summary>` for collapsible sections — native keyboard and screen reader support, zero JavaScript.

### Don't:

- **Don't** add box-shadows to cards or any in-document surface. Shadows are reserved for elements that escape the document flow (dropdowns, tooltips, dialogs).
- **Don't** use any font other than Atkinson Hyperlegible Next (body) or Atkinson Hyperlegible Mono (code/values). The typeface is load-bearing to the product's accessibility identity.
- **Don't** add decorative color accents, gradient fills, or illustrations to the chrome. The interface is the frame; the generated palette is the content.
- **Don't** use enterprise ERP aesthetics — dense chrome, overwhelming panel-based toolbars, dark modal-heavy workflows.
- **Don't** use generic SaaS startup UI patterns: soft purple accents, hero-metric dashboards, gradient CTAs, rounded-everything aesthetic. This is a precision tool, not a growth product.
- **Don't** use consumer color app patterns (Coolors-style gradient text, candy colors, celebratory animations on color generation). The audience is building production-grade design systems.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored stripe accent on cards, list items, or callouts.
- **Don't** use gradient text (`background-clip: text` with a gradient). Status and hierarchy are communicated through badge fill, weight, and size — not decorative text treatments.
- **Don't** introduce bounce or elastic easing (overshoot curves with control points outside the 0–1 range). Motion decelerates with exponential ease-out. Use `--ease-out` (or `--ease-spring`, now an `easeOutExpo` curve) for transitions.
- **Don't** nest cards. One layer of card surface maximum.
