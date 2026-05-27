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

**Configuration Diff**:
An explanation of how the **Current Palette Configuration** differs from the **Reference Configuration** that appears in **Comparison View**.
_Avoid_: settings diff, config delta

**Configuration Diff Entry**:
A single explained difference inside a **Configuration Diff** rather than a coarse summary of a whole category.
_Avoid_: catch-all change line, lumped diff

**Comparison Metric**:
The color-difference method **Comparison View** uses to evaluate swatch color changes.
_Avoid_: diff algorithm, compare math

**Swatch Change Threshold**:
The minimum color difference, measured in the selected **Comparison Metric**, before a swatch gets a color-only **Change Annotation** in **Comparison View**.
_Avoid_: sensitivity percent, compare slider

**Constraint**:
An authored rule in the **Palette Configuration** that expresses a target color or contrast requirement for the palette system.
_Avoid_: solve output, optimization result

**Custom Naming**:
User-authored palette-name overrides in the **Palette Configuration** for the neutral palette or generated palettes.
_Avoid_: auto names, derived labels

**Contrast Reference**:
The selected swatch in auto contrast mode that determines a low or high contrast color in the **Palette Configuration**.
_Avoid_: resolved contrast color, manual contrast input

**Contrast Algorithm**:
The shared inspection method used to evaluate contrast while reading current and reference output.
_Avoid_: frozen reference rule, authored contrast setting

**Theme Preference**:
The authored theme selection in the **Palette Configuration** that chooses the light, dark, or auto theme behavior used to generate the palette system.
_Avoid_: viewer theme, cosmetic mode

**Resolved Theme**:
The concrete light or dark theme actually used to generate palette output at a given moment.
_Avoid_: inspection theme, cosmetic theme result

**Resolved Theme Drift**:
Palette-output differences caused by a current `auto` theme resolving differently from the frozen reference baseline even though the authored **Theme Preference** still matches.
_Avoid_: theme config change, viewer bug

**Shared Inspection Settings**:
Read-time viewing settings such as display color space, gamut mapping, swatch labels, gamut-warning visibility, contrast-indicator visibility and levels, contrast algorithm, and CVD simulation that affect how both sides are inspected without becoming authored differences between the current and reference configurations.
_Avoid_: pinned config differences, comparison settings

**Comparison Settings**:
Local user preferences that tune how **Comparison View** explains differences without becoming part of shared URL state or the pinned **Reference Configuration**.
_Avoid_: reference state, share settings

