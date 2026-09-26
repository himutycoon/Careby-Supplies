/**
 * Rules layer — package scope generation.
 *
 * Turns a template, a budget tier and a set of adjuster answers into the
 * exact list of decisions a customer has to make. Pure and
 * dependency-free, like the rest of lib/rules: no network, no Supabase,
 * no React, so the generated scope can be tested on its own.
 *
 * The Package Rules sheet is the specification for this file:
 *
 *   - "Do not show 634 items" — generate only what scope triggers.
 *   - "Basic/Medium/Luxury are presets" — they move allowance and product
 *     tier, they do not create rigid packages, so tier never adds or
 *     removes a requirement here.
 *   - "Required vs optional" — required blocks submission, optional does
 *     not, so the distinction is carried on every requirement.
 *   - "Customer sees only choices" — rough-in and coordination come back
 *     as `flags` for the contractor, never as customer requirements.
 */

import {
  ADJUSTERS,
  adjuster,
  type AdjusterChoice,
} from "@/data/packages/adjusters";
import {
  allowanceFor,
  selectionItem,
  type BudgetTier,
  type SelectionItem,
} from "@/data/packages/selection-items";
import { packageTemplate, type PackageTemplate } from "@/data/packages/templates";

export interface ScopeRequest {
  templateId: string;
  tier: BudgetTier;
  /** adjusterId -> choice value. Missing ids fall back to the default. */
  adjusters: Record<string, string>;
}

export interface SelectionRequirement {
  itemId: string;
  label: string;
  room: string;
  categoryId: string;
  /** Required selections block submission; optional ones do not. */
  required: boolean;
  /** How many of this item the customer chooses. */
  quantity: number;
  /** Per-unit allowance at the chosen tier. */
  allowanceCad: number;
  /** quantity × allowanceCad, the budget for this line. */
  totalAllowanceCad: number;
  /** Words to match catalogue products with. */
  keywords: string[];
  /** Why this is in scope — shown to the contractor, not the customer. */
  reason: string;
}

export interface GeneratedScope {
  template: PackageTemplate;
  tier: BudgetTier;
  requirements: SelectionRequirement[];
  /** Coordination notes for the contractor: rough-ins, permits, trades. */
  flags: string[];
  /** Verbatim exclusions from the template. */
  exclusions: string;
  /** Sum of every required line's allowance. */
  requiredAllowanceCad: number;
  /** Sum of every line's allowance, required and optional. */
  totalAllowanceCad: number;
}

/** Quantities are whole units — nobody chooses 1.8 faucets. */
function roundQuantity(value: number): number {
  return Math.max(1, Math.round(value));
}

/**
 * Resolves the chosen option for each adjuster, ignoring answers for
 * adjusters this template never asks about.
 *
 * An adjuster the contractor was never shown must not silently shape the
 * scope: a bathroom template does not ask about appliances, so an
 * "appliances: existing" answer left over from another template cannot
 * strip a kitchen item out of it.
 */
function activeChoices(
  template: PackageTemplate,
  answers: Record<string, string>,
): { id: string; label: string; choice: AdjusterChoice }[] {
  const asked = new Set(template.adjusters);
  const resolved: { id: string; label: string; choice: AdjusterChoice }[] = [];

  for (const def of ADJUSTERS) {
    if (!asked.has(def.id)) continue;
    /*
     * Precedence: the contractor's answer, then the template's own
     * starting position, then the adjuster's generic default. The middle
     * step is what stops the Outdoor adjuster's "none" from deleting the
     * decking out of a Deck package.
     */
    const value =
      answers[def.id] ?? template.defaultAdjusters?.[def.id] ?? def.defaultValue;
    const choice = def.choices.find((c) => c.value === value);
    if (choice) resolved.push({ id: def.id, label: def.label, choice });
  }

  return resolved;
}

