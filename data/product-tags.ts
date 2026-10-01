/**
 * What the shop calls things, against what a job calls them.
 *
 * The catalogue's tags came out of the supplier's spreadsheet, so they
 * are the shop's own words: "sealants", "pins & nails", "pot light".
 * The checklists and package items are written in the words of the job:
 * "waterproofing", "fasteners", "bathroom lighting". Both are correct
 * and neither can be derived from the other, so this file is the bridge
 * — written by hand, because somebody has to decide that waterproofing
 * is bought out of membranes, sealants and flashing.
 *
 * Before this, a stage asked for products tagged "waterproofing" and no
 * product has ever carried that tag, so the tag tier never fired once
 * and every stage fell through to its whole aisle — "Faucets" showed
 * 897 plumbing items, of which five are faucets.
 *
 * NOT MAPPING IS AN ANSWER. An id absent here falls back to its
 * categories, which is what happens today and is honest. A wrong
 * mapping is worse than none: it puts the wrong products in front of
 * someone with nothing on screen to tell them it went wrong. So
 * "Countertop", "Carpet" and "Appliances" are missing below, because
 * the catalogue has no tag that means them. Paint is missing for a
 * subtler reason: the sheet types paint TOOLS and spray cans, so
 * mapping the paint stage to "paint tool" would offer rollers to
 * somebody buying paint. The paint aisle answers that better.
 *
 * Tags are matched with "any of", not "all of" — a stage is satisfied
 * by a product carrying any one of its tags.
 *
 * Two pairs read like typos because they are: the spreadsheet contains
 * both "hammer" and "hammers", and both "thermostat and dectectors" and
 * "thermostat and detectors". Both spellings are listed wherever they
 * matter rather than silently corrected, because the tag on the product
 * row is what the query has to match. Fixing them is an admin job, in
 * the tag box, on the products themselves.
 */

/** Looks up tags for an id, giving an empty list rather than undefined. */
export function tagsFor(
  map: Record<string, string[]>,
  id: string | null | undefined,
): string[] {
  if (!id) return [];
  return map[id] ?? [];
}

/**
 * Checklist stage id → the shop's words for it.
 *
 * Stage ids repeat across projects on purpose: "demolition" means the
 * same thing in a bathroom and a basement, so it is mapped once.
 */
