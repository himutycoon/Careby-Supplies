/**
 * Rules layer — deterministic materials pricing.
 *
 * Pure TypeScript. No LLM involvement. This is the ONLY place that decides
 * a dollar figure, a quantity, or a budget verdict shown to the user. The
 * vision layer (lib/claude/analyze-photos.ts) supplies facts about the
 * room (fixtures, finishes, issues); this module turns those facts into a
 * material list using the fixed, auditable rules below.
 *
 * CareBy supplies materials. It does not sell labour, and it does not
 * price it: there are no trades, no permit fees and no contingency in
 * this estimate. Every line is something we can put on a truck, priced
 * at the quantity the room's dimensions imply, with a cut-waste
 * allowance on top because tile and lumber are never bought to the inch.
 */
import type {
  CostEstimate,
  CostLineItem,
  DetectedIssue,
  EstimateVerdict,
  Fixture,
  RenovationInput,
  RoomType,
  ScopeLevel,
  SupplyNote,
  VisionAnalysis,
} from "@/lib/types";

/** Areas the material quantities are derived from, in feet. */
interface Dimensions {
  floorAreaSqFt: number;
  /** Net of a nominal allowance for doors and windows. */
  wallAreaSqFt: number;
  ceilingAreaSqFt: number;
  perimeterFt: number;
}

/** Fraction of gross wall area lost to doors and windows. */
const OPENING_ALLOWANCE = 0.12;

/**
 * A rate is either flat or set per room — a square foot of bathroom
 * floor is porcelain, a square foot of bedroom floor is laminate.
 */
type Rate = number | ({ default: number } & Partial<Record<RoomType, number>>);

interface MaterialSpec {
  category: string;
  description: string;
  unit: string;
  unitCostCad: Rate;
  /** Scopes this material is bought for. */
  scopes: ScopeLevel[];
  /** Rooms this material applies to. Omitted means every room. */
  rooms?: RoomType[];
  quantity: (dims: Dimensions, input: RenovationInput) => number;
}

const INDOOR_ROOMS: RoomType[] = [
  "bathroom",
  "kitchen",
  "basement",
  "bedroom",
  "living",
  "whole-home",
  "addition",
];

const WET_ROOMS: RoomType[] = ["bathroom", "kitchen", "basement", "whole-home"];

const ALL_SCOPES: ScopeLevel[] = ["cosmetic", "moderate", "full-gut"];
const STRUCTURAL_SCOPES: ScopeLevel[] = ["moderate", "full-gut"];

/**
 * Feet of cabinet run a room implies.
 *
 * A kitchen wraps most of its perimeter in cabinets; a bathroom holds one
 * vanity, and scaling that off the perimeter the way a kitchen does put
 * fifteen feet of vanity in a nine-by-seven bathroom.
 */
function cabinetRunFt(dims: Dimensions, input: RenovationInput): number {
  return input.roomType === "kitchen"
    ? Math.ceil(dims.perimeterFt * 0.45)
    : Math.max(3, Math.round(dims.perimeterFt * 0.15));
}

/**
 * The catalogue behind the estimate. Order here is the order on the
 * quote: substrate first, then surfaces, then what gets fixed to them.
 * Prices are Ontario retail for supply only, HST excluded.
 */
