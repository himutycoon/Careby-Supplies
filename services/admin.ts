import { createClient } from "@/lib/supabase/client";
import { fail, ok, toUserMessage, type ServiceResult } from "@/services/client";

/**
 * Admin reads/writes.
 *
 * These use the normal (anon-key) client on purpose — every query is
 * authorised by the database's own `is_admin()` RLS policies. The
 * service-role key is never used in browser code.
 */

export interface AdminStats {
  totalUsers: number;
  homeowners: number;
  contractors: number;
  orders: number;
  revenue: number;
  activeProjects: number;
  pendingServiceRequests: number;
  pendingVerification: number;
  drawingsAwaiting: number;
  /** Orders still sitting at "processing" — the ones to action today. */
  newOrders: number;
  lowStock: number;
  outOfStock: number;
  pendingCalls: number;
  pendingPremium: number;
}

interface CountFilter {
  column: string;
  /** eq matches one value; in matches any of several. */
  eq?: string;
  in?: string[];
}

async function countOf(
  table: string,
  filter?: CountFilter,
): Promise<number> {
  const supabase = createClient();
  let query = supabase.from(table).select("*", { count: "exact", head: true });

  if (filter?.eq !== undefined) query = query.eq(filter.column, filter.eq);
  if (filter?.in !== undefined) query = query.in(filter.column, filter.in);

  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = createClient();

  const [
    totalUsers,
    homeowners,
    contractors,
    orders,
    activeProjects,
    pendingServiceRequests,
    pendingVerification,
    drawingsAwaiting,
    newOrders,
    lowStock,
    outOfStock,
    pendingCalls,
    pendingPremium,
  ] = await Promise.all([
    countOf("profiles"),
    countOf("profiles", { column: "role", eq: "homeowner" }),
    countOf("profiles", { column: "role", eq: "contractor" }),
    countOf("orders"),
    countOf("projects", {
      column: "status",
      in: ["planning", "in_progress"],
    }),
    countOf("service_requests", {
      column: "status",
      in: ["requested", "reviewing"],
    }),
    countOf("contractor_profiles", {
      column: "verification_status",
      eq: "pending",
    }),
    countOf("drawing_uploads", {
      column: "processing_status",
      in: ["uploaded", "analyzing"],
    }),
    countOf("orders", { column: "status", eq: "processing" }),
    countOf("products", { column: "stock_status", eq: "low-stock" }),
    countOf("products", { column: "stock_status", eq: "out-of-stock" }),
    countOf("call_orders", { column: "status", eq: "scheduled" }),
    countOf("premium_requests", {
      column: "status",
      in: ["requested", "reviewing"],
    }),
  ]);

  const { data: revenueRows } = await supabase
    .from("orders")
    .select("total")
    .neq("status", "cancelled");

  const revenue = (revenueRows ?? []).reduce(
    (sum, row) => sum + Number((row as { total: number }).total ?? 0),
    0,
  );

  return {
    totalUsers,
    homeowners,
    contractors,
    orders,
    revenue,
    activeProjects,
    pendingServiceRequests,
    pendingVerification,
    drawingsAwaiting,
    newOrders,
    lowStock,
    outOfStock,
    pendingCalls,
    pendingPremium,
  };
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export async function getUsers(search = ""): Promise<AdminUser[]> {
  const supabase = createClient();
  let query = supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(`email.ilike.${term},full_name.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    email: (row.email as string) ?? "",
    fullName: (row.full_name as string) ?? "",
    role: (row.role as string) ?? "homeowner",
    createdAt: row.created_at as string,
  }));
}

export async function updateUserRole(
  userId: string,
  role: string,
): Promise<ServiceResult<null>> {
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    console.error("[updateUserRole]", error);
    return fail(toUserMessage(error, "We couldn't update that role."));
  }
  return ok(null);
}

export interface AdminContractor {
  userId: string;
  companyName: string;
  licenseNumber: string;
  city: string;
  verificationStatus: string;
  createdAt: string;
}

export async function getContractors(): Promise<AdminContractor[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("contractor_profiles")
    .select(
      "user_id, company_name, license_number, city, verification_status, created_at",
    )
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => ({
    userId: row.user_id as string,
    companyName: (row.company_name as string) ?? "",
    licenseNumber: (row.license_number as string) ?? "",
    city: (row.city as string) ?? "",
    verificationStatus: (row.verification_status as string) ?? "pending",
    createdAt: row.created_at as string,
  }));
}

export async function setContractorVerification(
  userId: string,
  status: "pending" | "verified" | "rejected" | "suspended",
): Promise<ServiceResult<null>> {
  const supabase = createClient();
  const { error } = await supabase
    .from("contractor_profiles")
    .update({ verification_status: status, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (error) {
    console.error("[setContractorVerification]", error);
    return fail(toUserMessage(error, "We couldn't update verification."));
  }
  return ok(null);
}

export interface AdminProductInput {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  homeownerPrice: number;
  contractorPrice: number;
  unit: string;
  stockQuantity: number;
  lowStockThreshold: number;
  description: string;
  imageUrl: string;
  isActive: boolean;
}

export async function upsertProduct(
  input: AdminProductInput,
): Promise<ServiceResult<null>> {
  if (!input.name.trim()) return fail("Product name is required.");
  if (input.homeownerPrice < 0 || input.contractorPrice < 0) {
    return fail("Prices can't be negative.");
  }
  if (input.stockQuantity < 0) return fail("Stock can't be negative.");

  const supabase = createClient();
  const base = {
    id: input.id,
    name: input.name.trim(),
    slug: input.id,
    brand: input.brand.trim(),
    category_id: input.categoryId || null,
    price: input.homeownerPrice,
    homeowner_price: input.homeownerPrice,
    contractor_price: input.contractorPrice,
    unit: input.unit,
    stock_quantity: input.stockQuantity,
    description: input.description.trim(),
    image_url: input.imageUrl.trim() || null,
    is_active: input.isActive,
    updated_at: new Date().toISOString(),
  };

  // stock_status is intentionally never sent — a trigger derives it from
  // the quantity so the two can never disagree. low_stock_threshold is
  // retried away if schema-07 hasn't been applied yet.
  let { error } = await supabase
    .from("products")
    .upsert({ ...base, low_stock_threshold: input.lowStockThreshold });

  if (error) {
    ({ error } = await supabase.from("products").upsert(base));
  }

  if (error) {
    console.error("[upsertProduct]", error);
    return fail(toUserMessage(error, "We couldn't save that product."));
  }
  return ok(null);
}

export interface AdminProductRow {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  homeownerPrice: number;
  contractorPrice: number;
  unit: string;
  stockQuantity: number;
  stockStatus: string;
  /** Count at or below which the product counts as low. */
  lowStockThreshold: number;
  description: string;
  imageUrl: string;
  isActive: boolean;
}

/**
 * Updates stock count only.
 *
 * Separate from upsertProduct so adjusting a count is one tap from the
 * list instead of opening a ten-field form. stock_status is NOT sent —
 * a database trigger derives it from the quantity (schema-07), so the
 * number stays the single source of truth.
 */
export async function setProductStock(
  id: string,
  quantity: number,
): Promise<ServiceResult<null>> {
  if (!Number.isFinite(quantity) || quantity < 0) {
    return fail("Stock can't be negative.");
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("products")
    .update({
      stock_quantity: Math.round(quantity),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("[setProductStock]", error);
    return fail(toUserMessage(error, "We couldn't update that stock count."));
  }
  return ok(null);
}

/**
 * Catalog rows for the admin table, INCLUDING deactivated ones.
 * services/products.ts deliberately filters is_active for shoppers, which
 * meant a deactivated product became invisible and unrecoverable here.
 */
const ADMIN_PRODUCT_COLUMNS =
  "id, name, brand, category_id, homeowner_price, contractor_price, unit, stock_quantity, stock_status, description, image_url, is_active";

export async function getAllProductsForAdmin(): Promise<AdminProductRow[]> {
  const supabase = createClient();

  // low_stock_threshold arrives in schema-07. Asking for a column that
  // doesn't exist fails the whole select, which would blank the products
  // screen, so fall back to the base columns if it isn't there yet.
  const withThreshold = await supabase
    .from("products")
    .select(`${ADMIN_PRODUCT_COLUMNS}, low_stock_threshold`)
    .order("name");

  const result = withThreshold.error
    ? await supabase.from("products").select(ADMIN_PRODUCT_COLUMNS).order("name")
    : withThreshold;

  if (result.error || !result.data) {
    console.error("[getAllProductsForAdmin]", result.error);
    return [];
  }

  const rows = result.data as unknown as Record<string, unknown>[];

  return rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    brand: (row.brand as string) ?? "",
    categoryId: (row.category_id as string) ?? "",
    homeownerPrice: Number(row.homeowner_price ?? 0),
    contractorPrice: Number(row.contractor_price ?? 0),
    unit: (row.unit as string) ?? "each",
    stockQuantity: Number(row.stock_quantity ?? 0),
    stockStatus: (row.stock_status as string) ?? "in-stock",
    lowStockThreshold: Number(row.low_stock_threshold ?? 10),
    description: (row.description as string) ?? "",
    imageUrl: (row.image_url as string) ?? "",
    isActive: Boolean(row.is_active),
  }));
}

export interface AdminCategoryRow {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

export async function getAllCategoriesForAdmin(): Promise<AdminCategoryRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_categories")
    .select("id, name, slug, icon, sort_order, is_active")
    .order("sort_order");

  if (error || !data) {
    console.error("[getAllCategoriesForAdmin]", error);
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    slug: (row.slug as string) ?? "",
    icon: (row.icon as string) ?? "Boxes",
    sortOrder: Number(row.sort_order ?? 0),
    isActive: Boolean(row.is_active),
  }));
}

export async function upsertCategory(input: {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}): Promise<ServiceResult<null>> {
  if (!input.id.trim()) return fail("An ID is required.");
  if (!input.name.trim()) return fail("A category name is required.");

  const supabase = createClient();
  const { error } = await supabase.from("product_categories").upsert({
    id: input.id.trim(),
    name: input.name.trim(),
    slug: input.id.trim(),
    icon: input.icon,
    sort_order: input.sortOrder,
    is_active: input.isActive,
  });

  if (error) {
    console.error("[upsertCategory]", error);
    return fail(toUserMessage(error, "We couldn't save that category."));
  }
  return ok(null);
}

export async function setCategoryActive(
  id: string,
  isActive: boolean,
): Promise<ServiceResult<null>> {
  const supabase = createClient();
  const { error } = await supabase
    .from("product_categories")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    console.error("[setCategoryActive]", error);
    return fail(toUserMessage(error, "We couldn't update that category."));
  }
  return ok(null);
}

/**
 * Permanently removes a product.
 *
 * Refused when the product appears on any order or package: order history
 * has to stay intact, and the FK would reject it anyway. Deactivating is
 * the right move there, so the error says so.
 */
export async function deleteProduct(id: string): Promise<ServiceResult<null>> {
  const supabase = createClient();

  const { count: orderCount } = await supabase
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id);

  if ((orderCount ?? 0) > 0) {
    return fail(
      "This product is on existing orders, so it can't be deleted. Deactivate it instead — it stops appearing in the catalog.",
    );
  }

  const { count: packageCount } = await supabase
    .from("package_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id);

  if ((packageCount ?? 0) > 0) {
    return fail(
      "This product is in a contractor package. Deactivate it instead of deleting.",
    );
  }

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    console.error("[deleteProduct]", error);
    return fail(toUserMessage(error, "We couldn't delete that product."));
  }
  return ok(null);
}

/**
 * Permanently removes a category.
 *
 * Refused while products still reference it — the FK is ON DELETE SET
 * NULL, so this would silently orphan them into "Uncategorised" rather
 * than failing loudly.
 */
export async function deleteCategory(id: string): Promise<ServiceResult<null>> {
  const supabase = createClient();

  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if ((count ?? 0) > 0) {
    return fail(
      `${count} product${count === 1 ? "" : "s"} still use this category. Move them first, or hide the category instead.`,
    );
  }

  const { error } = await supabase
    .from("product_categories")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[deleteCategory]", error);
    return fail(toUserMessage(error, "We couldn't delete that category."));
  }
  return ok(null);
}

export async function setProductActive(
  id: string,
  isActive: boolean,
): Promise<ServiceResult<null>> {
  const supabase = createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[setProductActive]", error);
    return fail(toUserMessage(error, "We couldn't update that product."));
  }
  return ok(null);
}

export interface AdminRow {
  id: string;
  reference: string;
  label: string;
  sublabel: string;
  status: string;
  createdAt: string;
}

/** Shared shape for the admin list screens. */
export async function getAllOrders(): Promise<AdminRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, reference, status, total, created_at, contact")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id as string,
    reference: row.reference as string,
    label: ((row.contact as { name?: string })?.name ?? "Unknown customer"),
    sublabel: `$${Number(row.total).toFixed(2)}`,
    status: row.status as string,
    createdAt: row.created_at as string,
  }));
}

export async function getAllProjects(): Promise<AdminRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, project_type, subtype, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id as string,
    reference: (row.project_type as string).replace("_", " "),
    label: row.title as string,
    sublabel: (row.subtype as string) ?? "",
    status: row.status as string,
    createdAt: row.created_at as string,
  }));
}

export async function getAllServiceRequests(): Promise<AdminRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("service_requests")
    .select("id, reference, service_type, category, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id as string,
    reference: row.reference as string,
    label: (row.service_type as string).replace("_", " "),
    sublabel: (row.category as string) ?? "",
    status: row.status as string,
    createdAt: row.created_at as string,
  }));
}

export async function getAllCallOrders(): Promise<AdminRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("call_orders")
    .select("id, reference, category, preferred_date, preferred_time, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id as string,
    reference: row.reference as string,
    label: row.category as string,
    sublabel: `${row.preferred_date} · ${row.preferred_time}`,
    status: row.status as string,
    createdAt: row.created_at as string,
  }));
}

export async function getAllDrawings(): Promise<AdminRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("drawing_uploads")
    .select("id, reference, project_name, drawing_type, processing_status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id as string,
    reference: row.reference as string,
    label: row.project_name as string,
    sublabel: (row.drawing_type as string) ?? "",
    status: row.processing_status as string,
    createdAt: row.created_at as string,
  }));
}

export async function getAllPremiumRequests(): Promise<AdminRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("premium_requests")
    .select("id, reference, selected_services, status, budget_range, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) return [];
  return data.map((row) => {
    const services = (row.selected_services as string[]) ?? [];
    const budget = (row.budget_range as string) ?? "";
    return {
      id: row.id as string,
      reference: row.reference as string,
      // The tier lives in `details`, but the service list plus budget is
      // what an advisor triages on, so it's what the row surfaces.
      label: services[0] ?? "Premium package",
      sublabel: [services.length > 1 ? `+${services.length - 1} more` : "", budget]
        .filter(Boolean)
        .join(" · "),
      status: row.status as string,
      createdAt: row.created_at as string,
    };
  });
}

/** Generic status update used by the admin list screens. */
export async function updateRecordStatus(
  table: string,
  id: string,
  status: string,
  column = "status",
): Promise<ServiceResult<null>> {
  const supabase = createClient();
  const { error } = await supabase
    .from(table)
    .update({ [column]: status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[updateRecordStatus]", table, error);
    return fail(toUserMessage(error, "We couldn't update that record."));
  }
  return ok(null);
}

// --- Product images -------------------------------------------------------

const PRODUCT_IMAGE_BUCKET = "product-images";
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export function validateProductImage(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) {
    return `${file.name} isn't a JPG, PNG or WebP.`;
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return `${file.name} is larger than 5 MB.`;
  }
  return null;
}

/**
 * Uploads a product photo and returns its public URL.
 *
 * The bucket is public-read by design — these are catalog images shown to
 * anyone browsing the shop — but only admins can write to it (storage
 * policy "Admins write product images").
 *
 * Paths are unique per upload rather than keyed on the product id: there
 * is no update policy on storage.objects for this bucket, so overwriting
 * would be rejected. A replaced image is simply left behind, which is
 * cheap and avoids a delete that could orphan a live URL mid-request.
 */
export async function uploadProductImage(
  file: File,
): Promise<ServiceResult<string>> {
  const problem = validateProductImage(file);
  if (problem) return fail(problem);

  const supabase = createClient();
  const extension = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    console.error("[uploadProductImage]", error);
    return fail("We couldn't upload that image. Please try again.");
  }

  const { data } = supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .getPublicUrl(path);

  return ok(data.publicUrl);
}

/**
 * The contact inbox.
 *
 * `label` is the sender and `sublabel` the subject, falling back to the
 * first line of the message when they left the subject blank — an empty
 * middle column in the shared admin table tells you nothing.
 */
export async function getAllContactMessages(): Promise<AdminRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("id, reference, name, email, subject, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) return [];
  return data.map((row) => {
    const subject = ((row.subject as string) ?? "").trim();
    const message = ((row.message as string) ?? "").trim();
    return {
      id: row.id as string,
      reference: row.reference as string,
      label: (row.name as string) || (row.email as string),
      sublabel:
        subject ||
        (message.length > 80 ? `${message.slice(0, 80)}…` : message),
      status: row.status as string,
      createdAt: row.created_at as string,
    };
  });
}
