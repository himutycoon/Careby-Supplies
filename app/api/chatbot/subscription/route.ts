import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { clearPlanCache, fromPayPal, tierOf } from "@/lib/chatbot/billing";
import { getSubscription, paypalConfigured } from "@/lib/chatbot/paypal";
import { notifySubscription } from "@/lib/chatbot/notify";

export const dynamic = "force-dynamic";

/**
 * Called by the PayPal button on Admin > Chatbot after the admin approves a
 * subscription. Saves the subscription ID; the bot only switches on once
 * PayPal itself reports it active (lib/chatbot/billing.ts), so a forged
 * request can't turn the bot on without paying.
 */
export async function POST(req: Request) {
  const sb = await createServerClient();
  const { data: isAdmin } = await sb.rpc("is_admin");
  if (isAdmin !== true) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const id = typeof body?.subscriptionID === "string" ? body.subscriptionID.trim() : "";
  if (!/^I-[A-Z0-9]{6,40}$/.test(id)) return NextResponse.json({ error: "bad subscription id" }, { status: 400 });

  let planId: string | null = typeof body?.planId === "string" ? body.planId : null;
  let status: string | null = null;
  let email: string | null = null;
  if (paypalConfigured()) {
    try {
      const sub = await getSubscription(id);
      if (!tierOf(sub.plan_id)) return NextResponse.json({ error: "unknown plan" }, { status: 400 });
      planId = sub.plan_id;
      status = sub.status;
      email = sub.subscriber?.email_address ?? null;
    } catch (e) {
      console.error("[chatbot subscription] PayPal check failed:", e);
      return NextResponse.json({ error: "could not confirm with PayPal" }, { status: 502 });
    }
  }

  const { error } = await createAdminClient()
    .from("chatbot_subscription")
    .upsert({ id: 1, subscription_id: id, plan_id: planId, status, subscriber_email: email, updated_at: new Date().toISOString() });
  if (error) {
    console.error("[chatbot subscription] save failed:", error.message);
    // Still tell the developer, so a missing table never loses a payment.
    await notifySubscription({ id, planId, status, saved: false });
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }

  clearPlanCache();
  await notifySubscription({ id, planId, status, saved: true });

  const plan = status ? fromPayPal({ id, status: status as never, plan_id: planId ?? "" }) : null;
  return NextResponse.json({ ok: true, status: plan?.status ?? "pending" });
}
