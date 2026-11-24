import { Activity, FileText, MessageCircle, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuestionRow = {
  question: string;
  answered: boolean;
  products_shown: string[] | null;
  page: string | null;
  created_at: string;
};

const DAYS = 14;
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" });

/** Per-day counts for the last 14 days (oldest first), from real rows. */
export function dailySeries(rows: QuestionRow[]) {
  const out: { key: string; label: string; answered: number; missed: number }[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    out.push({
      key: dayKey.format(d),
      label: d.toLocaleDateString("en-CA", { month: "short", day: "numeric", timeZone: "America/Toronto" }),
      answered: 0,
      missed: 0,
    });
  }
  const idx = new Map(out.map((d, i) => [d.key, i]));
  for (const r of rows) {
    const i = idx.get(dayKey.format(new Date(r.created_at)));
    if (i === undefined) continue;
    if (r.answered) out[i].answered++;
    else out[i].missed++;
  }
  return out;
}

function pageName(p: string | null) {
  if (!p || p === "/") return "Home";
  const seg = p.split("?")[0].split("/").filter(Boolean)[0] ?? "";
  const names: Record<string, string> = {
    products: "Product pages",
    shop: "Shop",
    categories: "Categories",
    cart: "Cart",
    services: "Services",
    contact: "Contact",
    "get-started": "Get started",
    plans: "Plans",
  };
  return names[seg] ?? seg.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function top(values: string[], n = 5) {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

function Card({ title, icon: Icon, children, className }: { title: string; icon: typeof Activity; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-border bg-background p-5 shadow-xs", className)}>
      <h2 className="mb-4 flex items-center gap-2 font-sans text-sm font-semibold">
        <Icon className="size-4 text-primary" aria-hidden="true" /> {title}
      </h2>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="flex h-32 items-center justify-center rounded-lg bg-muted/40 text-center text-xs text-muted-foreground">{text}</p>;
}

function Bars({ items }: { items: [string, number][] }) {
  const max = Math.max(1, ...items.map(([, n]) => n));
  return (
    <ul className="space-y-2.5">
      {items.map(([label, n]) => (
        <li key={label} className="text-xs">
          <div className="mb-1 flex justify-between gap-2">
            <span className="truncate font-medium">{label}</span>
            <span className="tabular-nums text-muted-foreground">{n}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-hi-vis" style={{ width: `${(n / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Ring showing the answer rate. */
export function Ring({ value }: { value: number | null }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const pct = value ?? 0;
  return (
    <div className="relative size-24 shrink-0">
      <svg viewBox="0 0 80 80" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="8" className="stroke-muted" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className="stroke-emerald-500 transition-all"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold tabular-nums">{value === null ? "—" : `${value}%`}</span>
        <span className="text-[10px] text-muted-foreground">answered</span>
      </div>
    </div>
  );
}

function ago(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/**
 * Graphical overview of the assistant, built only from logged questions
 * (chatbot_questions). Empty states when there is no data yet.
 */
export function ChatbotInsights({ rows }: { rows: QuestionRow[] | null }) {
  if (rows === null) {
    return (
      <Card title="Conversation activity" icon={Activity}>
        <Empty text="Activity will appear here once the question log is available." />
      </Card>
    );
  }
  const series = dailySeries(rows);
  const max = Math.max(1, ...series.map((d) => d.answered + d.missed));
  const total14 = series.reduce((s, d) => s + d.answered + d.missed, 0);
  const pages = top(rows.map((r) => pageName(r.page)));
  const products = top(rows.flatMap((r) => r.products_shown ?? []));
  const recent = rows.slice(0, 6);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card title="Conversation activity · last 14 days" icon={Activity} className="lg:col-span-2">
        {total14 === 0 ? (
          <Empty text="No AI conversations in the last 14 days yet." />
        ) : (
          <>
            <div className="flex h-40 items-end gap-1.5 border-b border-border pb-px sm:gap-2" role="img" aria-label={`${total14} questions in the last 14 days`}>
              {series.map((d) => {
                const t = d.answered + d.missed;
                return (
                  <div key={d.key} className="group relative flex h-full flex-1 flex-col justify-end">
                    <span className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[10px] text-background group-hover:block">
                      {d.label}: {t}
                    </span>
                    {d.missed ? <div className="w-full rounded-t-sm bg-amber-400" style={{ height: `${(d.missed / max) * 100}%` }} /> : null}
                    <div
                      className={cn("w-full bg-primary transition group-hover:bg-primary/80", d.missed ? "" : "rounded-t-sm")}
                      style={{ height: `${(d.answered / max) * 100}%`, minHeight: t ? 2 : 0 }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              <span>{series[0].label}</span>
              <span>Today</span>
            </div>
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-primary" /> Answered</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-amber-400" /> Needed help</span>
            </div>
          </>
        )}
      </Card>

      <Card title="Recent conversations" icon={MessageCircle}>
        {recent.length === 0 ? (
          <Empty text="Customer questions will show up here." />
        ) : (
          <ul className="space-y-3">
            {recent.map((r, i) => (
              <li key={i} className="flex gap-2.5 text-xs">
                <span className={cn("mt-1 size-2 shrink-0 rounded-full", r.answered ? "bg-emerald-500" : "bg-amber-500")} />
                <div className="min-w-0">
                  <p className="line-clamp-2 font-medium">{r.question}</p>
                  <p className="mt-0.5 text-muted-foreground">
                    {ago(r.created_at)} · {pageName(r.page)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Where customers ask" icon={FileText}>
        {pages.length ? <Bars items={pages} /> : <Empty text="No data yet." />}
      </Card>

      <Card title="Most recommended products" icon={Package} className="lg:col-span-2">
        {products.length ? <Bars items={products} /> : <Empty text="Products the assistant recommends will be ranked here." />}
      </Card>
    </div>
  );
}
