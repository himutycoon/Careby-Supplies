import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/chatbot/rate-limit";
import { loadChatbotConfig } from "@/lib/chatbot/load";
import { chatbotAllowed } from "@/lib/chatbot/billing";
import { aiConfigured, runAssistant, type ChatTurn } from "@/lib/chatbot/ai";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function isAdminRequest() {
  try {
    const sb = await createServerClient();
    const { data } = await sb.rpc("is_admin");
    return data === true;
  } catch {
    return false;
  }
}

async function logQuestion(row: { question: string; reply: string; answered: boolean; products: string[]; page: string }) {
  if (!process.env.SUPABASE_SECRET_KEY) return;
  const { error } = await createAdminClient().from("chatbot_questions").insert({
    question: row.question.slice(0, 1000),
    reply: row.reply.slice(0, 2000),
    answered: row.answered,
    products_shown: row.products,
    page: row.page.slice(0, 300),
  });
  // Table missing (schema-29 not run) must never break the chat.
  if (error) console.warn("[chatbot] question log skipped:", error.message);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const preview = body?.preview === true && (await isAdminRequest());

  // max 30 AI calls per IP per 10 minutes (admin preview is exempt)
  if (!preview) {
    const rl = rateLimit(`chat:${clientIp(req)}`, 30, 10 * 60 * 1000);
    if (!rl.ok) return NextResponse.json({ error: "too many requests" }, { status: 429 });
  }

  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 40) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (!aiConfigured()) return NextResponse.json({ error: "ai not configured" }, { status: 503 });
  if (!preview && !(await chatbotAllowed())) return NextResponse.json({ error: "paused" }, { status: 503 });

  const history: ChatTurn[] = messages
    .slice(-12)
    .map((m: { role?: string; content?: unknown }) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      content: String(m.content ?? "").slice(0, 1000),
    }))
    .filter((m) => m.content.trim());
  const question = [...history].reverse().find((m) => m.role === "user")?.content ?? "";
  if (!question) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const page = String(body?.page ?? "").slice(0, 200);
  const { aiInstructions, rules } = await loadChatbotConfig();

  try {
    const out = await runAssistant({ history, rules, extraInstructions: aiInstructions, page });
    if (!preview) {
      await logQuestion({
        question,
        reply: out.reply,
        answered: !out.unsure,
        products: out.products.map((p) => p.sku || p.name),
        page,
      });
    }
    return NextResponse.json(out);
  } catch (e) {
    console.error("[chatbot] AI call failed:", e);
    if (!preview) await logQuestion({ question, reply: "(AI error)", answered: false, products: [], page });
    return NextResponse.json({ error: "ai failed" }, { status: 500 });
  }
}
