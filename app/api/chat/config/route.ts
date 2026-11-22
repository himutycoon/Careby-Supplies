import { NextResponse } from "next/server";
import { loadChatbotConfig } from "@/lib/chatbot/load";
import { chatbotAllowed } from "@/lib/chatbot/billing";

export const dynamic = "force-dynamic";

// Public: the chat widget fetches this on every page load. A short CDN
// cache keeps it cheap; admin edits show up within about 30 seconds.
export async function GET() {
  const [config, enabled] = await Promise.all([loadChatbotConfig(), chatbotAllowed()]);
  // aiInstructions stay server-side; the browser never needs them.
  const { aiInstructions: _omit, ...publicConfig } = config;
  void _omit;
  return NextResponse.json(
    { enabled, ...publicConfig },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" } },
  );
}