**Reset to Defaults**:
An explicit action that restores the current workspace to the default palette configuration and default **Comparison Settings**.
_Avoid_: clear reference, preserve compare prefs

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
- A **Configuration Diff** belongs to **Comparison View**, not **Reference View**
- A **Configuration Diff** is composed of individual **Configuration Diff Entry** items
- A **Configuration Diff** appears in the main **Comparison View** reading area, not in the sidebar controls
- A **Configuration Diff** stays visible with an explicit success state when there are no configuration-level differences
- A **Configuration Diff Entry** reads from **Reference Configuration** to **Current Palette Configuration**
- A **Reference Configuration** includes authored **Constraint** definitions
- A **Reference Configuration** excludes **Shared Inspection Settings**
- Editing an existing **Constraint** produces a changed **Configuration Diff Entry**, not a remove-and-add pair
- Enabling or disabling a **Constraint** changes the **Palette Configuration** and belongs in **Configuration Diff**
- **Shared Inspection Settings** are excluded from **Configuration Diff**
- **Shared Inspection Settings** are applied symmetrically to both current and reference sides while reading **Comparison View**
- **Contrast Algorithm** is a **Shared Inspection Setting**
- **Theme Preference** belongs to the authored **Palette Configuration**, not **Shared Inspection Settings**
- A **Reference Configuration** pinned under **Theme Preference** `auto` preserves that authored choice while also freezing the **Resolved Theme** that generated the baseline
- Restoring a **Reference Configuration** reproduces its frozen **Resolved Theme** so the current palette can exactly match the pinned baseline
- An authored **Theme Preference** change creates a **Configuration Diff** entry even if the generated output happens to match
- Matching authored **Theme Preference** values do not create a **Configuration Diff** entry just because their **Resolved Theme** differs
- **Resolved Theme Drift** can appear in **Comparison View** without creating a **Configuration Diff** entry
- A **Resolved Theme Drift** note remains visible even when other **Configuration Diff** entries also exist
- **Resolved Theme Drift** remains a theme-specific concept unless another real class of non-authored output drift appears
- A **Resolved Theme Drift** note belongs to **Comparison View**, not **Reference View**
- A **Resolved Theme Drift** note appears above **Configuration Diff** in **Comparison View**
- A **Resolved Theme Drift** note explicitly names the current and pinned **Resolved Theme** values
- A **Resolved Theme Drift** note appears only when both sides still use authored `auto` **Theme Preference** values but their **Resolved Theme** values differ
- When **Resolved Theme Drift** is the only explanation, **Configuration Diff** still shows its explicit success state beneath the drift note
- **Theme Preference** appears in the generation portion of **Configuration Diff**
- A **Theme Preference** diff entry stays anchored on authored values and includes **Resolved Theme** only as supporting detail when `auto` is involved
- A one-sided **Configuration Diff Entry** uses explicit add/remove language instead of an empty-value comparison
- Structural generation changes do not create separate **Configuration Diff Entry** items for untouched default-valued slots they incidentally introduce
- Structural generation changes do create explicit removed **Configuration Diff Entry** items when they eliminate non-default authored overrides
- A **Configuration Diff** reports **Custom Naming** changes only when user-authored overrides differ
- In auto contrast mode, a **Contrast Reference** change is the primary contrast explanation in **Configuration Diff**
- In manual contrast mode, explicit contrast colors are the primary contrast explanation in **Configuration Diff**
- In auto contrast mode, resolved contrast-color drift without a **Contrast Reference** change does not create a contrast **Configuration Diff Entry**
- **Comparison Metric** and **Swatch Change Threshold** are **Comparison Settings**
- Each **Comparison Metric** remembers its own **Swatch Change Threshold**
- Each **Comparison Metric** has its own default **Swatch Change Threshold**
- The default **Swatch Change Threshold** is `0.02` for `Delta E OK` and `2` for `Delta E 2000`
- **Comparison Settings** persist locally even if the **Reference Configuration** is cleared
- **Reset to Defaults** restores default **Comparison Settings**
- A **Swatch Change Threshold** only affects color-only **Change Annotations**
- A color-only difference at or above the **Swatch Change Threshold** gets a **Change Annotation**
- A **Swatch Change Threshold** does not suppress **Configuration Diff** entries
- A **Change Annotation** can represent a **Structural Change**, an **Accessibility-Status Change**, or a color-only difference
- Swatch-level **Change Annotations** and quieting are emphasized on the current side, while structural markers can appear on either side when needed
- Generation nudger changes are explained as targeted **Configuration Diff Entry** items, not opaque array summaries
- Granular **Configuration Diff Entry** items follow the same reading order users see in the compared palettes and authored constraint list
- A **Color-Only Difference** is still a **Change Annotation** in **Comparison View**
- A **Structural Change** remains explicit regardless of color-difference thresholds
- An **Accessibility-Status Change** remains explicit regardless of color-difference thresholds

## Example dialogue

