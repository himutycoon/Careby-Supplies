import type { UserRole } from "@/lib/types";

/**
 * The client's guided-flow map: pick a user type, pick an option, land in
 * the flow that handles it.
 *
 * Every `href` points at a route that already exists and is wired to the
 * database — this is a router, not a second implementation. If a flow
 * moves, it moves here and nowhere else.
 */
export interface GuidedFlowOption {
  id: string;
  label: string;
  description: string;
  /** Steps shown as a preview, so the destination isn't a surprise. */
  steps: string[];
  icon: string;
  href: string;
}

export const GUIDED_FLOWS: Record<
  Exclude<UserRole, "admin">,
  GuidedFlowOption[]
> = {
  contractor: [
    {
      id: "e-commerce",
      label: "Order materials",
      description: "Browse the catalog at trade pricing and check out.",
      steps: ["Browse", "Add to cart", "Checkout"],
      icon: "ShoppingCart",
      href: "/contractor/shop",
    },
    {
      id: "call-order",
      label: "Call order",
      description: "Book a call and place a large order with a person.",
      steps: ["Pick a category", "Choose a slot", "We call you"],
      icon: "Phone",
      href: "/contractor/call-order",
    },
    {
      id: "package-login",
      label: "Build a customer package",
      description:
        "Bundle materials for a client and share it with an access code.",
      steps: ["Add products", "Add customer", "Share package"],
      icon: "Package",
      href: "/contractor/packages/new",
    },
    {
      id: "category-order",
      label: "Order by category",
      description: "Repair, renovation or new build — ordered by job type.",
      steps: ["Choose job type", "Pick materials", "Checkout"],
      icon: "ListOrdered",
      href: "/contractor/category-order",
    },
    {
      id: "drawing-upload",
      label: "Upload a drawing",
      description: "Send a drawing and get the material list it needs.",
      steps: ["Upload", "Add comments", "Review materials"],
      icon: "FileUp",
      href: "/contractor/drawings",
    },
  ],
  homeowner: [
    {
      id: "repair",
      label: "Fix something",
      description: "Find the part you need, or talk to an expert first.",
      steps: ["Describe the problem", "Find the part", "Order"],
      icon: "Wrench",
      href: "/repair",
    },
    {
      id: "renovation",
      label: "Renovate a room",
      description:
        "Photo-based estimate now, a hand-designed plan within 48 hours.",
      steps: ["Property details", "Upload photos", "Get your estimate"],
      icon: "Ruler",
      href: "/new",
    },
    {
      id: "new-construction",
      label: "Build from scratch",
      description: "Scope and budget a new build with guidance.",
      steps: ["Choose a tier", "Project details", "Get your estimate"],
      icon: "Building2",
      href: "/new-construction",
    },
    {
      id: "e-commerce",
      label: "Shop materials",
      description: "Browse and order building materials directly.",
      steps: ["Browse", "Add to cart", "Checkout"],
      icon: "ShoppingCart",
      href: "/products",
    },
    {
      id: "premium-package",
      label: "Premium package",
      description:
        "Expert advice, architect support, permits and call ordering — managed end to end.",
      steps: ["Choose a tier", "Project profile", "We contact you"],
      icon: "Crown",
      href: "/premium-request",
    },
  ],
};

/** Engagement tiers for the premium package wizard. */
export interface PremiumTier {
  id: string;
  name: string;
  tagline: string;
  bestFor: string;
  includes: string[];
}

export const PREMIUM_TIERS: PremiumTier[] = [
  {
    id: "concierge",
    name: "Premium Concierge",
    tagline: "Expert advice, architect, permits and call ordering.",
    bestFor: "Best for end-to-end execution",
    includes: [
      "Dedicated project advisor",
      "Architect support",
      "Permit assistance",
      "Call ordering",
    ],
  },
  {
    id: "design-permits",
    name: "Design + Permits",
    tagline: "Architect and permit package on a streamlined timeline.",
    bestFor: "Best for major remodels",
    includes: ["Architect support", "Permit assistance", "Material selection"],
  },
  {
    id: "expert-session",
    name: "Expert Session",
    tagline: "A one-to-one consult plus a curated materials list.",
    bestFor: "Best for confident DIY",
    includes: ["1:1 expert consultation", "Curated materials list"],
  },
];

export const PREMIUM_TIMELINES = [
  "ASAP (1–2 weeks)",
  "Short (3–8 weeks)",
  "Flexible (2–6 months)",
  "Planning ahead (6 months+)",
];

export const PREMIUM_PROJECT_TYPES = [
  "Renovation",
  "New construction",
  "Repair",
  "Addition",
];

export const PREMIUM_PROPERTY_TYPES = ["Condo", "House", "Multi-family"];

export const PREMIUM_CONTACT_PREFERENCES = [
  {
    id: "asap",
    label: "Call me as soon as possible",
    description: "We aim to call within one business hour.",
  },
  {
    id: "scheduled",
    label: "Schedule a time",
    description: "Pick a day and time that suits you.",
  },
  {
    id: "email",
    label: "Email only",
    description: "We'll send next steps in writing.",
  },
];

export const PREMIUM_DAYS = ["Today", "Tomorrow", "This week", "Next week"];
export const PREMIUM_TIMES = ["Morning", "Afternoon", "Evening"];
