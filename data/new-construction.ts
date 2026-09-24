/**
 * New-construction intake, expressed as data so questions can be added,
 * reordered or removed without touching the wizard component (spec §28).
 */

import {
  CONSTRUCTION_TIER_FEES_CAD,
  type ConstructionTierId,
} from "@/lib/rules/construction-packages";

export type QuestionKind = "text" | "choice" | "number";

export interface IntakeQuestion {
  id: string;
  label: string;
  helper?: string;
  kind: QuestionKind;
  placeholder?: string;
  options?: string[];
  suffix?: string;
}

export interface ConstructionTier {
  id: ConstructionTierId;
  name: string;
  /** Display price. The charged amount comes from the rules layer. */
  price: string;
  tagline: string;
  features: string[];
  /** `estimate` runs the calculator; `paid-review` takes payment first. */
  outcome: "estimate" | "paid-review";
}

/**
 * What every paid tier buys back.
 *
 * Deliberately stated as a promise on the page and nowhere else yet —
 * there is no promo-code machinery behind it, so the team issues the
 * code by hand when someone orders. Wire it up when the volume makes
 * that worth doing.
 */
export const PACKAGE_CREDIT_NOTE =
  "Whatever you pay for a package comes back to you: we issue a discount code for the same amount against your material order.";

export const PACKAGE_REFUND_NOTE =
  "Not happy with the service? Tell us and we refund the package fee.";

export const CONSTRUCTION_TIERS: ConstructionTier[] = [
  {
    id: "basic",
    name: "Basic",
    price: "Free",
    tagline: "A ballpark material budget to start the conversation.",
    features: [
      "Estimated material cost range",
      "Emailed summary",
      "Typical lead times on the big items",
    ],
    outcome: "estimate",
  },
  {
    id: "plan-check",
    name: "Plan Check",
    price: `$${CONSTRUCTION_TIER_FEES_CAD["plan-check"]}`,
    tagline: "An advisor reads your plan and tells you if it works.",
    features: [
      "Everything in Basic",
      "An advisor reviews your build plan",
      "Material cost worked out from it, itemised",
      "A straight answer on whether the plan holds up",
    ],
    outcome: "paid-review",
  },
  {
    id: "architect-review",
    name: "Architect Review",
    price: `$${CONSTRUCTION_TIER_FEES_CAD["architect-review"]}`,
    tagline: "A licensed architect reviews your plan.",
    features: [
      "Everything in Plan Check",
      "A licensed architect reviews your drawings",
      "Hire them directly from there to submit your permits",
      "Their own fees are paid to them, not to us",
    ],
    outcome: "paid-review",
  },
  {
    id: "full-team",
    name: "Full Team",
    price: `$${CONSTRUCTION_TIER_FEES_CAD["full-team"]}`,
    tagline: "Architect, designer and advisor on the same build.",
    features: [
      "Everything in Architect Review",
      "A designer on layout and finishes",
      "An advisor pricing and staging the material",
      "One thread with all three of them",
    ],
    outcome: "paid-review",
  },
];

export const CONSTRUCTION_QUESTIONS: IntakeQuestion[] = [
  {
    id: "location",
    label: "Where are you building?",
    helper: "City or postal code — this sets delivery and pricing.",
    kind: "text",
    placeholder: "Mississauga, ON",
  },
  {
    id: "area",
    label: "How large is the build?",
    helper: "Approximate finished floor area.",
    kind: "number",
    placeholder: "2400",
    suffix: "sq ft",
  },
  {
    id: "zoning",
    label: "What's the zoning?",
    helper: "If you're not sure, pick the closest and we'll confirm.",
    kind: "choice",
    options: ["Residential", "Mixed use", "Commercial", "Not sure"],
  },
  {
    id: "style",
    label: "Style of finish",
    kind: "choice",
    options: ["Modern", "Traditional", "Transitional", "Farmhouse", "Other"],
  },
  {
    id: "budget",
    label: "What's your budget?",
    helper: "A range is fine — it shapes the material and finish level.",
    kind: "choice",
    options: [
      "Under $400k",
      "$400k – $700k",
      "$700k – $1M",
      "$1M – $1.5M",
      "Over $1.5M",
    ],
  },
  {
    id: "roof",
    label: "Roof type",
    kind: "choice",
    options: ["Asphalt shingle", "Metal", "Flat / membrane", "Tile", "Not sure"],
  },
  {
    id: "quality",
    label: "Finish quality",
    helper: "This has the biggest single effect on cost per square foot.",
    kind: "choice",
    options: ["Builder standard", "Mid-range", "High-end", "Luxury"],
  },
  {
    id: "parking",
    label: "Parking",
    kind: "choice",
    options: ["No garage", "1 car", "2 car", "3+ car"],
  },
  {
    id: "bedrooms",
    label: "Bedrooms",
    kind: "choice",
    options: ["1", "2", "3", "4", "5+"],
  },
  {
    id: "bathrooms",
    label: "Bathrooms",
    kind: "choice",
    options: ["1", "1.5", "2", "2.5", "3", "3.5+"],
  },
  {
    id: "basement",
    label: "Basement",
    kind: "choice",
    options: ["No basement", "Unfinished", "Finished", "Walkout"],
  },
];