> **Dev:** "Once a user pins the current palette, are they automatically in **Comparison View**?"
> **Domain expert:** "No. Pinning creates a **Reference Configuration** and puts them into **Reference View** by default. **Comparison View** is a separate, explicit mode for reading differences."
>
> **Dev:** "If a swatch stays AA-pass but its color shifts, is that still a **Change Annotation**?"
> **Domain expert:** "Yes. **Accessibility-Status Change** is only one kind of annotation. Color-only differences and **Structural Changes** still count in **Comparison View**."
>
> **Dev:** "Should **Configuration Diff** show up as soon as a **Reference Configuration** exists?"
> **Domain expert:** "No. **Reference View** stays focused on side-by-side reading. **Configuration Diff** belongs to **Comparison View**."
>
> **Dev:** "Is **Swatch Change Threshold** a percentage slider or a Delta E cutoff?"
> **Domain expert:** "It is a raw cutoff in the selected **Comparison Metric**. It only suppresses color-only annotations, not structural or accessibility-status changes."
>
> **Dev:** "When I pin a **Reference Configuration**, do its constraints come with it?"
> **Domain expert:** "Yes. Authored **Constraint** definitions are part of the **Palette Configuration**. Solve output is not."
>
> **Dev:** "If I clear the **Reference Configuration**, do I lose my **Comparison Metric** and **Swatch Change Threshold** too?"
> **Domain expert:** "No. Those are local **Comparison Settings**. Clearing the baseline should not reset how the user prefers to read differences."
>
> **Dev:** "If several constraints change, do we just say 'constraints changed'?"
> **Domain expert:** "No. **Configuration Diff** should use separate **Configuration Diff Entry** items so each added, removed, or edited constraint is explicit."
>
> **Dev:** "If a palette's auto-generated name changes because the colors changed, does that belong in **Configuration Diff**?"
> **Domain expert:** "No. Only **Custom Naming** changes belong there. Derived labels are presentation, not authored configuration."
>
> **Dev:** "In auto contrast mode, do we diff the reference swatch choice or just the resulting colors?"
> **Domain expert:** "The **Contrast Reference** change is primary because it reflects the user's authored choice. Resolved colors are supporting detail. In manual mode, the explicit colors are primary."
>
> **Dev:** "If I edit a constraint row in place, is that a removed rule plus an added rule?"
> **Domain expert:** "No. An inline edit is still the same **Constraint** and should appear as a changed **Configuration Diff Entry**. Added and removed entries are for explicit row creation and deletion."
>
> **Dev:** "If I only disable a constraint, is that too minor for **Configuration Diff**?"
> **Domain expert:** "No. Enabled state changes how the rule governs the palette, so it is a real **Palette Configuration** change and should be explicit in **Configuration Diff**."
>
> **Dev:** "What if auto contrast resolves to different colors even though the reference swatch choices stayed the same?"
> **Domain expert:** "That is generated output drift, not a contrast configuration change. **Configuration Diff** should explain the authored generation changes, while contrast entries in auto mode stay tied to **Contrast Reference** changes."
>
> **Dev:** "When I switch **Comparison Metric**, should the threshold number carry over?"
> **Domain expert:** "No. Each **Comparison Metric** should remember its own **Swatch Change Threshold** and have its own default instead of reusing a misleading numeric carryover."
>
> **Dev:** "What are the defaults for those two metrics?"
> **Domain expert:** "Use `0.02` for `Delta E OK` and `2` for `Delta E 2000` so comparison uses the repo's existing threshold vocabulary."
>
> **Dev:** "Should **Configuration Diff** live next to the comparison controls in the sidebar?"
> **Domain expert:** "No. Controls stay in the sidebar. **Configuration Diff** is explanatory output, so it belongs in the main **Comparison View** reading area above the side-by-side comparison."
>
> **Dev:** "If there are no configuration-level changes, should **Configuration Diff** disappear?"
> **Domain expert:** "No. Keep an explicit success state so **Comparison View** still explains that there are no configuration-level differences."
>
> **Dev:** "Could the configs differ while the swatches still stay quiet under the threshold?"
> **Domain expert:** "Yes. `Swatch Change Threshold` only affects color-only swatch annotations. **Configuration Diff** still reports configuration differences even when the comparison view shows no threshold-crossing swatch chips."
>
> **Dev:** "If gamut mapping is a shared inspection lens, should changing it after pinning affect only the current side?"
> **Domain expert:** "No. **Shared Inspection Settings** apply symmetrically while reading the comparison. They are excluded from **Configuration Diff** because they are part of the viewing lens, not authored differences."
>
> **Dev:** "If they are a shared lens, do those settings still get frozen into the **Reference Configuration**?"
> **Domain expert:** "No. **Reference Configuration** captures the authored baseline, not the shared inspection lens."
>
> **Dev:** "Should every swatch chip appear on both sides?"
> **Domain expert:** "No. Swatch-level emphasis belongs on the current side so the editable result stays action-oriented. Structural markers can still appear on either side when the compared structure itself differs."
>
> **Dev:** "If clearing the reference keeps my comparison preferences, what about a full reset?"
> **Domain expert:** "A full **Reset to Defaults** is stronger. It should restore the default palette configuration and the default **Comparison Settings**."
>
> **Dev:** "What about switching from WCAG 2.2 to APCA after pinning?"
> **Domain expert:** "That changes the shared inspection lens, not the authored baseline. **Contrast Algorithm** should be applied symmetrically while reading both sides, not frozen into the **Reference Configuration**."
>
> **Dev:** "If I tweak one neutral step or one palette hue, can **Configuration Diff** just say 'adjustments changed'?"
> **Domain expert:** "No. Generation nudgers should be explained as targeted **Configuration Diff Entry** items so the affected step or palette is explicit."
>
> **Dev:** "If I pin while **Theme Preference** is `auto`, should the baseline keep following future OS theme changes?"
> **Domain expert:** "No. The authored **Theme Preference** remains `auto`, but the **Reference Configuration** also freezes the **Resolved Theme** used to generate that baseline so it does not drift later."
>
> **Dev:** "When I restore that reference later, should `auto` immediately follow the current OS theme again?"
> **Domain expert:** "No. Restore should reproduce the pinned baseline exactly, including its frozen **Resolved Theme**, or the current side would still differ right after restore."
>
> **Dev:** "If both sides still say `auto` but they resolve differently later, does that become a theme diff?"
> **Domain expert:** "No. The authored **Theme Preference** still matches, so **Configuration Diff** stays silent. That is output drift from different **Resolved Theme** values, not an authored configuration change."
>
> **Dev:** "What if the authored theme changes from `auto` to `light`, but the palette output happens to look the same right now?"
> **Domain expert:** "That is still a real **Theme Preference** change and belongs in **Configuration Diff**. Temporary output equality does not erase an authored configuration change."
>
> **Dev:** "Even though the Theme control lives with display settings in the UI, where does it belong in the diff?"
> **Domain expert:** "In the generation portion of **Configuration Diff**. Its current control placement is incidental; its domain effect is palette generation."
>
> **Dev:** "If a theme diff involves `auto`, should the entry just say `Auto → Light`?"
> **Domain expert:** "No. Keep the authored **Theme Preference** primary, but include the frozen **Resolved Theme** as supporting detail when `auto` is involved so the baseline remains legible."
>
> **Dev:** "Should the drift note be generic, or should it say which themes are involved?"
> **Domain expert:** "Name both. A **Resolved Theme Drift** note should say how the current `auto` theme resolves now and which **Resolved Theme** the pinned baseline was generated with."
>
> **Dev:** "When exactly does that note appear?"
> **Domain expert:** "Only when both sides still use authored `auto` **Theme Preference** values and their **Resolved Theme** values differ. If the authored theme changed, explain that through **Configuration Diff** instead."
>
> **Dev:** "If that drift note is the only explanation, should the diff success state disappear?"
> **Domain expert:** "No. Keep the drift note and still show the explicit **Configuration Diff** success state. One explains output drift; the other confirms there are no authored configuration changes."
>
> **Dev:** "If something exists on only one side, should the diff say `none → value`?"
> **Domain expert:** "No. Use explicit add/remove language. A real addition or removal should read like an action, not like an awkward empty-value comparison."
>
> **Dev:** "If increasing the step count creates new nudger slots that are still at their default values, should those show up as added diff entries?"
> **Domain expert:** "No. Those untouched defaults are just fallout from the structural change. Show the step-count change itself, not a pile of incidental zero-valued additions."
>
> **Dev:** "What if shrinking the structure removes a slot that had a real authored override?"
> **Domain expert:** "Then show it. If a structural shrink deletes a non-default authored override, that removal belongs in **Configuration Diff** alongside the count change."
>
> **Dev:** "If the configs still match, why are the swatches different?"
> **Domain expert:** "That is **Resolved Theme Drift**. The authored **Theme Preference** is still the same, but the current `auto` theme resolved differently from the frozen baseline."
>
> **Dev:** "What if there is also a real base-color change at the same time?"
> **Domain expert:** "Keep the **Resolved Theme Drift** note anyway. It explains a separate source of output difference that **Configuration Diff** should not misclassify as an authored change."
>
> **Dev:** "Should we generalize that into some broader environment-drift term now?"
> **Domain expert:** "No. Keep it theme-specific until the product actually has another real class of non-authored output drift."
>
> **Dev:** "Should that note also show up in the quieter side-by-side view?"
> **Domain expert:** "No. It belongs to **Comparison View** because it explains why the sides differ. **Reference View** stays the quieter baseline."
>
> **Dev:** "If that note exists, should it come before or after **Configuration Diff**?"
> **Domain expert:** "Put it first. **Resolved Theme Drift** is the broader caveat about why output differs, and **Configuration Diff** should be read within that frame."
>
> **Dev:** "Once the diff is granular, how should those entries be ordered?"
> **Domain expert:** "Use the same reading order users already see in the compared palettes and authored constraint list so the explanation lines up with the rest of the interface."
>
> **Dev:** "If a color-only difference lands exactly on the **Swatch Change Threshold**, does it stay quiet?"
> **Domain expert:** "No. The threshold is the minimum qualifying difference, so an exact-threshold match still gets a **Change Annotation**."
>
> **Dev:** "When a **Configuration Diff Entry** shows values, which direction should it read?"
> **Domain expert:** "Read from **Reference Configuration** to **Current Palette Configuration** so the baseline comes first and the edited result comes second."

