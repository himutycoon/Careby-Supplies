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
  | "Whole Home"
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

const BATH_CORE = [
  "toilet",
  "vanity",
  "vanity-top",
  "bath-sink",
  "bath-faucet",
  "mirror",
  "bath-floor-tile",
  "grout",
  "bath-lighting",
  "paint",
  "bath-accessories",
];

const BATH_WET = [
  "shower-valve",
  "showerhead",
  "shower-base",
  "bath-wall-tile",
  "shower-glass",
  "exhaust-fan",
];

const KITCHEN_CORE = [
  "countertop",
  "kitchen-sink",
  "kitchen-faucet",
  "backsplash",
  "cabinet-hardware",
  "kitchen-lighting",
  "paint",
];

const APPLIANCES = ["refrigerator", "range", "hood", "dishwasher", "microwave"];

const INTERIOR_CORE = [
  "flooring",
  "paint",
  "baseboards",
  "interior-doors",
  "door-hardware",
  "lighting",
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
    adjusters: ["projectSize", "vanity", "shower", "tile", "budgetTier"],
    exclusions: "Hidden plumbing; structural; rough-in changes",
  },
  {
    id: "bathroom-renovation-medium",
    name: "Bathroom Renovation — Medium",
    group: "Bathroom",
    baseScope: "Full visible renovation with shower/tub work.",
    tiers: ["medium", "luxury"],
    defaultTier: "medium",
    base: [...BATH_CORE, ...BATH_WET],
    optional: ["heated-floor", "shower-niche", "shower-bench", "tub", "tub-filler"],
    adjusters: ["projectSize", "shower", "tub", "vanity", "tile", "lighting"],
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
      ...BATH_CORE,
      ...BATH_WET,
      "tub",
      "tub-filler",
      "heated-floor",
      "shower-niche",
      "shower-bench",
    ],
    optional: ["smart-controls"],
    adjusters: ["vanity", "shower", "tub", "tile", "lighting", "smartHome"],
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
    adjusters: ["projectSize", "kitchenCabinets", "appliances", "flooring"],
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
    base: ["kitchen-cabinets", ...KITCHEN_CORE, ...APPLIANCES, "flooring"],
    optional: ["island", "pantry", "wall-oven", "beverage-fridge"],
    adjusters: ["projectSize", "kitchenCabinets", "appliances", "flooring", "lighting"],
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
      ...KITCHEN_CORE,
      ...APPLIANCES,
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
    baseScope: "Finish existing basement without wet areas.",
    tiers: ["basic", "medium"],
    defaultTier: "basic",
    base: [...INTERIOR_CORE, "drywall", "switches", "hvac-registers", "stairs"],
    optional: ["feature-wall", "built-ins"],
    adjusters: ["projectSize", "roomCount", "flooring", "lighting"],
    exclusions: "Bathroom; wet bar; structural; major HVAC/plumbing",
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
      ...BATH_CORE.filter((i) => i !== "paint"),
      "wet-bar",
    ],
    optional: ["built-ins", "fireplace", "shower-glass"],
    adjusters: ["projectSize", "roomCount", "shower", "flooring", "lighting"],
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
      ...BATH_CORE.filter((i) => i !== "paint"),
      ...BATH_WET,
      "wet-bar",
      "beverage-fridge",
      "built-ins",
      "fireplace",
      "media-wall",
      "feature-wall",
    ],
    optional: ["smart-controls", "millwork"],
    adjusters: ["projectSize", "roomCount", "lighting", "smartHome"],
    exclusions: "Major structural work unless scoped",
  },
  {
    id: "whole-home-basic",
    name: "Whole-Home Interior — Basic",
    group: "Whole Home",
    baseScope: "Coordinated finishes without major layout changes.",
    tiers: ["basic", "medium"],
    defaultTier: "basic",
    base: [...INTERIOR_CORE, "window-coverings"],
    optional: ["feature-wall", "smart-controls"],
    adjusters: ["projectSize", "roomCount", "flooring", "lighting", "smartHome"],
    exclusions: "Kitchen/bath full renovations; structural",
  },
  {
    id: "whole-home-medium",
    name: "Whole-Home Interior — Medium",
    group: "Whole Home",
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
    adjusters: ["roomCount", "kitchenCabinets", "appliances", "flooring", "lighting"],
    exclusions: "Major additions/structural/exterior",
  },
  {
    id: "whole-home-luxury",
    name: "Whole-Home Interior — Luxury",
    group: "Whole Home",
    baseScope: "Premium coordinated interior.",
    tiers: ["luxury"],
    defaultTier: "luxury",
    base: [
      ...INTERIOR_CORE,
      "switches",
      "window-coverings",
      "kitchen-cabinets",
      ...KITCHEN_CORE,
      ...APPLIANCES,
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
      ...KITCHEN_CORE,
      ...APPLIANCES,
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
      ...KITCHEN_CORE,
      ...APPLIANCES,
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
      ...KITCHEN_CORE,
      ...APPLIANCES,
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
    name: "Whole-Home Flooring",
    group: "Flooring",
    baseScope: "Flooring by room with coordinated transitions.",
    tiers: ["basic", "medium", "luxury"],
    defaultTier: "medium",
    base: ["flooring", "underlayment", "transitions", "stair-nosing", "baseboards"],
    optional: ["heated-floor"],
    adjusters: ["projectSize", "roomCount", "flooring"],
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
      "lighting",
      "paint",
    ],
    optional: ["built-ins"],
    adjusters: ["projectSize", "appliances", "flooring", "lighting"],
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
    adjusters: ["projectSize", "flooring", "lighting"],
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
    adjusters: ["projectSize", "flooring", "lighting", "smartHome"],
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
    adjusters: ["projectSize", "vanity", "shower", "tub", "flooring", "lighting"],
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
