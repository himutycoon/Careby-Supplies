"use client";

import * as React from "react";
import { Download, Mail, MapPin, MessageCircle, Phone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRowSkeleton } from "@/components/shared/skeleton";
import { useToast } from "@/components/shared/toast";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useAsyncData } from "@/lib/store/hooks";
import { cn } from "@/lib/utils";
import { deleteLead, getLeads, LEAD_STATUSES, updateLead, type LeadRow, type LeadStatus } from "@/services/chatbot";

/* Quote requests taken by the chat's 4-question form, tracked to a result. */

const LABEL: Record<LeadStatus, string> = { new: "New", contacted: "Contacted", won: "Won", lost: "Lost" };
const TONE: Record<LeadStatus, string> = {
  new: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  contacted: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  won: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  lost: "bg-muted text-muted-foreground",
};

const when = (iso: string) => new Date(iso).toLocaleString("en-CA", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
const isEmail = (s: string) => /^\S+@\S+\.\S+$/.test(s);
const digits = (s: string) => s.replace(/\D/g, "");
const pagePath = (url: string) => {
  try {
    return new URL(url).pathname || "/";
  } catch {
    return url;
  }
};

function exportCsv(rows: LeadRow[]) {
  const esc = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const head = ["date", "name", "contact", "city", "items", "status", "note", "page"];
  const body = rows.map((r) => [new Date(r.createdAt).toISOString(), r.name, r.contact, r.city, r.items, r.status, r.note, r.page].map(esc).join(","));
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + [head.join(","), ...body].join("\n")], { type: "text/csv" }));
  a.download = `careby-quote-requests-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function ChatbotQuotes() {
  const { toast } = useToast();
  const { data, loading, error, reload } = useAsyncData(getLeads);
  const [filter, setFilter] = React.useState<LeadStatus | "all">("all");
  const [deleting, setDeleting] = React.useState<LeadRow | null>(null);
  const [deletePending, setDeletePending] = React.useState(false);
  const [local, setLocal] = React.useState<Record<string, Partial<LeadRow>>>({});

  const rows = React.useMemo(() => (data ?? []).map((r) => ({ ...r, ...local[r.id] })), [data, local]);
  const shown = filter === "all" ? rows : rows.filter((r) => r.status === filter);
  const count = (s: LeadStatus) => rows.filter((r) => r.status === s).length;

  async function setStatus(r: LeadRow, status: LeadStatus) {
    setLocal((l) => ({ ...l, [r.id]: { ...l[r.id], status } }));
    const res = await updateLead(r.id, { status });
    if (!res.ok) {
      toast(res.error, "error");
      setLocal((l) => ({ ...l, [r.id]: { ...l[r.id], status: r.status } }));
    }
  }

  async function saveNote(r: LeadRow, note: string) {
    if (note === (data?.find((d) => d.id === r.id)?.note ?? "")) return;
    const res = await updateLead(r.id, { note });
    if (res.ok) toast("Note saved");
    else toast(res.error, "error");
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletePending(true);
    const res = await deleteLead(deleting.id);
    setDeletePending(false);
    setDeleting(null);
    if (res.ok) {
      toast("Quote request deleted");
      reload();
    } else toast(res.error, "error");
  }

  if (loading && !data) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (error) return <EmptyState icon="AlertTriangle" title="Couldn't load quote requests" description={error} action={<Button onClick={reload}>Try again</Button>} />;
  if (!rows.length) {
    return <EmptyState icon="MessageSquare" title="No quote requests yet" description="When a customer fills in the chat's quote form, it appears here and is emailed to you." />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted/60 p-1">
          {(["all", ...LEAD_STATUSES] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition",
                filter === k ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {k === "all" ? `All · ${rows.length}` : `${LABEL[k]} · ${count(k)}`}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" className="self-start" onClick={() => exportCsv(shown)}>
          <Download className="size-4" /> Export CSV
        </Button>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No {LABEL[filter as LeadStatus].toLowerCase()} quote requests.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((r) => {
            const phone = digits(r.contact);
            return (
              <li key={r.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      {r.name}
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", TONE[r.status])}>{LABEL[r.status]}</span>
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{when(r.createdAt)}</span>
                      {r.city ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3" aria-hidden="true" /> {r.city}
                        </span>
                      ) : null}
                      {r.page ? <span>from {pagePath(r.page)}</span> : null}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {isEmail(r.contact) ? (
                      <Button size="sm" variant="outline" render={<a href={`mailto:${r.contact}?subject=${encodeURIComponent("Your CareBy Supplies quote")}`} />}>
                        <Mail className="size-3.5" /> Email
                      </Button>
                    ) : phone.length >= 10 ? (
                      <>
                        <Button size="sm" variant="outline" render={<a href={`tel:+${phone.length === 10 ? "1" + phone : phone}`} />}>
                          <Phone className="size-3.5" /> Call
                        </Button>
                        <Button size="sm" variant="outline" render={<a href={`https://wa.me/${phone.length === 10 ? "1" + phone : phone}`} target="_blank" rel="noopener noreferrer" />}>
                          <MessageCircle className="size-3.5" /> WhatsApp
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-1 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                  <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Wants</p>
                  <p className="whitespace-pre-wrap">{r.items}</p>
                  <p className="text-xs text-muted-foreground">Contact: {r.contact}</p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <div className="flex shrink-0 gap-1 overflow-x-auto rounded-lg bg-muted/60 p-1">
                    {LEAD_STATUSES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={r.status === s}
                        onClick={() => setStatus(r, s)}
                        className={cn(
                          "shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition",
                          r.status === s ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {LABEL[s]}
                      </button>
                    ))}
                  </div>
                  <Textarea
                    id={`lead-note-${r.id}`}
                    rows={1}
                    defaultValue={r.note}
                    placeholder="Private note, e.g. quoted $1,240, follow up Friday"
                    className="min-h-9 flex-1 text-sm"
                    onBlur={(e) => saveNote(r, e.target.value.trim())}
                  />
                  <Button size="icon-sm" variant="ghost" className="self-end text-destructive hover:text-destructive sm:self-start" aria-label={`Delete ${r.name}'s request`} onClick={() => setDeleting(r)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name ?? ""}'s quote request?`}
        description="It's removed for good. To keep it out of the way instead, mark it Lost."
        pending={deletePending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
