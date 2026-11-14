import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { clientIp, rateLimit } from "@/lib/chatbot/rate-limit";
import { notifyLead } from "@/lib/chatbot/notify";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  // max 5 leads per IP per hour
  const rl = rateLimit(`lead:${clientIp(req)}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const b = await req.json().catch(() => null);
  const clean = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
  const lead = {
    name: clean(b?.name, 100),
    contact: clean(b?.contact, 100),
    items: clean(b?.items, 1000),
    city: clean(b?.city, 100),
    page: clean(req.headers.get("referer"), 300),
  };

  if (!lead.name || !lead.contact || !lead.items) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const { error } = await supabase.from("chat_leads").insert(lead);
  if (error) {
    console.error("LEAD SAVE FAILED:", error.message);
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }

  console.log("NEW CHAT LEAD saved:", lead.name, lead.contact);
    await notifyLead(lead);
  return NextResponse.json({ ok: true });
}