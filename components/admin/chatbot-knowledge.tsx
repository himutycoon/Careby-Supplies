"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, HelpCircle, Loader2, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRowSkeleton } from "@/components/shared/skeleton";
import { useToast } from "@/components/shared/toast";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useAsyncData } from "@/lib/store/hooks";
import {
  deleteKnowledge,
  deleteQuestion,
  getChatQuestions,
  getKnowledge,
  previewBot,
  saveKnowledge,
  setKnowledgeEnabled,
  setQuestionResolved,
  type ChatQuestionRow,
  type KnowledgeRow,
  type PreviewReply,
} from "@/services/chatbot";

type Draft = Omit<KnowledgeRow, "updatedAt" | "id"> & { id?: string };

const BLANK: Draft = { title: "", category: "General", content: "", keywords: [], enabled: true, sortOrder: 0 };
const splitList = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
const when = (iso: string) =>
  new Date(iso).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/**
 * Knowledge base + "ask the bot" tester + question inbox. One component so
 * a question from the inbox can open the knowledge editor pre-filled.
 */
export function ChatbotKnowledgeHub() {
  const [draft, setDraft] = React.useState<Draft | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-xl">Ask the bot</h2>
        <p className="-mt-2 text-sm text-muted-foreground">
          Try a question exactly as a customer would. Uses the live knowledge and product catalogue. Not logged.
        </p>
        <BotTester />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl">Knowledge base</h2>
        <p className="-mt-2 text-sm text-muted-foreground">
          Everything the AI assistant knows about CareBy: services, packages, pricing, policies, delivery. One topic per
          entry. Products, SKUs, prices and stock are read live from{" "}
          <Link href="/admin/products" className="underline underline-offset-4">
            Products
          </Link>
          , so don&apos;t copy them here.
        </p>
        <KnowledgeTable draft={draft} setDraft={setDraft} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl">Customer questions</h2>
        <p className="-mt-2 text-sm text-muted-foreground">
          What visitors asked the AI. Where it wasn&apos;t sure, add the answer to the knowledge base and mark it done.
        </p>
        <QuestionInbox
          onTeach={(q) =>
            setDraft({ ...BLANK, title: q.question.slice(0, 80), content: "", keywords: [], sortOrder: 1000 })
          }
        />
      </section>
    </div>
  );
}

