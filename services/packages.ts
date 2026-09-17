import { createClient } from "@/lib/supabase/client";
import { fail, ok, toUserMessage, type ServiceResult } from "@/services/client";
import { calculatePackageTotals as computeTotals } from "@/lib/rules/order-totals";
import { getProductsByIds } from "@/services/products";
import type { CustomerPackage, PackageLine, PackageStatus } from "@/lib/types";

export type { OrderTotals as PackageTotals } from "@/lib/rules/order-totals";

interface PackageRow {
  id: string;
  reference: string;
  contractor_id: string;
  name: string;
  project_type: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: PackageStatus;
  total_price: number;
  created_at: string;
  package_items?: { product_id: string; quantity: number; price: number }[];
}

function mapPackage(row: PackageRow): CustomerPackage {
  return {
    id: row.reference,
    dbId: row.id,
    name: row.name,
    status: row.status,
    createdAt: row.created_at,
    projectType: row.project_type,
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone,
    },
    lines: (row.package_items ?? []).map((item) => ({
      productId: item.product_id,
      quantity: item.quantity,
    })),
    accessCode: row.reference,
    totalPrice: Number(row.total_price),
  };
}

const SELECT = `
  id, reference, contractor_id, name, project_type, customer_name,
  customer_email, customer_phone, status, total_price, created_at,
  package_items ( product_id, quantity, price )
`;

/** Resolves lines to live trade prices, then defers to the rules layer. */
export async function calculatePackageTotals(lines: PackageLine[]) {
  if (lines.length === 0) return computeTotals([]);
  const products = await getProductsByIds(lines.map((l) => l.productId));

  const priced = lines.flatMap((line) => {
    const product = products.find((p) => p.id === line.productId);
    return product
      ? [{ unitPriceCad: product.contractorPriceCad, quantity: line.quantity }]
      : [];
  });
  return computeTotals(priced);
}

export interface CreatePackageInput {
  name: string;
  projectType: string;
  customer: CustomerPackage["customer"];
  lines: PackageLine[];
}

export async function createPackage(
  input: CreatePackageInput,
): Promise<ServiceResult<CustomerPackage>> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Please log in to create a package.");

  if (!input.name.trim()) return fail("Package name is required.");
  if (!input.customer.name.trim()) return fail("Customer name is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.customer.email.trim())) {
    return fail("Enter a valid customer email address.");
  }
  if (input.lines.length === 0) {
    return fail("Add at least one product to the package.");
  }

  const reference = `PKG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const { data: created, error } = await supabase
    .from("packages")
    .insert({
      reference,
      contractor_id: user.id,
      name: input.name.trim(),
      project_type: input.projectType,
      customer_name: input.customer.name.trim(),
      customer_email: input.customer.email.trim().toLowerCase(),
      customer_phone: input.customer.phone.trim(),
    })
    .select("id, reference")
    .single();

  if (error || !created) {
    console.error("[createPackage]", error);
    return fail(toUserMessage(error, "We couldn't create that package."));
  }

  const { error: itemsError } = await supabase.from("package_items").insert(
    input.lines.map((line) => ({
      package_id: created.id,
      product_id: line.productId,
      quantity: line.quantity,
    })),
  );

  if (itemsError) {
    console.error("[createPackage:items]", itemsError);
    await supabase.from("packages").delete().eq("id", created.id);
    return fail(toUserMessage(itemsError, "We couldn't add those products."));
  }

  const pkg = await getPackageByReference(created.reference);
  if (!pkg) return fail("Package created, but we couldn't load it back.");
  return ok(pkg);
}

export async function getPackages(): Promise<CustomerPackage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("packages")
    .select(SELECT)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as unknown as PackageRow[]).map(mapPackage);
}

export async function getPackageByReference(
  reference: string,
): Promise<CustomerPackage | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("packages")
    .select(SELECT)
    .eq("reference", reference.toUpperCase())
    .maybeSingle();

  if (error || !data) return null;
  return mapPackage(data as unknown as PackageRow);
}

export async function updatePackageStatus(
  id: string,
  status: PackageStatus,
): Promise<ServiceResult<null>> {
  const supabase = createClient();
  const { error } = await supabase
    .from("packages")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[updatePackageStatus]", error);
    return fail(toUserMessage(error, "We couldn't update that package."));
  }
  return ok(null);
}
