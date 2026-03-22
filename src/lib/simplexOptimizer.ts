import dfoptim from 'dfoptim';

const { Simplex } = dfoptim as typeof import('dfoptim');

export interface SimplexOptimizerParameters {
  maxIterations?: number;
  nonZeroDelta?: number;
  zeroDelta?: number;
  minErrorDelta?: number;
  minTolerance?: number;
}

export interface SimplexOptimizerResult {
  fx: number;
  x: number[];
}

function getMaxCoordinateDelta(simplex: { location: number[]; value: number }[]): number {
  if (simplex.length < 2) return 0;

  const best = simplex[0]?.location ?? [];
  let maxDiff = 0;

  for (const point of simplex.slice(1)) {
    for (let index = 0; index < best.length; index += 1) {
      maxDiff = Math.max(maxDiff, Math.abs((point.location[index] ?? 0) - (best[index] ?? 0)));
    }
  }

  return maxDiff;
}

export function simplexOptimize(
  fn: (x: number[]) => number,
  x0: number[],
  parameters: SimplexOptimizerParameters = {}
): SimplexOptimizerResult {
  const maxIterations = parameters.maxIterations ?? x0.length * 200;
  const minErrorDelta = parameters.minErrorDelta ?? 1e-6;
  const minTolerance = parameters.minTolerance ?? 1e-5;
  const deltaNonZero = (parameters.nonZeroDelta ?? 1.05) - 1;
  const deltaZero = parameters.zeroDelta ?? 0.001;

  const simplex = new Simplex(fn, x0, {
    deltaNonZero,
    deltaZero,
    errorOnFailure: true,
    tolerance: minTolerance
  });

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const converged = simplex.step();
    const state = simplex.simplex();
    const best = state[0];
    const worst = state[state.length - 1];

    if (
      converged ||
      !best ||
      !worst ||
      (Math.abs(best.value - worst.value) < minErrorDelta &&
        getMaxCoordinateDelta(state) < minTolerance)
    ) {
      break;
    }
  }

  const result = simplex.result();
  return {
    fx: result.value,
    x: [...result.location]
  };
}
