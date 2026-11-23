import { ChatbotRulesTable } from "@/components/admin/chatbot-rules-table";
import { ChatbotSettingsForm } from "@/components/admin/chatbot-settings-form";
import { ChatbotKnowledgeHub } from "@/components/admin/chatbot-knowledge";
import { aiConfigured } from "@/lib/chatbot/ai";
import { getChatbotPlan, type PlanStatus } from "@/lib/chatbot/billing";
import { Badge } from "@/components/ui/badge";

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

export default async function AdminChatbotPage() {
  const plan = await getChatbotPlan();
  const s = STATUS[plan.status];
  const date = fmt(plan.paidThrough);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:py-10">
      <div>
        <h1 className="text-3xl">Chatbot</h1>
        <p className="mt-1 text-muted-foreground">
          What the website assistant says. Changes go live within a minute, no redeploy.
        </p>
      </div>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            Chatbot plan <Badge variant={s.variant}>{s.label}</Badge>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {plan.amountLabel}
            {date
              ? plan.status === "active"
                ? ` · paid through ${date}, renews automatically`
                : ` · last paid period ended ${date}`
              : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {plan.payUrl ? (
            <a href={plan.payUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
              {/* While billing is by date, the link is the client's way to
                  start the monthly Razorpay auto-pay before anything is due. */}
              {plan.status === "active" ? "Set up auto-pay" : "Pay now"}
            </a>
          ) : null}
          {plan.manageUrl ? (
            <a href={plan.manageUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border px-3 py-2 text-sm font-medium">
              Invoices &amp; card
            </a>
          ) : null}
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
