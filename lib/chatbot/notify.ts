import { Resend } from "resend";
import { CHATBOT_PLAN } from "./plan";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

type Lead = { name: string; contact: string; items: string; city: string; page: string };

export async function notifyLead(lead: Lead) {
  if (!resend) {
    console.warn("RESEND_API_KEY missing, skipping lead email");
    return;
  }
  const to = (process.env.LEAD_NOTIFY_EMAIL || process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!to.length) return;

  const isEmail = /^\S+@\S+\.\S+$/.test(lead.contact);

  try {
    const { error } = await resend.emails.send({
      from: process.env.LEAD_FROM_EMAIL || "CareBy Leads <onboarding@resend.dev>",
      to,
      replyTo: isEmail ? lead.contact : undefined,
      subject: `New quote request: ${lead.name}`,
      html: `
        <h2>New chat quote request</h2>
        <p><b>Name:</b> ${esc(lead.name)}</p>
        <p><b>Contact:</b> ${esc(lead.contact)}</p>
        <p><b>City:</b> ${esc(lead.city || "-")}</p>
        <p><b>Items:</b><br>${esc(lead.items).replace(/\n/g, "<br>")}</p>
        <p style="color:#888;font-size:12px">From: ${esc(lead.page || "-")}</p>
      `,
    });
    if (error) console.error("LEAD EMAIL FAILED:", error.message);
  } catch (e) {
    console.error("LEAD EMAIL FAILED:", e);
  }
}
/** Tell the developer a chatbot subscription was taken out on Admin > Chatbot. */
export async function notifySubscription(sub: { id: string; planId: string | null; status: string | null; saved: boolean }) {
  const to = CHATBOT_PLAN.upgrade.requestEmail;
  if (!resend || !to) return;
  try {
    const { error } = await resend.emails.send({
      from: process.env.LEAD_FROM_EMAIL || "CareBy Leads <onboarding@resend.dev>",
      to: [to],
      subject: `CareBy chatbot subscription: ${sub.id}`,
      html: `
        <h2>New chatbot subscription</h2>
        <p><b>Subscription:</b> ${esc(sub.id)}</p>
        <p><b>Plan:</b> ${esc(sub.planId || "-")}</p>
        <p><b>PayPal status:</b> ${esc(sub.status || "not checked (PAYPAL_CLIENT_* not set)")}</p>
        ${sub.saved ? "" : "<p style=\"color:#b00\"><b>Not saved on the site</b> (run supabase/schema-30). Switch the bot on manually.</p>"}
        <p style="color:#888;font-size:12px">If this replaces an earlier plan, cancel the old subscription in PayPal.</p>
      `,
    });
    if (error) console.error("SUBSCRIPTION EMAIL FAILED:", error.message);
  } catch (e) {
    console.error("SUBSCRIPTION EMAIL FAILED:", e);
  }
}
