import { render, screen } from '@testing-library/svelte';
import Color from 'colorjs.io';
import { beforeEach, describe, expect, it } from 'vitest';

import ReferenceView from '$lib/components/ReferenceView.svelte';
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
});
