import "server-only";

/**
 * Server-side PayPal Subscriptions API, used to confirm a payment really
 * happened before the assistant is switched on. Needs a Live REST app from
 * developer.paypal.com (Apps & Credentials > Live), on the same PayPal
 * account that owns the plans:
 *
 *   PAYPAL_CLIENT_ID      the app's Client ID
 *   PAYPAL_CLIENT_SECRET  the app's Secret
 */

const API = "https://api-m.paypal.com";

export type PayPalSubscription = {
  id: string;
  status: "APPROVAL_PENDING" | "APPROVED" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | "EXPIRED";
  plan_id: string;
  subscriber?: { email_address?: string };
  billing_info?: {
    next_billing_time?: string;
    failed_payments_count?: number;
    last_payment?: { time?: string };
  };
};

export function paypalConfigured() {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

async function token(): Promise<string> {
  const basic = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${API}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`PayPal token -> ${res.status}`);
  return (await res.json()).access_token;
}

export async function getSubscription(id: string): Promise<PayPalSubscription> {
  const res = await fetch(`${API}/v1/billing/subscriptions/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${await token()}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`PayPal subscription ${id} -> ${res.status}`);
  return res.json();
}
