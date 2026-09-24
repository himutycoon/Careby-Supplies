/**
 * The homepage widget's live-updating material estimate.
 *
 * This used to carry its own cost model, which meant the number on the
 * home page and the number on the real estimate were computed two
 * different ways and drifted apart. It now calls the rules layer with
 * assumed values for everything the widget does not ask for — an 8 ft
 * ceiling, no photos — so the figure it shows is the same takeoff the
 * full estimate runs, just with less known about the room.
 */
import { calculateCostEstimate } from "@/lib/rules/calculate-cost";
import type {
  EstimateVerdict,
  RoomType,
  ScopeLevel,
  VisionAnalysis,
} from "@/lib/types";

/** What the widget assumes because it does not ask. */
const ASSUMED_CEILING_FT = 8;

/** No photos have been uploaded yet, so the vision layer has nothing. */
const NO_PHOTOS: Omit<VisionAnalysis, "roomType"> = {
  detectedFixtures: [],
  detectedFinishes: [],
  overallCondition: "fair",
  issues: [],
  confidence: 0,
};

const SCOPE_INDEX: Record<ScopeLevel, number> = {
  cosmetic: 0,
  moderate: 1,
  "full-gut": 2,
};

export interface PlaceholderWorkItem {
  category: string;
  amountCad: number;
}

export interface PlaceholderEstimate {
  totalLow: number;
  totalHigh: number;
  verdict: EstimateVerdict;
  workItems: PlaceholderWorkItem[];
  /** How many material lines the takeoff produced. */
  materialLineCount: number;
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
  const { cost, verdict } = calculateCostEstimate(
    {
      roomType: input.roomType,
      lengthFt: input.lengthFt,
      widthFt: input.widthFt,
      ceilingHeightFt: ASSUMED_CEILING_FT,
      scopeLevel: input.scopeLevel,
      budgetCad: input.budgetCad,
      propertyType: "house",
      isOwner: true,
      wishlist: [],
      municipalityId: "",
      photoUrls: [],
      notes: "",
    },
    { roomType: input.roomType, ...NO_PHOTOS },
  );

  // The four biggest lines — enough to show where the money goes without
  // turning a teaser into a spreadsheet.
  const workItems = [...cost.lineItems]
    .sort((a, b) => b.totalCad - a.totalCad)
    .slice(0, 4)
    .map((item) => ({ category: item.category, amountCad: item.totalCad }));

  const area = input.lengthFt * input.widthFt;
  const similarProjectsCount = Math.round(
    80 + area * 1.8 + SCOPE_INDEX[input.scopeLevel] * 40,
  );

  return {
    totalLow: cost.totalLow,
    totalHigh: cost.totalHigh,
    verdict,
    workItems,
    materialLineCount: cost.lineItems.length,
    similarProjectsCount,
  };
}
