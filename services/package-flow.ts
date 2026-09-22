import { createClient } from "@/lib/supabase/client";
import { fail, ok, toUserMessage, type ServiceResult } from "@/services/client";
import {
  getPackageSelections,
  type StoredSelection,
} from "@/services/package-scope";
import type { BudgetTier } from "@/data/packages/selection-items";

/**
 * The package selection flow — Customer Flow sheet, steps 6 to 13.
 *
 * Separate from services/package-scope, which is about generating a
 * checklist. This is what happens to that checklist afterwards: the
 * customer decides, submits, the contractor approves and locks a
 * version, and the approved set becomes a procurement list.
 */

export interface ScopedPackage {
  dbId: string;
  reference: string;
  name: string;
  status: string;
  templateId: string;
  tier: BudgetTier;
  exclusions: string;
  finishPalette: string;
  submittedAt: string | null;
  approvedAt: string | null;
  customer: { name: string; email: string; phone: string };
  selections: StoredSelection[];
}

const PACKAGE_SELECT = `
  id, reference, name, status, template_id, budget_tier, exclusions,
  finish_palette, submitted_at, approved_at,
  customer_name, customer_email, customer_phone
`;

/** A package with its generated checklist, by customer-facing reference. */
export async function getScopedPackage(
  reference: string,
): Promise<ScopedPackage | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("packages")
    .select(PACKAGE_SELECT)
    .eq("reference", reference.toUpperCase())
    .maybeSingle();

  if (error || !data) return null;

  const selections = await getPackageSelections(data.id as string);

  return {
    dbId: data.id as string,
    reference: data.reference as string,
    name: data.name as string,
    status: data.status as string,
    templateId: (data.template_id as string) ?? "",
    tier: ((data.budget_tier as string) ?? "medium") as BudgetTier,
    exclusions: (data.exclusions as string) ?? "",
    finishPalette: (data.finish_palette as string) ?? "",
    submittedAt: (data.submitted_at as string) ?? null,
    approvedAt: (data.approved_at as string) ?? null,
    customer: {
      name: (data.customer_name as string) ?? "",
      email: (data.customer_email as string) ?? "",
      phone: (data.customer_phone as string) ?? "",
    },
    selections,
  };
}

/**
 * Records one customer decision.
 *
 * The price is read from the catalogue here, never taken from the caller
 * — the same rule the order trigger and the Stripe route follow. A
 * browser posting its own number cannot change what the upgrade or
 * credit works out to.
 */
