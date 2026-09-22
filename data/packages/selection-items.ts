/**
 * The backend library of things a customer can be asked to choose.
 *
 * Package Rules, first line: "Do not show 634 items — use the taxonomy as
 * a backend library; generate only items triggered by scope." So this file
 * is never rendered as a list. Templates reference item ids, adjusters
 * switch them on and off, and only what survives that is shown.
 *
 * Every item names the catalogue category it is bought from, so a
 * generated requirement can offer real products instead of a text box.
 */

export type BudgetTier = "basic" | "medium" | "luxury";

export interface SelectionItem {
  id: string;
  label: string;
  /** Catalogue category this is chosen from (product_categories.id). */
  categoryId: string;
  /** Shown as a group heading in the customer portal. */
  room: string;
  /**
   * Allowance at Medium tier, in CAD, per unit.
   *
   * BUSINESS NUMBERS — these are trade-typical GTA figures, not values
   * taken from the spreadsheet, which specifies no amounts. They are the
   * part of this file to review before quoting real customers. Basic and
   * Luxury are derived from these by TIER_MULTIPLIER below.
   */
  allowanceCad: number;
  /** Words used to match catalogue products within the category. */
  keywords?: string[];
}

/**
 * Tier changes the allowance and the product tier, per the Adjusters
 * sheet — it does not change which items exist. A Basic bathroom still
 * chooses a toilet; it chooses a cheaper one.
 */
export const TIER_MULTIPLIER: Record<BudgetTier, number> = {
  basic: 0.6,
  medium: 1,
  luxury: 2.2,
};

export const TIER_LABELS: Record<BudgetTier, string> = {
  basic: "Basic",
  medium: "Medium",
  luxury: "Luxury",
};

function item(
  id: string,
  label: string,
  categoryId: string,
  room: string,
  allowanceCad: number,
  keywords?: string[],
): SelectionItem {
  return { id, label, categoryId, room, allowanceCad, keywords };
}

