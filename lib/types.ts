/**
 * Single source of truth for CareBy Supplies domain types.
 *
 * Layering (see project architecture rule):
 * 1. Vision layer  — VisionAnalysis and its parts. Structured JSON only,
 *    produced by Claude reading photos. No costs, no verdicts.
 * 2. Rules layer    — CostEstimate, SupplyNote, EstimateResult.verdict.
 *    Pure TypeScript computation. Owns every number the user sees.
 * 3. Narrative layer — Report. Prose generated from rules-layer output.
 */

// ---------------------------------------------------------------------------
// Shared enums
// ---------------------------------------------------------------------------

export type RoomType =
  | "bathroom"
  | "kitchen"
  | "basement"
  | "bedroom" // deprecated: no longer offered by the wizard, kept for existing submissions
  | "living" // deprecated: same
  | "whole-home" // deprecated: same
  | "addition"
  | "deck";

export type ScopeLevel = "cosmetic" | "moderate" | "full-gut";

export type Condition = "good" | "fair" | "poor";

export type PropertyType = "condo" | "house";

export type UserRole = "homeowner" | "contractor" | "admin";

// ---------------------------------------------------------------------------
// Catalog — shared by contractor and homeowner shopping surfaces
// ---------------------------------------------------------------------------

export interface ProductCategory {
  id: string;
  name: string;
  icon: string;
  /** Optional department photo; call sites fall back to the icon. */
  imageUrl?: string;
}

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export interface Product {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  /** Retail price shown to homeowners. */
  priceCad: number;
  /** Trade price shown to signed-in contractors. */
  contractorPriceCad: number;
  unit: string;
  rating: number;
  reviewCount: number;
  stock: StockStatus;
  deliveryEstimate: string;
  description: string;
  specifications: { label: string; value: string }[];
  /** Placeholder tone used until real product photography exists. */
  tone: "sand" | "slate" | "forest" | "navy";
  /** Real product image once uploaded; falls back to the tone placeholder. */
  imageUrl?: string;
  /** Catalog listing date — drives the "Newest" sort and the NEW badge. */
  createdAt?: string;
}

export interface CartLine {
  productId: string;
  quantity: number;
  /** Optional project assignment so orders can be grouped by job. */
  projectId?: string;
}

// ---------------------------------------------------------------------------
// Commerce + workflow entities (prototype persistence — see services/)
// ---------------------------------------------------------------------------

export type OrderStatus =
  | "processing"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderLine {
  productId: string;
  name: string;
  brand: string;
  unit: string;
  unitPriceCad: number;
  quantity: number;
  projectId?: string;
}

export interface Order {
  /** Human-facing reference (ORD-XXXXXX) used in URLs and receipts. */
  id: string;
  /** Database uuid, needed for status updates. */
  dbId?: string;
  createdAt: string;
  status: OrderStatus;
  lines: OrderLine[];
  subtotal: number;
  delivery: number;
  tax: number;
  total: number;
  deliveryMethod: string;
  contact: {
    name: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
  };
}

export type ProjectStatus =
  | "planning"
  | "in-progress"
  | "materials-ready"
  | "completed";

export interface Project {
  id: string;
  name: string;
  type: "repair" | "renovation" | "new_construction" | "package";
  subtype: string;
  status: ProjectStatus;
  location: string;
  createdAt: string;
  notes: string;
  /** Support tier chosen in the Category Order flow, if any. */
  supportPackage?: string;
  supportPackagePriceCad?: number;
}

export type PackageStatus = "draft" | "sent" | "approved" | "ordered";

export interface PackageLine {
  productId: string;
  quantity: number;
}

export interface CustomerPackage {
  /** Human-facing reference (PKG-XXXXXX) used in portal URLs. */
  id: string;
  /** Database uuid, needed for updates. */
  dbId?: string;
  name: string;
  status: PackageStatus;
  createdAt: string;
  projectType: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  lines: PackageLine[];
  accessCode: string;
  /** Server-computed total (trade pricing + delivery + HST). */
  totalPrice?: number;
}

export type AppointmentStatus = "scheduled" | "completed" | "cancelled";

export interface Appointment {
  /** Human-facing reference (CALL-XXXXXX). */
  id: string;
  /** Database uuid. */
  dbId?: string;
  category: string;
  date: string;
  time: string;
  notes: string;
  status: AppointmentStatus;
  createdAt: string;
}

