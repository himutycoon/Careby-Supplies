"use client";

import * as React from "react";
import { CheckCircle2, Download, FileUp, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/shared/toast";
import { cn } from "@/lib/utils";
import { getChatRules, getKnowledge, saveKnowledge, upsertChatRule, type ChatRuleRow } from "@/services/chatbot";
import { BLANK_KNOWLEDGE, BLANK_RULE, notifyChatbotChanged, splitList, toId, type KnowledgeDraft } from "@/components/admin/chatbot-editors";

/*
 * Bulk-add quick answers and knowledge from a file. Everything is parsed in
 * the browser and shown for review; nothing is saved until "Import". Saves go
 * through the same service calls as the editors, so the same checks apply.
 *
 *   .csv   one row per item (columns below; a "type" column can mix both)
 *   .json  [{...}] or { "rules": [...], "knowledge": [...] }
 *   .txt / .md   knowledge: "# Category", "## Topic" + text underneath
 */

type Item =
  | { key: string; kind: "rule"; rule: ChatRuleRow; update: boolean; problem: string | null }
  | { key: string; kind: "knowledge"; entry: KnowledgeDraft; update: boolean; problem: string | null };

type Raw = Record<string, string>;

const MAX_BYTES = 1_000_000;

// ── parsing ───────────────────────────────────────────────────────

/** RFC 4180 CSV: quoted fields, "" escapes, commas and newlines inside quotes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

const norm = (k: string) => k.toLowerCase().replace(/[^a-z]/g, "");

/** Column names people actually use, mapped to ours. */
const ALIASES: Record<string, string[]> = {
  type: ["type", "kind", "for"],
  id: ["id", "name", "rulename", "ruleid"],
  keywords: ["keywords", "keyword", "triggers", "trigger", "when", "whencustomersays", "tags", "words"],
  answer: ["answer", "reply", "response", "botreplies", "replytext"],
  chips: ["buttons", "chips", "quickreplies", "quickreplybuttons"],
  linkLabel: ["linklabel", "linktext", "buttontext", "linkbuttontext"],
  linkHref: ["link", "linkhref", "url", "linkgoesto", "href"],
  quote: ["quote", "startsquote", "startquote", "quoteform"],
  enabled: ["enabled", "on", "active", "status"],
  order: ["order", "position", "sortorder", "sort"],
  title: ["title", "topic", "question", "subject", "heading"],
  content: ["content", "text", "body", "details", "info", "whatthebotshouldknow", "description"],
  category: ["category", "section", "group"],
};

function pick(raw: Raw, field: string): string {
  for (const a of ALIASES[field]) {
    if (raw[a] !== undefined && raw[a] !== "") return String(raw[a]).trim();
  }
  return "";
}

const truthy = (v: string, fallback: boolean) => (v === "" ? fallback : /^(y|yes|true|1|on|active|enabled)$/i.test(v.trim()));

/** Decide what one row is, then build the record. */
function fromRaw(raw: Raw, forced?: "rule" | "knowledge"): { kind: "rule"; rule: ChatRuleRow } | { kind: "knowledge"; entry: KnowledgeDraft } {
  const t = pick(raw, "type").toLowerCase();
  let kind: "rule" | "knowledge";
  if (forced) kind = forced;
  else if (/rule|quick|faq ?rule|answer/.test(t)) kind = "rule";
  else if (/know|kb|info|fact/.test(t)) kind = "knowledge";
  // Title/topic or long content reads as knowledge; keywords + answer as a rule.
  else if (pick(raw, "title") || pick(raw, "content") || pick(raw, "category")) kind = "knowledge";
  else kind = "rule";

  if (kind === "rule") {
    const keywords = splitList(pick(raw, "keywords"));
    const id = toId(pick(raw, "id")) || toId(keywords[0] ?? pick(raw, "answer").slice(0, 30));
    return {
      kind,
      rule: {
        ...BLANK_RULE,
        id,
        keywords,
        answer: pick(raw, "answer"),
        chips: splitList(pick(raw, "chips")),
        linkLabel: pick(raw, "linkLabel"),
        linkHref: pick(raw, "linkHref"),
        startsQuote: truthy(pick(raw, "quote"), false),
        enabled: truthy(pick(raw, "enabled"), true),
        sortOrder: Number(pick(raw, "order")) || 0,
      },
    };
  }
  return {
    kind,
    entry: {
      ...BLANK_KNOWLEDGE,
      title: pick(raw, "title"),
      content: pick(raw, "content") || pick(raw, "answer"),
      category: pick(raw, "category") || "General",
      keywords: splitList(pick(raw, "keywords")),
      enabled: truthy(pick(raw, "enabled"), true),
      sortOrder: Number(pick(raw, "order")) || 0,
    },
  };
}

function rowsFromCsv(text: string): Raw[] {
  const [head, ...body] = parseCsv(text);
  if (!head) return [];
  const keys = head.map(norm);
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

function normObj(o: unknown): Raw {
  if (!o || typeof o !== "object") return {};
  return Object.fromEntries(
    Object.entries(o as Record<string, unknown>).map(([k, v]) => [norm(k), Array.isArray(v) ? v.join(", ") : v == null ? "" : String(v)]),
  );
}

function parseJson(text: string): ReturnType<typeof fromRaw>[] {
  const data = JSON.parse(text);
  if (Array.isArray(data)) return data.map((o) => fromRaw(normObj(o)));
  const out: ReturnType<typeof fromRaw>[] = [];
  for (const [k, v] of Object.entries(data ?? {})) {
    if (!Array.isArray(v)) continue;
    const forced = /rule|quick/i.test(k) ? "rule" : /know|kb/i.test(k) ? "knowledge" : undefined;
    out.push(...v.map((o) => fromRaw(normObj(o), forced)));
  }
  return out;
}

/**
 * Plain text / Markdown into knowledge entries. "# X" sets the category,
 * "## Y" (or "# Y" when there are no "##") starts an entry. Without
 * headings, each blank-line-separated block is an entry whose first line
 * is the topic.
 */
function parseText(text: string, fallbackCategory: string): ReturnType<typeof fromRaw>[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const hasH2 = lines.some((l) => /^##\s+/.test(l));
  const hasH1 = lines.some((l) => /^#\s+/.test(l));
  const out: KnowledgeDraft[] = [];

  if (hasH1 || hasH2) {
    let category = fallbackCategory;
    let cur: KnowledgeDraft | null = null;
    const flush = () => {
      if (cur && (cur.title || cur.content.trim())) out.push({ ...cur, content: cur.content.trim() });
      cur = null;
    };
    for (const line of lines) {
      const h1 = /^#\s+(.+)/.exec(line);
      const h2 = /^##+\s+(.+)/.exec(line);
      if (h2 || (h1 && !hasH2)) {
        flush();
        cur = { ...BLANK_KNOWLEDGE, category, title: (h2 ?? h1)![1].trim() };
      } else if (h1) {
        flush();
        category = h1[1].trim();
      } else if (cur) {
        cur.content += line + "\n";
      }
    }
    flush();
  } else {
    for (const block of text.split(/\n\s*\n/)) {
      const [first, ...rest] = block.trim().split("\n");
      if (!first) continue;
      const title = first.replace(/[:\-–]+\s*$/, "").trim();
      out.push({ ...BLANK_KNOWLEDGE, category: fallbackCategory, title: title.slice(0, 120), content: (rest.join("\n").trim() || first).trim() });
    }
  }
  return out.map((entry) => ({ kind: "knowledge" as const, entry }));
}

function problemOf(p: ReturnType<typeof fromRaw>): string | null {
  if (p.kind === "rule") {
    if (!p.rule.keywords.length) return "No keywords";
    if (!p.rule.answer) return "No reply";
    if (!p.rule.id) return "No name";
    const h = p.rule.linkHref;
    if (h && !h.startsWith("/") && !/^https?:\/\//.test(h)) return "Link must start with / or https://";
    return null;
  }
  if (!p.entry.title) return "No topic";
  if (!p.entry.content) return "No text";
  if (p.entry.content.length > 6000) return "Over 6,000 characters";
  return null;
}

// ── templates ─────────────────────────────────────────────────────

const TEMPLATES = {
  "quick-answers-template.csv":
    'keywords,answer,buttons,link_text,link,starts_quote,enabled\n"delivery, shipping, drop off","We deliver across Mississauga and the GTA. Free on orders over $500, otherwise $79.","Get a quote, Pickup",,,no,yes\n"hours, open, closing","We\'re open Mon-Sat, 9am-6pm.",Get a quote,,,no,yes\n',
  "knowledge-template.csv":
    'category,title,content,keywords\nDelivery,Delivery fees,"Delivery is free over $500 within the GTA. Under $500 it\'s $79. Same-day delivery is available before 11am. Link: /contact","delivery fee, shipping cost"\nPolicies,Returns,"Unopened items can be returned within 30 days with the receipt. Special orders are final sale.","return, refund, exchange"\n',
  "knowledge-template.md":
    "# Delivery\n\n## Delivery fees\nDelivery is free over $500 within the GTA. Under $500 it's $79.\n\n## Delivery areas\nMississauga, Brampton, Oakville, Toronto and the rest of the GTA.\n\n# Policies\n\n## Returns\nUnopened items can be returned within 30 days with the receipt.\n",
};

function download(name: keyof typeof TEMPLATES) {
  const blob = new Blob([TEMPLATES[name]], { type: name.endsWith(".md") ? "text/markdown" : "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ── component ─────────────────────────────────────────────────────

export function ChatbotImport() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<Item[] | null>(null);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [source, setSource] = React.useState("");
  const [paste, setPaste] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState({ done: 0, total: 0 });
  const [result, setResult] = React.useState<{ ok: number; failed: { name: string; error: string }[] } | null>(null);
  const [drag, setDrag] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function load(text: string, name: string) {
    setResult(null);
    let parsed: ReturnType<typeof fromRaw>[];
    try {
      const lower = name.toLowerCase();
      if (lower.endsWith(".json")) parsed = parseJson(text);
      else if (lower.endsWith(".csv")) parsed = rowsFromCsv(text).map((r) => fromRaw(r));
      else {
        const base = name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
        parsed = parseText(text, base && base !== "Pasted text" ? base[0].toUpperCase() + base.slice(1) : "General");
      }
    } catch (e) {
      toast(`Couldn't read ${name}: ${e instanceof Error ? e.message : "unknown format"}`, "error");
      return;
    }
    if (!parsed.length) {
      toast(`Nothing to import was found in ${name}.`, "error");
      return;
    }

    // Mark what already exists, so importing updates it instead of duplicating.
    const [rules, knowledge] = await Promise.all([getChatRules().catch(() => []), getKnowledge().catch(() => [])]);
    const ruleIds = new Set(rules.map((r) => r.id));
    const kbByKey = new Map(knowledge.map((k) => [`${k.category.toLowerCase()}|${k.title.toLowerCase()}`, k.id]));
    let ruleOrder = Math.max(0, ...rules.map((r) => r.sortOrder));
    let kbOrder = Math.max(0, ...knowledge.map((k) => k.sortOrder));

    const next: Item[] = parsed.map((p, i) => {
      const problem = problemOf(p);
      if (p.kind === "rule") {
        const rule = { ...p.rule, sortOrder: p.rule.sortOrder || (ruleOrder += 10) };
        return { key: `r${i}`, kind: "rule", rule, update: ruleIds.has(rule.id), problem };
      }
      const existing = kbByKey.get(`${p.entry.category.toLowerCase()}|${p.entry.title.toLowerCase()}`);
      const entry = { ...p.entry, id: existing, sortOrder: p.entry.sortOrder || (kbOrder += 10) };
      return { key: `k${i}`, kind: "knowledge", entry, update: Boolean(existing), problem };
    });
    setItems(next);
    setSelected(new Set(next.filter((x) => !x.problem).map((x) => x.key)));
    setSource(name);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_BYTES) return toast("That file is over 1 MB. Split it into smaller files.", "error");
    if (!/\.(csv|json|txt|md|markdown)$/i.test(file.name)) {
      return toast("Use a .csv, .json, .txt or .md file. From Word or a PDF, copy the text and paste it below.", "error");
    }
    await load(await file.text(), file.name);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function runImport() {
    if (!items) return;
    const chosen = items.filter((x) => selected.has(x.key) && !x.problem);
    setBusy(true);
    setProgress({ done: 0, total: chosen.length });
    let ok = 0;
    const failed: { name: string; error: string }[] = [];
    for (const it of chosen) {
      const r = it.kind === "rule" ? await upsertChatRule(it.rule) : await saveKnowledge(it.entry);
      if (r.ok) ok++;
      else failed.push({ name: it.kind === "rule" ? it.rule.id : it.entry.title, error: r.error });
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }
    setBusy(false);
    setResult({ ok, failed });
    setItems(null);
    setPaste("");
    if (ok) {
      notifyChatbotChanged();
      toast(`Imported ${ok} item${ok === 1 ? "" : "s"}. Live within a minute.`);
    }
  }

  const counts = items
    ? {
        rules: items.filter((x) => x.kind === "rule").length,
        kb: items.filter((x) => x.kind === "knowledge").length,
        updates: items.filter((x) => x.update && !x.problem).length,
        problems: items.filter((x) => x.problem).length,
        picked: items.filter((x) => selected.has(x.key) && !x.problem).length,
      }
    : null;

  return (
    <div className="flex flex-col gap-4">
      {result ? (
        <div className={cn("rounded-xl border p-4 text-sm", result.failed.length ? "border-amber-500/40 bg-amber-500/10" : "border-emerald-500/40 bg-emerald-500/10")}>
          <p className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" /> Imported {result.ok} item{result.ok === 1 ? "" : "s"}
            {result.failed.length ? `, ${result.failed.length} failed` : ""}.
          </p>
          {result.failed.length ? (
            <ul className="mt-2 list-disc pl-5 text-xs">
              {result.failed.map((f) => (
                <li key={f.name}>
                  <b>{f.name}</b>: {f.error}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {!items ? (
        <>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              void onFile(e.dataTransfer.files[0]);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition",
              drag ? "border-primary bg-primary/5" : "border-border hover:border-primary/60 hover:bg-muted/40",
            )}
          >
            <FileUp className="size-7 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm font-semibold">Drop a file here, or click to choose</span>
            <span className="text-xs text-muted-foreground">.csv · .json · .txt · .md, up to 1 MB. You&apos;ll see everything before it&apos;s saved.</span>
            <input ref={fileRef} type="file" accept=".csv,.json,.txt,.md,.markdown,text/csv,application/json,text/plain,text/markdown" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0])} />
          </label>

          <details className="rounded-xl border border-border">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Or paste text (from Word, a PDF or a website)</summary>
            <div className="flex flex-col gap-2 border-t border-border p-4">
              <Textarea
                id="import-paste"
                rows={8}
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                placeholder={"## Delivery fees\nDelivery is free over $500 within the GTA. Under $500 it's $79.\n\n## Returns\nUnopened items can be returned within 30 days."}
              />
              <p className="text-xs text-muted-foreground">Each heading (or each paragraph whose first line is the topic) becomes one knowledge entry.</p>
              <Button className="self-start" disabled={!paste.trim()} onClick={() => void load(paste, "Pasted text")}>
                Preview
              </Button>
            </div>
          </details>

          <div className="grid gap-3 md:grid-cols-3">
            <FormatCard title="Spreadsheet (.csv)" body="One row per item. Columns for quick answers: keywords, answer, buttons, link_text, link, starts_quote. For knowledge: category, title, content, keywords. Add a type column to mix both.">
              <TemplateButton name="quick-answers-template.csv" label="Quick answers template" />
              <TemplateButton name="knowledge-template.csv" label="Knowledge template" />
            </FormatCard>
            <FormatCard title="Document (.txt / .md)" body="Becomes knowledge. “# Category” starts a group, “## Topic” starts an entry, and the text under it is what the bot learns.">
              <TemplateButton name="knowledge-template.md" label="Example document" />
            </FormatCard>
            <FormatCard title="Data (.json)" body='A list of objects with the same fields, or { "rules": [...], "knowledge": [...] }. Excel and Google Sheets: File → Save/Download as CSV.' />
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 rounded-xl bg-muted/50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p>
              <b>{source}</b>: {counts!.rules} quick answer{counts!.rules === 1 ? "" : "s"}, {counts!.kb} knowledge entr{counts!.kb === 1 ? "y" : "ies"}
              {counts!.updates ? ` · ${counts!.updates} update existing` : ""}
              {counts!.problems ? ` · ${counts!.problems} need fixing in the file` : ""}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setItems(null)} disabled={busy}>
                <X className="size-4" /> Cancel
              </Button>
              <Button size="sm" onClick={runImport} disabled={busy || counts!.picked === 0}>
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> {progress.done}/{progress.total}
                  </>
                ) : (
                  `Import ${counts!.picked}`
                )}
              </Button>
            </div>
          </div>

          <label className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={counts!.picked === items.length - counts!.problems && counts!.picked > 0}
              onChange={(e) => setSelected(new Set(e.target.checked ? items.filter((x) => !x.problem).map((x) => x.key) : []))}
            />
            Select all
          </label>

          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            {items.map((it) => {
              const name = it.kind === "rule" ? it.rule.id || "(no name)" : it.entry.title || "(no topic)";
              const detail =
                it.kind === "rule" ? `${it.rule.keywords.join(", ") || "no keywords"} → ${it.rule.answer}` : `${it.entry.category} · ${it.entry.content}`;
              return (
                <li key={it.key} className={cn("flex items-start gap-3 px-3 py-2.5", it.problem && "bg-destructive/5")}>
                  <input
                    type="checkbox"
                    aria-label={`Import ${name}`}
                    className="mt-1 size-4 shrink-0 accent-primary"
                    disabled={Boolean(it.problem)}
                    checked={selected.has(it.key) && !it.problem}
                    onChange={(e) =>
                      setSelected((s) => {
                        const n = new Set(s);
                        if (e.target.checked) n.add(it.key);
                        else n.delete(it.key);
                        return n;
                      })
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                      <span
                        className={cn(
                          "rounded px-1.5 text-[10px] font-semibold uppercase",
                          it.kind === "rule" ? "bg-amber-500/15 text-amber-800 dark:text-amber-200" : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
                        )}
                      >
                        {it.kind === "rule" ? "Quick answer" : "Knowledge"}
                      </span>
                      <span className="truncate">{name}</span>
                      {it.problem ? (
                        <span className="rounded bg-destructive/15 px-1.5 text-[10px] font-semibold text-destructive">{it.problem}</span>
                      ) : it.update ? (
                        <span className="rounded bg-sky-500/15 px-1.5 text-[10px] font-semibold text-sky-700 dark:text-sky-300">Updates existing</span>
                      ) : (
                        <span className="rounded bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">New</span>
                      )}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function FormatCard({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border p-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
      {children ? <div className="mt-auto flex flex-col items-start gap-1 pt-1">{children}</div> : null}
    </div>
  );
}

function TemplateButton({ name, label }: { name: keyof typeof TEMPLATES; label: string }) {
  return (
    <button type="button" onClick={() => download(name)} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary underline-offset-2 hover:underline">
      <Download className="size-3.5" aria-hidden="true" /> {label}
    </button>
  );
}
