import { fireEvent, render, screen } from '@testing-library/svelte';
import { get } from 'svelte/store';
import Color from 'colorjs.io';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ConstraintsControls from '$lib/components/ConstraintsControls.svelte';
import { announce } from '$lib/announce';
import {
  activeConstraintSolveRunState,
  constraints,
  resetColorState,
  setConstraintSolverSummary,
  updateColorState
} from '$lib/stores';

const { solveConstraintsInWorker } = vi.hoisted(() => ({
  solveConstraintsInWorker: vi.fn()
}));

vi.mock('$lib/announce', () => ({
  announce: vi.fn()
}));

vi.mock('$lib/constraintSolveClient', () => ({
  solveConstraintsInWorker
}));

describe('ConstraintsControls', () => {
  beforeEach(() => {
    resetColorState('light');
    updateColorState({
      neutrals: [new Color('#ffffff')],
      palettes: [[new Color('#5ef784')]]
    });
    solveConstraintsInWorker.mockReset();
    vi.mocked(announce).mockClear();
  });

  it('shows the entered target color preview and closest swatch preview', () => {
    updateColorState({
      constraints: [
        {
          id: 'constraint-1',
          type: 'target-color',
          enabled: true,
          targetHex: '#5EF784',
          mustPass: false,
          metric: 'ok'
        }
      ]
    });

    render(ConstraintsControls);

    expect(screen.getByText('Target')).toBeInTheDocument();
    expect(screen.getByText('Closest')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /metric/i })).toHaveValue('ok');
    expect(screen.getAllByText('#5EF784')).toHaveLength(1);
    expect(screen.getByText('#5ef784')).toBeInTheDocument();
    expect(screen.getByText(/closest swatch:/i)).toBeInTheDocument();
    expect(screen.getByText(/step 0/i)).toBeInTheDocument();
    expect(screen.getByText(/ΔEOK 0.000/i)).toBeInTheDocument();
  });

  it('limits must-pass target colors to four at a time', async () => {
    updateColorState({
      constraints: [
        {
          id: 'constraint-1',
          type: 'target-color',
          enabled: true,
          targetHex: '#5EF784',
          mustPass: true,
          metric: 'ok'
        },
        {
          id: 'constraint-2',
          type: 'target-color',
          enabled: true,
          targetHex: '#FED733',
          mustPass: true,
          metric: 'ok'
        },
        {
          id: 'constraint-3',
          type: 'target-color',
          enabled: true,
          targetHex: '#EC95A9',
          mustPass: true,
          metric: 'ok'
        },
        {
          id: 'constraint-4',
          type: 'target-color',
          enabled: true,
          targetHex: '#53D7DD',
          mustPass: true,
          metric: 'ok'
        },
        {
          id: 'constraint-5',
          type: 'target-color',
          enabled: true,
          targetHex: '#EC95A9',
          mustPass: false,
          metric: 'ok'
        }
      ]
    });

    render(ConstraintsControls);

    const toggles = screen.getAllByRole('checkbox', { name: /must pass/i });
    expect(toggles[4]).toBeDisabled();

    await fireEvent.click(toggles[0]);

    expect(get(constraints)[0]).toMatchObject({ mustPass: false });
    expect(screen.getAllByRole('checkbox', { name: /must pass/i })[4]).not.toBeDisabled();
  });

  it('updates the target-color metric selection', async () => {
    updateColorState({
      constraints: [
        {
          id: 'constraint-1',
          type: 'target-color',
          enabled: true,
          targetHex: '#5EF784',
          mustPass: false,
          metric: 'ok'
        }
      ]
    });

    render(ConstraintsControls);

    await fireEvent.change(screen.getByLabelText(/metric/i), {
      target: { value: '2000' }
    });

    expect(get(constraints)[0]).toMatchObject({ metric: '2000' });
  });

  it('updates the contrast-rule fit-to-threshold toggle', async () => {
    updateColorState({
      constraints: [
        {
          id: 'constraint-1',
          type: 'contrast-rule',
          enabled: true,
          scope: 'all-palettes',
          stepIndex: 0,
          reference: 'low',
          algorithm: 'WCAG',
          level: 'wcagAA',
          fitToThreshold: false
        }
      ]
    });

    render(ConstraintsControls);

    await fireEvent.click(screen.getByRole('checkbox', { name: /fit to threshold/i }));

    expect(get(constraints)[0]).toMatchObject({ fitToThreshold: true });
  });

  it('shows in-progress state and disables solve actions while solving', async () => {
    let resolveSolve: (() => void) | undefined;
    solveConstraintsInWorker.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSolve = () =>
            resolve({
              snapshot: {
                baseColor: '#1862E6',
                warmth: -7,
                chromaMultiplier: 1,
                x1: 0.16,
                y1: 0,
                x2: 0.28,
                y2: 0.38,
                lightnessNudgers: [],
                hueNudgers: []
              },
              summary: {
                solvedAt: Date.now(),
                passCount: 1,
                warningCount: 0,
                failCount: 0,
                applied: true,
                changed: false,
                scoreBefore: 0,
                scoreAfter: 0,
                source: 'client',
                durationMs: 10,
                evalCount: 1,
                budgetHit: false
              },
              results: []
            });
        })
    );

    updateColorState({
      constraints: [
        {
          id: 'constraint-1',
          type: 'target-color',
          enabled: true,
          targetHex: '#5EF784',
          mustPass: false,
          metric: 'ok'
        }
      ]
    });

    render(ConstraintsControls);

    const solveButton = screen.getByRole('button', { name: /solve constraints/i });
    const deepSolveButton = screen.getByRole('button', { name: /deep solve/i });

    await fireEvent.click(solveButton);

    expect(screen.getByText(/solving constraints in browser/i)).toBeInTheDocument();
    expect(solveButton).toBeDisabled();
    expect(deepSolveButton).toBeDisabled();
    expect(get(activeConstraintSolveRunState).status).toBe('running-fast');

    if (resolveSolve) {
      resolveSolve();
    }

    await Promise.resolve();
    await Promise.resolve();

    expect(get(activeConstraintSolveRunState).status).toBe('idle');
  });

  it('starts a deep solve in the worker without running a real deep solve in tests', async () => {
    let resolveSolve: (() => void) | undefined;
    solveConstraintsInWorker.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSolve = () =>
            resolve({
              snapshot: {
                baseColor: '#1862E6',
                warmth: -7,
                chromaMultiplier: 1,
                x1: 0.16,
                y1: 0,
                x2: 0.28,
                y2: 0.38,
                lightnessNudgers: [],
                hueNudgers: []
              },
              summary: {
                solvedAt: Date.now(),
                passCount: 1,
                warningCount: 0,
                failCount: 0,
                applied: true,
                changed: false,
                scoreBefore: 0,
                scoreAfter: 0,
                profile: 'deep',
                source: 'client',
                durationMs: 10,
                evalCount: 1,
                budgetHit: false
              },
              results: []
            });
        })
    );

    updateColorState({
      constraints: [
        {
          id: 'constraint-1',
          type: 'target-color',
          enabled: true,
          targetHex: '#5EF784',
          mustPass: false,
          metric: 'ok'
        }
      ]
    });

    render(ConstraintsControls);

    await fireEvent.click(screen.getByRole('button', { name: /deep solve/i }));

    expect(solveConstraintsInWorker).toHaveBeenCalledWith(expect.any(Object), 'deep');
    expect(screen.getByText(/running deep solve in browser/i)).toBeInTheDocument();
    expect(get(activeConstraintSolveRunState).status).toBe('running-deep');

    if (resolveSolve) {
      resolveSolve();
    }

    await Promise.resolve();
    await Promise.resolve();

    expect(get(activeConstraintSolveRunState).status).toBe('idle');
  });

  it('shows browser deep solve in the summary when the last run used the deep profile', () => {
    setConstraintSolverSummary({
      solvedAt: Date.now(),
      passCount: 7,
      warningCount: 5,
      failCount: 1,
      requiredUnsatisfiedCount: 1,
      applied: true,
      changed: true,
      scoreBefore: 12,
      scoreAfter: 8,
      profile: 'deep',
      source: 'client',
      durationMs: 100,
      evalCount: 42,
      budgetHit: false
    });

    render(ConstraintsControls);

    expect(screen.getByText(/last solve: browser deep solve/i)).toBeInTheDocument();
    expect(screen.getByText(/1 required unsatisfied/i)).toBeInTheDocument();
  });
});
