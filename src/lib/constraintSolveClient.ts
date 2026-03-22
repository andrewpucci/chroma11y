import ConstraintSolveWorker from '$lib/constraintSolve.worker?worker';
import type {
  ConstraintSolveProfile,
  ConstraintSolveRequest,
  ConstraintSolveResponse
} from '$lib/types';
import { getConstraintSolveRequestHash } from '$lib/constraintSolve';

const CACHE_STORAGE_KEY = 'chroma11y-solve-cache';

const solveResponseCache = new Map<string, ConstraintSolveResponse>();

export interface ConstraintSolveTask {
  promise: Promise<ConstraintSolveResponse>;
  cancel: () => void;
}

function getCacheKey(profile: ConstraintSolveProfile, requestHash: string): string {
  return `${CACHE_STORAGE_KEY}:${profile}:${requestHash}`;
}

function readCachedSolveResponse(
  profile: ConstraintSolveProfile,
  requestHash: string
): ConstraintSolveResponse | null {
  const cacheKey = getCacheKey(profile, requestHash);
  const memoryValue = solveResponseCache.get(cacheKey);
  if (memoryValue) {
    return memoryValue;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(cacheKey);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as ConstraintSolveResponse;
    solveResponseCache.set(cacheKey, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function cacheSolveResponse(
  profile: ConstraintSolveProfile,
  requestHash: string,
  response: ConstraintSolveResponse
): void {
  const cacheKey = getCacheKey(profile, requestHash);
  solveResponseCache.set(cacheKey, response);

  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(cacheKey, JSON.stringify(response));
  } catch {
    // Ignore cache writes when storage is unavailable or full.
  }
}

function createAbortError(): Error {
  return new DOMException('Constraint solve cancelled', 'AbortError');
}

export function startSolveConstraintsInWorker(
  request: ConstraintSolveRequest,
  profile: ConstraintSolveProfile = 'fast'
): ConstraintSolveTask {
  const requestHash = getConstraintSolveRequestHash(request, profile);
  const cached = readCachedSolveResponse(profile, requestHash);
  if (cached) {
    return {
      promise: Promise.resolve(cached),
      cancel: () => {}
    };
  }

  let cancelled = false;
  let settled = false;
  let rejectPromise: ((reason?: unknown) => void) | null = null;
  const worker = new ConstraintSolveWorker();

  const promise = new Promise<ConstraintSolveResponse>((resolve, reject) => {
    rejectPromise = reject;
    worker.onmessage = (event: MessageEvent<ConstraintSolveResponse>) => {
      if (cancelled || settled) {
        worker.terminate();
        return;
      }

      settled = true;
      cacheSolveResponse(profile, requestHash, event.data);
      worker.terminate();
      resolve(event.data);
    };

    worker.onerror = (event) => {
      if (settled) {
        worker.terminate();
        return;
      }

      settled = true;
      worker.terminate();
      reject(event.error ?? new Error('Constraint solve worker failed'));
    };

    worker.postMessage({
      request,
      profile
    });
  });

  return {
    promise,
    cancel: () => {
      if (cancelled || settled) {
        return;
      }

      cancelled = true;
      settled = true;
      worker.terminate();
      rejectPromise?.(createAbortError());
    }
  };
}

export function solveConstraintsInWorker(
  request: ConstraintSolveRequest,
  profile: ConstraintSolveProfile = 'fast'
): Promise<ConstraintSolveResponse> {
  return startSolveConstraintsInWorker(request, profile).promise;
}