export const STAGE_TAGS: Record<string, string[]> = {
  accessories: ["bathroom accessories", "toilet and accessories"],
  adhesives: [
    "adhesives",
    "adhesives & sealants accessories",
    "tile glue",
    "pipe cement and primer",
  ],
  backsplash: ["tile"],
  bathroom: [
    "bathroom accessories",
    "bathroom fan",
    "washroom drains",
    "toilet and accessories",
    "shower glass",
    "shower panel",
  ],
  bathrooms: [
    "bathroom accessories",
    "bathroom fan",
    "washroom drains",
    "toilet and accessories",
    "shower glass",
    "shower panel",
  ],
  beams: ["lvl beam"],
  blocking: ["framing lumbers", "pressure treated wood"],
  boards: ["osb", "plywoods"],
  brushes: ["paint tool"],
  "cabinet-install": ["cabinet hinge", "screws", "anchors"],
  cabinets: ["cabinet hinge"],
  caulking: ["sealants", "adhesives & sealants accessories"],
  ceiling: ["ceiling tiles", "grid and trim", "drywall grid system"],
  ceilings: ["ceiling tiles", "grid and trim", "drywall grid system"],
  compound: ["compund", "drywall compound"],
  concrete: ["cement", "mix", "foundation", "concrete reinforcement materials"],
  consumables: ["tape", "pins & nails", "screws"],
  "corner-bead": ["drywall joint tape"],
  "counter-install": ["sealants", "adhesives"],
  decking: ["pressure treated wood", "fence and decking accessories"],
  demolition: ["blades", "cutting discs", "hammers", "hammer"],
  disposal: ["tape"],
  doors: ["interior moulded door", "exterior door", "closet door"],
  "doors-trim": ["interior moulded door", "door moulding", "door accessories"],
  "drain-plumbing": [
    "washroom drains",
    "floor drain",
    "kitchen drains",
    "pvc dwv",
    "flexible connection parts",
  ],
  drywall: ["drywall joint tape", "compund", "drywall grid system", "screws"],
  electrical: [
    "receptacle",
    "switch",
    "electric box",
    "electrical accessories",
    "electrical wire and cable",
  ],
  "electrical-rough": [
    "electric box",
    "electrical wire and cable",
    "conduit & conduit fittings",
    "electrical vapor barrier",
  ],
  "exhaust-fan": ["bathroom fan", "duct pipe", "duct lid"],
  fasteners: ["screws", "pins & nails", "anchors", "washers", "bolt"],
  // Singular is the kitchen's stage, plural is the bathroom's. Not a
  // distinction worth relying on, but it is the one the lists use, and
  // PROJECT_STAGE_TAGS below exists for the cases where it is not
  // enough.
  faucet: ["kitchen faucet", "supply lines"],
  faucets: ["shower panel", "valves", "supply lines"],
  finishing: ["sealants", "paint tool"],
  flooring: ["flooring", "flooring tools and accessories", "subfloor panel"],
  // Just tiles. Adding "flooring tools and accessories" here put the
  // tile SPACERS level with the tiles, and they win a tie because the
  // catalogue names things by size and the tiebreak is alphabetical.
  // Spacers, trowels and levelling clips are the Grout and thinset
  // stage, which asks for them by name.
  "floor-tile": ["tile"],
  footings: ["foundation", "cement", "mix"],
  framing: [
    "framing lumbers",
    "lvl beam",
    "structural connectors",
    "structural hardware",
    "screws",
  ],
  gates: ["exterior door hardware", "fence and decking accessories"],
  gravel: ["mix"],
  grout: ["cement", "tile glue", "flooring tools and accessories"],
  "grout-thinset": ["cement", "tile glue", "flooring tools and accessories"],
  hardware: ["door accessories", "hinges", "interior locks", "dead bolt"],
  // Deck and fence hardware; the kitchen's is overridden below.
  hinges: ["hinges", "cabinet hinge"],
  hood: ["duct pipe", "duct connection", "duct lid", "reducer"],
  hvac: [
    "register and grilles",
    "duct pipe",
    "duct connection",
    "duct lid",
    "reducer",
    "filter",
    "thermostat and dectectors",
    "thermostat and detectors",
  ],
  insulation: ["insulation", "insulation accessories"],
  "joist-protection": ["flashing", "structural connectors"],
  joists: ["lvl beam", "framing lumbers"],
  kitchen: ["kitchen sink", "kitchen faucet", "kitchen drains", "cabinet hinge"],
  kitchenette: [
    "kitchen sink",
    "kitchen faucet",
    "kitchen drains",
    "cabinet hinge",
  ],
  latches: [
    "interior locks",
    "dead bolt",
    "door accessories",
    "commercial locks and handles",
  ],
  layout: ["measuring and layout tools", "marking tools"],
  levelling: ["mix", "cement", "flooring tools and accessories"],
  lighting: ["pot light", "ceiling light", "vanity light", "light bulb", "led panel"],
  mirror: ["mirror"],
  moisture: ["membrane", "flashing", "sealants"],
  plumbing: [
    "plumbing accessories",
    "valves",
    "pex pipe and fittings",
    "copper pipe and fittings",
    "supply lines",
    "pvc dwv",
  ],
  "plumbing-rough": [
    "pex pipe and fittings",
    "copper pipe and fittings",
    "pvc dwv",
    "pvc bds",
    "valves",
    "flexible connection parts",
    "plastic pex fittings",
    "compression connection",
  ],
  "post-caps": ["posts & accessories", "fence and decking accessories"],
  posts: ["pressure treated wood", "posts & accessories"],
  prep: ["hand sander accessories", "putty knife", "tape"],
  railings: ["fence and decking accessories"],
  rails: ["fence and decking accessories"],
  removal: ["blades", "cutting discs", "hammers", "hammer"],
  rollers: ["paint tool"],
  sanding: ["hand sander accessories", "power sanding accessories"],
  screws: ["screws", "pins & nails"],
  "shower-system": [
    "shower panel",
    "shower glass",
    "bathroom accessories",
    "washroom drains",
  ],
  sink: ["kitchen sink", "kitchen drains", "washroom drains"],
  stairs: ["pressure treated wood", "framing lumbers"],
  tape: ["tape", "drywall joint tape"],
  tile: ["tile"],
  toilet: ["toilet and accessories"],
  transitions: ["flooring tools and accessories"],
  trim: ["door moulding"],
  trims: ["door moulding"],
  underlayment: ["subfloor panel", "membrane"],
  ventilation: [
    "bathroom fan",
    "duct pipe",
    "duct lid",
    "duct connection",
    "register and grilles",
  ],
  waterproofing: ["membrane", "sealants", "flashing"],
};

