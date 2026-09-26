/**
 * What a project is made of, stage by stage.
 *
 * The client's 26/09 lists, in his order and close to his wording. This
 * is not the package engine: nothing here is priced and nothing
 * generates a selection. It is the checklist a customer ticks to say
 * which parts of the job they need materials for, which then goes out
 * as a request.
 *
 * "Materials for a room" and "order by category" are the same thing
 * behind two doors — the client settled that. One list serves both.
 *
 * `categories` names the catalogue aisles a stage is filled from. Today
 * it only steers what we show against a stage; it is also the mapping to
 * use when the client's per-stage product lists arrive, so that a stage
 * can offer real stock instead of a text box.
 */

export interface ScopeStage {
  id: string;
  label: string;
  /** Catalogue category ids this stage is bought from. */
  categories: string[];
  /** Shown under the label where the stage needs explaining. */
  note?: string;
}

export interface ScopeVariant {
  id: string;
  label: string;
  /** Stages this variant needs on top of the project's own. */
  stages: ScopeStage[];
}

export interface ProjectScope {
  id: string;
  name: string;
  blurb: string;
  /** Asked before the checklist, when a job comes in more than one form. */
  variantLabel?: string;
  variants?: ScopeVariant[];
  stages: ScopeStage[];
}

function s(
  id: string,
  label: string,
  categories: string[],
  note?: string,
): ScopeStage {
  return { id, label, categories, note };
}

