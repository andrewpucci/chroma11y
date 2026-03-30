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
  solveAdjacentStopLows,
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
      palettes: [[new Color('#5ef784')]],
      solveAdjacentStopLows: true
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

    await fireEvent.click(screen.getAllByRole('button', { name: /add target color/i })[0]);
    expect(screen.getByLabelText(/target hex/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Collapse' })).toHaveLength(1);
    expect(document.querySelector('.constraint-row .constraint-kind')?.textContent).toBe(
      'Target color'
    );
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

  it('keeps invalid target hex drafts out of persisted constraint state and resets on blur', async () => {
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

    const input = screen.getByLabelText(/target hex/i);
    await fireEvent.input(input, {
      target: { value: 'not-a-color' }
    });

    expect(screen.getByText(/enter a valid hex color/i)).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(get(constraints)[0]).toMatchObject({ targetHex: '#5EF784' });

    await fireEvent.blur(input);

    expect(input).toHaveValue('#5EF784');
    expect(screen.queryByText(/enter a valid hex color/i)).not.toBeInTheDocument();
    expect(announce).toHaveBeenCalledWith('Target color reset to the last valid hex value.');
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

  it('updates the advanced adjacent-stop solver toggle', async () => {
    render(ConstraintsControls);

    await fireEvent.click(screen.getByRole('checkbox', { name: /optimize adjacent stop lows/i }));

    expect(get(solveAdjacentStopLows)).toBe(false);
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

  it('commits history for inline constraint edits', async () => {
    const onHistoryCommit = vi.fn();

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

    render(ConstraintsControls, { onHistoryCommit });

    await fireEvent.click(screen.getByRole('checkbox', { name: /target color enabled/i }));
    expect(onHistoryCommit).toHaveBeenCalledWith('Constraint enabled changed');

    await expandRow(0);
    await fireEvent.change(screen.getByLabelText(/metric/i), {
      target: { value: '2000' }
    });
    expect(onHistoryCommit).toHaveBeenCalledWith('Constraint target metric changed');

    const targetInput = screen.getByLabelText(/target hex/i);
    await fireEvent.input(targetInput, {
      target: { value: '#112233' }
    });
    await fireEvent.blur(targetInput);
    expect(onHistoryCommit).toHaveBeenCalledWith('Constraint target color changed');

    await expandRow(1);
    await fireEvent.change(screen.getByDisplayValue('0'), {
      target: { value: '2' }
    });
    expect(onHistoryCommit).toHaveBeenCalledWith('Constraint rule step changed');

    await fireEvent.click(screen.getByRole('checkbox', { name: /fit to threshold/i }));
    expect(onHistoryCommit).toHaveBeenCalledWith('Constraint fit-to-threshold changed');
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

    await fireEvent.change(screen.getAllByLabelText(/constraint status filter/i)[0], {
      target: { value: 'disabled' }
    });
    expect(screen.getAllByText(/1 of 3 constraints shown/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText('disabled').length).toBeGreaterThanOrEqual(1);

    await fireEvent.change(screen.getAllByLabelText(/constraint type filter/i)[0], {
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
              baseColor: '#5EF784',
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
    setConstraintSolverSummary({
      solvedAt: Date.now(),
      passCount: 2,
      warningCount: 1,
      failCount: 0,
      applied: true,
      changed: true,
      scoreBefore: 1,
      scoreAfter: 0,
      source: 'client'
    });

    render(ConstraintsControls);

    const solveButton = screen.getAllByRole('button', { name: /solve constraints/i })[0];
    const deepSolveButton = screen.getAllByRole('button', { name: /deep solve/i })[0];

    await fireEvent.click(solveButton);

    expect(screen.getAllByRole('button', { name: /cancel solve/i })[0]).toBeInTheDocument();
    expect(screen.getByText(/solving constraints/i)).toBeInTheDocument();
    expect(screen.queryByText(/last completed solve:/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(
        /finish or cancel the current solve to edit constraints or clear solved adjustments/i
      )
    ).toBeInTheDocument();
    expect(solveButton).toBeDisabled();
    expect(deepSolveButton).toBeDisabled();
    expect(screen.getAllByLabelText(/constraint status filter/i)[0]).toBeDisabled();
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
              baseColor: '#5EF784',
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

    await fireEvent.click(screen.getAllByRole('button', { name: /deep solve/i })[0]);

    expect(startSolveConstraintsInWorker).toHaveBeenCalledWith(
      expect.objectContaining({ solveAdjacentStopLows: true }),
      'deep'
    );
    expect(screen.getByText(/running deep solve/i)).toBeInTheDocument();
    expect(get(activeConstraintSolveRunState).status).toBe('running-deep');

    if (resolveSolve) {
      resolveSolve();
    }

    await Promise.resolve();
    await Promise.resolve();

    expect(get(activeConstraintSolveRunState).status).toBe('idle');
  });

  it('passes solveAdjacentStopLows=false when the advanced toggle is disabled', async () => {
    startSolveConstraintsInWorker.mockImplementation(() => ({
      cancel: vi.fn(),
      promise: Promise.resolve({
        snapshot: {
          baseColor: '#5EF784',
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
          source: 'client'
        },
        results: []
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

    await fireEvent.click(screen.getByRole('checkbox', { name: /optimize adjacent stop lows/i }));
    await fireEvent.click(screen.getAllByRole('button', { name: /solve constraints/i })[0]);

    expect(startSolveConstraintsInWorker).toHaveBeenCalledWith(
      expect.objectContaining({ solveAdjacentStopLows: false }),
      'fast'
    );
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

    await fireEvent.click(screen.getAllByRole('button', { name: /solve constraints/i })[0]);
    await fireEvent.click(screen.getAllByRole('button', { name: /cancel solve/i })[0]);

    expect(cancel).toHaveBeenCalledTimes(1);

    rejectSolve?.(new DOMException('Constraint solve cancelled', 'AbortError'));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(get(activeConstraintSolveRunState).status).toBe('idle');
    expect(screen.getAllByRole('button', { name: /solve constraints/i })[0]).not.toBeDisabled();
  });

  it('shows deep solve in the last completed summary when the last run used the deep profile', () => {
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

    expect(screen.getByText(/last completed solve:\s*deep solve/i)).toBeInTheDocument();
    expect(screen.getByText(/1 required unsatisfied/i)).toBeInTheDocument();
  });
});
