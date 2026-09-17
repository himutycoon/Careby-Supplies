import type {
  VisionAnalysis,
  CostEstimate,
  PermitCheck,
  RenovationInput,
  EstimateResult,
  Submission,
  DeliveredPlan,
  Report,
  ReportNarrative,
  RoomType,
  ScopeLevel,
  PropertyType,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Renovation input — 9ft x 7ft Mississauga bathroom, full-gut, $18,000 budget
// ---------------------------------------------------------------------------

export const mockRenovationInput: RenovationInput = {
  propertyType: "house",
  isOwner: true,
  roomType: "bathroom",
  lengthFt: 9,
  widthFt: 7,
  ceilingHeightFt: 8,
  scopeLevel: "full-gut",
  wishlist: [
    "Walk-in shower instead of tub/shower combo",
    "Better lighting over the vanity",
    "Improved ventilation",
    "Modern large-format tile",
  ],
  budgetCad: 18000,
  municipalityId: "mississauga-on",
  photoUrls: [
    "/mock/bathroom-1.jpg",
    "/mock/bathroom-2.jpg",
    "/mock/bathroom-3.jpg",
    "/mock/bathroom-4.jpg",
  ],
  notes:
    "Original 1990s bathroom, never renovated. Noticed some soft flooring near the tub.",
};

// ---------------------------------------------------------------------------
// Vision layer output
// ---------------------------------------------------------------------------

export const mockVisionAnalysis: VisionAnalysis = {
  roomType: "bathroom",
  detectedFixtures: [
    {
      name: "Toilet",
      type: "toilet",
      condition: "fair",
      estimatedAge: "15-20 years",
      replaceRecommended: true,
    },
    {
      name: "Pedestal Vanity & Sink",
      type: "vanity",
      condition: "poor",
      estimatedAge: "20+ years",
      replaceRecommended: true,
    },
    {
      name: "Alcove Bathtub",
      type: "bathtub",
      condition: "poor",
      estimatedAge: "20+ years",
      replaceRecommended: true,
    },
    {
      name: "Tub/Shower Diverter Valve",
      type: "shower-valve",
      condition: "poor",
      estimatedAge: "20+ years",
      replaceRecommended: true,
    },
    {
      name: "Exhaust Fan",
      type: "ventilation",
      condition: "poor",
      estimatedAge: "15-20 years",
      replaceRecommended: true,
    },
    {
      name: "Vanity Light Bar",
      type: "lighting",
      condition: "fair",
      estimatedAge: "10-15 years",
      replaceRecommended: true,
    },
  ],
  detectedFinishes: [
    { surface: "floor", material: "vinyl sheet", condition: "poor" },
    {
      surface: "wall",
      material: "ceramic tile (lower half), painted drywall (upper)",
      condition: "fair",
    },
    { surface: "ceiling", material: "painted drywall", condition: "fair" },
    { surface: "counter", material: "laminate", condition: "poor" },
  ],
  overallCondition: "poor",
  issues: [
    {
      id: "issue-1",
      severity: "major",
      label: "Subfloor water damage",
      description:
        "Soft spot and discoloration detected around the base of the toilet and tub, consistent with a long-term slow leak.",
      affectedArea: "Floor, toilet and tub base",
    },
    {
      id: "issue-2",
      severity: "moderate",
      label: "Deteriorated tub/tile caulking",
      description:
        "Caulking along the tub-to-tile joint is cracked and separating, allowing water intrusion behind the surround.",
      affectedArea: "Tub surround",
    },
    {
      id: "issue-3",
      severity: "moderate",
      label: "No GFCI protection",
      description:
        "The outlet near the vanity sink does not appear to be GFCI-protected, a code requirement near water sources.",
      affectedArea: "Vanity wall outlet",
    },
    {
      id: "issue-4",
      severity: "minor",
      label: "Cracked wall tile",
      description:
        "Two cracked tiles visible on the tub surround, likely from settling or impact.",
      affectedArea: "Tub surround, lower row",
    },
  ],
  confidence: 0.87,
};

// ---------------------------------------------------------------------------
// Rules layer output — cost and permits
// ---------------------------------------------------------------------------

export const mockCostEstimate: CostEstimate = {
  lineItems: [
    {
      trade: "Demolition",
      description: "Full bathroom strip-out to studs and subfloor",
      quantity: 63,
      unit: "sq ft",
      unitCostCad: 8,
      totalCad: 504,
    },
    {
      trade: "General",
      description: "Debris disposal and dumpster fee",
      quantity: 1,
      unit: "flat fee",
      unitCostCad: 450,
      totalCad: 450,
    },
    {
      trade: "Plumbing",
      description: "Rough-in plumbing relocation and supply lines",
      quantity: 1,
      unit: "flat fee",
      unitCostCad: 1800,
      totalCad: 1800,
    },
    {
      trade: "Electrical",
      description: "Rough-in electrical: GFCI circuit, fan and light wiring",
      quantity: 1,
      unit: "flat fee",
      unitCostCad: 1200,
      totalCad: 1200,
    },
    {
      trade: "Carpentry",
      description: "Subfloor repair at water-damaged area",
      quantity: 25,
      unit: "sq ft",
      unitCostCad: 14,
      totalCad: 350,
    },
    {
      trade: "Waterproofing",
      description: "Waterproofing membrane at tub/shower surround",
      quantity: 40,
      unit: "sq ft",
      unitCostCad: 9,
      totalCad: 360,
    },
    {
      trade: "Tile",
      description: "Porcelain floor tile, supply and install",
      quantity: 63,
      unit: "sq ft",
      unitCostCad: 14,
      totalCad: 882,
    },
    {
      trade: "Tile",
      description: "Wall tile, tub surround, supply and install",
      quantity: 80,
      unit: "sq ft",
      unitCostCad: 16,
      totalCad: 1280,
    },
    {
      trade: "Plumbing",
      description: "Vanity and sink, supply and install",
      quantity: 1,
      unit: "each",
      unitCostCad: 1600,
      totalCad: 1600,
    },
    {
      trade: "Plumbing",
      description: "Toilet, supply and install",
      quantity: 1,
      unit: "each",
      unitCostCad: 650,
      totalCad: 650,
    },
    {
      trade: "Plumbing",
      description: "Acrylic alcove bathtub, supply and install",
      quantity: 1,
      unit: "each",
      unitCostCad: 900,
      totalCad: 900,
    },
    {
      trade: "Plumbing",
      description: "Tub/shower valve and trim kit",
      quantity: 1,
      unit: "each",
      unitCostCad: 550,
      totalCad: 550,
    },
    {
      trade: "Electrical",
      description: "Humidity-sensing exhaust fan replacement",
      quantity: 1,
      unit: "each",
      unitCostCad: 380,
      totalCad: 380,
    },
    {
      trade: "Electrical",
      description: "Vanity light fixture and mirror install",
      quantity: 1,
      unit: "each",
      unitCostCad: 320,
      totalCad: 320,
    },
  ],
  subtotal: 11226,
  contingencyPct: 0.15,
  contingency: 1684,
  permitFees: 350,
  hst: 1678,
  totalLow: 14200,
  totalHigh: 16900,
};

export const mockPermitChecks: PermitCheck[] = [
  {
    id: "permit-building",
    label: "Building Permit",
    required: true,
    authority: "City of Mississauga — Building Division",
    note: "Required because plumbing fixtures (toilet, vanity) are being relocated, not replaced in place.",
  },
  {
    id: "permit-electrical",
    label: "Electrical Permit (ESA)",
    required: true,
    authority: "Electrical Safety Authority (ESA)",
    note: "Required for the new GFCI circuit and exhaust fan wiring.",
  },
  {
    id: "permit-mechanical",
    label: "Mechanical/HVAC Permit",
    required: false,
    authority: "City of Mississauga — Building Division",
    note: "Not required for a like-for-like exhaust fan vent replacement.",
  },
];

// ---------------------------------------------------------------------------
// Instant estimate result
// ---------------------------------------------------------------------------

export const mockEstimate: EstimateResult = {
  verdict: "within-budget",
  vision: mockVisionAnalysis,
  cost: mockCostEstimate,
  permits: mockPermitChecks,
  scopeLevel: "full-gut",
  budgetCad: 18000,
  generatedAt: "2026-08-30T16:42:00.000Z",
};

// ---------------------------------------------------------------------------
// Submissions — one per pipeline status reachable after submit
// (draft submissions are local/unsaved and have no server-side mock)
// ---------------------------------------------------------------------------

export const mockSubmissions: Submission[] = [
  {
    id: "sub-1001",
    userId: "user-501",
    input: mockRenovationInput,
    estimate: mockEstimate,
    status: "submitted",
    createdAt: "2026-08-30T16:42:00.000Z",
    deliveredAt: null,
  },
  {
    id: "sub-1002",
    userId: "user-502",
    input: mockRenovationInput,
    estimate: mockEstimate,
    status: "in-review",
    createdAt: "2026-08-28T09:15:00.000Z",
    deliveredAt: null,
  },
  {
    id: "sub-1003",
    userId: "user-503",
    input: mockRenovationInput,
    estimate: mockEstimate,
    status: "delivered",
    createdAt: "2026-08-25T11:05:00.000Z",
    deliveredAt: "2026-08-27T13:20:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// Delivered plan — admin upload for sub-1003
// ---------------------------------------------------------------------------

export const mockDeliveredPlan: DeliveredPlan = {
  submissionId: "sub-1003",
  afterImageUrls: ["/mock/after-1.jpg", "/mock/after-2.jpg"],
  planNotes:
    "Homeowner confirmed openness to a walk-in shower during scope review. Design keeps existing drain locations to control plumbing rough-in cost. Recommend porcelain tile in a large-format plank pattern to visually extend the 9x7 footprint. Added a small electrical allowance for a heated-floor rough-in on-site.",
  layoutDescription:
    "Shift the toilet 4 inches toward the exterior wall to allow for a 34-inch corner shower with a low-profile base, replacing the tub/shower combo. Relocate the vanity to the opposite wall to improve traffic flow between the door and shower entry. Add recessed lighting above the vanity, paired with a humidity-sensing exhaust fan centered over the shower.",
  adminAdjustedCost: {
    lineItems: [
      ...mockCostEstimate.lineItems,
      {
        trade: "Electrical",
        description: "Heated floor mat rough-in (added after site visit)",
        quantity: 1,
        unit: "each",
        unitCostCad: 500,
        totalCad: 500,
      },
    ],
    subtotal: 11726,
    contingencyPct: 0.15,
    contingency: 1759,
    permitFees: 350,
    hst: 1753,
    totalLow: 14700,
    totalHigh: 17400,
  },
  deliveredBy: "Jordan Blake — CareBy Design Team",
  deliveredAt: "2026-08-27T13:20:00.000Z",
};

// ---------------------------------------------------------------------------
// Narrative layer — prose generated from rules-layer output (mocked here)
// ---------------------------------------------------------------------------

export const mockReportNarrative: ReportNarrative = {
  summary:
    "Your bathroom is a strong candidate for a full-gut renovation within your $18,000 budget. The largest cost drivers are plumbing relocation and tile, both tied directly to the walk-in shower on your wish-list.",
  conditionOverview:
    "Overall condition is poor, driven by a failing tub surround and early-stage subfloor water damage near the tub base. Every major fixture — toilet, vanity, tub, and exhaust fan — is original to the home and at or past typical replacement age.",
  scopeRationale:
    "We've scoped this as a full gut because the water damage repair requires opening the floor regardless, and the wiring needs to be brought up to current GFCI requirements. Doing the finishes at the same time avoids paying for access twice.",
  budgetGuidance:
    "Your estimated range of $14,200–$16,900 sits comfortably under your $18,000 budget, leaving room for the tile upgrade and heated-floor rough-in your designer added after reviewing your photos.",
  nextSteps:
    "Review the layout and material palette below. When you're ready, reply to your delivery email with any changes, or reach out to schedule a contractor walkthrough.",
};

export const mockReport: Report = {
  ...mockSubmissions[2],
  deliveredPlan: mockDeliveredPlan,
  narrative: mockReportNarrative,
};

// ---------------------------------------------------------------------------
// Lookup helpers — every [id] route resolves to something real in the demo.
// Unknown or demo ids (e.g. "demo-1" from the wizard) fall back to the
// canonical mock estimate/report so no link is ever dead.
// ---------------------------------------------------------------------------

export function getSubmissionById(id: string): Submission | undefined {
  return mockSubmissions.find((submission) => submission.id === id);
}

export function getEstimateById(id: string): EstimateResult {
  return getSubmissionById(id)?.estimate ?? mockEstimate;
}

export function getReportById(id: string): Report {
  const submission = getSubmissionById(id);
  if (submission && submission.status === "delivered") {
    return {
      ...submission,
      deliveredPlan: mockDeliveredPlan,
      narrative: mockReportNarrative,
    };
  }
  return mockReport;
}

// ---------------------------------------------------------------------------
// Site content — nav, footer, marketing copy. Kept here so components stay
// free of hardcoded strings. Placeholder pricing/legal copy — see task notes.
// ---------------------------------------------------------------------------

export interface NavLink {
  label: string;
  href: string;
}

export const NAV_LINKS: NavLink[] = [
  { label: "Products", href: "/products" },
  { label: "Services", href: "/services" },
  { label: "Projects", href: "/projects" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "About", href: "/about" },
];

export interface FooterColumn {
  title: string;
  links: NavLink[];
}

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Shop",
    links: [
      { label: "All Products", href: "/products" },
      { label: "Services", href: "/services" },
      { label: "Projects", href: "/projects" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Contact", href: "/contact" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Refund Policy", href: "/refund" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Get Started", href: "/get-started" },
      { label: "Login", href: "/login" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Contractor Tools", href: "/contractor" },
    ],
  },
];

export const CONTACT_INFO = {
  email: "hello@careby.ca",
  phone: "(905) 555-0142",
  address: "Mississauga, ON, Canada",
};

export const TRUST_LINE =
  "Built for Mississauga homeowners planning their first renovation.";

export interface RoomTypeOption {
  value: RoomType;
  label: string;
}

// All room types, including ones no longer offered by the wizard — used for
// label lookups everywhere a submission (old or new) needs to display its
// room type. For the wizard's own selectable options, use
// RENOVATION_TYPE_OPTIONS below instead.
export const ROOM_TYPE_OPTIONS: RoomTypeOption[] = [
  { value: "bathroom", label: "Bathroom" },
  { value: "kitchen", label: "Kitchen" },
  { value: "basement", label: "Basement" },
  { value: "bedroom", label: "Bedroom" },
  { value: "living", label: "Living Room" },
  { value: "whole-home", label: "Whole Home" },
  { value: "addition", label: "Addition" },
  { value: "deck", label: "Deck" },
];

// The reno types actually offered in the wizard and homepage widget.
export const RENOVATION_TYPE_OPTIONS: RoomTypeOption[] = [
  { value: "bathroom", label: "Bathroom" },
  { value: "kitchen", label: "Kitchen" },
  { value: "basement", label: "Basement" },
  { value: "addition", label: "Addition" },
  { value: "deck", label: "Deck" },
];

export interface ScopeLevelOption {
  value: ScopeLevel;
  label: string;
  description: string;
}

export const SCOPE_LEVEL_OPTIONS: ScopeLevelOption[] = [
  {
    value: "cosmetic",
    label: "Cosmetic",
    description: "Paint, fixtures, and a surface refresh — no layout changes.",
  },
  {
    value: "moderate",
    label: "Moderate",
    description: "New finishes and fixtures, with some relocation.",
  },
  {
    value: "full-gut",
    label: "Full Gut",
    description: "Strip to studs, reconfigure the layout, all-new systems.",
  },
];

export interface PropertyTypeOption {
  value: PropertyType;
  label: string;
}

export const PROPERTY_TYPE_OPTIONS: PropertyTypeOption[] = [
  { value: "house", label: "House" },
  { value: "condo", label: "Condo" },
];

export const MUNICIPALITIES = [{ id: "mississauga-on", name: "Mississauga, ON" }];

export const WISHLIST_OPTIONS: string[] = [
  "Walk-in shower",
  "Double vanity",
  "Heated flooring",
  "Custom cabinetry",
  "Kitchen island",
  "New lighting plan",
  "Improved ventilation",
  "Energy-efficient fixtures",
  "Built-in storage",
  "Smart home fixtures",
];

export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

export const FEATURES: FeatureItem[] = [
  {
    icon: "Image",
    title: "Before/after plan",
    description:
      "See a hand-designed concept image of your renovated space alongside your original photos.",
  },
  {
    icon: "AlertTriangle",
    title: "Detected issues & fixes",
    description:
      "Our AI flags visible problems in your photos — water damage, wear, outdated wiring — with severity ratings.",
  },
  {
    icon: "Receipt",
    title: "Itemised cost breakdown",
    description:
      "Every trade, material, and fixture broken out with quantities and unit costs, not just a lump sum.",
  },
  {
    icon: "ShieldCheck",
    title: "Permits & code check",
    description:
      "A checklist of which permits your project likely needs, and which authority issues them.",
  },
  {
    icon: "Palette",
    title: "Material palette",
    description:
      "A curated set of finishes and materials matched to your space and budget.",
  },
  {
    icon: "UserCheck",
    title: "Designer review",
    description:
      "A real person reviews your submission and builds your plan by hand — never fully automated.",
  },
];

export interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    step: 1,
    title: "Upload photos",
    description:
      "Share photos of the room, your dimensions, wish-list, and budget. Takes about five minutes.",
  },
  {
    step: 2,
    title: "Instant AI estimate",
    description:
      "Our AI reads your photos and returns a structured estimate — scope, likely issues, and an itemised cost range — in seconds.",
  },
  {
    step: 3,
    title: "Hand-designed plan in 48 hours",
    description:
      "A CareBy designer reviews your submission, builds your renovation plan and a concept image by hand, and emails you the full report.",
  },
];

export interface PricingTier {
  name: string;
  priceCad: number | null;
  priceNote: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  highlighted: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    name: "Starter",
    priceCad: 0,
    priceNote: "Free",
    description: "Instant AI estimate for one room.",
    features: [
      "Instant AI photo analysis",
      "Itemised cost range",
      "Permit flags",
      "Email summary",
    ],
    ctaLabel: "Get my estimate",
    ctaHref: "/new",
    highlighted: false,
  },
  {
    name: "Full Plan",
    priceCad: 149,
    priceNote: "per room",
    description: "Everything in Starter, plus a hand-designed renovation plan.",
    features: [
      "Everything in Starter",
      "Hand-designed renovation plan",
      "Concept after-image",
      "Material palette",
      "Delivered within 48 hours",
    ],
    ctaLabel: "Get my full plan",
    ctaHref: "/new",
    highlighted: true,
  },
  {
    name: "Whole Home",
    priceCad: 399,
    priceNote: "up to 4 rooms",
    description: "For multi-room renovations across your home.",
    features: [
      "Everything in Full Plan",
      "Up to 4 rooms",
      "Priority 48-hour delivery",
      "One round of revisions",
    ],
    ctaLabel: "Contact us",
    ctaHref: "/contact",
    highlighted: false,
  },
];

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQS: FaqItem[] = [
  {
    question: "Is the instant estimate final?",
    answer:
      "No. It's an indicative, AI-generated starting point based on your photos and inputs. Your full plan is designed by hand and may adjust the numbers.",
  },
  {
    question: "What do I get within 48 hours?",
    answer:
      "A hand-designed renovation plan, a concept \"after\" image, and a full itemised cost report, emailed to you and available in your dashboard.",
  },
  {
    question: "Is this a permit or a construction contract?",
    answer:
      "No. CareBy output is indicative planning guidance, not a permit submission or a construction contract.",
  },
  {
    question: "How accurate is the AI estimate?",
    answer:
      "It's a strong starting point based on what's visible in your photos, but it can't see behind walls or under floors. Your full plan accounts for anything a designer finds on closer review.",
  },
  {
    question: "Which areas do you serve?",
    answer:
      "We're currently serving Mississauga, Ontario, with more municipalities coming soon.",
  },
  {
    question: "Do you handle new builds?",
    answer:
      "Not yet — CareBy currently focuses on renovations of existing homes only.",
  },
];

export interface MaterialSwatch {
  name: string;
  hex: string;
  category: string;
}

export const MATERIAL_PALETTE: MaterialSwatch[] = [
  { name: "Warm White", hex: "#F5F1EA", category: "Wall Paint" },
  { name: "Slate Porcelain", hex: "#6B7280", category: "Floor Tile" },
  { name: "Matte Black", hex: "#1F2937", category: "Fixtures" },
  { name: "Brushed Nickel", hex: "#B8BCC0", category: "Hardware" },
  { name: "Natural Oak", hex: "#C9A876", category: "Vanity" },
  { name: "Sage Accent", hex: "#9CAF97", category: "Accent Wall" },
];
