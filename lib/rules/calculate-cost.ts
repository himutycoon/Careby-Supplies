/**
 * Rules layer — deterministic cost, scope, and permit logic.
 *
 * Pure TypeScript. No LLM involvement. This is the ONLY place that decides
 * a dollar figure, an area, or a budget verdict shown to the user. The
 * vision layer (lib/claude/analyze-photos.ts) supplies facts about the
 * room (fixtures, finishes, issues); this module turns those facts into
 * numbers using fixed, auditable rules below.
 */
import type {
  CostEstimate,
  CostLineItem,
  DetectedIssue,
  EstimateVerdict,
  Fixture,
  PermitCheck,
  RenovationInput,
  RoomType,
  ScopeLevel,
  VisionAnalysis,
} from "@/lib/types";

const COST_PER_SQFT_BY_SCOPE: Record<ScopeLevel, number> = {
  cosmetic: 40,
  moderate: 90,
  "full-gut": 160,
};

const ROOM_TYPE_MULTIPLIER: Record<RoomType, number> = {
  bathroom: 1.3,
  kitchen: 1.5,
  basement: 1.0,
  bedroom: 0.7,
  living: 0.8,
  "whole-home": 1.1,
  // Placeholder multipliers — sanity-check against real project data once available.
  addition: 1.4,
  deck: 0.6,
};

const TRADE_SHARE_BY_SCOPE: Record<
  ScopeLevel,
  { trade: string; share: number }[]
> = {
  cosmetic: [
    { trade: "Demolition", share: 0.05 },
    { trade: "Plumbing", share: 0.05 },
    { trade: "Electrical", share: 0.1 },
    { trade: "Finishes", share: 0.6 },
    { trade: "Fixtures", share: 0.2 },
  ],
  moderate: [
    { trade: "Demolition", share: 0.1 },
    { trade: "Plumbing", share: 0.2 },
    { trade: "Electrical", share: 0.15 },
    { trade: "Finishes", share: 0.35 },
    { trade: "Fixtures", share: 0.2 },
  ],
  "full-gut": [
    { trade: "Demolition", share: 0.15 },
    { trade: "Plumbing", share: 0.25 },
    { trade: "Electrical", share: 0.15 },
    { trade: "Finishes", share: 0.3 },
    { trade: "Fixtures", share: 0.15 },
  ],
};

// Flat dollar bump per detected issue, by severity. Reflects that a
// visible problem (water damage, failed caulking, etc.) adds real
// remediation cost on top of the baseline scope-of-work estimate.
const ISSUE_COST_BUMP: Record<DetectedIssue["severity"], number> = {
  minor: 250,
  moderate: 700,
  major: 1800,
};

// Flat per-fixture replacement allowance, by fixture type keyword
// (case-insensitive substring match against Fixture.type). Falls back to
// FIXTURE_DEFAULT_COST when nothing matches.
const FIXTURE_REPLACEMENT_COST: { keyword: string; costCad: number }[] = [
  { keyword: "toilet", costCad: 650 },
  { keyword: "vanity", costCad: 1600 },
  { keyword: "sink", costCad: 500 },
  { keyword: "bathtub", costCad: 900 },
  { keyword: "shower", costCad: 550 },
  { keyword: "cabinet", costCad: 2200 },
  { keyword: "countertop", costCad: 1800 },
  { keyword: "appliance", costCad: 1200 },
  { keyword: "ventilation", costCad: 380 },
  { keyword: "lighting", costCad: 320 },
];
const FIXTURE_DEFAULT_COST = 400;

const CONTINGENCY_PCT_STANDARD = 0.15;
const CONTINGENCY_PCT_ELEVATED = 0.2;

const ONTARIO_HST_RATE = 0.13;
const PERMIT_FEE_FLAT = 175;

function fixtureReplacementCost(fixture: Fixture): number {
  const match = FIXTURE_REPLACEMENT_COST.find(({ keyword }) =>
    fixture.type.toLowerCase().includes(keyword),
  );
  return match?.costCad ?? FIXTURE_DEFAULT_COST;
}

