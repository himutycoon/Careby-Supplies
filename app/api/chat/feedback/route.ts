import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/chatbot/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

/**
 * 👍 / 👎 from the chat widget on one logged answer (schema-32). A 👎 puts
 * the answer in Admin > Chatbot > Inbox under "Disliked" to be fixed.
 * Each answer takes one vote; later clicks are ignored.
 */
export async function POST(req: Request) {
  const rl = rateLimit(`feedback:${clientIp(req)}`, 30, 10 * 60 * 1000);
  if (!rl.ok) return new NextResponse(null, { status: 204 });

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!/^[0-9a-f-]{36}$/i.test(id) || typeof body?.helpful !== "boolean") return NextResponse.json({ error: "bad request" }, { status: 400 });

  const { error } = await createAdminClient()
    .from("chatbot_questions")
    .update({ feedback: body.helpful ? 1 : -1 })
    .eq("id", id)
    .is("feedback", null);
  if (error) console.warn("[chatbot] feedback not saved:", error.message);
  return new NextResponse(null, { status: 204 });
}
