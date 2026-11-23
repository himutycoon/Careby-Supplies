"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUp, Headset, Package, ReceiptText, RotateCcw, Sparkles, Truck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { answer, saysMoreThan } from "@/lib/chatbot/engine";
import { FAQS, GREETING, WELCOME_CHIPS, WHATSAPP, type Faq } from "@/lib/chatbot/config";

type BotConfig = {
  enabled: boolean;
  aiEnabled?: boolean;
  rules: Faq[];
  greeting: string;
  welcomeChips: string[];
  whatsapp: string;
};

// Used until /api/chat/config answers, and if it never does.
const BUILT_IN: BotConfig = {
  enabled: true,
  rules: FAQS,
  greeting: GREETING,
  welcomeChips: WELCOME_CHIPS,
  whatsapp: WHATSAPP,
};

const waLink = (number: string, text: string) =>
  `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

type CardProduct = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  unit: string;
  stock: string;
  imageUrl: string | null;
  url: string;
};

type Msg = {
  role: "user" | "assistant";
  content: string;
  chips?: string[];
  link?: { label: string; href: string };
  wa?: boolean;
  products?: CardProduct[];
};

const STOCK_LABEL: Record<string, string> = {
  "in-stock": "In stock",
  "low-stock": "Low stock",
  "out-of-stock": "Out of stock",
};

const safeHref = (h: string) => (h.startsWith("/") && !h.startsWith("//")) || /^https:\/\//.test(h);

/** Renders [label](href) links and **bold** from AI replies; everything else is plain text. */
function RichText({ text, onNavigate }: { text: string; onNavigate: () => void }) {
  const parts: React.ReactNode[] = [];
  const re = /\[([^\]]{1,120})\]\(([^)\s]{1,300})\)|\*\*([^*]{1,200})\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[3]) parts.push(<strong key={k++}>{m[3]}</strong>);
    else if (safeHref(m[2])) {
      parts.push(
        m[2].startsWith("/") ? (
          <Link key={k++} href={m[2]} onClick={onNavigate} className="font-medium underline underline-offset-2">
            {m[1]}
          </Link>
        ) : (
          <a key={k++} href={m[2]} target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-2">
            {m[1]}
          </a>
        ),
      );
    } else parts.push(m[1]);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

type Flow = { step: number; data: Record<string, string> } | null;

const STEPS = [
  { key: "name", ask: "What's your name?" },
  {
    key: "contact",
    ask: "Best phone number or email to reach you?",
    error: "That doesn't look like a valid phone or email. Please try again.",
    validate: (v: string) => /^\S+@\S+\.\S+$/.test(v) || v.replace(/\D/g, "").length >= 7,
  },
  { key: "items", ask: "What items and quantities do you need? (e.g. 40 sheets of 1/2\" drywall)" },
  { key: "city", ask: "Which city are you in?" },
] as const;

const FIRST: Msg = { role: "assistant", content: GREETING, chips: WELCOME_CHIPS };
const STORE = "careby-chat-v1";
const TEASER_KEY = "careby-teaser-off";
const SEEN_KEY = "careby-chat-seen";
const HIDDEN_TEASER = ["/admin", "/login", "/signup", "/forgot-password", "/reset-password", "/checkout"];

/** Example questions on the teaser and welcome screen. */
const STARTERS = [
  { icon: Package, label: "Find a product", ask: "Help me find a product" },
  { icon: Truck, label: "Delivery & pickup", ask: "Delivery" },
  { icon: ReceiptText, label: "Get a quote", ask: "Get a quote" },
  { icon: Sparkles, label: "Plans & pricing", ask: "What services and plans do you offer?" },
];
const MAX_AI_CALLS = 25; // per chat session; the server rate-limits too
const NUDGE_AFTER = 3; // user messages before suggesting an expert
const EXPERT_RE = /\b(expert|human|agent|whatsapp|real person|representative|talk to someone)\b/i;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function waText(msgs: Msg[]) {
  const mine = msgs
    .filter((m) => m.role === "user" && m.content.length > 12)
    .slice(-4)
    .map((m) => m.content);
  return (
    "Hi CareBy, I was chatting on your website." +
    (mine.length ? "\n\n" + mine.map((t) => "- " + t).join("\n") : "")
  );
}

export function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [msgs, setMsgs] = React.useState<Msg[]>([FIRST]);
  const [input, setInput] = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const [flow, setFlow] = React.useState<Flow>(null);
  const [teaser, setTeaser] = React.useState(false);
  // the teaser "types" for a moment before the greeting appears
  const [teaserTyped, setTeaserTyped] = React.useState(false);
  React.useEffect(() => {
    if (!teaser) return;
    const t = setTimeout(() => setTeaserTyped(true), 1100);
    return () => clearTimeout(t);
  }, [teaser]);
  const msgsRef = React.useRef<Msg[]>([FIRST]);
  const flowRef = React.useRef<Flow>(null);
  const aiCalls = React.useRef(0);
  const nudged = React.useRef(false);
  const endRef = React.useRef<HTMLDivElement>(null);
  const [cfg, setCfg] = React.useState<BotConfig>(BUILT_IN);
  const [hasTabBar, setHasTabBar] = React.useState(false);
  const [seen, setSeen] = React.useState(true);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const pendingRef = React.useRef<string | null>(null);
  const handleSendRef = React.useRef<((t: string) => Promise<void>) | null>(null);

  // unread dot on the launcher until the visitor opens the chat once
  React.useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSeen(Boolean(sessionStorage.getItem(SEEN_KEY)));
    } catch {}
  }, []);
  React.useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeen(true);
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {}
  }, [open]);

  // rules, greeting and WhatsApp number are edited in /admin/chatbot
  React.useEffect(() => {
    let live = true;
    fetch("/api/chat/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((c: BotConfig | null) => {
        if (!live || !c || !Array.isArray(c.rules)) return;
        setCfg(c);
        // swap in the admin greeting if the visitor hasn't started chatting
        setMsgs((p) =>
          p.length === 1 && p[0] === FIRST
            ? [{ role: "assistant", content: c.greeting, chips: c.welcomeChips }]
            : p,
        );
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  // restore saved chat
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORE);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved) && saved.length) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setMsgs(saved);
          nudged.current = saved.some((m: Msg) => m.wa);
        }
      }
    } catch {}
  }, []);

  // persist chat
  React.useEffect(() => {
    msgsRef.current = msgs;
    try {
      sessionStorage.setItem(STORE, JSON.stringify(msgs.slice(-40)));
    } catch {}
  }, [msgs]);

  React.useEffect(() => {
    flowRef.current = flow;
  }, [flow]);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing, open]);

  // The phone tab bar (Home / Shop / Services / Cart) sits along the
  // bottom on most layouts; the launcher has to clear it, not cover Cart.
  React.useEffect(() => {
    const check = () => setHasTabBar(Boolean(document.querySelector('[data-slot="mobile-tab-bar"]')));
    check();
    const t = setTimeout(check, 300); // layouts can mount after the widget
    return () => clearTimeout(t);
  }, [pathname]);

  // Any button on the site can open the chat, optionally with a question:
  // window.dispatchEvent(new CustomEvent("careby:open-chat", { detail: { message } }))
  React.useEffect(() => {
    function onOpen(e: Event) {
      const message = (e as CustomEvent<{ message?: string }>).detail?.message;
      setTeaser(false);
      if (message) pendingRef.current = message;
      setOpen(true);
    }
    window.addEventListener("careby:open-chat", onOpen);
    return () => window.removeEventListener("careby:open-chat", onOpen);
  }, []);

  // send a question that arrived with the open event, once the panel is up
  React.useEffect(() => {
    if (!open || !pendingRef.current) return;
    const m = pendingRef.current;
    pendingRef.current = null;
    const t = setTimeout(() => void handleSendRef.current?.(m), 50);
    return () => clearTimeout(t);
  }, [open]);

  // Esc closes; on phones the panel is full screen, so lock the page behind it
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const phone = window.matchMedia("(max-width: 639px)").matches;
    const prev = document.body.style.overflow;
    if (phone) document.body.style.overflow = "hidden";
    const f = phone ? undefined : setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 150);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      clearTimeout(f);
    };
  }, [open]);

  // teaser bubble on public pages, once per visit
  React.useEffect(() => {
    if (open || HIDDEN_TEASER.some((p) => pathname.startsWith(p))) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTeaser(false);
      return;
    }
    try {
      if (sessionStorage.getItem(TEASER_KEY)) return;
    } catch {}
    const show = setTimeout(() => setTeaser(true), pathname === "/" ? 1500 : 3500);
    return () => clearTimeout(show);
  }, [open, pathname]);

  function closeTeaser() {
    setTeaser(false);
    try {
      sessionStorage.setItem(TEASER_KEY, "1");
    } catch {}
  }

  async function botSay(m: Omit<Msg, "role">) {
    setTyping(true);
    await sleep(350);
    setTyping(false);
    setMsgs((p) => [...p, { role: "assistant", ...m }]);
  }

  function startFlow() {
    setFlow({ step: 0, data: {} });
    return botSay({ content: STEPS[0].ask, chips: ["Cancel"] });
  }

  async function submitLead(data: Record<string, string>) {
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 429) {
        nudged.current = true;
        await botSay({
          content: "You've sent a few requests already. Please chat with our expert on WhatsApp for faster help.",
          wa: true,
        });
        return;
      }
      if (!res.ok) throw new Error();
      nudged.current = true;
      await botSay({
        content: `Thanks ${data.name}! Your request is in. Our team will contact you on ${data.contact} soon. Want a faster reply? Chat with an expert on WhatsApp.`,
        wa: true,
        chips: ["Products", "Delivery"],
      });
    } catch {
      await botSay({ content: "Sorry, we couldn't send that. Please try again in a moment.", chips: ["Get a quote"] });
    }
  }

  async function askAI(text: string, fallback?: Faq | null) {
    const showRule = (hit: Faq) =>
      hit.action === "quote"
        ? botSay({ content: hit.answer }).then(startFlow)
        : botSay({ content: hit.answer, chips: hit.chips, link: hit.link });

    if (!cfg.aiEnabled && fallback) return showRule(fallback);
    if (aiCalls.current >= MAX_AI_CALLS) {
      if (fallback) return showRule(fallback);
      nudged.current = true;
      return botSay({
        content: "I'm not sure about that one. An expert can answer you directly on WhatsApp.",
        wa: true,
        chips: ["Get a quote"],
      });
    }
    aiCalls.current += 1;
    setTyping(true);
    try {
      // msgsRef already holds the user's message (handleSend added it)
      const history = msgsRef.current
        .slice(-12)
        .map((m) => ({ role: m.role, content: m.content }));
      if (history.at(-1)?.content !== text) history.push({ role: "user", content: text });
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, page: pathname }),
      });
      const data = await res.json();
      setTyping(false);
      if (!res.ok || !data.reply) throw new Error();
      const unsure = Boolean(data.unsure);
      if (unsure) nudged.current = true;
      setMsgs((p) => [
        ...p,
        {
          role: "assistant",
          content: data.reply,
          products: Array.isArray(data.products) ? data.products.slice(0, 4) : undefined,
          wa: unsure,
          chips: data.startQuote ? undefined : ["Get a quote", "Talk to expert"],
        },
      ]);
      if (data.startQuote && !flowRef.current) await startFlow();
    } catch {
      setTyping(false);
      if (fallback) return showRule(fallback);
      nudged.current = true;
      setMsgs((p) => [
        ...p,
        { role: "assistant", content: "I couldn't answer that right now. An expert can help you on WhatsApp.", wa: true, chips: ["Get a quote"] },
      ]);
    }
  }

  async function processMessage(text: string, fromChip = false) {
    // quote flow
    if (flowRef.current) {
      const f = flowRef.current;
      if (/^(cancel|stop|exit|quit)$/i.test(text)) {
        setFlow(null);
        return botSay({ content: "No problem, cancelled. Anything else?", chips: cfg.welcomeChips });
      }
      const s = STEPS[f.step];
      if ("validate" in s && !s.validate(text)) {
        return botSay({ content: s.error, chips: ["Cancel"] });
      }
      const data = { ...f.data, [s.key]: text };
      if (f.step + 1 < STEPS.length) {
        setFlow({ step: f.step + 1, data });
        return botSay({ content: STEPS[f.step + 1].ask, chips: ["Cancel"] });
      }
      setFlow(null);
      setTyping(true);
      await submitLead(data);
      setTyping(false);
      return;
    }

    // asks for a human / WhatsApp
    if (EXPERT_RE.test(text)) {
      nudged.current = true;
      return botSay({
        content: "Sure! Tap below to chat with our expert on WhatsApp. Your recent messages will be pre-filled.",
        wa: true,
        chips: ["Get a quote"],
      });
    }

    // rules answer quick questions and button taps instantly; anything that
    // asks more than a rule's keywords (a product, a size, a SKU) goes to
    // the AI, which has the knowledge base and the live catalogue.
    const hit = answer(text, cfg.rules);
    const useRule = hit && (fromChip || !cfg.aiEnabled || !saysMoreThan(text, hit));
    if (hit && useRule) {
      if (hit.action === "quote") {
        await botSay({ content: hit.answer });
        return startFlow();
      }
      return botSay({ content: hit.answer, chips: hit.chips, link: hit.link });
    }

    return askAI(text, hit);
  }

  async function handleSend(raw: string, fromChip = false) {
    const text = raw.trim();
    if (!text || typing) return;
    setInput("");
    setMsgs((p) => [...p, { role: "user", content: text }]);

    await processMessage(text, fromChip);

    // after a few messages, suggest an expert (once, never mid-quote)
    if (!nudged.current && !flowRef.current) {
      const userCount = msgsRef.current.filter((m) => m.role === "user").length;
      if (userCount >= NUDGE_AFTER) {
        nudged.current = true;
        await botSay({
          content: "Want faster help? You can continue this chat with one of our experts on WhatsApp.",
          wa: true,
        });
      }
    }
  }

  function reset() {
    setMsgs([{ role: "assistant", content: cfg.greeting, chips: cfg.welcomeChips }]);
    setFlow(null);
    aiCalls.current = 0;
    nudged.current = false;
    try {
      sessionStorage.removeItem(STORE);
    } catch {}
  }

  // the open-with-question effect calls the latest handleSend through this
  React.useEffect(() => {
    handleSendRef.current = (t: string) => handleSend(t);
  });

  const last = msgs[msgs.length - 1];
  const chips = !typing && last?.role === "assistant" ? last.chips : undefined;
  const wa = waLink(cfg.whatsapp, waText(msgs));
  const welcome = msgs.length === 1 && msgs[0].role === "assistant";
  const hasWa = cfg.whatsapp.length >= 10;

  // chatbot plan lapsed (only when CHATBOT_ENFORCE_BILLING=1)
  if (!cfg.enabled) return null;

  // Phones: above the tab bar when there is one. Desktop: normal corner inset.
  const corner = cn("fixed right-4 z-50 lg:right-6 lg:bottom-6", hasTabBar ? "bottom-tabbar" : "bottom-4");

  // ---------- closed state: launcher + teaser ----------
  if (!open) {
    return (
      // Desktop: the greeting sits beside the launcher, so it never covers
      // the Expert button stacked above it. Phones: above the launcher.
      <div className={cn(corner, "flex flex-col items-end gap-3 lg:flex-row lg:items-end")}>
        {teaser && (
          <div className="relative w-[288px] max-w-[calc(100vw-2rem)] rounded-2xl rounded-br-md border border-border bg-background p-3.5 text-sm text-foreground shadow-2xl duration-300 animate-in fade-in slide-in-from-bottom-3 lg:mb-1 lg:rounded-br-2xl">
            <button
              onClick={closeTeaser}
              aria-label="Dismiss"
              className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <X className="size-3.5" />
            </button>
            <div className="flex items-start gap-2.5 pr-6">
              <BotAvatar size="sm" />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                  CareBy AI Assistant
                  <span className="rounded bg-hi-vis px-1 py-px text-[9px] text-hi-vis-foreground">AI</span>
                </p>
                {teaserTyped ? (
                  <div className="duration-300 animate-in fade-in">
                    <p className="mt-1 font-semibold leading-snug">Hi! 👋 I&apos;m your CareBy assistant.</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      I can find products, check prices &amp; stock, and get you a quote in seconds.
                    </p>
                  </div>
                ) : (
                  <div className="mt-2 flex w-fit gap-1 rounded-full bg-muted px-3 py-2" aria-label="Assistant is typing">
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="size-1.5 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
            {teaserTyped && (
              <div className="mt-3 flex flex-wrap gap-1.5 duration-300 animate-in fade-in">
                {STARTERS.slice(0, 3).map((st) => (
                  <button
                    key={st.label}
                    onClick={() => {
                      closeTeaser();
                      pendingRef.current = st.ask;
                      setOpen(true);
                    }}
                    className="rounded-full border border-primary/25 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary transition hover:bg-primary/10"
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            )}
            {/* pointer: down at the launcher on phones, right at it on desktop */}
            <span className="absolute -bottom-1.5 right-6 size-3 rotate-45 border-b border-r border-border bg-background lg:hidden" aria-hidden="true" />
            <span className="absolute -right-1.5 bottom-5 hidden size-3 -rotate-45 border-b border-r border-border bg-background lg:block" aria-hidden="true" />
          </div>
        )}
        <button
          onClick={() => {
            closeTeaser();
            setOpen(true);
          }}
          aria-label="Open chat assistant"
          className="careby-chat-glow group relative flex h-14 shrink-0 items-center gap-2 rounded-full bg-gradient-to-br from-primary to-[oklch(0.28_0.09_262)] pl-2 pr-4 text-primary-foreground shadow-xl transition-transform hover:scale-[1.04] active:scale-95 sm:gap-2.5 sm:pr-5"
        >
          <span className="relative flex size-10 items-center justify-center rounded-full bg-white/15">
            <Sparkles className="size-5 transition-transform group-hover:rotate-12" />
            {!seen && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-hi-vis text-[10px] font-bold text-hi-vis-foreground ring-2 ring-primary">
                1
              </span>
            )}
          </span>
          <span className="text-left leading-tight">
            <span className="block text-sm font-semibold">
              <span className="sm:hidden">AI Assistant</span>
              <span className="hidden sm:inline">Ask CareBy AI</span>
            </span>
            <span className="hidden items-center gap-1 text-[11px] opacity-80 sm:flex">
              <span className="size-1.5 rounded-full bg-emerald-400" /> Online · instant answers
            </span>
          </span>
        </button>
      </div>
    );
  }

  // ---------- open state: full screen on phones, floating panel on desktop ----------
  return (
    <div
      role="dialog"
      aria-label="CareBy assistant"
      className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-background text-foreground duration-200 animate-in fade-in slide-in-from-bottom-4 sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(680px,calc(100dvh-3rem))] sm:w-[400px] sm:rounded-3xl sm:border sm:border-border sm:shadow-2xl"
    >
      {/* header */}
      <div className="pt-safe relative shrink-0 overflow-hidden bg-gradient-to-br from-primary to-[oklch(0.28_0.09_262)] text-primary-foreground">
        <div className="pointer-events-none absolute -right-10 -top-16 size-44 rounded-full bg-hi-vis/20 blur-2xl" aria-hidden="true" />
        <div className="relative flex items-center gap-3 px-4 py-3.5">
          <BotAvatar />
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold leading-tight">CareBy Assistant</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs opacity-85">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              Online · replies in seconds
            </div>
          </div>
          <button onClick={reset} aria-label="Restart chat" title="Start over" className="flex size-9 items-center justify-center rounded-full hover:bg-white/15">
            <RotateCcw className="size-4" />
          </button>
          <button onClick={() => setOpen(false)} aria-label="Close chat" className="flex size-9 items-center justify-center rounded-full hover:bg-white/15">
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* messages */}
      <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain bg-surface-muted/60 px-3 py-4 text-sm">
        {msgs.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end duration-200 animate-in fade-in slide-in-from-bottom-1">
              <div className="max-w-[82%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-primary-foreground shadow-sm">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex items-end gap-2 duration-200 animate-in fade-in slide-in-from-bottom-1">
              <BotAvatar size="xs" />
              <div className="flex min-w-0 max-w-[85%] flex-col items-start gap-2">
                <div className="whitespace-pre-wrap break-words rounded-2xl rounded-bl-md border border-border bg-background px-3.5 py-2.5 shadow-sm">
                  <RichText text={m.content} onNavigate={() => setOpen(false)} />
                </div>

                {welcome && i === 0 && (
                  <div className="grid w-full grid-cols-2 gap-2">
                    {STARTERS.map((st) => (
                      <button
                        key={st.label}
                        onClick={() => handleSend(st.ask, true)}
                        className="flex flex-col items-start gap-1.5 rounded-xl border border-border bg-background p-2.5 text-left text-xs font-medium shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow"
                      >
                        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <st.icon className="size-4" />
                        </span>
                        {st.label}
                      </button>
                    ))}
                  </div>
                )}

                {m.products && m.products.length > 0 && (
                  <div className="flex w-full flex-col gap-1.5">
                    {m.products.map((p) => (
                      <Link
                        key={p.id}
                        href={p.url}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl border border-border bg-background p-2 shadow-sm transition hover:border-primary/40 hover:shadow"
                      >
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt="" className="size-12 shrink-0 rounded-lg bg-muted object-cover" />
                        ) : (
                          <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Package className="size-5" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 text-xs font-semibold leading-snug">{p.name}</span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground">
                            <span className="font-semibold text-foreground">${p.price.toFixed(2)}</span>/ {p.unit}
                            {p.sku ? <span className="truncate">· {p.sku}</span> : null}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            p.stock === "out-of-stock"
                              ? "bg-destructive/10 text-destructive"
                              : p.stock === "low-stock"
                                ? "bg-warning/15 text-warning-foreground dark:text-warning"
                                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                          )}
                        >
                          {STOCK_LABEL[p.stock] ?? p.stock}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}

                {m.link && (
                  <Link
                    href={m.link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-primary/30 bg-background px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/5"
                  >
                    {m.link.label} →
                  </Link>
                )}
                {m.wa && hasWa && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
                  >
                    <Headset className="size-3.5" /> Continue with an expert on WhatsApp
                  </a>
                )}
              </div>
            </div>
          ),
        )}
        {typing && (
          <div className="flex items-end gap-2">
            <BotAvatar size="xs" />
            <div className="flex gap-1 rounded-2xl rounded-bl-md border border-border bg-background px-3.5 py-3 shadow-sm">
              {[0, 150, 300].map((d) => (
                <span key={d} className="size-1.5 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* quick replies */}
      {chips && chips.length > 0 && !welcome && (
        <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-border bg-background px-3 py-2 [scrollbar-width:none]">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => handleSend(c, true)}
              className="shrink-0 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10"
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* composer */}
      <div className="pb-safe shrink-0 border-t border-border bg-background">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex items-center gap-2 px-3 pt-3"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={flow ? "Type your answer…" : "Ask about a product, SKU or delivery…"}
            maxLength={500}
            enterKeyHint="send"
            className="h-11 min-w-0 flex-1 rounded-full border border-input bg-surface-muted px-4 text-[16px] outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background focus:ring-3 focus:ring-primary/15 sm:text-sm"
          />
          <button
            type="submit"
            disabled={typing || !input.trim()}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow transition hover:scale-105 disabled:scale-100 disabled:opacity-40"
            aria-label="Send"
          >
            <ArrowUp className="size-5" />
          </button>
        </form>
        <p className="px-4 pb-2.5 pt-1.5 text-center text-[11px] text-muted-foreground">
          AI assistant · prices and stock are live from our catalogue
          {hasWa ? (
            <>
              {" · "}
              <a href={wa} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline-offset-2 hover:underline">
                Talk to a person
              </a>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}

function BotAvatar({ size = "md" }: { size?: "xs" | "sm" | "md" }) {
  const box = size === "xs" ? "size-7" : size === "sm" ? "size-9" : "size-10";
  const icon = size === "xs" ? "size-3.5" : "size-5";
  return (
    <span
      className={cn(
        box,
        "relative flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-hi-vis to-[oklch(0.8_0.17_80)] text-hi-vis-foreground shadow-sm",
      )}
      aria-hidden="true"
    >
      <Sparkles className={icon} />
    </span>
  );
}
