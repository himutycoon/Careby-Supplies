import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { getStripe, isStripeConfigured, toCents } from "@/lib/stripe/server";
import {
  CONSULTATION_FEE_CAD,
  CONSULTATION_PRODUCT_DESCRIPTION,
  CONSULTATION_PRODUCT_NAME,
  PAID_CONSULTATION_TIER,
} from "@/lib/rules/consultation";
import {
  CONSTRUCTION_PRODUCT_DESCRIPTION,
  CONSTRUCTION_PRODUCT_NAME,
  constructionTierFeeCad,
  isPaidConstructionTier,
} from "@/lib/rules/construction-packages";

// Stripe's SDK needs Node crypto, not the Edge runtime.
export const runtime = "nodejs";

/**
 * Checkout for a paid advisory request.
 *
 * Two flows arrive here: the premium expert session, and the paid tiers
 * of the new-build ladder. Both are time sold by the hour rather than
 * material, and both already own a row in premium_requests, so they
 * share this route rather than duplicating the Stripe plumbing.
 *
 * The request body carries a reference and nothing else. Which tier it
 * is comes from the stored row, and the fee from the rules layer — the
 * same rule the order route follows, so the page, the wizard and the
 * charge cannot disagree and a tampered request cannot buy a $150
 * package for a dollar.
 */

/** Tier → what is being sold and for how much. Never trusts the caller. */
function priceFor(
  tierId: string,
): { feeCad: number; name: string; description: string } | null {
  if (isPaidConstructionTier(tierId)) {
    return {
      feeCad: constructionTierFeeCad(tierId)!,
      name: CONSTRUCTION_PRODUCT_NAME[tierId],
      description: CONSTRUCTION_PRODUCT_DESCRIPTION[tierId],
    };
  }
  if (tierId === PAID_CONSULTATION_TIER) {
    return {
      feeCad: CONSULTATION_FEE_CAD,
      name: CONSULTATION_PRODUCT_NAME,
      description: CONSULTATION_PRODUCT_DESCRIPTION,
    };
  }
  return null;
}
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
      { error: "A request reference is required." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please log in to pay for your consultation." },
      { status: 401 },
    );
  }

  // RLS already restricts this to the caller's own rows; the explicit
  // ownership check below means a future policy change cannot open it up.
  const { data: consult, error } = await supabase
    .from("premium_requests")
    .select("id, reference, user_id, payment_status, details")
    .eq("reference", reference)
    .maybeSingle();

  if (error || !consult) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  if (consult.user_id !== user.id) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  if (consult.payment_status === "paid") {
    return NextResponse.json(
      { error: "This consultation has already been paid for." },
      { status: 409 },
    );
  }

  /*
   * The tier was written when the row was created; the browser has no say
   * in it now. There is deliberately no default: `details` is written by
   * a second statement after the insert, so a row can exist without it,
   * and falling back to the consultation fee would have charged $20 for a
   * $150 package. With four prices on this route, a missing tier has to
   * fail rather than guess.
   */
  const tierId = (consult.details as { tier?: unknown } | null)?.tier;
  const price = typeof tierId === "string" ? priceFor(tierId) : null;

  if (!price) {
    console.error(
      "[checkout:consultation] no payable tier on",
      consult.reference,
      tierId,
    );
    return NextResponse.json(
      {
        error:
          "We couldn't work out what to charge for this request. We'll be in touch.",
      },
      { status: 409 },
    );
  }

  // Send them back where they came from if they abandon checkout — the
  // premium wizard and the new-build wizard are different screens.
  const cancelPath =
    (consult.details as { flow?: unknown } | null)?.flow === "new-construction"
      ? "/new-construction"
      : "/premium-request";

  const amount = toCents(price.feeCad);
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
              name: price.name,
              description: price.description,
            },
          },
        },
      ],
      customer_email: user.email ?? undefined,
      client_reference_id: consult.reference,
      /*
       * `kind` is what the webhook routes on: one endpoint now receives
       * both order and consultation sessions, and reading order_id alone
       * would silently drop these.
       */
      metadata: {
        kind: "consultation",
        premium_request_id: consult.id,
        reference: consult.reference,
      },
      payment_intent_data: {
        metadata: {
          kind: "consultation",
          premium_request_id: consult.id,
          reference: consult.reference,
        },
      },
      success_url: `${origin}/dashboard?consultation=paid&ref=${consult.reference}`,
      cancel_url: `${origin}${cancelPath}?canceled=1&ref=${consult.reference}`,
    },
    { idempotencyKey: `consultation:${consult.id}` },
  );

  if (!session.url) {
    return NextResponse.json(
      { error: "Stripe did not return a checkout URL." },
      { status: 502 },
    );
  }

  // Service role: the payment columns are trigger-protected from browser
  // sessions, so this route and the webhook are the only writers.
  const admin = createAdminClient();
  await admin
    .from("premium_requests")
    .update({
      stripe_checkout_session_id: session.id,
      payment_status: "pending",
      fee_cad: price.feeCad,
    })
    .eq("id", consult.id);

  return NextResponse.json({ url: session.url });
}
