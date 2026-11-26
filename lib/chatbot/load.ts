import "server-only";
import { createClient } from "@supabase/supabase-js";
import { FAQS, GREETING, WELCOME_CHIPS, WHATSAPP, type Faq } from "./config";

export type ChatbotConfig = {
  rules: Faq[];
  greeting: string;
  welcomeChips: string[];
  whatsapp: string;
  aiInstructions: string;
  /** admin synonym groups, one per line: "furnace: furnance, heater" */
  synonyms: string;
};

export const DEFAULT_CONFIG: ChatbotConfig = {
  rules: FAQS,
  greeting: GREETING,
  welcomeChips: WELCOME_CHIPS,
  whatsapp: WHATSAPP,
  aiInstructions: "",
  synonyms: "",
};

type RuleRow = {
  id: string;
  keywords: string[] | null;
  answer: string;
  chips: string[] | null;
  link_label: string | null;
  link_href: string | null;
  action: string | null;
};

export function rowToFaq(r: RuleRow): Faq {
  return {
    id: r.id,
    keywords: r.keywords ?? [],
    answer: r.answer,
    chips: r.chips?.length ? r.chips : undefined,
    link: r.link_label && r.link_href ? { label: r.link_label, href: r.link_href } : undefined,
    action: r.action === "quote" ? "quote" : undefined,
  };
}

/**
 * Reads the admin-edited rules with the public key (RLS only returns
 * enabled rules). Falls back to the built-in rules in config.ts if the
 * tables are missing, empty, or Supabase is unreachable.
 */
export async function loadChatbotConfig(): Promise<ChatbotConfig> {
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false } },
    );
    const [rules, settings] = await Promise.all([
      sb
        .from("chatbot_rules")
        .select("id, keywords, answer, chips, link_label, link_href, action")
        .eq("enabled", true)
        .order("sort_order"),
      // "*" so a column added later (synonyms, schema-32) never breaks the load
      sb.from("chatbot_settings").select("*").eq("id", 1).maybeSingle(),
    ]);

    const s = settings.data;
    return {
      rules: !rules.error && rules.data?.length ? (rules.data as RuleRow[]).map(rowToFaq) : FAQS,
      greeting: s?.greeting || GREETING,
      welcomeChips: s?.welcome_chips?.length ? s.welcome_chips : WELCOME_CHIPS,
      whatsapp: (s?.whatsapp || WHATSAPP).replace(/\D/g, ""),
      aiInstructions: s?.ai_instructions || "",
      synonyms: (s as { synonyms?: string } | null)?.synonyms || "",
    };
  } catch (e) {
    console.error("[chatbot] config load failed, using built-in rules:", e);
    return DEFAULT_CONFIG;
  }
}
