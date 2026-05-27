<script lang="ts">
  import NeutralPalette from './NeutralPalette.svelte';
  import PaletteGrid from './PaletteGrid.svelte';
  import {
    contrastAlgorithm,
    contrastColors,
    comparisonMetric,
    gamutSpace,
    swatchChangeThreshold
  } from '$lib/stores';
  import {
    buildComparisonAnnotation,
    type ComparisonAnnotation,
    type ComparisonStatusConfig
  } from '$lib/comparisonViewAnnotations';
  import {
    buildSideBySideNeutralAlignment,
    buildSideBySidePaletteAlignments
  } from '$lib/comparisonRender';
  import type Color from 'colorjs.io';
  import type { ReferenceWorkspaceSnapshot } from '$lib/referenceWorkspace';
  import type { ContrastAlgorithm, GamutSpace } from '$lib/types';

  interface Props {
    viewMode: Extract<ReferenceWorkspaceSnapshot['viewMode'], 'reference' | 'comparison'>;
    currentNeutrals: Color[];
    currentNeutralsHex: string[];
    currentNeutralsDisplay: string[];
    currentNeutralsSimulatedDisplay: string[] | null;
    currentPalettes: Color[][];
    currentPalettesHex: string[][];
    currentPalettesDisplay: string[][];
    currentPalettesSimulatedDisplay: string[][] | null;
    currentLightnessNudgers: number[];
    currentHueNudgers: number[];
    referenceNeutrals: Color[];
    referenceNeutralsHex: string[];
    referenceNeutralsDisplay: string[];
    referenceNeutralsSimulatedDisplay: string[] | null;
    referencePalettes: Color[][];
    referencePalettesHex: string[][];
    referencePalettesDisplay: string[][];
    referencePalettesSimulatedDisplay: string[][] | null;
    referenceCustomNeutralName?: string;
    referenceCustomPaletteNames?: string[];
    referenceContrastColors?: { low: string; high: string };
    referenceContrastAlgorithm?: ContrastAlgorithm;
    referenceGamutSpace?: GamutSpace;
    onCurrentHistoryCommit?: (message: string) => void;
  }

  let {
    viewMode,
    currentNeutrals,
    currentNeutralsHex,
    currentNeutralsDisplay,
    currentNeutralsSimulatedDisplay,
    currentPalettes,
    currentPalettesHex,
    currentPalettesDisplay,
    currentPalettesSimulatedDisplay,
    currentLightnessNudgers,
    currentHueNudgers,
    referenceNeutrals,
    referenceNeutralsHex,
    referenceNeutralsDisplay,
    referenceNeutralsSimulatedDisplay,
    referencePalettes,
    referencePalettesHex,
    referencePalettesDisplay,
    referencePalettesSimulatedDisplay,
    referenceCustomNeutralName = undefined,
    referenceCustomPaletteNames = undefined,
    referenceContrastColors = undefined,
    referenceContrastAlgorithm = undefined,
    referenceGamutSpace = undefined,
    onCurrentHistoryCommit = () => {}
  }: Props = $props();

  const currentContrastColors = $derived($contrastColors);
  const currentContrastAlgorithm = $derived($contrastAlgorithm);
  const currentComparisonMetric = $derived($comparisonMetric);
  const currentGamutSpace = $derived($gamutSpace);
  const currentSwatchChangeThreshold = $derived($swatchChangeThreshold);

  const currentStatusConfig = $derived<ComparisonStatusConfig>({
    contrast: currentContrastColors,
    contrastAlgorithm: currentContrastAlgorithm,
    gamutSpace: currentGamutSpace
  });

  const referenceStatusConfig = $derived<ComparisonStatusConfig>({
    contrast: referenceContrastColors ?? currentContrastColors,
    contrastAlgorithm: referenceContrastAlgorithm ?? currentContrastAlgorithm,
    gamutSpace: referenceGamutSpace ?? currentGamutSpace
  });

  const neutralAlignment = $derived(
    buildSideBySideNeutralAlignment(currentNeutralsHex, referenceNeutralsHex)
  );

  const paletteAlignment = $derived(
    buildSideBySidePaletteAlignments(currentPalettesHex, referencePalettesHex)
  );

  const currentNeutralHex = $derived(
    neutralAlignment.current.swatches.map((swatch) => (swatch.isPlaceholder ? null : swatch.hex))
  );
  const currentNeutralColors = $derived(
    neutralAlignment.current.swatches.map((swatch) =>
      swatch.isPlaceholder ? null : (currentNeutrals[swatch.stepIndex ?? 0] ?? null)
    )
  );
  const currentNeutralDisplay = $derived(
    neutralAlignment.current.swatches.map((swatch) =>
      swatch.isPlaceholder ? null : (currentNeutralsDisplay[swatch.stepIndex ?? 0] ?? null)
    )
  );
  const currentNeutralSimulated = $derived(
    neutralAlignment.current.swatches.map((swatch) =>
      swatch.isPlaceholder
        ? null
        : (currentNeutralsSimulatedDisplay?.[swatch.stepIndex ?? 0] ?? null)
    )
  );
  const currentNeutralStepIndices = $derived(
    neutralAlignment.current.swatches.map((swatch) => swatch.stepIndex)
  );

  const referenceNeutralHex = $derived(
    neutralAlignment.reference.swatches.map((swatch) => (swatch.isPlaceholder ? null : swatch.hex))
  );
  const referenceNeutralColors = $derived(
    neutralAlignment.reference.swatches.map((swatch) =>
      swatch.isPlaceholder ? null : (referenceNeutrals[swatch.stepIndex ?? 0] ?? null)
    )
  );
  const referenceNeutralDisplay = $derived(
    neutralAlignment.reference.swatches.map((swatch) =>
      swatch.isPlaceholder ? null : (referenceNeutralsDisplay[swatch.stepIndex ?? 0] ?? null)
    )
  );
  const referenceNeutralSimulated = $derived(
    neutralAlignment.reference.swatches.map((swatch) =>
      swatch.isPlaceholder
        ? null
        : (referenceNeutralsSimulatedDisplay?.[swatch.stepIndex ?? 0] ?? null)
    )
  );
  const referenceNeutralStepIndices = $derived(
    neutralAlignment.reference.swatches.map((swatch) => swatch.stepIndex)
  );

  const currentPaletteHex = $derived(
    paletteAlignment.map((pair) =>
      pair.current.isPlaceholder
        ? null
        : pair.current.swatches.map((swatch) => (swatch.isPlaceholder ? null : swatch.hex))
    )
  );
  const currentPaletteColors = $derived(
    paletteAlignment.map((pair) =>
      pair.current.isPlaceholder
        ? null
        : pair.current.swatches.map((swatch) =>
            swatch.isPlaceholder
              ? null
              : (currentPalettes[pair.current.paletteIndex ?? 0]?.[swatch.stepIndex ?? 0] ?? null)
          )
    )
  );
  const currentPaletteDisplay = $derived(
    paletteAlignment.map((pair) =>
      pair.current.isPlaceholder
        ? null
        : pair.current.swatches.map((swatch) =>
            swatch.isPlaceholder
              ? null
              : (currentPalettesDisplay[pair.current.paletteIndex ?? 0]?.[swatch.stepIndex ?? 0] ??
                null)
          )
    )
  );
  const currentPaletteSimulated = $derived(
    paletteAlignment.map((pair) =>
      pair.current.isPlaceholder
        ? null
        : pair.current.swatches.map((swatch) =>
            swatch.isPlaceholder
              ? null
              : (currentPalettesSimulatedDisplay?.[pair.current.paletteIndex ?? 0]?.[
                  swatch.stepIndex ?? 0
                ] ?? null)
          )
    )
  );
  const currentPaletteSourceIndices = $derived(
    paletteAlignment.map((pair) => pair.current.paletteIndex)
  );
  const currentPaletteStepIndices = $derived(
    paletteAlignment.map((pair) =>
      pair.current.isPlaceholder ? null : pair.current.swatches.map((swatch) => swatch.stepIndex)
    )
  );

  const referencePaletteHex = $derived(
    paletteAlignment.map((pair) =>
      pair.reference.isPlaceholder
        ? null
        : pair.reference.swatches.map((swatch) => (swatch.isPlaceholder ? null : swatch.hex))
    )
  );
  const referencePaletteColors = $derived(
    paletteAlignment.map((pair) =>
      pair.reference.isPlaceholder
        ? null
        : pair.reference.swatches.map((swatch) =>
            swatch.isPlaceholder
              ? null
              : (referencePalettes[pair.reference.paletteIndex ?? 0]?.[swatch.stepIndex ?? 0] ??
                null)
          )
    )
  );
  const referencePaletteDisplay = $derived(
    paletteAlignment.map((pair) =>
      pair.reference.isPlaceholder
        ? null
        : pair.reference.swatches.map((swatch) =>
            swatch.isPlaceholder
              ? null
              : (referencePalettesDisplay[pair.reference.paletteIndex ?? 0]?.[
                  swatch.stepIndex ?? 0
                ] ?? null)
          )
    )
  );
  const referencePaletteSimulated = $derived(
    paletteAlignment.map((pair) =>
      pair.reference.isPlaceholder
        ? null
        : pair.reference.swatches.map((swatch) =>
            swatch.isPlaceholder
              ? null
              : (referencePalettesSimulatedDisplay?.[pair.reference.paletteIndex ?? 0]?.[
                  swatch.stepIndex ?? 0
                ] ?? null)
          )
    )
  );
  const referencePaletteSourceIndices = $derived(
    paletteAlignment.map((pair) => pair.reference.paletteIndex)
  );
  const referencePaletteStepIndices = $derived(
    paletteAlignment.map((pair) =>
      pair.reference.isPlaceholder
        ? null
        : pair.reference.swatches.map((swatch) => swatch.stepIndex)
    )
  );

  function toCurrentPlaceholderLabel(
    currentHex: string | null,
    referenceHex: string | null
  ): string | null {
    if (viewMode !== 'comparison') {
      return null;
    }

    return currentHex === null && referenceHex !== null ? 'Removed' : null;
  }

  function toReferencePlaceholderLabel(
    currentHex: string | null,
    referenceHex: string | null
  ): string | null {
    if (viewMode !== 'comparison') {
      return null;
    }

    return currentHex !== null && referenceHex === null ? 'Added' : null;
  }

  const currentNeutralPlaceholderLabels = $derived(
    neutralAlignment.current.swatches.map((swatch, index) =>
      toCurrentPlaceholderLabel(
        swatch.isPlaceholder ? null : swatch.hex,
        neutralAlignment.reference.swatches[index]?.isPlaceholder
          ? null
          : (neutralAlignment.reference.swatches[index]?.hex ?? null)
      )
    )
  );

  const referenceNeutralPlaceholderLabels = $derived(
    neutralAlignment.reference.swatches.map((swatch, index) =>
      toReferencePlaceholderLabel(
        neutralAlignment.current.swatches[index]?.isPlaceholder
          ? null
          : (neutralAlignment.current.swatches[index]?.hex ?? null),
        swatch.isPlaceholder ? null : swatch.hex
      )
    )
  );

  const currentPalettePlaceholderLabels = $derived(
    paletteAlignment.map((pair) =>
      toCurrentPlaceholderLabel(
        pair.current.isPlaceholder ? null : '__present__',
        pair.reference.isPlaceholder ? null : '__present__'
      )
    )
  );

  const referencePalettePlaceholderLabels = $derived(
    paletteAlignment.map((pair) =>
      toReferencePlaceholderLabel(
        pair.current.isPlaceholder ? null : '__present__',
        pair.reference.isPlaceholder ? null : '__present__'
      )
    )
  );

  const currentSwatchPlaceholderLabels = $derived(
    paletteAlignment.map((pair) => {
      if (pair.current.isPlaceholder || pair.reference.isPlaceholder) {
        return null;
      }

      return pair.current.swatches.map((swatch, swatchIndex) =>
        toCurrentPlaceholderLabel(
          swatch.isPlaceholder ? null : swatch.hex,
          pair.reference.swatches[swatchIndex]?.isPlaceholder
            ? null
            : (pair.reference.swatches[swatchIndex]?.hex ?? null)
        )
      );
    })
  );

  const referenceSwatchPlaceholderLabels = $derived(
    paletteAlignment.map((pair) => {
      if (pair.current.isPlaceholder || pair.reference.isPlaceholder) {
        return null;
      }

      return pair.reference.swatches.map((swatch, swatchIndex) =>
        toReferencePlaceholderLabel(
          pair.current.swatches[swatchIndex]?.isPlaceholder
            ? null
            : (pair.current.swatches[swatchIndex]?.hex ?? null),
          swatch.isPlaceholder ? null : swatch.hex
        )
      );
    })
  );

  function annotateCurrentSwatch(
    currentHex: string | null,
    referenceHex: string | null,
    currentColor: Color | null,
    referenceColor: Color | null
  ): ComparisonAnnotation | null {
    if (viewMode !== 'comparison' || currentHex === null || referenceHex === null) {
      return null;
    }

    return buildComparisonAnnotation({
      currentHex,
      referenceHex,
      currentColor,
      referenceColor,
      metric: currentComparisonMetric,
      threshold: currentSwatchChangeThreshold,
      currentStatusConfig,
      referenceStatusConfig
    });
  }

  const currentNeutralComparisonAnnotations = $derived(
    currentNeutralHex.map((hex, index) =>
      annotateCurrentSwatch(
        hex,
        referenceNeutralHex[index] ?? null,
        currentNeutralColors[index] ?? null,
        referenceNeutralColors[index] ?? null
      )
    )
  );

  const currentPaletteComparisonAnnotations = $derived(
    currentPaletteHex.map((palette, paletteIndex) => {
      const referencePalette = referencePaletteHex[paletteIndex];

      if (palette === null || referencePalette === null) {
        return null;
      }

      return palette.map((hex, swatchIndex) =>
        annotateCurrentSwatch(
          hex,
          referencePalette[swatchIndex] ?? null,
          currentPaletteColors[paletteIndex]?.[swatchIndex] ?? null,
          referencePaletteColors[paletteIndex]?.[swatchIndex] ?? null
        )
      );
    })
  );
