import { fireEvent, render, screen } from '@testing-library/svelte';
import Color from 'colorjs.io';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import ExportPreviewDialog from '$lib/components/ExportPreviewDialog.svelte';
import ReferenceView from '$lib/components/ReferenceView.svelte';
import { closeExportPreview } from '$lib/help/exportPreviewStore';
import { resetColorState, updateColorState } from '$lib/stores';

function toColors(hexes: string[]): Color[] {
  return hexes.map((hex) => new Color(hex));
}

function renderReferenceView(overrides: Partial<Record<string, unknown>> = {}) {
  const currentNeutralsHex = ['#ffffff', '#c9d1d9', '#0d1117'];
  const referenceNeutralsHex = ['#ffffff', '#0d1117'];
  const currentPaletteHex = ['#dbeafe', '#60a5fa', '#1d4ed8'];
  const referencePaletteHex = ['#dbeafe', '#1d4ed8'];

  return render(ReferenceView, {
    props: {
      viewMode: 'comparison',
      currentNeutrals: toColors(currentNeutralsHex),
      currentNeutralsHex,
      currentNeutralsDisplay: currentNeutralsHex,
      currentNeutralsSimulatedDisplay: null,
      currentPalettes: [toColors(currentPaletteHex)],
      currentPalettesHex: [currentPaletteHex],
      currentPalettesDisplay: [currentPaletteHex],
      currentPalettesSimulatedDisplay: null,
      currentLightnessNudgers: [0, 0, 0],
      currentHueNudgers: [0],
      referenceNeutrals: toColors(referenceNeutralsHex),
      referenceNeutralsHex,
      referenceNeutralsDisplay: referenceNeutralsHex,
      referenceNeutralsSimulatedDisplay: null,
      referencePalettes: [toColors(referencePaletteHex)],
      referencePalettesHex: [referencePaletteHex],
      referencePalettesDisplay: [referencePaletteHex],
      referencePalettesSimulatedDisplay: null,
      referenceContrastColors: { low: '#ffffff', high: '#000000' },
      onCurrentHistoryCommit: () => {},
      ...overrides
    }
  });
}

