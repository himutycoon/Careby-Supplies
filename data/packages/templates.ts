/**
 * The 24 package templates from the Package Matrix sheet.
 *
 * `base` and `optional` hold selection-item ids rather than prose, so the
 * scope engine can act on them. The sheet's own wording is kept in
 * `baseScope` and `exclusions` because it is what the contractor and the
 * customer read — exclusions in particular are a promise about what is
 * NOT in the price, and paraphrasing them would change the deal.
 */

import type { BudgetTier } from "@/data/packages/selection-items";

export type ProjectGroup =
  | "Bathroom"
  | "Kitchen"
  | "Basement"
  | "Full Home"
  | "New Build"
  | "Outdoor"
  | "Exterior"
  | "Flooring"
  | "Utility"
  | "Entry"
  | "Home Office"
  | "Bedroom + Ensuite";

export interface PackageTemplate {
  id: string;
  name: string;
  group: ProjectGroup;
  /** Plain-language scope, straight from the sheet. */
  baseScope: string;
  /** Tiers this template is offered at. */
  tiers: BudgetTier[];
  /** Default tier when the contractor picks this template. */
  defaultTier: BudgetTier;
  /** Selection-item ids always generated (before adjusters trim them). */
  base: string[];
  /** Offered but never required. */
  optional: string[];
  /** Adjuster ids that matter most for this template. */
  adjusters: string[];
  /**
   * Adjuster answers this template starts from.
   *
   * A template states what the job already includes, and that has to beat
   * the adjuster's own default. Without this, the Outdoor adjuster's
   * default of "none" removed the decking from the Deck templates, so
   * "Deck — Basic" generated a single light fixture. Only overrides that
   * differ from the adjuster default belong here.
   */
  defaultAdjusters?: Record<string, string>;
  /** Verbatim from the sheet — what the package does not cover. */
  exclusions: string;
}

/*
 * Bathroom order, from the client's 26/09 list: shower type first, then
 * drain, shower system, stone, tile, vanity, countertop, toilet, mirror,
 * trim, light, exhaust, paint, caulking, grout, niche.
 *
 * The wet items lead, because that is the decision the rest of the room
 * follows from.
 */
const BATH_WET = [
  "shower-base",
  "shower-drain",
  "shower-valve",
  "showerhead",
  "shower-stone",
  "bath-wall-tile",
  "shower-glass",
  "shower-niche",
];

const BATH_CORE = [
  "vanity",
  "vanity-top",
  "bath-sink",
  "bath-faucet",
  "toilet",
  "mirror",
  "bath-trim",
  "bath-lighting",
  "exhaust-fan",
  "bath-floor-tile",
  "grout",
  "caulking",
  "paint",
  "bath-accessories",
];

/*
 * Kitchen order, from the client's 26/09 list: cabinets and their design
 * first, then hardware, countertop, backsplash, rangehood, appliances,
 * sink, faucet, light, flooring, paint, trim.
 *
 * It is split in two because the appliances belong in the middle of that
 * run, not appended to the end of it -- the customer portal lists a
 * room's decisions in the order they enter scope.
 */
const KITCHEN_SURFACES = ["cabinet-hardware", "countertop", "backsplash"];

const KITCHEN_FIXTURES = ["kitchen-sink", "kitchen-faucet", "kitchen-lighting"];

const KITCHEN_CORE = [...KITCHEN_SURFACES, ...KITCHEN_FIXTURES, "paint"];

// Rangehood first: the client asks for it ahead of the other appliances.
const APPLIANCES = ["hood", "range", "refrigerator", "dishwasher", "microwave"];

/*
 * Interior order, from the client's basement list: flooring, light,
 * door, trim, paint. The washroom and the kitchen sit between light and
 * door on his list; they arrive from their own questions and the portal
 * shows them as their own sections, which reads better than threading
 * a toilet through a list of doors.
 */
const INTERIOR_CORE = [
  "flooring",
  "lighting",
  "interior-doors",
  "door-hardware",
  "baseboards",
  "paint",
];

