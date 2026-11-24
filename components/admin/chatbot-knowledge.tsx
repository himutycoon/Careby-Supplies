"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown, HelpCircle, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRowSkeleton } from "@/components/shared/skeleton";
import { useToast } from "@/components/shared/toast";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useAsyncData } from "@/lib/store/hooks";
import { cn } from "@/lib/utils";
import {
  deleteKnowledge,
  deleteQuestion,
  getChatQuestions,
  getKnowledge,
  saveKnowledge,
  setKnowledgeEnabled,
  setQuestionResolved,
  type ChatQuestionRow,
  type KnowledgeRow,
} from "@/services/chatbot";

type Draft = Omit<KnowledgeRow, "updatedAt" | "id"> & { id?: string };

const BLANK: Draft = { title: "", category: "General", content: "", keywords: [], enabled: true, sortOrder: 0 };
const splitList = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
const when = (iso: string) =>
  new Date(iso).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function ago(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (d < 1) return "today";
  if (d < 2) return "yesterday";
  if (d < 30) return `${Math.floor(d)} days ago`;
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

/** Section card shared by the dashboard blocks on this page. */
export function Panel({
  id,
  title,
  description,
  action,
  children,
}: {
  id?: string;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 rounded-xl border border-border bg-background shadow-xs">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="font-sans text-base font-semibold tracking-tight">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

/** A small on/off switch (no new dependency). */
function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange: () => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
        checked ? "bg-primary" : "bg-muted-foreground/30",
      )}
    >
      <span className={cn("inline-block size-4 rounded-full bg-white shadow transition-transform", checked ? "translate-x-4.5" : "translate-x-0.5")} />
    </button>
  );
}

/**
 * Knowledge base + question inbox. One component so a question from the
 * inbox can open the knowledge editor pre-filled.
 */
export function ChatbotKnowledgeHub() {
  const [draft, setDraft] = React.useState<Draft | null>(null);

  return (
    <>
      <KnowledgeTable draft={draft} setDraft={setDraft} />
      <Panel
        id="inbox"
        title="Customer questions"
        description="What visitors asked the AI. Where it wasn't sure, add the answer to the knowledge base and mark it done."
      >
        <QuestionInbox
          onTeach={(q) => setDraft({ ...BLANK, title: q.question.slice(0, 80), content: "", keywords: [], sortOrder: 1000 })}
        />
      </Panel>
    </>
  );
}

