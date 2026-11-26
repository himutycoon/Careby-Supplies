/*
 * The free answer engine: no AI, no per-message cost.
 *
 * It finds the best answer you have already written (knowledge entries,
 * verified answers, quick answers) and real products from the catalogue,
 * and says so plainly when it has nothing, so the question lands in the
 * admin inbox to be taught. Pure functions only (data is passed in), so it
 * runs anywhere and can be tested on its own.
 */

export type CoreEntry = {
  id: string;
  title: string;
  category: string;
  content: string;
  keywords: string[];
};

export type CoreRule = { id: string; keywords: string[]; answer: string; action?: string };

export type CoreProduct = {
  id: string;
  name: string;
  sku: string | null;
  brand: string;
  category: string;
  price: number;
  unit: string;
  stock: string;
  url: string;
};

export type CoreContext = {
  entries: CoreEntry[];
  rules: CoreRule[];
  synonyms: Map<string, string>;
  /** extra words to correct typos against (product names, tags) */
  vocab: Set<string>;
  categories: { id: string; name: string }[];
  searchProducts: (query: string, category?: string) => Promise<CoreProduct[]>;
};

export type CoreReply = {
  reply: string;
  products: CoreProduct[];
  unsure: boolean;
  /** what answered, for the admin log: knowledge/rule id, "products", or "" */
  source: string;
};

// ── text ──────────────────────────────────────────────────────────

const STOP = new Set(
  (
    "a an the is are was were be been am do does did you i to of for and or in on at it its can could would should will me my we our us your " +
    "have has had what whats how with please pls plz get there any need want u im i'm this that these those from by as so if just also " +
    "hi hello hey thanks thank ok okay yes no tell know about like some much many more which who whom why where when help guide " +
    "give show find looking look let lets something somehow anything one ones kind type item items stuff thing things product products"
  ).split(" "),
);

/** Words that change *how* something is asked, not *what*: kept out of product search. */
const INTENT = new Set(
  "price prices pricing cost costs costing rate rates buy buying purchase sell selling sold have stock available availability carry order much quote estimate expect range cheap cheapest best recommend should".split(" "),
);

const BUILTIN_SYNONYMS: Record<string, string> = {
  ship: "delivery", shipping: "delivery", deliver: "delivery", delivering: "delivery", delivered: "delivery",
  pricing: "price", cost: "price", costs: "price", rate: "price", rates: "price", charge: "price", charges: "price", fee: "price", fees: "price",
  refund: "return", refunds: "return", exchange: "return",
  timing: "hours", timings: "hours", hrs: "hours", open: "hours",
  phone: "contact", email: "contact", call: "contact", reach: "contact",
  installation: "install", installer: "install", installing: "install", installed: "install",
  locations: "location", cities: "city", areas: "area",
};

