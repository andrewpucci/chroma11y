/**
 * Reference History Manager
 *
 * Extends the history system to track both palette configuration and reference workspace state.
 * Ensures that undo/redo restores both sides coherently.
 */

import { createTravels } from 'travels';
import type { HistorySnapshot } from './history';
import type { ReferenceWorkspaceSnapshot } from './referenceWorkspace';

const INITIAL_HISTORY_LABEL = 'Starting state';
const MAX_HISTORY = 100;

/**
 * Combined snapshot that includes both palette and reference workspace state.
 * This is what gets stored in the history stack.
 */
export interface ReferenceHistorySnapshot {
  palette: HistorySnapshot;
  reference: ReferenceWorkspaceSnapshot;
}

export interface HistoryEntryMeta {
  label: string;
  timestamp: number;
  position: number;
  displayText: string;
}

export interface HistoryMenuEntry extends HistoryEntryMeta {
  ariaLabel: string;
}

export interface HistoryStepResult {
  snapshot: ReferenceHistorySnapshot;
  entry: HistoryEntryMeta;
  steps: number;
}

export interface HistoryViewModel {
  canUndo: boolean;
  canRedo: boolean;
  position: number;
  undoEntries: HistoryMenuEntry[];
  redoEntries: HistoryMenuEntry[];
}

function cloneSnapshot(snapshot: ReferenceHistorySnapshot): ReferenceHistorySnapshot {
  return structuredClone(snapshot);
}

function overwriteSnapshot(
  target: ReferenceHistorySnapshot,
  snapshot: ReferenceHistorySnapshot
): void {
  Object.assign(target, cloneSnapshot(snapshot));
}

function snapshotsEqual(left: ReferenceHistorySnapshot, right: ReferenceHistorySnapshot): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function createEntry(
  label: string,
  position: number,
  timestamp: number = Date.now()
): HistoryEntryMeta {
  return {
    label,
    timestamp,
    position,
    displayText: label
  };
}

function withPositions(entries: HistoryEntryMeta[]): HistoryEntryMeta[] {
  return entries.map((entry, index) => ({
    ...entry,
    position: index
  }));
}

/**
 * Wraps Travels with combined palette and reference workspace history.
 * Extends the original history manager to track both palette and reference state.
 */
export function createReferenceHistoryManager(initialSnapshot: ReferenceHistorySnapshot) {
  const travels = createTravels<ReferenceHistorySnapshot>(cloneSnapshot(initialSnapshot), {
    maxHistory: MAX_HISTORY
  });

  let metadata: HistoryEntryMeta[] = [createEntry(INITIAL_HISTORY_LABEL, 0)];

  function getPosition(): number {
    return travels.getPosition();
  }

  function getMetadata(): HistoryEntryMeta[] {
    return metadata;
  }

  function toMenuEntries(entries: HistoryEntryMeta[], verb: 'Undo' | 'Redo'): HistoryMenuEntry[] {
    return entries.map((entry) => ({
      ...entry,
      ariaLabel: `${verb} to ${entry.displayText}`
    }));
  }

  function getUndoEntries(): HistoryMenuEntry[] {
    const currentPosition = getPosition();
    return toMenuEntries(metadata.slice(0, currentPosition).reverse(), 'Undo');
  }

  function getRedoEntries(): HistoryMenuEntry[] {
    const currentPosition = getPosition();
    return toMenuEntries(metadata.slice(currentPosition + 1), 'Redo');
  }

  function getViewModel(): HistoryViewModel {
    const controls = travels.getControls();

    return {
      canUndo: controls.canBack(),
      canRedo: controls.canForward(),
      position: controls.position,
      undoEntries: getUndoEntries(),
      redoEntries: getRedoEntries()
    };
  }

  function commit(snapshot: ReferenceHistorySnapshot, label: string): boolean {
    if (snapshotsEqual(travels.getState(), snapshot)) {
      return false;
    }

    const previousPosition = getPosition();
    const nextMetadataBase =
      previousPosition < metadata.length - 1
        ? metadata.slice(0, previousPosition + 1)
        : metadata.slice();

    travels.setState((draft) => {
      overwriteSnapshot(draft, snapshot);
    });

    const nextPosition = getPosition();
    const historyLength = travels.getHistory().length;
    const nextMetadata = [...nextMetadataBase, createEntry(label, nextPosition)];
    metadata =
      nextMetadata.length > historyLength
        ? withPositions(nextMetadata.slice(nextMetadata.length - historyLength))
        : withPositions(nextMetadata);

    return true;
  }

  function undo(): HistoryStepResult | null {
    const currentPosition = getPosition();
    if (currentPosition === 0) {
      return null;
    }

    const entry = metadata[currentPosition];
    travels.back();

    return {
      snapshot: cloneSnapshot(travels.getState()),
      entry,
      steps: 1
    };
  }

  function redo(): HistoryStepResult | null {
    const currentPosition = getPosition();
    if (currentPosition >= metadata.length - 1) {
      return null;
    }

    travels.forward();
    const entry = metadata[travels.getPosition()];

    return {
      snapshot: cloneSnapshot(travels.getState()),
      entry,
      steps: 1
    };
  }

  function go(position: number): HistoryStepResult | null {
    const currentPosition = getPosition();
    if (position < 0 || position >= metadata.length || position === currentPosition) {
      return null;
    }

    travels.go(position);

    return {
      snapshot: cloneSnapshot(travels.getState()),
      entry: metadata[position],
      steps: Math.abs(position - currentPosition)
    };
  }

  return {
    commit,
    getCurrentSnapshot: () => cloneSnapshot(travels.getState()),
    getMetadata,
    getViewModel,
    go,
    redo,
    undo
  };
}
