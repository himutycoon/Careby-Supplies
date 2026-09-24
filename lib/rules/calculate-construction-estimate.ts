/**
 * Rules layer — material budget for a new build.
 *
 * Pure, deterministic TypeScript. Sibling to lib/rules/calculate-cost.ts,
 * which takes off a single room from its dimensions. A house has no room
 * dimensions to work from at this stage, so the budget is built per
 * finished square foot of material, adjusted for finish level and for the
 * parts of a house that carry their own material cost.
 *
 * Every rate here is MATERIAL ONLY, delivered, HST excluded. CareBy does
 * not build houses and does not price labour, excavation, equipment or
 * anything else a builder charges for. A builder's all-in rate is
 * roughly two to three times these numbers — that difference is their
 * work, not our material.
 *
 * No LLM is involved in producing any number here.
 */

export interface ConstructionAnswers {
  area?: string;
  quality?: string;
  basement?: string;
  parking?: string;
  bathrooms?: string;
  roof?: string;
}

export interface ConstructionEstimate {
  areaSqFt: number;
  ratePerSqFtLow: number;
  ratePerSqFtHigh: number;
  totalLow: number;
  totalHigh: number;
  assumptions: string[];
}

/** Material cost per finished sq ft, by finish quality (CAD). */
const QUALITY_RATE: Record<string, { low: number; high: number }> = {
  "Builder standard": { low: 85, high: 110 },
  "Mid-range": { low: 110, high: 145 },
  "High-end": { low: 145, high: 200 },
  Luxury: { low: 200, high: 290 },
};

const DEFAULT_RATE = { low: 110, high: 145 };
const DEFAULT_AREA = 2000;

/**
 * Flat material additions in CAD, on top of the per-sq-ft figure. Each
 * is the material for that part of the house — concrete and block,
 * framing, doors, membrane — and not the cost of putting it in.
 */
const BASEMENT_COST: Record<string, number> = {
  "No basement": 0,
  Unfinished: 18000,
  Finished: 38000,
  Walkout: 52000,
};

const PARKING_COST: Record<string, number> = {
  "No garage": 0,
  "1 car": 11000,
  "2 car": 19000,
  "3+ car": 28000,
};

const ROOF_PREMIUM: Record<string, number> = {
  "Asphalt shingle": 0,
  Metal: 9000,
  "Flat / membrane": 6000,
  Tile: 13000,
  "Not sure": 0,
};

/** Fixtures, tile and rough-in material for each bathroom past two. */
const COST_PER_EXTRA_BATHROOM = 6500;

function parseArea(value: string | undefined): number {
  const parsed = Number.parseFloat((value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_AREA;
}

function parseBathrooms(value: string | undefined): number {
  const parsed = Number.parseFloat((value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 2;
}

export function calculateConstructionEstimate(
  answers: ConstructionAnswers,
): ConstructionEstimate {
  const areaSqFt = parseArea(answers.area);
  const rate = QUALITY_RATE[answers.quality ?? ""] ?? DEFAULT_RATE;

  const buildLow = areaSqFt * rate.low;
  const buildHigh = areaSqFt * rate.high;

  const basement = BASEMENT_COST[answers.basement ?? ""] ?? 0;
  const parking = PARKING_COST[answers.parking ?? ""] ?? 0;
  const roof = ROOF_PREMIUM[answers.roof ?? ""] ?? 0;

  const extraBathrooms = Math.max(0, parseBathrooms(answers.bathrooms) - 2);
  const bathrooms = extraBathrooms * COST_PER_EXTRA_BATHROOM;

  const additions = basement + parking + roof + bathrooms;

  const assumptions: string[] = [
    `${areaSqFt.toLocaleString("en-CA")} sq ft finished area`,
    `${answers.quality ?? "Mid-range"} finish level`,
    "Material only — labour, equipment and permits are not included",
  ];
  if (basement > 0) assumptions.push(`${answers.basement} basement`);
  if (parking > 0) assumptions.push(`${answers.parking} garage`);
  if (roof > 0) assumptions.push(`${answers.roof} roof`);
  if (bathrooms > 0)
    assumptions.push(`${extraBathrooms} bathroom(s) beyond two`);

  return {
    areaSqFt,
    ratePerSqFtLow: rate.low,
    ratePerSqFtHigh: rate.high,
    totalLow: Math.round(buildLow + additions),
    totalHigh: Math.round(buildHigh + additions),
    assumptions,
  };
}
