# Chroma11y

Chroma11y is an accessible palette-generation and inspection tool. This context defines the product language for the reference-and-comparison workflow so feature work uses stable terms instead of ad hoc UI labels.

## Language

**Palette Configuration**:
The complete set of user-authored inputs that defines a palette system.
_Avoid_: state, settings, palette data

**Current Palette Configuration**:
The live, editable **Palette Configuration** the user is actively changing.
_Avoid_: draft, working copy, candidate config

**Reference Configuration**:
A frozen **Palette Configuration** pinned as the baseline for comparison.
_Avoid_: saved palette, snapshot, comparison target

**Reference View**:
The default side-by-side presentation state shown when a **Reference Configuration** exists.
_Avoid_: comparison mode, side-by-side mode

**Comparison View**:
An explicit presentation state layered on top of **Reference View** that emphasizes differences between the current and reference sides.
_Avoid_: default comparison, automatic compare mode

**Change Annotation**:
A visible indicator in **Comparison View** that calls out a difference between current and reference output.
_Avoid_: diff badge, compare marker

**Structural Change**:
An addition or removal in palette or step structure between the current and reference sides.
_Avoid_: layout change, shape mismatch

**Accessibility-Status Change**:
A change in a swatch's contrast outcome or gamut-warning state between the current and reference sides.
_Avoid_: accessibility regression, status diff

**Color-Only Difference**:
A swatch difference where the color changes but the compared accessibility-status does not.
_Avoid_: cosmetic change, visual-only diff

## Relationships

- A **Current Palette Configuration** can be pinned as a **Reference Configuration**
- A **Reference Configuration** causes **Reference View** to become the default presentation state
- **Comparison View** requires an existing **Reference Configuration**
- **Comparison View** preserves the side-by-side structure of **Reference View** while adding explicit change emphasis
- A **Change Annotation** can represent a **Structural Change**, an **Accessibility-Status Change**, or a color-only difference
- A **Color-Only Difference** is still a **Change Annotation** in **Comparison View**
- A **Structural Change** remains explicit regardless of color-difference thresholds
- An **Accessibility-Status Change** remains explicit regardless of color-difference thresholds

## Example dialogue

> **Dev:** "Once a user pins the current palette, are they automatically in **Comparison View**?"
> **Domain expert:** "No. Pinning creates a **Reference Configuration** and puts them into **Reference View** by default. **Comparison View** is a separate, explicit mode for reading differences."
>
> **Dev:** "If a swatch stays AA-pass but its color shifts, is that still a **Change Annotation**?"
> **Domain expert:** "Yes. **Accessibility-Status Change** is only one kind of annotation. Color-only differences and **Structural Changes** still count in **Comparison View**."

## Flagged ambiguities

- "comparison" was being used to mean both the overall baseline workflow and the specific annotated mode — resolved: use **Reference View** for the default side-by-side state and **Comparison View** for the explicit difference-emphasizing state
- "baseline" and "reference" were being used interchangeably — resolved: use **Reference Configuration** as the canonical term