function KnowledgeTable({ draft, setDraft }: { draft: Draft | null; setDraft: (d: Draft | null) => void }) {
  const { toast } = useToast();
  const { data, loading, error, reload } = useAsyncData(getKnowledge);
  const entries = React.useMemo(() => data ?? [], [data]);
  const [query, setQuery] = React.useState("");
  const [keywordsText, setKeywordsText] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<KnowledgeRow | null>(null);
  const [deletePending, setDeletePending] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});

  const categories = React.useMemo(() => [...new Set(entries.map((e) => e.category))].sort(), [entries]);
  const active = entries.filter((e) => e.enabled).length;

  // a draft opened from the question inbox
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (draft) setKeywordsText(draft.keywords.join(", "));
  }, [draft]);

  const q = query.trim().toLowerCase();
  const shown = entries.filter(
    (e) =>
      !q ||
      e.title.toLowerCase().includes(q) ||
      e.content.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.keywords.some((k) => k.includes(q)),
  );
  const groups = categories
    .map((c) => ({ category: c, items: shown.filter((e) => e.category === c) }))
    .filter((g) => g.items.length);

  function openNew(category = "General") {
    setDraft({ ...BLANK, category, sortOrder: (entries.at(-1)?.sortOrder ?? 0) + 10 });
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

  let body: React.ReactNode;
  if (loading) {
    body = (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    );
  } else if (error) {
    body = <EmptyState icon="AlertTriangle" title="Couldn't load the knowledge base" description={error} action={<Button onClick={reload}>Try again</Button>} />;
  } else if (!entries.length) {
    body = (
      <EmptyState
        icon="MessageSquare"
        title="No knowledge yet"
        description="Add what the bot should know: services, delivery, policies, how ordering works."
        action={<Button onClick={() => openNew()}>New entry</Button>}
      />
    );
  } else {
    body = (
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder={`Search ${entries.length} entries…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            aria-label="Search knowledge"
          />
        </div>

        {groups.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nothing matches &ldquo;{query}&rdquo;.
          </p>
        ) : (
          groups.map((g) => {
            const isOpen = q ? true : !collapsed[g.category];
            return (
              <div key={g.category} className="overflow-hidden rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setCollapsed((c) => ({ ...c, [g.category]: isOpen }))}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 bg-muted/40 px-4 py-2.5 text-left text-sm font-semibold transition hover:bg-muted/70"
                >
                  <span className="flex items-center gap-2">
                    {g.category}
                    <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-border">
                      {g.items.length}
                    </span>
                  </span>
                  <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", isOpen ? "rotate-180" : "")} aria-hidden="true" />
                </button>
                {isOpen ? (
                  <ul className="divide-y divide-border">
                    {g.items.map((e) => (
                      <li key={e.id} className={cn("group flex items-start gap-3 px-4 py-3 transition hover:bg-muted/30", !e.enabled && "opacity-60")}>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{e.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{e.content}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Updated {ago(e.updatedAt)}
                            {e.keywords.length ? ` · ${e.keywords.length} keywords` : ""}
                            {!e.enabled ? " · off" : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Switch checked={e.enabled} disabled={pendingId === e.id} onChange={() => toggle(e)} label={`${e.enabled ? "Turn off" : "Turn on"} ${e.title}`} />
                          <Button size="icon-sm" variant="ghost" aria-label={`Edit ${e.title}`} onClick={() => setDraft(e)}>
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button size="icon-sm" variant="ghost" className="text-destructive hover:text-destructive" aria-label={`Delete ${e.title}`} onClick={() => setDeleting(e)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    );
  }

  return (
    <Panel
      id="knowledge"
      title="Knowledge base"
      description={
        <>
          {entries.length ? `${active} of ${entries.length} entries active. ` : ""}Services, pricing, policies and delivery. Products, SKUs and stock come live from{" "}
          <Link href="/admin/products" className="underline underline-offset-4">
            Products
          </Link>
          .
        </>
      }
      action={
        <Button size="sm" onClick={() => openNew()}>
          <Plus className="size-4" /> New entry
        </Button>
      }
    >
      {body}

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
              <div className="flex items-center justify-between gap-4">
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
    </Panel>
  );
}

function QuestionInbox({ onTeach }: { onTeach: (q: ChatQuestionRow) => void }) {
  const { toast } = useToast();
  const { data, loading, error, reload } = useAsyncData(getChatQuestions);
  const [filter, setFilter] = React.useState<"unsure" | "open" | "all">("unsure");
  const rows = data ?? [];
  const shown = rows.filter((q) => (filter === "all" ? true : filter === "open" ? !q.resolved : !q.answered && !q.resolved));

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
      <div className="flex flex-wrap items-center gap-1 rounded-lg bg-muted/60 p-1 sm:w-fit">
        {(
          [
            ["unsure", `Needs an answer · ${unsureCount}`],
            ["open", "Not done"],
            ["all", `All · ${rows.length}`],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition",
              filter === k ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
        <button type="button" onClick={reload} className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          Refresh
        </button>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {filter === "unsure" ? "Nothing waiting. The bot answered everything it was asked." : "No questions yet."}
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {shown.map((q) => (
            <li key={q.id} className="flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-start">
              <div className="flex min-w-0 flex-1 items-start gap-2.5">
                {q.answered ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-label="Answered" />
                ) : (
                  <HelpCircle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-label="Needs an answer" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{q.question}</p>
                  <p className="mt-0.5 line-clamp-2 whitespace-pre-wrap text-muted-foreground">{q.reply}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {when(q.createdAt)}
                    {q.page ? ` · on ${q.page}` : ""}
                    {q.productsShown.length ? ` · showed ${q.productsShown.join(", ")}` : ""}
                    {q.resolved ? " · done" : ""}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-1.5 pl-6 sm:pl-0">
                <Button size="sm" variant="outline" onClick={() => onTeach(q)}>
                  <Plus className="size-3.5" /> Teach the bot
                </Button>
                <Button size="sm" variant="ghost" onClick={() => resolve(q)}>
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
