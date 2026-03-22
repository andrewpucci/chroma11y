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
  import { startSolveConstraintsInWorker } from '$lib/constraintSolveClient';
  import {
    DEFAULT_NEUTRAL_PALETTE_NAME,
    resolveGeneratedPaletteNames,
    resolveNeutralPaletteName
  } from '$lib/paletteNameUtils';
  import Badge from './Badge.svelte';
  import Button from './Button.svelte';
  import CheckboxRow from './CheckboxRow.svelte';
  import type {
    ColorDifferenceMetric,
    Constraint,
    ConstraintResult,
    ConstraintSolveRequest,
    ConstraintStatus,
    ConstraintThresholdKey,
    ContrastAlgorithm,
    ContrastRuleConstraintResult,
    TargetColorConstraintResult
  } from '$lib/types';
  import { MAX_MUST_PASS_TARGETS } from '$lib/types';

  interface Props {
    onHistoryCommit?: (label: string) => void;
  }

  interface ConstraintRowViewModel {
    id: string;
    type: Constraint['type'];
    enabled: boolean;
    required: boolean;
    status: ConstraintStatus | 'disabled';
    title: string;
    descriptor: string;
    summary: string;
    swatches: {
      target?: string;
      closest?: string;
    };
    result: ConstraintResult | null;
  }

  type StatusFilter = 'all' | 'failing' | 'warning' | 'passing' | 'required' | 'disabled';
  type TypeFilter = 'all' | Constraint['type'];

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

  let expandedConstraintId = $state<string | null>(null);
  let statusFilter = $state<StatusFilter>('all');
  let typeFilter = $state<TypeFilter>('all');
  let activeSolveCancel = $state<(() => void) | null>(null);

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

  let resultById = $derived(
    new Map(
      evaluation.results.map((result) => [result.id, result] satisfies [string, ConstraintResult])
    )
  );

  let enabledConstraintCount = $derived(
    constraintsLocal.reduce((count, constraint) => count + (constraint.enabled ? 1 : 0), 0)
  );
  let disabledConstraintCount = $derived(constraintsLocal.length - enabledConstraintCount);

  let rowViewModels = $derived(
    constraintsLocal.map((constraint) =>
      buildRowViewModel(constraint, resultById.get(constraint.id) ?? null)
    )
  );
  let filteredRows = $derived(
    rowViewModels.filter(
      (row) => matchesStatusFilter(row, statusFilter) && matchesTypeFilter(row, typeFilter)
    )
  );
  let isSolveLocked = $derived(constraintSolveRunStateLocal.status !== 'idle');

  $effect(() => {
    if (!expandedConstraintId) {
      return;
    }

    if (!constraintsLocal.some((constraint) => constraint.id === expandedConstraintId)) {
      expandedConstraintId = null;
    }
  });

  function buildRowViewModel(
    constraint: Constraint,
    result: ConstraintResult | null
  ): ConstraintRowViewModel {
    if (!constraint.enabled) {
      return {
        id: constraint.id,
        type: constraint.type,
        enabled: false,
        required: constraint.type === 'target-color' && constraint.mustPass === true,
        status: 'disabled',
        title: constraint.type === 'target-color' ? 'Target color' : 'Contrast rule',
        descriptor:
          constraint.type === 'target-color'
            ? `${constraint.targetHex.toUpperCase()} · ${getTargetColorMetricLabel(constraint.metric ?? 'ok')}`
            : formatRuleDescriptor(constraint),
        summary: 'Disabled. Excluded from solve and evaluation.',
        swatches:
          constraint.type === 'target-color'
            ? {
                target: constraint.targetHex
              }
            : {},
        result: null
      };
    }

    if (constraint.type === 'target-color') {
      const targetResult = result?.type === 'target-color' ? result : null;
      const status = targetResult?.status ?? 'fail';

      return {
        id: constraint.id,
        type: constraint.type,
        enabled: true,
        required: constraint.mustPass === true,
        status,
        title: 'Target color',
        descriptor: `${constraint.targetHex.toUpperCase()} · ${getTargetColorMetricLabel(constraint.metric ?? 'ok')}`,
        summary: formatTargetSummary(targetResult),
        swatches: {
          target: constraint.targetHex,
          closest: targetResult?.closestHex ?? undefined
        },
        result: targetResult
      };
    }

    const ruleResult = result?.type === 'contrast-rule' ? result : null;

    return {
      id: constraint.id,
      type: constraint.type,
      enabled: true,
      required: false,
      status: ruleResult?.passes ? 'pass' : 'fail',
      title: 'Contrast rule',
      descriptor: formatRuleDescriptor(constraint),
      summary: formatRuleSummary(constraint, ruleResult),
      swatches: {},
      result: ruleResult
    };
  }

  function formatRuleDescriptor(
    constraint: Extract<Constraint, { type: 'contrast-rule' }>
  ): string {
    const scopeLabel = constraint.scope === 'neutral' ? 'Neutral' : 'All palettes';
    const referenceLabel = constraint.reference === 'low' ? 'Low ref' : 'High ref';
    return `${scopeLabel} · Step ${constraint.stepIndex * 10} · ${referenceLabel} · ${constraint.algorithm} ${getConstraintThresholdLabel(constraint.level)}`;
  }

  function formatTargetSummary(result: TargetColorConstraintResult | null): string {
    if (!result) {
      return 'Closest swatch unavailable.';
    }

    return `${result.paletteLabel}, step ${result.swatchLabel} · ${getTargetColorMetricLabel(result.metric)} ${result.deltaE.toFixed(3)}`;
  }

  function formatRuleSummary(
    constraint: Extract<Constraint, { type: 'contrast-rule' }>,
    result: ContrastRuleConstraintResult | null
  ): string {
    if (!result) {
      return 'Contrast result unavailable.';
    }

    const actualLabel = constraint.fitToThreshold ? 'Median' : 'Minimum';
    const threshold = getConstraintThresholdValue(constraint.level);
    return `${constraint.fitToThreshold ? 'Nearest' : 'Worst'} ${result.paletteLabel}, step ${result.swatchLabel} · ${actualLabel} ${formatConstraintValue(result.actualValue)} / ${threshold}`;
  }

  function formatConstraintValue(value: number): string {
    return value.toFixed(value >= 10 ? 1 : 2);
  }

  function matchesStatusFilter(row: ConstraintRowViewModel, filter: StatusFilter): boolean {
    if (filter === 'all') return true;
    if (filter === 'disabled') return row.status === 'disabled';
    if (filter === 'required') return row.required;
    if (row.status === 'disabled') return false;
    if (filter === 'failing') return row.status === 'fail';
    if (filter === 'warning') return row.status === 'warning';
    return row.status === 'pass';
  }

  function matchesTypeFilter(row: ConstraintRowViewModel, filter: TypeFilter): boolean {
    return filter === 'all' || row.type === filter;
  }

  function getStatusBadgeLabel(status: ConstraintRowViewModel['status']): string {
    return status === 'disabled' ? 'disabled' : status;
  }

  function getTopSummary(): string {
    if (constraintsLocal.length === 0) {
      return 'No constraints yet. Add a target color or contrast rule to guide the palette.';
    }

    const summaryParts = [
      `${evaluation.summary.failCount} fail`,
      `${evaluation.summary.warningCount} warning`,
      `${evaluation.summary.passCount} pass`
    ];

    if ((evaluation.summary.requiredUnsatisfiedCount ?? 0) > 0) {
      summaryParts.push(`${evaluation.summary.requiredUnsatisfiedCount} required unsatisfied`);
    }

    if (disabledConstraintCount > 0) {
      summaryParts.push(`${disabledConstraintCount} disabled`);
    }

    return summaryParts.join(' · ');
  }

  function getFilterResultsLabel(): string {
    if (constraintsLocal.length === 0) {
      return 'No constraints';
    }

    if (filteredRows.length === constraintsLocal.length) {
      return `${constraintsLocal.length} constraints shown`;
    }

    return `${filteredRows.length} of ${constraintsLocal.length} constraints shown`;
  }

  function toggleExpanded(id: string): void {
    expandedConstraintId = expandedConstraintId === id ? null : id;
  }

  function addTargetColorConstraint(): void {
    const constraint = createDefaultTargetColorConstraint();
    addConstraint(constraint);
    expandedConstraintId = constraint.id;
    onHistoryCommit?.('Target color constraint added');
  }

  function addContrastRuleConstraint(): void {
    const constraint = createDefaultContrastRuleConstraint(contrastAlgorithmLocal);
    addConstraint(constraint);
    expandedConstraintId = constraint.id;
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
    if (expandedConstraintId === id) {
      expandedConstraintId = null;
    }
    onHistoryCommit?.('Constraint removed');
  }

  function handleConstraintEnabledChange(id: string, checked: boolean): void {
    updateConstraint(id, (constraint) => ({
      ...constraint,
      enabled: checked
    }));

    if (!checked && expandedConstraintId === id) {
      expandedConstraintId = null;
    }
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
    if (isSolveLocked) {
      return;
    }

    if (activeSwatchPickerLocal?.kind === 'constraint-target') {
      activeSwatchPicker.set(null);
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
      statusMessage: isDeepSolve ? 'Running deep solve...' : 'Solving constraints...'
    });

    try {
      const solveTask = startSolveConstraintsInWorker(request, profile);
      activeSolveCancel = solveTask.cancel;
      const solved = await solveTask.promise;
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
      if (error instanceof DOMException && error.name === 'AbortError') {
        announce(isDeepSolve ? 'Deep solve cancelled.' : 'Solve cancelled.');
      } else {
        console.error(error);
        announce(isDeepSolve ? 'Deep solve failed.' : 'Local solve failed.');
      }
    } finally {
      activeSolveCancel = null;
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

  function handleCancelSolve(): void {
    if (!activeSolveCancel) {
      return;
    }

    setConstraintSolveRunState({
      ...constraintSolveRunStateLocal,
      statusMessage:
        constraintSolveRunStateLocal.status === 'running-deep'
          ? 'Cancelling deep solve...'
          : 'Cancelling solve...'
    });
    activeSolveCancel();
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<section class="constraints-controls">
  <div class="constraints-toolbar">
    <div class="toolbar-copy">
      <p class="toolbar-summary">{getTopSummary()}</p>
      <div class="toolbar-chips" aria-label="Constraint health summary">
        <Badge>{enabledConstraintCount} enabled</Badge>
        <Badge variant="fail">{evaluation.summary.failCount} fail</Badge>
        <Badge variant="warning">{evaluation.summary.warningCount} warning</Badge>
        <Badge variant="pass">{evaluation.summary.passCount} pass</Badge>
        {#if (evaluation.summary.requiredUnsatisfiedCount ?? 0) > 0}
          <Badge variant="accent">
            {evaluation.summary.requiredUnsatisfiedCount} required unsatisfied
          </Badge>
        {/if}
        {#if disabledConstraintCount > 0}
          <Badge>{disabledConstraintCount} disabled</Badge>
        {/if}
      </div>
      {#if constraintSolverSummaryLocal}
        <p class="solver-summary">
          Last solve: {constraintSolverSummaryLocal.profile === 'deep' ? 'deep solve' : 'solve'},
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
    </div>

    <div class="toolbar-actions">
      <div class="action-row">
        <Button onclick={addTargetColorConstraint} disabled={isSolveLocked}>
          Add target color
        </Button>
        <Button onclick={addContrastRuleConstraint} disabled={isSolveLocked}>
          Add contrast rule
        </Button>
      </div>

      <div class="action-row">
        <Button onclick={handleSolve} disabled={constraintsLocal.length === 0 || isSolveLocked}>
          Solve constraints
        </Button>
        <Button onclick={handleDeepSolve} disabled={constraintsLocal.length === 0 || isSolveLocked}>
          Deep solve
        </Button>
        <Button
          onclick={handleClearSolvedAdjustments}
          disabled={!solverAdjustmentSnapshotLocal || isSolveLocked}
          variant="ghost"
        >
          Clear solved adjustments
        </Button>
      </div>
    </div>
  </div>

  {#if isSolveLocked}
    <div class="solve-status" aria-live="polite">
      <span class="solve-spinner" aria-hidden="true"></span>
      <strong
        >{constraintSolveRunStateLocal.status === 'running-deep'
          ? 'Deep solve running'
          : 'Solve running'}</strong
      >
      <span>{constraintSolveRunStateLocal.statusMessage}</span>
      <Button onclick={handleCancelSolve} variant="ghost">Cancel solve</Button>
    </div>
  {/if}

  {#if constraintsLocal.length > 0}
    <div class="constraint-filters">
      <label class="field-block">
        <span class="field-label">Status</span>
        <select
          class="select"
          aria-label="Constraint status filter"
          bind:value={statusFilter}
          disabled={isSolveLocked}
        >
          <option value="all">All</option>
          <option value="failing">Failing</option>
          <option value="warning">Warning</option>
          <option value="passing">Passing</option>
          <option value="required">Required</option>
          <option value="disabled">Disabled</option>
        </select>
      </label>

      <label class="field-block">
        <span class="field-label">Type</span>
        <select
          class="select"
          aria-label="Constraint type filter"
          bind:value={typeFilter}
          disabled={isSolveLocked}
        >
          <option value="all">All</option>
          <option value="target-color">Target color</option>
          <option value="contrast-rule">Contrast rule</option>
        </select>
      </label>

      <p class="filter-results">{getFilterResultsLabel()}</p>
    </div>
  {/if}

  {#if constraintsLocal.length === 0}
    <p class="empty-state">
      No constraints yet. Add a target color or contrast rule to guide the palette.
    </p>
  {:else if filteredRows.length === 0}
    <p class="empty-state">No constraints match the current filters.</p>
  {:else}
    <div class="constraint-list">
      {#each filteredRows as row (row.id)}
        {@const isExpanded = expandedConstraintId === row.id}
        {@const constraint = constraintsLocal.find((entry) => entry.id === row.id)}
        {#if constraint}
          <article class:constraint-row--disabled={!row.enabled} class="constraint-row">
            <div class="constraint-row-summary">
              <CheckboxRow
                id={`constraint-enabled-${row.id}`}
                label={constraint.enabled ? 'Enabled' : 'Disabled'}
                checked={constraint.enabled}
                disabled={isSolveLocked}
                ariaLabel={`${row.title} enabled`}
                onChange={(checked) => handleConstraintEnabledChange(row.id, checked)}
              />

              <div class="summary-main">
                <div class="summary-labels">
                  <Badge
                    variant={row.status === 'disabled' ? 'disabled' : row.status}
                    uppercase={row.status !== 'disabled'}
                  >
                    {getStatusBadgeLabel(row.status)}
                  </Badge>
                  {#if row.required}
                    <Badge variant="accent">
                      {row.result?.type === 'target-color' && row.result.requiredSatisfied
                        ? 'Required satisfied'
                        : 'Required'}
                    </Badge>
                  {/if}
                  <span class="constraint-kind">{row.title}</span>
                </div>

                <div class="summary-text">
                  <strong>{row.descriptor}</strong>
                  <span>{row.summary}</span>
                </div>

                {#if row.type === 'target-color'}
                  <div class="summary-swatches" aria-hidden="true">
                    <span
                      class="summary-swatch"
                      style={`background-color: ${row.swatches.target ?? 'transparent'};`}
                    ></span>
                    <span class="summary-swatch-connector"></span>
                    <span
                      class="summary-swatch"
                      style={`background-color: ${row.swatches.closest ?? 'transparent'};`}
                    ></span>
                  </div>
                {/if}
              </div>

              <Button
                ariaExpanded={isExpanded}
                ariaControls={`constraint-panel-${row.id}`}
                compact
                disabled={isSolveLocked}
                onclick={() => toggleExpanded(row.id)}
                variant="ghost"
              >
                {isExpanded ? 'Collapse' : 'Edit'}
              </Button>
            </div>

            {#if isExpanded}
              <div class="constraint-editor" id={`constraint-panel-${row.id}`}>
                {#if constraint.type === 'target-color'}
                  <div class="editor-grid">
                    <div class="field-row">
                      <label class="field-label" for={`target-${constraint.id}`}>Target hex</label>
                      <input
                        id={`target-${constraint.id}`}
                        class="input mono"
                        type="text"
                        value={constraint.targetHex}
                        disabled={isSolveLocked}
                        oninput={(event) =>
                          handleTargetHexChange(
                            constraint.id,
                            (event.target as HTMLInputElement).value
                          )}
                      />
                    </div>

                    <div class="field-row">
                      <label class="field-label" for={`metric-${constraint.id}`}>Metric</label>
                      <select
                        id={`metric-${constraint.id}`}
                        class="select"
                        value={constraint.metric ?? 'ok'}
                        disabled={isSolveLocked}
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

                    <div class="field-row field-row--actions">
                      <span class="field-label">Target source</span>
                      <Button
                        disabled={isSolveLocked}
                        onclick={() => beginTargetColorPick(constraint.id)}
                        variant="ghost"
                      >
                        Pick from palette
                      </Button>
                    </div>
                  </div>

                  <div class="target-options-row">
                    <CheckboxRow
                      id={`must-pass-${constraint.id}`}
                      label="Must pass"
                      checked={constraint.mustPass ?? false}
                      disabled={isSolveLocked || !canEnableMustPass(constraint.id)}
                      ariaLabel="Must pass"
                      onChange={(checked) => handleTargetMustPassChange(constraint.id, checked)}
                    />
                    <span class="field-hint">
                      Up to {MAX_MUST_PASS_TARGETS} target colors can be marked must pass.
                    </span>
                  </div>

                  {#if row.result?.type === 'target-color'}
                    <div class="expanded-result">
                      <div class="target-preview-card">
                        <span class="field-label">Target</span>
                        <span
                          class="target-preview-swatch"
                          style={`background-color: ${constraint.targetHex};`}
                          aria-hidden="true"
                        ></span>
                        <span class="mono">{constraint.targetHex.toUpperCase()}</span>
                      </div>

                      <div class="target-preview-card">
                        <span class="field-label">Closest</span>
                        <span
                          class="target-preview-swatch"
                          style={`background-color: ${row.result.closestHex ?? 'transparent'};`}
                          aria-hidden="true"
                        ></span>
                        <span class="mono">{row.result.closestHex ?? 'Unavailable'}</span>
                      </div>

                      <p class="expanded-copy">
                        Closest swatch: {row.result.paletteLabel}, step {row.result.swatchLabel}.
                        {getTargetColorMetricLabel(row.result.metric)}
                        {row.result.deltaE.toFixed(3)}
                      </p>
                    </div>
                  {/if}
                {:else}
                  <div class="editor-grid">
                    <label class="field-block">
                      <span class="field-label">Scope</span>
                      <select
                        class="select"
                        value={constraint.scope}
                        disabled={isSolveLocked}
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
                        disabled={isSolveLocked}
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
                        disabled={isSolveLocked}
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
                        disabled={isSolveLocked}
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
                        disabled={isSolveLocked}
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
                    <CheckboxRow
                      id={`fit-threshold-${constraint.id}`}
                      label="Fit to threshold"
                      checked={constraint.fitToThreshold ?? false}
                      disabled={isSolveLocked}
                      ariaLabel="Fit to threshold"
                      onChange={(checked) => handleRuleFitToThresholdChange(constraint.id, checked)}
                    />
                    <span class="field-hint">
                      Fit the step median to the selected threshold while keeping the minimum at or
                      above it.
                    </span>
                  </div>

                  {#if row.result?.type === 'contrast-rule'}
                    <p class="expanded-copy">
                      {constraint.fitToThreshold ? 'Nearest swatch' : 'Worst case'}:
                      {row.result.paletteLabel}, step {row.result.swatchLabel}. {constraint.fitToThreshold
                        ? 'Median'
                        : 'Minimum'}
                      {row.result.actualValue.toFixed(row.result.actualValue >= 10 ? 1 : 2)} /
                      {getConstraintThresholdValue(constraint.level)}.
                      {#if constraint.fitToThreshold && row.result.minimumValue !== undefined}
                        Minimum {formatConstraintValue(row.result.minimumValue)}.
                      {/if}
                    </p>
                  {/if}
                {/if}

                <div class="editor-actions">
                  <Button
                    disabled={isSolveLocked}
                    onclick={() => removeConstraintRow(constraint.id)}
                    variant="ghost"
                  >
                    Remove constraint
                  </Button>
                </div>
              </div>
            {/if}
          </article>
        {/if}
      {/each}
    </div>
  {/if}

  {#if activeSwatchPickerLocal?.kind === 'constraint-target'}
    <div class="picker-banner" role="status">
      <span>Select a swatch to use as the target color.</span>
      <Button onclick={cancelPicker} variant="ghost">Cancel</Button>
    </div>
  {/if}
</section>

<style>
  .constraints-controls {
    display: grid;
    gap: var(--space-md);
  }

  .constraints-toolbar {
    display: grid;
    gap: var(--space-md);
    padding: var(--space-md);
    border: var(--border-width-thin) solid color-mix(in oklab, var(--border) 60%, transparent);
    border-radius: var(--radius-lg);
    background: color-mix(in oklab, var(--bg-secondary) 92%, transparent);
  }

  .toolbar-copy,
  .toolbar-actions,
  .action-row {
    display: grid;
    gap: var(--space-sm);
  }

  .toolbar-summary,
  .empty-state,
  .solver-summary,
  .filter-results,
  .expanded-copy {
    margin: 0;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }

  .toolbar-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .constraint-filters {
    display: grid;
    gap: var(--space-sm);
    grid-template-columns: repeat(auto-fit, minmax(var(--constraint-field-min), 1fr));
    align-items: end;
  }

  .constraint-list {
    display: grid;
    gap: var(--space-sm);
  }

  .constraint-row {
    display: grid;
    gap: var(--space-sm);
    padding: var(--space-md);
    border: var(--border-width-thin) solid color-mix(in oklab, var(--border) 60%, transparent);
    border-radius: var(--radius-lg);
    background: color-mix(in oklab, var(--bg-secondary) 94%, transparent);
  }

  .constraint-row--disabled {
    opacity: 0.78;
  }

  .constraint-row-summary {
    display: grid;
    gap: var(--space-sm);
    grid-template-columns: minmax(0, auto) minmax(0, 1fr) auto;
    align-items: center;
  }

  .summary-main,
  .summary-text,
  .summary-labels {
    display: grid;
    gap: var(--space-xs);
    min-width: 0;
  }

  .summary-labels {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }

  .constraint-kind {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-wide);
  }

  .summary-text strong,
  .summary-text span {
    overflow-wrap: anywhere;
  }

  .summary-text strong {
    color: var(--text-primary);
    font-size: var(--font-size-sm);
  }

  .summary-text span {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }

  .summary-swatches {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
  }

  .summary-swatch {
    width: var(--constraint-summary-swatch-size);
    height: var(--constraint-summary-swatch-size);
    border-radius: var(--radius-sm);
    border: var(--border-width-thin) solid color-mix(in oklab, var(--border) 70%, transparent);
    background: transparent;
  }

  .summary-swatch-connector {
    width: var(--space-md);
    border-top: var(--border-width-thin) dashed color-mix(in oklab, var(--border) 75%, transparent);
  }

  .constraint-editor {
    display: grid;
    gap: var(--space-md);
    padding-top: var(--space-sm);
    border-top: var(--border-width-thin) solid color-mix(in oklab, var(--border) 42%, transparent);
  }

  .editor-grid {
    display: grid;
    gap: var(--space-sm);
    grid-template-columns: repeat(auto-fit, minmax(var(--constraint-field-min), 1fr));
  }

  .field-row,
  .field-block {
    display: grid;
    gap: var(--space-xs);
  }

  .field-row--actions {
    align-content: start;
  }

  .field-label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  .field-hint {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
  }

  .target-options-row,
  .picker-banner,
  .expanded-result,
  .editor-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
    align-items: center;
  }

  .expanded-result {
    align-items: stretch;
  }

  .target-preview-card {
    display: grid;
    gap: var(--space-xs);
    min-width: var(--constraint-preview-min);
    padding: var(--space-sm);
    border: var(--border-width-thin) solid color-mix(in oklab, var(--border) 70%, transparent);
    border-radius: var(--radius-md);
    background: var(--bg-primary);
  }

  .target-preview-swatch {
    width: var(--constraint-preview-swatch-size);
    height: var(--constraint-preview-swatch-size);
    border-radius: var(--radius-sm);
    border: var(--border-width-thin) solid color-mix(in oklab, var(--border) 70%, transparent);
  }

  .solve-status {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-sm);
    margin: 0;
    padding: var(--space-sm) var(--space-md);
    border: var(--border-width-thin) solid color-mix(in oklab, var(--accent) 30%, var(--border));
    border-radius: var(--radius-md);
    background: color-mix(in oklab, var(--accent) 8%, var(--bg-primary));
    color: var(--text-primary);
    font-size: var(--font-size-sm);
  }

  .solve-status strong {
    color: var(--text-primary);
  }

  .solve-spinner {
    width: var(--space-md);
    height: var(--space-md);
    border: var(--border-width-medium) solid
      color-mix(in oklab, var(--text-secondary) 22%, transparent);
    border-top-color: var(--text-primary);
    border-radius: var(--radius-full);
    animation: constraints-spin 0.8s linear infinite;
  }

  @media (max-width: 780px) {
    .constraint-row-summary {
      grid-template-columns: 1fr;
      align-items: start;
    }

    .summary-swatches {
      order: 3;
    }

    .editor-grid {
      grid-template-columns: 1fr;
    }
  }

  @keyframes constraints-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
