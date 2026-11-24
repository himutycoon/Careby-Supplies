/**
 * The chatbot subscription, as the developer bills it.
 *
 * EDIT THIS EACH MONTH: when the client's payment arrives, move `paidUntil`
 * forward one month and push to main. The site redeploys and the admin
 * page updates.
 *
 * How it behaves (lib/chatbot/billing.ts):
 *   - up to paidUntil            → bot on,  admin shows "Active"
 *   - up to 7 days after it      → bot on,  admin shows "Payment due"
 *   - more than 7 days after it  → bot off, admin shows "Unpaid"
 *
 * Server environment variables override these values (CHATBOT_PAID_UNTIL,
 * CHATBOT_RAZORPAY_*). CHATBOT_ENFORCE_BILLING=0 on the host switches
 * enforcement off.
 */
export const CHATBOT_PLAN = {
  /**
   * MASTER ON/OFF SWITCH for the chat assistant on the public site.
   *   false → bot hidden for visitors; Admin > Chatbot shows "Not set up"
   *           with the PayPal subscribe button (the admin playground
   *           still works so the client can try it).
   *   true  → bot follows the paidUntil date below.
   * Turn on after the first real PayPal payment: set true, set paidUntil
   * one month after the payment date, then push.
   */
  botOn: false,

  /** Switch the bot off once the plan lapses. */
  enforce: true,
  /** Last day of the paid period, YYYY-MM-DD. */
  paidUntil: "2026-12-24",

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
   * Set to true once the client has subscribed: the PayPal button is
   * replaced by "Auto-pay is on" (a "Pay now" link still shows if a
   * payment is overdue and payUrl is set).
   */
  autoPayActive: false,

  /**
   * The upgrade offer (Premium, above Pro) shown on Admin > Chatbot. Until `paypalPlanId` is set
   * (a CAD 99 plan created in PayPal), the button sends an upgrade request
   * by email instead of taking payment. Premium features are sold, not yet
   * built: deliver them when the client upgrades.
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
