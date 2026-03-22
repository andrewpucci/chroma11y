<script lang="ts">
  import {
    activeSwatchPicker,
    activeConstraintSolveRunState,
    addConstraint,
    baseColor,
    chromaMultiplier,
    constraintSolverSummary,
    constraints,
    contrastAlgorithm,
    contrastColors,
    contrastMode,
    currentTheme,
    customNeutralName,
    customPaletteNames,
    gamutSpace,
    highReference,
    hueNudgers,
    lightnessNudgers,
    paletteSaturationNudgers,
    lowReference,
    neutrals,
    neutralsHex,
    numColors,
    numPalettes,
    palettes,
    palettesHex,
    removeConstraint,
    setConstraintSolverSummary,
    setConstraintSolveRunState,
    setSolverAdjustmentSnapshot,
    solverAdjustmentSnapshot,
    updateColorState,
    updateConstraint,
    stepSaturationNudgers,
    warmth,
    x1,
    x2,
    y1,
    y2
  } from '$lib/stores';
  import { announce } from '$lib/announce';
  import {
    createDefaultContrastRuleConstraint,
    createDefaultTargetColorConstraint,
    evaluateConstraints,
    getConstraintThresholdLabel,
    getTargetColorMetricLabel,
    getConstraintThresholdValue,
    getThresholdOptionsForAlgorithm
  } from '$lib/constraintUtils';
  import { getConstraintSolveRequestHash } from '$lib/constraintSolve';
  import { solveConstraintsInWorker } from '$lib/constraintSolveClient';
  import {
    DEFAULT_NEUTRAL_PALETTE_NAME,
    resolveGeneratedPaletteNames,
    resolveNeutralPaletteName
  } from '$lib/paletteNameUtils';
  import type {
    ColorDifferenceMetric,
    ContrastAlgorithm,
    ConstraintSolveRequest,
    ConstraintThresholdKey,
    Constraint
  } from '$lib/types';
  import { MAX_MUST_PASS_TARGETS } from '$lib/types';

  interface Props {
    onHistoryCommit?: (label: string) => void;
  }

  let { onHistoryCommit }: Props = $props();

  let constraintsLocal = $derived($constraints);
  let contrastAlgorithmLocal = $derived($contrastAlgorithm);
  let contrastColorsLocal = $derived($contrastColors);
  let contrastModeLocal = $derived($contrastMode);
  let lowReferenceLocal = $derived($lowReference);
  let highReferenceLocal = $derived($highReference);
  let activeSwatchPickerLocal = $derived($activeSwatchPicker);
  let solverAdjustmentSnapshotLocal = $derived($solverAdjustmentSnapshot);
  let constraintSolverSummaryLocal = $derived($constraintSolverSummary);
  let constraintSolveRunStateLocal = $derived($activeConstraintSolveRunState);
  let neutralsLocal = $derived($neutrals);
  let palettesLocal = $derived($palettes);
  let neutralsHexLocal = $derived($neutralsHex);
  let palettesHexLocal = $derived($palettesHex);
  let currentThemeLocal = $derived($currentTheme);
  let gamutSpaceLocal = $derived($gamutSpace);
  let baseColorLocal = $derived($baseColor);
  let warmthLocal = $derived($warmth);
  let chromaMultiplierLocal = $derived($chromaMultiplier);
  let x1Local = $derived($x1);
  let y1Local = $derived($y1);
  let x2Local = $derived($x2);
  let y2Local = $derived($y2);
  let lightnessNudgersLocal = $derived($lightnessNudgers);
  let hueNudgersLocal = $derived($hueNudgers);
  let stepSaturationNudgersLocal = $derived($stepSaturationNudgers);
  let paletteSaturationNudgersLocal = $derived($paletteSaturationNudgers);
  let numColorsLocal = $derived($numColors);
  let numPalettesLocal = $derived($numPalettes);
  let customNeutralNameLocal = $derived($customNeutralName);
  let customPaletteNamesLocal = $derived($customPaletteNames);

  let neutralLabel = $derived(
    neutralsHexLocal.length > 0
      ? resolveNeutralPaletteName(neutralsHexLocal, contrastColorsLocal.low, customNeutralNameLocal)
      : DEFAULT_NEUTRAL_PALETTE_NAME
  );
  let paletteLabels = $derived(
    palettesHexLocal.length > 0
      ? resolveGeneratedPaletteNames(
          palettesHexLocal,
          contrastColorsLocal.low,
          customPaletteNamesLocal
        )
      : []
  );
  let mustPassTargetCount = $derived(
    constraintsLocal.filter(
      (constraint) => constraint.type === 'target-color' && constraint.mustPass
    ).length
  );

  let evaluation = $derived(
    evaluateConstraints({
      constraints: constraintsLocal,
      neutrals: neutralsLocal,
      palettes: palettesLocal,
      neutralLabel,
      paletteLabels,
      lowContrastColor: contrastColorsLocal.low,
      highContrastColor: contrastColorsLocal.high
    })
  );

  function getResult(constraintId: string) {
    return evaluation.results.find((result) => result.id === constraintId) ?? null;
  }

  function getTargetResult(constraintId: string) {
    const result = getResult(constraintId);
    return result?.type === 'target-color' ? result : null;
  }

  function getRuleResult(constraintId: string) {
    const result = getResult(constraintId);
    return result?.type === 'contrast-rule' ? result : null;
  }

  function addTargetColorConstraint(): void {
    addConstraint(createDefaultTargetColorConstraint());
    onHistoryCommit?.('Target color constraint added');
  }

  function addContrastRuleConstraint(): void {
    addConstraint(createDefaultContrastRuleConstraint(contrastAlgorithmLocal));
    onHistoryCommit?.('Contrast rule added');
  }

  function removeConstraintRow(id: string): void {
    removeConstraint(id);
    if (
      activeSwatchPickerLocal?.kind === 'constraint-target' &&
      activeSwatchPickerLocal.target === id
    ) {
      activeSwatchPicker.set(null);
    }
    onHistoryCommit?.('Constraint removed');
  }

  function handleTargetHexChange(id: string, value: string): void {
    updateConstraint(id, (constraint) =>
      constraint.type === 'target-color'
        ? {
            ...constraint,
            targetHex: value
          }
        : constraint
    );
  }

  function handleTargetMetricChange(id: string, metric: ColorDifferenceMetric): void {
    updateConstraint(id, (constraint) =>
      constraint.type === 'target-color'
        ? {
            ...constraint,
            metric
          }
        : constraint
    );
  }

  function canEnableMustPass(constraintId: string): boolean {
    const constraint = constraintsLocal.find((entry) => entry.id === constraintId);
    if (!constraint || constraint.type !== 'target-color') {
      return false;
    }

    return !!constraint.mustPass || mustPassTargetCount < MAX_MUST_PASS_TARGETS;
  }

  function handleTargetMustPassChange(id: string, checked: boolean): void {
    if (checked && !canEnableMustPass(id)) {
      announce(`You can mark up to ${MAX_MUST_PASS_TARGETS} target colors as must pass`);
      return;
    }

    updateConstraint(id, (constraint) =>
      constraint.type === 'target-color'
        ? {
            ...constraint,
            mustPass: checked
          }
        : constraint
    );
  }

  function handleRuleScopeChange(id: string, value: 'neutral' | 'all-palettes'): void {
    updateConstraint(id, (constraint) =>
      constraint.type === 'contrast-rule'
        ? {
            ...constraint,
            scope: value
          }
        : constraint
    );
  }

  function handleRuleStepChange(id: string, value: number): void {
    updateConstraint(id, (constraint) =>
      constraint.type === 'contrast-rule'
        ? {
            ...constraint,
            stepIndex: value
          }
        : constraint
    );
  }

  function handleRuleReferenceChange(id: string, value: 'low' | 'high'): void {
    updateConstraint(id, (constraint) =>
      constraint.type === 'contrast-rule'
        ? {
            ...constraint,
            reference: value
          }
        : constraint
    );
  }

  function handleRuleAlgorithmChange(id: string, value: ContrastAlgorithm): void {
    updateConstraint(id, (constraint) =>
      constraint.type === 'contrast-rule'
        ? {
            ...constraint,
            algorithm: value,
            level: getThresholdOptionsForAlgorithm(value)[0]
          }
        : constraint
    );
  }

  function handleRuleLevelChange(id: string, value: ConstraintThresholdKey): void {
    updateConstraint(id, (constraint) =>
      constraint.type === 'contrast-rule'
        ? {
            ...constraint,
            level: value
          }
        : constraint
    );
  }

  function handleRuleFitToThresholdChange(id: string, checked: boolean): void {
    updateConstraint(id, (constraint) =>
      constraint.type === 'contrast-rule'
        ? {
            ...constraint,
            fitToThreshold: checked
          }
        : constraint
    );
  }

  function beginTargetColorPick(id: string): void {
    activeSwatchPicker.set({
      kind: 'constraint-target',
      target: id
    });
    announce('Pick a swatch to use as the target color');
  }

  function cancelPicker(): void {
    activeSwatchPicker.set(null);
    announce('Target color picker cancelled');
  }

  function handleWindowKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && activeSwatchPickerLocal?.kind === 'constraint-target') {
      cancelPicker();
    }
  }

  function buildSolveRequest(): ConstraintSolveRequest {
    return {
      baseColor: baseColorLocal,
      warmth: warmthLocal,
      chromaMultiplier: chromaMultiplierLocal,
      x1: x1Local,
      y1: y1Local,
      x2: x2Local,
      y2: y2Local,
      lightnessNudgers: [...lightnessNudgersLocal],
      hueNudgers: [...hueNudgersLocal],
      stepSaturationNudgers: [...stepSaturationNudgersLocal],
      paletteSaturationNudgers: [...paletteSaturationNudgersLocal],
      numColors: numColorsLocal,
      numPalettes: numPalettesLocal,
      currentTheme: currentThemeLocal,
      gamutSpace: gamutSpaceLocal,
      constraints: constraintsLocal,
      lowReference: lowReferenceLocal,
      highReference: highReferenceLocal,
      contrastMode: contrastModeLocal,
      manualContrast: contrastColorsLocal
    };
  }

  async function runSolve(profile: 'fast' | 'deep'): Promise<void> {
    if (constraintSolveRunStateLocal.status !== 'idle') {
      return;
    }

    const baseline = {
      baseColor: baseColorLocal,
      warmth: warmthLocal,
      chromaMultiplier: chromaMultiplierLocal,
      x1: x1Local,
      y1: y1Local,
      x2: x2Local,
      y2: y2Local,
      lightnessNudgers: [...lightnessNudgersLocal],
      hueNudgers: [...hueNudgersLocal],
      stepSaturationNudgers: [...stepSaturationNudgersLocal],
      paletteSaturationNudgers: [...paletteSaturationNudgersLocal]
    };

    const request = buildSolveRequest();
    const requestHash = getConstraintSolveRequestHash(request, profile);
    const isDeepSolve = profile === 'deep';

    setConstraintSolveRunState({
      status: isDeepSolve ? 'running-deep' : 'running-fast',
      requestHash,
      startedAt: Date.now(),
      source: 'client',
      statusMessage: isDeepSolve
        ? 'Running deep solve in browser...'
        : 'Solving constraints in browser...'
    });

    try {
      const solved = await solveConstraintsInWorker(request, profile);
      const currentHash = getConstraintSolveRequestHash(buildSolveRequest(), profile);

      if (currentHash !== requestHash) {
        announce('Solve result discarded because settings changed.');
        return;
      }

      setSolverAdjustmentSnapshot(baseline);
      setConstraintSolverSummary(solved.summary);
      updateColorState({
        ...solved.snapshot
      });
      const requiredUnsatisfiedCount = solved.summary.requiredUnsatisfiedCount ?? 0;
      if (solved.summary.changed && requiredUnsatisfiedCount === 0) {
        announce(
          `Constraints solved with ${solved.summary.passCount} passing, ${solved.summary.warningCount} warnings, and ${solved.summary.failCount} failing`
        );
      } else if (requiredUnsatisfiedCount > 0) {
        announce(
          `Constraints improved, but ${requiredUnsatisfiedCount} required target${requiredUnsatisfiedCount === 1 ? '' : 's'} remain unsatisfied.`
        );
      } else {
        announce(
          `Constraints evaluated with ${solved.summary.passCount} passing, ${solved.summary.warningCount} warnings, and ${solved.summary.failCount} failing. No meaningful adjustments found.`
        );
      }
      onHistoryCommit?.(isDeepSolve ? 'Constraints deep solved' : 'Constraints solved');
    } catch (error) {
      console.error(error);
      announce(isDeepSolve ? 'Deep solve failed.' : 'Local solve failed.');
    } finally {
      setConstraintSolveRunState({ status: 'idle' });
    }
  }

  function handleSolve(): void {
    void runSolve('fast');
  }

  function handleDeepSolve(): void {
    void runSolve('deep');
  }

  function handleClearSolvedAdjustments(): void {
    if (!solverAdjustmentSnapshotLocal) {
      return;
    }

    updateColorState({
      ...solverAdjustmentSnapshotLocal
    });
    setSolverAdjustmentSnapshot(null);
    setConstraintSolverSummary(null);
    announce('Solved adjustments cleared');
    onHistoryCommit?.('Solved adjustments cleared');
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<section class="constraints-controls">
  <div class="constraint-actions">
    <button
      type="button"
      class="action-button"
      onclick={addTargetColorConstraint}
      disabled={constraintSolveRunStateLocal.status !== 'idle'}
    >
      Add target color
    </button>
    <button
      type="button"
      class="action-button"
      onclick={addContrastRuleConstraint}
      disabled={constraintSolveRunStateLocal.status !== 'idle'}
    >
      Add contrast rule
    </button>
  </div>

  {#if constraintsLocal.length === 0}
    <p class="empty-state">
      No constraints yet. Add a target color or contrast rule to guide the palette.
    </p>
  {:else}
    <div class="constraint-list">
      {#each constraintsLocal as constraint (constraint.id)}
        <article class="constraint-row">
          <div class="constraint-row-header">
            <h3>{constraint.type === 'target-color' ? 'Target color' : 'Contrast rule'}</h3>
            <button
              type="button"
              class="action-button action-button--ghost"
              onclick={() => removeConstraintRow(constraint.id)}>Remove</button
            >
          </div>

          {#if constraint.type === 'target-color'}
            <div class="field-row">
              <label class="field-label" for={`target-${constraint.id}`}>Target hex</label>
              <input
                id={`target-${constraint.id}`}
                class="input mono"
                type="text"
                value={constraint.targetHex}
                oninput={(event) =>
                  handleTargetHexChange(constraint.id, (event.target as HTMLInputElement).value)}
              />
              <button
                type="button"
                class="action-button action-button--ghost"
                onclick={() => beginTargetColorPick(constraint.id)}>Pick from palette</button
              >
            </div>
            <div class="field-row">
              <label class="field-label" for={`metric-${constraint.id}`}>Metric</label>
              <select
                id={`metric-${constraint.id}`}
                class="select"
                value={constraint.metric ?? 'ok'}
                onchange={(event) =>
                  handleTargetMetricChange(
                    constraint.id,
                    (event.target as HTMLSelectElement).value as ColorDifferenceMetric
                  )}
              >
                <option value="ok">Delta E OK</option>
                <option value="2000">Delta E 2000</option>
              </select>
            </div>
            <div class="target-options-row">
              <label class="must-pass-toggle">
                <input
                  type="checkbox"
                  aria-label="Must pass"
                  checked={constraint.mustPass ?? false}
                  disabled={!canEnableMustPass(constraint.id)}
                  onchange={(event) =>
                    handleTargetMustPassChange(
                      constraint.id,
                      (event.target as HTMLInputElement).checked
                    )}
                />
                <span>Must pass</span>
              </label>
              <span class="field-hint">
                Up to {MAX_MUST_PASS_TARGETS} target colors can be marked must pass.
              </span>
            </div>
          {:else}
            <div class="field-grid">
              <label class="field-block">
                <span class="field-label">Scope</span>
                <select
                  class="select"
                  value={constraint.scope}
                  onchange={(event) =>
                    handleRuleScopeChange(
                      constraint.id,
                      (event.target as HTMLSelectElement).value as 'neutral' | 'all-palettes'
                    )}
                >
                  <option value="all-palettes">All generated palettes</option>
                  <option value="neutral">Neutral palette</option>
                </select>
              </label>

              <label class="field-block">
                <span class="field-label">Step</span>
                <input
                  class="input mono"
                  type="number"
                  min="0"
                  max={Math.max(0, numColorsLocal - 1)}
                  value={constraint.stepIndex}
                  oninput={(event) =>
                    handleRuleStepChange(
                      constraint.id,
                      Number.parseInt((event.target as HTMLInputElement).value, 10) || 0
                    )}
                />
              </label>

              <label class="field-block">
                <span class="field-label">Reference</span>
                <select
                  class="select"
                  value={constraint.reference}
                  onchange={(event) =>
                    handleRuleReferenceChange(
                      constraint.id,
                      (event.target as HTMLSelectElement).value as 'low' | 'high'
                    )}
                >
                  <option value="low">Low reference</option>
                  <option value="high">High reference</option>
                </select>
              </label>

              <label class="field-block">
                <span class="field-label">Algorithm</span>
                <select
                  class="select"
                  value={constraint.algorithm}
                  onchange={(event) =>
                    handleRuleAlgorithmChange(
                      constraint.id,
                      (event.target as HTMLSelectElement).value as ContrastAlgorithm
                    )}
                >
                  <option value="WCAG">WCAG 2.2</option>
                  <option value="APCA">APCA</option>
                </select>
              </label>

              <label class="field-block">
                <span class="field-label">Threshold</span>
                <select
                  class="select"
                  value={constraint.level}
                  onchange={(event) =>
                    handleRuleLevelChange(
                      constraint.id,
                      (event.target as HTMLSelectElement).value as ConstraintThresholdKey
                    )}
                >
                  {#each getThresholdOptionsForAlgorithm(constraint.algorithm) as level (level)}
                    <option value={level}>{getConstraintThresholdLabel(level)}</option>
                  {/each}
                </select>
              </label>
            </div>
            <div class="target-options-row">
              <label class="must-pass-toggle">
                <input
                  type="checkbox"
                  aria-label="Fit to threshold"
                  checked={constraint.fitToThreshold ?? false}
                  onchange={(event) =>
                    handleRuleFitToThresholdChange(
                      constraint.id,
                      (event.target as HTMLInputElement).checked
                    )}
                />
                <span>Fit to threshold</span>
              </label>
              <span class="field-hint">
                Fit the step median to the selected threshold while keeping the minimum at or above
                it.
              </span>
            </div>
          {/if}

          {#if getResult(constraint.id)}
            <div class="result-row">
              {#if constraint.type === 'target-color'}
                <span
                  class={`result-badge result-badge--${getTargetResult(constraint.id)?.status}`}
                >
                  {getTargetResult(constraint.id)?.status}
                </span>
                {#if constraint.mustPass}
                  <span class="priority-badge">
                    {getTargetResult(constraint.id)?.requiredSatisfied
                      ? 'Required satisfied'
                      : 'Required unsatisfied'}
                  </span>
                {/if}
                <div class="target-preview-pair">
                  <div class="target-preview-card">
                    <span class="field-label">Target</span>
                    <span
                      class="target-preview-swatch"
                      style={`background-color: ${constraint.targetHex};`}
                      aria-hidden="true"
                    ></span>
                    <span class="mono">{constraint.targetHex}</span>
                  </div>
                  <div class="target-preview-card">
                    <span class="field-label">Closest</span>
                    <span
                      class="target-preview-swatch"
                      style={`background-color: ${getTargetResult(constraint.id)?.closestHex ?? 'transparent'};`}
                      aria-hidden="true"
                    ></span>
                    <span class="mono"
                      >{getTargetResult(constraint.id)?.closestHex ?? 'Unavailable'}</span
                    >
                  </div>
                </div>
                <span>
                  Closest swatch: {getTargetResult(constraint.id)?.paletteLabel}, step {getTargetResult(
                    constraint.id
                  )?.swatchLabel}
                </span>
                <span>
                  {getTargetColorMetricLabel(getTargetResult(constraint.id)?.metric ?? 'ok')}
                  {getTargetResult(constraint.id)?.deltaE.toFixed(3)}
                </span>
              {:else}
                <span
                  class={`result-badge ${
                    getRuleResult(constraint.id)?.passes
                      ? 'result-badge--pass'
                      : 'result-badge--fail'
                  }`}
                >
                  {getRuleResult(constraint.id)?.passes ? 'pass' : 'fail'}
                </span>
                <span>
                  {constraint.fitToThreshold ? 'Nearest swatch' : 'Worst case'}:
                  {getRuleResult(constraint.id)?.paletteLabel}, step {getRuleResult(constraint.id)
                    ?.swatchLabel}
                </span>
                <span>
                  {constraint.fitToThreshold ? 'Median' : 'Minimum'}
                  {getRuleResult(constraint.id)?.actualValue.toFixed(
                    (getRuleResult(constraint.id)?.actualValue ?? 0) >= 10 ? 1 : 2
                  )} /
                  {getConstraintThresholdValue(
                    (constraint as Extract<Constraint, { type: 'contrast-rule' }>).level
                  )}
                </span>
                {#if constraint.fitToThreshold && getRuleResult(constraint.id)?.minimumValue !== undefined}
                  <span>
                    Minimum {getRuleResult(constraint.id)?.minimumValue?.toFixed(
                      (getRuleResult(constraint.id)?.minimumValue ?? 0) >= 10 ? 1 : 2
                    )}
                  </span>
                {/if}
              {/if}
            </div>
          {/if}
        </article>
      {/each}
    </div>
  {/if}

  {#if activeSwatchPickerLocal?.kind === 'constraint-target'}
    <div class="picker-banner" role="status">
      <span>Select a swatch to use as the target color.</span>
      <button type="button" class="action-button action-button--ghost" onclick={cancelPicker}>
        Cancel
      </button>
    </div>
  {/if}

  <div class="solver-actions">
    <button
      type="button"
      class="action-button"
      onclick={handleSolve}
      disabled={constraintsLocal.length === 0 || constraintSolveRunStateLocal.status !== 'idle'}
      >Solve constraints</button
    >
    <button
      type="button"
      class="action-button"
      onclick={handleDeepSolve}
      disabled={constraintsLocal.length === 0 || constraintSolveRunStateLocal.status !== 'idle'}
      >Deep solve</button
    >
    <button
      type="button"
      class="action-button action-button--ghost"
      onclick={handleClearSolvedAdjustments}
      disabled={!solverAdjustmentSnapshotLocal || constraintSolveRunStateLocal.status !== 'idle'}
      >Clear solved adjustments</button
    >
  </div>

  {#if constraintSolveRunStateLocal.status !== 'idle'}
    <p class="solve-status" aria-live="polite">
      <span class="solve-spinner" aria-hidden="true"></span>
      {constraintSolveRunStateLocal.statusMessage}
    </p>
  {/if}

  {#if constraintSolverSummaryLocal}
    <p class="solver-summary">
      Last solve: {constraintSolverSummaryLocal.profile === 'deep'
        ? 'browser deep solve'
        : 'browser solve'},
      {constraintSolverSummaryLocal.passCount} pass,
      {constraintSolverSummaryLocal.warningCount} warning,
      {constraintSolverSummaryLocal.failCount} fail.
      {#if (constraintSolverSummaryLocal.requiredUnsatisfiedCount ?? 0) > 0}
        {constraintSolverSummaryLocal.requiredUnsatisfiedCount ?? 0} required unsatisfied.
      {:else if constraintSolverSummaryLocal.changed}
        Adjustments applied.
      {:else}
        No meaningful adjustments found.
      {/if}
    </p>
  {/if}
</section>

<style>
  .constraints-controls {
    display: grid;
    gap: var(--space-md);
  }

  .constraint-actions,
  .solver-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .action-button {
    min-height: var(--touch-target-comfortable);
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-primary);
    color: var(--text-primary);
    font: inherit;
    cursor: pointer;
  }

  .action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-button--ghost {
    background: var(--bg-secondary);
  }

  .constraint-list {
    display: grid;
    gap: var(--space-md);
  }

  .constraint-row {
    display: grid;
    gap: var(--space-sm);
    padding: var(--space-md);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--bg-secondary);
  }

  .constraint-row-header {
    display: flex;
    justify-content: space-between;
    gap: var(--space-sm);
    align-items: center;
  }

  .constraint-row-header h3 {
    margin: 0;
    font-size: var(--font-size-md);
    color: var(--text-primary);
  }

  .field-row,
  .field-grid {
    display: grid;
    gap: var(--space-sm);
  }

  .target-options-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
    align-items: center;
  }

  .field-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }

  .field-block {
    display: grid;
    gap: var(--space-xs);
  }

  .field-label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  .field-hint {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
  }

  .must-pass-toggle {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    min-height: var(--touch-target-min);
    color: var(--text-primary);
  }

  .result-row,
  .picker-banner {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
    align-items: center;
  }

  .solve-status {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
    margin: 0;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }

  .solve-spinner {
    width: var(--space-md);
    height: var(--space-md);
    border: 2px solid color-mix(in oklab, var(--text-secondary) 22%, transparent);
    border-top-color: var(--text-primary);
    border-radius: var(--radius-full);
    animation: constraints-spin 0.8s linear infinite;
  }

  .result-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 72px;
    min-height: var(--touch-target-min);
    padding: 0 var(--space-sm);
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
  }

  .result-badge--pass {
    background: color-mix(in oklab, #15803d 18%, var(--bg-primary));
    color: color-mix(in oklab, #15803d 85%, white);
  }

  .result-badge--warning {
    background: color-mix(in oklab, #b45309 18%, var(--bg-primary));
    color: color-mix(in oklab, #b45309 85%, white);
  }

  .result-badge--fail {
    background: color-mix(in oklab, #b91c1c 18%, var(--bg-primary));
    color: color-mix(in oklab, #b91c1c 85%, white);
  }

  .priority-badge {
    display: inline-flex;
    align-items: center;
    min-height: var(--touch-target-min);
    padding: 0 var(--space-sm);
    border: 1px solid color-mix(in oklab, var(--accent) 35%, var(--border));
    border-radius: var(--radius-full);
    color: var(--text-primary);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
  }

  .target-preview-pair {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .target-preview-card {
    display: grid;
    gap: var(--space-xs);
    min-width: 120px;
    padding: var(--space-sm);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-primary);
  }

  .target-preview-swatch {
    width: var(--space-xl);
    height: var(--space-xl);
    border-radius: var(--radius-sm);
    border: 1px solid color-mix(in oklab, var(--border) 70%, transparent);
  }

  .empty-state,
  .solver-summary {
    margin: 0;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }

  @keyframes constraints-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
