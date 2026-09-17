/**
 * TEMPORARY placeholder narrative builder.
 *
 * The real narrative layer (Claude writing prose FROM rules-layer output —
 * see project architecture) is M3, Days 15-16, not built yet. Until then,
 * real delivered reports get plain templated sentences built directly from
 * numbers the rules layer already computed — factual, not fabricated, just
 * not yet prose-polished by Claude.
 */
import type { CostEstimate, DeliveredPlan, EstimateResult, ReportNarrative } from "@/lib/types";

const VERDICT_PHRASE: Record<EstimateResult["verdict"], string> = {
  "within-budget": "comfortably within",
  tight: "close to the edge of",
  "over-budget": "above",
};

export function buildPlaceholderNarrative(
  estimate: EstimateResult,
  deliveredPlan: DeliveredPlan,
  cost: CostEstimate,
): ReportNarrative {
  return {
    summary: `Your ${estimate.scopeLevel.replace("-", " ")} renovation is estimated at $${cost.totalLow.toLocaleString()}–$${cost.totalHigh.toLocaleString()} CAD, which is ${VERDICT_PHRASE[estimate.verdict]} your $${estimate.budgetCad.toLocaleString()} budget.`,
    conditionOverview:
      estimate.vision.confidence > 0
        ? `Your photos showed an overall condition of "${estimate.vision.overallCondition}", with ${estimate.vision.issues.length} issue(s) identified.`
        : "Detailed photo analysis was reviewed manually by your designer.",
    scopeRationale: deliveredPlan.layoutDescription,
    budgetGuidance:
      estimate.verdict === "over-budget"
        ? "This project's likely cost is above your stated budget — your designer's notes below outline ways to bring it in line, or you may want to phase the work."
        : "This project fits within your stated budget based on the scope discussed.",
    nextSteps:
      "Review the plan notes and cost breakdown below, then reach out with any questions before booking a contractor.",
  };
}
