/**
 * The 15 adjusters from the Adjusters sheet, with the shower question
 * rewritten to the client's 26/09 correction.
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
  /**
   * Narrows which products an item offers.
   *
   * "Flooring" as a requirement is useless to a customer who has already
   * said hardwood: they want to see hardwood, not every floor covering
   * in the aisle. This replaces the item's own keywords rather than
   * adding to them, so "hardwood" does not still match carpet.
   */
  setKeywords?: { items: string[]; keywords: string[] };
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
    /*
     * Shower type, per the client's 26/09 correction: the three kinds of
     * shower a customer actually buys, not "replace / new / luxury",
     * which described the labour rather than the materials.
     *
     * What differs between them is the material list, which is why each
     * choice states its own adds and removes rather than relying on the
     * template:
     *
     *   Pan type   a tiled shower built on site — everything, including
     *              the drain and the stone.
     *   Walk-in    curbless with glass — drain, no stone.
     *   Tray       a prefabricated tray, which arrives with its drain
     *              fitted — no separate drain, no stone.
     */
    id: "shower",
    label: "Shower type",
    effect: "Sets base, drain, stone, glass and niche to suit the shower",
    defaultValue: "pan",
    choices: [
      {
        value: "pan",
        label: "Pan type",
        adds: [
          "shower-valve",
          "showerhead",
          "shower-base",
          "shower-drain",
          "shower-stone",
          "shower-glass",
          "shower-niche",
          "bath-wall-tile",
        ],
      },
      {
        value: "walk-in",
        label: "Walk-in",
        adds: [
          "shower-valve",
          "showerhead",
          "shower-base",
          "shower-drain",
          "shower-glass",
          "shower-niche",
          "bath-wall-tile",
        ],
        removes: ["shower-stone"],
      },
      {
        value: "tray",
        label: "Shower tray",
        adds: [
          "shower-valve",
          "showerhead",
          "shower-base",
          "shower-glass",
          "shower-niche",
          "bath-wall-tile",
        ],
        // The tray ships with its own drain, and nothing is stone.
        removes: ["shower-drain", "shower-stone"],
      },
      {
        value: "no",
        label: "No shower",
        removes: [
          "shower-valve",
          "showerhead",
          "shower-base",
          "shower-drain",
          "shower-stone",
          "shower-glass",
          "shower-niche",
          "shower-bench",
          "bath-wall-tile",
        ],
      },
    ],
  },
  {
    id: "tub",
    label: "Add a tub",
    effect: "An add-on on top of the shower, not an alternative to it",
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
    /*
     * A finished basement in Canada is usually a secondary suite, so the
     * washroom and the kitchen are decisions the customer makes rather
     * than something a tier decides for them. They used to be hard-coded:
     * Medium always carried a bathroom and a wet bar, Basic could not
     * have either, and nobody could ask for a full second kitchen.
     *
     * Each template keeps its old behaviour through defaultAdjusters, so
     * this adds the choice without moving what the packages already were.
     */
    id: "basementBathroom",
    label: "Basement washroom",
    effect: "Adds a powder room or a full washroom to the basement",
    defaultValue: "none",
    choices: [
      { value: "none", label: "No washroom",
        removes: [
          "toilet",
          "vanity",
          "vanity-top",
          "bath-sink",
          "bath-faucet",
          "mirror",
          "bath-floor-tile",
          "grout",
          "bath-lighting",
          "bath-accessories",
          "caulking",
          "bath-trim",
          "exhaust-fan",
          "shower-valve",
          "showerhead",
          "shower-base",
          "shower-drain",
          "shower-stone",
          "shower-glass",
          "shower-niche",
          "shower-bench",
          "bath-wall-tile",
          "tub",
          "tub-filler",
        ], },
      {
        value: "powder",
        label: "Powder room (2-piece)",
        adds: [
          "toilet",
          "bath-sink",
          "bath-faucet",
          "vanity",
          "vanity-top",
          "mirror",
          "bath-lighting",
          "exhaust-fan",
          "bath-floor-tile",
          "grout",
          "caulking",
          "bath-trim",
        ],
        removes: [
          "bath-accessories",
          "shower-valve",
          "showerhead",
          "shower-base",
          "shower-drain",
          "shower-stone",
          "shower-glass",
          "shower-niche",
          "shower-bench",
          "bath-wall-tile",
          "tub",
          "tub-filler",
        ],
        flags: ["Basement washroom needs drain, vent and supply rough-in."],
      },
      {
        value: "full",
        label: "Full washroom (3-piece)",
        adds: [
          "shower-drain",
          "toilet",
          "bath-sink",
          "bath-faucet",
          "vanity",
          "vanity-top",
          "mirror",
          "bath-lighting",
          "exhaust-fan",
          "bath-floor-tile",
          "grout",
          "caulking",
          "bath-trim",
          "shower-valve",
          "showerhead",
          "shower-base",
          "shower-glass",
          "shower-niche",
          "bath-wall-tile",
        ],
        flags: ["Basement washroom needs drain, vent and supply rough-in."],
      },
    ],
  },
  {
    id: "basementKitchen",
    label: "Basement kitchen",
    effect: "Adds a wet bar or a full second kitchen",
    defaultValue: "none",
    choices: [
      { value: "none", label: "Neither",
        removes: [
          "wet-bar",
          "beverage-fridge",
          "kitchen-cabinets",
          "cabinet-hardware",
          "countertop",
          "backsplash",
          "kitchen-sink",
          "kitchen-faucet",
          "kitchen-lighting",
          "refrigerator",
          "range",
          "hood",
          "dishwasher",
        ], },
      {
        value: "wet-bar",
        label: "Wet bar",
        adds: ["wet-bar", "beverage-fridge"],
        removes: [
          "kitchen-cabinets",
          "cabinet-hardware",
          "countertop",
          "backsplash",
          "kitchen-sink",
          "kitchen-faucet",
          "kitchen-lighting",
          "refrigerator",
          "range",
          "hood",
        ],
      },
      {
        value: "full",
        label: "Full kitchen",
        adds: [
          "kitchen-cabinets",
          "cabinet-hardware",
          "countertop",
          "backsplash",
          "kitchen-sink",
          "kitchen-faucet",
          "kitchen-lighting",
          "refrigerator",
          "range",
          "hood",
        ],
        flags: [
          "Second kitchen: confirm the suite is permitted, and that venting, gas and panel capacity allow it.",
        ],
      },
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
    /*
     * What the floor is made of, which the site did not ask. The old
     * flooring question asks how much floor there is; this asks which
     * one, and the client lists five (six with engineered) as separate
     * workflows.
     *
     * The answer does two things: it narrows the products offered for
     * "Flooring" to that material, and it brings in the secondary
     * materials that material needs -- underlayment, transitions,
     * levelling, moisture barrier, adhesive, fasteners -- while taking
     * out the ones it does not. Hardwood is nailed and wants no
     * adhesive; carpet is stretched over pad and wants neither.
     */
    id: "flooringMaterial",
    label: "Flooring material",
    effect: "Sets the floor covering and its secondary materials",
    defaultValue: "laminate",
    choices: [
      {
        value: "tile",
        label: "Tile",
        setKeywords: { items: ["flooring"], keywords: ["tile", "porcelain", "ceramic"] },
        adds: ["floor-adhesive", "floor-levelling", "moisture-barrier", "grout"],
        removes: ["underlayment", "transitions", "floor-fasteners"],
      },
      {
        value: "hardwood",
        label: "Hardwood",
        setKeywords: { items: ["flooring"], keywords: ["hardwood", "solid", "oak", "maple"] },
        adds: ["floor-fasteners", "moisture-barrier", "transitions"],
        removes: ["underlayment", "floor-levelling", "floor-adhesive"],
      },
      {
        value: "engineered",
        label: "Engineered hardwood",
        setKeywords: { items: ["flooring"], keywords: ["engineered", "hardwood"] },
        adds: ["underlayment", "transitions", "floor-adhesive"],
        removes: ["floor-levelling", "moisture-barrier", "floor-fasteners"],
      },
      {
        value: "laminate",
        label: "Laminate",
        setKeywords: { items: ["flooring"], keywords: ["laminate"] },
        adds: ["underlayment", "moisture-barrier", "transitions"],
        removes: ["floor-levelling", "floor-adhesive", "floor-fasteners"],
      },
      {
        value: "vinyl",
        label: "Vinyl",
        setKeywords: { items: ["flooring"], keywords: ["vinyl", "lvp", "luxury vinyl", "plank"] },
        adds: ["underlayment", "floor-levelling", "transitions"],
        removes: ["moisture-barrier", "floor-adhesive", "floor-fasteners"],
      },
      {
        value: "carpet",
        label: "Carpet",
        setKeywords: { items: ["flooring"], keywords: ["carpet", "broadloom"] },
        adds: ["underlayment", "floor-fasteners", "transitions"],
        removes: ["floor-levelling", "moisture-barrier", "floor-adhesive"],
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
