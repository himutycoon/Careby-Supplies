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
  const sb = createClient();
  // Keep a copy in Recently deleted (schema-31) so the delete can be undone.
  const { data: row } = await sb.from("chatbot_rules").select("*").eq("id", id).maybeSingle();
  if (row) await toTrash("rule", id, row);
  const { error } = await sb.from("chatbot_rules").delete().eq("id", id);
  if (error) return fail(toUserMessage(error, "We couldn't delete that rule."));
  return ok(null);
}

/** Quick-answer uses on the website since a date, by rule id (schema-31). */
export async function getRuleHits(days = 30): Promise<Record<string, number>> {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await createClient().from("chatbot_rule_hits").select("rule_id").gte("created_at", since).limit(20000);
  if (error) return {}; // table not created yet: no counts, nothing breaks
  const out: Record<string, number> = {};
  for (const r of data ?? []) out[r.rule_id as string] = (out[r.rule_id as string] ?? 0) + 1;
  return out;
}

// ---------------------------------------------------------------------------
// Recently deleted (schema-31)
// ---------------------------------------------------------------------------

export interface TrashRow {
  id: string;
  kind: "rule" | "knowledge";
  label: string;
  data: Record<string, unknown>;
  deletedAt: string;
}

async function toTrash(kind: "rule" | "knowledge", label: string, data: Record<string, unknown>) {
  const { error } = await createClient().from("chatbot_trash").insert({ kind, label, data });
  // Missing table must not block the delete itself.
  if (error) console.warn("[chatbot trash] not kept:", error.message);
}

export async function getTrash(): Promise<TrashRow[]> {
  const { data, error } = await createClient()
    .from("chatbot_trash")
    .select("id, kind, label, data, deleted_at")
    .order("deleted_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(toUserMessage(error, "Couldn't load recently deleted items. Has schema-31 been run?"));
  return (data ?? []).map((r) => ({
    id: r.id as string,
    kind: r.kind as "rule" | "knowledge",
    label: r.label as string,
    data: r.data as Record<string, unknown>,
    deletedAt: r.deleted_at as string,
  }));
}

export async function restoreTrash(item: TrashRow): Promise<ServiceResult<null>> {
  const sb = createClient();
  const { id: _old, updated_at: _u, created_at: _c, ...row } = item.data as Record<string, unknown>;
  void _u;
  void _c;
  // Rules keep their id (it is the name); knowledge gets a fresh one.
  const { error } =
    item.kind === "rule"
      ? await sb.from("chatbot_rules").upsert({ ...row, id: _old, updated_at: new Date().toISOString() })
      : await sb.from("chatbot_knowledge").insert({ ...row, updated_at: new Date().toISOString() });
  if (error) return fail(toUserMessage(error, "We couldn't restore that."));
  await sb.from("chatbot_trash").delete().eq("id", item.id);
  return ok(null);
}

export async function purgeTrash(id: string): Promise<ServiceResult<null>> {
  const { error } = await createClient().from("chatbot_trash").delete().eq("id", id);
  if (error) return fail(toUserMessage(error, "We couldn't remove that."));
  return ok(null);
}

// ---------------------------------------------------------------------------
// Quote requests from the chat (chat_leads; status/note from schema-31)
// ---------------------------------------------------------------------------

export const LEAD_STATUSES = ["new", "contacted", "won", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface LeadRow {
  id: string;
  name: string;
  contact: string;
  items: string;
  city: string;
  page: string;
  status: LeadStatus;
  note: string;
  createdAt: string;
}

export async function getLeads(): Promise<LeadRow[]> {
  const { data, error } = await createClient().from("chat_leads").select("*").order("created_at", { ascending: false }).limit(500);
  if (error) throw new Error(toUserMessage(error, "Couldn't load quote requests. Has schema-31 been run?"));
  return (data ?? []).map((r) => ({
    id: r.id as string,
    name: (r.name as string) ?? "",
    contact: (r.contact as string) ?? "",
    items: (r.items as string) ?? "",
    city: (r.city as string) ?? "",
    page: (r.page as string) ?? "",
    status: (LEAD_STATUSES as readonly string[]).includes(r.status as string) ? (r.status as LeadStatus) : "new",
    note: (r.note as string) ?? "",
    createdAt: r.created_at as string,
  }));
}

export async function updateLead(id: string, patch: { status?: LeadStatus; note?: string }): Promise<ServiceResult<null>> {
  const { error } = await createClient().from("chat_leads").update(patch).eq("id", id);
  if (error) return fail(toUserMessage(error, "We couldn't update that quote request."));
  return ok(null);
}

export async function deleteLead(id: string): Promise<ServiceResult<null>> {
  const { error } = await createClient().from("chat_leads").delete().eq("id", id);
  if (error) return fail(toUserMessage(error, "We couldn't delete that quote request."));
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

// ---------------------------------------------------------------------------
// Knowledge base (schema-29). What the AI assistant knows beyond the rules.
// Products and SKUs aren't stored here: the bot searches the live catalogue.
// ---------------------------------------------------------------------------

export interface KnowledgeRow {
  id: string;
  title: string;
  category: string;
  content: string;
  keywords: string[];
  enabled: boolean;
  sortOrder: number;
  updatedAt: string;
}

const NEED_29 = "Couldn't load the knowledge base. Has schema-29-chatbot-knowledge.sql been run?";

export async function getKnowledge(): Promise<KnowledgeRow[]> {
  const { data, error } = await createClient()
    .from("chatbot_knowledge")
    .select("id, title, category, content, keywords, enabled, sort_order, updated_at")
    .order("sort_order");
  if (error) {
    console.error("[getKnowledge]", error);
    throw new Error(toUserMessage(error, NEED_29));
  }
  return (data ?? []).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    category: (r.category as string) || "General",
    content: r.content as string,
    keywords: (r.keywords as string[]) ?? [],
    enabled: Boolean(r.enabled),
    sortOrder: Number(r.sort_order ?? 0),
    updatedAt: r.updated_at as string,
  }));
}

