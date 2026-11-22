import "server-only";
import Stripe from "stripe";

/**
 * The chatbot is a paid add-on (65 CAD/month) billed from the DEVELOPER's
 * Stripe account — not the store's STRIPE_SECRET_KEY, which takes shoppers'
 * money for the client. Everything here is optional:
 *
 *   CHATBOT_BILLING_STRIPE_KEY   restricted key (rk_live_...) from the
 *                                developer's Stripe, Subscriptions: Read only
 *   CHATBOT_SUBSCRIPTION_ID      sub_... created when the client paid
 *   CHATBOT_PAYMENT_LINK         Stripe Payment Link for the 65 CAD/month price
 *   CHATBOT_BILLING_PORTAL_URL   Stripe customer portal login link
 *   CHATBOT_PAID_UNTIL           YYYY-MM-DD, manual fallback (e-transfer etc.)
 *   CHATBOT_ENFORCE_BILLING      "1" pauses the widget once unpaid past grace
 */

export type PlanStatus = "active" | "past_due" | "unpaid" | "not_set_up";

export type ChatbotPlan = {
  status: PlanStatus;
  amountLabel: string;
  /** ISO date the current paid period ends. */
  paidThrough: string | null;
  source: "stripe" | "manual" | "none";
  payUrl: string | null;
  manageUrl: string | null;
};

const GRACE_DAYS = 7;
const CACHE_MS = 10 * 60 * 1000;
let cached: { at: number; plan: ChatbotPlan } | null = null;

function links() {
  return {
    payUrl: process.env.CHATBOT_PAYMENT_LINK || null,
    manageUrl: process.env.CHATBOT_BILLING_PORTAL_URL || null,
  };
}

async function fromStripe(key: string, subId: string): Promise<ChatbotPlan> {
  const stripe = new Stripe(key);
  const sub = await stripe.subscriptions.retrieve(subId);
  const item = sub.items.data[0];
  // Newer API versions put the period on the item, older on the subscription.
  const end =
    (item as unknown as { current_period_end?: number })?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end;
  const price = item?.price;
  const amountLabel =
    price?.unit_amount != null
      ? `${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()} / ${price.recurring?.interval ?? "month"}`
      : "65.00 CAD / month";

  let status: PlanStatus = "unpaid";
  if (sub.status === "active" || sub.status === "trialing") status = "active";
  else if (sub.status === "past_due") status = "past_due";

  return {
    status,
    amountLabel,
    paidThrough: end ? new Date(end * 1000).toISOString() : null,
    source: "stripe",
    ...links(),
  };
}

function fromManual(paidUntil: string): ChatbotPlan {
  const end = new Date(`${paidUntil}T23:59:59`);
  const now = Date.now();
  let status: PlanStatus = "active";
  if (Number.isNaN(end.getTime())) status = "not_set_up";
  else if (end.getTime() < now) {
    status = now - end.getTime() < GRACE_DAYS * 86400000 ? "past_due" : "unpaid";
  }
  return {
    status,
    amountLabel: "65.00 CAD / month",
    paidThrough: Number.isNaN(end.getTime()) ? null : end.toISOString(),
    source: "manual",
    ...links(),
  };
}

export async function getChatbotPlan(): Promise<ChatbotPlan> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.plan;

  const key = process.env.CHATBOT_BILLING_STRIPE_KEY;
  const subId = process.env.CHATBOT_SUBSCRIPTION_ID;
  const manual = process.env.CHATBOT_PAID_UNTIL;

  let plan: ChatbotPlan;
  try {
    if (key && subId) plan = await fromStripe(key, subId);
    else if (manual) plan = fromManual(manual);
    else plan = { status: "not_set_up", amountLabel: "65.00 CAD / month", paidThrough: null, source: "none", ...links() };
  } catch (e) {
    console.error("[chatbot billing] lookup failed:", e);
    // Never switch the bot off because Stripe had a bad minute.
    plan = { status: "active", amountLabel: "65.00 CAD / month", paidThrough: null, source: "stripe", ...links() };
    cached = { at: Date.now() - CACHE_MS + 60_000, plan }; // retry in a minute
    return plan;
  }
  cached = { at: Date.now(), plan };
  return plan;
}

/** False only when enforcement is switched on and the plan has lapsed. */
export async function chatbotAllowed(): Promise<boolean> {
  if (process.env.CHATBOT_ENFORCE_BILLING !== "1") return true;
  const plan = await getChatbotPlan();
  return plan.status === "active" || plan.status === "past_due" || plan.status === "not_set_up";
}
