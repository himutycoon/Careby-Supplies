"use client";

import { Sparkles } from "lucide-react";

/** Opens the chat widget (components/shared/chat-widget.tsx) with a question. */
export function openChat(message?: string) {
  window.dispatchEvent(new CustomEvent("careby:open-chat", { detail: { message } }));
}

const EXAMPLES = ["Do you deliver to Brampton?", "Price of 1/2\" plywood", "Which plan do I need?"];

/**
 * A hero-sized way into the assistant, for the dark hero band. Tapping an
 * example opens the chat and asks it straight away.
 */
export function AskAssistant() {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/15 bg-white/[0.06] p-3 backdrop-blur-sm sm:flex-row sm:items-center sm:gap-3">
      <button
        type="button"
        onClick={() => openChat()}
        className="press flex items-center gap-2.5 text-left"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-hi-vis text-hi-vis-foreground">
          <Sparkles className="size-4" aria-hidden="true" />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-semibold text-ink-foreground">Not sure what you need?</span>
          <span className="block text-xs text-ink-foreground/70">Ask our AI assistant: products, SKUs, prices, delivery</span>
        </span>
      </button>
      <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] sm:ml-auto">
        {EXAMPLES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => openChat(q)}
            className="shrink-0 rounded-full border border-white/20 px-2.5 py-1 text-xs text-ink-foreground/85 transition hover:bg-white/10"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
