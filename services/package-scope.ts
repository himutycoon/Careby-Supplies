import { createClient } from "@/lib/supabase/client";
import { fail, ok, toUserMessage, type ServiceResult } from "@/services/client";
import { getProducts, getProductsByIds } from "@/services/products";
import { getAllowanceOverrides } from "@/services/allowances";
import { getCuratedProductIds, itemSlot } from "@/services/curated-products";
import {
  generateScope,
  type GeneratedScope,
  type SelectionRequirement,
} from "@/lib/rules/package-scope";
import {
  finishApplies,
  selectionItem,
  type BudgetTier,
} from "@/data/packages/selection-items";
import { ITEM_TAGS, tagsFor } from "@/data/product-tags";
import { budgetBounds, rankByFit } from "@/lib/rules/product-fit";
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
  /**
   * Per-line allowances the contractor set for THIS job, by item id.
   *
   * Admin sets what a vanity is usually worth; this job may not be
   * usual. What is written here is what the customer is measured
   * against, so it is the contractor's last word before the package
   * becomes a quote.
   */
  allowanceOverrides?: Record<string, number>;
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

  /*
   * Read the overrides at creation, not at preview: this is the moment
   * the allowance becomes a promise to a named customer, and it is
   * snapshotted onto package_selections just below.
   */
  const scope = generateScope({
    templateId: input.templateId,
    tier: input.tier,
    adjusters: input.adjusters,
    allowances: await getAllowanceOverrides(),
  });
  if (!scope) return fail("That package template no longer exists.");

  const excluded = new Set(input.excludedItemIds ?? []);
  const overrides = input.allowanceOverrides ?? {};

  /** The contractor's figure for this line, or the generated one. */
  function overrideFor(requirement: SelectionRequirement): number {
    const total = overrides[requirement.itemId];
    if (total === undefined || !Number.isFinite(total) || total < 0) {
      return requirement.allowanceCad;
    }
    return Math.round((total / Math.max(1, requirement.quantity)) * 100) / 100;
  }
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
        // Per-unit, the way the column is read back: the total is this
        // times the quantity, so dividing keeps the two in step when a
        // contractor edits the line total on screen.
        allowance_cad: overrideFor(requirement),
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
    /*
     * Keywords are not stored — the row keeps item_id, and keywords are
     * a property of the item, not of the quote. Reading them back as []
     * is what made the portal's product list look random: every line
     * fell through to "first twelve products in this aisle", so a
     * Toilet worth $480 offered whatever the plumbing aisle returned
     * first. The allowance is a commercial promise and stays stored;
     * how we search for candidates is not, and is resolved here.
     */
    keywords: selectionItem(row.item_id as string)?.keywords ?? [],
    status: row.status as StoredSelection["status"],
    productId: (row.product_id as string) ?? null,
    selectedPriceCad:
      row.selected_price_cad === null ? null : Number(row.selected_price_cad),
  }));
}

/**
 * Products a customer may pick for one requirement.
 *
 * Four questions, in descending order of how much somebody meant them:
 *
 *   1. Did an admin hand-pick products for this line? Use those, in
 *      that order, and stop.
 *   2. Does the catalogue have a word for this kind of thing? Ask for
 *      products carrying it, within the allowance's price range.
 *   3. Failing that, the aisle.
 *   4. Order whatever came back by how well it fits — tags, the item's
 *      own words, and the allowance.
 *
 * THE ALLOWANCE IS THE POINT. Every line carries one — "Toilet, $480" —
 * and until now it was printed on screen and ignored when choosing what
 * to put under it, so a $480 decision came with $4 wax rings and $3,200
 * fixtures in the same list and nothing to say which was meant. It is
 * the best budget signal in the system and it was being thrown away at
 * the one moment it mattered.
 *
 * Never filtered down to nothing: every narrowing below falls back to
 * the broader question rather than returning an empty list.
 */
export async function productsForRequirement(
  requirement: Pick<SelectionRequirement, "categoryId" | "keywords"> & {
    itemId?: string;
    /** Per-unit allowance for this line, if the caller knows it. */
    allowanceCad?: number;
  },
  limit = 12,
  /** The package finish palette, if one is set and applies here. */
  finish = "",
): Promise<Product[]> {
  /*
   * A hand-picked list wins outright, and skips the scoring below: an
   * admin who chose five tiles for this requirement meant those five,
   * in that order, not those five re-ranked by how well their names
   * match or how close they sit to an allowance.
   */
  if (requirement.itemId) {
    const curated = await getCuratedProductIds(itemSlot(requirement.itemId));
    if (curated.length > 0) {
      const picked = await getProductsByIds(curated);
      const byId = new Map(picked.map((p) => [p.id, p]));
      return curated
        .map((id) => byId.get(id))
        .filter((p): p is Product => Boolean(p))
        .slice(0, limit);
    }
  }

  const allowanceCad =
    typeof requirement.allowanceCad === "number" && requirement.allowanceCad > 0
      ? requirement.allowanceCad
      : null;

  const need = {
    tags: tagsFor(ITEM_TAGS, requirement.itemId),
    keywords: requirement.keywords,
    allowanceCad,
    finish: finish && finishApplies(requirement.categoryId) ? finish : "",
  };

  /*
   * The band is a query bound, not a judgement — generous, because a
   * bound that is too tight comes back empty and an empty list is the
   * worst answer available. `budgetScore` does the actual judging.
   */
  const bounds = allowanceCad ? budgetBounds(allowanceCad) : null;

  if (need.tags.length > 0) {
    const banded = bounds
      ? await getProducts({ tags: need.tags, ...bounds, pageSize: 80 })
      : null;

    const pool =
      banded && banded.items.length >= 3
        ? banded.items
        : (await getProducts({ tags: need.tags, pageSize: 80 })).items;

    if (pool.length > 0) return rankByFit(pool, need, limit);
  }

  /*
   * No tag for this kind of thing, so ask the database for the item's
   * own words instead of sampling the aisle and hoping.
   *
   * This is the part that cannot be fixed by ranking. "Faucet" is a
   * line in the plumbing aisle, which holds 897 products; taking 120 of
   * them in an order decided by a review count that is zero on every
   * row, then ranking those 120, cannot surface a faucet that was not
   * among the 120. The Bath Faucets really are in there, and really
   * were not being found.
   *
   * One query per word rather than one query for all of them, because
   * search ANDs its words: "faucet tap" would ask for products that say
   * both, and nothing says both.
   */
  const words = need.keywords.slice(0, 3).filter(Boolean);
  const found = await Promise.all(
    words.map((word) =>
      getProducts({
        search: word,
        categoryId: requirement.categoryId,
        pageSize: 40,
      }),
    ),
  );

  const byId = new Map<string, Product>();
  for (const page of found) {
    for (const product of page.items) byId.set(product.id, product);
  }

  /*
   * The aisle is the backstop, and only the backstop. Asking inside the
   * allowance band first makes its sample relevant rather than merely
   * large.
   */
  if (byId.size < limit) {
    const banded = bounds
      ? await getProducts({
          categoryId: requirement.categoryId,
          ...bounds,
          pageSize: 120,
        })
      : null;

    const fallback =
      banded && banded.items.length >= limit
        ? banded.items
        : (
            await getProducts({
              categoryId: requirement.categoryId,
              pageSize: 120,
            })
          ).items;

    for (const product of fallback) {
      if (!byId.has(product.id)) byId.set(product.id, product);
    }
  }

  return rankByFit([...byId.values()], need, limit);
}

export type { GeneratedScope };