export interface DrawingUpload {
  /** Human-facing reference (DWG-XXXXXX). */
  id: string;
  /** Database uuid. */
  dbId?: string;
  projectName: string;
  location: string;
  drawingType: string;
  comments: string;
  fileNames: string[];
  /** Storage object path, used to mint a short-lived signed URL. */
  filePath?: string;
  createdAt: string;
  status: "analyzing" | "ready";
}

export interface CalculatedMaterial {
  id: string;
  material: string;
  quantity: number;
  unit: string;
  estimatedCostCad: number;
  /** Links back to a catalog product where one exists. */
  productId?: string;
}

// ---------------------------------------------------------------------------
// Vision layer — what Claude returns from photos
// ---------------------------------------------------------------------------

export interface Fixture {
  name: string;
  type: string;
  condition: Condition;
  estimatedAge: string;
  replaceRecommended: boolean;
}

export interface Finish {
  surface: "floor" | "wall" | "ceiling" | "counter";
  material: string;
  condition: Condition;
}

export interface DetectedIssue {
  id: string;
  severity: "minor" | "moderate" | "major";
  label: string;
  description: string;
  affectedArea: string;
}

export interface VisionAnalysis {
  roomType: RoomType;
  detectedFixtures: Fixture[];
  detectedFinishes: Finish[];
  overallCondition: Condition;
  issues: DetectedIssue[];
  confidence: number;
}

// ---------------------------------------------------------------------------
// User-submitted input
// ---------------------------------------------------------------------------

export interface RenovationInput {
  propertyType: PropertyType;
  isOwner: boolean;
  roomType: RoomType;
  lengthFt: number;
  widthFt: number;
  ceilingHeightFt: number;
  scopeLevel: ScopeLevel;
  wishlist: string[];
  budgetCad: number;
  municipalityId: string;
  photoUrls: string[];
  notes: string;
}

// ---------------------------------------------------------------------------
// Rules layer — deterministic materials pricing and scope logic
// ---------------------------------------------------------------------------

/** One material on the quote: what it is, how much of it, what it costs. */
export interface CostLineItem {
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unitCostCad: number;
  totalCad: number;
}

export interface CostEstimate {
  lineItems: CostLineItem[];
  subtotal: number;
  /** Cut waste and breakage, as a fraction of the subtotal. */
  wastePct: number;
  wasteAllowance: number;
  hst: number;
  totalLow: number;
  totalHigh: number;
}

/**
 * A line on the "what we supply, what you arrange" list. CareBy sells
 * material, not labour, so every quote says plainly which side of that
 * line each part of the job falls on.
 */
export interface SupplyNote {
  id: string;
  label: string;
  /** True when CareBy provides it; false when the customer arranges it. */
  included: boolean;
  /** Who it falls to — "CareBy Supplies", "Your contractor", and so on. */
  owner: string;
  note: string;
}

// ---------------------------------------------------------------------------
// Instant estimate output (rules layer decides verdict; vision/cost feed it)
// ---------------------------------------------------------------------------

export type EstimateVerdict = "within-budget" | "tight" | "over-budget";

export interface EstimateResult {
  verdict: EstimateVerdict;
  vision: VisionAnalysis;
  cost: CostEstimate;
  supplyNotes: SupplyNote[];
  scopeLevel: ScopeLevel;
  budgetCad: number;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Submission lifecycle
// ---------------------------------------------------------------------------

export type SubmissionStatus = "draft" | "submitted" | "in-review" | "delivered";

export interface Submission {
  id: string;
  userId: string;
  input: RenovationInput;
  estimate: EstimateResult;
  status: SubmissionStatus;
  createdAt: string;
  deliveredAt: string | null;
}

// ---------------------------------------------------------------------------
// Human-delivered plan (admin upload, within 48 hours)
// ---------------------------------------------------------------------------

export interface DeliveredPlan {
  submissionId: string;
  afterImageUrls: string[];
  planNotes: string;
  layoutDescription: string;
  adminAdjustedCost: CostEstimate | null;
  deliveredBy: string;
  deliveredAt: string;
}

// ---------------------------------------------------------------------------
// Narrative layer — final report shown/downloaded by the user
// ---------------------------------------------------------------------------

export interface ReportNarrative {
  summary: string;
  conditionOverview: string;
  scopeRationale: string;
  budgetGuidance: string;
  nextSteps: string;
}

export interface Report extends Submission {
  deliveredPlan: DeliveredPlan;
  narrative: ReportNarrative;
}
