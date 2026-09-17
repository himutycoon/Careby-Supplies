/**
 * Narrative layer — Claude writes prose explanations FROM the rules-layer
 * output. It never sees anything it could turn into a new number: the
 * input below is already-computed facts (cost totals, verdict, permit
 * list, designer notes). Its only job is to explain those facts in plain
 * language. The output schema is all strings — no numeric fields exist
 * for it to invent or "correct".
 */
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { buildPlaceholderNarrative } from "@/lib/report/build-placeholder-narrative";
import type {
  CostEstimate,
  DeliveredPlan,
  EstimateResult,
  ReportNarrative,
} from "@/lib/types";

const ReportNarrativeSchema = z.object({
  summary: z.string(),
  conditionOverview: z.string(),
  scopeRationale: z.string(),
  budgetGuidance: z.string(),
  nextSteps: z.string(),
});

const SYSTEM_PROMPT = `You write the narrative section of a home renovation report for a Canadian homeowner. You will be given already-computed facts: cost totals, a budget verdict, permit requirements, condition and issues detected in photos, and the human designer's own notes on the plan.

Rules:
- Every number in your prose (dollar amounts, percentages, counts) must come directly from the facts you were given. Never calculate, estimate, round differently, or introduce any number that isn't already in the input.
- Do not imply this plan is AI-generated — a human designer created it. You are only writing the explanatory text.
- Do not claim anything is permit-approved, code-approved, or contractually binding — this is indicative planning guidance only.
- Write in a clear, warm, professional tone. Keep each section to 2-4 sentences.`;

export async function generateNarrative(
  estimate: EstimateResult,
  deliveredPlan: DeliveredPlan,
  cost: CostEstimate,
): Promise<ReportNarrative> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(
      "[generateNarrative] ANTHROPIC_API_KEY not set — using templated placeholder narrative.",
    );
    return buildPlaceholderNarrative(estimate, deliveredPlan, cost);
  }

  const facts = {
    scopeLevel: estimate.scopeLevel,
    verdict: estimate.verdict,
    budgetCad: estimate.budgetCad,
    costTotalLow: cost.totalLow,
    costTotalHigh: cost.totalHigh,
    contingencyPct: cost.contingencyPct,
    permits: estimate.permits.map((p) => ({
      label: p.label,
      required: p.required,
    })),
    overallCondition: estimate.vision.overallCondition,
    issueCount: estimate.vision.issues.length,
    issues: estimate.vision.issues.map((i) => ({
      label: i.label,
      severity: i.severity,
    })),
    designerLayoutDescription: deliveredPlan.layoutDescription,
    designerPlanNotes: deliveredPlan.planNotes,
  };

  try {
    const client = new Anthropic();
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Write the report narrative from these facts:\n\n${JSON.stringify(facts, null, 2)}`,
        },
      ],
      output_config: {
        format: zodOutputFormat(ReportNarrativeSchema),
      },
    });

    if (!response.parsed_output) {
      throw new Error("Claude did not return a valid narrative.");
    }
    return response.parsed_output;
  } catch (err) {
    console.warn(
      "[generateNarrative] Claude call failed, falling back to templated narrative:",
      err,
    );
    return buildPlaceholderNarrative(estimate, deliveredPlan, cost);
  }
}
