import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { getStripe, toCents } from "@/lib/stripe/server";
import { CONSULTATION_FEE_CAD } from "@/lib/rules/consultation";

// Signature verification needs Node crypto and the raw body.
export const runtime = "nodejs";
// Never cache a webhook.
export const dynamic = "force-dynamic";

/**
 * Stripe webhook — the only thing that may mark an order paid.
 *
 * Not the success redirect. A shopper can close the tab before it fires,
 * or open /orders/ORD-XXXX?paid=1 by hand; either way the browser must
 * never be what decides money changed hands. Stripe signs this request,
 * we verify the signature, and only then do we write.
 *
 * Retries: Stripe redelivers on any non-2xx. Every handler below is
 * therefore written to be safe to run twice — the unique index on
 * stripe_payment_intent_id plus the payment_status guard mean a repeat
 * delivery is a no-op rather than a second payment.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe:webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  // Raw text, never request.json() — parsing and re-serialising changes
  // the bytes and the signature no longer matches.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    // A bad signature is either a misconfigured secret or a forgery.
    console.error("[stripe:webhook] signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        // async payment methods complete later via async_payment_succeeded
        if (session.payment_status === "paid") {
          await markPaid(session);
        }
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        await markPaid(event.data.object);
        break;
      }

      case "checkout.session.async_payment_failed": {
        await setStatus(event.data.object, "failed");
        break;
      }

      case "checkout.session.expired": {
        // Back to unpaid, not failed: nothing went wrong, they walked
        // away, and the order should still be payable.
        await setStatus(event.data.object, "unpaid");
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const intentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (intentId) {
          const admin = createAdminClient();
          // The intent belongs to one of the two; updating both by
          // intent id is a no-op on whichever it is not.
          await admin
            .from("orders")
            .update({ payment_status: "refunded" })
            .eq("stripe_payment_intent_id", intentId);
          await admin
            .from("premium_requests")
            .update({ payment_status: "refunded" })
            .eq("stripe_payment_intent_id", intentId);
        }
        break;
      }

      default:
        // Unhandled types still get a 200 — returning an error would make
        // Stripe retry an event we are deliberately ignoring.
        break;
    }
  } catch (error) {
    // 500 so Stripe retries: a database blip must not silently lose a
    // payment confirmation.
    console.error(`[stripe:webhook] handling ${event.type} failed`, error);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function orderIdOf(session: Stripe.Checkout.Session): string | null {
  return session.metadata?.order_id ?? null;
}

/**
 * One endpoint now receives two kinds of payment.
 *
 * Sessions carry metadata.kind; anything without it predates the
 * consultation flow and is an order, so old sessions still in flight
 * when this deployed keep working.
 */
function kindOf(session: Stripe.Checkout.Session): "order" | "consultation" {
  return session.metadata?.kind === "consultation" ? "consultation" : "order";
}

function intentIdOf(session: Stripe.Checkout.Session): string | null {
  return typeof session.payment_intent === "string"
    ? session.payment_intent
    : (session.payment_intent?.id ?? null);
}

async function markPaid(session: Stripe.Checkout.Session) {
  if (kindOf(session) === "consultation") {
    await markConsultationPaid(session);
    return;
  }

  const orderId = orderIdOf(session);
  if (!orderId) {
    console.error("[stripe:webhook] session has no order_id metadata", session.id);
    return;
  }

  const intentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("id, total, payment_status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    console.error("[stripe:webhook] no order for id", orderId);
    return;
  }

  // Already handled by an earlier delivery of the same event.
  if (order.payment_status === "paid") return;

  const amountPaid = session.amount_total ?? 0;
  const expected = toCents(Number(order.total));

  // Recorded, not rejected: the money is already taken, so the right move
  // is to make the discrepancy visible rather than pretend it matched.
  if (amountPaid !== expected) {
    console.error(
      `[stripe:webhook] amount mismatch on ${orderId}: paid ${amountPaid}, expected ${expected}`,
    );
  }

  const { error } = await admin
    .from("orders")
    .update({
      payment_status: "paid",
      stripe_payment_intent_id: intentId,
      amount_paid_cents: amountPaid,
      paid_at: new Date().toISOString(),
      // Payment clears the order for the team to action; fulfilment
      // status moves on its own from here.
      status: "confirmed",
    })
    .eq("id", orderId);

  if (error) throw error;
}

async function setStatus(
  session: Stripe.Checkout.Session,
  status: "unpaid" | "failed",
) {
  if (kindOf(session) === "consultation") {
    const consultId = session.metadata?.premium_request_id;
    if (!consultId) return;
    const admin = createAdminClient();
    const { error } = await admin
      .from("premium_requests")
      .update({ payment_status: status })
      .eq("id", consultId)
      .neq("payment_status", "paid");
    if (error) throw error;
    return;
  }

  const orderId = orderIdOf(session);
  if (!orderId) return;

  const admin = createAdminClient();
  const { error } = await admin
    .from("orders")
    .update({ payment_status: status })
    .eq("id", orderId)
    // Never walk an already-paid order backwards.
    .neq("payment_status", "paid");

  if (error) throw error;
}

/**
 * A paid consultation.
 *
 * Deliberately parallel to the order path: idempotent on a repeat
 * delivery, and an amount mismatch is logged rather than rejected —
 * the money has already moved, so the discrepancy needs to be visible,
 * not hidden behind a failed webhook.
 */
async function markConsultationPaid(session: Stripe.Checkout.Session) {
  const consultId = session.metadata?.premium_request_id;
  if (!consultId) {
    console.error(
      "[stripe:webhook] consultation session has no premium_request_id",
      session.id,
    );
    return;
  }

  const admin = createAdminClient();

  const { data: consult } = await admin
    .from("premium_requests")
    .select("id, fee_cad, payment_status")
    .eq("id", consultId)
    .maybeSingle();

  if (!consult) {
    console.error("[stripe:webhook] no premium_request for id", consultId);
    return;
  }

  if (consult.payment_status === "paid") return;

  const amountPaid = session.amount_total ?? 0;
  const expected = toCents(Number(consult.fee_cad || CONSULTATION_FEE_CAD));
  if (amountPaid !== expected) {
    console.error(
      `[stripe:webhook] consultation amount mismatch on ${consultId}: paid ${amountPaid}, expected ${expected}`,
    );
  }

  const { error } = await admin
    .from("premium_requests")
    .update({
      payment_status: "paid",
      stripe_payment_intent_id: intentIdOf(session),
      amount_paid_cents: amountPaid,
      paid_at: new Date().toISOString(),
    })
    .eq("id", consultId);

  if (error) throw error;
}
