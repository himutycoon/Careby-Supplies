"use client";

import * as React from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Bot,
  BookOpen,
  Boxes,
  FileText,
  GitBranch,
  Inbox,
  Mail,
  MessageCircle,
  MessageSquareText,
  Pencil,
  Plus,
  Reply,
  ScrollText,
  Search,
  Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/shared/toast";
import { useAsyncData } from "@/lib/store/hooks";
import { answer } from "@/lib/chatbot/engine";
import type { Faq } from "@/lib/chatbot/config";
import { cn } from "@/lib/utils";
import {
  getChatQuestions,
  getChatRules,
  getChatSettings,
  getKnowledge,
  setChatRuleEnabled,
  setKnowledgeEnabled,
  type ChatRuleRow,
  type KnowledgeRow,
} from "@/services/chatbot";
import {
  BLANK_KNOWLEDGE,
  BLANK_RULE,
  KnowledgeDialog,
  RuleDialog,
  notifyChatbotChanged,
  useChatbotChanged,
  type KnowledgeDraft,
} from "@/components/admin/chatbot-editors";

/*
 * Admin > Chatbot as an n8n-style flow: the real path a customer message
 * takes through the bot (lib/chatbot/engine.ts, then the AI in
 * lib/chatbot/ai.ts). Rules and knowledge entries are nodes you click to
 * edit; the flow's shape itself is fixed, because that is how the bot runs.
 */

// ── node building blocks ──────────────────────────────────────────

type Tone = "slate" | "primary" | "violet" | "emerald" | "amber" | "sky" | "orange";

const TONES: Record<Tone, string> = {
  slate: "bg-muted text-foreground",
  primary: "bg-primary text-primary-foreground",
  violet: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  emerald: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  sky: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  orange: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
};

type Common = { hit?: boolean; dim?: boolean };

