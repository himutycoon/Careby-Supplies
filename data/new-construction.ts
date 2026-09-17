/**
 * New-construction intake, expressed as data so questions can be added,
 * reordered or removed without touching the wizard component (spec §28).
 */

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
  id: "basic" | "paid" | "premium";
  name: string;
  price: string;
  tagline: string;
  features: string[];
  outcome: "estimate" | "consultation";
}

export const CONSTRUCTION_TIERS: ConstructionTier[] = [
  {
    id: "basic",
    name: "Basic",
    price: "Free",
    tagline: "A ballpark range to start the conversation.",
    features: [
      "Estimated cost range",
      "Emailed summary",
      "Typical timeline guidance",
    ],
    outcome: "estimate",
  },
  {
    id: "paid",
    name: "Paid",
    price: "$499",
    tagline: "Detailed planning with a real person involved.",
    features: [
      "Everything in Basic",
      "Detailed scope breakdown",
      "Advisor call within 2 business days",
    ],
    outcome: "consultation",
  },
  {
    id: "premium",
    name: "Premium",
    price: "$2,400",
    tagline: "Full construction planning, managed end to end.",
    features: [
      "Everything in Paid",
      "Architect and permit support",
      "Material selection and ordering",
    ],
    outcome: "consultation",
  },
];

export const CONSTRUCTION_QUESTIONS: IntakeQuestion[] = [
  {
    id: "location",
    label: "Where are you building?",
    helper: "City or postal code — this drives permit and pricing rules.",
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
    label: "Architectural style",
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
