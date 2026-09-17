/**
 * Repair decision tree — configuration-driven so areas, problems and the
 * products each problem should surface can change without touching UI.
 */
export interface RepairProblem {
  id: string;
  label: string;
  /** Matched against product name/description to rank recommendations. */
  keywords: string[];
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
      { id: "leaking-faucet", label: "Leaking faucet", keywords: ["faucet"] },
      { id: "broken-pipe", label: "Broken pipe", keywords: ["pipe", "pvc"] },
      {
        id: "low-pressure",
        label: "Low water pressure",
        keywords: ["faucet", "valve"],
      },
      { id: "clogged-drain", label: "Clogged drain", keywords: ["pipe", "drain"] },
      { id: "water-heater", label: "Water heater", keywords: ["valve", "pipe"] },
      { id: "other-plumbing", label: "Something else", keywords: [] },
    ],
  },
  {
    id: "electrical",
    label: "Electrical",
    icon: "AlertTriangle",
    categoryIds: ["electrical", "hardware"],
    problems: [
      { id: "outlet-dead", label: "Outlet not working", keywords: ["wire"] },
      { id: "flickering", label: "Flickering lights", keywords: ["wire"] },
      { id: "breaker", label: "Breaker keeps tripping", keywords: ["wire"] },
      { id: "new-circuit", label: "Need a new circuit", keywords: ["wire"] },
      { id: "other-electrical", label: "Something else", keywords: [] },
    ],
  },
  {
    id: "roofing",
    label: "Roofing",
    icon: "Building2",
    categoryIds: ["roofing", "lumber"],
    problems: [
      { id: "leak", label: "Active leak", keywords: ["shingle"] },
      { id: "missing-shingles", label: "Missing shingles", keywords: ["shingle"] },
      { id: "flashing", label: "Damaged flashing", keywords: ["shingle"] },
      { id: "replacement", label: "Full replacement", keywords: ["shingle"] },
      { id: "other-roofing", label: "Something else", keywords: [] },
    ],
  },
  {
    id: "flooring",
    label: "Flooring",
    icon: "Ruler",
    categoryIds: ["flooring", "hardware"],
    problems: [
      { id: "water-damage", label: "Water damage", keywords: ["tile"] },
      { id: "cracked-tile", label: "Cracked tile", keywords: ["tile", "ceramic"] },
      { id: "worn-finish", label: "Worn finish", keywords: ["tile"] },
      { id: "replace-floor", label: "Full replacement", keywords: ["tile"] },
      { id: "other-flooring", label: "Something else", keywords: [] },
    ],
  },
  {
    id: "walls",
    label: "Walls & Ceilings",
    icon: "Boxes",
    categoryIds: ["hardware", "paint"],
    problems: [
      { id: "hole", label: "Hole in drywall", keywords: ["drywall"] },
      { id: "crack", label: "Cracking or settling", keywords: ["drywall"] },
      { id: "water-stain", label: "Water stain", keywords: ["drywall"] },
      { id: "other-walls", label: "Something else", keywords: [] },
    ],
  },
  {
    id: "doors-windows",
    label: "Doors & Windows",
    icon: "Home",
    categoryIds: ["doors-windows", "hardware"],
    problems: [
      { id: "draft", label: "Draft around frame", keywords: ["door"] },
      { id: "wont-close", label: "Won't close properly", keywords: ["door"] },
      { id: "broken-glass", label: "Broken glass", keywords: ["window"] },
      { id: "replace-door", label: "Full replacement", keywords: ["door"] },
      { id: "other-openings", label: "Something else", keywords: [] },
    ],
  },
];