export const PACKAGE_TEMPLATES: PackageTemplate[] = [
  {
    id: "bathroom-refresh-basic",
    name: "Bathroom Refresh — Basic",
    group: "Bathroom",
    baseScope: "Keep layout; replace visible finishes and fixtures.",
    tiers: ["basic", "medium"],
    defaultTier: "basic",
    base: BATH_CORE,
    optional: ["heated-floor", "shower-niche", "shower-glass", "bath-wall-tile"],
    adjusters: ["projectSize", "vanity", "shower", "budgetTier"],
    exclusions: "Hidden plumbing; structural; rough-in changes",
  },
  {
    id: "bathroom-renovation-medium",
    name: "Bathroom Renovation — Medium",
    group: "Bathroom",
    baseScope: "Full visible renovation with shower/tub work.",
    tiers: ["medium", "luxury"],
    defaultTier: "medium",
    base: [...BATH_WET, ...BATH_CORE],
    optional: ["heated-floor", "shower-niche", "shower-bench", "tub", "tub-filler"],
    adjusters: ["projectSize", "shower", "tub", "vanity", "lighting"],
    exclusions: "Structural; major drain relocation; engineering",
  },
  {
    id: "bathroom-renovation-luxury",
    name: "Bathroom Renovation — Luxury",
    group: "Bathroom",
    baseScope: "Premium or custom bathroom.",
    tiers: ["luxury"],
    defaultTier: "luxury",
    base: [
      ...BATH_WET,
      ...BATH_CORE,
      "tub",
      "tub-filler",
      "heated-floor",
      "shower-niche",
      "shower-bench",
    ],
    optional: ["smart-controls"],
    adjusters: ["vanity", "shower", "tub", "lighting", "smartHome"],
    exclusions: "Structural/engineering unless scoped",
  },
  {
    id: "kitchen-refresh-basic",
    name: "Kitchen Refresh — Basic",
    group: "Kitchen",
    baseScope: "Keep cabinet layout; refresh surfaces and fixtures.",
    tiers: ["basic", "medium"],
    defaultTier: "basic",
    base: KITCHEN_CORE,
    optional: ["flooring", "kitchen-cabinets", "lighting"],
    adjusters: ["projectSize", "kitchenCabinets", "appliances", "flooring", "flooringMaterial"],
    exclusions: "Cabinet replacement; major plumbing/electrical",
  },
  {
    id: "kitchen-renovation-medium",
    name: "Kitchen Renovation — Medium",
    group: "Kitchen",
    baseScope:
      "New cabinetry and countertops with normal appliance and finish decisions.",
    tiers: ["medium", "luxury"],
    defaultTier: "medium",
    base: [
      "kitchen-cabinets",
      ...KITCHEN_SURFACES,
      ...APPLIANCES,
      ...KITCHEN_FIXTURES,
      "flooring",
      "paint",
    ],
    optional: ["island", "pantry", "wall-oven", "beverage-fridge"],
    adjusters: ["projectSize", "kitchenCabinets", "appliances", "flooring", "flooringMaterial", "lighting"],
    exclusions: "Structural/service upgrades",
  },
  {
    id: "kitchen-renovation-luxury",
    name: "Kitchen Renovation — Luxury",
    group: "Kitchen",
    baseScope: "Custom premium kitchen.",
    tiers: ["luxury"],
    defaultTier: "luxury",
    base: [
      "kitchen-cabinets",
      ...KITCHEN_SURFACES,
      ...APPLIANCES,
      ...KITCHEN_FIXTURES,
      "wall-oven",
      "beverage-fridge",
      "island",
      "pot-filler",
      "flooring",
    ],
    optional: ["pantry", "millwork", "smart-controls"],
    adjusters: ["kitchenCabinets", "appliances", "lighting", "smartHome"],
    exclusions: "Engineering/structural unless scoped",
  },
  {
    id: "basement-finish-basic",
    name: "Basement Finish — Basic",
    group: "Basement",
    baseScope: "Finish an existing basement. Washroom and kitchen optional.",
    tiers: ["basic", "medium"],
    defaultTier: "basic",
    base: [...INTERIOR_CORE, "drywall", "switches", "hvac-registers", "stairs"],
    optional: ["feature-wall", "built-ins"],
    adjusters: [
      "projectSize",
      "roomCount",
      "basementBathroom",
      "basementKitchen",
      "shower",
      "flooring",
      "flooringMaterial",
      "lighting",
    ],
    exclusions: "Structural; major HVAC/plumbing",
  },
  {
    id: "basement-finish-medium",
    name: "Basement Finish — Medium",
    group: "Basement",
    baseScope: "Full finish with bathroom and wet bar options.",
    tiers: ["medium", "luxury"],
    defaultTier: "medium",
    base: [
      ...INTERIOR_CORE,
      "drywall",
      "switches",
      "hvac-registers",
      "stairs",
    ],
    optional: ["built-ins", "fireplace", "shower-glass", "feature-wall"],
    adjusters: [
      "projectSize",
      "roomCount",
      "basementBathroom",
      "basementKitchen",
      "shower",
      "flooring",
      "flooringMaterial",
      "lighting",
    ],
    // What this package has always included, now stated as answers.
    defaultAdjusters: { basementBathroom: "full", basementKitchen: "wet-bar" },
    exclusions: "Underpinning; structural; foundation repair",
  },
  {
    id: "basement-finish-luxury",
    name: "Basement Finish — Luxury",
    group: "Basement",
    baseScope: "Premium entertainment and living basement.",
    tiers: ["luxury"],
    defaultTier: "luxury",
    base: [
      ...INTERIOR_CORE,
      "drywall",
      "switches",
      "stairs",
      "built-ins",
      "fireplace",
      "media-wall",
      "feature-wall",
    ],
    optional: ["smart-controls", "millwork"],
    adjusters: [
      "projectSize",
      "roomCount",
      "basementBathroom",
      "basementKitchen",
      "shower",
      "lighting",
      "smartHome",
    ],
    defaultAdjusters: { basementBathroom: "full", basementKitchen: "wet-bar" },
    exclusions: "Major structural work unless scoped",
  },
  {
    id: "whole-home-basic",
    name: "Full-Home Interior — Basic",
    group: "Full Home",
    baseScope: "Coordinated finishes without major layout changes.",
    tiers: ["basic", "medium"],
    defaultTier: "basic",
    base: [...INTERIOR_CORE, "window-coverings"],
    optional: ["feature-wall", "smart-controls"],
    adjusters: ["projectSize", "roomCount", "flooring", "flooringMaterial", "lighting", "smartHome"],
    exclusions: "Kitchen/bath full renovations; structural",
  },
  {
    id: "whole-home-medium",
    name: "Full-Home Interior — Medium",
    group: "Full Home",
    baseScope: "Multiple rooms plus kitchen and bathroom updates.",
    tiers: ["medium", "luxury"],
    defaultTier: "medium",
    base: [
      ...INTERIOR_CORE,
      "switches",
      "window-coverings",
      "kitchen-cabinets",
      ...KITCHEN_CORE,
      ...BATH_CORE.filter((i) => i !== "paint"),
      "hvac-controls",
    ],
    optional: ["built-ins", "feature-wall", "smart-controls"],
    adjusters: ["roomCount", "kitchenCabinets", "appliances", "flooring", "flooringMaterial", "lighting"],
    exclusions: "Major additions/structural/exterior",
  },
  {
    id: "whole-home-luxury",
    name: "Full-Home Interior — Luxury",
    group: "Full Home",
    baseScope: "Premium coordinated interior.",
    tiers: ["luxury"],
    defaultTier: "luxury",
    base: [
      ...INTERIOR_CORE,
      "switches",
      "window-coverings",
      "kitchen-cabinets",
      ...KITCHEN_SURFACES,
      ...APPLIANCES,
      ...KITCHEN_FIXTURES,
      ...BATH_CORE.filter((i) => i !== "paint"),
      ...BATH_WET,
      "millwork",
      "feature-wall",
      "smart-controls",
    ],
    optional: ["fireplace", "smart-security"],
    adjusters: ["roomCount", "kitchenCabinets", "appliances", "lighting", "smartHome"],
    exclusions: "Structural/addition unless separately scoped",
  },
  {
    id: "new-build-essential",
    name: "New Build — Essential",
    group: "New Build",
    baseScope: "Standard new residential finish selections.",
    tiers: ["basic", "medium"],
    defaultTier: "medium",
    base: [
      "exterior-doors",
      "windows",
      "roofing",
      "exterior-finish",
      "garage-door",
      ...INTERIOR_CORE,
      "kitchen-cabinets",
      ...KITCHEN_SURFACES,
      ...APPLIANCES,
      ...KITCHEN_FIXTURES,
      ...BATH_CORE.filter((i) => i !== "paint"),
      "hvac-controls",
      "stairs",
    ],
    optional: ["built-ins", "smart-controls", "window-coverings"],
    adjusters: ["projectSize", "roomCount", "appliances", "flooring", "windows", "smartHome"],
    exclusions: "Structural/engineering/code decisions",
    defaultAdjusters: { windows: "all", exterior: "full" },
  },
  {
    id: "new-build-premium",
    name: "New Build — Premium",
    group: "New Build",
    baseScope: "Premium new-build selections.",
    tiers: ["medium", "luxury"],
    defaultTier: "luxury",
    base: [
      "exterior-doors",
      "windows",
      "roofing",
      "exterior-finish",
      "siding",
      "garage-door",
      ...INTERIOR_CORE,
      "kitchen-cabinets",
      ...KITCHEN_SURFACES,
      ...APPLIANCES,
      ...KITCHEN_FIXTURES,
      ...BATH_CORE.filter((i) => i !== "paint"),
      ...BATH_WET,
      "hvac-controls",
      "stairs",
      "built-ins",
      "smart-controls",
    ],
    optional: ["fireplace", "millwork", "window-coverings"],
    adjusters: ["roomCount", "appliances", "windows", "lighting", "smartHome"],
    exclusions: "Engineering/structural unless scoped",
    defaultAdjusters: { windows: "all", exterior: "full", smartHome: "basic" },
  },
  {
    id: "new-build-luxury-custom",
    name: "New Build — Luxury Custom",
    group: "New Build",
    baseScope: "High customisation.",
    tiers: ["luxury"],
    defaultTier: "luxury",
    base: [
      "exterior-doors",
      "windows",
      "roofing",
      "exterior-finish",
      "siding",
      "garage-door",
      "exterior-lighting",
      ...INTERIOR_CORE,
      "kitchen-cabinets",
      ...KITCHEN_SURFACES,
      ...APPLIANCES,
      ...KITCHEN_FIXTURES,
      "wall-oven",
      "island",
      ...BATH_CORE.filter((i) => i !== "paint"),
      ...BATH_WET,
      "millwork",
      "stairs",
      "fireplace",
      "smart-controls",
      "smart-security",
      "hvac-controls",
    ],
    optional: ["outdoor-kitchen", "decking", "pergola"],
    adjusters: ["roomCount", "appliances", "lighting", "smartHome", "outdoor"],
    exclusions: "Architectural/engineering decisions",
    defaultAdjusters: { windows: "all", exterior: "full", smartHome: "advanced", outdoor: "deck" },
  },
  {
    id: "deck-basic",
    name: "Deck — Basic",
    group: "Outdoor",
    baseScope: "Simple deck.",
    tiers: ["basic", "medium"],
    defaultTier: "basic",
    base: ["decking", "deck-railing", "deck-stairs", "deck-skirting", "exterior-lighting"],
    optional: ["privacy-screen", "pergola"],
    adjusters: ["projectSize", "outdoor", "lighting"],
    exclusions: "Engineering/site work",
    defaultAdjusters: { outdoor: "deck" },
  },
  {
    id: "deck-premium",
    name: "Deck — Premium",
    group: "Outdoor",
    baseScope: "Composite or PVC deck with upgrades.",
    tiers: ["medium", "luxury"],
    defaultTier: "medium",
    base: [
      "decking",
      "deck-railing",
      "deck-stairs",
      "deck-skirting",
      "privacy-screen",
      "exterior-lighting",
    ],
    optional: ["pergola", "outdoor-kitchen"],
    adjusters: ["projectSize", "outdoor", "lighting"],
    exclusions: "Engineering/site work",
    defaultAdjusters: { outdoor: "deck-plus" },
  },
  {
    id: "exterior-basic",
    name: "Exterior Renovation — Basic",
    group: "Exterior",
    baseScope: "Cosmetic exterior refresh.",
    tiers: ["basic", "medium"],
    defaultTier: "basic",
    base: ["siding", "exterior-paint", "gutters", "exterior-lighting", "exterior-doors"],
    optional: ["garage-door"],
    adjusters: ["projectSize", "exterior", "lighting"],
    exclusions: "Structural/roof/window replacement",
    defaultAdjusters: { exterior: "cosmetic" },
  },
  {
    id: "exterior-full",
    name: "Exterior Renovation — Full",
    group: "Exterior",
    baseScope: "Coordinated envelope renovation.",
    tiers: ["medium", "luxury"],
    defaultTier: "medium",
    base: [
      "roofing",
      "siding",
      "windows",
      "exterior-doors",
      "gutters",
      "garage-door",
      "exterior-lighting",
      "exterior-paint",
    ],
    optional: ["smart-security"],
    adjusters: ["projectSize", "exterior", "windows", "lighting"],
    exclusions: "Structural remediation",
    defaultAdjusters: { exterior: "full", windows: "all" },
  },
  {
    id: "whole-home-flooring",
    name: "Full-Home Flooring",
    group: "Flooring",
    baseScope: "Flooring by room with coordinated transitions.",
    tiers: ["basic", "medium", "luxury"],
    defaultTier: "medium",
    base: ["flooring", "underlayment", "transitions", "stair-nosing", "baseboards"],
    optional: ["heated-floor"],
    adjusters: ["projectSize", "roomCount", "flooring", "flooringMaterial"],
    exclusions: "Subfloor repair",
    defaultAdjusters: { flooring: "mixed" },
  },
  {
    id: "laundry-renovation",
    name: "Laundry Renovation",
    group: "Utility",
    baseScope: "Laundry finishes, storage and fixtures.",
    tiers: ["basic", "medium", "luxury"],
    defaultTier: "medium",
    base: [
      "washer",
      "dryer",
      "laundry-sink",
      "bath-faucet",
      "laundry-cabinets",
      "countertop",
      "shelving",
      "flooring",
      "flooringMaterial",
      "lighting",
      "paint",
    ],
    optional: ["built-ins"],
    adjusters: ["projectSize", "appliances", "flooring", "flooringMaterial", "lighting"],
    exclusions: "Major plumbing/electrical",
  },
  {
    id: "mudroom-entry",
    name: "Mudroom / Entry",
    group: "Entry",
    baseScope: "Entry storage and finish package.",
    tiers: ["basic", "medium", "luxury"],
    defaultTier: "medium",
    base: ["entry-storage", "flooring", "paint", "lighting", "door-hardware"],
    optional: ["built-ins", "heated-floor"],
    adjusters: ["projectSize", "flooring", "flooringMaterial", "lighting"],
    exclusions: "Structural",
  },
  {
    id: "home-office",
    name: "Home Office",
    group: "Home Office",
    baseScope: "Office with built-ins and technology.",
    tiers: ["basic", "medium", "luxury"],
    defaultTier: "medium",
    base: [
      "desk",
      "built-ins",
      "shelving",
      "flooring",
      "paint",
      "lighting",
      "switches",
      "data",
      "window-coverings",
    ],
    optional: ["smart-controls"],
    adjusters: ["projectSize", "flooring", "flooringMaterial", "lighting", "smartHome"],
    exclusions: "Major electrical/structural",
  },
  {
    id: "primary-suite",
    name: "Primary Suite Renovation",
    group: "Bedroom + Ensuite",
    baseScope: "Bedroom, closet and ensuite coordinated.",
    tiers: ["medium", "luxury"],
    defaultTier: "medium",
    base: [
      "flooring",
      "paint",
      "lighting",
      "interior-doors",
      "closet-system",
      ...BATH_CORE.filter((i) => i !== "paint"),
      ...BATH_WET,
    ],
    optional: ["fireplace", "millwork", "heated-floor"],
    adjusters: ["projectSize", "vanity", "shower", "tub", "flooring", "flooringMaterial", "lighting"],
    exclusions: "Structural unless scoped",
  },
];

