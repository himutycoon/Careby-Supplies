import { createClient } from "@/lib/supabase/client";
import { fail, ok, toUserMessage, type ServiceResult } from "@/services/client";

/**
 * Allowance overrides.
 *
 * The allowance decides what a customer is told an upgrade costs, so it
 * is a commercial number that belongs to the business rather than to a
 * deploy. This reads the overrides; the rules layer stays pure and takes
 * them as an argument, the same way it takes the tier.
 *
 * Every read degrades to "no overrides", which means the figures in
 * data/packages/selection-items.ts. That is what shipped, so a database
 * without schema-23 behaves exactly as before rather than quoting zero.
 */

export type AllowanceOverrides = Record<string, number>;

export async function getAllowanceOverrides(): Promise<AllowanceOverrides> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("selection_allowances")
    .select("item_id, allowance_cad");

  if (error || !data) return {};

  const overrides: AllowanceOverrides = {};
  for (const row of data) {
    overrides[row.item_id as string] = Number(row.allowance_cad);
  }
  return overrides;
}

export async function setAllowance(
  itemId: string,
  allowanceCad: number,
): Promise<ServiceResult<null>> {
  if (!itemId) return fail("No item selected.");
  if (!Number.isFinite(allowanceCad) || allowanceCad < 0) {
    return fail("An allowance can't be negative.");
  }

  const supabase = createClient();
  const { error } = await supabase.from("selection_allowances").upsert({
    item_id: itemId,
    allowance_cad: Math.round(allowanceCad * 100) / 100,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[setAllowance]", error);
    return fail(toUserMessage(error, "We couldn't save that allowance."));
  }
  return ok(null);
}

/** Drops the override, so the item goes back to the figure in code. */
export async function clearAllowance(
  itemId: string,
): Promise<ServiceResult<null>> {
  const supabase = createClient();
  const { error } = await supabase
    .from("selection_allowances")
    .delete()
    .eq("item_id", itemId);

  if (error) {
    console.error("[clearAllowance]", error);
    return fail(toUserMessage(error, "We couldn't reset that allowance."));
  }
  return ok(null);
}