export const SELECTION_ITEMS: SelectionItem[] = [
  // --- Bathroom ----------------------------------------------------------
  item("toilet", "Toilet", "plumbing", "Bathroom", 480, ["toilet"]),
  item("vanity", "Vanity cabinet", "cabinetry", "Bathroom", 1100, ["vanity"]),
  item("vanity-top", "Vanity countertop", "countertops", "Bathroom", 650, ["quartz", "counter", "top"]),
  item("bath-sink", "Sink", "plumbing", "Bathroom", 260, ["sink", "basin"]),
  item("bath-faucet", "Faucet", "plumbing", "Bathroom", 310, ["faucet", "tap"]),
  item("mirror", "Mirror", "hardware", "Bathroom", 320, ["mirror"]),
  item("shower-valve", "Shower valve", "plumbing", "Bathroom", 420, ["valve", "shower"]),
  item("showerhead", "Showerhead", "plumbing", "Bathroom", 280, ["shower", "head", "rain"]),
  item("shower-base", "Shower base or pan", "plumbing", "Bathroom", 700, ["base", "pan", "shower"]),
  item("shower-glass", "Shower glass", "doors-windows", "Bathroom", 1450, ["glass", "shower", "enclosure"]),
  item("shower-niche", "Shower niche", "tile", "Bathroom", 260, ["niche"]),
  item("shower-bench", "Shower bench", "tile", "Bathroom", 480, ["bench"]),
  item("tub", "Bathtub", "plumbing", "Bathroom", 1200, ["tub", "bath"]),
  item("tub-filler", "Tub filler", "plumbing", "Bathroom", 540, ["filler", "tub"]),
  item("bath-wall-tile", "Wall tile", "tile", "Bathroom", 1600, ["tile", "wall"]),
  item("bath-floor-tile", "Floor tile", "tile", "Bathroom", 900, ["tile", "floor"]),
  item("grout", "Grout colour", "tile", "Bathroom", 120, ["grout"]),
  item("exhaust-fan", "Exhaust fan", "electrical", "Bathroom", 260, ["fan", "exhaust", "ventilation"]),
  item("bath-lighting", "Bathroom lighting", "electrical", "Bathroom", 420, ["light", "vanity"]),
  item("bath-accessories", "Accessories", "hardware", "Bathroom", 180, ["towel", "holder", "bar"]),
  item("heated-floor", "Heated floor system", "electrical", "Bathroom", 1300, ["heated", "floor", "mat"]),

  // --- Kitchen -----------------------------------------------------------
  item("kitchen-cabinets", "Cabinetry", "cabinetry", "Kitchen", 12000, ["cabinet"]),
  item("cabinet-hardware", "Cabinet hardware", "hardware", "Kitchen", 380, ["handle", "knob", "pull"]),
  item("countertop", "Countertop", "countertops", "Kitchen", 4200, ["quartz", "granite", "counter"]),
  item("backsplash", "Backsplash", "tile", "Kitchen", 900, ["tile", "backsplash"]),
  item("kitchen-sink", "Kitchen sink", "plumbing", "Kitchen", 620, ["sink"]),
  item("kitchen-faucet", "Kitchen faucet", "plumbing", "Kitchen", 480, ["faucet", "tap"]),
  item("pot-filler", "Pot filler", "plumbing", "Kitchen", 620, ["pot filler"]),
  item("refrigerator", "Refrigerator", "appliances", "Kitchen", 2600, ["fridge", "refrigerator"]),
  item("range", "Range or cooktop", "appliances", "Kitchen", 2200, ["range", "stove", "cooktop"]),
  item("hood", "Range hood", "appliances", "Kitchen", 900, ["hood"]),
  item("dishwasher", "Dishwasher", "appliances", "Kitchen", 1100, ["dishwasher"]),
  item("microwave", "Microwave", "appliances", "Kitchen", 600, ["microwave"]),
  item("wall-oven", "Wall oven", "appliances", "Kitchen", 3200, ["oven"]),
  item("beverage-fridge", "Beverage fridge", "appliances", "Kitchen", 1400, ["beverage", "wine", "fridge"]),
  item("kitchen-lighting", "Kitchen lighting", "electrical", "Kitchen", 850, ["light", "pendant"]),
  item("island", "Island", "cabinetry", "Kitchen", 5200, ["island"]),
  item("pantry", "Pantry storage", "cabinetry", "Kitchen", 2400, ["pantry"]),

  // --- Flooring, walls, doors -------------------------------------------
  item("flooring", "Flooring", "flooring", "Interior", 4200, ["floor", "vinyl", "hardwood", "laminate"]),
  item("underlayment", "Underlayment", "flooring", "Interior", 480, ["underlay"]),
  item("transitions", "Transitions and nosing", "flooring", "Interior", 260, ["transition", "nosing"]),
  item("stair-nosing", "Stair treatment", "flooring", "Interior", 900, ["stair", "nosing"]),
  item("paint", "Paint colours", "paint", "Interior", 900, ["paint"]),
  item("baseboards", "Baseboards and trim", "lumber", "Interior", 1100, ["trim", "baseboard", "casing"]),
  item("interior-doors", "Interior doors", "doors-windows", "Interior", 2400, ["door"]),
  item("door-hardware", "Door hardware", "hardware", "Interior", 560, ["handle", "knob", "hinge"]),
  item("drywall", "Drywall and ceiling finish", "paint", "Interior", 1800, ["drywall"]),
  item("window-coverings", "Window coverings", "window-coverings", "Interior", 1600, ["blind", "shade", "curtain"]),

  // --- Electrical / systems ---------------------------------------------
  item("lighting", "Light fixtures", "electrical", "Interior", 1400, ["light", "fixture"]),
  item("switches", "Switches and receptacles", "electrical", "Interior", 420, ["switch", "receptacle", "outlet"]),
  item("smart-controls", "Smart controls", "smart-home", "Interior", 900, ["smart", "thermostat", "switch"]),
  item("smart-security", "Smart locks and cameras", "smart-home", "Interior", 1200, ["lock", "camera", "doorbell"]),
  item("data", "Data and network points", "electrical", "Interior", 480, ["data", "network", "ethernet"]),
  item("hvac-registers", "HVAC registers", "hvac", "Interior", 320, ["register", "vent", "grille"]),
  item("hvac-controls", "HVAC controls", "hvac", "Interior", 420, ["thermostat"]),

  // --- Basement / living --------------------------------------------------
  item("wet-bar", "Wet bar", "cabinetry", "Basement", 4800, ["bar", "cabinet"]),
  item("built-ins", "Built-in millwork", "cabinetry", "Interior", 3600, ["built-in", "shelving", "millwork"]),
  item("fireplace", "Fireplace", "hvac", "Interior", 3200, ["fireplace"]),
  item("media-wall", "Media wall", "cabinetry", "Basement", 3000, ["media", "wall"]),
  item("feature-wall", "Feature wall", "paint", "Interior", 1200, ["feature", "panel", "accent"]),

  // --- Laundry / office / entry / closet ----------------------------------
  item("washer", "Washer", "appliances", "Laundry", 1300, ["washer"]),
  item("dryer", "Dryer", "appliances", "Laundry", 1300, ["dryer"]),
  item("laundry-sink", "Laundry sink", "plumbing", "Laundry", 420, ["sink", "utility"]),
  item("laundry-cabinets", "Laundry cabinets", "cabinetry", "Laundry", 2200, ["cabinet"]),
  item("shelving", "Shelving", "cabinetry", "Interior", 700, ["shelf", "shelving"]),
  item("desk", "Desk", "cabinetry", "Home Office", 1800, ["desk"]),
  item("entry-storage", "Entry storage and bench", "cabinetry", "Entry", 2600, ["bench", "cubby", "locker"]),
  item("closet-system", "Closet system", "cabinetry", "Bedroom", 2400, ["closet", "wardrobe"]),

  // --- Exterior / outdoor -------------------------------------------------
  item("roofing", "Roofing", "roofing", "Exterior", 9000, ["shingle", "roof"]),
  item("siding", "Siding", "roofing", "Exterior", 8000, ["siding", "cladding"]),
  item("gutters", "Gutters, soffit and fascia", "roofing", "Exterior", 2600, ["gutter", "soffit", "fascia"]),
  item("windows", "Windows", "doors-windows", "Exterior", 9500, ["window"]),
  item("exterior-doors", "Exterior doors", "doors-windows", "Exterior", 3200, ["door", "entry"]),
  item("garage-door", "Garage door", "doors-windows", "Exterior", 2800, ["garage"]),
  item("exterior-lighting", "Exterior lighting", "electrical", "Exterior", 620, ["light", "exterior"]),
  item("exterior-paint", "Exterior paint and trim", "paint", "Exterior", 1800, ["paint", "trim"]),
  item("decking", "Decking", "outdoor", "Outdoor", 5200, ["deck", "composite"]),
  item("deck-railing", "Railing", "outdoor", "Outdoor", 2400, ["railing"]),
  item("deck-stairs", "Deck stairs", "outdoor", "Outdoor", 1200, ["stair"]),
  item("deck-skirting", "Skirting", "outdoor", "Outdoor", 700, ["skirt"]),
  item("privacy-screen", "Privacy screen", "outdoor", "Outdoor", 1400, ["privacy", "screen"]),
  item("pergola", "Pergola", "outdoor", "Outdoor", 4200, ["pergola"]),
  item("outdoor-kitchen", "Outdoor kitchen", "outdoor", "Outdoor", 8500, ["outdoor", "kitchen", "grill"]),

  // --- New build specific --------------------------------------------------
  item("exterior-finish", "Exterior finish (brick/stone)", "roofing", "Exterior", 14000, ["brick", "stone", "masonry"]),
  item("stairs", "Interior stairs", "lumber", "Interior", 4800, ["stair", "railing"]),
  item("millwork", "Custom millwork", "cabinetry", "Interior", 6500, ["millwork", "custom"]),
];

const BY_ID = new Map(SELECTION_ITEMS.map((i) => [i.id, i]));

export function selectionItem(id: string): SelectionItem | undefined {
  return BY_ID.get(id);
}

/** Allowance for this item at this tier, rounded to whole dollars. */
export function allowanceFor(item: SelectionItem, tier: BudgetTier): number {
  return Math.round(item.allowanceCad * TIER_MULTIPLIER[tier]);
}