describe('ReferenceView', () => {
  beforeEach(() => {
    resetColorState('light');
    updateColorState({
      contrast: { low: '#ffffff', high: '#000000' },
      contrastAlgorithm: 'WCAG',
      gamutSpace: 'srgb'
    });
  });

  afterEach(() => {
    closeExportPreview();
  });

  it('shows Added labels on comparison placeholders when the current side has extra structure', () => {
    renderReferenceView();

    expect(screen.getAllByText('Added').length).toBeGreaterThan(0);
  });

  it('shows a Changed chip for color-only differences on the current side in comparison view', () => {
    const { container } = renderReferenceView({
      currentNeutrals: toColors(['#ffffff', '#9aa6b2', '#0d1117']),
      currentNeutralsHex: ['#ffffff', '#9aa6b2', '#0d1117'],
      currentNeutralsDisplay: ['#ffffff', '#9aa6b2', '#0d1117'],
      referenceNeutrals: toColors(['#ffffff', '#c9d1d9', '#0d1117']),
      referenceNeutralsHex: ['#ffffff', '#c9d1d9', '#0d1117'],
      referenceNeutralsDisplay: ['#ffffff', '#c9d1d9', '#0d1117'],
      currentPalettes: [toColors(['#dbeafe', '#60a5fa'])],
      currentPalettesHex: [['#dbeafe', '#60a5fa']],
      currentPalettesDisplay: [['#dbeafe', '#60a5fa']],
      referencePalettes: [toColors(['#dbeafe', '#60a5fa'])],
      referencePalettesHex: [['#dbeafe', '#60a5fa']],
      referencePalettesDisplay: [['#dbeafe', '#60a5fa']]
    });

    expect(screen.getByText('Changed')).toBeInTheDocument();
    expect(container.querySelector('.current-column .color-swatch--quiet')).toBeInTheDocument();
  });

  it('prioritizes a Contrast down chip when accessibility regresses', () => {
    renderReferenceView({
      currentNeutrals: toColors(['#ffffff', '#777777', '#0d1117']),
      currentNeutralsHex: ['#ffffff', '#777777', '#0d1117'],
      currentNeutralsDisplay: ['#ffffff', '#777777', '#0d1117'],
      referenceNeutrals: toColors(['#ffffff', '#707070', '#0d1117']),
      referenceNeutralsHex: ['#ffffff', '#707070', '#0d1117'],
      referenceNeutralsDisplay: ['#ffffff', '#707070', '#0d1117'],
      currentPalettes: [toColors(['#dbeafe', '#60a5fa'])],
      currentPalettesHex: [['#dbeafe', '#60a5fa']],
      currentPalettesDisplay: [['#dbeafe', '#60a5fa']],
      referencePalettes: [toColors(['#dbeafe', '#60a5fa'])],
      referencePalettesHex: [['#dbeafe', '#60a5fa']],
      referencePalettesDisplay: [['#dbeafe', '#60a5fa']]
    });

    expect(screen.getByText('Contrast down')).toBeInTheDocument();
  });

  it('keeps naming controls editable only on the current side', () => {
    renderReferenceView({
      currentNeutrals: toColors(['#ffffff', '#c9d1d9', '#0d1117']),
      currentNeutralsHex: ['#ffffff', '#c9d1d9', '#0d1117'],
      currentNeutralsDisplay: ['#ffffff', '#c9d1d9', '#0d1117'],
      referenceNeutrals: toColors(['#f9fafb', '#1f2937']),
      referenceNeutralsHex: ['#f9fafb', '#1f2937'],
      referenceNeutralsDisplay: ['#f9fafb', '#1f2937'],
      currentPalettes: [toColors(['#dbeafe', '#60a5fa'])],
      currentPalettesHex: [['#dbeafe', '#60a5fa']],
      currentPalettesDisplay: [['#dbeafe', '#60a5fa']],
      referencePalettes: [toColors(['#dcfce7', '#22c55e'])],
      referencePalettesHex: [['#dcfce7', '#22c55e']],
      referencePalettesDisplay: [['#dcfce7', '#22c55e']]
    });

    expect(screen.getAllByRole('button', { name: /edit name for neutral palette/i })).toHaveLength(
      1
    );
    expect(screen.getAllByRole('button', { name: /edit name for palette 1/i })).toHaveLength(1);
  });

  it('uses reference palette data when exporting from the reference side', async () => {
    const currentNeutralsHex = ['#ffffff', '#000000'];
    const referenceNeutralsHex = ['#f9fafb', '#111827'];
    const currentPaletteHex = ['#111111', '#222222'];
    const referencePaletteHex = ['#aaaaaa', '#bbbbbb'];
    const { container } = renderReferenceView({
      currentNeutrals: toColors(currentNeutralsHex),
      currentNeutralsHex,
      currentNeutralsDisplay: currentNeutralsHex,
      referenceNeutrals: toColors(referenceNeutralsHex),
      referenceNeutralsHex,
      referenceNeutralsDisplay: referenceNeutralsHex,
      currentPalettes: [toColors(currentPaletteHex)],
      currentPalettesHex: [currentPaletteHex],
      currentPalettesDisplay: [currentPaletteHex],
      referencePalettes: [toColors(referencePaletteHex)],
      referencePalettesHex: [referencePaletteHex],
      referencePalettesDisplay: [referencePaletteHex],
      referenceCustomPaletteNames: ['Reference Accent']
    });

    render(ExportPreviewDialog, {
      props: {
        neutrals: currentNeutralsHex,
        palettes: [currentPaletteHex],
        lowContrastColor: '#ffffff',
        displayNeutrals: currentNeutralsHex,
        displayPalettes: [currentPaletteHex]
      }
    });

    const referenceCopyButton = container.querySelector(
      '.reference-column [data-testid="copy-palette-0"]'
    );
    if (!(referenceCopyButton instanceof HTMLButtonElement)) {
      throw new Error('Expected reference-side palette copy button');
    }
    const referencePaletteName = container.querySelector(
      '.reference-column [data-testid="generated-palette-name-0"]'
    );
    expect(referencePaletteName?.textContent).toContain('Reference Accent');

    await fireEvent.click(referenceCopyButton);

    const preview = await screen.findByTestId('export-preview-content');
    expect(preview.textContent).toContain('Reference Accent');
    expect(preview.textContent).toContain('#aaaaaa');
    expect(preview.textContent).not.toContain('#111111');
  });
});
