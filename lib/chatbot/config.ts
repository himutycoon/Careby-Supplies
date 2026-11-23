export const BUSINESS = {
  name: "CareBy Supplies",
  // EDIT: real details
  phone: "",
  email: "",
  hours: "Mon-Sat, 9am-6pm",
  address: "",
};

// EDIT: WhatsApp number, digits only with country code, no + or spaces (e.g. Canada: "14165551234")
export const WHATSAPP = "14375224606"; // same number as CONTACT_INFO in data/mock.ts

export function waLink(text: string) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
}

export const GREETING =
  "Hi! I'm the CareBy assistant. I can help with products, delivery and quotes. What do you need?";

export const WELCOME_CHIPS = ["Get a quote", "Delivery", "Products", "Talk to expert"];

export type Faq = {
  id: string;
  keywords: string[];
  answer: string;
  chips?: string[];
  link?: { label: string; href: string };
  action?: "quote";
};

const PRODUCTS_URL = "/products";

// Matches the categories on your home page.
// EDIT: if a category has its own page, change its href (e.g. "/products/lumber-wood").
export const CATEGORIES = [
  { name: "Lumber & Wood", keywords: ["lumber", "wood", "2x4", "2x6", "plywood", "timber", "osb", "stud", "spruce"], href: PRODUCTS_URL },
  { name: "Flooring", keywords: ["flooring", "floor", "laminate", "vinyl", "hardwood", "tile"], href: PRODUCTS_URL },
  { name: "Plumbing", keywords: ["plumbing", "pipe", "faucet", "valve", "pvc", "toilet", "sink"], href: PRODUCTS_URL },
  { name: "Electrical", keywords: ["electrical", "wire", "wiring", "outlet", "breaker", "switch", "cable"], href: PRODUCTS_URL },
  { name: "Doors & Windows", keywords: ["door", "doors", "window", "windows"], href: PRODUCTS_URL },
  { name: "Roofing", keywords: ["roofing", "roof", "shingle", "shingles", "eavestrough"], href: PRODUCTS_URL },
  { name: "Hardware", keywords: ["hardware", "screw", "nail", "bolt", "fastener", "hinge", "tool", "tools"], href: PRODUCTS_URL },
  { name: "Paint & Finishes", keywords: ["paint", "primer", "stain", "coating", "finish", "finishes"], href: PRODUCTS_URL },
];

export const FAQS: Faq[] = [
  {
    id: "greeting",
    keywords: ["hi", "hello", "hey", "good morning", "good evening", "good afternoon"],
    answer: "Hello! How can I help you today?",
    chips: WELCOME_CHIPS,
  },
  {
    id: "thanks",
    keywords: ["thanks", "thank you", "thx", "appreciate"],
    answer: "You're welcome! Anything else I can help with?",
    chips: ["Get a quote", "Talk to expert"],
  },
  {
    id: "quote",
    keywords: ["quote", "get a quote", "estimate", "price", "pricing", "cost", "how much", "order", "buy", "rate"],
    answer: "Happy to help. I'll ask you 4 quick questions and our team will follow up with a quote.",
    action: "quote",
  },
  {
    id: "delivery",
    keywords: ["delivery", "deliver", "shipping", "ship", "courier", "drop off"],
    // EDIT: real delivery areas, fees, timing
    answer:
      "We deliver across Mississauga and the GTA. Delivery is free on orders of $500+, otherwise $79, and branch pickup is free. The team confirms the delivery day with your order.",
    chips: ["Get a quote", "Pickup"],
  },
  {
    id: "pickup",
    keywords: ["pickup", "pick up", "collect", "location", "address", "where are you", "visit", "store"],
    answer: `Branch pickup is free. Pickup details are confirmed with your order.${BUSINESS.address ? " Address: " + BUSINESS.address : ""}`,
    chips: ["Get a quote", "Hours"],
  },
  {
    id: "hours",
    keywords: ["hours", "open", "opening", "closing", "close", "timing"],
    answer: `Our hours: ${BUSINESS.hours}. You can leave a request here any time and we'll reply.`,
    chips: ["Get a quote", "Talk to expert"],
  },
  {
    id: "payment",
    keywords: ["payment", "pay", "etransfer", "e-transfer", "credit card", "debit", "cash", "invoice"],
    // EDIT: real payment methods
    answer: "Payment options are confirmed with your quote.",
    chips: ["Get a quote"],
  },
  {
    id: "returns",
    keywords: ["return", "refund", "exchange", "warranty", "damaged", "wrong item"],
    // EDIT: real policy
    answer: "Return and warranty terms depend on the product. Tell the team the item and they'll confirm the policy.",
    chips: ["Talk to expert"],
  },
  {
    id: "bulk",
    keywords: ["bulk", "wholesale", "contractor", "large order", "discount", "builder", "project"],
    answer: "Yes, we handle bulk and contractor orders. Send us your item list and quantities for a custom quote.",
    chips: ["Get a quote"],
  },
  {
    id: "stock",
    keywords: ["stock", "available", "availability", "in stock"],
    answer: "Stock changes often, so the team confirms availability with your quote.",
    chips: ["Get a quote"],
  },
  {
    id: "contact",
    keywords: ["contact", "phone", "call", "email", "support"],
    answer: `You can reach us${BUSINESS.phone ? " at " + BUSINESS.phone : ""}${BUSINESS.email ? " or " + BUSINESS.email : ""}. Or tap Get a quote and the team will contact you.`,
    chips: ["Get a quote", "Talk to expert"],
  },
  {
    id: "products",
    keywords: ["products", "product", "catalog", "catalogue", "what do you sell", "categories", "category", "items"],
    answer: `We supply building materials across: ${CATEGORIES.map((c) => c.name).join(", ")}. Tap one or browse the site.`,
    chips: CATEGORIES.map((c) => c.name),
    link: { label: "Browse products", href: PRODUCTS_URL },
  },
  ...CATEGORIES.map<Faq>((c) => ({
    id: `cat-${c.name}`,
    keywords: c.keywords,
    answer: `Yes, we supply ${c.name.toLowerCase()}. Tell me what you need and the quantity, and I'll get you a quote.`,
    link: { label: `Browse ${c.name}`, href: c.href },
    chips: ["Get a quote", "Delivery"],
  })),
];