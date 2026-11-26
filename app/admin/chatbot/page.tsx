import Link from "next/link";
import {
  Check,
  CheckCircle2,
  Crown,
  ExternalLink,
  HelpCircle,
  Inbox,
  MessageSquareText,
  ReceiptText,
  Settings2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ChatbotSettingsForm } from "@/components/admin/chatbot-settings-form";
import { ChatbotInbox, Panel } from "@/components/admin/chatbot-knowledge";
import { ChatbotLibrary } from "@/components/admin/chatbot-library";
import { ChatbotPlayground } from "@/components/admin/chatbot-playground";
import { ChatbotFlow } from "@/components/admin/chatbot-flow";
import { ChatbotInsights, Ring, type QuestionRow } from "@/components/admin/chatbot-insights";
import { PayPalSubscribe } from "@/components/admin/paypal-subscribe";
import { aiConfigured } from "@/lib/chatbot/ai";
import { chatbotAllowed, getChatbotPlan, type PlanStatus } from "@/lib/chatbot/billing";
import { CHATBOT_PLAN } from "@/lib/chatbot/plan";
import { fxFrom, type Currency } from "@/lib/chatbot/fx";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS: Record<PlanStatus, { label: string; tone: string }> = {
  active: { label: "Active", tone: "bg-emerald-500/12 text-emerald-700 ring-emerald-600/25 dark:text-emerald-400" },
  past_due: { label: "Payment due", tone: "bg-amber-500/15 text-amber-700 ring-amber-600/25 dark:text-amber-400" },
  unpaid: { label: "Unpaid", tone: "bg-destructive/10 text-destructive ring-destructive/25" },
  pending: { label: "Activating", tone: "bg-sky-500/12 text-sky-700 ring-sky-600/25 dark:text-sky-400" },
  not_set_up: { label: "Not set up", tone: "bg-muted text-muted-foreground ring-border" },
};

const INCLUDED = [
  "AI answers from your live catalogue",
  "Knowledge base & question inbox",
  "Quote capture with email alerts",
  "Hosting, AI usage, updates & support",
];

// Premium plan (the upgrade above Pro): marketed here, delivered when the client upgrades.
const PREMIUM_FEATURES = [
  { title: "WhatsApp AI agent", body: "The same assistant answers customers on your WhatsApp Business number." },
  { title: "Lead CRM & follow-ups", body: "Every quote request in one list, with reminders and CSV export." },
  { title: "Monthly insights report", body: "Top questions, products asked about and missed sales, emailed monthly." },
  { title: "Live chat takeover", body: "Jump into any website conversation and reply as a person." },
  { title: "Custom name, avatar & colours", body: "Give the assistant your own persona and brand look." },
  { title: "Priority support & AI tuning", body: "Same-day fixes and a monthly review of answers." },
];

const NAV = [
  ["Overview", "#overview"],
  ["Flow", "#flow"],
  ["Playground", "#playground"],
  ["Quick answers", "#rules"],
  ["Knowledge", "#knowledge"],
  ["Import", "#import"],
  ["Inbox", "#inbox"],
  ["Settings", "#settings"],
] as const;

function fmt(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" }) : null;
}

function money(amount: number, currency: Currency) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Real counts for the stat cards, read as the signed-in admin (RLS).
 * null means "couldn't read", shown as a dash, never a made-up number.
 */