/**
 * Package selection item id → the shop's words for it.
 *
 * Thinner than the stage map, and deliberately so. A package line is a
 * single product — "Bathtub", "Refrigerator", "Countertop" — and the
 * spreadsheet types parts and consumables, not finished fixtures. Where
 * it has no word for something, the aisle plus the item's own keywords
 * do the work.
 */
export const ITEM_TAGS: Record<string, string[]> = {
  toilet: ["toilet and accessories"],
  mirror: ["mirror"],
  "shower-valve": ["valves", "shower panel"],
  showerhead: ["bathroom accessories"],
  "shower-drain": ["washroom drains", "floor drain"],
  "shower-glass": ["shower glass"],
  "bath-wall-tile": ["tile"],
  "bath-floor-tile": ["tile"],
  grout: ["cement", "tile glue"],
  caulking: ["sealants", "adhesives & sealants accessories"],
  "bath-trim": ["door moulding"],
  "exhaust-fan": ["bathroom fan"],
  "bath-lighting": ["vanity light", "pot light", "ceiling light"],
  "bath-accessories": ["bathroom accessories", "toilet and accessories"],
  "heated-floor": ["thermostat and dectectors"],
  "kitchen-cabinets": ["cabinet hinge"],
  "cabinet-hardware": ["cabinet hinge", "door accessories"],
  backsplash: ["tile"],
  "kitchen-sink": ["kitchen sink", "kitchen drains"],
  "kitchen-faucet": ["kitchen faucet"],
  "kitchen-lighting": ["pot light", "ceiling light", "led panel"],
  flooring: ["flooring"],
  underlayment: ["subfloor panel", "membrane"],
  transitions: ["flooring tools and accessories"],
  "floor-levelling": ["mix", "cement"],
  "moisture-barrier": ["membrane"],
  "floor-adhesive": ["adhesives", "tile glue"],
  "floor-fasteners": ["screws", "pins & nails"],
  baseboards: ["door moulding"],
  "interior-doors": ["interior moulded door", "closet door"],
  "door-hardware": [
    "interior locks",
    "dead bolt",
    "door accessories",
    "hinges",
    "entry combo",
  ],
  drywall: ["compund", "drywall joint tape"],
  lighting: ["pot light", "ceiling light", "vanity light", "led panel", "light bulb"],
  switches: ["switch", "receptacle", "plate"],
  "smart-controls": ["thermostat and dectectors", "switch"],
  "smart-security": ["dead bolt", "doorbell"],
  data: ["electrical accessories", "electrical wire and cable"],
  "hvac-registers": ["register and grilles", "duct lid"],
  "hvac-controls": ["thermostat and dectectors", "thermostat and detectors"],
  shelving: ["shelving"],
  "closet-system": ["closet door", "shelving"],
  roofing: ["flashing"],
  siding: ["flashing"],
  gutters: ["flashing"],
  windows: ["windows & screens", "window"],
  "exterior-doors": ["exterior door", "exterior door hardware"],
  decking: ["pressure treated wood", "fence and decking accessories"],
  "deck-railing": ["fence and decking accessories", "posts & accessories"],
  "deck-stairs": ["pressure treated wood"],
  "deck-skirting": ["pressure treated wood"],
  "privacy-screen": ["fence and decking accessories"],
  pergola: ["pressure treated wood"],
  stairs: ["pressure treated wood"],
};

/**
 * Where a stage id means different things in different projects.
 *
 * Keyed "project:stage", and consulted before STAGE_TAGS. Most ids are
 * safely shared — demolition is demolition — but a "Sink" in a kitchen
 * and a "Sink" in a bathroom are not the same purchase, and one map
 * keyed on the word alone would offer kitchen sinks to someone building
 * a washroom. Only the genuinely ambiguous ones are listed; everything
 * else falls through to STAGE_TAGS.
 */
export const PROJECT_STAGE_TAGS: Record<string, string[]> = {
  "bathroom:sink": ["washroom drains"],
  "kitchen:sink": ["kitchen sink", "kitchen drains"],
  // Cabinet pulls and hinges, not gate latches.
  "kitchen:hardware": ["cabinet hinge", "door accessories"],
  "deck:hardware": [
    "fence and decking accessories",
    "structural connectors",
    "screws",
  ],
  // "Board" means drywall sheet in a drywall job and a fence board in a
  // fence. The catalogue has a word for one of them.
  "fence:boards": ["pressure treated wood"],
  "drywall:boards": [],
};

/** Tags for a stage, preferring the project-specific entry. */
export function stageTags(projectId: string, stageId: string): string[] {
  const scoped = PROJECT_STAGE_TAGS[`${projectId}:${stageId}`];
  return scoped ?? tagsFor(STAGE_TAGS, stageId);
}
