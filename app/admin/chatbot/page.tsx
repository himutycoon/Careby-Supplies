import { ChatbotRulesTable } from "@/components/admin/chatbot-rules-table";
import { ChatbotSettingsForm } from "@/components/admin/chatbot-settings-form";
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
          {plan.status !== "active" && plan.payUrl ? (
            <a href={plan.payUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
              Pay now
            </a>
          ) : null}
          {plan.manageUrl ? (
            <a href={plan.manageUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border px-3 py-2 text-sm font-medium">
              Invoices &amp; card
            </a>
          ) : null}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl">Rules</h2>
        <p className="-mt-2 text-sm text-muted-foreground">
          If a customer&apos;s message contains a rule&apos;s keywords, the bot gives that answer. Anything else goes to the AI assistant.
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