async function getStats() {
  const sb = await createClient();
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const count = async (q: PromiseLike<{ count: number | null; error: unknown }>) => {
    const { count: n, error } = await q;
    return error ? null : (n ?? 0);
  };
  const [log, waiting, leads] = await Promise.all([
    sb
      .from("chatbot_questions")
      .select("question, answered, products_shown, page, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(2000),
    count(sb.from("chatbot_questions").select("id", { count: "exact", head: true }).eq("answered", false).eq("resolved", false)),
    count(sb.from("chat_leads").select("*", { count: "exact", head: true }).gte("created_at", since)),
  ]);
  const rows = log.error ? null : ((log.data ?? []) as QuestionRow[]);
  const asked = rows ? rows.length : null;
  const answered = rows ? rows.filter((r) => r.answered).length : null;
  return { asked, answered, waiting, leads, rows };
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  href,
  tone = "text-primary bg-primary/10",
}: {
  icon: typeof Inbox;
  label: string;
  value: number | null;
  hint: string;
  href?: string;
  tone?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={cn("flex size-8 items-center justify-center rounded-lg", tone)}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value ?? "—"}</p>
      <p className="mt-1 text-xs text-muted-foreground">{value === null ? "Not available yet" : hint}</p>
    </>
  );
  const cls = "rounded-xl border border-border bg-background p-4 shadow-xs transition";
  return href ? (
    <a href={href} className={cn(cls, "hover:border-primary/30 hover:shadow-sm")}>
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export default async function AdminChatbotPage() {
  const { amount: price, currency } = CHATBOT_PLAN.price;
  const setupFee = CHATBOT_PLAN.setupFee;
  const [plan, fx, stats, enabled] = await Promise.all([getChatbotPlan(), fxFrom(currency), getStats(), chatbotAllowed()]);
  const s = STATUS[plan.status];
  const date = fmt(plan.paidThrough);
  const ai = aiConfigured();
  const online = enabled && ai;
  const others = (["CAD", "USD"] as const).filter((c) => c !== currency);
  const answerRate = stats.asked && stats.answered !== null ? Math.round((stats.answered / stats.asked) * 100) : null;
  const up = CHATBOT_PLAN.upgrade;
  const subscribed = plan.status === "active" || plan.status === "past_due";
  const premium = plan.tier === "premium";
  const tierName = premium ? up.name : CHATBOT_PLAN.name;
  const tierPrice = premium ? up.price : price;
  const fxLine = (amount: number) =>
    `${others.map((c) => `≈ ${money(amount * fx.rates[c], c)}`).join(" · ")} · charged in ${currency}${fx.live ? "" : " (approx.)"}`;

  const requestPremium = (label: string, className: string) => (
    <a
      href={`mailto:${up.requestEmail}?subject=${encodeURIComponent(`${up.name} plan`)}&body=${encodeURIComponent(
        `Hi, we'd like the ${up.name} plan for the CareBy Supplies assistant (CAD ${up.price}/month). Please send the next steps.`,
      )}`}
      className={className}
    >
      <Crown className="size-4" aria-hidden="true" /> {label}
    </a>
  );

  /* Not paid yet (or lapsed): both plans side by side to choose from. */
  const choosePlan = (
    <section id="plan" className="scroll-mt-28">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Choose a plan</h2>
          <p className="text-sm text-muted-foreground">
            {plan.status === "unpaid" && date ? (
              <>
                Your plan ended on <b className="text-foreground">{date}</b>. Pick a plan to switch the assistant back on.
              </>
            ) : (
              "The assistant goes live on your site as soon as your first payment goes through."
            )}
          </p>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" aria-hidden="true" /> Secure payment by PayPal · cancel anytime
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Pro */}
        <div className="flex flex-col rounded-xl border-2 border-primary/30 bg-background p-5 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4.5" aria-hidden="true" />
            </span>
            <p className="font-semibold">{CHATBOT_PLAN.name}</p>
          </div>
          <p className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold tracking-tight">{money(price, currency)}</span>
            <span className="text-sm text-muted-foreground">/ month</span>
          </p>
          <p className="text-[11px] text-muted-foreground">{fxLine(price)}</p>
          {setupFee > 0 ? (
            <div className="mt-3 grid gap-1 rounded-lg bg-muted/60 px-3 py-2 text-sm">
              <p className="flex justify-between">
                <span className="text-muted-foreground">One-time setup fee</span>
                <span>{money(setupFee, currency)}</span>
              </p>
              <p className="flex justify-between font-semibold">
                <span>First payment today</span>
                <span>{money(price + setupFee, currency)}</span>
              </p>
            </div>
          ) : null}
          <ul className="mt-4 grid gap-1.5 text-sm text-muted-foreground">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" /> {item}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-5">
            <PayPalSubscribe clientId={CHATBOT_PLAN.paypal.clientId} planId={CHATBOT_PLAN.paypal.planId} />
          </div>
        </div>

        {/* Premium */}
        <div className="relative flex flex-col overflow-hidden rounded-xl bg-gradient-to-br from-primary to-[oklch(0.28_0.09_262)] p-5 text-primary-foreground shadow-sm">
          <div className="pointer-events-none absolute -top-16 right-10 size-40 rounded-full bg-hi-vis/25 blur-3xl" aria-hidden="true" />
          <div className="relative flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-hi-vis text-hi-vis-foreground">
              <Crown className="size-4.5" aria-hidden="true" />
            </span>
            <p className="font-semibold">{up.name}</p>
          </div>
          <p className="relative mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold tracking-tight">{money(up.price, currency)}</span>
            <span className="text-sm text-primary-foreground/70">/ month</span>
          </p>
          <p className="relative text-[11px] text-primary-foreground/70">{fxLine(up.price)}</p>
          <p className="relative mt-4 text-sm font-medium">Everything in {CHATBOT_PLAN.name}, plus</p>
          <ul className="relative mt-1.5 grid gap-1.5 text-sm text-primary-foreground/80">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f.title} title={f.body} className="flex items-start gap-2">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-hi-vis" aria-hidden="true" /> {f.title}
              </li>
            ))}
          </ul>
          <div className="relative mt-auto pt-5">
            {up.paypalPlanId ? (
              <div className="rounded-lg bg-background p-1.5">
                <PayPalSubscribe clientId={CHATBOT_PLAN.paypal.clientId} planId={up.paypalPlanId} />
              </div>
            ) : (
              requestPremium(
                `Request ${up.name}`,
                "inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-hi-vis px-4 text-sm font-semibold text-hi-vis-foreground transition hover:brightness-95",
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );

  /* Paid on Pro: offer Premium above the current plan. */
  const upgradeBanner = (
    <section className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-[oklch(0.28_0.09_262)] px-4 py-3.5 text-primary-foreground shadow-sm sm:px-5">
      <div className="pointer-events-none absolute -top-16 right-24 size-40 rounded-full bg-hi-vis/25 blur-3xl" aria-hidden="true" />
      <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-hi-vis text-hi-vis-foreground">
            <Crown className="size-4.5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              Upgrade to {up.name} <span className="font-normal text-primary-foreground/70">· everything in {CHATBOT_PLAN.name}, plus</span>
            </p>
            <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-primary-foreground/75">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f.title} title={f.body} className="flex items-center gap-1">
                  <Sparkles className="size-3 text-hi-vis" aria-hidden="true" /> {f.title}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <p className="leading-tight">
            <span className="text-lg font-semibold">{money(up.price, currency)}</span>
            <span className="text-xs text-primary-foreground/70"> / mo</span>
          </p>
          {up.paypalPlanId ? (
            <div className="w-56 rounded-lg bg-background p-1.5">
              <PayPalSubscribe clientId={CHATBOT_PLAN.paypal.clientId} planId={up.paypalPlanId} />
            </div>
          ) : (
            requestPremium(
              "Upgrade",
              "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-hi-vis px-4 text-sm font-semibold text-hi-vis-foreground transition hover:brightness-95",
            )
          )}
        </div>
      </div>
    </section>
  );

  /* Paid (or payment just approved): the plan in one line. */
  const currentPlan = (
    <section
      id="plan"
      className={cn(
        "scroll-mt-28 rounded-xl border-2 bg-background px-4 py-3 shadow-xs sm:px-5",
        plan.status === "active"
          ? "border-emerald-500/70 bg-emerald-500/[0.03]"
          : plan.status === "past_due"
            ? "border-amber-500/70"
            : "border-sky-500/50",
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ReceiptText className="size-4.5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Current plan</p>
                <p className="text-sm font-semibold">{tierName} · Monthly</p>
              </div>
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium ring-1", s.tone)}>{s.label}</span>
            </div>
            <p className="leading-tight">
              <span className="text-lg font-semibold">{money(tierPrice, currency)}</span>
              <span className="text-xs text-muted-foreground"> / month</span>
              <span className="block text-[11px] text-muted-foreground">{fxLine(tierPrice)}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {plan.status === "pending" ? (
                "Payment approved. Confirming with PayPal, the assistant switches on within a few minutes."
              ) : plan.status === "past_due" ? (
                "PayPal couldn't take the last payment. Update your card in PayPal to keep the assistant on."
              ) : date ? (
                plan.renewing ? (
                  <>
                    Next payment <b className="text-foreground">{date}</b>
                  </>
                ) : plan.source === "manual" ? (
                  <>
                    Paid with {CHATBOT_PLAN.paidVia} · through <b className="text-foreground">{date}</b>
                  </>
                ) : (
                  <>
                    Paid through <b className="text-foreground">{date}</b> · auto-pay is off
                  </>
                )
              ) : (
                "Paid"
              )}
            </p>
          </div>
          <ul className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
            {(premium ? [`Everything in ${CHATBOT_PLAN.name}`, ...PREMIUM_FEATURES.map((f) => f.title)] : INCLUDED).map((item) => (
              <li key={item} className="flex items-center gap-1">
                <Check className="size-3 text-emerald-600" aria-hidden="true" /> {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex shrink-0 flex-col gap-1.5 lg:w-60">
          {plan.source === "manual" && plan.status === "active" ? (
            <p className="flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-500/10 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-4" aria-hidden="true" /> Paid with {CHATBOT_PLAN.paidVia}
            </p>
          ) : null}
          {plan.renewing ? (
            <>
              <p className="flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-500/10 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                <Check className="size-4" aria-hidden="true" /> Auto-pay is on
              </p>
              <a
                href="https://www.paypal.com/myaccount/autopay/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted"
              >
                Manage in PayPal <ExternalLink className="size-3" aria-hidden="true" />
              </a>
            </>
          ) : null}
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3.5" aria-hidden="true" /> Secure payment by PayPal · cancel anytime
          </p>
        </div>
      </div>
    </section>
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 font-sans sm:px-6 lg:py-8">
      {/* ── header ───────────────────────────────────────────── */}
      <header id="overview" className="flex scroll-mt-28 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-sans text-2xl font-semibold tracking-tight">AI Assistant</h1>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
                  online ? "bg-emerald-500/12 text-emerald-700 ring-emerald-600/25 dark:text-emerald-400" : "bg-amber-500/15 text-amber-700 ring-amber-600/25 dark:text-amber-400",
                )}
              >
                <span className={cn("size-1.5 rounded-full", online ? "animate-pulse bg-emerald-500" : "bg-amber-500")} />
                {!enabled ? "Paused" : ai ? "Online" : "Rules only"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Manage your CareBy AI customer support. Changes go live within a minute.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            target="_blank"
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 sm:flex-none rounded-lg border border-border bg-background px-3 text-sm font-medium shadow-xs transition hover:bg-muted"
          >
            <ExternalLink className="size-4" aria-hidden="true" /> Preview on site
          </Link>
          <a
            href="#settings"
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 sm:flex-none rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground shadow-xs transition hover:opacity-90"
          >
            <Settings2 className="size-4" aria-hidden="true" /> Settings
          </a>
        </div>
      </header>

      {/* ── plan ─────────────────────────────────────────────── */}
      {subscribed || plan.status === "pending" ? (
        <>
          {!premium && subscribed ? upgradeBanner : null}
          {currentPlan}
        </>
      ) : (
        choosePlan
      )}

      {/* section jump bar */}
      <nav aria-label="Chatbot sections" className="sticky top-18 z-30 -mx-4 overflow-x-auto border-b border-border bg-muted/80 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-lg sm:border sm:bg-background/90">
        <ul className="flex gap-1 whitespace-nowrap">
          {NAV.map(([label, href]) => (
            <li key={href}>
              <a href={href} className="block rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {!ai ? (
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <b>AI is temporarily off.</b> The assistant is replying with quick answers only. Contact Codevera support at {up.requestEmail} to turn it back on.
        </p>
      ) : null}

      {/* ── conversation flow (n8n-style) ─────────────────────── */}
      <ChatbotFlow />

      {/* ── stats ────────────────────────────────────────────── */}
      <section aria-label="Last 30 days" className="grid gap-3 lg:grid-cols-[300px_1fr]">
        {/* agent health */}
        <div className="flex items-center gap-4 rounded-xl border border-border bg-background p-4 shadow-xs">
          <Ring value={answerRate} />
          <ul className="min-w-0 space-y-1.5 text-xs">
            {[
              ["AI engine", ai],
              ["Live catalogue", ai],
              ["Knowledge base", true],
              ["Showing on site", enabled],
            ].map(([label, ok]) => (
              <li key={label as string} className="flex items-center gap-2">
                <span className={cn("size-2 rounded-full", ok ? "bg-emerald-500" : "bg-amber-500")} />
                <span className="font-medium">{label as string}</span>
                <span className="text-muted-foreground">{ok ? "Live" : "Off"}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={MessageSquareText} label="AI questions" value={stats.asked} hint="Last 30 days, answered by the AI" />
        <Stat
          icon={CheckCircle2}
          label="Answered"
          value={stats.answered}
          hint={answerRate !== null ? `${answerRate}% answer rate` : "Last 30 days"}
          tone="text-emerald-600 bg-emerald-500/10"
        />
        <Stat icon={HelpCircle} label="Needs an answer" value={stats.waiting} hint="Open in the inbox" href="#inbox" tone="text-amber-600 bg-amber-500/12" />
        <Stat icon={ReceiptText} label="Quote requests" value={stats.leads} hint="Last 30 days, from the chat" tone="text-orange-600 bg-orange-500/12" />
        </div>
      </section>

      {/* ── graphical insights ───────────────────────────────── */}
      <ChatbotInsights rows={stats.rows} />

      {/* ── playground ───────────────────────────────────────── */}
      <section id="playground" className="scroll-mt-28">
        <ChatbotPlayground />
      </section>

      {/* ── library: quick answers, knowledge, import ───────── */}
      <ChatbotLibrary />

      <ChatbotInbox />

      <Panel id="settings" title="Settings" description="Greeting, starting buttons, WhatsApp hand-off and extra instructions for the AI.">
        <ChatbotSettingsForm />
      </Panel>
    </div>
  );
}