const MATERIAL_SPECS: MaterialSpec[] = [
  {
    category: "Framing lumber & hardware",
    description: "Joists, beams, posts and galvanised connectors",
    unit: "sq ft",
    unitCostCad: 4.75,
    scopes: ALL_SCOPES,
    rooms: ["deck"],
    quantity: (d) => d.floorAreaSqFt,
  },
  {
    category: "Framing lumber & fasteners",
    description: "Studs, plates, blocking and structural screws",
    unit: "sq ft",
    unitCostCad: 3.1,
    scopes: ["full-gut"],
    rooms: ["basement", "addition", "whole-home"],
    quantity: (d) => d.floorAreaSqFt,
  },
  {
    category: "Insulation & vapour barrier",
    description: "Batt insulation, poly and sealing tape for exterior walls",
    unit: "sq ft",
    unitCostCad: 1.45,
    scopes: ["full-gut"],
    rooms: ["basement", "addition", "whole-home"],
    quantity: (d) => d.wallAreaSqFt,
  },
  {
    category: "Drywall & compound",
    description: "Board, tape, compound and corner bead",
    unit: "sq ft",
    unitCostCad: 0.95,
    scopes: STRUCTURAL_SCOPES,
    rooms: INDOOR_ROOMS,
    quantity: (d, input) =>
      (d.wallAreaSqFt + d.ceilingAreaSqFt) *
      (input.scopeLevel === "full-gut" ? 1 : 0.4),
  },
  {
    category: "Waterproofing",
    description: "Membrane, seam tape and sealant behind wet walls",
    unit: "sq ft",
    unitCostCad: 3.2,
    scopes: STRUCTURAL_SCOPES,
    rooms: ["bathroom"],
    quantity: (d) => d.floorAreaSqFt + d.wallAreaSqFt * 0.35,
  },
  {
    category: "Flooring",
    description:
      "Tile, vinyl plank or engineered flooring for the finished area",
    unit: "sq ft",
    unitCostCad: {
      default: 4.25,
      bathroom: 6.5,
      kitchen: 6,
      basement: 3.75,
      "whole-home": 4.75,
      addition: 5,
    },
    scopes: ALL_SCOPES,
    rooms: INDOOR_ROOMS,
    quantity: (d) => d.floorAreaSqFt,
  },
  {
    category: "Decking boards",
    description: "Pressure-treated or composite boards and hidden fasteners",
    unit: "sq ft",
    unitCostCad: 9.5,
    scopes: ALL_SCOPES,
    rooms: ["deck"],
    quantity: (d) => d.floorAreaSqFt,
  },
  {
    category: "Underlay, mortar & grout",
    description: "Setting materials and transitions under the finished floor",
    unit: "sq ft",
    unitCostCad: 1.15,
    scopes: ALL_SCOPES,
    rooms: INDOOR_ROOMS,
    quantity: (d) => d.floorAreaSqFt,
  },
  {
    category: "Wall tile",
    description: "Surround and backsplash tile with trim pieces",
    unit: "sq ft",
    unitCostCad: { default: 8, bathroom: 7.5, kitchen: 9 },
    scopes: ALL_SCOPES,
    rooms: ["bathroom", "kitchen"],
    quantity: (d, input) =>
      input.roomType === "bathroom"
        ? d.wallAreaSqFt * 0.35
        : d.perimeterFt * 1.6,
  },
  {
    category: "Cabinetry",
    description: "Stock cabinet boxes, doors and hardware",
    unit: "lin ft",
    unitCostCad: { default: 300, kitchen: 340, bathroom: 210 },
    scopes: STRUCTURAL_SCOPES,
    rooms: ["kitchen", "bathroom"],
    quantity: cabinetRunFt,
  },
  {
    category: "Countertops",
    description: "Quartz or laminate surface cut to the cabinet run",
    unit: "lin ft",
    unitCostCad: { default: 90, kitchen: 95, bathroom: 70 },
    scopes: STRUCTURAL_SCOPES,
    rooms: ["kitchen", "bathroom"],
    // Uppers carry no counter, so a kitchen counters about two thirds of
    // its cabinet run. A vanity is countered end to end.
    quantity: (d, input) =>
      input.roomType === "kitchen"
        ? Math.ceil(cabinetRunFt(d, input) * 0.65)
        : cabinetRunFt(d, input),
  },
  {
    category: "Trim, doors & hardware",
    description: "Baseboard, casing, interior doors and handles",
    unit: "lin ft",
    unitCostCad: 8.5,
    scopes: STRUCTURAL_SCOPES,
    rooms: INDOOR_ROOMS,
    quantity: (d) => d.perimeterFt,
  },
  {
    category: "Railing & stair hardware",
    description: "Guard rails, pickets, post caps and brackets",
    unit: "lin ft",
    unitCostCad: 32,
    scopes: ALL_SCOPES,
    rooms: ["deck"],
    // One side of a deck meets the house and carries no rail.
    quantity: (d) => Math.ceil(d.perimeterFt * 0.75),
  },
  {
    category: "Roofing & flashing",
    description: "Shingles, underlay, drip edge, vents and flashing",
    unit: "sq ft",
    unitCostCad: 2.8,
    scopes: STRUCTURAL_SCOPES,
    rooms: ["addition"],
    quantity: (d) => d.floorAreaSqFt,
  },
  {
    category: "Plumbing supplies",
    description: "PEX, valves, fittings, drains and supply lines",
    unit: "rough-in kit",
    unitCostCad: 180,
    scopes: STRUCTURAL_SCOPES,
    rooms: WET_ROOMS,
    // Pipework follows fixture groups, not floor area: a 700 sq ft
    // basement does not need eight times the pipe a bathroom does.
    quantity: (d) => Math.min(3, Math.max(1, Math.ceil(d.floorAreaSqFt / 90))),
  },
  {
    category: "Lighting & electrical devices",
    description: "Fixtures, switches, receptacles, plates and boxes",
    unit: "each",
    unitCostCad: 95,
    scopes: STRUCTURAL_SCOPES,
    rooms: INDOOR_ROOMS,
    quantity: (d) => Math.max(2, Math.ceil(d.floorAreaSqFt / 60)),
  },
  {
    category: "Paint & primer",
    description: "Primer, two finish coats, rollers, tape and drop sheets",
    unit: "gal",
    unitCostCad: 64,
    scopes: ALL_SCOPES,
    rooms: INDOOR_ROOMS,
    quantity: (d) => Math.ceil((d.wallAreaSqFt + d.ceilingAreaSqFt) / 320),
  },
  {
    category: "Stain & sealer",
    description: "Exterior stain, sealer and application supplies",
    unit: "gal",
    unitCostCad: 72,
    scopes: ALL_SCOPES,
    rooms: ["deck"],
    quantity: (d) => Math.ceil(d.floorAreaSqFt / 250),
  },
];