export async function saveKnowledge(input: Omit<KnowledgeRow, "updatedAt" | "id"> & { id?: string }): Promise<ServiceResult<null>> {
  const title = input.title.trim();
  const content = input.content.trim();
  if (!title) return fail("Give the entry a title.");
  if (!content) return fail("Write what the bot should know.");
  if (content.length > 6000) return fail("Keep one entry under 6,000 characters; split it into topics.");

  const row = {
    title,
    category: input.category.trim() || "General",
    content,
    keywords: list(input.keywords).map((k) => k.toLowerCase()),
    enabled: input.enabled,
    sort_order: input.sortOrder,
    updated_at: new Date().toISOString(),
  };
  const sb = createClient();
  const { error } = input.id
    ? await sb.from("chatbot_knowledge").update(row).eq("id", input.id)
    : await sb.from("chatbot_knowledge").insert(row);
  if (error) {
    console.error("[saveKnowledge]", error);
    return fail(toUserMessage(error, "We couldn't save that entry."));
  }
  return ok(null);
}

export async function setKnowledgeEnabled(id: string, enabled: boolean): Promise<ServiceResult<null>> {
  const { error } = await createClient()
    .from("chatbot_knowledge")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return fail(toUserMessage(error, "We couldn't update that entry."));
  return ok(null);
}

export async function deleteKnowledge(id: string): Promise<ServiceResult<null>> {
  const sb = createClient();
  const { data: row } = await sb.from("chatbot_knowledge").select("*").eq("id", id).maybeSingle();
  if (row) await toTrash("knowledge", (row.title as string) || "Untitled", row);
  const { error } = await sb.from("chatbot_knowledge").delete().eq("id", id);
  if (error) return fail(toUserMessage(error, "We couldn't delete that entry."));
  return ok(null);
}

// ---------------------------------------------------------------------------
// Question log: what visitors asked the AI.
// ---------------------------------------------------------------------------

export interface ChatQuestionRow {
  id: string;
  question: string;
  reply: string;
  answered: boolean;
  productsShown: string[];
  page: string;
  resolved: boolean;
  createdAt: string;
}

export async function getChatQuestions(): Promise<ChatQuestionRow[]> {
  const { data, error } = await createClient()
    .from("chatbot_questions")
    .select("id, question, reply, answered, products_shown, page, resolved, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("[getChatQuestions]", error);
    throw new Error(toUserMessage(error, NEED_29));
  }
  return (data ?? []).map((r) => ({
    id: r.id as string,
    question: r.question as string,
    reply: r.reply as string,
    answered: Boolean(r.answered),
    productsShown: (r.products_shown as string[]) ?? [],
    page: (r.page as string) ?? "",
    resolved: Boolean(r.resolved),
    createdAt: r.created_at as string,
  }));
}

export async function setQuestionResolved(id: string, resolved: boolean): Promise<ServiceResult<null>> {
  const { error } = await createClient().from("chatbot_questions").update({ resolved }).eq("id", id);
  if (error) return fail(toUserMessage(error, "We couldn't update that question."));
  return ok(null);
}

export async function deleteQuestion(id: string): Promise<ServiceResult<null>> {
  const { error } = await createClient().from("chatbot_questions").delete().eq("id", id);
  if (error) return fail(toUserMessage(error, "We couldn't delete that question."));
  return ok(null);
}

export type PreviewReply = {
  reply: string;
  products: { id: string; name: string; sku: string | null; price: number; unit: string; stock: string; url: string }[];
  startQuote: boolean;
  unsure: boolean;
};

export type PreviewTurn = { role: "user" | "assistant"; content: string };

/**
 * Ask the live AI as an admin: same knowledge and catalogue, not logged.
 * Pass the earlier turns so follow-up questions keep their context.
 */
export async function previewBot(
  question: string,
  history: PreviewTurn[] = [],
): Promise<ServiceResult<PreviewReply>> {
  try {
    const messages = [...history.slice(-10), { role: "user" as const, content: question }];
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preview: true, messages, page: "/admin/chatbot" }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 503 && data.error === "ai not configured") return fail("OPENAI_API_KEY isn't set, so only the rules can answer.");
    if (!res.ok || !data.reply) return fail("The AI didn't answer. Try again in a moment.");
    return ok(data as PreviewReply);
  } catch {
    return fail("The AI didn't answer. Try again in a moment.");
  }
}
