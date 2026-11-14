import { FAQS, type Faq } from "./config";

const STOP = new Set(["a","an","the","is","are","do","does","you","i","to","of","for","and","in","on","it","can","me","my","we","your","have","has","what","how","with","please","get","there","any","need","want","u"]);

const SYN: Record<string, string> = {
  deliver: "delivery", delivering: "delivery", delivered: "delivery", shipping: "delivery", ship: "delivery",
  prices: "price", pricing: "price", cost: "price", costs: "price", rate: "price", rates: "price", quote: "price", quotes: "price", estimate: "price",
  buy: "order", purchase: "order", ordering: "order",
  hrs: "hours", timings: "hours", timing: "hours",
  pickup: "pickup", collect: "pickup",
};

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function canon(w: string) {
  if (SYN[w]) return SYN[w];
  return w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w;
}

function tokens(s: string) {
  return normalize(s).split(" ").filter((w) => w && !STOP.has(w)).map(canon);
}

function lev(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

const INDEX = FAQS.map((f) => ({
  faq: f,
  words: new Set(f.keywords.filter((k) => !k.includes(" ")).map((k) => canon(normalize(k)))),
  phrases: f.keywords.filter((k) => k.includes(" ")).map(normalize),
}));

export function answer(input: string): Faq | null {
  const text = normalize(input);
  if (!text) return null;
  const toks = tokens(input);
  let best: { score: number; faq: Faq } | null = null;

  for (const e of INDEX) {
    let score = 0;
    for (const p of e.phrases) if (text.includes(p)) score += 3;
    for (const t of toks) {
      if (e.words.has(t)) score += 2;
      else if (t.length >= 5) {
        for (const w of e.words) if (w.length >= 5 && lev(t, w) <= 1) { score += 1.5; break; }
      }
    }
    if (score > 0 && (!best || score > best.score)) best = { score, faq: e.faq };
  }
  // Long messages need stronger evidence before we trust a rule
  const min = toks.length > 6 ? 4 : 1.5;
  return best && best.score >= min ? best.faq : null;
}