export async function chooseProduct(
  selectionId: string,
  productId: string,
  note = "",
): Promise<ServiceResult<{ priceCad: number }>> {
  const supabase = createClient();

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, homeowner_price, is_active")
    .eq("id", productId)
    .maybeSingle();

  if (productError || !product) return fail("That product is unavailable.");
  if (!product.is_active) return fail("That product is no longer available.");

  const priceCad = Number(product.homeowner_price);

  const { error } = await supabase
    .from("package_selections")
    .update({
      product_id: productId,
      selected_price_cad: priceCad,
      customer_note: note,
      status: "selected",
      chosen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", selectionId);

  if (error) {
    console.error("[chooseProduct]", error);
    return fail(toUserMessage(error, "We couldn't save that choice."));
  }
  return ok({ priceCad });
}

/** Undo a choice, putting the line back to pending. */
export async function clearChoice(
  selectionId: string,
): Promise<ServiceResult<null>> {
  const supabase = createClient();
  const { error } = await supabase
    .from("package_selections")
    .update({
      product_id: null,
      selected_price_cad: null,
      status: "pending",
      chosen_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", selectionId);

  if (error) {
    console.error("[clearChoice]", error);
    return fail(toUserMessage(error, "We couldn't clear that choice."));
  }
  return ok(null);
}

/** One finish for the whole package, applied to compatible categories. */
export async function setFinishPalette(
  packageDbId: string,
  finish: string,
): Promise<ServiceResult<null>> {
  const supabase = createClient();
  const { error } = await supabase
    .from("packages")
    .update({ finish_palette: finish, updated_at: new Date().toISOString() })
    .eq("id", packageDbId);

  if (error) {
    console.error("[setFinishPalette]", error);
    return fail(toUserMessage(error, "We couldn't save that finish."));
  }
  return ok(null);
}

/**
 * Completeness check, then submit — Customer Flow steps 8 and 9.
 *
 * The check runs against the database, not the screen. A customer who
 * left a tab open while the contractor added a requirement must not be
 * able to submit an incomplete package because their copy looked done.
 */
export async function submitSelections(
  packageDbId: string,
): Promise<ServiceResult<{ submittedAt: string }>> {
  const supabase = createClient();

  const selections = await getPackageSelections(packageDbId);
  const missing = selections.filter((s) => s.required && !s.productId);
  if (missing.length > 0) {
    const noun = missing.length === 1 ? "selection is" : "selections are";
    return fail(`${missing.length} required ${noun} still to make.`);
  }

  const submittedAt = new Date().toISOString();
  const { error } = await supabase
    .from("packages")
    .update({
      status: "submitted",
      submitted_at: submittedAt,
      updated_at: submittedAt,
    })
    .eq("id", packageDbId);

  if (error) {
    console.error("[submitSelections]", error);
    return fail(toUserMessage(error, "We couldn't submit your selections."));
  }
  return ok({ submittedAt });
}

/**
 * Approve and lock — Customer Flow step 12.
 *
 * The version snapshot is written before anything is marked approved, so
 * the approved set can be reconstructed even if a later edit changes the
 * live rows. Package Rules: "Changing an approved product creates a new
 * version/history."
 */
export async function approvePackage(
  packageDbId: string,
  comments = "",
): Promise<ServiceResult<{ version: number }>> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Please log in to approve this package.");

  const selections = await getPackageSelections(packageDbId);
  const missing = selections.filter((s) => s.required && !s.productId);
  if (missing.length > 0) {
    const noun = missing.length === 1 ? "selection is" : "selections are";
    return fail(`${missing.length} required ${noun} still open.`);
  }

  const { data: versionNumber, error: versionError } = await supabase.rpc(
    "next_package_version",
    { target: packageDbId },
  );
  if (versionError) {
    console.error("[approvePackage:version]", versionError);
    return fail(
      toUserMessage(versionError, "We couldn't version that package."),
    );
  }

  const version = Number(versionNumber ?? 1);

  const { error: snapshotError } = await supabase
    .from("package_versions")
    .insert({
      package_id: packageDbId,
      version,
      approved_by: user.id,
      comments,
      snapshot: selections,
    });

  if (snapshotError) {
    console.error("[approvePackage:snapshot]", snapshotError);
    return fail(toUserMessage(snapshotError, "We couldn't save the approval."));
  }

  const now = new Date().toISOString();
  await supabase
    .from("package_selections")
    .update({ status: "approved", updated_at: now })
    .eq("package_id", packageDbId)
    .eq("status", "selected");

  const { error } = await supabase
    .from("packages")
    .update({ status: "approved", approved_at: now, updated_at: now })
    .eq("id", packageDbId);

  if (error) {
    console.error("[approvePackage]", error);
    return fail(toUserMessage(error, "We couldn't approve that package."));
  }

  return ok({ version });
}

/**
 * Send one line back for a different choice — Customer Flow step 10.
 *
 * "Only exceptions require communication": the rest of the package stays
 * approved, and the customer sees one line to redo rather than a whole
 * package reopened.
 */
export async function requestReplacement(
  selectionId: string,
  reason: string,
): Promise<ServiceResult<null>> {
  const supabase = createClient();
  const { error } = await supabase
    .from("package_selections")
    .update({
      status: "rejected",
      customer_note: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", selectionId);

  if (error) {
    console.error("[requestReplacement]", error);
    return fail(toUserMessage(error, "We couldn't send that back."));
  }
  return ok(null);
}

export interface PackageVersion {
  version: number;
  comments: string;
  createdAt: string;
  lineCount: number;
}

export async function getPackageVersions(
  packageDbId: string,
): Promise<PackageVersion[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("package_versions")
    .select("version, comments, created_at, snapshot")
    .eq("package_id", packageDbId)
    .order("version", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => ({
    version: Number(row.version),
    comments: (row.comments as string) ?? "",
    createdAt: row.created_at as string,
    lineCount: Array.isArray(row.snapshot) ? row.snapshot.length : 0,
  }));
}

export interface ProcurementLine {
  selectionId: string;
  label: string;
  room: string;
  quantity: number;
  productName: string;
  brand: string;
  sku: string;
  unitPriceCad: number;
  totalPriceCad: number;
  leadTime: string;
}

/**
 * The procurement list — Customer Flow step 13.
 *
 * Approved lines only. Ordering against a selection the contractor has
 * not signed off is how the wrong tile ends up on site.
 */
export async function getProcurementList(
  packageDbId: string,
): Promise<ProcurementLine[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("package_selections")
    .select(
      "id, label, room, quantity, selected_price_cad, sort_order, products ( name, brand, sku, delivery_estimate )",
    )
    .eq("package_id", packageDbId)
    .eq("status", "approved")
    .order("sort_order");

  if (error || !data) return [];

  return data.map((row) => {
    const product = row.products as unknown as {
      name: string;
      brand: string;
      sku: string | null;
      delivery_estimate: string;
    } | null;
    const quantity = Number(row.quantity);
    const unit = Number(row.selected_price_cad ?? 0);
    return {
      selectionId: row.id as string,
      label: row.label as string,
      room: (row.room as string) ?? "",
      quantity,
      productName: product?.name ?? "—",
      brand: product?.brand ?? "",
      sku: product?.sku ?? "",
      unitPriceCad: unit,
      totalPriceCad: Math.round(unit * quantity * 100) / 100,
      leadTime: product?.delivery_estimate ?? "",
    };
  });
}

/** Procurement list as CSV, for sending to a vendor. */
export function procurementCsv(lines: ProcurementLine[]): string {
  const header = [
    "Room",
    "Item",
    "Product",
    "Brand",
    "SKU",
    "Qty",
    "Unit price",
    "Total",
    "Lead time",
  ];
  const escape = (value: string | number) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const rows = lines.map((line) =>
    [
      line.room,
      line.label,
      line.productName,
      line.brand,
      line.sku,
      line.quantity,
      line.unitPriceCad.toFixed(2),
      line.totalPriceCad.toFixed(2),
      line.leadTime,
    ]
      .map(escape)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}
