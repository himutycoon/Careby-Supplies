/**
 * Does the figure on the Pay button match the figure Stripe charges?
 *
 *     node --experimental-strip-types scripts/check-order-totals.mjs
 *
 * calculateOrderTotals in lib/rules draws the number the customer sees;
 * recalculate_order_totals in schema-27 computes the number that bills.
 * Two implementations of the same arithmetic in two languages is a
 * standing invitation to drift, and the drift would be silent and about
 * money. This runs both over the same cases and diffs them.
 *
 * The SQL below is transcribed by hand, so it is only as good as the
 * transcription -- re-read it against the migration if either changes.
 */
import { calculateOrderTotals } from "../lib/rules/order-totals.ts";

const r2 = (n) => Math.round(n * 100) / 100;

// Transcribed from recalculate_order_totals() in schema-27.
function sqlTotals(items, method, pkg) {
  const itemsSubtotal = r2(items);
  const shipping =
    itemsSubtotal === 0
      ? 0
      : method === "pickup"
        ? 0
        : itemsSubtotal >= 500
          ? 0
          : 79;
  const subtotal = r2(itemsSubtotal + pkg);
  const tax = r2((subtotal + shipping) * 0.13);
  return { subtotal, delivery: shipping, tax, total: r2(subtotal + shipping + tax) };
}

const cases = [
  ["no package, under threshold", [[120, 1]], "standard", 0],
  ["no package, over threshold", [[600, 1]], "standard", 0],
  ["Basic on a small order", [[120, 1]], "standard", 149],
  ["Basic, pickup", [[120, 1]], "pickup", 149],
  ["Standard on a big order", [[700, 1]], "standard", 449],
  ["Premium only just under", [[499.99, 1]], "standard", 1200],
  ["package must not buy free delivery", [[400, 1]], "standard", 149],
  ["many lines", [[12.5, 3], [7.77, 9], [250, 2]], "standard", 449],
];

let bad = 0;
for (const [name, lines, method, pkg] of cases) {
  const ts = calculateOrderTotals(
    lines.map(([unitPriceCad, quantity]) => ({ unitPriceCad, quantity })),
    method,
    pkg,
  );
  const sql = sqlTotals(
    lines.reduce((s, [p, q]) => s + p * q, 0),
    method,
    pkg,
  );
  const same = JSON.stringify(ts) === JSON.stringify(sql);
  if (!same) bad++;
  console.log(
    same ? "ok  " : "DIFF",
    name.padEnd(34),
    `sub ${String(ts.subtotal).padStart(8)}`,
    `del ${String(ts.delivery).padStart(3)}`,
    `tax ${String(ts.tax).padStart(7)}`,
    `tot ${String(ts.total).padStart(8)}`,
  );
  if (!same) console.log("      sql said:", JSON.stringify(sql));
}

console.log(bad === 0 ? "\nrule and trigger agree on every case" : `\n${bad} DISAGREE`);
process.exit(bad === 0 ? 0 : 1);
