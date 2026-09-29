import { createClient } from "@/lib/supabase/client";
import { fail, ok, toUserMessage, type ServiceResult } from "@/services/client";

/**
 * Hand-picked product lists for a checklist stage or package requirement.
 *
 * A slot is a plain string so one table serves both callers:
 *
 *   stageSlot("bathroom", "tile")   -> "bathroom:tile"
 *   itemSlot("bath-wall-tile")      -> "item:bath-wall-tile"
 *
 * Every read is written to degrade rather than fail. Where a slot has
 * nothing in it — or the table does not exist yet, before schema-22 —
 * the caller gets an empty list and falls back to the category filtering
 * that has always run. Curating is therefore something that can be done
 * one aisle at a time.
 */

export function stageSlot(projectId: string, stageId: string): string {
  return `${projectId}:${stageId}`;
}

export function itemSlot(itemId: string): string {
  return `item:${itemId}`;
}

/**
 * The home page shop window.
 *
 * The rail there used to sort by review_count, which is zero on every
 * imported product, so what greeted a visitor was whichever rows had
 * been touched most recently — and it was captioned "what people are
 * ordering this month". This makes it a decision instead.
 */
export const HOME_FEATURED_SLOT = "home:featured";

/** Product ids for one slot, in the order an admin put them. */
export async function getCuratedProductIds(slot: string): Promise<string[]> {
  if (!slot) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("curated_products")
    .select("product_id, sort_order")
    .eq("slot", slot)
    .order("sort_order");

  if (error || !data) {
    // Before schema-22 this table is absent. Falling back to categories
    // is the behaviour that shipped, so a missing table is not an error
    // worth showing a customer.
    return [];
  }
  return data.map((row) => row.product_id as string);
}

/** Which of these slots have been curated, for showing progress in admin. */
export async function getCuratedCounts(
  slots: string[],
): Promise<Record<string, number>> {
  if (slots.length === 0) return {};
  const supabase = createClient();
  const { data, error } = await supabase
    .from("curated_products")
    .select("slot")
    .in("slot", slots);

  if (error || !data) return {};

  const counts: Record<string, number> = {};
  for (const row of data) {
    const slot = row.slot as string;
    counts[slot] = (counts[slot] ?? 0) + 1;
  }
  return counts;
}

/**
 * Replaces a slot's list wholesale.
 *
 * Delete-then-insert rather than a diff: the list is small, the order
 * matters, and working out which rows moved is more code than rewriting
 * the handful that are there.
 */
export async function setCuratedProducts(
  slot: string,
  productIds: string[],
): Promise<ServiceResult<number>> {
  if (!slot) return fail("No stage selected.");

  const supabase = createClient();

  const { error: clearError } = await supabase
    .from("curated_products")
    .delete()
    .eq("slot", slot);

  if (clearError) {
    console.error("[setCuratedProducts:clear]", clearError);
    return fail(toUserMessage(clearError, "We couldn't update that list."));
  }

  if (productIds.length === 0) return ok(0);

  const { error } = await supabase.from("curated_products").insert(
    productIds.map((productId, index) => ({
      slot,
      product_id: productId,
      sort_order: index,
    })),
  );

  if (error) {
    console.error("[setCuratedProducts:insert]", error);
    return fail(toUserMessage(error, "We couldn't save that list."));
  }
  return ok(productIds.length);
}
