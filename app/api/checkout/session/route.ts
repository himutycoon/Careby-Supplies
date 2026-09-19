import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { getStripe, isStripeConfigured, toCents } from "@/lib/stripe/server";

// Stripe's SDK needs Node crypto, not the Edge runtime.
export const runtime = "nodejs";

/**
 * Creates a Stripe Checkout Session for an order that already exists.
 *
 * The single most important rule here: the amount is read from the
 * `orders` row, which `recalculate_order_totals` computed from the
 * catalog. The request body carries a reference and nothing else — no
 * price, no quantity, no total. This is the same rule
 * `enforce_order_item_price` applies at checkout, extended to the charge
 * itself; without it, editing one number in devtools buys a $2,000 order
 * for a dollar.
 */
export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Payments are not configured." },
      { status: 503 },
    );
  }

  let reference: unknown;
  try {
    ({ reference } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof reference !== "string" || !reference.trim()) {
    return NextResponse.json(
      { error: "An order reference is required." },
      { status: 400 },
    );
  }

  // The caller's own session — RLS applies, so this can only ever read an
  // order the signed-in user is allowed to see.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please log in to pay for this order." },
      { status: 401 },
    );
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, reference, user_id, total, payment_status, contact")
    .eq("reference", reference)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // Belt and braces: RLS should already prevent this, but an ownership
  // check here means a future policy change cannot silently open it up.
  if (order.user_id !== user.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.payment_status === "paid") {
    return NextResponse.json(
      { error: "This order has already been paid." },
      { status: 409 },
    );
  }

  const amount = toCents(Number(order.total));
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "This order has no payable total." },
      { status: 422 },
    );
  }

  /*
   * One line item for the order total, not one per product.
   *
   * The itemised breakdown is on the cart and the order page already.
   * Re-deriving it here would mean rounding each line, the delivery fee
   * and the HST separately and hoping the sum still equals orders.total —
   * a drift the customer would pay for. A single line makes the charge
   * equal to the stored total by construction, which is the same
   * "one source of truth for money" rule as lib/rules/order-totals.ts.
   */
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    request.nextUrl.origin;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      currency: "cad",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "cad",
            unit_amount: amount,
            product_data: {
              name: `CareBy order ${order.reference}`,
              description: "Materials, delivery and HST included.",
            },
          },
        },
      ],
      customer_email: order.contact?.email || user.email || undefined,
      client_reference_id: order.reference,
      // Read back by the webhook to find the order without trusting the
      // success redirect.
      metadata: { order_id: order.id, reference: order.reference },
      payment_intent_data: {
        metadata: { order_id: order.id, reference: order.reference },
      },
      success_url: `${origin}/orders/${order.reference}?paid=1`,
      cancel_url: `${origin}/orders/${order.reference}?canceled=1`,
    },
    // If the shopper double-clicks Pay, Stripe returns the same session
    // rather than opening a second one against the same order.
    { idempotencyKey: `checkout:${order.id}` },
  );

  if (!session.url) {
    return NextResponse.json(
      { error: "Stripe did not return a checkout URL." },
      { status: 502 },
    );
  }

  /*
   * Record the session and move the order to "pending" with the service
   * role — the payment columns are trigger-protected against writes from
   * a browser session, and this route is server-side, so it is the one
   * place allowed to set them besides the webhook.
   */
  const admin = createAdminClient();
  await admin
    .from("orders")
    .update({
      stripe_checkout_session_id: session.id,
      payment_status: "pending",
    })
    .eq("id", order.id);

  return NextResponse.json({ url: session.url });
}