</script>

<div class="comparison-layout">
  <div class="reference-view-container">
    <div class="current-column">
      <div class="column-label">Current</div>
      <div class="column-content">
        <div class="palettes">
          <NeutralPalette
            neutrals={currentNeutralColors}
            neutralsHex={currentNeutralHex}
            neutralsDisplay={currentNeutralDisplay}
            neutralsSimulatedDisplay={currentNeutralSimulated}
            placeholderLabels={currentNeutralPlaceholderLabels}
            comparisonAnnotations={currentNeutralComparisonAnnotations}
            neutralStepIndices={currentNeutralStepIndices}
            lightnessNudgerValues={currentLightnessNudgers}
            onHistoryCommit={onCurrentHistoryCommit}
          />
          <PaletteGrid
            palettes={currentPaletteColors}
            palettesHex={currentPaletteHex}
            palettesDisplay={currentPaletteDisplay}
            palettesSimulatedDisplay={currentPaletteSimulated}
            palettePlaceholderLabels={currentPalettePlaceholderLabels}
            swatchPlaceholderLabels={currentSwatchPlaceholderLabels}
            comparisonAnnotations={currentPaletteComparisonAnnotations}
            paletteSourceIndices={currentPaletteSourceIndices}
            swatchStepIndices={currentPaletteStepIndices}
            hueNudgerValues={currentHueNudgers}
            onHistoryCommit={onCurrentHistoryCommit}
          />
        </div>
      </div>
    </div>
    <div class="reference-column">
      <div class="column-label">Reference</div>
      <div class="column-content">
        <div class="palettes">
          <NeutralPalette
            neutrals={referenceNeutralColors}
            neutralsHex={referenceNeutralHex}
            neutralsDisplay={referenceNeutralDisplay}
            neutralsSimulatedDisplay={referenceNeutralSimulated}
            placeholderLabels={referenceNeutralPlaceholderLabels}
            neutralStepIndices={referenceNeutralStepIndices}
            lightnessNudgerValues={[]}
            readonly={true}
            contrastColorsOverride={referenceContrastColors}
            contrastAlgorithmOverride={referenceContrastAlgorithm}
            customNeutralNameOverride={referenceCustomNeutralName}
            exportNeutralsHex={referenceNeutralsHex}
            exportNeutralsDisplay={referenceNeutralsDisplay}
          />
          <PaletteGrid
            palettes={referencePaletteColors}
            palettesHex={referencePaletteHex}
            palettesDisplay={referencePaletteDisplay}
            palettesSimulatedDisplay={referencePaletteSimulated}
            palettePlaceholderLabels={referencePalettePlaceholderLabels}
            swatchPlaceholderLabels={referenceSwatchPlaceholderLabels}
            paletteSourceIndices={referencePaletteSourceIndices}
            swatchStepIndices={referencePaletteStepIndices}
            hueNudgerValues={[]}
            readonly={true}
            contrastColorsOverride={referenceContrastColors}
            contrastAlgorithmOverride={referenceContrastAlgorithm}
            customPaletteNamesOverride={referenceCustomPaletteNames}
            exportPalettesHex={referencePalettesHex}
            exportPalettesDisplay={referencePalettesDisplay}
          />
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .comparison-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-md);
    min-height: 0;
  }

  .reference-view-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-lg);
    min-height: 0;
  }

  .reference-column,
  .current-column {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    min-height: 0;
  }

  .column-label {
    font-size: var(--font-size-sm);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
    padding: 0 var(--space-md);
  }

  .column-content {
    flex: 1;
    min-height: 0;
  }

  .palettes {
    display: grid;
    gap: var(--space-lg);
    min-height: 0;
  }

  @container (max-width: 1200px) {
    .reference-view-container {
      grid-template-columns: 1fr;
    }
  }
</style>
