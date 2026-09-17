import { ok, type ServiceResult } from "@/services/client";
import {
  calculateConstructionEstimate,
  type ConstructionAnswers,
  type ConstructionEstimate,
} from "@/lib/rules/calculate-construction-estimate";

/**
 * Estimate service.
 *
 * The arithmetic lives in lib/rules/ (pure, deterministic, unit-tested).
 * This layer only provides the async boundary so a server-side
 * estimation engine can replace it without touching callers.
 */
export async function calculateEstimate(
  answers: ConstructionAnswers,
): Promise<ServiceResult<ConstructionEstimate>> {
  return ok(calculateConstructionEstimate(answers));
}

export type { ConstructionAnswers, ConstructionEstimate };
