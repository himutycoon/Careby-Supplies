import "server-only";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { CHATBOT_PLAN } from "./plan";
import { getSubscription, paypalConfigured, type PayPalSubscription } from "./paypal";

/**
 * Is the chatbot plan paid, and which plan is it?
 *
 * The admin subscribes on Admin > Chatbot; /api/chatbot/subscription saves
 * the PayPal subscription ID in `chatbot_subscription` (schema-30). Here we
 * ask PayPal for its live status, so the bot turns on after the first
 * payment and off when the subscription is cancelled or stops paying.
 * Fallback: CHATBOT_PLAN.paidUntil (or CHATBOT_PAID_UNTIL) for manual
 * payments.
 */

export type PlanStatus = "active" | "past_due" | "unpaid" | "pending" | "not_set_up";
export type PlanTier = "pro" | "premium";

export type ChatbotPlan = {
  status: PlanStatus;
  tier: PlanTier | null;
  /** ISO date the current paid period ends. */
  paidThrough: string | null;
  source: "paypal" | "manual" | "none";
  /** PayPal will charge again (false once cancelled, even if still paid up). */
  renewing: boolean;
};

const GRACE_DAYS = 7;
const DAY = 86400000;
const CACHE_MS = 10 * 60 * 1000;
let cached: { at: number; plan: ChatbotPlan } | null = null;

const NONE: ChatbotPlan = { status: "not_set_up", tier: null, paidThrough: null, source: "none", renewing: false };

export function tierOf(planId: string | null | undefined): PlanTier | null {
  if (!planId) return null;
  if (planId === CHATBOT_PLAN.paypal.planId) return "pro";
  if (planId === CHATBOT_PLAN.upgrade.paypalPlanId) return "premium";
  return null;
}

/** Map PayPal's subscription to our status. */
export function fromPayPal(sub: PayPalSubscription): ChatbotPlan {
  const tier = tierOf(sub.plan_id);
  const next = sub.billing_info?.next_billing_time ?? null;
  const last = sub.billing_info?.last_payment?.time ?? null;
  const now = Date.now();

  let status: PlanStatus;
  let paidThrough = next;
  switch (sub.status) {
    case "ACTIVE":
      status = (sub.billing_info?.failed_payments_count ?? 0) > 0 ? "past_due" : "active";
      break;
    case "APPROVAL_PENDING":
    case "APPROVED":
      status = "pending"; // approved in PayPal, first payment not through yet
      break;
    default: {
      // SUSPENDED, CANCELLED, EXPIRED: honour the month already paid for.
      paidThrough = last ? new Date(new Date(last).getTime() + 30 * DAY).toISOString() : null;
      status = paidThrough && new Date(paidThrough).getTime() > now ? "active" : "unpaid";
    }
  }
  return { status, tier, paidThrough, source: "paypal", renewing: sub.status === "ACTIVE" };
}

function fromManual(paidUntil: string): ChatbotPlan {
  const end = new Date(`${paidUntil}T23:59:59`);
  if (Number.isNaN(end.getTime())) return NONE;
  const over = Date.now() - end.getTime();
  const status: PlanStatus = over <= 0 ? "active" : over < GRACE_DAYS * DAY ? "past_due" : "unpaid";
  return { status, tier: "pro", paidThrough: end.toISOString(), source: "manual", renewing: false };
}

type SavedSub = { subscription_id: string; plan_id: string | null; status: string | null };

async function savedSubscription(): Promise<SavedSub | null> {
  if (!process.env.SUPABASE_SECRET_KEY) return null;
  const { data, error } = await createAdminClient()
    .from("chatbot_subscription")
    .select("subscription_id, plan_id, status")
    .eq("id", 1)
    .maybeSingle();
  // Table missing (schema-30 not run yet) reads as "no subscription".
  if (error) console.warn("[chatbot billing] subscription read skipped:", error.message);
  return data ?? null;
}

export function clearPlanCache() {
  cached = null;
}

export async function getChatbotPlan(): Promise<ChatbotPlan> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.plan;

  let plan: ChatbotPlan = NONE;
  const saved = await savedSubscription();
  if (saved) {
    if (paypalConfigured()) {
      try {
        plan = fromPayPal(await getSubscription(saved.subscription_id));
      } catch (e) {
        console.error("[chatbot billing] PayPal lookup failed:", e);
        // PayPal having a bad minute must not switch off a paid bot: fall
        // back to the last status we saw, and retry in a minute.
        const tier = tierOf(saved.plan_id);
        plan = saved.status === "ACTIVE"
          ? { status: "active", tier, paidThrough: null, source: "paypal", renewing: true }
          : { ...NONE, tier, status: "pending" };
        cached = { at: Date.now() - CACHE_MS + 60_000, plan };
        return plan;
      }
    } else {
      // Can't confirm with PayPal yet (PAYPAL_CLIENT_* not set on the host).
      plan = { ...NONE, status: "pending", tier: tierOf(saved.plan_id), source: "paypal" };
    }
  }

  // Manual date covers e-transfer etc., and wins if PayPal shows nothing paid.
  const manual = process.env.CHATBOT_PAID_UNTIL || CHATBOT_PLAN.paidUntil;
  if (manual && plan.status !== "active" && plan.status !== "past_due") {
    const m = fromManual(manual);
    if (m.status === "active" || m.status === "past_due") plan = m;
  }

  cached = { at: Date.now(), plan };
  return plan;
}

/** Whether the assistant shows on the public site. */
export async function chatbotAllowed(): Promise<boolean> {
  if (CHATBOT_PLAN.bot === "on") return true;
  if (CHATBOT_PLAN.bot === "off") return false;
  const plan = await getChatbotPlan();
  return plan.status === "active" || plan.status === "past_due";
}
