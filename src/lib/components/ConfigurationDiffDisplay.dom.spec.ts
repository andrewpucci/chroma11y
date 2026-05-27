import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import ConfigurationDiffDisplay from './ConfigurationDiffDisplay.svelte';

function createConfig(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    numColors: 11,
    numPalettes: 11,
    baseColor: '#5EF784',
    warmth: -7,
    warmthHue: 142,
    x1: 0.16,
    y1: 0,
    x2: 0.28,
    y2: 0.38,
    chromaMultiplier: 1,
    lightnessNudgers: Array.from({ length: 11 }, () => 0),
    hueNudgers: Array.from({ length: 11 }, () => 0),
    stepSaturationNudgers: Array.from({ length: 11 }, () => 0),
    paletteSaturationNudgers: Array.from({ length: 11 }, () => 0),
    paletteChromaNudgers: Array.from({ length: 11 }, () => 1),
    contrastMode: 'auto',
    lowStep: 0,
    highStep: 10,
    lowReference: { kind: 'neutral', stepIndex: 0 },
    highReference: { kind: 'neutral', stepIndex: 10 },
    contrast: { low: '#ffffff', high: '#000000' },
    solveAdjacentStopLows: true,
    themePreference: 'light',
    currentTheme: 'light',
    customNeutralName: undefined,
    customPaletteNames: undefined,
    constraints: [],
    ...overrides
  };
}

describe('ConfigurationDiffDisplay', () => {
  it('renders changed entries in Reference to Current order', () => {
    render(ConfigurationDiffDisplay, {
      props: {
        currentConfig: createConfig({ baseColor: '#00FF00' }),
        referenceConfig: createConfig()
      }
    });

    const card = screen.getByTestId('configuration-diff-card');
    const referenceValue = screen.getByText('#5EF784');
    const currentValue = screen.getByText('#00FF00');

    expect(card).toBeInTheDocument();
    expect(screen.getByText('Generation Settings')).toBeInTheDocument();
    expect(screen.getByText('Base color')).toBeInTheDocument();
    expect(
      referenceValue.compareDocumentPosition(currentValue) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('keeps an explicit success state when there are no configuration changes', () => {
    render(ConfigurationDiffDisplay, {
      props: {
        currentConfig: createConfig(),
        referenceConfig: createConfig()
      }
    });

    expect(screen.getByTestId('configuration-diff-card')).toBeInTheDocument();
    expect(screen.getByText('No configuration changes')).toBeInTheDocument();
  });
});
