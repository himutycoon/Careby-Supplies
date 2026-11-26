"use client";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRowSkeleton } from "@/components/shared/skeleton";
import { useToast } from "@/components/shared/toast";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useAsyncData } from "@/lib/store/hooks";
import { cn } from "@/lib/utils";
import { answer } from "@/lib/chatbot/engine";
import type { Faq } from "@/lib/chatbot/config";
import { deleteChatRule, getChatRules, setChatRuleEnabled, type ChatRuleRow } from "@/services/chatbot";
import { BLANK_RULE, RuleDialog, notifyChatbotChanged, useChatbotChanged } from "@/components/admin/chatbot-editors";

function toFaq(r: ChatRuleRow): Faq {
  return {
    id: r.id,
    keywords: r.keywords,
    answer: r.answer,
    chips: r.chips,
    link: r.linkLabel && r.linkHref ? { label: r.linkLabel, href: r.linkHref } : undefined,
    action: r.startsQuote ? "quote" : undefined,
  };
}

export function ChatbotRulesTable() {
  const { toast } = useToast();
  const { data, loading, error, reload } = useAsyncData(getChatRules);
  const rules = React.useMemo(() => data ?? [], [data]);

  useChatbotChanged(reload);
  const [editing, setEditing] = React.useState<ChatRuleRow | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<ChatRuleRow | null>(null);
  const [deletePending, setDeletePending] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [test, setTest] = React.useState("");

  const enabledFaqs = React.useMemo(() => rules.filter((r) => r.enabled).map(toFaq), [rules]);
  const testHit = test.trim() ? answer(test, enabledFaqs) : null;

  const shown = rules.filter((r) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return r.id.includes(q) || r.answer.toLowerCase().includes(q) || r.keywords.some((k) => k.includes(q));
  });

  function openNew() {
    setEditing({ ...BLANK_RULE, sortOrder: (rules.at(-1)?.sortOrder ?? 0) + 10 });
  }

  function openEdit(rule: ChatRuleRow) {
    setEditing(rule);
  }

  async function toggle(rule: ChatRuleRow) {
    setPendingId(rule.id);
    const result = await setChatRuleEnabled(rule.id, !rule.enabled);
    setPendingId(null);
    if (result.ok) {
      toast(rule.enabled ? "Rule turned off" : "Rule turned on");
      notifyChatbotChanged();
    } else toast(result.error, "error");
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletePending(true);
    const result = await deleteChatRule(deleting.id);
    setDeletePending(false);
    setDeleting(null);
    if (result.ok) {
      toast("Rule deleted");
      notifyChatbotChanged();
    } else toast(result.error, "error");
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="AlertTriangle"
        title="Couldn't load chatbot rules"
        description={error}
        action={<Button onClick={reload}>Try again</Button>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-background p-4">
        <Label htmlFor="rule-test">Test a message</Label>
        <Input
          id="rule-test"
          className="mt-2"
          placeholder='Type what a customer might ask, e.g. "do you deliver to Brampton?"'
          value={test}
          onChange={(e) => setTest(e.target.value)}
        />
        {test.trim() ? (
          <p className="mt-2 text-sm">
            {testHit ? (
              <>
                <Badge variant="secondary" className="mr-2">{testHit.id}</Badge>
                {testHit.answer}
              </>
            ) : (
              <span className="text-muted-foreground">
                No rule matches, so the AI assistant would answer this one.
              </span>
            )}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <Input
          placeholder="Search rules"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-xs"
        />
        <Button className="press w-full sm:w-auto" onClick={openNew}>
          <Plus className="size-4" /> New rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <EmptyState
          icon="MessageSquare"
          title="No rules yet"
          description="Until you add one, the bot uses its built-in answers."
          action={<Button onClick={openNew}>New rule</Button>}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((rule) => (
            <li key={rule.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-start sm:gap-2.5 sm:p-4">
              <div className={cn("grid min-w-0 flex-1 gap-2", !rule.enabled && "opacity-60")}>
                <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
                  <span>{rule.id}</span>
                  {!rule.enabled ? <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">Off</Badge> : null}
                </p>
                <div className="grid gap-1 sm:grid-cols-[150px_1fr] sm:gap-3">
                  <p className="text-[11px] font-semibold tracking-wide text-amber-700 uppercase dark:text-amber-300">When a message mentions</p>
                  <div className="flex flex-wrap gap-1">
                    {rule.keywords.map((k) => (
                      <span key={k} className="rounded-full bg-amber-500/12 px-2 py-0.5 text-xs text-amber-800 dark:text-amber-200">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid gap-1 sm:grid-cols-[150px_1fr] sm:gap-3">
                  <p className="text-[11px] font-semibold tracking-wide text-sky-700 uppercase dark:text-sky-300">Bot replies</p>
                  <p className="text-sm whitespace-pre-wrap">{rule.answer}</p>
                </div>
                {rule.chips.length || (rule.linkLabel && rule.linkHref) || rule.startsQuote ? (
                  <div className="grid gap-1 sm:grid-cols-[150px_1fr] sm:gap-3">
                    <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Then shows</p>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      {rule.chips.map((c) => (
                        <span key={c} className="rounded-full border border-border px-2 py-0.5">
                          {c}
                        </span>
                      ))}
                      {rule.linkLabel && rule.linkHref ? (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                          {rule.linkLabel} → {rule.linkHref}
                        </span>
                      ) : null}
                      {rule.startsQuote ? (
                        <span className="rounded-full bg-orange-500/12 px-2 py-0.5 font-medium text-orange-700 dark:text-orange-300">Starts the quote form</span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2 border-t border-border pt-3 sm:border-0 sm:pt-0">
              <Button size="icon-sm" variant="outline" className="press shrink-0" aria-label={`Edit ${rule.id}`} onClick={() => openEdit(rule)}>
                <Pencil className="size-3.5" />
              </Button>
              <Button
                size="sm"
                variant={rule.enabled ? "outline" : "default"}
                className="press shrink-0"
                disabled={pendingId === rule.id}
                onClick={() => toggle(rule)}
              >
                {rule.enabled ? "Turn off" : "Turn on"}
              </Button>
              <Button size="icon-sm" variant="destructive" className="press ml-auto shrink-0 sm:ml-0" aria-label={`Delete ${rule.id}`} onClick={() => setDeleting(rule)}>
                <Trash2 className="size-3.5" />
              </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <RuleDialog rule={editing} onClose={() => setEditing(null)} />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete rule "${deleting?.id ?? ""}"?`}
        description="The bot stops giving this answer. To pause it instead, turn it off."
        pending={deletePending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
