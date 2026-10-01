/**
 * Repair decision tree — configuration-driven so areas, problems and the
 * products each problem should surface can change without touching UI.
 */
export interface RepairProblem {
  id: string;
  label: string;
  /** Matched against product name/description to rank recommendations. */
  keywords: string[];
  /**
   * The shop's own words for the parts this repair needs, from the
   * catalogue's tags.
   *
   * Searched before the aisles and much narrower than them: "clogged
   * drain" wants the 40 products tagged "washroom drains", not the
   * 1,330 in plumbing and hardware. Left off where the catalogue has no
   * word for the problem, and then the aisles answer as before.
   */
  tags?: string[];
}

export interface RepairArea {
  id: string;
  label: string;
  icon: string;
  /**
   * Catalog categories the recommendations come from.
   *
   * A list because the parts for a repair rarely sit in one aisle — a
   * drywall patch needs compound and paint, a roof leak needs shingles
   * and the lumber under them.
   *
   * These have to be re-checked whenever the catalogue is refiled.
   * Tiles moved out of Flooring into Tile & Stone, and drywall out of
   * Hardware into its own aisle, and for a while afterwards "cracked
   * tile" searched an aisle with no tiles in it.
   */
  categoryIds: string[];
  problems: RepairProblem[];
}

export const REPAIR_AREAS: RepairArea[] = [
  {
    id: "plumbing",
    label: "Plumbing",
    icon: "Wrench",
    categoryIds: ["plumbing", "hardware"],
    problems: [
      {
        id: "leaking-faucet",
        label: "Leaking faucet",
        keywords: ["faucet", "cartridge", "washer"],
        tags: [
          "kitchen faucet",
          "valves",
          "supply lines",
          "plumbing accessories",
        ],
      },
      {
        id: "broken-pipe",
        label: "Broken pipe",
        keywords: ["pipe", "coupling", "repair"],
        tags: [
          "pex pipe and fittings",
          "copper pipe and fittings",
          "pvc dwv",
          "flexible connection parts",
          "plumbing accessories",
        ],
      },
      {
        id: "low-pressure",
        label: "Low water pressure",
        keywords: ["valve", "aerator", "supply"],
        tags: ["valves", "supply lines", "pushfit", "compression connection"],
      },
      {
        id: "clogged-drain",
        label: "Clogged drain",
        keywords: ["drain", "auger", "cleanout"],
        tags: [
          "washroom drains",
          "kitchen drains",
          "floor drain",
          "pvc dwv",
          "flexible connection parts",
        ],
      },
      {
        id: "water-heater",
        label: "Water heater",
        keywords: ["valve", "relief", "connector"],
        tags: [
          "valves",
          "supply lines",
          "gas valves",
          "copper pipe and fittings",
        ],
      },
      {
        id: "toilet",
        label: "Running or leaking toilet",
        keywords: ["flapper", "fill", "valve", "wax", "tank"],
        tags: ["toilet and accessories", "supply lines"],
      },
      { id: "other-plumbing", label: "Something else", keywords: [] },
    ],
  },
  {
    id: "electrical",
    label: "Electrical",
    icon: "AlertTriangle",
    categoryIds: ["electrical", "hardware"],
    problems: [
      {
        id: "outlet-dead",
        label: "Outlet not working",
        keywords: ["receptacle", "outlet", "gfci"],
        tags: ["receptacle", "electric box", "electrical accessories"],
      },
      {
        id: "flickering",
        label: "Flickering lights",
        keywords: ["bulb", "dimmer", "connector"],
        tags: ["light bulb", "switch", "electrical accessories"],
      },
      {
        id: "breaker",
        label: "Breaker keeps tripping",
        keywords: ["wire", "connector", "tester"],
        tags: ["electrical accessories", "electrical wire and cable"],
      },
      {
        id: "new-circuit",
        label: "Need a new circuit",
        keywords: ["wire", "cable", "box", "conduit"],
        tags: [
          "electrical wire and cable",
          "electric box",
          "conduit & conduit fittings",
          "receptacle",
        ],
      },
      {
        id: "light-fixture",
        label: "Replacing a light fixture",
        keywords: ["light", "fixture", "pot"],
        tags: [
          "pot light",
          "ceiling light",
          "vanity light",
          "led panel",
          "light bulb",
        ],
      },
      { id: "other-electrical", label: "Something else", keywords: [] },
    ],
  },
  {
    id: "roofing",
    label: "Roofing",
    icon: "Building2",
    categoryIds: ["roofing", "lumber", "adhesives"],
    problems: [
      {
        id: "leak",
        label: "Active leak",
        keywords: ["sealant", "patch", "waterproof"],
        tags: ["sealants", "flashing", "membrane", "tape"],
      },
      {
        id: "missing-shingles",
        label: "Missing shingles",
        keywords: ["shingle", "roofing", "nail"],
        tags: ["pins & nails", "flashing"],
      },
      {
        id: "flashing",
        label: "Damaged flashing",
        keywords: ["flashing", "sealant"],
        tags: ["flashing", "sealants"],
      },
      { id: "replacement", label: "Full replacement", keywords: ["shingle"] },
      { id: "other-roofing", label: "Something else", keywords: [] },
    ],
  },
  {
    id: "flooring",
    label: "Flooring",
    icon: "Ruler",
    // Tile lives in its own aisle since the catalogue was refiled; a
    // flooring repair needs both.
    categoryIds: ["flooring", "tile", "adhesives"],
    problems: [
      {
        id: "water-damage",
        label: "Water damage",
        keywords: ["subfloor", "levelling", "membrane"],
        tags: ["subfloor panel", "membrane", "mix", "flooring"],
      },
      {
        id: "cracked-tile",
        label: "Cracked tile",
        keywords: ["tile", "grout", "thinset"],
        tags: ["tile", "tile glue", "cement", "flooring tools and accessories"],
      },
      {
        id: "loose-grout",
        label: "Loose or stained grout",
        keywords: ["grout", "sealant", "sponge"],
        tags: ["cement", "sealants", "flooring tools and accessories"],
      },
      {
        id: "worn-finish",
        label: "Worn finish",
        keywords: ["sanding", "finish"],
        tags: ["hand sander accessories", "power sanding accessories"],
      },
      {
        id: "replace-floor",
        label: "Full replacement",
        keywords: ["underlay", "transition"],
        tags: ["flooring", "subfloor panel", "flooring tools and accessories"],
      },
      { id: "other-flooring", label: "Something else", keywords: [] },
    ],
  },
  {
    id: "walls",
    label: "Walls & Ceilings",
    icon: "Boxes",
    // Drywall is its own department now; patching a wall out of
    // Hardware and Paint found tape and rollers but never the compound.
    categoryIds: ["drywall", "paint", "adhesives"],
    problems: [
      {
        id: "hole",
        label: "Hole in drywall",
        keywords: ["patch", "compound", "knife"],
        tags: [
          "compund",
          "drywall compound",
          "drywall joint tape",
          "putty knife",
        ],
      },
      {
        id: "crack",
        label: "Cracking or settling",
        keywords: ["tape", "compound", "corner"],
        tags: ["drywall joint tape", "compund", "sealants"],
      },
      {
        id: "water-stain",
        label: "Water stain",
        keywords: ["primer", "stain", "sealer"],
        tags: ["spray paint", "sealants"],
      },
      {
        id: "popped-screws",
        label: "Popped screws or nails",
        keywords: ["screw", "drywall"],
        tags: ["screws", "pins & nails", "putty knife"],
      },
      { id: "other-walls", label: "Something else", keywords: [] },
    ],
  },
  {
    id: "doors-windows",
    label: "Doors & Windows",
    icon: "Home",
    categoryIds: ["doors-windows", "hardware", "adhesives"],
    problems: [
      {
        id: "draft",
        label: "Draft around frame",
        keywords: ["weatherstrip", "foam", "caulk"],
        tags: ["sealants", "flashing", "tape"],
      },
      {
        id: "wont-close",
        label: "Won't close properly",
        keywords: ["hinge", "latch", "strike"],
        tags: ["hinges", "door accessories", "interior locks"],
      },
      {
        id: "broken-glass",
        label: "Broken glass",
        keywords: ["glass", "screen", "spline"],
        tags: ["windows & screens", "door & window screens", "window"],
      },
      {
        id: "lock-trouble",
        label: "Lock or handle trouble",
        keywords: ["lock", "deadbolt", "handle"],
        tags: [
          "interior locks",
          "dead bolt",
          "entry combo",
          "commercial locks and handles",
        ],
      },
      {
        id: "replace-door",
        label: "Full replacement",
        keywords: ["door", "jamb"],
        tags: ["interior moulded door", "exterior door", "door moulding"],
      },
      { id: "other-openings", label: "Something else", keywords: [] },
    ],
  },
  {
    // 169 products in Heating & Cooling and no repair flow reached a
    // single one of them.
    id: "hvac",
    label: "Heating & Cooling",
    icon: "Thermometer",
    categoryIds: ["hvac", "electrical"],
    problems: [
      {
        id: "no-airflow",
        label: "No airflow from a vent",
        keywords: ["register", "duct", "damper"],
        tags: ["register and grilles", "duct connection", "duct pipe", "reducer"],
      },
      {
        id: "thermostat",
        label: "Thermostat trouble",
        keywords: ["thermostat", "control"],
        tags: ["thermostat and dectectors", "thermostat and detectors"],
      },
      {
        id: "filter",
        label: "Filter change",
        keywords: ["filter"],
        tags: ["filter"],
      },
      {
        id: "bathroom-fan",
        label: "Bathroom fan not clearing steam",
        keywords: ["fan", "exhaust", "vent"],
        tags: ["bathroom fan", "duct pipe", "duct lid"],
      },
      { id: "other-hvac", label: "Something else", keywords: [] },
    ],
  },
];
