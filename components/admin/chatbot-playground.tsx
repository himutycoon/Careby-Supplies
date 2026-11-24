"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUp, Package, RotateCcw, Sparkles } from "lucide-react";
import { previewBot, type PreviewReply, type PreviewTurn } from "@/services/chatbot";
import { cn } from "@/lib/utils";

type Turn = PreviewTurn & { meta?: Omit<PreviewReply, "reply">; error?: boolean };

const SUGGESTIONS = [
  "Do you deliver to Brampton?",
  "Price of 1/2\" plywood?",
  "Which new-build plan should I pick?",
  "Do you install flooring?",
];

/**
 * Chat-style tester for the live assistant. Same /api/chat request the
 * website widget sends (with preview: true, so nothing is logged).
 */
export function ChatbotPlayground() {
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement>(null);
  const scroller = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const history: PreviewTurn[] = turns.filter((t) => !t.error).map(({ role, content }) => ({ role, content }));
    setTurns((t) => [...t, { role: "user", content: q }]);
    setInput("");
    setBusy(true);
    const r = await previewBot(q, history);
    setBusy(false);
    if (r.ok) {
      const { reply, ...meta } = r.data;
      setTurns((t) => [...t, { role: "assistant", content: reply, meta }]);
    } else {
      setTurns((t) => [...t, { role: "assistant", content: r.error, error: true }]);
    }
  }

  return (
    <div className="flex h-[min(520px,75dvh)] flex-col overflow-hidden rounded-xl border border-border bg-background shadow-xs">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Playground</p>
            <p className="text-xs text-muted-foreground">Live knowledge &amp; catalogue · not logged</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setTurns([])}
          disabled={!turns.length || busy}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" /> Clear
        </button>
      </div>

      <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4 text-sm" aria-live="polite">
        {turns.length === 0 && !busy ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div>
              <p className="font-semibold">Test the assistant like a customer would</p>
              <p className="mt-1 text-xs text-muted-foreground">Ask about products, prices, delivery or plans.</p>
            </div>
            <div className="flex max-w-md flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:border-primary/40 hover:bg-primary/5"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {turns.map((t, i) =>
          t.role === "user" ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-primary-foreground">
                {t.content}
              </p>
            </div>
          ) : (
            <div key={i} className="flex flex-col items-start gap-2">
              <p
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-md border px-3.5 py-2",
                  t.error ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-border bg-background",
                )}
              >
                {t.error ? <AlertTriangle className="mr-1.5 inline size-3.5" aria-hidden="true" /> : null}
                {t.content}
              </p>
              {t.meta?.products.length ? (
                <div className="grid w-full max-w-[85%] gap-1.5">
                  {t.meta.products.map((p) => (
                    <Link
                      key={p.id}
                      href={p.url}
                      target="_blank"
                      className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-2.5 py-2 text-xs transition hover:border-primary/40"
                    >
                      <Package className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                      <span className="shrink-0 tabular-nums">
                        ${p.price.toFixed(2)}/{p.unit}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : null}
              {t.meta && (t.meta.unsure || t.meta.startQuote) ? (
                <div className="flex gap-1.5">
                  {t.meta.unsure ? (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                      Not sure: add this to the knowledge base
                    </span>
                  ) : null}
                  {t.meta.startQuote ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      Opens the quote form
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          ),
        )}

        {busy ? (
          <div className="flex w-fit gap-1 rounded-2xl rounded-bl-md border border-border bg-background px-3.5 py-3" aria-label="Assistant is typing">
            {[0, 150, 300].map((d) => (
              <span key={d} className="size-1.5 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything a customer might…"
          maxLength={500}
          className="h-10 min-w-0 flex-1 rounded-full border border-input bg-muted/40 px-4 text-sm outline-none transition focus:border-primary/50 focus:bg-background focus:ring-3 focus:ring-primary/15"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
        >
          <ArrowUp className="size-4" />
        </button>
      </form>
    </div>
  );
}
