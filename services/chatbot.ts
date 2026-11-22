import { createClient } from "@/lib/supabase/client";
import { fail, ok, toUserMessage, type ServiceResult } from "@/services/client";

/**
 * Admin reads/writes for the chat widget. Authorised by the is_admin()
 * RLS policies in supabase/schema-28-chatbot-rules.sql.
 */

export interface ChatRuleRow {
  id: string;
  keywords: string[];
  answer: string;
  chips: string[];
  linkLabel: string;
  linkHref: string;
  startsQuote: boolean;
  enabled: boolean;
  sortOrder: number;
}

export interface ChatSettings {
  greeting: string;
  welcomeChips: string[];
  whatsapp: string;
  aiInstructions: string;
}

export async function getChatRules(): Promise<ChatRuleRow[]> {
  const { data, error } = await createClient()
    .from("chatbot_rules")
    .select("id, keywords, answer, chips, link_label, link_href, action, enabled, sort_order")
    .order("sort_order");
  if (error) {
    console.error("[getChatRules]", error);
    throw new Error(toUserMessage(error, "Couldn't load chatbot rules. Has schema-28 been run?"));
  }
  return (data ?? []).map((r) => ({
    id: r.id as string,
    keywords: (r.keywords as string[]) ?? [],
    answer: r.answer as string,
    chips: (r.chips as string[]) ?? [],
    linkLabel: (r.link_label as string) ?? "",
    linkHref: (r.link_href as string) ?? "",
    startsQuote: r.action === "quote",
    enabled: Boolean(r.enabled),
    sortOrder: Number(r.sort_order ?? 0),
  }));
}

const list = (v: string[]) => v.map((s) => s.trim()).filter(Boolean);

export async function upsertChatRule(input: ChatRuleRow): Promise<ServiceResult<null>> {
  if (!input.id.trim()) return fail("An ID is required.");
  if (!input.answer.trim()) return fail("Write the answer the bot should give.");
  if (list(input.keywords).length === 0) return fail("Add at least one keyword.");
  const href = input.linkHref.trim();
  if (href && !href.startsWith("/") && !/^https?:\/\//.test(href)) {
    return fail("Link must start with / (a page on this site) or https://");
  }

  const { error } = await createClient().from("chatbot_rules").upsert({
    id: input.id.trim(),
    keywords: list(input.keywords).map((k) => k.toLowerCase()),
    answer: input.answer.trim(),
    chips: list(input.chips),
    link_label: input.linkLabel.trim() || null,
    link_href: href || null,
    action: input.startsQuote ? "quote" : null,
    enabled: input.enabled,
    sort_order: input.sortOrder,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error("[upsertChatRule]", error);
    return fail(toUserMessage(error, "We couldn't save that rule."));
  }
  return ok(null);
}

export async function setChatRuleEnabled(id: string, enabled: boolean): Promise<ServiceResult<null>> {
  const { error } = await createClient()
    .from("chatbot_rules")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return fail(toUserMessage(error, "We couldn't update that rule."));
  return ok(null);
}

export async function deleteChatRule(id: string): Promise<ServiceResult<null>> {
  const { error } = await createClient().from("chatbot_rules").delete().eq("id", id);
  if (error) return fail(toUserMessage(error, "We couldn't delete that rule."));
  return ok(null);
}

export async function getChatSettings(): Promise<ChatSettings> {
  const { data, error } = await createClient()
    .from("chatbot_settings")
    .select("greeting, welcome_chips, whatsapp, ai_instructions")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(toUserMessage(error, "Couldn't load chatbot settings."));
  return {
    greeting: data?.greeting ?? "",
    welcomeChips: data?.welcome_chips ?? [],
    whatsapp: data?.whatsapp ?? "",
    aiInstructions: data?.ai_instructions ?? "",
  };
}

export async function saveChatSettings(s: ChatSettings): Promise<ServiceResult<null>> {
  if (!s.greeting.trim()) return fail("The greeting can't be empty.");
  const whatsapp = s.whatsapp.replace(/\D/g, "");
  if (whatsapp && whatsapp.length < 10) return fail("WhatsApp number needs the country code, e.g. 14165551234.");

  const { error } = await createClient()
    .from("chatbot_settings")
    .update({
      greeting: s.greeting.trim(),
      welcome_chips: list(s.welcomeChips),
      whatsapp,
      ai_instructions: s.aiInstructions.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return fail(toUserMessage(error, "We couldn't save the settings."));
  return ok(null);
}
