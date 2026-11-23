import { ChatbotRulesTable } from "@/components/admin/chatbot-rules-table";
import { ChatbotSettingsForm } from "@/components/admin/chatbot-settings-form";
import { ChatbotKnowledgeHub } from "@/components/admin/chatbot-knowledge";
import { aiConfigured } from "@/lib/chatbot/ai";
import { getChatbotPlan, type PlanStatus } from "@/lib/chatbot/billing";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, ShieldCheck, Sparkles } from "lucide-react";
import { CHATBOT_PLAN } from "@/lib/chatbot/plan";
import { inrRates } from "@/lib/chatbot/fx";

export const dynamic = "force-dynamic";

const STATUS: Record<PlanStatus, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "Active", variant: "default" },
  past_due: { label: "Payment due", variant: "destructive" },
  unpaid: { label: "Unpaid", variant: "destructive" },
  not_set_up: { label: "Not set up", variant: "secondary" },
};

function fmt(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })
    : null;
}

const INCLUDED = [
  "AI answers from your live catalogue",
  "Knowledge base & question inbox",
  "Quote capture with email alerts",
  "Hosting, AI usage, updates & support",
];

function money(amount: number, currency: "INR" | "CAD" | "USD") {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-CA", {
    style: "currency",
    currency,
    currencyDisplay: currency === "INR" ? "symbol" : "code",
    maximumFractionDigits: currency === "INR" ? 0 : 2,
  }).format(amount);
}

export default async function AdminChatbotPage() {
  const [plan, fx] = await Promise.all([getChatbotPlan(), inrRates()]);
  const s = STATUS[plan.status];
  const date = fmt(plan.paidThrough);
  const overdue = plan.status === "past_due" || plan.status === "unpaid";
  const priceInr = CHATBOT_PLAN.priceInr;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:py-10">
      <div>
        <h1 className="text-3xl">Chatbot</h1>
        <p className="mt-1 text-muted-foreground">
          What the website assistant says. Changes go live within a minute, no redeploy.
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-background">
        <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              CareBy AI Assistant · Monthly plan <Badge variant={s.variant}>{s.label}</Badge>
            </p>

            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-3xl font-semibold tracking-tight">{money(priceInr, "INR")}</span>
              <span className="text-sm text-muted-foreground">/ month</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              ≈ <b className="text-foreground">{money(priceInr * fx.CAD, "CAD")}</b> · ≈{" "}
              <b className="text-foreground">{money(priceInr * fx.USD, "USD")}</b>
              <span className="mt-0.5 block text-xs">
                Charged in INR; your bank converts it at its own rate{fx.live ? "" : " (approximate)"}.
              </span>
            </p>

            <p className="mt-3 text-sm">
              {date
                ? plan.status === "active"
                  ? `Paid through ${date}.`
                  : `The last paid period ended ${date}. Pay now to keep the assistant on your site.`
                : "Subscribe to keep the assistant running on your site."}
            </p>

            <ul className="mt-3 grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2 md:w-64">
            {plan.payUrl && (overdue || !CHATBOT_PLAN.autoPayActive) ? (
              <a
                href={plan.payUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                <CreditCard className="size-4" aria-hidden="true" />
                {overdue ? "Pay now" : "Subscribe · auto-pay monthly"}
              </a>
            ) : CHATBOT_PLAN.autoPayActive ? (
              <p className="flex h-11 items-center justify-center gap-2 rounded-lg border border-emerald-600/30 bg-emerald-600/10 px-4 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                <Check className="size-4" aria-hidden="true" /> Auto-pay is on
              </p>
            ) : null}
            {plan.manageUrl ? (
              <a href={plan.manageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium">
                Invoices &amp; card
              </a>
            ) : null}
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" aria-hidden="true" /> Secure payment by Razorpay · cancel anytime
            </p>
          </div>
        </div>
      </section>

      {!aiConfigured() ? (
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <b>AI is off:</b> OPENAI_API_KEY isn&apos;t set on the server, so only the keyword rules answer. The knowledge
          base and product search start working as soon as the key is added.
        </p>
      ) : null}

      <ChatbotKnowledgeHub />

      <section className="flex flex-col gap-3">
        <h2 className="text-xl">Quick-answer rules</h2>
        <p className="-mt-2 text-sm text-muted-foreground">
          Instant canned answers for button taps and short questions (&quot;delivery?&quot;, &quot;hours&quot;). Longer questions, product names and SKUs go to the AI, which also reads these answers.
        </p>
        <ChatbotRulesTable />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl">Settings</h2>
        <ChatbotSettingsForm />
      </section>
    </div>
  );
}
