import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/chatbot/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

/**
 * The chat widget matches quick answers in the browser; it pings this so
 * Admin > Chatbot can show how often each one is used (schema-31).
 * Fire-and-forget: it never affects the chat, so failures are silent.
 */
export async function POST(req: Request) {
  const rl = rateLimit(`hit:${clientIp(req)}`, 60, 10 * 60 * 1000);
  if (!rl.ok) return new NextResponse(null, { status: 204 });

  const body = await req.json().catch(() => null);
  const ruleId = typeof body?.ruleId === "string" ? body.ruleId.trim().slice(0, 80) : "";
  if (!ruleId || !process.env.SUPABASE_SECRET_KEY) return new NextResponse(null, { status: 204 });

  const { error } = await createAdminClient().from("chatbot_rule_hits").insert({ rule_id: ruleId });
  if (error) console.warn("[chatbot] rule hit not logged:", error.message);
  return new NextResponse(null, { status: 204 });
}
