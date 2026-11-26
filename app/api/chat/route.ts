import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/chatbot/rate-limit";
import { loadChatbotConfig } from "@/lib/chatbot/load";
import { chatbotAllowed } from "@/lib/chatbot/billing";
import { runAssistant, type ChatTurn } from "@/lib/chatbot/ai";
import { aiFallbackOn, runLocal } from "@/lib/chatbot/local";
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

/** Log the question for the admin inbox; returns the row id for 👍/👎 feedback. */
async function logQuestion(row: { question: string; reply: string; answered: boolean; products: string[]; page: string; source: string }) {
  if (!process.env.SUPABASE_SECRET_KEY) return null;
  const base = {
    question: row.question.slice(0, 1000),
    reply: row.reply.slice(0, 2000),
    answered: row.answered,
    products_shown: row.products,
    page: row.page.slice(0, 300),
  };
  const db = createAdminClient().from("chatbot_questions");
  let res = await db.insert({ ...base, source: row.source.slice(0, 80) }).select("id").single();
  // "source" arrives with schema-32; log without it until that's run.
  if (res.error && /source/.test(res.error.message)) res = await db.insert(base).select("id").single();
  // Table missing (schema-29 not run) must never break the chat.
  if (res.error) {
    console.warn("[chatbot] question log skipped:", res.error.message);
    return null;
  }
  return (res.data as { id: string }).id;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const preview = body?.preview === true && (await isAdminRequest());

  // max 60 questions per IP per 10 minutes (admin preview is exempt); stops abuse, answers are free
  if (!preview) {
    const rl = rateLimit(`chat:${clientIp(req)}`, 60, 10 * 60 * 1000);
    if (!rl.ok) return NextResponse.json({ error: "too many requests" }, { status: 429 });
  }

  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 40) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
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
  const { aiInstructions, rules, synonyms } = await loadChatbotConfig();

  try {
    // Free engine first: knowledge, verified answers, quick answers, catalogue.
    let out: { reply: string; products: { sku: string | null; name: string }[]; startQuote: boolean; unsure: boolean; source: string } = await runLocal({
      history,
      rules,
      synonyms,
    });
    // OpenAI only if switched on (CHATBOT_AI_MODE=fallback) and the free engine had nothing.
    if (out.unsure && aiFallbackOn()) {
      try {
        out = { ...(await runAssistant({ history, rules, extraInstructions: aiInstructions, page })), source: "ai" };
      } catch (e) {
        console.error("[chatbot] AI fallback failed:", e);
      }
    }
    const logId = preview
      ? null
      : await logQuestion({
          question,
          reply: out.reply,
          answered: !out.unsure,
          products: out.products.map((p) => p.sku || p.name),
          page,
          source: out.source,
        });
    return NextResponse.json({ ...out, logId });
  } catch (e) {
    console.error("[chatbot] answer failed:", e);
    if (!preview) await logQuestion({ question, reply: "(error)", answered: false, products: [], page, source: "error" });
    return NextResponse.json({ error: "answer failed" }, { status: 500 });
  }
}