function determinePermits(
  input: RenovationInput,
  vision: VisionAnalysis,
): PermitCheck[] {
  const permits: PermitCheck[] = [];

  const touchesPlumbingOrElectrical =
    input.scopeLevel !== "cosmetic" &&
    (input.roomType === "bathroom" ||
      input.roomType === "kitchen" ||
      input.roomType === "whole-home");

  if (
    input.scopeLevel === "full-gut" ||
    touchesPlumbingOrElectrical ||
    input.roomType === "addition"
  ) {
    permits.push({
      id: "permit-building",
      label: "Building Permit",
      required: true,
      authority: "City of Mississauga — Building Division",
      note:
        input.roomType === "addition"
          ? "Required for any addition — structural, exterior, and zoning review."
          : "Required when plumbing fixtures are relocated rather than replaced in place.",
    });
    permits.push({
      id: "permit-electrical",
      label: "Electrical Permit (ESA)",
      required: true,
      authority: "Electrical Safety Authority (ESA)",
      note: "Required for new circuits or fixture relocations identified during your plan review.",
    });
  }

  if (input.propertyType === "condo") {
    permits.push({
      id: "permit-condo-board",
      label: "Condo Corporation Alteration Approval",
      required: true,
      authority: "Condo Board / Property Management",
      note: "Condos typically require board approval before work begins, in addition to any municipal permits.",
    });
  }

  if (input.roomType === "deck") {
    permits.push({
      id: "permit-deck",
      label: "Deck Permit",
      required: false,
      authority: "City of Mississauga — Building Division",
      note: "Height and guard-rail requirements vary by municipality — your designer will confirm whether a permit applies.",
    });
  }

  if (vision.issues.some((issue) => issue.severity === "major")) {
    permits.push({
      id: "permit-mechanical",
      label: "Mechanical/HVAC Permit",
      required: false,
      authority: "City of Mississauga — Building Division",
      note: "Flagged for review given the major issue detected in your photos — your designer will confirm.",
    });
  }

  return permits;
}

export function calculateCostEstimate(
  input: RenovationInput,
  vision: VisionAnalysis,
): { cost: CostEstimate; permits: PermitCheck[]; verdict: EstimateVerdict } {
  const area = input.lengthFt * input.widthFt;
  const baseCost =
    area *
    COST_PER_SQFT_BY_SCOPE[input.scopeLevel] *
    ROOM_TYPE_MULTIPLIER[input.roomType];

  const issueCostBump = vision.issues.reduce(
    (sum, issue) => sum + ISSUE_COST_BUMP[issue.severity],
    0,
  );

  const fixtureReplacementTotal = vision.detectedFixtures
    .filter((fixture) => fixture.replaceRecommended)
    .reduce((sum, fixture) => sum + fixtureReplacementCost(fixture), 0);

  const adjustedCost = baseCost + issueCostBump + fixtureReplacementTotal;

  const lineItems: CostLineItem[] = TRADE_SHARE_BY_SCOPE[input.scopeLevel]
    .map((entry) => ({
      trade: entry.trade,
      description: "Estimated allowance based on scope and photo analysis",
      quantity: 1,
      unit: "allowance",
      unitCostCad: Math.round(adjustedCost * entry.share),
      totalCad: Math.round(adjustedCost * entry.share),
    }))
    .filter((item) => item.totalCad > 0);

  const subtotal = lineItems.reduce((sum, item) => sum + item.totalCad, 0);

  const hasMajorIssue = vision.issues.some(
    (issue) => issue.severity === "major",
  );
  const contingencyPct =
    vision.overallCondition === "poor" || hasMajorIssue
      ? CONTINGENCY_PCT_ELEVATED
      : CONTINGENCY_PCT_STANDARD;
  const contingency = Math.round(subtotal * contingencyPct);

  const permits = determinePermits(input, vision);
  const permitFees = permits.filter((p) => p.required).length * PERMIT_FEE_FLAT;

  const hst = Math.round((subtotal + contingency) * ONTARIO_HST_RATE);

  const midpoint = subtotal + contingency + permitFees + hst;
  const totalLow = Math.round(midpoint * 0.92);
  const totalHigh = Math.round(midpoint * 1.15);

  let verdict: EstimateVerdict;
  if (totalHigh <= input.budgetCad) {
    verdict = "within-budget";
  } else if (totalLow <= input.budgetCad) {
    verdict = "tight";
  } else {
    verdict = "over-budget";
  }

  return {
    cost: {
      lineItems,
      subtotal,
      contingencyPct,
      contingency,
      permitFees,
      hst,
      totalLow,
      totalHigh,
    },
    permits,
    verdict,
  };
}
