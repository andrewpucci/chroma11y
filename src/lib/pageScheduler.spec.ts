import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createPageScheduler } from './pageScheduler';

describe('pageScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces color generation and persistence work independently', async () => {
    const scheduler = createPageScheduler(globalThis);
    const calls: string[] = [];

    scheduler.scheduleColorGeneration(() => {
      calls.push('color:first');
    });
    scheduler.scheduleColorGeneration(() => {
      calls.push('color:latest');
    });
    scheduler.schedulePersistence(() => {
      calls.push('persist:first');
    });
    scheduler.schedulePersistence(() => {
      calls.push('persist:latest');
    });

    await vi.advanceTimersByTimeAsync(15);
    expect(calls).toEqual([]);

    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toEqual(['color:latest']);

    await vi.advanceTimersByTimeAsync(484);
    expect(calls).toEqual(['color:latest', 'persist:latest']);
  });

  it('replays history resync work across the configured number of passes', async () => {
    const scheduler = createPageScheduler(globalThis);
    let resyncCount = 0;

    scheduler.scheduleHistoryResync(() => {
      resyncCount += 1;
    });

    expect(resyncCount).toBe(1);

    await vi.advanceTimersByTimeAsync(120 * 4);
    expect(resyncCount).toBe(5);

    await vi.advanceTimersByTimeAsync(120);
    expect(resyncCount).toBe(5);
  });

  it('cancels pending history resync passes and destroys queued work', async () => {
    const scheduler = createPageScheduler(globalThis);
    let resyncCount = 0;
    let shortcutCount = 0;

    scheduler.scheduleHistoryResync(() => {
      resyncCount += 1;
    });
    scheduler.scheduleHistoryShortcut(() => {
      shortcutCount += 1;
    });

    expect(resyncCount).toBe(1);

    scheduler.cancelHistoryResync();
    scheduler.destroy();

    await vi.advanceTimersByTimeAsync(1000);
    expect(resyncCount).toBe(1);
    expect(shortcutCount).toBe(0);
  });
});
