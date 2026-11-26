"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown, HelpCircle, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  setKnowledgeEnabled,
  setQuestionResolved,
  type ChatQuestionRow,
  type KnowledgeRow,
} from "@/services/chatbot";
import {
  BLANK_KNOWLEDGE as BLANK,
  KnowledgeDialog,
  notifyChatbotChanged,
  useChatbotChanged,
  type KnowledgeDraft as Draft,
} from "@/components/admin/chatbot-editors";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const TITLE_STOP = new Set(["what", "when", "where", "which", "with", "your", "about", "from", "that", "this", "have", "does", "more", "info", "information", "general"]);

/** Customer questions from the last 30 days, for the "asked about" counts. */
async function recentQuestions() {
  const since = Date.now() - 30 * 86400000;
  return (await getChatQuestions()).filter((q) => new Date(q.createdAt).getTime() >= since);
}

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

/** Customer questions the AI was asked; "Teach the bot" opens a new knowledge entry. */
export function ChatbotInbox() {
  const [draft, setDraft] = React.useState<Draft | null>(null);
  return (
    <Panel
      id="inbox"
      title="Customer questions"
      description="What visitors asked the AI. Where it wasn't sure, add the answer to the knowledge base and mark it done."
    >
      <QuestionInbox onTeach={(q) => setDraft({ ...BLANK, title: q.question.slice(0, 80), content: "", keywords: [], sortOrder: 1000 })} />
      <KnowledgeDialog draft={draft} categories={[]} onClose={() => setDraft(null)} />
    </Panel>
  );
}

/** The knowledge tab of the Library: entries grouped by category, readable in full. */
export function KnowledgeLibrary() {
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { data, loading, error, reload } = useAsyncData(getKnowledge);
  const { data: questions } = useAsyncData(recentQuestions);
  const entries = React.useMemo(() => data ?? [], [data]);
  useChatbotChanged(reload);
  const [query, setQuery] = React.useState("");
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<KnowledgeRow | null>(null);
  const [deletePending, setDeletePending] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});

  const categories = React.useMemo(() => [...new Set(entries.map((e) => e.category))].sort(), [entries]);
  // How often customers asked about each topic (the AI sees the whole
  // knowledge base, so "used" can't be measured; topic mentions can).
  const asked = React.useMemo(() => {
    if (!questions) return null;
    const recent = questions.map((q) => ` ${q.question.toLowerCase()} `);
    const out: Record<string, number> = {};
    for (const e of entries) {
      const words = [
        ...e.keywords.map((k) => k.toLowerCase()),
        ...e.title.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !TITLE_STOP.has(w)),
      ];
      out[e.id] = words.length ? recent.filter((q) => words.some((w) => q.includes(w))).length : 0;
    }
    return out;
  }, [questions, entries]);
  const active = entries.filter((e) => e.enabled).length;

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

  async function toggle(e: KnowledgeRow) {
    setPendingId(e.id);
    const r = await setKnowledgeEnabled(e.id, !e.enabled);
    setPendingId(null);
    if (r.ok) notifyChatbotChanged();
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
      notifyChatbotChanged();
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
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder={`Search ${entries.length} entries…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              aria-label="Search knowledge"
            />
          </div>
          <Button className="press w-full sm:w-auto" onClick={() => openNew()}>
            <Plus className="size-4" /> New entry
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {active} of {entries.length} entries on. Products, SKUs and stock come live from{" "}
          <Link href="/admin/products" className="underline underline-offset-4">
            Products
          </Link>
          , so they don&apos;t need entries here.
        </p>

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
                      <li key={e.id} className={cn("flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-start", !e.enabled && "opacity-60")}>
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                            {e.title}
                            {!e.enabled ? <span className="rounded bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">OFF</span> : null}
                          </p>
                          <p className={cn("mt-1 whitespace-pre-wrap text-sm text-muted-foreground", !expanded[e.id] && "line-clamp-3")}>{e.content}</p>
                          {e.content.length > 220 || e.content.split("\n").length > 3 ? (
                            <button
                              type="button"
                              onClick={() => setExpanded((x) => ({ ...x, [e.id]: !x[e.id] }))}
                              className="mt-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
                            >
                              {expanded[e.id] ? "Show less" : "Show more"}
                            </button>
                          ) : null}
                          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                            {e.keywords.length ? (
                              <>
                                <span className="font-medium">Found by:</span>
                                {e.keywords.map((k) => (
                                  <span key={k} className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-700 dark:text-emerald-300">
                                    {k}
                                  </span>
                                ))}
                                <span aria-hidden="true">·</span>
                              </>
                            ) : null}
                            {asked ? (
                              <span title="Customer questions in the last 30 days that mention this topic's keywords or title">
                                Asked about {asked[e.id] ?? 0}× · 30 days ·
                              </span>
                            ) : null}
                            <span>Updated {ago(e.updatedAt)}</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1 border-t border-border pt-2 sm:border-0 sm:pt-0">
                          <Switch checked={e.enabled} disabled={pendingId === e.id} onChange={() => toggle(e)} label={`${e.enabled ? "Turn off" : "Turn on"} ${e.title}`} />
                          <Button size="icon-sm" variant="ghost" aria-label={`Edit ${e.title}`} onClick={() => setDraft(e)}>
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button size="icon-sm" variant="ghost" className="ml-auto text-destructive hover:text-destructive sm:ml-0" aria-label={`Delete ${e.title}`} onClick={() => setDeleting(e)}>
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
    <div>
      {body}

      <KnowledgeDialog draft={draft} categories={categories} onClose={() => setDraft(null)} />

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
