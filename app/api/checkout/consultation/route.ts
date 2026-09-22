import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { getStripe, isStripeConfigured, toCents } from "@/lib/stripe/server";
import {
  CONSULTATION_FEE_CAD,
  CONSULTATION_PRODUCT_DESCRIPTION,
  CONSULTATION_PRODUCT_NAME,
} from "@/lib/rules/consultation";

// Stripe's SDK needs Node crypto, not the Edge runtime.
export const runtime = "nodejs";

/**
 * Checkout for a paid expert consultation.
 *
 * The request body carries a reference and nothing else. The fee comes
 * from lib/rules/consultation, not from the caller — the same rule the
 * order route follows, so the page, the wizard and the charge cannot
 * disagree and a tampered request cannot buy a consult for a dollar.
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
    .select("id, reference, user_id, payment_status")
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

  const amount = toCents(CONSULTATION_FEE_CAD);
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
              name: CONSULTATION_PRODUCT_NAME,
              description: CONSULTATION_PRODUCT_DESCRIPTION,
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
      cancel_url: `${origin}/premium-request?canceled=1&ref=${consult.reference}`,
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
      fee_cad: CONSULTATION_FEE_CAD,
    })
    .eq("id", consult.id);

  return NextResponse.json({ url: session.url });
}