/**
 * Supply-only price per fixture the photo analysis flags for
 * replacement, matched case-insensitively on Fixture.type. Supply only —
 * no install, no haul-away.
 */
const FIXTURE_SUPPLY_COST: { keyword: string; costCad: number }[] = [
  { keyword: "toilet", costCad: 420 },
  { keyword: "vanity", costCad: 980 },
  { keyword: "sink", costCad: 260 },
  { keyword: "bathtub", costCad: 720 },
  { keyword: "shower", costCad: 480 },
  { keyword: "cabinet", costCad: 1600 },
  { keyword: "countertop", costCad: 1200 },
  { keyword: "appliance", costCad: 1100 },
  { keyword: "ventilation", costCad: 220 },
  { keyword: "lighting", costCad: 180 },
];
const FIXTURE_DEFAULT_COST = 300;

/**
 * Extra material a visible problem consumes — patching compound, a sheet
 * of subfloor, replacement board. Materials only; whoever does the work
 * prices their own time.
 */
const ISSUE_MATERIAL_COST: Record<DetectedIssue["severity"], number> = {
  minor: 120,
  moderate: 340,
  major: 900,
};

/** Cut waste, breakage and the box you open for the last four tiles. */
const WASTE_PCT_STANDARD = 0.1;
const WASTE_PCT_ELEVATED = 0.15;

/** Fasteners, adhesives, blades, shims — a share of everything else. */
const SUNDRIES_PCT = 0.035;

const ONTARIO_HST_RATE = 0.13;

function rateFor(rate: Rate, roomType: RoomType): number {
  return typeof rate === "number" ? rate : (rate[roomType] ?? rate.default);
}

function fixtureSupplyCost(fixture: Fixture): number {
  const match = FIXTURE_SUPPLY_COST.find(({ keyword }) =>
    fixture.type.toLowerCase().includes(keyword),
  );
  return match?.costCad ?? FIXTURE_DEFAULT_COST;
}

function measure(input: RenovationInput): Dimensions {
  const floorAreaSqFt = input.lengthFt * input.widthFt;
  const perimeterFt = 2 * (input.lengthFt + input.widthFt);
  return {
    floorAreaSqFt,
    perimeterFt,
    ceilingAreaSqFt: floorAreaSqFt,
    wallAreaSqFt: perimeterFt * input.ceilingHeightFt * (1 - OPENING_ALLOWANCE),
  };
}

/**
 * What arrives on the truck and what does not. This is the honest half
 * of the estimate: permits, inspections and installation are somebody
 * else's job, and the quote should say so rather than imply we cover it.
 */
function determineSupplyNotes(
  input: RenovationInput,
  vision: VisionAnalysis,
): SupplyNote[] {
  const notes: SupplyNote[] = [
    {
      id: "supply-materials",
      label: "Every line on this list",
      included: true,
      owner: "CareBy Supplies",
      note: "Priced from our catalogue and held for 30 days. Swap any line for a different brand or grade before you order.",
    },
    {
      id: "supply-delivery",
      label: "Delivery to site",
      included: true,
      owner: "CareBy Supplies",
      note: "Scheduled to your install date across the GTA, so material is not sitting on the driveway for a fortnight.",
    },
    {
      id: "supply-takeoff",
      label: "Quantity check before you order",
      included: true,
      owner: "CareBy Supplies",
      note: "Send us your measurements or drawings and we will confirm these quantities against them.",
    },
    {
      id: "supply-labour",
      label: "Installation labour",
      included: false,
      owner: "Your contractor or trades",
      note: "We supply material only — we do not install it or provide trades. Quantities here are sized so your installer can price their own labour against them.",
    },
    {
      id: "supply-permits",
      label: "Permits and inspections",
      included: false,
      owner: "You or your contractor",
      note: "Any permit, drawing or inspection your municipality requires is arranged by whoever is doing the work.",
    },
    {
      id: "supply-measure",
      label: "Site measurement",
      included: false,
      owner: "You or your contractor",
      note: "These quantities come from the dimensions you entered. Confirm them on site before ordering cut-to-size material.",
    },
  ];

  if (input.propertyType === "condo") {
    notes.push({
      id: "supply-condo-access",
      label: "Elevator and loading dock booking",
      included: false,
      owner: "You or your property manager",
      note: "Most condo boards need delivery windows booked in advance. Tell us the window and we will deliver inside it.",
    });
  }

  if (input.roomType === "deck") {
    notes.push({
      id: "supply-span",
      label: "Joist spans and footing sizes",
      included: false,
      owner: "Your contractor",
      note: "Lumber is priced by area here. Span tables and footing sizes are your contractor's call, and we will re-price once they are set.",
    });
  }

  if (vision.issues.some((issue) => issue.severity === "major")) {
    notes.push({
      id: "supply-repair",
      label: "Repair material for the issue in your photos",
      included: true,
      owner: "CareBy Supplies",
      note: "An allowance for patching and replacement board is on the list. Whatever caused the damage still needs looking at before new material goes over it.",
    });
  }

  return notes;
}