function Shell({
  icon: Icon,
  tone,
  title,
  subtitle,
  hit,
  dim,
  width = 240,
  className,
  children,
  onClick,
}: Common & {
  icon: React.ElementType;
  tone: Tone;
  title: string;
  subtitle?: React.ReactNode;
  width?: number;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      style={{ width }}
      onClick={onClick}
      className={cn(
        "rounded-xl border-2 bg-background text-left shadow-sm transition",
        hit ? "border-primary shadow-lg ring-4 ring-primary/15" : "border-border",
        dim && "opacity-40",
        onClick && "cursor-pointer hover:border-primary/60",
        className,
      )}
    >
      <div className="flex items-start gap-2.5 p-2.5">
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", TONES[tone])}>
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] leading-tight font-semibold">{title}</p>
          {subtitle ? <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{subtitle}</div> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

const handle = "!size-2.5 !border-2 !border-background !bg-muted-foreground";

function Toggle({ on, disabled, onChange, label }: { on: boolean; disabled?: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={cn(
        "nodrag relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
        on ? "bg-emerald-500" : "bg-muted-foreground/30",
      )}
    >
      <span className={cn("inline-block size-3 rounded-full bg-white shadow transition-transform", on ? "translate-x-3.5" : "translate-x-0.5")} />
    </button>
  );
}

/** Open a page tab or Library tab by its hash (#settings, #inbox, #rules…). */
function openTab(tab: string) {
  if (window.location.hash === `#${tab}`) window.dispatchEvent(new HashChangeEvent("hashchange"));
  else window.location.hash = tab;
}

// ── node types ────────────────────────────────────────────────────

type TriggerData = Common & { greeting: string; chips: string[] };
function TriggerNode({ data }: NodeProps<Node<TriggerData>>) {
  return (
    <>
      <Shell
        icon={MessageCircle}
        tone="primary"
        title="Customer message"
        hit={data.hit}
        dim={data.dim}
        width={220}
        onClick={() => openTab("settings")}
        subtitle={<span className="line-clamp-2">Website chat · “{data.greeting}”</span>}
      >
        {data.chips.length ? (
          <div className="flex flex-wrap gap-1 border-t border-border px-2.5 py-2">
            {data.chips.map((c) => (
              <span key={c} className="rounded-full border border-border px-1.5 py-px text-[10px]">
                {c}
              </span>
            ))}
          </div>
        ) : null}
      </Shell>
      <Handle type="source" position={Position.Right} className={handle} />
    </>
  );
}

type RouterData = Common & { on: number; total: number };
function RouterNode({ data }: NodeProps<Node<RouterData>>) {
  return (
    <>
      <Handle type="target" position={Position.Left} className={handle} />
      <Shell
        icon={GitBranch}
        tone="amber"
        title="Quick answers"
        hit={data.hit}
        dim={data.dim}
        width={210}
        onClick={() => openTab("rules")}
        subtitle={`Keyword match · ${data.on} of ${data.total} rules on`}
      >
        <div className="flex justify-between border-t border-border px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground">
          <span />
          <span className="flex flex-col items-end gap-3">
            <span className="text-emerald-600">match</span>
            <span>no match</span>
          </span>
        </div>
      </Shell>
      <Handle id="match" type="source" position={Position.Right} style={{ top: "62%" }} className={cn(handle, "!bg-emerald-500")} />
      <Handle id="miss" type="source" position={Position.Right} style={{ top: "86%" }} className={handle} />
    </>
  );
}

type RuleData = Common & { rule: ChatRuleRow; pending: boolean; onEdit: () => void; onToggle: () => void };
function RuleNode({ data }: NodeProps<Node<RuleData>>) {
  const r = data.rule;
  return (
    <>
      <Handle type="target" position={Position.Left} className={handle} />
      <Shell
        icon={Zap}
        tone={r.enabled ? "amber" : "slate"}
        title={r.id}
        hit={data.hit}
        dim={data.dim || !r.enabled}
        onClick={data.onEdit}
        subtitle={<span className="line-clamp-1">{r.keywords.join(", ") || "no keywords"}</span>}
      >
        <div className="flex items-center gap-2 border-t border-border px-2.5 py-1.5">
          <p className="line-clamp-1 min-w-0 flex-1 text-[11px] text-muted-foreground">{r.answer}</p>
          {r.startsQuote ? <span className="shrink-0 rounded bg-orange-500/15 px-1 text-[9px] font-semibold text-orange-700 dark:text-orange-300">QUOTE</span> : null}
          <Toggle on={r.enabled} disabled={data.pending} onChange={data.onToggle} label={`${r.enabled ? "Turn off" : "Turn on"} ${r.id}`} />
        </div>
      </Shell>
      <Handle type="source" position={Position.Right} className={handle} />
    </>
  );
}

type AddData = { label: string; onAdd: () => void };
function AddNode({ data }: NodeProps<Node<AddData>>) {
  return (
    <>
      <Handle type="target" position={Position.Left} className="!opacity-0" />
      <button
        type="button"
        onClick={data.onAdd}
        style={{ width: 240 }}
        className="nodrag flex h-11 items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border bg-background/60 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
      >
        <Plus className="size-4" aria-hidden="true" /> {data.label}
      </button>
    </>
  );
}

type AgentData = Common & { kb: number };
function AgentNode({ data }: NodeProps<Node<AgentData>>) {
  return (
    <>
      <Handle type="target" position={Position.Left} className={handle} />
      <Shell
        icon={Bot}
        tone="violet"
        title="Answer engine"
        hit={data.hit}
        dim={data.dim}
        width={260}
        subtitle="Free, no AI: finds the best answer you wrote or real products, using the sources below"
      >
        <div className="flex justify-around border-t border-border px-2.5 py-1.5 text-[10px] text-muted-foreground">
          <span>Knowledge · {data.kb}</span>
          <span>Catalogue</span>
          <span>Synonyms</span>
        </div>
      </Shell>
      <Handle id="tools" type="target" position={Position.Bottom} className={cn(handle, "!bg-violet-500")} />
      <Handle type="source" position={Position.Right} className={handle} />
    </>
  );
}

type KnowledgeData = Common & {
  category: string;
  entries: KnowledgeRow[];
  pendingId: string | null;
  onEdit: (e: KnowledgeRow) => void;
  onToggle: (e: KnowledgeRow) => void;
  onAdd: () => void;
};
function KnowledgeNode({ data }: NodeProps<Node<KnowledgeData>>) {
  const on = data.entries.filter((e) => e.enabled).length;
  return (
    <>
      <Shell icon={BookOpen} tone="emerald" title={data.category} dim={data.dim} subtitle={`Knowledge · ${on} of ${data.entries.length} on`}>
        <ul className="nowheel max-h-44 overflow-y-auto border-t border-border">
          {data.entries.map((e) => (
            <li key={e.id} className="flex items-center gap-2 border-b border-border/60 px-2.5 py-1.5 last:border-0">
              <button
                type="button"
                onClick={() => data.onEdit(e)}
                className={cn("nodrag flex min-w-0 flex-1 items-center gap-1.5 text-left text-[11px] hover:text-primary", !e.enabled && "opacity-50")}
              >
                <Pencil className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="truncate">{e.title}</span>
              </button>
              <Toggle on={e.enabled} disabled={data.pendingId === e.id} onChange={() => data.onToggle(e)} label={`${e.enabled ? "Turn off" : "Turn on"} ${e.title}`} />
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={data.onAdd}
          className="nodrag flex w-full items-center justify-center gap-1 border-t border-border py-1.5 text-[11px] font-medium text-muted-foreground transition hover:text-primary"
        >
          <Plus className="size-3" aria-hidden="true" /> Add to {data.category}
        </button>
      </Shell>
      <Handle type="source" position={Position.Top} className={cn(handle, "!bg-violet-500")} />
    </>
  );
}

type ToolData = Common & {
  icon: React.ElementType;
  tone: Tone;
  title: string;
  subtitle: string;
  href?: string;
  /** "tool" hangs under the agent; "step" sits in the main flow. */
  kind: "tool" | "step" | "end";
  width?: number;
};
function ToolNode({ data }: NodeProps<Node<ToolData>>) {
  const go = data.href
    ? () => {
        if (data.href!.startsWith("#")) openTab(data.href!.slice(1));
        else window.open(data.href, "_blank");
      }
    : undefined;
  return (
    <>
      {data.kind !== "tool" ? <Handle type="target" position={Position.Left} className={handle} /> : null}
      <Shell icon={data.icon} tone={data.tone} title={data.title} subtitle={data.subtitle} hit={data.hit} dim={data.dim} width={data.width ?? 220} onClick={go} />
      {data.kind === "tool" ? <Handle type="source" position={Position.Top} className={cn(handle, "!bg-violet-500")} /> : null}
      {data.kind === "step" ? <Handle type="source" position={Position.Right} className={handle} /> : null}
    </>
  );
}

const nodeTypes = {
  trigger: TriggerNode,
  router: RouterNode,
  rule: RuleNode,
  add: AddNode,
  agent: AgentNode,
  knowledge: KnowledgeNode,
  tool: ToolNode,
};

// ── layout ────────────────────────────────────────────────────────

const X = [0, 290, 580, 930, 1230];
const ROW = 96;

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

async function loadFlow() {
  const [rules, knowledge, settings, questions] = await Promise.all([
    getChatRules(),
    getKnowledge().catch(() => [] as KnowledgeRow[]),
    getChatSettings(),
    getChatQuestions().catch(() => []),
  ]);
  return { rules, knowledge, settings, unsure: questions.filter((q) => !q.answered && !q.resolved).length };
}

export function ChatbotFlow() {
  const { toast } = useToast();
  const { data, loading, error, reload } = useAsyncData(loadFlow);
  useChatbotChanged(reload);
  const [editingRule, setEditingRule] = React.useState<ChatRuleRow | null>(null);
  const [kbDraft, setKbDraft] = React.useState<KnowledgeDraft | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [test, setTest] = React.useState("");

  const rules = React.useMemo(() => [...(data?.rules ?? [])].sort((a, b) => a.sortOrder - b.sortOrder), [data]);
  const knowledge = React.useMemo(() => data?.knowledge ?? [], [data]);
  const categories = React.useMemo(() => [...new Set(knowledge.map((k) => k.category))].sort(), [knowledge]);

  const toggleRule = React.useCallback(
    async (r: ChatRuleRow) => {
      setPendingId(r.id);
      const res = await setChatRuleEnabled(r.id, !r.enabled);
      setPendingId(null);
      if (res.ok) notifyChatbotChanged();
      else toast(res.error, "error");
    },
    [toast],
  );
  const toggleKnowledge = React.useCallback(
    async (e: KnowledgeRow) => {
      setPendingId(e.id);
      const res = await setKnowledgeEnabled(e.id, !e.enabled);
      setPendingId(null);
      if (res.ok) notifyChatbotChanged();
      else toast(res.error, "error");
    },
    [toast],
  );

  // Which path would this test message take?
  const testing = test.trim().length > 0;
  const hitRule = React.useMemo(() => {
    if (!testing) return null;
    return answer(test, rules.filter((r) => r.enabled).map(toFaq))?.id ?? null;
  }, [test, testing, rules]);
  const viaAI = testing && !hitRule;
  const hitQuote = testing && Boolean(hitRule && rules.find((r) => r.id === hitRule)?.startsQuote);

  const { nodes, edges } = React.useMemo(() => {
    if (!data) return { nodes: [] as Node[], edges: [] as Edge[] };
    const n: Node[] = [];
    const e: Edge[] = [];
    const lit = (on: boolean) => ({ hit: testing && on, dim: testing && !on });

    const rulesH = (rules.length + 1) * ROW;
    const mid = Math.max(0, rulesH / 2 - ROW / 2);
    const yAI = rulesH + 90;

    n.push({ id: "trigger", type: "trigger", position: { x: X[0], y: mid - 20 }, data: { greeting: data.settings.greeting, chips: data.settings.welcomeChips, ...lit(true) } });
    n.push({ id: "router", type: "router", position: { x: X[1], y: mid - 10 }, data: { on: rules.filter((r) => r.enabled).length, total: rules.length, ...lit(true) } });
    edge(e, "trigger", "router", testing);

    rules.forEach((r, i) => {
      const hit = hitRule === r.id;
      n.push({
        id: `rule:${r.id}`,
        type: "rule",
        position: { x: X[2], y: i * ROW },
        data: { rule: r, pending: pendingId === r.id, onEdit: () => setEditingRule(r), onToggle: () => toggleRule(r), ...lit(hit) },
      });
      edge(e, "router", `rule:${r.id}`, hit, { sourceHandle: "match", muted: !r.enabled });
      edge(e, `rule:${r.id}`, "reply", hit, { muted: !r.enabled });
      if (r.startsQuote) edge(e, `rule:${r.id}`, "quote", hit, { muted: !r.enabled, dashed: true });
    });
    n.push({
      id: "add-rule",
      type: "add",
      position: { x: X[2], y: rules.length * ROW + 10 },
      data: { label: "Add quick answer", onAdd: () => setEditingRule({ ...BLANK_RULE, sortOrder: (rules.at(-1)?.sortOrder ?? 0) + 10 }) },
    });
    edge(e, "router", "add-rule", false, { sourceHandle: "match", muted: true, dashed: true });

    const tool = (id: string, x: number, y: number, d: Omit<ToolData, "hit" | "dim">, on: boolean) =>
      n.push({ id, type: "tool", position: { x, y }, data: { ...d, ...lit(on) } });

    tool("reply", X[3], mid, { icon: Reply, tone: "sky", title: "Send reply", subtitle: "Rule answer + its buttons and link", kind: "end" }, Boolean(hitRule));

    // AI lane
    n.push({ id: "agent", type: "agent", position: { x: X[2] - 10, y: yAI }, data: { kb: knowledge.filter((k) => k.enabled).length, ...lit(viaAI) } });
    edge(e, "router", "agent", viaAI, { sourceHandle: "miss", label: "no match" });

    tool("ai-reply", X[3], yAI - 70, { icon: MessageSquareText, tone: "sky", title: "Reply", subtitle: "Your answer, with product cards and links", kind: "end" }, viaAI);
    tool("quote", X[3], yAI + 40, { icon: FileText, tone: "orange", title: "Quote form", subtitle: "4 questions: items, quantity, city, contact", kind: "step", href: "#quotes" }, hitQuote);
    tool("inbox", X[3], yAI + 150, { icon: Inbox, tone: "amber", title: "Question inbox", subtitle: data.unsure ? `${data.unsure} the AI wasn't sure about` : "Every AI question is logged", kind: "end", href: "#inbox" }, viaAI);
    edge(e, "agent", "ai-reply", viaAI);
    edge(e, "agent", "quote", false, { dashed: true });
    edge(e, "agent", "inbox", viaAI, { dashed: true });

    tool("email", X[4], yAI - 10, { icon: Mail, tone: "emerald", title: "Email alert", subtitle: "New quote request to your inbox", kind: "end" }, hitQuote);
    tool("whatsapp", X[4], yAI + 100, { icon: MessageCircle, tone: "emerald", title: "WhatsApp hand-off", subtitle: data.settings.whatsapp ? `+${data.settings.whatsapp}` : "Set a number in Settings", kind: "end", href: "#settings" }, hitQuote);
    edge(e, "quote", "email", hitQuote);
    edge(e, "quote", "whatsapp", hitQuote);

    // Tools hanging under the agent, n8n sub-node style
    const tools: { id: string; w: number }[] = [
      ...categories.map((c) => ({ id: `kb:${c}`, w: 240 })),
      { id: "catalogue", w: 220 },
      { id: "instructions", w: 220 },
      { id: "add-kb", w: 240 },
    ];
    const gap = 30;
    const totalW = tools.reduce((s, t) => s + t.w, 0) + gap * (tools.length - 1);
    let x = X[2] + 120 - totalW / 2;
    const yTools = yAI + 230;
    for (const t of tools) {
      if (t.id.startsWith("kb:")) {
        const c = t.id.slice(3);
        n.push({
          id: t.id,
          type: "knowledge",
          position: { x, y: yTools },
          data: {
            category: c,
            entries: knowledge.filter((k) => k.category === c).sort((a, b) => a.sortOrder - b.sortOrder),
            pendingId,
            onEdit: (k: KnowledgeRow) => setKbDraft(k),
            onToggle: (k: KnowledgeRow) => toggleKnowledge(k),
            onAdd: () => setKbDraft({ ...BLANK_KNOWLEDGE, category: c, sortOrder: (knowledge.at(-1)?.sortOrder ?? 0) + 10 }),
            ...lit(viaAI),
          },
        });
        edge(e, t.id, "agent", viaAI, { targetHandle: "tools", dashed: true, tool: true });
      } else if (t.id === "catalogue") {
        tool(t.id, x, yTools, { icon: Boxes, tone: "violet", title: "Live catalogue", subtitle: "Products, prices, SKUs and stock", kind: "tool", href: "/admin/products" }, viaAI);
        edge(e, t.id, "agent", viaAI, { targetHandle: "tools", dashed: true, tool: true });
      } else if (t.id === "instructions") {
        tool(t.id, x, yTools, {
          icon: ScrollText,
          tone: "violet",
          title: "Synonyms",
          subtitle: data.settings.synonyms ? `${data.settings.synonyms.split("\n").filter((l) => l.includes(":")).length} word groups, typos fixed` : "Add in Settings: furnace = furnance…",
          kind: "tool",
          href: "#settings",
        }, viaAI);
        edge(e, t.id, "agent", viaAI, { targetHandle: "tools", dashed: true, tool: true });
      } else {
        n.push({
          id: t.id,
          type: "add",
          position: { x, y: yTools },
          data: { label: "Add knowledge", onAdd: () => setKbDraft({ ...BLANK_KNOWLEDGE, sortOrder: (knowledge.at(-1)?.sortOrder ?? 0) + 10 }) },
        });
      }
      x += t.w + gap;
    }
    return { nodes: n, edges: e };
  }, [data, rules, knowledge, categories, pendingId, testing, hitRule, viaAI, hitQuote, toggleRule, toggleKnowledge]);

  return (
    <section id="flow" className="scroll-mt-28 overflow-hidden rounded-xl border border-border bg-background shadow-xs">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Conversation flow</h2>
          <p className="text-sm text-muted-foreground">How every message moves through the bot. Click a node to edit it, use the switches to turn things on or off.</p>
        </div>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={test} onChange={(e) => setTest(e.target.value)} placeholder="Test a message, e.g. delivery fee?" className="pl-9" aria-label="Test a message" />
        </div>
      </div>
      {testing ? (
        <p className="border-b border-border bg-primary/5 px-4 py-2 text-xs sm:px-5">
          {hitRule ? (
            <>
              Matches the quick answer <b>{hitRule}</b>
              {hitQuote ? ", then starts the quote form" : ""}.
            </>
          ) : (
            <>No quick answer matches, so the <b>AI agent</b> answers using the knowledge base and catalogue.</>
          )}
        </p>
      ) : null}

      <div className="chatbot-flow h-[70dvh] min-h-[420px] md:h-[640px]">
        {loading && !data ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading flow…</p>
        ) : error ? (
          <p className="flex h-full items-center justify-center p-6 text-center text-sm text-destructive">{error}</p>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.12 }}
            minZoom={0.2}
            maxZoom={1.5}
            nodesConnectable={false}
            edgesFocusable={false}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="var(--border)" />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable className="!hidden md:!block" nodeStrokeWidth={2} />
          </ReactFlow>
        )}
      </div>

      <RuleDialog rule={editingRule} onClose={() => setEditingRule(null)} />
      <KnowledgeDialog draft={kbDraft} categories={categories} onClose={() => setKbDraft(null)} />
    </section>
  );
}

function edge(
  list: Edge[],
  source: string,
  target: string,
  hit: boolean,
  o: { sourceHandle?: string; targetHandle?: string; label?: string; dashed?: boolean; muted?: boolean; tool?: boolean } = {},
) {
  list.push({
    id: `${source}->${target}`,
    source,
    target,
    sourceHandle: o.sourceHandle,
    targetHandle: o.targetHandle,
    label: o.label,
    animated: hit,
    type: o.tool ? "smoothstep" : "default",
    style: {
      stroke: hit ? "var(--primary)" : o.tool ? "var(--color-violet-400, #a78bfa)" : "var(--muted-foreground)",
      strokeWidth: hit ? 2.5 : 1.5,
      strokeDasharray: o.dashed && !hit ? "5 4" : undefined,
      opacity: o.muted ? 0.35 : hit ? 1 : 0.6,
    },
    labelStyle: { fontSize: 10, fill: "var(--muted-foreground)" },
    labelBgStyle: { fill: "var(--background)" },
  });
}
