import { createClient } from "@/lib/supabase/client";
import { fail, ok, toUserMessage, type ServiceResult } from "@/services/client";
import { getProducts } from "@/services/products";
import {
  generateScope,
  type GeneratedScope,
  type SelectionRequirement,
} from "@/lib/rules/package-scope";
import type { BudgetTier } from "@/data/packages/selection-items";
import type { Product } from "@/lib/types";

/**
 * Persisting a generated package scope.
 *
 * The engine in lib/rules decides what the checklist is; this writes it
 * down. The generated requirements are stored rather than recomputed on
 * read, because allowance is a commercial promise: regenerating from the
 * taxonomy months later would silently re-price a package a customer has
 * already been quoted.
 */

export interface CreateScopedPackageInput {
  name: string;
  templateId: string;
  tier: BudgetTier;
  adjusters: Record<string, string>;
  customer: { name: string; email: string; phone: string };
  /** Item ids the contractor removed from the generated list. */
  excludedItemIds?: string[];
}

export interface StoredSelection extends SelectionRequirement {
  id: string;
  status: "pending" | "selected" | "approved" | "rejected";
  productId: string | null;
  selectedPriceCad: number | null;
}

/**
 * Creates the package and its checklist in one go.
 *
 * "Contractor controls scope" from the Package Rules sheet: anything in
 * `excludedItemIds` is dropped before writing, so what is stored is what
 * the contractor approved, not the raw generation.
 */
export async function createScopedPackage(
  input: CreateScopedPackageInput,
): Promise<ServiceResult<{ reference: string; requirementCount: number }>> {
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

  const scope = generateScope({
    templateId: input.templateId,
    tier: input.tier,
    adjusters: input.adjusters,
  });
  if (!scope) return fail("That package template no longer exists.");

  const excluded = new Set(input.excludedItemIds ?? []);
  const requirements = scope.requirements.filter((r) => !excluded.has(r.itemId));
  if (requirements.length === 0) {
    return fail("A package needs at least one selection.");
  }

  const reference = `PKG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const { data: created, error } = await supabase
    .from("packages")
    .insert({
      reference,
      contractor_id: user.id,
      name: input.name.trim(),
      project_type: scope.template.group,
      template_id: scope.template.id,
      budget_tier: scope.tier,
      adjusters: input.adjusters,
      scope_flags: scope.flags,
      exclusions: scope.exclusions,
      customer_name: input.customer.name.trim(),
      customer_email: input.customer.email.trim().toLowerCase(),
      customer_phone: input.customer.phone.trim(),
      status: "draft",
    })
    .select("id, reference")
    .single();

  if (error || !created) {
    console.error("[createScopedPackage]", error);
    return fail(toUserMessage(error, "We couldn't create that package."));
  }

  const { error: selectionError } = await supabase
    .from("package_selections")
    .insert(
      requirements.map((requirement, index) => ({
        package_id: created.id,
        item_id: requirement.itemId,
        label: requirement.label,
        room: requirement.room,
        category_id: requirement.categoryId,
        reason: requirement.reason,
        required: requirement.required,
        quantity: requirement.quantity,
        allowance_cad: requirement.allowanceCad,
        sort_order: index,
      })),
    );

  if (selectionError) {
    console.error("[createScopedPackage:selections]", selectionError);
    // Roll back so no package exists without its checklist.
    await supabase.from("packages").delete().eq("id", created.id);
    return fail(
      toUserMessage(selectionError, "We couldn't save the selection list."),
    );
  }

  return ok({
    reference: created.reference,
    requirementCount: requirements.length,
  });
}

/** The stored checklist for a package, in the order it was generated. */
export async function getPackageSelections(
  packageDbId: string,
): Promise<StoredSelection[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("package_selections")
    .select(
      "id, item_id, label, room, category_id, reason, required, quantity, allowance_cad, product_id, selected_price_cad, status",
    )
    .eq("package_id", packageDbId)
    .order("sort_order");

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    itemId: row.item_id as string,
    label: row.label as string,
    room: (row.room as string) ?? "",
    categoryId: (row.category_id as string) ?? "",
    reason: (row.reason as string) ?? "",
    required: Boolean(row.required),
    quantity: Number(row.quantity),
    allowanceCad: Number(row.allowance_cad),
    totalAllowanceCad: Number(row.allowance_cad) * Number(row.quantity),
    keywords: [],
    status: row.status as StoredSelection["status"],
    productId: (row.product_id as string) ?? null,
    selectedPriceCad:
      row.selected_price_cad === null ? null : Number(row.selected_price_cad),
  }));
}

/**
 * Products a customer may pick for one requirement.
 *
 * Category first, then keyword ranking — a "Vanity countertop" and a
 * kitchen "Countertop" share a category, and the keywords are what tell
 * them apart. Never filtered down to nothing: if keywords match no
 * product, the whole category is still offered rather than an empty list.
 */
export async function productsForRequirement(
  requirement: Pick<SelectionRequirement, "categoryId" | "keywords">,
  limit = 12,
): Promise<Product[]> {
  const page = await getProducts({
    categoryId: requirement.categoryId,
    pageSize: 60,
  });

  const keywords = requirement.keywords.map((k) => k.toLowerCase());
  if (keywords.length === 0) return page.items.slice(0, limit);

  const scored = page.items
    .map((product) => {
      const haystack = `${product.name} ${product.description}`.toLowerCase();
      const score = keywords.reduce(
        (sum, keyword) => (haystack.includes(keyword) ? sum + 1 : sum),
        0,
      );
      return { product, score };
    })
    .sort((a, b) => b.score - a.score);

  const matched = scored.filter((entry) => entry.score > 0);
  const chosen = matched.length > 0 ? matched : scored;
  return chosen.slice(0, limit).map((entry) => entry.product);
}

export type { GeneratedScope };