## Flagged ambiguities

- "comparison" was being used to mean both the overall baseline workflow and the specific annotated mode — resolved: use **Reference View** for the default side-by-side state and **Comparison View** for the explicit difference-emphasizing state
- "baseline" and "reference" were being used interchangeably — resolved: use **Reference Configuration** as the canonical term
- "configuration diff" could have been read as a general reference-workspace summary — resolved: it is a **Comparison View** explanation, not a **Reference View** default element
- "swatch change threshold" could have been read as a normalized percentage — resolved: it is a raw cutoff in the selected **Comparison Metric**
- "constraints" could have been read as solver artifacts instead of authored rules — resolved: authored **Constraint** definitions belong to the **Palette Configuration**; solve output does not
- "comparison settings" could have been read as part of the pinned baseline — resolved: they are local preferences that survive clearing the **Reference Configuration**
- "configuration diff" could have been implemented as category-level blobs — resolved: it should explain changes through individual **Configuration Diff Entry** items
- "configuration diff placement" could have drifted into the sidebar with controls — resolved: it belongs in the main **Comparison View** reading area
- "no configuration changes" could have hidden the entire **Configuration Diff** surface — resolved: keep an explicit success state
- "naming changes" could have included derived palette labels — resolved: only **Custom Naming** changes belong in **Configuration Diff**
- "contrast settings and references" could have collapsed authored reference changes into resolved colors — resolved: auto mode explains **Contrast Reference** changes primarily; manual mode explains explicit colors
- "constraint changes" could have reported inline edits as remove-and-add churn — resolved: inline edits are changed entries; add/remove is reserved for explicit row creation or deletion
- "disabled constraints" could have been treated as cosmetic UI state — resolved: enabled state is part of the authored **Palette Configuration** and belongs in **Configuration Diff**
- "theme" could have drifted into the shared viewing lens — resolved: **Theme Preference** remains part of the authored **Palette Configuration**
- "`auto` theme" could have left the pinned baseline drifting with future system theme changes — resolved: a pinned **Reference Configuration** freezes the **Resolved Theme** used at pin time
- "restore reference" could have reapplied authored `auto` semantics instead of the frozen baseline — resolved: restore reproduces the pinned **Resolved Theme** exactly
- "same `auto` preference" could have been misreported as a theme configuration change when the environment resolved it differently — resolved: that is not a **Configuration Diff** entry
- "same output" could have been mistaken for "no theme configuration change" — resolved: authored **Theme Preference** changes still belong in **Configuration Diff**
- "theme" could have followed its current UI placement into inspection-oriented diff categories — resolved: **Theme Preference** belongs with generation changes
- "`auto` theme" could have made diff entries too abstract to interpret — resolved: include **Resolved Theme** as supporting detail when needed
- "theme drift note" could have been too vague to trust — resolved: explicitly name the current and pinned **Resolved Theme** values
- "theme drift note" could have triggered for ordinary authored theme changes — resolved: it appears only for matching authored `auto` preferences with differing **Resolved Theme** values
- "theme drift only" could have suppressed the diff success state — resolved: keep both explanations visible
- "one-sided diff entries" could have fallen back to empty-value serialization — resolved: use explicit add/remove language
- "structural additions" could have exploded into noise from untouched default slots — resolved: suppress incidental default-valued additions
- "structural shrink" could have hidden real authored overrides that disappeared with it — resolved: show explicit removals for non-default authored overrides
- "same authored theme" could have been mistaken for identical generated output — resolved: **Resolved Theme Drift** can still create comparison differences
- "theme drift note" could have been hidden when real config changes also existed — resolved: keep the note visible because it explains a separate cause
- "environment drift" could have been generalized too early — resolved: keep **Resolved Theme Drift** theme-specific for now
- "theme drift note" could have leaked into the baseline side-by-side mode — resolved: keep it in **Comparison View** only
- "theme drift note" could have been buried after **Configuration Diff** — resolved: place it above the diff as the broader explanation
- "auto contrast color drift" could have been mistaken for authored contrast configuration change — resolved: without a **Contrast Reference** change, it is generated output drift, not a contrast **Configuration Diff** entry
- "metric switching" could have reused one threshold number across incompatible scales — resolved: each **Comparison Metric** remembers its own threshold and has its own default
- "no visible swatch changes" could have been mistaken for "no configuration changes" — resolved: threshold quietness and **Configuration Diff** are separate explanations
- "shared inspection settings" could have created one-sided comparison outcomes after pinning — resolved: they are a symmetric viewing lens, not authored differences
- "shared inspection settings" could have leaked into the pinned baseline — resolved: they are excluded from the **Reference Configuration**
- "comparison emphasis" could have duplicated every swatch chip on both sides — resolved: swatch-level emphasis stays on the current side; structural markers remain bilateral when needed
- "contrast algorithm" could have been treated as a frozen authored difference instead of a shared reading lens — resolved: it is a **Shared Inspection Setting**
- "generation adjustments" could have collapsed into array-level blobs — resolved: nudger changes should be explained as targeted **Configuration Diff Entry** items
- "reset behavior" could have followed the same rule as clearing the reference — resolved: **Reset to Defaults** restores default **Comparison Settings**
- "granular diff ordering" could have become an arbitrary log order — resolved: keep the interface reading order
- "threshold equality" could have fallen through the gap between changed and quiet — resolved: equality counts as meeting the minimum qualifying difference
- "diff direction" could have reversed baseline and edited values — resolved: show **Reference Configuration** first, then **Current Palette Configuration**
