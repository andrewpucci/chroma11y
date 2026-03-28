<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { get } from 'svelte/store';
  import {
    colorStore,
    neutrals,
    palettes,
    neutralsHex,
    palettesHex,
    neutralsSwatchDisplay,
    palettesSwatchDisplay,
    numColors,
    numPalettes,
    baseColor,
    warmth,
    warmthHue,
    chromaMultiplier,
    x1,
    y1,
    x2,
    y2,
    lightnessNudgers,
    hueNudgers,
    currentTheme,
    contrastColors,
    contrastMode,
    lowStep,
    highStep,
    lowReference,
    highReference,
    displayColorSpace,
    gamutSpace,
    paletteChromaNudgers,
    paletteSaturationNudgers,
    themePreference,
    stepSaturationNudgers,
    swatchLabels,
    showSwatchGamutWarnings,
    showSwatchContrastIndicators,
    swatchContrastIndicators,
    contrastAlgorithm,
    oklchDisplaySignificantDigits,
    customNeutralName,
    customPaletteNames,
    constraints,
    solverAdjustmentSnapshot,
    constraintSolverSummary,
    updateColorState,
    updateContrastFromNeutrals,
    resetColorState,
    setTheme,
    setThemePreference
  } from '$lib/stores';
  import { getUrlState, updateBrowserUrl, type UrlColorState } from '$lib/urlUtils';
  import {
    loadStateFromStorage,
    saveStateToStorage,
    loadUiPreferencesFromStorage,
    saveUiPreferencesToStorage,
    type StoredUiPreferences
  } from '$lib/storageUtils';
  import { announce } from '$lib/announce';
  import { generatePalettes } from '$lib/colorUtils';
  import type { ColorGenParams } from '$lib/colorUtils';
  import { clampChromaMultiplier } from '$lib/chromaMultiplier';
  import { evaluateConstraints } from '$lib/constraintUtils';
  import { createHistoryManager, type HistorySnapshot, type HistoryViewModel } from '$lib/history';
  import { createPageScheduler, type PageScheduler } from '$lib/pageScheduler';
  import {
    DEFAULT_NEUTRAL_PALETTE_NAME,
    resolveGeneratedPaletteNames,
    resolveNeutralPaletteName
  } from '$lib/paletteNameUtils';
  import ColorControls from '$lib/components/ColorControls.svelte';
  import ExportButtons from '$lib/components/ExportButtons.svelte';
  import NeutralPalette from '$lib/components/NeutralPalette.svelte';
  import PaletteGrid from '$lib/components/PaletteGrid.svelte';
  import ContrastControls from '$lib/components/ContrastControls.svelte';
  import ConstraintsControls from '$lib/components/ConstraintsControls.svelte';
  import DisplaySettings from '$lib/components/DisplaySettings.svelte';
  import Card from '$lib/components/Card.svelte';
  import AppHeader from '$lib/components/AppHeader.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import ColorInfoDrawer from '$lib/components/ColorInfoDrawer.svelte';

  interface Props {
    scheduler?: PageScheduler;
  }

  interface CompactSectionState {
    generation: boolean;
    constraints: boolean;
    contrast: boolean;
    output: boolean;
    export: boolean;
  }

  let { scheduler = createPageScheduler() }: Props = $props();

  const COMPACT_LAYOUT_MEDIA_QUERY = '(max-width: 980px)';
  const DEFAULT_COMPACT_SECTIONS: CompactSectionState = {
    generation: false,
    constraints: false,
    contrast: false,
    output: false,
    export: false
  };

  // Derived values from stores (auto-subscribed)
  let neutralsLocal = $derived($neutrals);
  let palettesLocal = $derived($palettes);
  let neutralsHexLocal = $derived($neutralsHex);
  let palettesHexLocal = $derived($palettesHex);
  let neutralsSwatchDisplayLocal = $derived($neutralsSwatchDisplay);
  let palettesSwatchDisplayLocal = $derived($palettesSwatchDisplay);
  let lightnessNudgerValues = $derived($lightnessNudgers);
  let hueNudgerValues = $derived($hueNudgers);
  let stepSaturationNudgerValues = $derived($stepSaturationNudgers);
  let paletteSaturationNudgerValues = $derived($paletteSaturationNudgers);
  let paletteChromaNudgerValues = $derived($paletteChromaNudgers);
  let currentThemeLocal = $derived($currentTheme);
  let contrastColorsLocal = $derived($contrastColors);
  let contrastModeLocal = $derived($contrastMode);
  let lowStepLocal = $derived($lowStep);
  let highStepLocal = $derived($highStep);
  let lowReferenceLocal = $derived($lowReference);
  let highReferenceLocal = $derived($highReference);
  let displayColorSpaceLocal = $derived($displayColorSpace);
  let gamutSpaceLocal = $derived($gamutSpace);
  let themePreferenceLocal = $derived($themePreference);
  let swatchLabelsLocal = $derived($swatchLabels);
  let showSwatchGamutWarningsLocal = $derived($showSwatchGamutWarnings);
  let showSwatchContrastIndicatorsLocal = $derived($showSwatchContrastIndicators);
  let swatchContrastIndicatorsLocal = $derived($swatchContrastIndicators);
  let contrastAlgorithmLocal = $derived($contrastAlgorithm);
  let oklchDisplaySignificantDigitsLocal = $derived($oklchDisplaySignificantDigits);
  let customNeutralNameLocal = $derived($customNeutralName);
  let customPaletteNamesLocal = $derived($customPaletteNames);
  let constraintsLocal = $derived($constraints);
  let solverAdjustmentSnapshotLocal = $derived($solverAdjustmentSnapshot);
  let constraintSolverSummaryLocal = $derived($constraintSolverSummary);
  let constraintNeutralLabel = $derived(
    neutralsHexLocal.length > 0
      ? resolveNeutralPaletteName(neutralsHexLocal, contrastColorsLocal.low, customNeutralNameLocal)
      : DEFAULT_NEUTRAL_PALETTE_NAME
  );
  let constraintPaletteLabels = $derived(
    palettesHexLocal.length > 0
      ? resolveGeneratedPaletteNames(
          palettesHexLocal,
          contrastColorsLocal.low,
          customPaletteNamesLocal
        )
      : []
  );
  let constraintEvaluation = $derived(
    evaluateConstraints({
      constraints: constraintsLocal,
      neutrals: neutralsLocal,
      palettes: palettesLocal,
      neutralLabel: constraintNeutralLabel,
      paletteLabels: constraintPaletteLabels,
      lowContrastColor: contrastColorsLocal.low,
      highContrastColor: contrastColorsLocal.high
    })
  );

  // Bindable state for controls
  let baseColorLocal = $state('#1862E6');
  let warmthLocal = $state(-7);
  let warmthHueLocal = $state<number | undefined>(undefined);
  let chromaMultiplierLocal = $state(1);
  let numColorsLocal = $state(11);
  let numPalettesLocal = $state(11);
  let x1Local = $state(0.16);
  let y1Local = $state(0.0);
  let x2Local = $state(0.28);
  let y2Local = $state(0.38);
  let isCompactLayout = $state(
    typeof window === 'undefined' || !('matchMedia' in window)
      ? false
      : window.matchMedia(COMPACT_LAYOUT_MEDIA_QUERY).matches
  );
  let compactSections = $state<CompactSectionState>({ ...DEFAULT_COMPACT_SECTIONS });
  let generationAdvancedOpen = $state(false);
  let outputAdvancedOpen = $state(false);
  let uiPreferencesLoaded = $state(false);

  let urlStateLoaded = $state(false);
  let appShellEl: HTMLDivElement | undefined = $state();
  let layoutEl: HTMLElement | undefined = $state();
  let topbarInnerEl: HTMLElement | undefined = $state();
  let isDraggingSlider = $state(false);
  let isDeferringBezierStoreSync = $state(false);
  let skipAutoThemeSync = $state(false);
  let historyManager: ReturnType<typeof createHistoryManager> | null = null;
  let historyShortcutResyncRevision = 0;
  let historyRestoreRevision = $state(0);
  let pendingNativeHistoryInput: 'historyUndo' | 'historyRedo' | null = null;
  let suppressedEditableHistoryTarget: HTMLInputElement | HTMLTextAreaElement | null = null;
  let isApplyingHistorySnapshot = $state(false);
  let pendingHistoryGeneratorSnapshot: Pick<
    HistorySnapshot,
    | 'baseColor'
    | 'warmth'
    | 'warmthHue'
    | 'chromaMultiplier'
    | 'numColors'
    | 'numPalettes'
    | 'x1'
    | 'y1'
    | 'x2'
    | 'y2'
  > | null = null;
  let historyView = $state<HistoryViewModel>({
    canUndo: false,
    canRedo: false,
    position: 0,
    undoEntries: [],
    redoEntries: []
  });
  const dirtyEditableElements = new WeakSet<HTMLElement>();

  function refreshHistoryView(): void {
    historyView = historyManager
      ? historyManager.getViewModel()
      : {
          canUndo: false,
          canRedo: false,
          position: 0,
          undoEntries: [],
          redoEntries: []
        };
  }

  function applyStoredUiPreferences(preferences: StoredUiPreferences): void {
    compactSections = { ...preferences.compactSections };
    generationAdvancedOpen = preferences.generationAdvancedOpen;
    outputAdvancedOpen = preferences.outputAdvancedOpen;
  }

  function getUiPreferencesSnapshot(): StoredUiPreferences {
    return {
      compactSections: { ...compactSections },
      generationAdvancedOpen,
      outputAdvancedOpen
    };
  }

  function updateCompactSection(section: keyof CompactSectionState, open: boolean): void {
    compactSections = {
      ...compactSections,
      [section]: open
    };
  }

  function formatDisplayColorSpace(value: string): string {
    if (value === 'oklch') return 'OKLCH';
    if (value === 'rgb') return 'RGB';
    if (value === 'hsl') return 'HSL';
    return 'Hex';
  }

  function formatThemePreference(value: string): string {
    if (value === 'auto') return 'Auto';
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function formatSwatchLabels(value: string): string {
    if (value === 'both') return 'Step + Value';
    if (value === 'step') return 'Step';
    if (value === 'value') return 'Value';
    return 'Hidden';
  }

  function formatContrastAlgorithm(value: string): string {
    return value === 'WCAG' ? 'WCAG 2.2' : 'APCA';
  }

  function formatContrastStepLabel(value: number): string {
    return `${value * 10}`;
  }

  const generationCardSummary = $derived(
    `${baseColorLocal.toUpperCase()}, ${numColorsLocal} colors, ${numPalettesLocal} palettes`
  );
  const contrastCardSummary = $derived(
    contrastModeLocal === 'manual'
      ? `${formatContrastAlgorithm(contrastAlgorithmLocal)}, Manual, ${contrastColorsLocal.low} / ${contrastColorsLocal.high}`
      : `${formatContrastAlgorithm(contrastAlgorithmLocal)}, Auto, ${formatContrastStepLabel(
          lowStepLocal
        )} / ${formatContrastStepLabel(highStepLocal)}`
  );
  const constraintsCardSummary = $derived(
    (() => {
      if (constraintsLocal.length === 0) {
        return 'No constraints';
      }

      const disabledCount = constraintsLocal.length - constraintEvaluation.results.length;
      const parts = [
        `${constraintEvaluation.summary.failCount} fail`,
        `${constraintEvaluation.summary.warningCount} warning`,
        `${constraintEvaluation.summary.passCount} pass`
      ];

      if ((constraintEvaluation.summary.requiredUnsatisfiedCount ?? 0) > 0) {
        parts.push(`${constraintEvaluation.summary.requiredUnsatisfiedCount} required unsatisfied`);
      }

      if (disabledCount > 0) {
        parts.push(`${disabledCount} disabled`);
      }

      return parts.join(' · ');
    })()
  );
  const outputCardSummary = $derived(
    `${formatDisplayColorSpace(displayColorSpaceLocal)}, ${formatThemePreference(
      themePreferenceLocal
    )}, ${formatSwatchLabels(swatchLabelsLocal)}`
  );
  const exportCardSummary = 'Share URL, JSON, CSS, SCSS';

  function captureHistorySnapshot(preferStoreState: boolean = false): HistorySnapshot {
    if (preferStoreState) {
      const storeState = get(colorStore);

      return {
        baseColor: storeState.baseColor,
        warmth: storeState.warmth,
        warmthHue: storeState.warmthHue,
        chromaMultiplier: storeState.chromaMultiplier,
        numColors: storeState.numColors,
        numPalettes: storeState.numPalettes,
        x1: storeState.x1,
        y1: storeState.y1,
        x2: storeState.x2,
        y2: storeState.y2,
        contrastMode: storeState.contrastMode,
        lowStep: storeState.lowStep,
        highStep: storeState.highStep,
        lowReference: structuredClone(storeState.lowReference),
        highReference: structuredClone(storeState.highReference),
        contrast: {
          low: storeState.contrast.low,
          high: storeState.contrast.high
        },
        lightnessNudgers: [...storeState.lightnessNudgers],
        hueNudgers: [...storeState.hueNudgers],
        stepSaturationNudgers: [...storeState.stepSaturationNudgers],
        paletteSaturationNudgers: [...storeState.paletteSaturationNudgers],
        paletteChromaNudgers: [...storeState.paletteChromaNudgers],
        currentTheme: storeState.currentTheme,
        displayColorSpace: storeState.displayColorSpace,
        gamutSpace: storeState.gamutSpace,
        themePreference: storeState.themePreference,
        swatchLabels: storeState.swatchLabels,
        showSwatchGamutWarnings: storeState.showSwatchGamutWarnings,
        showSwatchContrastIndicators: storeState.showSwatchContrastIndicators,
        swatchContrastIndicators: structuredClone(storeState.swatchContrastIndicators),
        contrastAlgorithm: storeState.contrastAlgorithm,
        oklchDisplaySignificantDigits: storeState.oklchDisplaySignificantDigits,
        customNeutralName: storeState.customNeutralName,
        customPaletteNames: storeState.customPaletteNames,
        constraints: structuredClone(storeState.constraints),
        solverAdjustmentSnapshot: structuredClone(storeState.solverAdjustmentSnapshot),
        constraintSolverSummary: structuredClone(storeState.constraintSolverSummary)
      };
    }

    return {
      baseColor: baseColorLocal,
      warmth: warmthLocal,
      warmthHue: warmthHueLocal,
      chromaMultiplier: chromaMultiplierLocal,
      numColors: numColorsLocal,
      numPalettes: numPalettesLocal,
      x1: x1Local,
      y1: y1Local,
      x2: x2Local,
      y2: y2Local,
      contrastMode: contrastModeLocal,
      lowStep: lowStepLocal,
      highStep: highStepLocal,
      lowReference: structuredClone(lowReferenceLocal),
      highReference: structuredClone(highReferenceLocal),
      contrast: {
        low: contrastColorsLocal.low,
        high: contrastColorsLocal.high
      },
      lightnessNudgers: [...lightnessNudgerValues],
      hueNudgers: [...hueNudgerValues],
      stepSaturationNudgers: [...stepSaturationNudgerValues],
      paletteSaturationNudgers: [...paletteSaturationNudgerValues],
      paletteChromaNudgers: [...paletteChromaNudgerValues],
      currentTheme: currentThemeLocal,
      displayColorSpace: displayColorSpaceLocal,
      gamutSpace: gamutSpaceLocal,
      themePreference: themePreferenceLocal,
      swatchLabels: swatchLabelsLocal,
      showSwatchGamutWarnings: showSwatchGamutWarningsLocal,
      showSwatchContrastIndicators: showSwatchContrastIndicatorsLocal,
      swatchContrastIndicators: structuredClone(swatchContrastIndicatorsLocal),
      contrastAlgorithm: contrastAlgorithmLocal,
      oklchDisplaySignificantDigits: oklchDisplaySignificantDigitsLocal,
      customNeutralName: customNeutralNameLocal,
      customPaletteNames: customPaletteNamesLocal,
      constraints: structuredClone(constraintsLocal),
      solverAdjustmentSnapshot: structuredClone(solverAdjustmentSnapshotLocal),
      constraintSolverSummary: structuredClone(constraintSolverSummaryLocal)
    };
  }

  function applyHistorySnapshot(snapshot: HistorySnapshot): void {
    skipAutoThemeSync = true;
    isApplyingHistorySnapshot = true;
    pendingHistoryGeneratorSnapshot = {
      baseColor: snapshot.baseColor,
      warmth: snapshot.warmth,
      warmthHue: snapshot.warmthHue,
      chromaMultiplier: snapshot.chromaMultiplier,
      numColors: snapshot.numColors,
      numPalettes: snapshot.numPalettes,
      x1: snapshot.x1,
      y1: snapshot.y1,
      x2: snapshot.x2,
      y2: snapshot.y2
    };
    historyRestoreRevision += 1;
    baseColorLocal = snapshot.baseColor;
    warmthLocal = snapshot.warmth;
    warmthHueLocal = snapshot.warmthHue;
    chromaMultiplierLocal = snapshot.chromaMultiplier;
    numColorsLocal = snapshot.numColors;
    numPalettesLocal = snapshot.numPalettes;
    x1Local = snapshot.x1;
    y1Local = snapshot.y1;
    x2Local = snapshot.x2;
    y2Local = snapshot.y2;

    updateColorState({
      baseColor: snapshot.baseColor,
      warmth: snapshot.warmth,
      warmthHue: snapshot.warmthHue,
      chromaMultiplier: snapshot.chromaMultiplier,
      numColors: snapshot.numColors,
      numPalettes: snapshot.numPalettes,
      x1: snapshot.x1,
      y1: snapshot.y1,
      x2: snapshot.x2,
      y2: snapshot.y2,
      contrastMode: snapshot.contrastMode,
      lowStep: snapshot.lowStep,
      highStep: snapshot.highStep,
      lowReference: snapshot.lowReference,
      highReference: snapshot.highReference,
      contrast: snapshot.contrast,
      lightnessNudgers: snapshot.lightnessNudgers,
      hueNudgers: snapshot.hueNudgers,
      stepSaturationNudgers: snapshot.stepSaturationNudgers,
      paletteSaturationNudgers: snapshot.paletteSaturationNudgers,
      paletteChromaNudgers: snapshot.paletteChromaNudgers,
      currentTheme: snapshot.currentTheme,
      displayColorSpace: snapshot.displayColorSpace,
      gamutSpace: snapshot.gamutSpace,
      themePreference: snapshot.themePreference,
      swatchLabels: snapshot.swatchLabels,
      showSwatchGamutWarnings: snapshot.showSwatchGamutWarnings,
      showSwatchContrastIndicators: snapshot.showSwatchContrastIndicators,
      swatchContrastIndicators: snapshot.swatchContrastIndicators,
      contrastAlgorithm: snapshot.contrastAlgorithm,
      oklchDisplaySignificantDigits: snapshot.oklchDisplaySignificantDigits,
      customNeutralName: snapshot.customNeutralName,
      customPaletteNames: snapshot.customPaletteNames,
      constraints: snapshot.constraints,
      solverAdjustmentSnapshot: snapshot.solverAdjustmentSnapshot,
      constraintSolverSummary: snapshot.constraintSolverSummary
    });

    void tick().then(() => {
      isApplyingHistorySnapshot = false;
      skipAutoThemeSync = false;
    });
  }

  function initializeHistory(preferStoreGeneratorState: boolean = false): void {
    historyManager = createHistoryManager(captureHistorySnapshot(preferStoreGeneratorState));
    refreshHistoryView();
  }

  function beginBezierInteraction(): void {
    isDeferringBezierStoreSync = true;
  }

  function handleBezierCommit(): void {
    updateColorState({
      x1: x1Local,
      y1: y1Local,
      x2: x2Local,
      y2: y2Local
    });
    isDeferringBezierStoreSync = false;
    scheduleHistoryCommit('Bezier curve changed');
  }

  function scheduleHistoryCommit(label: string): void {
    if (!historyManager || !urlStateLoaded) {
      return;
    }

    void tick().then(() => {
      if (!historyManager) {
        return;
      }

      const committed = historyManager.commit(captureHistorySnapshot(true), label);
      if (committed) {
        refreshHistoryView();
      }
    });
  }

  function handleResetToDefaults(): void {
    const confirmed = window.confirm(
      'Reset all settings to defaults? This will clear your current palette configuration.'
    );
    if (!confirmed) {
      return;
    }

    resetColorState(currentThemeLocal);
    announce('Settings reset to defaults');
    scheduleHistoryCommit('Reset to defaults');
  }

  function announceHistoryAction(prefix: 'Undid' | 'Redid', label: string, steps: number): void {
    if (steps > 1) {
      announce(`${prefix} ${steps} steps to ${label}`);
      return;
    }

    announce(`${prefix} ${label}`);
  }

  function handleUndo(): void {
    if (!historyManager) {
      return;
    }

    const result = historyManager.undo();
    if (!result) {
      return;
    }

    refreshHistoryView();
    applyHistorySnapshot(result.snapshot);
    announceHistoryAction('Undid', result.entry.displayText, result.steps);
  }

  function handleRedo(): void {
    if (!historyManager) {
      return;
    }

    const result = historyManager.redo();
    if (!result) {
      return;
    }

    refreshHistoryView();
    applyHistorySnapshot(result.snapshot);
    announceHistoryAction('Redid', result.entry.displayText, result.steps);
  }

  function handleHistoryJump(position: number): void {
    if (!historyManager) {
      return;
    }

    const previousPosition = historyView.position;
    const result = historyManager.go(position);
    if (!result) {
      return;
    }

    refreshHistoryView();
    applyHistorySnapshot(result.snapshot);
    announceHistoryAction(
      position < previousPosition ? 'Undid' : 'Redid',
      result.entry.displayText,
      result.steps
    );
  }

  function isEditableHistoryTarget(
    target: EventTarget | null
  ): target is HTMLInputElement | HTMLTextAreaElement {
    if (target instanceof HTMLTextAreaElement) {
      return true;
    }

    if (!(target instanceof HTMLInputElement)) {
      return false;
    }

    return ['text', 'number', 'color', 'search', 'email', 'url', 'tel', 'password'].includes(
      target.type
    );
  }

  function handleDocumentInput(event: Event): void {
    if (event.target === suppressedEditableHistoryTarget) {
      event.stopImmediatePropagation();
      event.stopPropagation();
      scheduleHistoryShortcutResync();
      return;
    }

    if (
      event instanceof InputEvent &&
      historyManager &&
      (event.inputType === 'historyUndo' || event.inputType === 'historyRedo') &&
      (pendingNativeHistoryInput === event.inputType || isEditableHistoryTarget(event.target))
    ) {
      pendingNativeHistoryInput = null;
      event.stopImmediatePropagation();
      event.stopPropagation();
      scheduleHistoryShortcutResync();
      return;
    }

    if (isEditableHistoryTarget(event.target)) {
      cancelHistoryShortcutResync();
      dirtyEditableElements.add(event.target);
    }
  }

  function handleDocumentChange(event: Event): void {
    if (event.target === suppressedEditableHistoryTarget) {
      event.stopImmediatePropagation();
      event.stopPropagation();
      scheduleHistoryShortcutResync();
      clearDirtyEditableTarget(event.target);
      return;
    }

    if (historyManager && pendingNativeHistoryInput && isEditableHistoryTarget(event.target)) {
      pendingNativeHistoryInput = null;
      event.stopImmediatePropagation();
      event.stopPropagation();
      scheduleHistoryShortcutResync();
      clearDirtyEditableTarget(event.target);
      return;
    }

    if (isEditableHistoryTarget(event.target)) {
      cancelHistoryShortcutResync();
    }

    clearDirtyEditableTarget(event.target);
  }

  function handleDocumentFocusOut(event: FocusEvent): void {
    clearDirtyEditableTarget(event.target);
  }

  function handleDocumentPointerDown(event: PointerEvent): void {
    if (!(event.target instanceof Element)) {
      return;
    }

    const historyActionTarget = event.target.closest('[aria-label]');
    if (!historyActionTarget) {
      return;
    }

    const ariaLabel = historyActionTarget.getAttribute('aria-label');
    if (
      ariaLabel === 'Undo last change' ||
      ariaLabel === 'Redo last change' ||
      ariaLabel?.startsWith('Undo to ') ||
      ariaLabel?.startsWith('Redo to ')
    ) {
      suppressEditableHistoryTarget(getActiveEditableHistoryTarget());
    }
  }

  function clearDirtyEditableTarget(target: EventTarget | null): void {
    if (isEditableHistoryTarget(target)) {
      dirtyEditableElements.delete(target);
    }
  }

  function getActiveEditableHistoryTarget(): HTMLInputElement | HTMLTextAreaElement | null {
    return isEditableHistoryTarget(document.activeElement) ? document.activeElement : null;
  }

  function runHistoryShortcut(action: 'undo' | 'redo'): void {
    if (action === 'undo') {
      handleUndo();
      return;
    }

    handleRedo();
  }

  function focusHistoryShortcutTarget(): void {
    appShellEl?.focus({ preventScroll: true });
  }

  function suppressEditableHistoryTarget(
    target: HTMLInputElement | HTMLTextAreaElement | null
  ): void {
    suppressedEditableHistoryTarget = target;
    scheduler.scheduleEditableHistorySuppressionReset(() => {
      suppressedEditableHistoryTarget = null;
    });
  }

  function cancelHistoryShortcutResync(): void {
    historyShortcutResyncRevision += 1;
    scheduler.cancelHistoryResync();
  }

  function scheduleHistoryShortcutResync(): void {
    if (!historyManager) {
      return;
    }

    cancelHistoryShortcutResync();

    const resyncRevision = historyShortcutResyncRevision;

    void tick().then(() => {
      if (resyncRevision !== historyShortcutResyncRevision) {
        return;
      }

      scheduler.scheduleHistoryResync(() => {
        if (!historyManager || resyncRevision !== historyShortcutResyncRevision) {
          return;
        }

        applyHistorySnapshot(historyManager.getCurrentSnapshot());
      });
    });
  }

  function handleHistoryKeydown(event: KeyboardEvent): void {
    const lowerKey = event.key.toLowerCase();
    const modifierPressed = event.metaKey || event.ctrlKey;
    const isUndoShortcut = modifierPressed && !event.shiftKey && lowerKey === 'z';
    const isRedoShortcut =
      modifierPressed &&
      ((event.shiftKey && lowerKey === 'z') || (!event.metaKey && lowerKey === 'y'));

    if ((!isUndoShortcut && !isRedoShortcut) || event.altKey || !historyManager) {
      return;
    }

    const activeEditableTarget = getActiveEditableHistoryTarget();
    if (activeEditableTarget && dirtyEditableElements.has(activeEditableTarget)) {
      return;
    }

    if (activeEditableTarget) {
      pendingNativeHistoryInput = isUndoShortcut ? 'historyUndo' : 'historyRedo';
      suppressEditableHistoryTarget(activeEditableTarget);
      scheduler.schedulePendingNativeHistoryReset(() => {
        if (pendingNativeHistoryInput === (isUndoShortcut ? 'historyUndo' : 'historyRedo')) {
          pendingNativeHistoryInput = null;
        }
      });
      focusHistoryShortcutTarget();
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
      scheduler.scheduleHistoryShortcut(() => {
        runHistoryShortcut(isUndoShortcut ? 'undo' : 'redo');
        scheduleHistoryShortcutResync();
      });
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
    runHistoryShortcut(isUndoShortcut ? 'undo' : 'redo');
  }

  function handleHistoryBeforeInput(event: Event): void {
    if (!(event instanceof InputEvent) || !historyManager) {
      return;
    }

    if (event.inputType !== 'historyUndo' && event.inputType !== 'historyRedo') {
      return;
    }

    if (pendingNativeHistoryInput === event.inputType) {
      pendingNativeHistoryInput = null;
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
      scheduleHistoryShortcutResync();
      return;
    }

    const activeEditableTarget = getActiveEditableHistoryTarget();
    if (activeEditableTarget && dirtyEditableElements.has(activeEditableTarget)) {
      return;
    }

    focusHistoryShortcutTarget();
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
    runHistoryShortcut(event.inputType === 'historyUndo' ? 'undo' : 'redo');
  }

  function freezeLayout() {
    isDraggingSlider = true;
    if (layoutEl) {
      const width = layoutEl.offsetWidth + 'px';
      layoutEl.style.minWidth = width;
      layoutEl.style.maxWidth = width;
    }
    if (topbarInnerEl) {
      const width = topbarInnerEl.offsetWidth + 'px';
      topbarInnerEl.style.minWidth = width;
      topbarInnerEl.style.maxWidth = width;
    }
  }

  function unfreezeLayout() {
    isDraggingSlider = false;
    if (layoutEl) {
      layoutEl.style.minWidth = '';
      layoutEl.style.maxWidth = '';
    }
    if (topbarInnerEl) {
      topbarInnerEl.style.minWidth = '';
      topbarInnerEl.style.maxWidth = '';
    }
  }

  // Load initial state from URL or localStorage
  onMount(() => {
    const controlsLayoutMql = window.matchMedia(COMPACT_LAYOUT_MEDIA_QUERY);
    const syncCompactLayout = (e: MediaQueryList | MediaQueryListEvent): void => {
      isCompactLayout = e.matches;
    };
    syncCompactLayout(controlsLayoutMql);

    const storedUiPreferences = loadUiPreferencesFromStorage();
    if (storedUiPreferences) {
      applyStoredUiPreferences(storedUiPreferences);
    }
    uiPreferencesLoaded = true;

    const urlState = getUrlState();
    const storedState = loadStateFromStorage();

    if (Object.keys(urlState).length > 0) {
      applyUrlState(urlState);
    } else if (storedState) {
      applyUrlState(storedState);
    }

    // Only load themePreference from localStorage if not already set by URL
    if (!urlState.themePreference && storedState?.themePreference) {
      setThemePreference(storedState.themePreference);
    }

    // Set up matchMedia listener for auto theme preference
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if ($themePreference === 'auto') {
        const resolvedTheme = e.matches ? 'dark' : 'light';
        if ($currentTheme !== resolvedTheme) {
          setTheme(resolvedTheme);
        }
      }
    };
    // Apply initial auto theme if preference is auto
    if ($themePreference === 'auto') {
      handleMediaChange(mql);
    }
    mql.addEventListener('change', handleMediaChange);
    controlsLayoutMql.addEventListener('change', syncCompactLayout);
    document.addEventListener('input', handleDocumentInput, true);
    document.addEventListener('beforeinput', handleHistoryBeforeInput, true);
    document.addEventListener('change', handleDocumentChange, true);
    document.addEventListener('focusout', handleDocumentFocusOut, true);
    document.addEventListener('pointerdown', handleDocumentPointerDown, true);
    document.addEventListener('keydown', handleHistoryKeydown, true);

    urlStateLoaded = true;
    initializeHistory(true);

    return () => {
      scheduler.destroy();
      mql.removeEventListener('change', handleMediaChange);
      controlsLayoutMql.removeEventListener('change', syncCompactLayout);
      document.removeEventListener('input', handleDocumentInput, true);
      document.removeEventListener('beforeinput', handleHistoryBeforeInput, true);
      document.removeEventListener('change', handleDocumentChange, true);
      document.removeEventListener('focusout', handleDocumentFocusOut, true);
      document.removeEventListener('pointerdown', handleDocumentPointerDown, true);
      document.removeEventListener('keydown', handleHistoryKeydown, true);
    };
  });

  // React to themePreference changes to apply auto theme
  $effect(() => {
    if (!skipAutoThemeSync && themePreferenceLocal === 'auto' && typeof window !== 'undefined') {
      const resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

      if (currentThemeLocal !== resolvedTheme) {
        setTheme(resolvedTheme);
      }
    }
  });

  // Sync local bindable state to stores when they change
  $effect(() => {
    if (isApplyingHistorySnapshot) {
      return;
    }

    if (pendingHistoryGeneratorSnapshot) {
      const storeMatchesPendingSnapshot =
        $baseColor === pendingHistoryGeneratorSnapshot.baseColor &&
        $warmth === pendingHistoryGeneratorSnapshot.warmth &&
        $warmthHue === pendingHistoryGeneratorSnapshot.warmthHue &&
        $chromaMultiplier === pendingHistoryGeneratorSnapshot.chromaMultiplier &&
        $numColors === pendingHistoryGeneratorSnapshot.numColors &&
        $numPalettes === pendingHistoryGeneratorSnapshot.numPalettes &&
        $x1 === pendingHistoryGeneratorSnapshot.x1 &&
        $y1 === pendingHistoryGeneratorSnapshot.y1 &&
        $x2 === pendingHistoryGeneratorSnapshot.x2 &&
        $y2 === pendingHistoryGeneratorSnapshot.y2;

      if (!storeMatchesPendingSnapshot) {
        return;
      }

      pendingHistoryGeneratorSnapshot = null;
    }

    const storeBaseColor = $baseColor;
    const storeWarmth = $warmth;
    const storeWarmthHue = $warmthHue;
    const storeChroma = $chromaMultiplier;
    const storeNumColors = $numColors;
    const storeNumPalettes = $numPalettes;
    const storeX1 = $x1;
    const storeY1 = $y1;
    const storeX2 = $x2;
    const storeY2 = $y2;

    baseColorLocal = storeBaseColor;
    warmthLocal = storeWarmth;
    warmthHueLocal = storeWarmthHue;
    chromaMultiplierLocal = storeChroma;
    numColorsLocal = storeNumColors;
    numPalettesLocal = storeNumPalettes;
    x1Local = storeX1;
    y1Local = storeY1;
    x2Local = storeX2;
    y2Local = storeY2;
  });

  // Keep generator settings in the shared store so history, persistence,
  // and derived UI state read from the same source of truth.
  $effect(() => {
    if (
      isApplyingHistorySnapshot ||
      pendingHistoryGeneratorSnapshot ||
      isDeferringBezierStoreSync
    ) {
      return;
    }

    const generatorStateChanged =
      baseColorLocal !== $baseColor ||
      warmthLocal !== $warmth ||
      warmthHueLocal !== $warmthHue ||
      chromaMultiplierLocal !== $chromaMultiplier ||
      numColorsLocal !== $numColors ||
      numPalettesLocal !== $numPalettes ||
      x1Local !== $x1 ||
      y1Local !== $y1 ||
      x2Local !== $x2 ||
      y2Local !== $y2;

    if (!generatorStateChanged) {
      return;
    }

    updateColorState({
      baseColor: baseColorLocal,
      warmth: warmthLocal,
      warmthHue: warmthHueLocal,
      chromaMultiplier: chromaMultiplierLocal,
      numColors: numColorsLocal,
      numPalettes: numPalettesLocal,
      x1: x1Local,
      y1: y1Local,
      x2: x2Local,
      y2: y2Local
    });
  });

  // Keep saturation within the valid bounds for the active gamut.
  $effect(() => {
    const clampedChroma = clampChromaMultiplier(chromaMultiplierLocal, gamutSpaceLocal);
    if (clampedChroma !== chromaMultiplierLocal) {
      chromaMultiplierLocal = clampedChroma;
    }
  });

  // Generate colors when parameters change (debounced to prevent race conditions)
  $effect(() => {
    // Access all parameters directly to establish reactive dependencies
    const _numColors = numColorsLocal;
    const _numPalettes = numPalettesLocal;
    const _baseColor = baseColorLocal;
    const _warmth = warmthLocal;
    const _warmthHue = warmthHueLocal;
    const _chroma = chromaMultiplierLocal;
    const _x1 = x1Local;
    const _y1 = y1Local;
    const _x2 = x2Local;
    const _y2 = y2Local;
    const _theme = currentThemeLocal;
    const _lightnessNudgers = lightnessNudgerValues;
    const _hueNudgers = hueNudgerValues;
    const _stepSaturationNudgers = stepSaturationNudgerValues;
    const _paletteSaturationNudgers = paletteSaturationNudgerValues;
    const _paletteChromaNudgers = paletteChromaNudgerValues;
    const _gamutSpace = gamutSpaceLocal;
    const _isDragging = isDraggingSlider;
    void _numColors;
    void _numPalettes;
    void _baseColor;
    void _warmth;
    void _warmthHue;
    void _chroma;
    void _x1;
    void _y1;
    void _x2;
    void _y2;
    void _theme;
    void _lightnessNudgers;
    void _hueNudgers;
    void _stepSaturationNudgers;
    void _paletteSaturationNudgers;
    void _paletteChromaNudgers;
    void _gamutSpace;

    // Skip generation while dragging to prevent layout reflow
    if (_isDragging || !urlStateLoaded) return;

    scheduler.scheduleColorGeneration(() => {
      generateColors();
    });
  });

  // Update URL and localStorage when state changes (debounced)
  $effect(() => {
    if (!urlStateLoaded) return;

    // themePreference is included in URL state when not auto (for shareable URLs)
    const state: UrlColorState = {
      baseColor: baseColorLocal,
      warmth: warmthLocal,
      warmthHue: warmthHueLocal,
      chromaMultiplier: chromaMultiplierLocal,
      numColors: numColorsLocal,
      numPalettes: numPalettesLocal,
      x1: x1Local,
      y1: y1Local,
      x2: x2Local,
      y2: y2Local,
      contrastMode: contrastModeLocal,
      lowStep: lowStepLocal,
      highStep: highStepLocal,
      lowReference: lowReferenceLocal,
      highReference: highReferenceLocal,
      lightnessNudgers: lightnessNudgerValues,
      hueNudgers: hueNudgerValues,
      stepSaturationNudgers: stepSaturationNudgerValues,
      paletteSaturationNudgers: paletteSaturationNudgerValues,
      paletteChromaNudgers: paletteChromaNudgerValues,
      displayColorSpace: displayColorSpaceLocal,
      gamutSpace: gamutSpaceLocal,
      swatchLabels: swatchLabelsLocal,
      showSwatchGamutWarnings: showSwatchGamutWarningsLocal,
      showSwatchContrastIndicators: showSwatchContrastIndicatorsLocal,
      swatchContrastIndicators: swatchContrastIndicatorsLocal,
      contrastAlgorithm: contrastAlgorithmLocal,
      oklchDisplaySignificantDigits: oklchDisplaySignificantDigitsLocal,
      themePreference: themePreferenceLocal,
      customNeutralName: customNeutralNameLocal,
      customPaletteNames: customPaletteNamesLocal,
      constraints: constraintsLocal,
      solverAdjustmentSnapshot: solverAdjustmentSnapshotLocal,
      constraintSolverSummary: constraintSolverSummaryLocal
    };

    // theme (resolved theme) is persisted to localStorage only, not the URL
    const storageState: UrlColorState = {
      ...state,
      theme: currentThemeLocal
    };

    scheduler.schedulePersistence(() => {
      updateBrowserUrl(state);
      saveStateToStorage(storageState);
    });
  });

  $effect(() => {
    if (!uiPreferencesLoaded) {
      return;
    }

    saveUiPreferencesToStorage(getUiPreferencesSnapshot());
  });

  function applyUrlState(urlState: UrlColorState) {
    const stateUpdate: Record<string, unknown> = {};

    // Apply theme preference if present (sets the user's preference, not resolved theme)
    if (urlState.themePreference) {
      setThemePreference(urlState.themePreference);
    }

    // Apply all other state values
    if (urlState.baseColor) {
      stateUpdate.baseColor = urlState.baseColor;
    }
    if (urlState.warmth !== undefined) stateUpdate.warmth = urlState.warmth;
    if (urlState.warmthHue !== undefined) stateUpdate.warmthHue = urlState.warmthHue;
    if (urlState.chromaMultiplier !== undefined)
      stateUpdate.chromaMultiplier = urlState.chromaMultiplier;
    if (urlState.numColors !== undefined) stateUpdate.numColors = urlState.numColors;
    if (urlState.numPalettes !== undefined) stateUpdate.numPalettes = urlState.numPalettes;
    if (urlState.x1 !== undefined) stateUpdate.x1 = urlState.x1;
    if (urlState.y1 !== undefined) stateUpdate.y1 = urlState.y1;
    if (urlState.x2 !== undefined) stateUpdate.x2 = urlState.x2;
    if (urlState.y2 !== undefined) stateUpdate.y2 = urlState.y2;
    if (urlState.contrastMode) stateUpdate.contrastMode = urlState.contrastMode;
    if (urlState.lowStep !== undefined) stateUpdate.lowStep = urlState.lowStep;
    if (urlState.highStep !== undefined) stateUpdate.highStep = urlState.highStep;
    if (urlState.lowReference !== undefined) stateUpdate.lowReference = urlState.lowReference;
    if (urlState.highReference !== undefined) stateUpdate.highReference = urlState.highReference;
    if (urlState.lightnessNudgers) stateUpdate.lightnessNudgers = urlState.lightnessNudgers;
    if (urlState.hueNudgers) stateUpdate.hueNudgers = urlState.hueNudgers;
    if (urlState.stepSaturationNudgers) {
      stateUpdate.stepSaturationNudgers = urlState.stepSaturationNudgers;
    }
    if (urlState.paletteSaturationNudgers) {
      stateUpdate.paletteSaturationNudgers = urlState.paletteSaturationNudgers;
    }
    if (urlState.paletteChromaNudgers) {
      stateUpdate.paletteChromaNudgers = urlState.paletteChromaNudgers;
    }
    if (urlState.displayColorSpace) stateUpdate.displayColorSpace = urlState.displayColorSpace;
    if (urlState.gamutSpace) stateUpdate.gamutSpace = urlState.gamutSpace;
    if (urlState.swatchLabels) stateUpdate.swatchLabels = urlState.swatchLabels;
    if (urlState.showSwatchGamutWarnings !== undefined) {
      stateUpdate.showSwatchGamutWarnings = urlState.showSwatchGamutWarnings;
    }
    if (urlState.swatchContrastIndicators) {
      stateUpdate.swatchContrastIndicators = urlState.swatchContrastIndicators;
      stateUpdate.showSwatchContrastIndicators = Object.values(
        urlState.swatchContrastIndicators
      ).some(Boolean);
    } else if (urlState.showSwatchContrastIndicators !== undefined) {
      stateUpdate.showSwatchContrastIndicators = urlState.showSwatchContrastIndicators;
      stateUpdate.swatchContrastIndicators = {
        wcagThreeToOne: urlState.showSwatchContrastIndicators,
        wcagAA: urlState.showSwatchContrastIndicators,
        wcagAAA: urlState.showSwatchContrastIndicators,
        apcaLarge: urlState.showSwatchContrastIndicators,
        apcaFluent: urlState.showSwatchContrastIndicators,
        apcaBody: urlState.showSwatchContrastIndicators
      };
    }
    if (urlState.contrastAlgorithm) stateUpdate.contrastAlgorithm = urlState.contrastAlgorithm;
    if (urlState.oklchDisplaySignificantDigits !== undefined) {
      stateUpdate.oklchDisplaySignificantDigits = urlState.oklchDisplaySignificantDigits;
    }
    if (urlState.customNeutralName !== undefined) {
      stateUpdate.customNeutralName = urlState.customNeutralName;
    }
    if (urlState.customPaletteNames !== undefined) {
      stateUpdate.customPaletteNames = urlState.customPaletteNames;
    }
    if (urlState.constraints !== undefined) {
      stateUpdate.constraints = urlState.constraints;
    }
    if (urlState.solverAdjustmentSnapshot !== undefined) {
      stateUpdate.solverAdjustmentSnapshot = urlState.solverAdjustmentSnapshot;
    }
    if (urlState.constraintSolverSummary !== undefined) {
      stateUpdate.constraintSolverSummary = urlState.constraintSolverSummary;
    }

    // Apply stored values after theme preference to ensure they override any defaults
    if (Object.keys(stateUpdate).length > 0) {
      updateColorState(stateUpdate);
    }
  }

  function generateColors() {
    const params: ColorGenParams = {
      numColors: numColorsLocal,
      numPalettes: numPalettesLocal,
      baseColor: baseColorLocal,
      warmth: warmthLocal,
      x1: x1Local,
      y1: y1Local,
      x2: x2Local,
      y2: y2Local,
      chromaMultiplier: chromaMultiplierLocal,
      currentTheme: currentThemeLocal,
      lightnessNudgers: lightnessNudgerValues,
      hueNudgers: hueNudgerValues,
      stepSaturationNudgers: stepSaturationNudgerValues,
      paletteSaturationNudgers: paletteSaturationNudgerValues,
      paletteChromaNudgers: paletteChromaNudgerValues,
      gamutSpace: gamutSpaceLocal
    };

    try {
      const result = generatePalettes(params);
      // Atomic update to prevent race conditions
      updateColorState({
        neutrals: result.neutrals,
        palettes: result.palettes
      });
      // Update contrast after neutrals are set
      updateContrastFromNeutrals();
    } catch (error) {
      console.error('Error generating colors:', error);
      announce('Error generating colors. Please check your color settings and try again.');
      updateColorState({
        neutrals: [],
        palettes: []
      });
    }
  }
</script>

<a href="#main-content" class="skip-link">Skip to main content</a>
<div
  class="app-shell"
  bind:this={appShellEl}
  tabindex="-1"
  role="application"
  aria-label="Chroma11y"
  style="--num-colors: {numColorsLocal};"
>
  <AppHeader
    bind:bindInner={topbarInnerEl}
    canUndo={historyView.canUndo}
    canRedo={historyView.canRedo}
    undoEntries={historyView.undoEntries}
    redoEntries={historyView.redoEntries}
    onUndo={handleUndo}
    onRedo={handleRedo}
    onReset={handleResetToDefaults}
    onUndoJump={handleHistoryJump}
    onRedoJump={handleHistoryJump}
  />

  <div class="layout-container">
    <div class="layout" data-testid="app-layout" bind:this={layoutEl}>
      <Sidebar>
        {#if isCompactLayout}
          <Card
            title="Generation"
            subtitle="Core palette controls"
            summary={generationCardSummary}
            collapsible
            open={compactSections.generation}
            onToggle={(open) => updateCompactSection('generation', open)}
            data-testid="generation-controls-card"
          >
            {#key `generation-${historyRestoreRevision}`}
              <ColorControls
                bind:baseColor={baseColorLocal}
                bind:warmth={warmthLocal}
                bind:warmthHue={warmthHueLocal}
                bind:chromaMultiplier={chromaMultiplierLocal}
                gamutSpace={gamutSpaceLocal}
                bind:numColors={numColorsLocal}
                bind:numPalettes={numPalettesLocal}
                bind:x1={x1Local}
                bind:y1={y1Local}
                bind:x2={x2Local}
                bind:y2={y2Local}
                advancedOpen={generationAdvancedOpen}
                onAdvancedToggle={(open) => (generationAdvancedOpen = open)}
                onRangeDragStart={freezeLayout}
                onRangeDragEnd={unfreezeLayout}
                onBaseColorCommit={() => scheduleHistoryCommit('Base color changed')}
                onWarmthCommit={() => scheduleHistoryCommit('Warmth changed')}
                onWarmthHueCommit={() => scheduleHistoryCommit('Warmth hue changed')}
                onSaturationCommit={() => scheduleHistoryCommit('Saturation changed')}
                onNumColorsCommit={() => scheduleHistoryCommit('Number of colors changed')}
                onNumPalettesCommit={() => scheduleHistoryCommit('Number of palettes changed')}
                onBezierInteractionStart={beginBezierInteraction}
                onBezierCommit={handleBezierCommit}
              />
            {/key}
          </Card>

          <Card
            title="Constraints"
            subtitle="Goals for the palette"
            summary={constraintsCardSummary}
            collapsible
            open={compactSections.constraints}
            onToggle={(open) => updateCompactSection('constraints', open)}
            data-testid="constraints-controls-card"
          >
            {#if compactSections.constraints}
              {#key `constraints-${historyRestoreRevision}`}
                <ConstraintsControls onHistoryCommit={scheduleHistoryCommit} />
              {/key}
            {/if}
          </Card>

          <Card
            title="Contrast"
            subtitle="Contrast and indicators"
            summary={contrastCardSummary}
            collapsible
            open={compactSections.contrast}
            onToggle={(open) => updateCompactSection('contrast', open)}
            data-testid="contrast-controls-card"
          >
            {#key `contrast-${historyRestoreRevision}`}
              <ContrastControls onHistoryCommit={scheduleHistoryCommit} />
            {/key}
          </Card>

          <Card
            title="Output"
            subtitle="Formats and labels"
            summary={outputCardSummary}
            collapsible
            open={compactSections.output}
            onToggle={(open) => updateCompactSection('output', open)}
            data-testid="output-controls-card"
          >
            {#key `output-${historyRestoreRevision}`}
              <DisplaySettings
                advancedOpen={outputAdvancedOpen}
                onAdvancedToggle={(open) => (outputAdvancedOpen = open)}
                onHistoryCommit={scheduleHistoryCommit}
              />
            {/key}
          </Card>

          <Card
            title="Export"
            subtitle="Share or export"
            summary={exportCardSummary}
            collapsible
            open={compactSections.export}
            onToggle={(open) => updateCompactSection('export', open)}
            data-testid="export-controls-card"
          >
            <ExportButtons
              neutrals={neutralsHexLocal}
              palettes={palettesHexLocal}
              lowContrastColor={contrastColorsLocal.low}
              displayNeutrals={neutralsSwatchDisplayLocal}
              displayPalettes={palettesSwatchDisplayLocal}
              customNeutralName={customNeutralNameLocal}
              customPaletteNames={customPaletteNamesLocal}
            />
          </Card>
        {:else}
          <Card
            title="Generation"
            subtitle="Core palette controls"
            data-testid="generation-controls-card"
          >
            {#key `generation-${historyRestoreRevision}`}
              <ColorControls
                bind:baseColor={baseColorLocal}
                bind:warmth={warmthLocal}
                bind:warmthHue={warmthHueLocal}
                bind:chromaMultiplier={chromaMultiplierLocal}
                gamutSpace={gamutSpaceLocal}
                bind:numColors={numColorsLocal}
                bind:numPalettes={numPalettesLocal}
                bind:x1={x1Local}
                bind:y1={y1Local}
                bind:x2={x2Local}
                bind:y2={y2Local}
                advancedOpen={generationAdvancedOpen}
                onAdvancedToggle={(open) => (generationAdvancedOpen = open)}
                onRangeDragStart={freezeLayout}
                onRangeDragEnd={unfreezeLayout}
                onBaseColorCommit={() => scheduleHistoryCommit('Base color changed')}
                onWarmthCommit={() => scheduleHistoryCommit('Warmth changed')}
                onWarmthHueCommit={() => scheduleHistoryCommit('Warmth hue changed')}
                onSaturationCommit={() => scheduleHistoryCommit('Saturation changed')}
                onNumColorsCommit={() => scheduleHistoryCommit('Number of colors changed')}
                onNumPalettesCommit={() => scheduleHistoryCommit('Number of palettes changed')}
                onBezierInteractionStart={beginBezierInteraction}
                onBezierCommit={handleBezierCommit}
              />
            {/key}
          </Card>

          <Card
            title="Constraints"
            subtitle="Goals for the palette"
            data-testid="constraints-controls-card"
          >
            {#key `constraints-${historyRestoreRevision}`}
              <ConstraintsControls onHistoryCommit={scheduleHistoryCommit} />
            {/key}
          </Card>

          <Card
            title="Contrast"
            subtitle="Contrast and indicators"
            data-testid="contrast-controls-card"
          >
            {#key `contrast-${historyRestoreRevision}`}
              <ContrastControls onHistoryCommit={scheduleHistoryCommit} />
            {/key}
          </Card>

          <Card title="Output" subtitle="Formats and labels" data-testid="output-controls-card">
            {#key `output-${historyRestoreRevision}`}
              <DisplaySettings
                advancedOpen={outputAdvancedOpen}
                onAdvancedToggle={(open) => (outputAdvancedOpen = open)}
                onHistoryCommit={scheduleHistoryCommit}
              />
            {/key}
          </Card>

          <Card title="Export" subtitle="Share or export" data-testid="export-controls-card">
            <ExportButtons
              neutrals={neutralsHexLocal}
              palettes={palettesHexLocal}
              lowContrastColor={contrastColorsLocal.low}
              displayNeutrals={neutralsSwatchDisplayLocal}
              displayPalettes={palettesSwatchDisplayLocal}
              customNeutralName={customNeutralNameLocal}
              customPaletteNames={customPaletteNamesLocal}
            />
          </Card>
        {/if}
      </Sidebar>

      <main
        class="content"
        id="main-content"
        aria-labelledby="main-heading"
        data-testid="app-content"
      >
        <div class="content-inner">
          {#key `neutral-palette-${historyRestoreRevision}`}
            <NeutralPalette
              neutrals={neutralsLocal}
              neutralsHex={neutralsHexLocal}
              neutralsDisplay={neutralsSwatchDisplayLocal}
              {lightnessNudgerValues}
              onHistoryCommit={scheduleHistoryCommit}
            />
          {/key}
          {#key `palette-grid-${historyRestoreRevision}`}
            <PaletteGrid
              palettes={palettesLocal}
              palettesHex={palettesHexLocal}
              palettesDisplay={palettesSwatchDisplayLocal}
              {hueNudgerValues}
              onHistoryCommit={scheduleHistoryCommit}
            />
          {/key}
        </div>
      </main>
    </div>
  </div>
</div>

<ColorInfoDrawer />

<style>
  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg-primary);
  }

  .layout-container {
    flex: 1;
    container-type: inline-size;
  }

  .layout {
    max-width: min(92vw, 2400px);
    margin: 0 auto;
    width: 100%;
    display: grid;
    grid-template-columns: clamp(320px, 25vw, 440px) 1fr;
    gap: var(--space-lg);
    padding: var(--space-lg) var(--column-padding) var(--space-xl) var(--column-padding);
    min-height: 0;
  }

  .content {
    min-height: 0;
  }

  .content-inner {
    display: grid;
    gap: var(--space-lg);
    min-height: 0;
  }

  @container (max-width: 980px) {
    .layout {
      grid-template-columns: 1fr;
      padding: var(--space-lg) var(--space-sm) var(--space-xl) var(--space-sm);
      max-width: none;
    }
  }
</style>
