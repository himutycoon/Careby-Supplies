"use client";

import * as React from "react";
import { Download, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/shared/toast";
import { useAsyncData } from "@/lib/store/hooks";
import { getChatRules, getKnowledge, getTrash, purgeTrash, restoreTrash, type TrashRow } from "@/services/chatbot";
import { notifyChatbotChanged, useChatbotChanged } from "@/components/admin/chatbot-editors";

/*
 * Backup and undo for the Library. The export is the same CSV format the
 * importer reads (with a "type" column), so a backup can be imported back.
 */

const COLS = ["type", "id", "category", "title", "content", "keywords", "answer", "buttons", "link_text", "link", "starts_quote", "enabled", "order"] as const;

const esc = (v: string | number | boolean) => {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

async function exportCsv() {
  const [rules, knowledge] = await Promise.all([getChatRules(), getKnowledge()]);
  const rows: Record<(typeof COLS)[number], string | number | boolean>[] = [
    ...rules.map((r) => ({
      type: "rule",
      id: r.id,
      category: "",
      title: "",
      content: "",
      keywords: r.keywords.join(", "),
      answer: r.answer,
      buttons: r.chips.join(", "),
      link_text: r.linkLabel,
      link: r.linkHref,
      starts_quote: r.startsQuote ? "yes" : "no",
      enabled: r.enabled ? "yes" : "no",
      order: r.sortOrder,
    })),
    ...knowledge.map((k) => ({
      type: "knowledge",
      id: "",
      category: k.category,
      title: k.title,
      content: k.content,
      keywords: k.keywords.join(", "),
      answer: "",
      buttons: "",
      link_text: "",
      link: "",
      starts_quote: "",
      enabled: k.enabled ? "yes" : "no",
      order: k.sortOrder,
    })),
  ];
  const csv = [COLS.join(","), ...rows.map((r) => COLS.map((c) => esc(r[c])).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" }));
  a.download = `careby-assistant-library-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  return { rules: rules.length, knowledge: knowledge.length };
}

const when = (iso: string) => new Date(iso).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function ChatbotBackup() {
  const { toast } = useToast();
  const { data, loading, error, reload } = useAsyncData(getTrash);
  useChatbotChanged(reload);
  const [exporting, setExporting] = React.useState(false);
  const [pending, setPending] = React.useState<string | null>(null);

  async function onExport() {
    setExporting(true);
    try {
      const n = await exportCsv();
      toast(`Downloaded ${n.rules} quick answers and ${n.knowledge} knowledge entries.`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Export failed", "error");
    }
    setExporting(false);
  }

  async function restore(item: TrashRow) {
    setPending(item.id);
    const r = await restoreTrash(item);
    setPending(null);
    if (!r.ok) return toast(r.error, "error");
    toast(`Restored "${item.label}"`);
    notifyChatbotChanged();
  }

  async function purge(item: TrashRow) {
    setPending(item.id);
    const r = await purgeTrash(item.id);
    setPending(null);
    if (r.ok) reload();
    else toast(r.error, "error");
  }

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div className="flex flex-col gap-2 rounded-xl border border-border p-4">
        <p className="text-sm font-semibold">Back up the library</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Downloads every quick answer and knowledge entry as one CSV. Keep it before a big import; it can be imported back as-is.
        </p>
        <Button variant="outline" className="mt-auto self-start" onClick={onExport} disabled={exporting}>
          {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Export backup (.csv)
        </Button>
      </div>

      <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-border p-4">
        <p className="text-sm font-semibold">Recently deleted</p>
        {loading && !data ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="text-xs text-muted-foreground">{error}</p>
        ) : !data?.length ? (
          <p className="text-xs text-muted-foreground">Nothing deleted. Deleted quick answers and knowledge appear here so you can bring them back.</p>
        ) : (
          <ul className="nowheel max-h-64 divide-y divide-border overflow-y-auto rounded-lg border border-border">
            {data.map((t) => (
              <li key={t.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                <span
                  className={
                    t.kind === "rule"
                      ? "shrink-0 rounded bg-amber-500/15 px-1.5 text-[10px] font-semibold text-amber-800 uppercase dark:text-amber-200"
                      : "shrink-0 rounded bg-emerald-500/15 px-1.5 text-[10px] font-semibold text-emerald-800 uppercase dark:text-emerald-200"
                  }
                >
                  {t.kind === "rule" ? "Quick answer" : "Knowledge"}
                </span>
                <span className="min-w-0 flex-1 truncate">{t.label}</span>
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{when(t.deletedAt)}</span>
                <Button size="sm" variant="outline" disabled={pending === t.id} onClick={() => restore(t)}>
                  <RotateCcw className="size-3.5" /> Restore
                </Button>
                <Button size="icon-sm" variant="ghost" aria-label={`Remove ${t.label} for good`} disabled={pending === t.id} onClick={() => purge(t)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
