/**
 * Data-driven project configurator (spec §28).
 *
 * Project types, their sub-types and optional packages live here so the
 * client can add/remove options later without touching the flow UI.
 */

export interface PackageTier {
  id: string;
  name: string;
  description: string;
  priceCad: number | null;
}

export interface ProjectFlowType {
  id: "repair" | "renovation" | "new-construction";
  title: string;
  tagline: string;
  icon: string;
  /** Second-step choices, e.g. repair types or renovation areas. */
  subtypeLabel: string;
  subtypes: { id: string; label: string; icon: string }[];
}

export const PACKAGE_TIERS: PackageTier[] = [
  {
    id: "none",
    name: "No Package",
    description: "Materials only — I'll handle the rest.",
    priceCad: null,
  },
  {
    id: "basic",
    name: "Basic",
    description: "Material list check and delivery coordination.",
    priceCad: 149,
  },
  {
    id: "standard",
    name: "Standard",
    description: "Everything in Basic, plus a full takeoff and staged deliveries.",
    priceCad: 449,
  },
  {
    id: "premium",
    name: "Premium",
    description:
      "Everything in Standard, plus material selection help and a named contact.",
    priceCad: 1200,
  },
];

export const PROJECT_FLOWS: ProjectFlowType[] = [
  {
    id: "repair",
    title: "Repair",
    tagline: "Fix an existing problem.",
    icon: "Wrench",
    subtypeLabel: "Select Repair Type",
    subtypes: [
      { id: "plumbing", label: "Plumbing", icon: "Wrench" },
      { id: "electrical", label: "Electrical", icon: "AlertTriangle" },
      { id: "roofing", label: "Roofing", icon: "Building2" },
      { id: "flooring", label: "Flooring", icon: "Ruler" },
      { id: "drywall", label: "Drywall", icon: "Boxes" },
      { id: "hvac", label: "HVAC", icon: "Truck" },
    ],
  },
  {
    id: "renovation",
    title: "Renovation",
    tagline: "Upgrade an existing space.",
    icon: "Ruler",
    subtypeLabel: "Select Renovation Type",
    subtypes: [
      { id: "kitchen", label: "Kitchen", icon: "Home" },
      { id: "bathroom", label: "Bathroom", icon: "Boxes" },
      { id: "basement", label: "Basement", icon: "Building2" },
      { id: "bedroom", label: "Bedroom", icon: "Home" },
      { id: "whole-house", label: "Whole House", icon: "Home" },
      { id: "addition", label: "Addition", icon: "Building2" },
      { id: "deck", label: "Deck", icon: "Ruler" },
    ],
  },
  {
    id: "new-construction",
    title: "New Construction",
    tagline: "Build from the ground up.",
    icon: "Building2",
    subtypeLabel: "Select Build Type",
    subtypes: [
      { id: "single-family", label: "Single Family Home", icon: "Home" },
      { id: "multi-family", label: "Multi-Family", icon: "Building2" },
      { id: "commercial", label: "Commercial", icon: "Building2" },
      { id: "addition", label: "Addition", icon: "Boxes" },
      { id: "other", label: "Other", icon: "Package" },
    ],
  },
];
