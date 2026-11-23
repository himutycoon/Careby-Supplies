/**
 * The chatbot subscription, as the developer bills it.
 *
 * EDIT THIS EACH MONTH: when the client pays, move `paidUntil` forward one
 * month and push to main. The site redeploys and the admin page updates.
 *
 * How it behaves (lib/chatbot/billing.ts):
 *   - up to paidUntil            → bot on,  admin shows "Active"
 *   - up to 7 days after it      → bot on,  admin shows "Payment due"
 *   - more than 7 days after it  → bot off, admin shows "Unpaid"
 *
 * Server environment variables override these values, so a Razorpay
 * subscription (CHATBOT_RAZORPAY_*) or CHATBOT_PAID_UNTIL set on the host
 * takes over without a code change. CHATBOT_ENFORCE_BILLING=0 on the host
 * switches enforcement off.
 */
export const CHATBOT_PLAN = {
  /** Switch the bot off once the plan lapses. */
  enforce: true,
  /** Last day of the paid period, YYYY-MM-DD. */
  paidUntil: "2026-12-24",
  /** Monthly price in INR, as charged by Razorpay. CAD/USD are shown converted. */
  priceInr: 4000,
  /** What the client sees on Admin > Chatbot. */
  amountLabel: "₹4,000 / month",
  /** Razorpay subscription link: the Subscribe button on Admin > Chatbot. */
  payUrl: "https://rzp.io/rzp/wiGyRk7t",
  /**
   * Set to true once the client has subscribed: the Subscribe button is
   * replaced by "Auto-pay is on" (it still shows "Pay now" if a payment
   * is overdue).
   */
  autoPayActive: false,
  /**
   * The client's Razorpay subscription. Once Razorpay approves the website,
   * set CHATBOT_RAZORPAY_KEY_ID and CHATBOT_RAZORPAY_KEY_SECRET on the host
   * and the bot follows this subscription's status automatically; paidUntil
   * above stops being used.
   */
  subscriptionId: "sub_U3ZnhJlKxxBj0D",
};
