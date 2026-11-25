/**
 * The chatbot subscription, as the developer bills it.
 *
 * Normally nothing here needs editing. The admin picks a plan on
 * Admin > Chatbot and pays with PayPal; the site confirms the payment with
 * PayPal (lib/chatbot/billing.ts) and switches the assistant on. It stays on
 * while PayPal reports the subscription active, and goes off once it is
 * cancelled or payments stop (7 days' grace after a missed payment).
 */
export const CHATBOT_PLAN = {
  /**
   * ON/OFF SWITCH for the chat assistant on the public site.
   *   "auto" → on only while a plan is paid (the normal setting)
   *   "on"   → always on, paid or not
   *   "off"  → always off, paid or not
   * The admin playground works in every mode.
   */
  bot: "auto" as "auto" | "on" | "off",

  /**
   * Manual fallback, YYYY-MM-DD: treat the plan as paid through this date
   * (e.g. paid by e-transfer). Leave "" to rely on PayPal.
   */
  paidUntil: "",
  /** How the manual payment above was made, shown on the plan banner. */
  paidVia: "PayPal",

  /** Plan name shown on Admin > Chatbot. */
  name: "CareBy AI Pro",
  /** Monthly price, in the currency the PayPal plan charges. */
  price: { amount: 60, currency: "CAD" as const },
  /** One-time setup fee PayPal charges with the first payment (0 hides it). */
  setupFee: 5,
  /** What the client sees as the plan amount on Admin > Chatbot. */
  amountLabel: "CAD 60 / month",

  /**
   * PayPal subscription button on Admin > Chatbot (from PayPal's button
   * factory). The client ID is public; it identifies the receiving account.
   */
  paypal: {
    clientId: "BAABRB6RAvs9wEFMtypSkKM-wWS9LtYr5GQDe7PuDpKG7rCx7LumVoct5UH3lH1zTnSy24M_HvC5w6pCgM",
    planId: "P-4ND65054CE1605522NMC5DMY",
  },

  /**
   * The Premium plan (above Pro), offered on Admin > Chatbot. Until
   * `paypalPlanId` is set (a CAD 99 plan created in PayPal), its button sends
   * a request by email instead of taking payment. Premium features are sold,
   * not yet built: deliver them when the client upgrades.
   * `requestEmail` also gets a note whenever someone subscribes.
   */
  upgrade: {
    name: "CareBy AI Premium",
    price: 99,
    paypalPlanId: "",
    requestEmail: "codeverasolutions@gmail.com",
  },

  /** Optional fallback pay link (shown as "Pay now" when overdue). */
  payUrl: "",
  /** Razorpay subscription, only used if CHATBOT_RAZORPAY_* keys are set. */
  subscriptionId: "",
};
