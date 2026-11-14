import { Resend } from "resend";

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