export const PROJECT_SCOPES: ProjectScope[] = [
  {
    id: "bathroom",
    name: "Bathroom",
    blurb: "A full bathroom, from the strip-out to the last bead of caulking.",
    stages: [
      s("demolition", "Demolition", ["tools", "hardware"], "Blades, bags and bins for the strip-out."),
      s("disposal", "Disposal and protection", ["tools", "paint"], "Floor protection, sheeting and tape."),
      s("framing", "Framing", ["lumber", "metal-framing"]),
      s("plumbing-rough", "Plumbing rough-in", ["plumbing"]),
      s("electrical-rough", "Electrical rough-in", ["electrical"]),
      s("ventilation", "Ventilation", ["electrical", "hardware"]),
      s("insulation", "Insulation", ["insulation"]),
      s("drywall", "Drywall", ["drywall"]),
      s("backer-board", "Cement board and backer board", ["drywall", "tile"]),
      s("waterproofing", "Waterproofing", ["adhesives", "tile"]),
      s("shower-system", "Shower or tub system", ["plumbing"]),
      s("tile", "Tile", ["tile"]),
      s("flooring", "Flooring", ["flooring", "tile"]),
      s("vanity", "Vanity", ["cabinetry", "bath"]),
      s("countertop", "Countertop", ["countertops"]),
      s("sink", "Sink", ["plumbing"]),
      s("faucets", "Faucets", ["plumbing"]),
      s("toilet", "Toilet", ["plumbing"]),
      s("mirror", "Mirror", ["bath", "hardware"]),
      s("lighting", "Lighting", ["electrical"]),
      s("exhaust-fan", "Exhaust fan", ["electrical"]),
      s("accessories", "Accessories", ["bath", "hardware"]),
      s("doors-trim", "Doors and trim", ["doors-windows", "lumber"]),
      s("paint", "Paint", ["paint"]),
      s("caulking", "Caulking", ["adhesives"]),
      s("grout-thinset", "Grout and thinset", ["tile", "adhesives"]),
      s("fasteners", "Fasteners", ["hardware"]),
      s("consumables", "Installation consumables", ["tools", "adhesives"]),
      s("cleanup", "Cleanup", ["tools"]),
    ],
  },
  {
    id: "basement",
    name: "Basement renovation",
    blurb: "Finishing a basement, including the suite it usually becomes.",
    stages: [
      s("demolition", "Demolition", ["tools", "hardware"]),
      s("moisture", "Moisture protection", ["insulation", "concrete"]),
      s("framing", "Framing", ["lumber", "metal-framing"]),
      s("insulation", "Insulation", ["insulation"]),
      s("vapour", "Vapour barrier", ["insulation"]),
      s("drywall", "Drywall", ["drywall"]),
      s("flooring", "Flooring", ["flooring"]),
      s("ceilings", "Ceilings", ["drywall", "metal-framing"]),
      s("electrical", "Electrical", ["electrical"]),
      s("plumbing", "Plumbing", ["plumbing"]),
      s("hvac", "HVAC", ["hardware", "electrical"]),
      s("bathroom", "Bathroom", ["plumbing", "bath", "tile"], "A basement washroom is usually part of the suite."),
      s("kitchenette", "Kitchenette or bar", ["cabinetry", "plumbing", "countertops"]),
      s("doors", "Doors", ["doors-windows"]),
      s("trim", "Trim", ["lumber"]),
      s("paint", "Paint", ["paint"]),
      s("fire-sound", "Fire and sound-rated assemblies", ["drywall", "insulation"]),
      s("finishing", "Finishing materials", ["hardware", "paint"]),
      s("consumables", "Consumables", ["tools", "adhesives", "hardware"]),
    ],
  },
  {
    id: "kitchen",
    name: "Kitchen renovation",
    blurb: "More than cabinets and a countertop.",
    stages: [
      s("demolition", "Demolition", ["tools", "hardware"]),
      s("layout", "Layout", ["tools"], "Measuring and setting out."),
      s("cabinets", "Cabinets", ["cabinetry"]),
      s("hardware", "Hardware", ["hardware", "cabinetry"]),
      s("countertop", "Countertop", ["countertops"]),
      s("sink", "Sink", ["plumbing"]),
      s("faucet", "Faucet", ["plumbing"]),
      s("drain-plumbing", "Drain and plumbing", ["plumbing"]),
      s("backsplash", "Backsplash", ["tile"]),
      s("appliances", "Appliances", ["appliances"]),
      s("hood", "Range hood and ventilation", ["appliances", "electrical"]),
      s("electrical", "Electrical", ["electrical"]),
      s("lighting", "Lighting", ["electrical"]),
      s("flooring", "Flooring", ["flooring"]),
      s("drywall", "Drywall", ["drywall"]),
      s("paint", "Paint", ["paint"]),
      s("trim", "Trim", ["lumber"]),
      s("cabinet-install", "Cabinet installation materials", ["hardware", "adhesives"]),
      s("counter-install", "Countertop installation materials", ["adhesives", "hardware"]),
      s("consumables", "Plumbing and electrical consumables", ["plumbing", "electrical"]),
    ],
  },
  {
    id: "flooring",
    name: "Flooring project",
    blurb: "One workflow per material, with the secondary materials it needs.",
    variantLabel: "Which floor are you laying?",
    variants: [
      {
        id: "laminate",
        label: "Laminate",
        stages: [s("laminate-boards", "Laminate boards", ["flooring"])],
      },
      {
        id: "hardwood",
        label: "Hardwood",
        stages: [s("hardwood-boards", "Hardwood boards", ["flooring"])],
      },
      {
        id: "engineered",
        label: "Engineered hardwood",
        stages: [s("engineered-boards", "Engineered boards", ["flooring"])],
      },
      {
        id: "tile",
        label: "Tile",
        stages: [
          s("floor-tile", "Floor tile", ["tile"]),
          s("grout", "Grout and thinset", ["tile", "adhesives"]),
        ],
      },
      {
        id: "carpet",
        label: "Carpet",
        stages: [
          s("carpet-roll", "Carpet", ["flooring"]),
          s("carpet-pad", "Carpet pad", ["flooring"]),
        ],
      },
    ],
    stages: [
      s("underlayment", "Underlayment", ["flooring", "insulation"]),
      s("transitions", "Transitions", ["flooring", "hardware"]),
      s("adhesives", "Adhesives", ["adhesives"]),
      s("levelling", "Levelling compound", ["concrete"]),
      s("moisture", "Moisture barrier", ["insulation"]),
      s("trims", "Trims", ["lumber", "flooring"]),
      s("fasteners", "Fasteners", ["hardware"]),
    ],
  },
  {
    id: "painting",
    name: "Interior painting",
    blurb: "Preparation, paint, and everything used to put it on.",
    stages: [
      s("prep", "Surface preparation", ["paint", "tools"]),
      s("repair", "Repair", ["drywall", "adhesives"]),
      s("primer", "Primer", ["paint"]),
      s("ceiling", "Ceiling", ["paint"]),
      s("walls", "Walls", ["paint"]),
      s("trim", "Trim", ["paint"]),
      s("doors", "Doors", ["paint"]),
      s("caulking", "Caulking", ["adhesives"]),
      s("paint", "Paint", ["paint"]),
      s("rollers", "Rollers", ["paint", "tools"]),
      s("brushes", "Brushes", ["paint", "tools"]),
      s("tape", "Tape", ["paint", "adhesives"]),
      s("plastic", "Plastic sheeting", ["paint", "tools"]),
      s("drop-cloths", "Drop cloths", ["paint", "tools"]),
      s("sanding", "Sanding", ["tools", "paint"]),
      s("cleanup", "Cleanup", ["tools"]),
    ],
  },
  {
    id: "drywall",
    name: "Drywall project",
    blurb:
      "Worked out from the room rather than guessed: the dimensions give the board count, and the board count gives the rest.",
    stages: [
      s("boards", "Board", ["drywall"], "Quantity comes from the room dimensions."),
      s("screws", "Screws", ["hardware", "drywall"]),
      s("tape", "Tape", ["drywall"]),
      s("compound", "Joint compound", ["drywall"]),
      s("corner-bead", "Corner bead", ["drywall", "metal-framing"]),
      s("backing", "Backing", ["lumber", "metal-framing"]),
      s("primer", "Primer", ["paint"]),
      s("finishing", "Finishing supplies", ["tools", "drywall"]),
    ],
  },
  {
    id: "deck",
    name: "Deck",
    blurb: "From the footings up.",
    stages: [
      s("layout", "Layout", ["tools"]),
      s("footings", "Footings", ["concrete"]),
      s("posts", "Posts", ["lumber"]),
      s("beams", "Beams", ["lumber"]),
      s("joists", "Joists", ["lumber"]),
      s("blocking", "Blocking", ["lumber"]),
      s("decking", "Decking", ["lumber"]),
      s("fascia", "Fascia", ["lumber"]),
      s("railings", "Railings", ["lumber", "hardware"]),
      s("stairs", "Stairs", ["lumber", "hardware"]),
      s("hardware", "Hardware", ["hardware"]),
      s("joist-protection", "Joist protection", ["adhesives", "hardware"]),
      s("concrete", "Concrete", ["concrete"]),
      s("fasteners", "Fasteners", ["hardware"]),
      s("finishing", "Finishing", ["paint"]),
    ],
  },
  {
    id: "fence",
    name: "Fence",
    blurb: "Posts, panels and the gate.",
    stages: [
      s("layout", "Layout", ["tools"]),
      s("posts", "Posts", ["lumber"]),
      s("concrete", "Concrete", ["concrete"]),
      s("gravel", "Gravel", ["concrete"]),
      s("rails", "Rails", ["lumber"]),
      s("boards", "Fence boards or panels", ["lumber"]),
      s("gates", "Gates", ["lumber", "hardware"]),
      s("hinges", "Hinges", ["hardware"]),
      s("latches", "Latches", ["hardware"]),
      s("post-caps", "Post caps", ["lumber", "hardware"]),
      s("fasteners", "Fasteners", ["hardware"]),
      s("removal", "Removal and disposal", ["tools"]),
    ],
  },
  {
    id: "full-home",
    name: "Full-home renovation",
    blurb: "Every room at once. Tick the parts you are doing.",
    stages: [
      s("kitchen", "Kitchen", ["cabinetry", "countertops", "appliances", "plumbing"]),
      s("bathrooms", "Bathrooms", ["plumbing", "bath", "tile"]),
      s("basement", "Basement", ["lumber", "drywall", "insulation"]),
      s("flooring", "Flooring", ["flooring", "tile"]),
      s("painting", "Painting", ["paint"]),
      s("doors", "Doors", ["doors-windows", "hardware"]),
      s("electrical", "Electrical", ["electrical"]),
    ],
  },
];

export function projectScope(id: string): ProjectScope | undefined {
  return PROJECT_SCOPES.find((p) => p.id === id);
}

/** Every stage for a project, with the chosen variant's stages first. */
export function stagesFor(
  project: ProjectScope,
  variantId?: string,
): ScopeStage[] {
  const variant = project.variants?.find((v) => v.id === variantId);
  return [...(variant?.stages ?? []), ...project.stages];
}
