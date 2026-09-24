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
  const issueCount = estimate.vision.issues.length;

  return {
    summary: `The materials for your ${estimate.scopeLevel.replace("-", " ")} project come to $${cost.totalLow.toLocaleString()}–$${cost.totalHigh.toLocaleString()} CAD delivered, which is ${VERDICT_PHRASE[estimate.verdict]} your $${estimate.budgetCad.toLocaleString()} budget. That is material only — your contractor prices their own labour on top.`,
    conditionOverview:
      estimate.vision.confidence > 0
        ? `Your photos showed an overall condition of "${estimate.vision.overallCondition}", with ${issueCount} issue${issueCount === 1 ? "" : "s"} identified. Anything flagged there is reflected in the quantities and in the repair material on the list.`
        : "Your photos were reviewed by hand and the quantities set from what they showed.",
    scopeRationale: deliveredPlan.layoutDescription,
    budgetGuidance:
      estimate.verdict === "over-budget"
        ? "The material list is above your stated budget. The notes below point at the lines with room in them — most of the total sits in a handful of finishes, and swapping a grade usually moves it more than trimming quantities."
        : "The material list fits within your stated budget. If you want a higher grade on any line, tell us which and we will re-price it before you order.",
    nextSteps:
      "Check the quantities against your own measurements, then send the list back with anything you want swapped. Once it is right we will hold the pricing and book delivery to suit your install date.",
  };
}