export function calculateCostEstimate(
  input: RenovationInput,
  vision: VisionAnalysis,
): { cost: CostEstimate; supplyNotes: SupplyNote[]; verdict: EstimateVerdict } {
  const dims = measure(input);

  const lineItems: CostLineItem[] = MATERIAL_SPECS.filter(
    (spec) =>
      spec.scopes.includes(input.scopeLevel) &&
      (spec.rooms === undefined || spec.rooms.includes(input.roomType)),
  )
    .map((spec) => {
      const quantity = Math.max(0, Math.round(spec.quantity(dims, input)));
      const unitCostCad = rateFor(spec.unitCostCad, input.roomType);
      return {
        category: spec.category,
        description: spec.description,
        quantity,
        unit: spec.unit,
        unitCostCad,
        totalCad: Math.round(quantity * unitCostCad),
      };
    })
    .filter((item) => item.quantity > 0 && item.totalCad > 0);

  // One line per fixture the photos say is worth replacing. These are
  // real products off the shelf, so they are itemised rather than
  // folded into an allowance.
  for (const fixture of vision.detectedFixtures) {
    if (!fixture.replaceRecommended) continue;
    const unitCostCad = fixtureSupplyCost(fixture);
    lineItems.push({
      category: "Fixtures & appliances",
      description: `${fixture.type} — supply only, flagged for replacement in your photos`,
      quantity: 1,
      unit: "each",
      unitCostCad,
      totalCad: unitCostCad,
    });
  }

  const issueMaterialTotal = vision.issues.reduce(
    (sum, issue) => sum + ISSUE_MATERIAL_COST[issue.severity],
    0,
  );
  if (issueMaterialTotal > 0) {
    const issueCount = vision.issues.length;
    lineItems.push({
      category: "Repair materials",
      description: `Patching, board and sealant for ${issueCount === 1 ? "the issue" : "the issues"} found in your photos`,
      quantity: issueCount,
      unit: issueCount === 1 ? "area" : "areas",
      unitCostCad: Math.round(issueMaterialTotal / issueCount),
      totalCad: issueMaterialTotal,
    });
  }

  const materialsTotal = lineItems.reduce((sum, item) => sum + item.totalCad, 0);
  const sundries = Math.round(materialsTotal * SUNDRIES_PCT);
  if (sundries > 0) {
    lineItems.push({
      category: "Fasteners & sundries",
      description: "Screws, adhesive, caulk, blades, shims and sandpaper",
      quantity: 1,
      unit: "allowance",
      unitCostCad: sundries,
      totalCad: sundries,
    });
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.totalCad, 0);

  // A room in poor condition means more cutting around bad substrate and
  // more material written off, so the overage goes up rather than the
  // rates.
  const hasMajorIssue = vision.issues.some(
    (issue) => issue.severity === "major",
  );
  const wastePct =
    vision.overallCondition === "poor" || hasMajorIssue
      ? WASTE_PCT_ELEVATED
      : WASTE_PCT_STANDARD;
  const wasteAllowance = Math.round(subtotal * wastePct);

  const hst = Math.round((subtotal + wasteAllowance) * ONTARIO_HST_RATE);

  // Materials price tighter than a whole project: the range covers grade
  // and brand choice, not unknowns behind the wall.
  const midpoint = subtotal + wasteAllowance + hst;
  const totalLow = Math.round(midpoint * 0.94);
  const totalHigh = Math.round(midpoint * 1.09);

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
      wastePct,
      wasteAllowance,
      hst,
      totalLow,
      totalHigh,
    },
    supplyNotes: determineSupplyNotes(input, vision),
    verdict,
  };
}
