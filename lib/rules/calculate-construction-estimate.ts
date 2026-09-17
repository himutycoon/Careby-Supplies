/**
 * Rules layer — new construction.
 *
 * Pure, deterministic TypeScript. Sibling to lib/rules/calculate-cost.ts
 * (renovation), kept separate because the cost model is structurally
 * different: new builds price per finished square foot with quality and
 * feature adjustments, rather than per-trade renovation shares.
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

/** Base build rate per finished sq ft, by finish quality (CAD). */
const QUALITY_RATE: Record<string, { low: number; high: number }> = {
  "Builder standard": { low: 210, high: 260 },
  "Mid-range": { low: 260, high: 330 },
  "High-end": { low: 330, high: 430 },
  Luxury: { low: 430, high: 600 },
};

const DEFAULT_RATE = { low: 260, high: 330 };
const DEFAULT_AREA = 2000;

/** Flat additions in CAD, applied on top of the per-sq-ft build cost. */
const BASEMENT_COST: Record<string, number> = {
  "No basement": 0,
  Unfinished: 45000,
  Finished: 95000,
  Walkout: 135000,
};

const PARKING_COST: Record<string, number> = {
  "No garage": 0,
  "1 car": 28000,
  "2 car": 48000,
  "3+ car": 72000,
};

const ROOF_PREMIUM: Record<string, number> = {
  "Asphalt shingle": 0,
  Metal: 22000,
  "Flat / membrane": 14000,
  Tile: 30000,
  "Not sure": 0,
};

/** Bathrooms beyond two add meaningful plumbing/fixture cost. */
const COST_PER_EXTRA_BATHROOM = 18000;

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
