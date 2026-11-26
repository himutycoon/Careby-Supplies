"use client";

import * as React from "react";
import { BookOpen, FileUp, Zap } from "lucide-react";
import { Panel, KnowledgeLibrary } from "@/components/admin/chatbot-knowledge";
import { ChatbotRulesTable } from "@/components/admin/chatbot-rules-table";
import { ChatbotImport } from "@/components/admin/chatbot-import";
import { ChatbotBackup } from "@/components/admin/chatbot-backup";
import { cn } from "@/lib/utils";

/*
 * Everything the bot knows, in one place: quick answers (checked first,
 * word for word) and knowledge (searched by the free answer engine), plus bulk import.
 * #rules, #knowledge and #import links open the matching tab.
 */

const TABS = [
  { id: "rules", label: "Quick answers", icon: Zap },
  { id: "knowledge", label: "Knowledge", icon: BookOpen },
  { id: "import", label: "Import & backup", icon: FileUp },
] as const;
type Tab = (typeof TABS)[number]["id"];

export function ChatbotLibrary() {
  const [tab, setTab] = React.useState<Tab>("rules");
  const ref = React.useRef<HTMLDivElement>(null);

  // Section links and the flow canvas jump straight to a tab.
  React.useEffect(() => {
    const sync = () => {
      const h = window.location.hash.slice(1);
      if (h === "rules" || h === "knowledge" || h === "import") {
        setTab(h);
        ref.current?.scrollIntoView({ behavior: "smooth" });
      }
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  return (
    <div ref={ref} className="scroll-mt-28">
      <Panel
        id="library"
        title="Library"
        description="Everything the assistant knows. Edit here or on the flow above; changes go live within a minute."
      >
        <ol className="mb-5 grid gap-2 text-sm md:grid-cols-3">
          <Step n={1} tone="amber" title="Quick answers first">
            If a message contains a rule&apos;s keyword, the customer gets that exact reply instantly.
          </Step>
          <Step n={2} tone="emerald" title="Then knowledge and products">
            No keyword match? The engine finds the closest knowledge entry or verified answer, or real products from the catalogue.
          </Step>
          <Step n={3} tone="sky" title="Gaps land in the inbox">
            Questions it wasn&apos;t sure about appear under Customer questions, ready to teach.
          </Step>
        </ol>

        <div role="tablist" aria-label="Library" className="mb-4 flex gap-1 overflow-x-auto rounded-lg bg-muted/60 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition",
                tab === t.id ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="size-4" aria-hidden="true" /> {t.label}
            </button>
          ))}
        </div>

        <div role="tabpanel">
          {tab === "rules" ? (
            <ChatbotRulesTable />
          ) : tab === "knowledge" ? (
            <KnowledgeLibrary />
          ) : (
            <div className="flex flex-col gap-6">
              <ChatbotImport />
              <ChatbotBackup />
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}

function Step({ n, tone, title, children }: { n: number; tone: "amber" | "emerald" | "sky"; title: string; children: React.ReactNode }) {
  const tones = {
    amber: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
    emerald: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
    sky: "bg-sky-500/15 text-sky-800 dark:text-sky-200",
  };
  return (
    <li className="flex gap-3 rounded-lg border border-border p-3">
      <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold", tones[tone])}>{n}</span>
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>
      </div>
    </li>
  );
}