export function generateScope(request: ScopeRequest): GeneratedScope | null {
  const template = packageTemplate(request.templateId);
  if (!template) return null;

  const tier = template.tiers.includes(request.tier)
    ? request.tier
    : template.defaultTier;

  const choices = activeChoices(template, request.adjusters);

  /*
   * Build the set of item ids in scope.
   *
   * Order matters and is deliberate: the template's own list first, then
   * adds, then removes. Removal wins, so "No shower" takes the shower out
   * even when the template included it — the adjuster is the more
   * specific statement about this particular job.
   */
  const inScope = new Map<string, { required: boolean; reason: string }>();

  for (const id of template.base) {
    inScope.set(id, { required: true, reason: `${template.name} base scope` });
  }
  for (const id of template.optional) {
    if (!inScope.has(id)) {
      inScope.set(id, { required: false, reason: "Optional add-on" });
    }
  }

  for (const { label, choice } of choices) {
    for (const id of choice.adds ?? []) {
      const existing = inScope.get(id);
      // An add promotes an optional item to required: the contractor has
      // now said this job includes it.
      inScope.set(id, {
        required: true,
        reason: existing?.required
          ? existing.reason
          : `${label}: ${choice.label}`,
      });
    }
  }

  for (const { choice } of choices) {
    for (const id of choice.removes ?? []) inScope.delete(id);
  }

  // Quantity multipliers, applied after membership is settled.
  const quantities = new Map<string, number>();
  const globalMultiplier = choices.reduce(
    (product, { choice }) => product * (choice.multiplyAll ?? 1),
    1,
  );

  for (const id of inScope.keys()) quantities.set(id, globalMultiplier);

  for (const { choice } of choices) {
    if (!choice.multiply) continue;
    for (const id of choice.multiply.items) {
      if (!quantities.has(id)) continue;
      quantities.set(id, (quantities.get(id) ?? 1) * choice.multiply.by);
    }
  }

  // Keyword narrowing, last: a later adjuster's answer beats an earlier
  // one, the same precedence the rest of this function uses.
  const keywordOverrides = new Map<string, string[]>();
  for (const { choice } of choices) {
    if (!choice.setKeywords) continue;
    for (const id of choice.setKeywords.items) {
      keywordOverrides.set(id, choice.setKeywords.keywords);
    }
  }

  const requirements: SelectionRequirement[] = [];

  for (const [id, meta] of inScope) {
    const item: SelectionItem | undefined = selectionItem(id);
    // An unknown id is a data error in a template, not something to
    // render as a blank line in front of a customer.
    if (!item) continue;

    const quantity = roundQuantity(quantities.get(id) ?? 1);
    const allowance = allowanceFor(item, tier);

    requirements.push({
      itemId: item.id,
      label: item.label,
      room: item.room,
      categoryId: item.categoryId,
      required: meta.required,
      quantity,
      allowanceCad: allowance,
      totalAllowanceCad: allowance * quantity,
      keywords: keywordOverrides.get(item.id) ?? item.keywords ?? [],
      reason: meta.reason,
    });
  }

  /*
   * Grouped by room, then required before optional, so the customer
   * works through one room at a time.
   *
   * Within a room, scope order — not alphabetical. The templates state
   * the order the client asked for (cabinets, hardware, countertop,
   * backsplash, rangehood, appliances, sink, faucet, light), and sorting
   * by label threw it away: it put the dishwasher between the countertop
   * and the faucet because D falls between C and K. Array.prototype.sort
   * is stable, so returning 0 leaves them as scope built them.
   *
   * Rooms are ordered by first appearance for the same reason: a
   * basement's own finishes come before the washroom and kitchen that
   * were added to it, which is the order the client listed.
   */
  const roomOrder = new Map<string, number>();
  for (const { room } of requirements) {
    if (!roomOrder.has(room)) roomOrder.set(room, roomOrder.size);
  }

  requirements.sort(
    (a, b) =>
      (roomOrder.get(a.room) ?? 0) - (roomOrder.get(b.room) ?? 0) ||
      Number(b.required) - Number(a.required) ||
      0,
  );

  const flags = [
    ...new Set(choices.flatMap(({ choice }) => choice.flags ?? [])),
  ];

  const requiredAllowanceCad = requirements
    .filter((r) => r.required)
    .reduce((sum, r) => sum + r.totalAllowanceCad, 0);
  const totalAllowanceCad = requirements.reduce(
    (sum, r) => sum + r.totalAllowanceCad,
    0,
  );

  return {
    template,
    tier,
    requirements,
    flags,
    exclusions: template.exclusions,
    requiredAllowanceCad,
    totalAllowanceCad,
  };
}

/** Requirements grouped for display, in the order generateScope sorted them. */
export function groupByRoom(
  requirements: SelectionRequirement[],
): { room: string; items: SelectionRequirement[] }[] {
  const groups = new Map<string, SelectionRequirement[]>();
  for (const requirement of requirements) {
    const list = groups.get(requirement.room) ?? [];
    list.push(requirement);
    groups.set(requirement.room, list);
  }
  return [...groups.entries()].map(([room, items]) => ({ room, items }));
}

export interface CompletenessResult {
  complete: boolean;
  missing: SelectionRequirement[];
  chosen: number;
  requiredCount: number;
}

/**
 * The completeness check from the Customer Flow sheet, step 8.
 *
 * "System should not allow 'done' while required selections remain
 * unresolved." Optional items are never counted as missing.
 */
export function checkCompleteness(
  requirements: SelectionRequirement[],
  chosenItemIds: Iterable<string>,
): CompletenessResult {
  const chosen = new Set(chosenItemIds);
  const required = requirements.filter((r) => r.required);
  const missing = required.filter((r) => !chosen.has(r.itemId));

  return {
    complete: missing.length === 0,
    missing,
    chosen: required.length - missing.length,
    requiredCount: required.length,
  };
}

export interface AllowanceDelta {
  allowanceCad: number;
  selectedCad: number;
  /** Positive is an upgrade the customer pays; negative is a credit. */
  differenceCad: number;
}

/**
 * Allowance transparency, per the Package Rules sheet: "Show allowance,
 * product price and upgrade/credit before submission."
 */
export function allowanceDelta(
  requirement: Pick<SelectionRequirement, "totalAllowanceCad" | "quantity">,
  unitPriceCad: number,
): AllowanceDelta {
  const selectedCad = Math.round(unitPriceCad * requirement.quantity * 100) / 100;
  return {
    allowanceCad: requirement.totalAllowanceCad,
    selectedCad,
    differenceCad:
      Math.round((selectedCad - requirement.totalAllowanceCad) * 100) / 100,
  };
}

/** Which adjusters a template actually asks, in sheet order. */
export function adjustersForTemplate(template: PackageTemplate) {
  return template.adjusters
    .map((id) => adjuster(id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
}

/**
 * The answer set a contractor starts from for this template: every
 * adjuster it asks, at the template's own default.
 */
export function defaultAnswersForTemplate(
  template: PackageTemplate,
): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const def of ADJUSTERS) {
    if (!template.adjusters.includes(def.id)) continue;
    answers[def.id] = template.defaultAdjusters?.[def.id] ?? def.defaultValue;
  }
  return answers;
}
