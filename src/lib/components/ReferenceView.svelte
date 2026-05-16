<script lang="ts">
  import NeutralPalette from './NeutralPalette.svelte';
  import PaletteGrid from './PaletteGrid.svelte';
  import ComparisonControls from './ComparisonControls.svelte';
  import ConfigurationDiffDisplay from './ConfigurationDiffDisplay.svelte';
  import type Color from 'colorjs.io';

  interface Props {
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
    currentConfig?: Record<string, unknown>;
    onCurrentHistoryCommit?: (message: string) => void;
  }

  let {
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
    currentConfig = {},
    onCurrentHistoryCommit = () => {}
  }: Props = $props();
</script>

<div class="comparison-layout">
  <div class="comparison-controls-section">
    <ComparisonControls />
  </div>
  <div class="configuration-diff-section">
    <ConfigurationDiffDisplay {currentConfig} />
  </div>
  <div class="reference-view-container">
    <div class="reference-column">
      <div class="column-label">Reference</div>
      <div class="column-content">
        <div class="palettes">
          <NeutralPalette
            neutrals={referenceNeutrals}
            neutralsHex={referenceNeutralsHex}
            neutralsDisplay={referenceNeutralsDisplay}
            neutralsSimulatedDisplay={referenceNeutralsSimulatedDisplay}
            lightnessNudgerValues={[]}
            readonly={true}
          />
          <PaletteGrid
            palettes={referencePalettes}
            palettesHex={referencePalettesHex}
            palettesDisplay={referencePalettesDisplay}
            palettesSimulatedDisplay={referencePalettesSimulatedDisplay}
            hueNudgerValues={[]}
            readonly={true}
          />
        </div>
      </div>
    </div>
    <div class="current-column">
      <div class="column-label">Current</div>
      <div class="column-content">
        <div class="palettes">
          <NeutralPalette
            neutrals={currentNeutrals}
            neutralsHex={currentNeutralsHex}
            neutralsDisplay={currentNeutralsDisplay}
            neutralsSimulatedDisplay={currentNeutralsSimulatedDisplay}
            lightnessNudgerValues={currentLightnessNudgers}
            onHistoryCommit={onCurrentHistoryCommit}
          />
          <PaletteGrid
            palettes={currentPalettes}
            palettesHex={currentPalettesHex}
            palettesDisplay={currentPalettesDisplay}
            palettesSimulatedDisplay={currentPalettesSimulatedDisplay}
            hueNudgerValues={currentHueNudgers}
            onHistoryCommit={onCurrentHistoryCommit}
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
    gap: var(--space-lg);
    min-height: 0;
  }

  .comparison-controls-section {
    display: grid;
    gap: var(--space-md);
  }

  .configuration-diff-section {
    display: grid;
    gap: var(--space-md);
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
