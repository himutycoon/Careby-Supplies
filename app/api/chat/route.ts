import OpenAI from "openai";
import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/chatbot/rate-limit";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM = `You are the CareBy Supplies assistant on a Canadian building materials website.
- Reply in 1-3 short sentences. English only.
- Never invent prices, stock, or delivery times. Say the team will confirm with a quote.
- If they want pricing or to order, tell them to tap "Get a quote".
- Stay on topic (building materials, supplies, renovation). Politely decline anything else.`;

export async function POST(req: Request) {
  // max 20 AI calls per IP per 10 minutes
  const rl = rateLimit(`chat:${clientIp(req)}`, 20, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "too many requests" }, { status: 429 });
  }

  const { messages } = await req.json();
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 30) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 250,
      messages: [
        { role: "system", content: SYSTEM },
        ...messages.slice(-10).map((m: any) => ({
          role: m.role === "user" ? ("user" as const) : ("assistant" as const),
          content: String(m.content).slice(0, 1000),
        })),
      ],
    });
    return NextResponse.json({ reply: res.choices[0]?.message?.content ?? "" });
  } catch {
    return NextResponse.json({ error: "ai failed" }, { status: 500 });
  }
}