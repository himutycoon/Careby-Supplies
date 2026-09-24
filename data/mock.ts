import type {
  VisionAnalysis,
  CostEstimate,
  SupplyNote,
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
// Rules layer output — material list and supply notes
// ---------------------------------------------------------------------------

export const mockCostEstimate: CostEstimate = {
  lineItems: [
    {
      category: "Waterproofing",
      description: "Membrane, seam tape and sealant behind wet walls",
      quantity: 103,
      unit: "sq ft",
      unitCostCad: 3.2,
      totalCad: 330,
    },
    {
      category: "Drywall & compound",
      description: "Board, tape, compound and corner bead",
      quantity: 240,
      unit: "sq ft",
      unitCostCad: 0.95,
      totalCad: 228,
    },
    {
      category: "Flooring",
      description: "Porcelain floor tile for the finished area",
      quantity: 63,
      unit: "sq ft",
      unitCostCad: 6.5,
      totalCad: 410,
    },
    {
      category: "Underlay, mortar & grout",
      description: "Setting materials and transitions under the finished floor",
      quantity: 63,
      unit: "sq ft",
      unitCostCad: 1.15,
      totalCad: 72,
    },
    {
      category: "Wall tile",
      description: "Tub surround tile with trim pieces",
      quantity: 80,
      unit: "sq ft",
      unitCostCad: 7.5,
      totalCad: 600,
    },
    {
      category: "Cabinetry",
      description: "Stock vanity cabinet, door and hardware",
      quantity: 5,
      unit: "lin ft",
      unitCostCad: 210,
      totalCad: 1050,
    },
    {
      category: "Countertops",
      description: "Quartz vanity top cut to the cabinet run",
      quantity: 5,
      unit: "lin ft",
      unitCostCad: 70,
      totalCad: 350,
    },
    {
      category: "Trim, doors & hardware",
      description: "Baseboard, casing, interior door and handle",
      quantity: 32,
      unit: "lin ft",
      unitCostCad: 8.5,
      totalCad: 272,
    },
    {
      category: "Plumbing supplies",
      description: "PEX, valves, fittings, drains and supply lines",
      quantity: 1,
      unit: "rough-in kit",
      unitCostCad: 180,
      totalCad: 180,
    },
    {
      category: "Lighting & electrical devices",
      description: "Fixtures, switches, receptacles, plates and boxes",
      quantity: 2,
      unit: "each",
      unitCostCad: 95,
      totalCad: 190,
    },
    {
      category: "Paint & primer",
      description: "Primer, two finish coats, rollers, tape and drop sheets",
      quantity: 1,
      unit: "gal",
      unitCostCad: 64,
      totalCad: 64,
    },
    {
      category: "Fixtures & appliances",
      description:
        "Sink and faucet — supply only, flagged for replacement in your photos",
      quantity: 1,
      unit: "each",
      unitCostCad: 260,
      totalCad: 260,
    },
    {
      category: "Fixtures & appliances",
      description:
        "Toilet — supply only, flagged for replacement in your photos",
      quantity: 1,
      unit: "each",
      unitCostCad: 420,
      totalCad: 420,
    },
    {
      category: "Fixtures & appliances",
      description:
        "Alcove bathtub — supply only, flagged for replacement in your photos",
      quantity: 1,
      unit: "each",
      unitCostCad: 720,
      totalCad: 720,
    },
    {
      category: "Fixtures & appliances",
      description:
        "Exhaust fan — supply only, flagged for replacement in your photos",
      quantity: 1,
      unit: "each",
      unitCostCad: 220,
      totalCad: 220,
    },
    {
      category: "Repair materials",
      description:
        "Patching, board and sealant for the issues found in your photos",
      quantity: 3,
      unit: "areas",
      unitCostCad: 453,
      totalCad: 1360,
    },
    {
      category: "Fasteners & sundries",
      description: "Screws, adhesive, caulk, blades, shims and sandpaper",
      quantity: 1,
      unit: "allowance",
      unitCostCad: 260,
      totalCad: 260,
    },
  ],
  subtotal: 6961,
  wastePct: 0.15,
  wasteAllowance: 1044,
  hst: 1041,
  totalLow: 8503,
  totalHigh: 9860,
};

export const mockSupplyNotes: SupplyNote[] = [
  {
    id: "supply-materials",
    label: "Every line on this list",
    included: true,
    owner: "CareBy Supplies",
    note: "Priced from our catalogue and held for 30 days. Swap any line for a different brand or grade before you order.",
  },
  {
    id: "supply-delivery",
    label: "Delivery to site",
    included: true,
    owner: "CareBy Supplies",
    note: "Scheduled to your install date across the GTA, so material is not sitting on the driveway for a fortnight.",
  },
  {
    id: "supply-takeoff",
    label: "Quantity check before you order",
    included: true,
    owner: "CareBy Supplies",
    note: "Send us your measurements or drawings and we will confirm these quantities against them.",
  },
  {
    id: "supply-labour",
    label: "Installation labour",
    included: false,
    owner: "Your contractor or trades",
    note: "We supply material only — we do not install it or provide trades. Quantities here are sized so your installer can price their own labour against them.",
  },
  {
    id: "supply-permits",
    label: "Permits and inspections",
    included: false,
    owner: "You or your contractor",
    note: "Any permit, drawing or inspection your municipality requires is arranged by whoever is doing the work.",
  },
  {
    id: "supply-measure",
    label: "Site measurement",
    included: false,
    owner: "You or your contractor",
    note: "These quantities come from the dimensions you entered. Confirm them on site before ordering cut-to-size material.",
  },
  {
    id: "supply-repair",
    label: "Repair material for the issue in your photos",
    included: true,
    owner: "CareBy Supplies",
    note: "An allowance for patching and replacement board is on the list. Whatever caused the damage still needs looking at before new material goes over it.",
  },
];

// ---------------------------------------------------------------------------
// Instant estimate result
// ---------------------------------------------------------------------------

export const mockEstimate: EstimateResult = {
  verdict: "within-budget",
  vision: mockVisionAnalysis,
  cost: mockCostEstimate,
  supplyNotes: mockSupplyNotes,
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
    "Homeowner is switching the tub for a corner shower, so the tub line comes off the list and a shower base and door go on. Quantities assume the drain stays where it is — if your installer moves it, tell us and we will re-cut the plumbing supplies. Large-format porcelain is on the list at 6.50/sq ft; there is a 4.20 option in the same finish if the budget gets tight.",
  layoutDescription:
    "Material list is sized for a 34-inch corner shower in place of the tub/shower combo, with the vanity run moved to the opposite wall. That changes the tile split — less surround, more floor — and adds a shower base, door and one extra trim kit. Recessed lights and a humidity-sensing fan are included in the electrical devices line.",
  adminAdjustedCost: {
    lineItems: [
      ...mockCostEstimate.lineItems,
      {
        category: "Heated floor",
        description: "Heated floor mat and thermostat (added after measure)",
        quantity: 1,
        unit: "kit",
        unitCostCad: 500,
        totalCad: 500,
      },
    ],
    subtotal: 7461,
    wastePct: 0.15,
    wasteAllowance: 1119,
    hst: 1115,
    totalLow: 9113,
    totalHigh: 10568,
  },
  deliveredBy: "Jordan Blake — CareBy materials advisor",
  deliveredAt: "2026-08-27T13:20:00.000Z",
};

// ---------------------------------------------------------------------------
// Narrative layer — prose generated from rules-layer output (mocked here)
// ---------------------------------------------------------------------------

export const mockReportNarrative: ReportNarrative = {
  summary:
    "The materials for your bathroom come to $9,113–$10,568 delivered, well inside your $18,000 budget. That is material only — your contractor prices their labour on top. The biggest lines are the vanity and the tile, both tied to the walk-in shower on your wish-list.",
  conditionOverview:
    "Overall condition is poor, driven by a failing tub surround and early-stage subfloor water damage near the tub base. Every major fixture — toilet, vanity, tub, and exhaust fan — is original to the home and at or past typical replacement age.",
  scopeRationale:
    "The list is sized for a full strip-out, because the damaged subfloor has to come up regardless and the wall behind the tub will be open anyway. Buying the finishes in the same order means one delivery rather than three, and one set of waste allowance rather than three.",
  budgetGuidance:
    "At $9,113–$10,568 the materials sit well under your $18,000 budget, which leaves real room for your contractor's labour and for the tile upgrade and heated floor your advisor added after reviewing your photos.",
  nextSteps:
    "Check the quantities against your own measurements and tell us anything you want swapped. Once the list is right we will hold the pricing and book delivery to suit your installer's start date.",
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
  email: "carebysupplies@gmail.com",
  /** Display form. `whatsappNumber` is the digits wa.me needs. */
  phone: "+1 437 522 4606",
  whatsappNumber: "14375224606",
  address: "Mississauga, ON, Canada",
};

/** Click-to-chat link, built from the number so the two cannot drift. */
export const WHATSAPP_URL = `https://wa.me/${CONTACT_INFO.whatsappNumber}`;

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
  { value: "whole-home", label: "Full Home" },
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
    label: "Surface refresh",
    description: "Paint, flooring and fixtures. Nothing comes off the wall.",
  },
  {
    value: "moderate",
    label: "Replace finishes",
    description: "New finishes, cabinetry and fixtures, some board and trim.",
  },
  {
    value: "full-gut",
    label: "Strip to studs",
    description: "Everything out and everything new — board, insulation and all.",
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
      "See a concept image of the finished space alongside your original photos, so you can picture what the materials add up to.",
  },
  {
    icon: "AlertTriangle",
    title: "Detected issues & fixes",
    description:
      "Our AI flags visible problems in your photos — water damage, wear, outdated wiring — with severity ratings.",
  },
  {
    icon: "Receipt",
    title: "Itemised material list",
    description:
      "Every material and fixture broken out with quantities and unit prices, not just a lump sum.",
  },
  {
    icon: "ShieldCheck",
    title: "What we supply, what you arrange",
    description:
      "A plain list of what arrives on the truck and what your contractor handles — labour, permits and inspections are theirs, not ours.",
  },
  {
    icon: "Palette",
    title: "Material palette",
    description:
      "A curated set of finishes and materials matched to your space and budget.",
  },
  {
    icon: "UserCheck",
    title: "Checked by an advisor",
    description:
      "A real person checks the quantities against your photos before the list reaches you — never fully automated.",
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
      "Our AI reads your photos and returns an itemised material list — quantities, unit prices and a delivered range — in seconds.",
  },
  {
    step: 3,
    title: "Checked by hand in 48 hours",
    description:
      "A CareBy advisor checks the quantities against your photos, adds a concept image, and emails you the full material plan ready to order from.",
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
    description: "Instant material estimate for one room.",
    features: [
      "Instant AI photo analysis",
      "Itemised material list",
      "What we supply, what you arrange",
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
    description: "Everything in Starter, plus a material plan checked by hand.",
    features: [
      "Everything in Starter",
      "Material plan checked by hand",
      "Concept after-image",
      "Material palette",
      "Delivered within 48 hours",
    ],
    ctaLabel: "Get my full plan",
    ctaHref: "/new",
    highlighted: true,
  },
  {
    name: "Full Home",
    priceCad: 399,
    priceNote: "up to 4 rooms",
    description: "For supplying several rooms at once.",
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
      "No. It's an indicative material list built from your photos and the dimensions you gave us. An advisor checks it by hand, and quantities get confirmed against your own measurements before you order.",
  },
  {
    question: "What do I get within 48 hours?",
    answer:
      "A material plan checked by hand, a concept \"after\" image, and a full itemised material list, emailed to you and available in your dashboard.",
  },
  {
    question: "Do you do the installation too?",
    answer:
      "No. CareBy Supplies sells and delivers building materials. We don't install them, employ trades or manage the work — that stays with your own contractor.",
  },
  {
    question: "How accurate are the quantities?",
    answer:
      "They're a strong starting point from what's visible in your photos and the dimensions you entered, but nothing can see behind a wall. Confirm them on site before ordering anything cut to size — and anything left over comes back within 30 days.",
  },
  {
    question: "Which areas do you serve?",
    answer:
      "We're currently serving Mississauga, Ontario, with more municipalities coming soon.",
  },
  {
    question: "Do you supply new builds?",
    answer:
      "Yes. Send drawings and we'll price the material stage by stage, from framing through to finishes.",
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
