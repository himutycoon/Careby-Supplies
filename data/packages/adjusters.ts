/**
 * The 16 adjusters from the Adjusters sheet.
 *
 * An adjuster answers "how much of this job is there", and its effects
 * are data, not code: each choice can add items, remove items, or change
 * how many of an item the customer chooses. The scope engine applies
 * them; nothing here knows about React or the database.
 */

export interface AdjusterChoice {
  value: string;
  label: string;
  /** Selection-item ids this choice brings into scope. */
  adds?: string[];
  /** Selection-item ids this choice takes out of scope. */
  removes?: string[];
  /** Multiplies the quantity of these items (e.g. a double vanity). */
  multiply?: { items: string[]; by: number };
  /** Multiplies quantity of every item in scope (project size, rooms). */
  multiplyAll?: number;
  /**
   * Coordination the contractor must arrange. Surfaced as a warning
   * rather than a selection — the Package Rules sheet says rough-in and
   * specification items stay hidden from the customer.
   */
  flags?: string[];
}

export interface Adjuster {
  id: string;
  label: string;
  /** From the sheet's Effect column, shown to the contractor. */
  effect: string;
  choices: AdjusterChoice[];
  defaultValue: string;
}

export const ADJUSTERS: Adjuster[] = [
  {
    id: "budgetTier",
    label: "Budget tier",
    effect: "Changes product tier, allowances and optional features",
    defaultValue: "medium",
    choices: [
      { value: "basic", label: "Basic" },
      { value: "medium", label: "Medium" },
      { value: "luxury", label: "Luxury" },
    ],
  },
  {
    id: "projectSize",
    label: "Project size",
    effect: "Changes quantities and selection count",
    defaultValue: "standard",
    choices: [
      { value: "small", label: "Small", multiplyAll: 0.75 },
      { value: "standard", label: "Standard" },
      { value: "large", label: "Large", multiplyAll: 1.5 },
      { value: "custom", label: "Custom", multiplyAll: 2 },
    ],
  },
  {
    id: "roomCount",
    label: "Room count",
    effect: "Adds or removes room selection groups",
    defaultValue: "1",
    choices: [
      { value: "1", label: "1 room" },
      { value: "2", label: "2 rooms", multiplyAll: 1.8 },
      { value: "3+", label: "3 or more", multiplyAll: 2.6 },
      { value: "whole-home", label: "Full home", multiplyAll: 3.5 },
    ],
  },
  {
    id: "layoutChange",
    label: "Layout change",
    effect:
      "Flags additional plumbing, electrical and structural coordination",
    defaultValue: "no",
    choices: [
      { value: "no", label: "No change" },
      {
        value: "minor",
        label: "Minor",
        flags: ["Minor plumbing and electrical relocation to coordinate."],
      },
      {
        value: "major",
        label: "Major",
        flags: [
          "Major layout change: structural, plumbing and electrical coordination required.",
          "Confirm whether engineering or permits are needed — these are excluded from the package.",
        ],
      },
    ],
  },
  {
    id: "shower",
    label: "Shower",
    effect: "Adds shower base, tile, valve, glass, drain, niche and bench",
    defaultValue: "replace",
    choices: [
      {
        value: "no",
        label: "No shower",
        removes: [
          "shower-valve",
          "showerhead",
          "shower-base",
          "shower-glass",
          "shower-niche",
          "shower-bench",
          "bath-wall-tile",
        ],
      },
      { value: "replace", label: "Replace existing" },
      {
        value: "new",
        label: "New shower",
        adds: ["shower-valve", "showerhead", "shower-base", "bath-wall-tile", "shower-glass", "shower-niche"],
        flags: ["New shower location needs drain and valve rough-in."],
      },
      {
        value: "luxury",
        label: "Luxury shower",
        adds: [
          "shower-valve",
          "showerhead",
          "shower-base",
          "bath-wall-tile",
          "shower-glass",
          "shower-niche",
          "shower-bench",
        ],
      },
    ],
  },
  {
    id: "tub",
    label: "Tub",
    effect: "Adds tub, filler, drain and surround selections",
    defaultValue: "no",
    choices: [
      { value: "no", label: "No tub", removes: ["tub", "tub-filler"] },
      { value: "standard", label: "Standard", adds: ["tub"] },
      {
        value: "freestanding",
        label: "Freestanding",
        adds: ["tub", "tub-filler"],
        flags: ["Freestanding tub needs floor-mounted filler rough-in."],
      },
      { value: "luxury", label: "Luxury", adds: ["tub", "tub-filler"] },
    ],
  },
  {
    id: "vanity",
    label: "Vanity",
    effect: "Controls cabinet, top, sink, faucet and mirror",
    defaultValue: "single",
    choices: [
      {
        value: "no",
        label: "No vanity",
        removes: ["vanity", "vanity-top", "bath-sink", "bath-faucet", "mirror"],
      },
      { value: "single", label: "Single" },
      {
        value: "double",
        label: "Double",
        adds: ["vanity", "vanity-top", "bath-sink", "bath-faucet", "mirror"],
        multiply: {
          items: ["bath-sink", "bath-faucet", "mirror"],
          by: 2,
        },
      },
      {
        value: "custom",
        label: "Custom",
        adds: ["vanity", "vanity-top", "bath-sink", "bath-faucet", "mirror", "millwork"],
      },
    ],
  },
  {
    id: "kitchenCabinets",
    label: "Kitchen cabinets",
    effect: "Controls the cabinet selection workflow",
    defaultValue: "replace",
    choices: [
      { value: "refresh", label: "Refresh fronts", removes: ["kitchen-cabinets"], adds: ["cabinet-hardware"] },
      { value: "replace", label: "Replace", adds: ["kitchen-cabinets", "cabinet-hardware"] },
      {
        value: "custom",
        label: "Custom",
        adds: ["kitchen-cabinets", "cabinet-hardware", "millwork", "pantry"],
      },
    ],
  },
  {
    id: "appliances",
    label: "Appliances",
    effect: "Controls the appliance list and allowance",
    defaultValue: "standard",
    choices: [
      {
        value: "existing",
        label: "Keep existing",
        removes: ["refrigerator", "range", "hood", "dishwasher", "microwave", "wall-oven", "beverage-fridge"],
      },
      { value: "standard", label: "Standard" },
      { value: "premium", label: "Premium", adds: ["wall-oven"] },
      {
        value: "integrated",
        label: "Integrated",
        adds: ["wall-oven", "beverage-fridge"],
        flags: ["Integrated appliances need cabinet panels specified with the cabinetry order."],
      },
    ],
  },
  {
    id: "flooring",
    label: "Flooring",
    effect: "Generates flooring by room",
    defaultValue: "one-type",
    choices: [
      {
        value: "existing",
        label: "Keep existing",
        removes: ["flooring", "underlayment", "transitions", "stair-nosing"],
      },
      { value: "one-type", label: "One type throughout" },
      {
        value: "mixed",
        label: "Mixed by room",
        adds: ["flooring", "underlayment", "transitions"],
        multiply: { items: ["flooring", "transitions"], by: 2 },
      },
    ],
  },
  {
    id: "tile",
    label: "Tile",
    effect: "Controls tile, grout and trim selections",
    defaultValue: "partial",
    choices: [
      {
        value: "none",
        label: "None",
        removes: ["bath-wall-tile", "bath-floor-tile", "backsplash", "grout", "shower-niche"],
      },
      { value: "partial", label: "Partial" },
      { value: "full", label: "Full height", adds: ["bath-wall-tile", "grout"] },
      {
        value: "feature",
        label: "Feature tile",
        adds: ["bath-wall-tile", "grout", "feature-wall"],
      },
    ],
  },
  {
    id: "lighting",
    label: "Lighting",
    effect: "Controls fixture and control selections",
    defaultValue: "standard",
    choices: [
      { value: "existing", label: "Keep existing", removes: ["lighting", "switches"] },
      { value: "standard", label: "Standard" },
      { value: "premium", label: "Premium", adds: ["lighting", "switches"] },
      {
        value: "smart",
        label: "Smart",
        adds: ["lighting", "switches", "smart-controls"],
      },
    ],
  },
  {
    id: "windows",
    label: "Windows",
    effect: "Generates window selections",
    defaultValue: "existing",
    choices: [
      { value: "existing", label: "Keep existing", removes: ["windows"] },
      { value: "some", label: "Some windows", adds: ["windows"] },
      {
        value: "all",
        label: "All windows",
        adds: ["windows"],
        multiply: { items: ["windows"], by: 2 },
      },
    ],
  },
  {
    id: "exterior",
    label: "Exterior",
    effect: "Controls siding, roof, windows, doors and gutters",
    defaultValue: "none",
    choices: [
      {
        value: "none",
        label: "None",
        removes: ["siding", "roofing", "gutters", "exterior-doors", "garage-door", "exterior-paint", "exterior-finish"],
      },
      { value: "cosmetic", label: "Cosmetic", adds: ["exterior-paint", "exterior-lighting"] },
      {
        value: "full",
        label: "Full envelope",
        adds: ["siding", "roofing", "gutters", "exterior-doors", "garage-door"],
      },
    ],
  },
  {
    id: "smartHome",
    label: "Smart home",
    effect: "Adds smart switches, thermostat, locks, cameras and data",
    defaultValue: "none",
    choices: [
      { value: "none", label: "None", removes: ["smart-controls", "smart-security", "data"] },
      { value: "basic", label: "Basic", adds: ["smart-controls"] },
      {
        value: "advanced",
        label: "Advanced",
        adds: ["smart-controls", "smart-security", "data"],
      },
    ],
  },
  {
    id: "outdoor",
    label: "Outdoor",
    effect: "Adds deck, railing, privacy and outdoor selections",
    defaultValue: "none",
    choices: [
      {
        value: "none",
        label: "None",
        removes: ["decking", "deck-railing", "deck-stairs", "deck-skirting", "privacy-screen", "pergola", "outdoor-kitchen"],
      },
      { value: "deck", label: "Deck", adds: ["decking", "deck-railing", "deck-stairs"] },
      {
        value: "deck-plus",
        label: "Deck and features",
        adds: ["decking", "deck-railing", "deck-stairs", "deck-skirting", "privacy-screen", "pergola", "exterior-lighting"],
      },
    ],
  },
];

const BY_ID = new Map(ADJUSTERS.map((a) => [a.id, a]));

export function adjuster(id: string): Adjuster | undefined {
  return BY_ID.get(id);
}

/** Every adjuster at its default, as a starting answer set. */
export function defaultAdjusterAnswers(): Record<string, string> {
  return Object.fromEntries(ADJUSTERS.map((a) => [a.id, a.defaultValue]));
}