export function normalize(s: string) {
  return s.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9/\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function stem(w: string) {
  if (w.length > 5 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.length > 4 && w.endsWith("es") && /(sh|ch|x|ss)es$/.test(w)) return w.slice(0, -2);
  if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

/** Admin synonyms: "furnace: furnance, heater" (one group per line). */
export function parseSynonyms(text: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of (text || "").split(/\r?\n/)) {
    const m = /^([^:=]+)[:=](.+)$/.exec(line);
    if (!m) continue;
    const head = normalize(m[1]);
    if (!head) continue;
    for (const v of m[2].split(/[,;|]/)) {
      const w = normalize(v);
      if (w && w !== head) map.set(w, head);
    }
  }
  return map;
}

function applySynonyms(text: string, syn: Map<string, string>) {
  let t = ` ${normalize(text)} `;
  // multi-word variants first ("pick up" -> "pickup")
  for (const [variant, head] of syn) {
    if (variant.includes(" ")) t = t.split(` ${variant} `).join(` ${head} `);
  }
  return t
    .trim()
    .split(" ")
    .map((w) => syn.get(w) ?? BUILTIN_SYNONYMS[w] ?? w)
    .join(" ");
}

export function tokens(text: string, syn: Map<string, string> = new Map()): string[] {
  return applySynonyms(text, syn)
    .split(/[\s/-]+/)
    .filter((w) => w.length >= 2 && !STOP.has(w))
    .map(stem);
}

function lev(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** Fix typos ("furnance", "dryall") against words the store actually uses. */
function correct(words: string[], vocab: Set<string>): string[] {
  return words.map((w) => {
    if (w.length < 4 || vocab.has(w) || /\d/.test(w)) return w;
    const max = w.length >= 7 ? 2 : 1;
    let best = w;
    let bestD = max + 1;
    for (const v of vocab) {
      if (v.length < 4 || v[0] !== w[0]) continue;
      const d = lev(w, v, max);
      if (d < bestD) {
        bestD = d;
        best = v;
        if (d === 1) break;
      }
    }
    return best;
  });
}

// ── index ─────────────────────────────────────────────────────────

type Doc = {
  key: string;
  kind: "knowledge" | "rule";
  verified: boolean;
  title: string;
  answer: string;
  kw: Set<string>;
  titleW: Set<string>;
  body: Map<string, number>;
  phrases: string[];
};

function buildDocs(ctx: CoreContext): Doc[] {
  const docs: Doc[] = [];
  for (const e of ctx.entries) {
    const body = new Map<string, number>();
    for (const w of tokens(e.content, ctx.synonyms)) body.set(w, (body.get(w) ?? 0) + 1);
    docs.push({
      key: e.id,
      kind: "knowledge",
      verified: /^(answers?|verified|faq)/i.test(e.category),
      title: e.title,
      answer: e.content,
      kw: new Set(e.keywords.flatMap((k) => tokens(k, ctx.synonyms))),
      titleW: new Set(tokens(e.title, ctx.synonyms)),
      body,
      phrases: e.keywords.map(normalize).filter((k) => k.includes(" ")),
    });
  }
  for (const r of ctx.rules) {
    // greetings, thanks, category pointers and the quote starter are handled in the widget
    if (r.action || /^(greeting|thanks)$/.test(r.id) || r.id.startsWith("cat-") || r.answer.length < 25) continue;
    const body = new Map<string, number>();
    for (const w of tokens(r.answer, ctx.synonyms)) body.set(w, (body.get(w) ?? 0) + 1);
    docs.push({
      key: `rule:${r.id}`,
      kind: "rule",
      verified: false,
      title: r.id,
      answer: r.answer,
      kw: new Set(r.keywords.flatMap((k) => tokens(k, ctx.synonyms))),
      titleW: new Set(tokens(r.id.replace(/-/g, " "), ctx.synonyms)),
      body,
      phrases: r.keywords.map(normalize).filter((k) => k.includes(" ")),
    });
  }
  return docs;
}

type Hit = { doc: Doc; score: number; coverage: number };

function rank(docs: Doc[], q: string[], qText: string): Hit | null {
  if (!q.length || !docs.length) return null;
  const n = docs.length;
  const df = (t: string) => docs.filter((d) => d.kw.has(t) || d.titleW.has(t) || d.body.has(t)).length;
  const idf = new Map(q.map((t) => [t, Math.log(1 + n / (1 + df(t)))]));
  let best: Hit | null = null;
  for (const d of docs) {
    let score = 0;
    let matched = 0;
    for (const t of q) {
      const w = idf.get(t)!;
      let s = 0;
      if (d.kw.has(t)) s += 3;
      if (d.titleW.has(t)) s += 2;
      const tf = d.body.get(t) ?? 0;
      if (tf) s += Math.min(tf, 3) * 0.6;
      if (s) matched++;
      score += s * w;
    }
    for (const p of d.phrases) if (qText.includes(p)) score += 4;
    if (d.verified && d.titleW.size) {
      const overlap = [...d.titleW].filter((t) => q.includes(t)).length / d.titleW.size;
      if (overlap >= 0.6) score += 6 * overlap;
    }
    const coverage = matched / q.length;
    if (score > 0 && (!best || score > best.score)) best = { doc: d, score, coverage };
  }
  return best;
}

function confident(h: Hit | null, qLen: number): h is Hit {
  if (!h) return false;
  if (h.doc.verified && h.score >= 6) return true;
  const need = qLen >= 4 ? 0.4 : 0.5;
  return h.coverage >= need && h.score >= 2.5;
}

// ── replies ───────────────────────────────────────────────────────


/** Bare site paths in knowledge ("Link: /contact") become tappable links. */
function linkify(text: string) {
  // "(?<!\])\(" leaves existing markdown links "[Label](/path)" alone
  return text.replace(/(^|\s|(?<!\])\()(\/[a-z][a-z0-9-]*(?:\/[a-z0-9-]+)*)(?=[\s.,;:!?)]|$)/gi, (_, pre, path) => {
    const last = path.split("/").filter(Boolean).pop() ?? "page";
    const label = last.replace(/-/g, " ").replace(/^\w/, (c: string) => c.toUpperCase());
    return `${pre}[${label}](${path})`;
  });
}

function trimAnswer(text: string, max = 900) {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const end = Math.max(cut.lastIndexOf("\n\n"), cut.lastIndexOf(". "));
  return (end > max * 0.5 ? cut.slice(0, end + 1) : cut) + " …";
}

/**
 * Products that really match: every word of a 1-2 word request, or at
 * least two words of a longer one ("sump pump" in a long question), best
 * matches first.
 */
function productMatches(products: CoreProduct[], words: string[], syn: Map<string, string>, need = Math.min(words.length, 2)) {
  if (!words.length) return [];
  return products
    .map((p) => {
      const hay = new Set(tokens(`${p.name} ${p.brand} ${p.sku ?? ""} ${p.category}`, syn));
      const sku = (p.sku ?? "").toLowerCase();
      return { p, m: words.filter((w) => hay.has(w) || (sku && w.length >= 3 && sku.includes(w))).length };
    })
    .filter((x) => x.m >= need)
    .sort((a, b) => b.m - a.m)
    .map((x) => x.p);
}

const UNSURE =
  "I don't have an answer for that yet, so I've passed your question to our team. For a quick reply, tap **Get a quote** or chat with an expert on WhatsApp.";

async function attempt(question: string, ctx: CoreContext, docs: Doc[], vocab: Set<string>): Promise<CoreReply | null> {
  const qText = normalize(applySynonyms(question, ctx.synonyms));
  const q = [...new Set(correct(tokens(question, ctx.synonyms), vocab))];
  if (!q.length) return null;

  const kb = rank(docs, q, qText);
  const kbOk = confident(kb, q.length);

  // Product side: what's left once "price / do you have / buy" words are removed.
  const productWords = q.filter((w) => !INTENT.has(w));
  // A category named in the question ("electrical", "flooring"), allowing
  // for close forms like "electric" / "electrical".
  const cat = ctx.categories.find((c) => {
    const ct = tokens(c.name, ctx.synonyms).filter((w) => w.length >= 4);
    return ct.length > 0 && ct.some((w) => q.some((t) => t.length >= 5 && (w.startsWith(t) || t.startsWith(w))));
  });
  const catWords = cat ? new Set(tokens(cat.name, ctx.synonyms)) : new Set<string>();
  let products: CoreProduct[] = [];
  if (productWords.length) {
    const found = await ctx.searchProducts(productWords.join(" "));
    products = productMatches(found, productWords, ctx.synonyms);
  }
  if (!products.length && cat && !kbOk) {
    // Inside the category, prefer products matching the other words ("ceiling").
    const inCat = await ctx.searchProducts("", cat.id);
    const rest = productWords.filter((w) => ![...catWords].some((c) => c.startsWith(w) || w.startsWith(c)));
    const narrowed = rest.length ? productMatches(inCat, rest, ctx.synonyms, 1) : [];
    products = (narrowed.length ? narrowed : inCat).slice(0, 4);
  }

  // A knowledge answer that covers the question well wins; products ride along.
  if (kbOk && (kb.coverage >= 0.75 || !products.length)) {
    const text = linkify(trimAnswer(kb.doc.answer));
    return {
      reply: products.length ? `${text}\n\nRelated products are below.` : text,
      products: products.slice(0, 4),
      unsure: false,
      source: kb.doc.key,
    };
  }
  if (products.length) {
    // The customer's own words, not the stemmed ones ("electric ceiling", not "electric ceil").
    const surface = normalize(question)
      .split(" ")
      .filter((w) => w.length >= 2 && !STOP.has(w) && !INTENT.has(w) && !INTENT.has(stem(w)));
    const what = surface.length && surface.length <= 4 ? surface.join(" ") : cat ? cat.name.toLowerCase() : "that";
    return {
      reply: `Here's what we have for "${what}". Tap a product for details, or **Get a quote** for bulk or project pricing.`,
      products: products.slice(0, 4),
      unsure: false,
      source: "products",
    };
  }
  if (kbOk) return { reply: linkify(trimAnswer(kb.doc.answer)), products: [], unsure: false, source: kb.doc.key };
  return null;
}

export async function answerLocal(history: { role: "user" | "assistant"; content: string }[], ctx: CoreContext): Promise<CoreReply> {
  const users = history.filter((m) => m.role === "user").map((m) => m.content);
  const question = users.at(-1) ?? "";
  const docs = buildDocs(ctx);
  const vocab = new Set(ctx.vocab);
  for (const d of docs) for (const s of [d.kw, d.titleW, d.body.keys()]) for (const w of s) vocab.add(w);

  const first = await attempt(question, ctx, docs, vocab);
  if (first) return first;
  // Short follow-ups ("how much is it?") borrow the previous question's subject.
  if (users.length > 1 && tokens(question, ctx.synonyms).length <= 3) {
    const again = await attempt(`${users.at(-2)} ${question}`, ctx, docs, vocab);
    if (again) return again;
  }
  return { reply: UNSURE, products: [], unsure: true, source: "" };
}
