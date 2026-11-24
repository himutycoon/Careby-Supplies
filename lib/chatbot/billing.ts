import "server-only";
import Stripe from "stripe";
import { CHATBOT_PLAN } from "./plan";

/**
 * The chatbot is a paid add-on (60 CAD/month + 5 CAD setup) billed from the DEVELOPER's
 * Stripe account — not the store's STRIPE_SECRET_KEY, which takes shoppers'
 * money for the client. Everything here is optional:
 *
 *   CHATBOT_RAZORPAY_KEY_ID      rzp_live_... from the developer's Razorpay
 *   CHATBOT_RAZORPAY_KEY_SECRET  its secret (checked before Stripe)
 *
 *   CHATBOT_BILLING_STRIPE_KEY   restricted key (rk_live_...) from the
 *                                developer's Stripe, Subscriptions: Read only
 *   CHATBOT_SUBSCRIPTION_ID      sub_... (Razorpay or Stripe subscription)
 *   CHATBOT_PAYMENT_LINK         Stripe Payment Link for the 60 CAD/month price
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
  source: "razorpay" | "stripe" | "manual" | "none";
  payUrl: string | null;
  manageUrl: string | null;
};

const GRACE_DAYS = 7;
const CACHE_MS = 10 * 60 * 1000;
let cached: { at: number; plan: ChatbotPlan } | null = null;

function links() {
  return {
    payUrl: process.env.CHATBOT_PAYMENT_LINK || CHATBOT_PLAN.payUrl || null,
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
      : CHATBOT_PLAN.amountLabel;

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

async function fromRazorpay(keyId: string, keySecret: string, subId: string): Promise<ChatbotPlan> {
  const auth = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const get = async (path: string) => {
    const res = await fetch(`https://api.razorpay.com/v1/${path}`, {
      headers: { Authorization: auth },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Razorpay ${path} -> ${res.status}`);
    return res.json();
  };

  const sub = await get(`subscriptions/${encodeURIComponent(subId)}`);
  let amountLabel = CHATBOT_PLAN.amountLabel;
  try {
    const plan = await get(`plans/${encodeURIComponent(sub.plan_id)}`);
    const unit = plan.period === "monthly" ? "month" : plan.period?.replace(/ly$/, "") || "month";
    amountLabel = `${(plan.item.amount / 100).toFixed(2)} ${String(plan.item.currency).toUpperCase()} / ${unit}`;
  } catch {}

  // https://razorpay.com/docs/payments/subscriptions/states/
  let status: PlanStatus;
  switch (sub.status) {
    case "active":
    case "authenticated":
      status = "active";
      break;
    case "pending": // a charge failed, Razorpay is retrying
      status = "past_due";
      break;
    case "created": // link sent, client hasn't paid yet
      status = "not_set_up";
      break;
    default: // halted, cancelled, paused, completed, expired
      status = "unpaid";
  }

  const end = sub.current_end ?? sub.charge_at;
  const { payUrl, manageUrl } = links();
  return {
    status,
    amountLabel,
    paidThrough: end ? new Date(end * 1000).toISOString() : null,
    source: "razorpay",
    // Razorpay's own subscription page doubles as the "pay now" link.
    payUrl: payUrl || sub.short_url || null,
    manageUrl,
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
    amountLabel: CHATBOT_PLAN.amountLabel,
    paidThrough: Number.isNaN(end.getTime()) ? null : end.toISOString(),
    source: "manual",
    ...links(),
  };
}

export async function getChatbotPlan(): Promise<ChatbotPlan> {
  if (!CHATBOT_PLAN.botOn) {
    return { status: "not_set_up", amountLabel: CHATBOT_PLAN.amountLabel, paidThrough: null, source: "none", ...links() };
  }
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.plan;

  const key = process.env.CHATBOT_BILLING_STRIPE_KEY;
  const subId = process.env.CHATBOT_SUBSCRIPTION_ID || CHATBOT_PLAN.subscriptionId;
  // the host's setting wins; otherwise the date kept in lib/chatbot/plan.ts
  const manual = process.env.CHATBOT_PAID_UNTIL || CHATBOT_PLAN.paidUntil;

  const rzpId = process.env.CHATBOT_RAZORPAY_KEY_ID;
  const rzpSecret = process.env.CHATBOT_RAZORPAY_KEY_SECRET;

  let plan: ChatbotPlan;
  try {
    if (rzpId && rzpSecret && subId) plan = await fromRazorpay(rzpId, rzpSecret, subId);
    else if (key && subId) plan = await fromStripe(key, subId);
    else if (manual) plan = fromManual(manual);
    else plan = { status: "not_set_up", amountLabel: CHATBOT_PLAN.amountLabel, paidThrough: null, source: "none", ...links() };
  } catch (e) {
    console.error("[chatbot billing] lookup failed:", e);
    // Never switch the bot off because Stripe had a bad minute.
    plan = { status: "active", amountLabel: CHATBOT_PLAN.amountLabel, paidThrough: null, source: "stripe", ...links() };
    cached = { at: Date.now() - CACHE_MS + 60_000, plan }; // retry in a minute
    return plan;
  }
  cached = { at: Date.now(), plan };
  return plan;
}

/** False when the master switch is off, or enforcement is on and the plan has lapsed. */
export async function chatbotAllowed(): Promise<boolean> {
  if (!CHATBOT_PLAN.botOn) return false; // master switch in lib/chatbot/plan.ts
  const env = process.env.CHATBOT_ENFORCE_BILLING;
  const enforce = env === "1" || (env !== "0" && CHATBOT_PLAN.enforce);
  if (!enforce) return true;
  const plan = await getChatbotPlan();
  return plan.status === "active" || plan.status === "past_due" || plan.status === "not_set_up";
}
