export interface PageScheduler {
  scheduleColorGeneration(task: () => void): void;
  schedulePersistence(task: () => void): void;
  scheduleEditableHistorySuppressionReset(task: () => void): void;
  schedulePendingNativeHistoryReset(task: () => void): void;
  scheduleHistoryShortcut(task: () => void): void;
  scheduleHistoryResync(task: () => void): void;
  cancelHistoryResync(): void;
  destroy(): void;
}

interface TimeoutHost {
  clearTimeout(handle: ReturnType<typeof setTimeout>): void;
  setTimeout(task: () => void, delay: number): ReturnType<typeof setTimeout>;
}

interface SchedulerTimeouts {
  colorGenerationDebounceMs: number;
  persistenceDebounceMs: number;
  editableHistorySuppressionMs: number;
  pendingNativeHistoryResetMs: number;
  historyShortcutMs: number;
  historyResyncPassDelayMs: number;
  historyResyncPasses: number;
}

const DEFAULT_TIMEOUTS: SchedulerTimeouts = {
  colorGenerationDebounceMs: 16,
  persistenceDebounceMs: 500,
  editableHistorySuppressionMs: 250,
  pendingNativeHistoryResetMs: 200,
  historyShortcutMs: 0,
  historyResyncPassDelayMs: 120,
  historyResyncPasses: 5
};

/**
 * Creates the page-level scheduler used by the route component.
 * It centralizes debounce/cancellation behavior so tests can swap in a
 * deterministic implementation without coupling to raw timeout values.
 */
export function createPageScheduler(
  host: TimeoutHost = globalThis,
  timeouts: SchedulerTimeouts = DEFAULT_TIMEOUTS
): PageScheduler {
  let colorGenerationHandle: ReturnType<typeof setTimeout> | null = null;
  let persistenceHandle: ReturnType<typeof setTimeout> | null = null;
  let editableHistorySuppressionHandle: ReturnType<typeof setTimeout> | null = null;
  let pendingNativeHistoryResetHandle: ReturnType<typeof setTimeout> | null = null;
  let historyShortcutHandle: ReturnType<typeof setTimeout> | null = null;
  let historyResyncHandle: ReturnType<typeof setTimeout> | null = null;

  function clearHandle(handle: ReturnType<typeof setTimeout> | null): null {
    if (handle !== null) {
      host.clearTimeout(handle);
    }

    return null;
  }

  function scheduleDebouncedTask(
    currentHandle: ReturnType<typeof setTimeout> | null,
    delay: number,
    task: () => void,
    onHandleChange: (handle: ReturnType<typeof setTimeout> | null) => void
  ): void {
    onHandleChange(clearHandle(currentHandle));
    onHandleChange(
      host.setTimeout(() => {
        onHandleChange(null);
        task();
      }, delay)
    );
  }

  function cancelHistoryResync(): void {
    historyResyncHandle = clearHandle(historyResyncHandle);
  }

  return {
    scheduleColorGeneration(task: () => void): void {
      scheduleDebouncedTask(
        colorGenerationHandle,
        timeouts.colorGenerationDebounceMs,
        task,
        (handle) => {
          colorGenerationHandle = handle;
        }
      );
    },

    schedulePersistence(task: () => void): void {
      scheduleDebouncedTask(persistenceHandle, timeouts.persistenceDebounceMs, task, (handle) => {
        persistenceHandle = handle;
      });
    },

    scheduleEditableHistorySuppressionReset(task: () => void): void {
      scheduleDebouncedTask(
        editableHistorySuppressionHandle,
        timeouts.editableHistorySuppressionMs,
        task,
        (handle) => {
          editableHistorySuppressionHandle = handle;
        }
      );
    },

    schedulePendingNativeHistoryReset(task: () => void): void {
      scheduleDebouncedTask(
        pendingNativeHistoryResetHandle,
        timeouts.pendingNativeHistoryResetMs,
        task,
        (handle) => {
          pendingNativeHistoryResetHandle = handle;
        }
      );
    },

    scheduleHistoryShortcut(task: () => void): void {
      scheduleDebouncedTask(historyShortcutHandle, timeouts.historyShortcutMs, task, (handle) => {
        historyShortcutHandle = handle;
      });
    },

    scheduleHistoryResync(task: () => void): void {
      cancelHistoryResync();

      let remainingPasses = timeouts.historyResyncPasses;
      const runResync = () => {
        task();
        remainingPasses -= 1;

        if (remainingPasses === 0) {
          historyResyncHandle = null;
          return;
        }

        historyResyncHandle = host.setTimeout(runResync, timeouts.historyResyncPassDelayMs);
      };

      runResync();
    },

    cancelHistoryResync,

    destroy(): void {
      colorGenerationHandle = clearHandle(colorGenerationHandle);
      persistenceHandle = clearHandle(persistenceHandle);
      editableHistorySuppressionHandle = clearHandle(editableHistorySuppressionHandle);
      pendingNativeHistoryResetHandle = clearHandle(pendingNativeHistoryResetHandle);
      historyShortcutHandle = clearHandle(historyShortcutHandle);
      cancelHistoryResync();
    }
  };
}
