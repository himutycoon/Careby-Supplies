import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Faq } from "./config";
import { loadCategories, loadKnowledge, searchProducts, type BotProduct } from "./knowledge";
import { answerLocal, parseSynonyms, tokens } from "./local-core";

/*
 * Server side of the free answer engine (lib/chatbot/local-core.ts): feeds
 * it the live knowledge base, catalogue and synonyms. No AI calls.
 */

export type LocalReply = {
  reply: string;
  products: BotProduct[];
  startQuote: boolean;
  unsure: boolean;
  source: string;
};

let sb: SupabaseClient | null = null;
const client = () =>
  (sb ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
  }));

// Words from product names and tags, to correct typos against ("dryall").
const VOCAB_TTL = 10 * 60 * 1000;
let vocabCache: { at: number; words: Set<string> } | null = null;
async function productVocab(): Promise<Set<string>> {
  if (vocabCache && Date.now() - vocabCache.at < VOCAB_TTL) return vocabCache.words;
  const words = new Set<string>();
  for (let from = 0; from < 10000; from += 1000) {
    const { data, error } = await client()
      .from("products")
      .select("name, tags")
      .eq("is_active", true)
      .range(from, from + 999);
    if (error || !data?.length) break;
    for (const r of data as { name: string; tags: string[] | null }[]) {
      for (const w of tokens(`${r.name} ${(r.tags ?? []).join(" ")}`)) if (w.length >= 4 && !/\d/.test(w)) words.add(w);
    }
    if (data.length < 1000) break;
  }
  vocabCache = { at: Date.now(), words };
  return words;
}

export async function runLocal(opts: {
  history: { role: "user" | "assistant"; content: string }[];
  rules: Faq[];
  synonyms: string;
}): Promise<LocalReply> {
  const [entries, categories, vocab] = await Promise.all([loadKnowledge(), loadCategories(), productVocab().catch(() => new Set<string>())]);
  const seen = new Map<string, BotProduct>();
  const out = await answerLocal(opts.history, {
    entries,
    rules: opts.rules.map((r) => ({ id: r.id, keywords: r.keywords, answer: r.answer, action: r.action })),
    synonyms: parseSynonyms(opts.synonyms),
    vocab,
    categories,
    searchProducts: async (query, category) => {
      const found = await searchProducts({ query, category: category ? categories.find((c) => c.id === category)?.name : undefined, limit: 10 });
      found.forEach((p) => seen.set(p.id, p));
      return found;
    },
  });
  return {
    reply: out.reply,
    products: out.products.map((p) => seen.get(p.id)!).filter(Boolean),
    startQuote: false,
    unsure: out.unsure,
    source: out.source,
  };
}

/**
 * OpenAI is off unless CHATBOT_AI_MODE=fallback is set on the host (and
 * OPENAI_API_KEY exists): then it only answers what the free engine can't.
 */
export const aiFallbackOn = () => process.env.CHATBOT_AI_MODE === "fallback" && Boolean(process.env.OPENAI_API_KEY);
