/**
 * Platform-level content for the public marketing surface and the
 * two-role (contractor / homeowner) entry points.
 *
 * Kept data-driven so categories, services and steps can be edited — or
 * eventually served from an admin/CMS — without touching components.
 */

export interface HeroStat {
  label: string;
  value: string;
  caption: string;
  icon: string;
}

/** Floating UI cards layered over the hero image. */
export const HERO_CARDS: HeroStat[] = [
  {
    icon: "Receipt",
    // Material only, and priced like it: the old $124,500 was a whole
    // project including labour, which is not a number we should ever
    // put on our own hero.
    label: "Material Estimate",
    value: "$38,400",
    caption: "Kitchen + main floor",
  },
  {
    icon: "PackageCheck",
    label: "Materials Ready",
    value: "38 items",
    caption: "Scheduled for delivery",
  },
  {
    icon: "Headset",
    label: "Advisor Call",
    value: "Thu, 2:00 PM",
    caption: "With a materials advisor",
  },
];

export interface UserTypeOption {
  id: "contractor" | "homeowner";
  icon: string;
  title: string;
  /**
   * The role on its own, for places that supply the "I'm a" themselves
   * — the hero chooser labels the pair once and cannot afford to repeat
   * the prefix inside a 140px pill on a 320px phone.
   */
  shortLabel: string;
  description: string;
  bullets: string[];
  ctaLabel: string;
  href: string;
}

export const USER_TYPES: UserTypeOption[] = [
  {
    id: "contractor",
    icon: "HardHat",
    title: "I'm a Contractor",
    shortLabel: "Contractor",
    description: "Manage projects, materials, packages and orders.",
    bullets: [
      "Trade pricing on materials",
      "Build customer packages",
      "Upload drawings for takeoffs",
    ],
    ctaLabel: "Explore Contractor Tools",
    href: "/signup?role=contractor",
  },
  {
    id: "homeowner",
    icon: "Home",
    title: "I'm a Homeowner",
    shortLabel: "Homeowner",
    description: "Work out what your project needs, then order it.",
    bullets: [
      "Material lists from your photos",
      "Instant material estimates",
      "Someone to ask when you are unsure",
    ],
    ctaLabel: "Get Started",
    href: "/signup?role=homeowner",
  },
];

export interface ServiceItem {
  icon: string;
  title: string;
  description: string;
  href: string;
}

export const SERVICES: ServiceItem[] = [
  {
    icon: "Boxes",
    title: "Shop Building Materials",
    description:
      "Lumber, flooring, plumbing, electrical and more — priced for the job.",
    href: "/services",
  },
  {
    icon: "Wrench",
    title: "Repair Parts",
    description:
      "Work out what has failed and get the right part for it, fast.",
    href: "/services",
  },
  {
    icon: "Ruler",
    title: "Renovation Materials",
    description:
      "Photograph the room and get back the material list it needs, priced.",
    href: "/services",
  },
  {
    icon: "Building2",
    title: "New Construction Supply",
    description:
      "Budget the material for a build from the ground up, stage by stage.",
    href: "/services",
  },
  {
    icon: "Package",
    title: "Contractor Packages",
    description:
      "Bundle materials into a package and share it with your customer.",
    href: "/services",
  },
  {
    icon: "Headset",
    title: "Expert Consultation",
    description:
      "Book a call with an advisor who knows local codes and pricing.",
    href: "/services",
  },
];

export interface ProcessStep {
  step: string;
  title: string;
  description: string;
}

export const PROCESS_STEPS: ProcessStep[] = [
  {
    step: "01",
    title: "Tell us about your project",
    description:
      "Share photos, drawings or a few details about what you're building or fixing.",
  },
  {
    step: "02",
    title: "Get the material list and price",
    description:
      "An itemised list of what the job needs, in the quantities it needs, priced from our catalogue.",
  },
  {
    step: "03",
    title: "Adjust it until it's right",
    description:
      "Swap a grade, change a brand, cut a line. We re-price it while you decide.",
  },
  {
    step: "04",
    title: "Order and take delivery",
    description:
      "Place the order and we deliver to site on the day you want it, with returns on anything unused.",
  },
];

export interface ProjectCategory {
  id: "repair" | "renovation" | "new-construction";
  title: string;
  description: string;
  tone: "sand" | "slate" | "forest";
  href: string;
}

export const PROJECT_CATEGORIES: ProjectCategory[] = [
  {
    id: "repair",
    title: "Repair Supplies",
    description: "Parts and materials to put it right — plumbing, electrical, roofing and more.",
    tone: "sand",
    href: "/services",
  },
  {
    id: "renovation",
    title: "Renovation Materials",
    description: "Everything a room needs, in the quantities it needs, priced to your budget.",
    tone: "slate",
    href: "/services",
  },
  {
    id: "new-construction",
    title: "New Build Supply",
    description: "Material budgets and staged deliveries for a build from the ground up.",
    tone: "forest",
    href: "/services",
  },
];

export const PREMIUM_INCLUSIONS: string[] = [
  "Material Selection",
  "Quantity Takeoffs",
  "Trade Pricing",
  "Scheduled Delivery",
  "Order by Phone",
  "A Named Contact",
];

export interface PremiumStage {
  step: string;
  title: string;
  icon: string;
}

export const PREMIUM_TIMELINE: PremiumStage[] = [
  { step: "01", title: "Tell us the job", icon: "MessageSquare" },
  { step: "02", title: "Material list", icon: "ClipboardList" },
  { step: "03", title: "Quantity check", icon: "Ruler" },
  { step: "04", title: "Priced & approved", icon: "FileCheck" },
  { step: "05", title: "Delivered to site", icon: "Truck" },
  { step: "06", title: "Top-ups & returns", icon: "RefreshCw" },
];

export interface TrustPoint {
  icon: string;
  title: string;
  description: string;
}

export const TRUST_POINTS: TrustPoint[] = [
  {
    icon: "ShieldCheck",
    title: "Quality materials",
    description:
      "Products from established suppliers, specified for the work you're doing.",
  },
  {
    icon: "Headset",
    title: "Know your materials",
    description:
      "Talk to someone who knows what each product suits, what it costs and how long it takes to arrive.",
  },
  {
    icon: "Receipt",
    title: "Transparent pricing",
    description:
      "Itemised material lists with waste allowance, delivery and tax shown separately.",
  },
  {
    icon: "Truck",
    title: "Reliable service",
    description:
      "Delivery timelines you can plan a build schedule around.",
  },
  {
    icon: "FolderKanban",
    title: "Project-based ordering",
    description:
      "Assign materials to a project so nothing gets ordered twice.",
  },
];
