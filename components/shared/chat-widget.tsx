"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Send, RotateCcw } from "lucide-react";
import { answer } from "@/lib/chatbot/engine";
import { FAQS, GREETING, WELCOME_CHIPS, WHATSAPP, type Faq } from "@/lib/chatbot/config";

type BotConfig = {
  enabled: boolean;
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

type Msg = {
  role: "user" | "assistant";
  content: string;
  chips?: string[];
  link?: { label: string; href: string };
  wa?: boolean;
};

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
  const msgsRef = React.useRef<Msg[]>([FIRST]);
  const flowRef = React.useRef<Flow>(null);
  const aiCalls = React.useRef(0);
  const nudged = React.useRef(false);
  const endRef = React.useRef<HTMLDivElement>(null);
  const [cfg, setCfg] = React.useState<BotConfig>(BUILT_IN);

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

  // home page teaser bubble
  React.useEffect(() => {
    if (open || pathname !== "/") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTeaser(false);
      return;
    }
    try {
      if (sessionStorage.getItem(TEASER_KEY)) return;
    } catch {}
    const show = setTimeout(() => setTeaser(true), 2000);
    const hide = setTimeout(() => setTeaser(false), 14000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
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

  async function askAI(text: string) {
    if (aiCalls.current >= 5) {
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
      const history = [...msgsRef.current, { role: "user" as const, content: text }]
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      setTyping(false);
      if (!res.ok || !data.reply) throw new Error();
      setMsgs((p) => [...p, { role: "assistant", content: data.reply, chips: ["Get a quote", "Talk to expert"] }]);
    } catch {
      setTyping(false);
      nudged.current = true;
      setMsgs((p) => [
        ...p,
        { role: "assistant", content: "I couldn't answer that right now. An expert can help you on WhatsApp.", wa: true, chips: ["Get a quote"] },
      ]);
    }
  }

  async function processMessage(text: string) {
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

    // rules
    const hit = answer(text, cfg.rules);
    if (hit) {
      if (hit.action === "quote") {
        await botSay({ content: hit.answer });
        return startFlow();
      }
      return botSay({ content: hit.answer, chips: hit.chips, link: hit.link });
    }

    return askAI(text);
  }

  async function handleSend(raw: string) {
    const text = raw.trim();
    if (!text || typing) return;
    setInput("");
    setMsgs((p) => [...p, { role: "user", content: text }]);

    await processMessage(text);

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

  const last = msgs[msgs.length - 1];
  const chips = !typing && last?.role === "assistant" ? last.chips : undefined;
  const wa = waLink(cfg.whatsapp, waText(msgs));

  // chatbot plan lapsed (only when CHATBOT_ENFORCE_BILLING=1)
  if (!cfg.enabled) return null;

  // ---------- closed state: floating button + teaser ----------
  if (!open) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-end gap-3">
        {teaser && (
          <div className="careby-float relative mb-2 max-w-[230px] rounded-2xl rounded-br-sm border bg-background px-4 py-3 text-sm text-foreground shadow-xl">
            <button
              onClick={closeTeaser}
              aria-label="Dismiss"
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs hover:bg-border"
            >
              ×
            </button>
            <button
              onClick={() => {
                closeTeaser();
                setOpen(true);
              }}
              className="text-left"
            >
              <span className="block font-semibold">Hi! 👋 I&apos;m your Supplies Assistant</span>
              <span className="text-muted-foreground">Talk to me for quotes, delivery and product help.</span>
            </button>
          </div>
        )}
        <button
          onClick={() => {
            closeTeaser();
            setOpen(true);
          }}
          className="careby-float relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
          aria-label="Open chat"
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-30" />
          <MessageCircle className="relative h-6 w-6" />
        </button>
      </div>
    );
  }

  // ---------- open state: chat window ----------
  return (
    <div className="fixed bottom-4 right-4 z-50 flex h-[70vh] max-h-[560px] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border bg-background text-foreground shadow-2xl sm:w-[380px]">
      <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
        <div>
          <div className="text-sm font-semibold">CareBy Assistant</div>
          <div className="text-xs opacity-80">Typically replies instantly</div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-[#25D366] px-2.5 py-1 text-xs font-semibold text-white"
          >
            WhatsApp
          </a>
          <button onClick={reset} aria-label="Restart chat" title="Restart">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button onClick={() => setOpen(false)} aria-label="Close chat">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex flex-col items-start gap-2"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground"
                  : "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-muted px-3 py-2"
              }
            >
              {m.content}
            </div>
            {m.link && (
              <Link
                href={m.link.href}
                onClick={() => setOpen(false)}
                className="rounded-full border px-3 py-1 text-xs font-medium hover:bg-muted"
              >
                {m.link.label} →
              </Link>
            )}
            {m.wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[#25D366] px-4 py-2 text-xs font-semibold text-white shadow hover:opacity-90"
              >
                Continue on WhatsApp →
              </a>
            )}
          </div>
        ))}
        {typing && (
          <div className="flex w-fit gap-1 rounded-2xl rounded-bl-sm bg-muted px-3 py-3">
            {[0, 150, 300].map((d) => (
              <span
                key={d}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                style={{ animationDelay: `${d}ms` }}
              />
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {chips && chips.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 pb-2">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => handleSend(c)}
              className="rounded-full border px-3 py-1 text-xs font-medium transition hover:bg-muted"
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-t p-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
          placeholder={flow ? "Type your answer..." : "Type your question..."}
          maxLength={500}
          className="h-9 flex-1 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={() => handleSend(input)}
          disabled={typing || !input.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}