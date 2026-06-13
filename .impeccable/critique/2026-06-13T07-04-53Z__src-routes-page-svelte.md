---
target: main palette page (src/routes/+page.svelte)
total_score: 30
p0_count: 0
p1_count: 1
timestamp: 2026-06-13T07-04-53Z
slug: src-routes-page-svelte
---

## Design Health Score

| #         | Heuristic                       | Score     | Key Issue                                                                                                        |
| --------- | ------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------- |
| 1         | Visibility of System Status     | 3         | Live ARIA announcements + collapsed-card summaries + URL sync; no explicit "generating" state (but it's instant) |
| 2         | Match System / Real World       | 3         | OKLCH/warmth/chroma/AA/AAA is correct language for the audience; opaque to a true first-timer                    |
| 3         | User Control and Freedom        | 4         | Undo/redo with jump-to-step, Reset with confirm, shareable URL state, Pin Reference                              |
| 4         | Consistency and Standards       | 4         | Uniform Card pattern, badge vocabulary, button variants; detector clean                                          |
| 5         | Error Prevention                | 3         | Reset confirm, chroma clamped to gamut, constraint evaluation                                                    |
| 6         | Recognition Rather Than Recall  | 3         | Collapsed cards expose summaries; everything labelled; split undo/redo carets are slightly hidden                |
| 7         | Flexibility and Efficiency      | 3         | Keyboard undo/redo, URL share, multi-format export, advanced sections; no broader shortcut set                   |
| 8         | Aesthetic and Minimalist Design | 2         | Per-swatch badge matrix repeats LOW/HIGH + 3:1/AA/AAA labels everywhere; color is subordinate to chrome          |
| 9         | Error Recovery                  | 2         | generateColors try/catch announces failure, but little visible user-facing error state                           |
| 10        | Help and Documentation          | 3         | Help button, Getting Started dialog + callout, info tooltips                                                     |
| **Total** |                                 | **30/40** | **Good — solid foundation, address the weak areas**                                                              |

## Anti-Patterns Verdict

**Does this look AI-generated? No.** This is the genuine article — a precision tool that reads like Linear/Figma-adjacent software, not SaaS slop.

**LLM assessment**: No cream/sand body bg, no gradient text, no hero-metric template, no eyebrow kickers, no identical-card decoration. The tonal layering is calm and the sidebar/content split is conventional in the right way. Atkinson Hyperlegible reinforces the accessibility-first identity. Nothing here pauses a category-fluent user.

**Deterministic scan**: `detect.mjs --json src/routes src/lib/components` returned `[]` — zero slop patterns across routes and components. Clean.

**Console**: 0 errors, 4 warnings — a SvelteKit `history.pushState` router-conflict warning (urlUtils bypasses `$app/navigation`) and three Travels `undefined`-vs-`null` persistence warnings (warmthHue, customNeutralName, customPaletteNames). Not user-visible, but correctness smells.

## Overall Impression

The strongest thing about this interface is that the product's value — simultaneous WCAG 3:1/AA/AAA pass-fail for low and high references, per step — is visible at a glance on every swatch. The biggest opportunity is the inverse of that strength: the swatch you're evaluating shows more _chrome_ than _color_. The thing under test (the color) is a thin strip; a dark panel of repeated text badges dominates each tile.

## What's Working

- **Information density that serves the task.** A designer can scan 11 neutrals × 6 contrast verdicts without a single click. For the target audience this is the product.
- **Genuine state control.** Undo/redo with jump-to-history, shareable URL state, and Reset-with-confirm give power users real freedom — a level most tools skip.
- **Identity matches mission.** Atkinson Hyperlegible, the flat tonal system, and the restrained one-accent palette all read "accessibility tool" without saying it.

## Priority Issues

- **[P1] Header doesn't reflow on mobile.** At 390px the action cluster (Pin Reference / Help / Reset / Undo / Redo) wraps into a tall vertical stack consuming roughly half the viewport before any content. Root cause: `AppHeader.svelte` puts `container-type: inline-size` on `.topbar-inner` itself, then the `@container (max-width: 520px)` rule tries to restyle `.topbar-inner` — but a container query can't size an element against its own width, so the intended `flex-direction: column; align-items: flex-start` never fires. **Fix:** move `container-type` to a wrapping ancestor (e.g. `.topbar`), or switch this header rule to a plain `@media` query. **Command:** `/impeccable adapt header`
- **[P2] Color is subordinate to chrome on each swatch.** The color being evaluated is a thin band while a dark badge panel dominates the tile. For a color tool the color should carry more visual weight. **Fix:** let the color fill more of the tile and make the badge matrix lighter-weight or reveal-on-demand. **Command:** `/impeccable layout palette swatch`
- **[P2] Repeated labels create avoidable noise.** Every swatch re-prints LOW/HIGH column headers and 3:1/AA/AAA row labels — 6 labels × every neutral and palette swatch. This is the heuristic-8 weak point. **Fix:** hoist headers to once-per-column/row, or use icon-only badges with the legend stated once. **Command:** `/impeccable distill palette swatch`
- **[P2] Console correctness smells.** SvelteKit router-conflict warning (use `pushState`/`replaceState` from `$app/navigation`) and three `undefined`→`null` persistence warnings. **Command:** `/impeccable harden`
- **[P3] First-timer jargon.** "Ironside" as a neutral-palette name, plus OKLCH/warmth/chroma, lean on prior knowledge; tooltips and Getting Started mitigate but don't fully bridge. **Command:** `/impeccable clarify`

## Persona Red Flags

**Alex (Power User)**: Well served — keyboard undo/redo, URL share, export formats. Red flag: no discoverable shortcut reference; the split undo/redo dropdown carets are the only hint at history depth.

**Sam (Accessibility-Dependent)**: This is the target user and it mostly delivers — pass/fail uses check/cross icons (not color alone), skip link present, ARIA tablist on reference views, live announcements. Red flag: at mobile width the header's wasted vertical stack pushes all controls below a tall dead zone, and the per-swatch density is heavy under screen magnification.

**Casey (Mobile)**: Red flag: the broken header reflow (P1) is most punishing here — half the first screen is a button stack before any palette is visible.

## Minor Observations

- The collapsed-card summaries on mobile (`#5EF784, 11 colors, 11 palettes`) are an excellent touch — recognition over recall done right.
- "New to Chroma11y?" callout placement (between Generation and Constraints) is well judged.

## Questions to Consider

- What if the color owned 60% of each swatch and the contrast verdicts were a compact icon strip, with the full matrix on hover/expand?
- Does every swatch need its own column/row labels, or would a single legend per palette row carry the same meaning with a fraction of the ink?
- What would the _confident_ mobile header look like — would Pin/Help/Reset collapse into an overflow menu rather than stacking?
