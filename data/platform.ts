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
    label: "Project Estimate",
    value: "$124,500",
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
    label: "Expert Consultation",
    value: "Thu, 2:00 PM",
    caption: "With a project advisor",
  },
];

export interface UserTypeOption {
  id: "contractor" | "homeowner";
  icon: string;
  title: string;
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
    description: "Plan your repair, renovation or new home.",
    bullets: [
      "Guided project planning",
      "Instant cost estimates",
      "Expert support when you need it",
    ],
    ctaLabel: "Start Planning",
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
    title: "Repair Services",
    description:
      "Diagnose the problem, get the right parts, or talk to an expert.",
    href: "/services",
  },
  {
    icon: "Ruler",
    title: "Renovation Planning",
    description:
      "Photo-based estimates and a hand-designed plan for your space.",
    href: "/services",
  },
  {
    icon: "Building2",
    title: "New Construction",
    description:
      "Scope, budget and plan a build from the ground up with guidance.",
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
    title: "Get products, estimates or guidance",
    description:
      "Receive an itemised estimate, a material list, or a call with an expert.",
  },
  {
    step: "03",
    title: "Build your project plan",
    description:
      "Refine scope, materials and budget with support from our team.",
  },
  {
    step: "04",
    title: "Order and get support",
    description:
      "Place your order and stay supported through delivery and build.",
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
    title: "Repair",
    description: "Fix an existing problem — plumbing, electrical, roofing and more.",
    tone: "sand",
    href: "/services",
  },
  {
    id: "renovation",
    title: "Renovation",
    description: "Upgrade an existing space with a plan built around your budget.",
    tone: "slate",
    href: "/services",
  },
  {
    id: "new-construction",
    title: "New Construction",
    description: "Build from the ground up with estimates and expert planning.",
    tone: "forest",
    href: "/services",
  },
];

export const PREMIUM_INCLUSIONS: string[] = [
  "Expert Advice",
  "Architect Support",
  "Permit Assistance",
  "Material Selection",
  "Call Ordering",
  "Project Planning",
];

export interface PremiumStage {
  step: string;
  title: string;
  icon: string;
}

export const PREMIUM_TIMELINE: PremiumStage[] = [
  { step: "01", title: "Consultation", icon: "MessageSquare" },
  { step: "02", title: "Project Planning", icon: "ClipboardList" },
  { step: "03", title: "Architect / Design", icon: "PencilRuler" },
  { step: "04", title: "Permits", icon: "FileCheck" },
  { step: "05", title: "Materials", icon: "Truck" },
  { step: "06", title: "Construction Support", icon: "HardHat" },
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
    title: "Expert support",
    description:
      "Talk to someone who understands local codes, pricing and lead times.",
  },
  {
    icon: "Receipt",
    title: "Transparent pricing",
    description:
      "Itemised estimates with contingency, permits and tax shown separately.",
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