const TEMPLATES_BY_ID = new Map(PACKAGE_TEMPLATES.map((t) => [t.id, t]));

export function packageTemplate(id: string): PackageTemplate | undefined {
  return TEMPLATES_BY_ID.get(id);
}

export const TEMPLATE_GROUPS: ProjectGroup[] = [
  ...new Set(PACKAGE_TEMPLATES.map((t) => t.group)),
];

// ---------------------------------------------------------------------------
// Narrowing the 24 templates down to a shortlist
//
// Showing all 24 at once, across 12 headings, made the builder read as a
// wall of options — the contractor had to scan every group to find the
// three that could possibly apply. Two questions first ("inside or out",
// then how much of it) cut the list to between two and thirteen, which
// is a choice rather than a search.
// ---------------------------------------------------------------------------

/** First question: where the work is. */
export type WorkLocation = "indoor" | "outdoor";

/** Second question. Its options depend on the answer to the first. */
export type WorkExtent =
  | "room"
  | "level"
  | "property"
  | "outdoor-living"
  | "building-exterior";

const GROUP_PATH: Record<
  ProjectGroup,
  { location: WorkLocation; extent: WorkExtent }
> = {
  Bathroom: { location: "indoor", extent: "room" },
  Kitchen: { location: "indoor", extent: "room" },
  Utility: { location: "indoor", extent: "room" },
  Entry: { location: "indoor", extent: "room" },
  "Home Office": { location: "indoor", extent: "room" },
  "Bedroom + Ensuite": { location: "indoor", extent: "room" },
  // A basement is a storey, not a room: finishing one takes framing,
  // insulation and a floor's worth of everything, which is why it sits
  // with whole-level work rather than beside a laundry.
  Basement: { location: "indoor", extent: "level" },
  "Full Home": { location: "indoor", extent: "property" },
  "New Build": { location: "indoor", extent: "property" },
  Flooring: { location: "indoor", extent: "property" },
  Outdoor: { location: "outdoor", extent: "outdoor-living" },
  Exterior: { location: "outdoor", extent: "building-exterior" },
};

