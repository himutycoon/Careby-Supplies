/**
 * TEMPORARY placeholder math for the homepage estimate widget.
 *
 * This is NOT the rules layer. It exists only so the widget can show a
 * live-updating number before the user uploads anything. Replace with the
 * real deterministic rules engine in M3 (see /lib/types.ts CostEstimate).
 */
import type { EstimateVerdict, RoomType, ScopeLevel } from "@/lib/types";

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

const PERMIT_COUNT_BY_SCOPE: Record<ScopeLevel, number> = {
  cosmetic: 0,
  moderate: 1,
  "full-gut": 2,
};

const SCOPE_INDEX: Record<ScopeLevel, number> = {
  cosmetic: 0,
  moderate: 1,
  "full-gut": 2,
};

export interface PlaceholderWorkItem {
  trade: string;
  amountCad: number;
}

export interface PlaceholderEstimate {
  totalLow: number;
  totalHigh: number;
  verdict: EstimateVerdict;
  workItems: PlaceholderWorkItem[];
  permitCount: number;
  similarProjectsCount: number;
}

export interface PlaceholderEstimateInput {
  roomType: RoomType;
  lengthFt: number;
  widthFt: number;
  scopeLevel: ScopeLevel;
  budgetCad: number;
}

export function calculatePlaceholderEstimate(
  input: PlaceholderEstimateInput,
): PlaceholderEstimate {
  const area = input.lengthFt * input.widthFt;
  const midCost =
    area *
    COST_PER_SQFT_BY_SCOPE[input.scopeLevel] *
    ROOM_TYPE_MULTIPLIER[input.roomType];

  const totalLow = Math.round(midCost * 0.85);
  const totalHigh = Math.round(midCost * 1.2);

  let verdict: EstimateVerdict;
  if (totalHigh <= input.budgetCad) {
    verdict = "within-budget";
  } else if (totalLow <= input.budgetCad) {
    verdict = "tight";
  } else {
    verdict = "over-budget";
  }

  const workItems = TRADE_SHARE_BY_SCOPE[input.scopeLevel].map((entry) => ({
    trade: entry.trade,
    amountCad: Math.round(midCost * entry.share),
  }));

  const similarProjectsCount = Math.round(
    80 + area * 1.8 + SCOPE_INDEX[input.scopeLevel] * 40,
  );

  return {
    totalLow,
    totalHigh,
    verdict,
    workItems,
    permitCount: PERMIT_COUNT_BY_SCOPE[input.scopeLevel],
    similarProjectsCount,
  };
}
