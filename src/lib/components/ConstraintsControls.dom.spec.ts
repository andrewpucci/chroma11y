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

const { startSolveConstraintsInWorker } = vi.hoisted(() => ({
  startSolveConstraintsInWorker: vi.fn()
}));

vi.mock('$lib/announce', () => ({
  announce: vi.fn()
}));

vi.mock('$lib/constraintSolveClient', () => ({
  startSolveConstraintsInWorker
}));

async function expandRow(index: number = 0): Promise<void> {
  const row = document.querySelectorAll<HTMLElement>('.constraint-row')[index];
  const toggle = row?.querySelector<HTMLButtonElement>('button[aria-controls]');

  if (!toggle) {
    throw new Error(`Missing expand toggle for row ${index}`);
  }

  await fireEvent.click(toggle);
}

describe('ConstraintsControls', () => {
  beforeEach(() => {
    resetColorState('light');
    updateColorState({
      neutrals: [new Color('#ffffff')],
      palettes: [[new Color('#5ef784')]]
    });
    startSolveConstraintsInWorker.mockReset();
    vi.mocked(announce).mockClear();
  });

  it('renders rows collapsed by default and shows the top summary counts', () => {
    updateColorState({
      constraints: [
        {
          id: 'constraint-1',
          type: 'target-color',
          enabled: true,
          targetHex: '#5EF784',
          mustPass: false,
          metric: 'ok'
        },
        {
          id: 'constraint-2',
          type: 'target-color',
          enabled: false,
          targetHex: '#181818',
          mustPass: false,
          metric: 'ok'
        }
      ]
    });

    render(ConstraintsControls);

    expect(screen.queryByLabelText(/target hex/i)).not.toBeInTheDocument();
    expect(screen.getByText('1 pass')).toBeInTheDocument();
    expect(screen.getByText('0 warning')).toBeInTheDocument();
    expect(screen.getByText('0 fail')).toBeInTheDocument();
    expect(screen.getByText('1 disabled')).toBeInTheDocument();
  });

  it('keeps only one row expanded at a time and auto-expands newly added constraints', async () => {
    updateColorState({
      constraints: [
        {
          id: 'constraint-1',
          type: 'target-color',
          enabled: true,
          targetHex: '#5EF784',
          mustPass: false,
          metric: 'ok'
        },
        {
          id: 'constraint-2',
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

    await expandRow(0);
    expect(screen.getByLabelText(/target hex/i)).toBeInTheDocument();

    await expandRow(1);
    expect(screen.queryByLabelText(/target hex/i)).not.toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: /add target color/i }));
    expect(screen.getByLabelText(/target hex/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Collapse' })).toHaveLength(1);
  });

  it('shows the entered target color preview and closest swatch preview inside the expanded row', async () => {
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
    await expandRow();

    expect(screen.getByText('Target')).toBeInTheDocument();
    expect(screen.getByText('Closest')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /metric/i })).toHaveValue('ok');
    expect(screen.getByText('#5EF784')).toBeInTheDocument();
    expect(screen.getByText('#5ef784')).toBeInTheDocument();
    expect(screen.getByText(/closest swatch:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/step 0/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ΔEOK 0.000/i).length).toBeGreaterThan(0);
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
    await expandRow(0);

    let toggles = screen.getAllByRole('checkbox', { name: /must pass/i });
    expect(toggles[0]).not.toBeDisabled();

    await expandRow(4);
    toggles = screen.getAllByRole('checkbox', { name: /must pass/i });
    expect(toggles[0]).toBeDisabled();

    await expandRow(0);
    await fireEvent.click(screen.getByRole('checkbox', { name: /must pass/i }));

    expect(get(constraints)[0]).toMatchObject({ mustPass: false });

    await expandRow(4);
    expect(screen.getByRole('checkbox', { name: /must pass/i })).not.toBeDisabled();
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
    await expandRow();

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
    await expandRow();

    await fireEvent.click(screen.getByRole('checkbox', { name: /fit to threshold/i }));

    expect(get(constraints)[0]).toMatchObject({ fitToThreshold: true });
  });

  it('supports disabling constraints and excluding them from health counts', async () => {
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

    await fireEvent.click(screen.getByRole('checkbox', { name: /target color enabled/i }));

    expect(get(constraints)[0]).toMatchObject({ enabled: false });
    expect(screen.getByText('0 pass')).toBeInTheDocument();
    expect(screen.getByText('1 disabled')).toBeInTheDocument();
  });

  it('filters constraints by status and type', async () => {
    updateColorState({
      constraints: [
        {
          id: 'constraint-1',
          type: 'target-color',
          enabled: true,
          targetHex: '#5EF784',
          mustPass: false,
          metric: 'ok'
        },
        {
          id: 'constraint-2',
          type: 'target-color',
          enabled: false,
          targetHex: '#181818',
          mustPass: false,
          metric: 'ok'
        },
        {
          id: 'constraint-3',
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

    await fireEvent.change(screen.getByLabelText(/constraint status filter/i), {
      target: { value: 'disabled' }
    });
    expect(screen.getByText(/1 of 3 constraints shown/i)).toBeInTheDocument();
    expect(screen.getAllByText('disabled')).toHaveLength(1);

    await fireEvent.change(screen.getByLabelText(/constraint type filter/i), {
      target: { value: 'contrast-rule' }
    });
    expect(screen.getByText(/no constraints match the current filters/i)).toBeInTheDocument();
  });

  it('shows in-progress state and disables solve actions while solving', async () => {
    let resolveSolve: (() => void) | undefined;
    startSolveConstraintsInWorker.mockImplementation(() => ({
      cancel: vi.fn(),
      promise: new Promise((resolve) => {
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
    }));

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

    expect(screen.getByRole('button', { name: /cancel solve/i })).toBeInTheDocument();
    expect(screen.getByText(/solving constraints/i)).toBeInTheDocument();
    expect(solveButton).toBeDisabled();
    expect(deepSolveButton).toBeDisabled();
    expect(screen.getByLabelText(/constraint status filter/i)).toBeDisabled();
    expect(screen.getByLabelText(/target color enabled/i)).toBeDisabled();
    expect(screen.getAllByRole('button', { name: 'Edit' })[0]).toBeDisabled();
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
    startSolveConstraintsInWorker.mockImplementation(() => ({
      cancel: vi.fn(),
      promise: new Promise((resolve) => {
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
    }));

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

    expect(startSolveConstraintsInWorker).toHaveBeenCalledWith(expect.any(Object), 'deep');
    expect(screen.getByText(/running deep solve/i)).toBeInTheDocument();
    expect(get(activeConstraintSolveRunState).status).toBe('running-deep');

    if (resolveSolve) {
      resolveSolve();
    }

    await Promise.resolve();
    await Promise.resolve();

    expect(get(activeConstraintSolveRunState).status).toBe('idle');
  });

  it('cancels an in-progress solve and unlocks the panel', async () => {
    const cancel = vi.fn();
    let rejectSolve: ((reason?: unknown) => void) | undefined;
    startSolveConstraintsInWorker.mockImplementation(() => ({
      cancel,
      promise: new Promise((_, reject) => {
        rejectSolve = reject;
      })
    }));

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

    await fireEvent.click(screen.getByRole('button', { name: /solve constraints/i }));
    await fireEvent.click(screen.getByRole('button', { name: /cancel solve/i }));

    expect(cancel).toHaveBeenCalledTimes(1);

    rejectSolve?.(new DOMException('Constraint solve cancelled', 'AbortError'));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(get(activeConstraintSolveRunState).status).toBe('idle');
    expect(screen.getByRole('button', { name: /solve constraints/i })).not.toBeDisabled();
  });

  it('shows deep solve in the summary when the last run used the deep profile', () => {
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

    expect(screen.getByText(/last solve: deep solve/i)).toBeInTheDocument();
    expect(screen.getByText(/1 required unsatisfied/i)).toBeInTheDocument();
  });
});