export const LOCATION_OPTIONS: {
  value: WorkLocation;
  label: string;
  description: string;
}[] = [
  {
    value: "indoor",
    label: "Inside the home",
    description: "Rooms, finishes, a full interior or a new build",
  },
  {
    value: "outdoor",
    label: "Outside the home",
    description: "Decks, patios, roofing, siding and windows",
  },
];

export const EXTENT_OPTIONS: Record<
  WorkLocation,
  { value: WorkExtent; label: string; description: string }[]
> = {
  indoor: [
    {
      value: "room",
      label: "By room",
      description: "A bathroom, kitchen, laundry, office or entry",
    },
    {
      value: "level",
      label: "A floor or the basement",
      description: "A whole storey finished out, top to bottom",
    },
    {
      value: "property",
      label: "The full house",
      description: "A complete interior, a new build, or flooring throughout",
    },
  ],
  outdoor: [
    {
      value: "outdoor-living",
      label: "Outdoor living space",
      description: "Decks and patios",
    },
    {
      value: "building-exterior",
      label: "The building exterior",
      description: "Roofing, siding, soffit and windows",
    },
  ],
};

/** The shortlist for a chosen path, in the file's own order. */
export function templatesForPath(
  location: WorkLocation,
  extent: WorkExtent,
): PackageTemplate[] {
  return PACKAGE_TEMPLATES.filter((t) => {
    const path = GROUP_PATH[t.group];
    return path.location === location && path.extent === extent;
  });
}

/** Which headings that shortlist needs, so the order stays the file's. */
export function groupsForPath(
  location: WorkLocation,
  extent: WorkExtent,
): ProjectGroup[] {
  return [...new Set(templatesForPath(location, extent).map((t) => t.group))];
}

/** The path a template sits on — used to reopen the builder on an edit. */
export function pathForTemplate(template: PackageTemplate): {
  location: WorkLocation;
  extent: WorkExtent;
} {
  return GROUP_PATH[template.group];
}
