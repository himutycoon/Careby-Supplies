"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/shared/toast";
import { saveKnowledge, upsertChatRule, type ChatRuleRow, type KnowledgeRow } from "@/services/chatbot";

/*
 * Editors shared by the flow canvas and the list views on Admin > Chatbot,
 * so a rule or knowledge entry is edited the same way in both. After a save
 * they announce a change, and every view on the page reloads its data.
 */

const CHANGED = "chatbot-data-changed";

export function notifyChatbotChanged() {
  window.dispatchEvent(new Event(CHANGED));
}

/** Reload when any editor on the page saves, toggles or deletes. */
export function useChatbotChanged(reload: () => void) {
  React.useEffect(() => {
    window.addEventListener(CHANGED, reload);
    return () => window.removeEventListener(CHANGED, reload);
  }, [reload]);
}

export const splitList = (s: string) => s.split(/[,;|]/).map((x) => x.trim()).filter(Boolean);
export const toId = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

export const BLANK_RULE: ChatRuleRow = {
  id: "",
  keywords: [],
  answer: "",
  chips: [],
  linkLabel: "",
  linkHref: "",
  startsQuote: false,
  enabled: true,
  sortOrder: 0,
};

/**
 * Create or edit a quick-answer rule. `rule` null = closed; a rule with an
 * empty id = new.
 */
export function RuleDialog({ rule, onClose }: { rule: ChatRuleRow | null; onClose: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = React.useState<ChatRuleRow>(BLANK_RULE);
  // comma-separated text while editing, so typing a comma isn't swallowed
  const [keywordsText, setKeywordsText] = React.useState("");
  const [chipsText, setChipsText] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const isEdit = Boolean(rule?.id);

  React.useEffect(() => {
    if (!rule) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setForm(rule);
    setKeywordsText(rule.keywords.join(", "));
    setChipsText(rule.chips.join(", "));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [rule]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const keywords = splitList(keywordsText);
    const id = isEdit ? form.id : form.id.trim() || toId(keywords[0] ?? form.answer.slice(0, 30));
    setSaving(true);
    const result = await upsertChatRule({ ...form, id, keywords, chips: splitList(chipsText) });
    setSaving(false);
    if (!result.ok) return toast(result.error, "error");
    toast(isEdit ? "Rule updated" : "Rule created");
    onClose();
    notifyChatbotChanged();
  }

  return (
    <Dialog open={rule !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit rule: ${form.id}` : "New rule"}</DialogTitle>
        </DialogHeader>

        <form id="rule-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="rule-keywords">When the customer says any of these</Label>
            <Input
              id="rule-keywords"
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              placeholder="delivery, shipping, drop off"
              required
            />
            <p className="text-xs text-muted-foreground">Comma-separated. Multi-word phrases like &quot;drop off&quot; are allowed.</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="rule-answer">The bot replies</Label>
            <Textarea
              id="rule-answer"
              rows={4}
              value={form.answer}
              onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="rule-chips">Quick-reply buttons (optional)</Label>
            <Input id="rule-chips" value={chipsText} onChange={(e) => setChipsText(e.target.value)} placeholder="Get a quote, Talk to expert" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="rule-link-label">Link button text (optional)</Label>
              <Input id="rule-link-label" value={form.linkLabel} onChange={(e) => setForm((f) => ({ ...f, linkLabel: e.target.value }))} placeholder="Browse products" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="rule-link-href">Link goes to</Label>
              <Input id="rule-link-href" value={form.linkHref} onChange={(e) => setForm((f) => ({ ...f, linkHref: e.target.value }))} placeholder="/products" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="rule-order">Position</Label>
            <Input
              id="rule-order"
              type="number"
              inputMode="numeric"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
            />
          </div>

          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" checked={form.startsQuote} onChange={(e) => setForm((f) => ({ ...f, startsQuote: e.target.checked }))} className="size-4 accent-primary" />
            <span>After replying, start the 4-question quote form</span>
          </label>
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} className="size-4 accent-primary" />
            <span>Rule is on</span>
          </label>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="rule-form" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : isEdit ? "Save changes" : "Create rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type KnowledgeDraft = Omit<KnowledgeRow, "updatedAt" | "id"> & { id?: string };

export const BLANK_KNOWLEDGE: KnowledgeDraft = { title: "", category: "General", content: "", keywords: [], enabled: true, sortOrder: 0 };

/** Create or edit a knowledge entry. `draft` null = closed; no id = new. */
export function KnowledgeDialog({
  draft: initial,
  categories,
  onClose,
}: {
  draft: KnowledgeDraft | null;
  categories: string[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [draft, setDraft] = React.useState<KnowledgeDraft | null>(null);
  const [keywordsText, setKeywordsText] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setDraft(initial);
    if (initial) setKeywordsText(initial.keywords.join(", "));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [initial]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);
    const r = await saveKnowledge({ ...draft, keywords: splitList(keywordsText) });
    setSaving(false);
    if (!r.ok) return toast(r.error, "error");
    toast(draft.id ? "Knowledge updated. Live within a minute." : "Knowledge added. Live within a minute.");
    onClose();
    notifyChatbotChanged();
  }

  return (
    <Dialog open={initial !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{draft?.id ? "Edit knowledge" : "New knowledge"}</DialogTitle>
        </DialogHeader>
        {draft ? (
          <form id="kb-form" onSubmit={submit} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <div className="flex flex-col gap-2">
                <Label htmlFor="kb-title">Topic</Label>
                <Input id="kb-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Delivery fees" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="kb-cat">Category</Label>
                <Input id="kb-cat" list="kb-cats" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} placeholder="Delivery" />
                <datalist id="kb-cats">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="kb-content">What the bot should know</Label>
              <Textarea
                id="kb-content"
                rows={8}
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                placeholder={"Write plain facts, as you'd explain them to a new staff member. e.g.\nDelivery is free over $500 within the GTA. Under $500 it's $79. Link: /contact"}
                required
              />
              <p className="text-xs text-muted-foreground">Include page links like /pricing and the bot can link to them. {draft.content.length}/6000</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="kb-kw">Keywords (optional)</Label>
              <Input id="kb-kw" value={keywordsText} onChange={(e) => setKeywordsText(e.target.value)} placeholder="delivery fee, shipping cost" />
              <p className="text-xs text-muted-foreground">Helps the bot find this entry once the knowledge base gets large.</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <label className="flex items-center gap-2.5 text-sm">
                <input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} className="size-4 accent-primary" />
                <span>Bot uses this entry</span>
              </label>
              <div className="flex items-center gap-2">
                <Label htmlFor="kb-order" className="text-xs text-muted-foreground">
                  Position
                </Label>
                <Input id="kb-order" type="number" inputMode="numeric" className="w-24" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })} />
              </div>
            </div>
          </form>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="kb-form" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : draft?.id ? "Save changes" : "Add entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