function BotTester() {
  const [q, setQ] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [out, setOut] = React.useState<PreviewReply | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    setErr(null);
    setOut(null);
    const r = await previewBot(q.trim());
    setBusy(false);
    if (r.ok) setOut(r.data);
    else setErr(r.error);
  }

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <form onSubmit={ask} className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder='e.g. "do you have 1/2 inch drywall and what does it cost?"'
          maxLength={500}
        />
        <Button type="submit" disabled={busy || !q.trim()}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Ask
        </Button>
      </form>
      {err ? <p className="mt-3 text-sm text-destructive">{err}</p> : null}
      {out ? (
        <div className="mt-3 flex flex-col gap-2 text-sm">
          <p className="whitespace-pre-wrap rounded-lg bg-muted px-3 py-2">{out.reply}</p>
          <div className="flex flex-wrap gap-1.5">
            {out.unsure ? <Badge variant="destructive">Not sure — add knowledge</Badge> : null}
            {out.startQuote ? <Badge variant="secondary">Opens quote form</Badge> : null}
            {out.products.map((p) => (
              <Badge key={p.id} variant="outline">
                {p.name}
                {p.sku ? ` · ${p.sku}` : ""} · ${p.price.toFixed(2)}/{p.unit}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function KnowledgeTable({
  draft,
  setDraft,
}: {
  draft: Draft | null;
  setDraft: (d: Draft | null) => void;
}) {
  const { toast } = useToast();
  const { data, loading, error, reload } = useAsyncData(getKnowledge);
  const entries = React.useMemo(() => data ?? [], [data]);
  const [query, setQuery] = React.useState("");
  const [cat, setCat] = React.useState("All");
  const [keywordsText, setKeywordsText] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<KnowledgeRow | null>(null);
  const [deletePending, setDeletePending] = React.useState(false);

  const categories = React.useMemo(() => [...new Set(entries.map((e) => e.category))].sort(), [entries]);
  const totalChars = entries.filter((e) => e.enabled).reduce((n, e) => n + e.content.length, 0);

  // a draft opened from the question inbox
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (draft) setKeywordsText(draft.keywords.join(", "));
  }, [draft]);

  const shown = entries.filter((e) => {
    if (cat !== "All" && e.category !== cat) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      e.title.toLowerCase().includes(q) ||
      e.content.toLowerCase().includes(q) ||
      e.keywords.some((k) => k.includes(q))
    );
  });

  function openNew() {
    setDraft({ ...BLANK, sortOrder: (entries.at(-1)?.sortOrder ?? 0) + 10 });
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);
    const r = await saveKnowledge({ ...draft, keywords: splitList(keywordsText) });
    setSaving(false);
    if (!r.ok) return toast(r.error, "error");
    toast(draft.id ? "Knowledge updated. Live within a minute." : "Knowledge added. Live within a minute.");
    setDraft(null);
    reload();
  }

  async function toggle(e: KnowledgeRow) {
    setPendingId(e.id);
    const r = await setKnowledgeEnabled(e.id, !e.enabled);
    setPendingId(null);
    if (r.ok) reload();
    else toast(r.error, "error");
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletePending(true);
    const r = await deleteKnowledge(deleting.id);
    setDeletePending(false);
    setDeleting(null);
    if (r.ok) {
      toast("Entry deleted");
      reload();
    } else toast(r.error, "error");
  }

  if (loading)
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    );
  if (error)
    return (
      <EmptyState
        icon="AlertTriangle"
        title="Couldn't load the knowledge base"
        description={error}
        action={<Button onClick={reload}>Try again</Button>}
      />
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <Input placeholder="Search knowledge" value={query} onChange={(e) => setQuery(e.target.value)} className="sm:max-w-xs" />
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            aria-label="Filter by category"
          >
            <option>All</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <Button className="press w-full sm:w-auto" onClick={openNew}>
          <Plus className="size-4" /> New entry
        </Button>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        {entries.filter((e) => e.enabled).length} active entries · {totalChars.toLocaleString()} characters
        {totalChars > 14000 ? " · large base: the bot picks the most relevant entries per question" : ""}
      </p>

      {entries.length === 0 ? (
        <EmptyState
          icon="MessageSquare"
          title="No knowledge yet"
          description="Add what the bot should know: services, delivery, policies, how ordering works."
          action={<Button onClick={openNew}>New entry</Button>}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((e) => (
            <li key={e.id} className="flex items-start gap-2.5 rounded-xl border border-border bg-background p-3 sm:p-4">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
                  <span>{e.title}</span>
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                    {e.category}
                  </Badge>
                  {!e.enabled ? (
                    <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                      Off
                    </Badge>
                  ) : null}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{e.content}</p>
              </div>
              <Button
                size="icon-sm"
                variant="outline"
                className="press shrink-0"
                aria-label={`Edit ${e.title}`}
                onClick={() => setDraft(e)}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                size="sm"
                variant={e.enabled ? "outline" : "default"}
                className="press shrink-0"
                disabled={pendingId === e.id}
                onClick={() => toggle(e)}
              >
                {e.enabled ? "Turn off" : "Turn on"}
              </Button>
              <Button
                size="icon-sm"
                variant="destructive"
                className="press shrink-0"
                aria-label={`Delete ${e.title}`}
                onClick={() => setDeleting(e)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={draft !== null} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit knowledge" : "New knowledge"}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <form id="kb-form" onSubmit={submit} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="kb-title">Topic</Label>
                  <Input
                    id="kb-title"
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    placeholder="Delivery fees"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="kb-cat">Category</Label>
                  <Input
                    id="kb-cat"
                    list="kb-cats"
                    value={draft.category}
                    onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                    placeholder="Delivery"
                  />
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
                  placeholder={
                    "Write plain facts, as you'd explain them to a new staff member. e.g.\nDelivery is free over $500 within Mississauga. Under $500 it's $49. Same-day if ordered before 11am, Mon-Sat. Link: /contact"
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Include page links like /pricing and the bot can link to them. {draft.content.length}/6000
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="kb-kw">Keywords (optional)</Label>
                <Input
                  id="kb-kw"
                  value={keywordsText}
                  onChange={(e) => setKeywordsText(e.target.value)}
                  placeholder="delivery fee, shipping cost"
                />
                <p className="text-xs text-muted-foreground">Helps the bot find this entry once the knowledge base gets large.</p>
              </div>
              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.enabled}
                    onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
                    className="size-4 accent-primary"
                  />
                  <span>Bot uses this entry</span>
                </label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="kb-order" className="text-xs text-muted-foreground">
                    Position
                  </Label>
                  <Input
                    id="kb-order"
                    type="number"
                    inputMode="numeric"
                    className="w-24"
                    value={draft.sortOrder}
                    onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })}
                  />
                </div>
              </div>
            </form>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="kb-form" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : draft?.id ? "Save changes" : "Add entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete "${deleting?.title ?? ""}"?`}
        description="The bot forgets this. To pause it instead, turn it off."
        pending={deletePending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function QuestionInbox({ onTeach }: { onTeach: (q: ChatQuestionRow) => void }) {
  const { toast } = useToast();
  const { data, loading, error, reload } = useAsyncData(getChatQuestions);
  const [filter, setFilter] = React.useState<"unsure" | "open" | "all">("unsure");
  const rows = data ?? [];
  const shown = rows.filter((q) =>
    filter === "all" ? true : filter === "open" ? !q.resolved : !q.answered && !q.resolved,
  );

  async function resolve(q: ChatQuestionRow) {
    const r = await setQuestionResolved(q.id, !q.resolved);
    if (r.ok) reload();
    else toast(r.error, "error");
  }
  async function remove(q: ChatQuestionRow) {
    const r = await deleteQuestion(q.id);
    if (r.ok) reload();
    else toast(r.error, "error");
  }

  if (loading) return <ListRowSkeleton />;
  if (error) return <p className="text-sm text-destructive">{error}</p>;

  const unsureCount = rows.filter((q) => !q.answered && !q.resolved).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["unsure", `Needs an answer (${unsureCount})`],
            ["open", "Not done"],
            ["all", `All (${rows.length})`],
          ] as const
        ).map(([k, label]) => (
          <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)}>
            {label}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={reload}>
          Refresh
        </Button>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {filter === "unsure" ? "Nothing waiting. The bot answered everything it was asked." : "No questions yet."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((q) => (
            <li key={q.id} className="rounded-xl border border-border bg-background p-3 text-sm">
              <div className="flex items-start gap-2">
                {q.answered ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                ) : (
                  <HelpCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{q.question}</p>
                  <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-muted-foreground">{q.reply}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {when(q.createdAt)}
                    {q.page ? ` · on ${q.page}` : ""}
                    {q.productsShown.length ? ` · showed ${q.productsShown.join(", ")}` : ""}
                    {q.resolved ? " · done" : ""}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => onTeach(q)}>
                  <Plus className="size-3.5" /> Add to knowledge
                </Button>
                <Button size="sm" variant="outline" onClick={() => resolve(q)}>
                  {q.resolved ? "Reopen" : "Mark done"}
                </Button>
                <Button size="icon-sm" variant="ghost" aria-label="Delete question" onClick={() => remove(q)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
