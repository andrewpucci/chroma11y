import type {
  ConstraintSolveProfile,
  ConstraintSolveRequest,
  ConstraintSolveResponse
} from '#lib/types.js';
import { solveConstraintsWithProfile } from '#lib/constraintSolve.js';

interface ConstraintSolveWorkerRequest {
  request: ConstraintSolveRequest;
  profile: ConstraintSolveProfile;
}

self.onmessage = (event: MessageEvent<ConstraintSolveWorkerRequest>) => {
  const response: ConstraintSolveResponse = solveConstraintsWithProfile(
    event.data.request,
    event.data.profile,
    'client'
  );

  self.postMessage(response);
};
