import ConstraintSolveWorker from '$lib/constraintSolve.worker?worker';
import type {
  ConstraintSolveProfile,
  ConstraintSolveRequest,
  ConstraintSolveResponse
} from '$lib/types';
import { getConstraintSolveRequestHash } from '$lib/constraintSolve';

const CACHE_STORAGE_KEY = 'chroma11y-solve-cache';

const solveResponseCache = new Map<string, ConstraintSolveResponse>();

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

export function solveConstraintsInWorker(
  request: ConstraintSolveRequest,
  profile: ConstraintSolveProfile = 'fast'
): Promise<ConstraintSolveResponse> {
  const requestHash = getConstraintSolveRequestHash(request, profile);
  const cached = readCachedSolveResponse(profile, requestHash);
  if (cached) {
    return Promise.resolve(cached);
  }

  return new Promise((resolve, reject) => {
    const worker = new ConstraintSolveWorker();
    worker.onmessage = (event: MessageEvent<ConstraintSolveResponse>) => {
      cacheSolveResponse(profile, requestHash, event.data);
      worker.terminate();
      resolve(event.data);
    };
    worker.onerror = (event) => {
      worker.terminate();
      reject(event.error ?? new Error('Constraint solve worker failed'));
    };
    worker.postMessage({
      request,
      profile
    });
  });
}
