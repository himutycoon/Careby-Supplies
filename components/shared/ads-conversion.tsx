"use client";

import * as React from "react";

/**
 * Reports a completed order to Google Ads.
 *
 * The other half of components/shared/google-ads-tag.tsx: that one says
 * somebody visited, this one says somebody bought, and only this one
 * can tell the client which ads made money.
 *
 * Google's snippet wraps this in a `gtag_report_conversion(url)` that
 * fires on a click and then navigates. That shape is for a site where
 * the "conversion" is pressing a button. Here the conversion is an
 * order that exists in the database, so it fires when the confirmation
 * is shown and there is nothing to navigate to.
 */

const SEND_TO = "AW-18491257296/dI2MCNnc5I4dENDjqPFE";

/** References already reported, so a refresh is not a second sale. */
const STORAGE_KEY = "careby.adsConversions";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * The gtag queue, whether or not Google's script has loaded yet.
 *
 * This is a race, and losing it loses a sale from the report. The base
 * tag loads with strategy="afterInteractive"; the Stripe path lands
 * straight on /orders/REF?paid=1, fetches the order, and reports the
 * moment it arrives. On a slow connection that can happen before
 * gtag.js has finished downloading, and the first version of this bailed
 * out when window.gtag was missing — silently, on the one path that
 * matters, with nothing anywhere to say a conversion had been dropped.
 *
 * Queueing is the fix, and it is how the tag is designed to work:
 * gtag('js') and gtag('config') in Google's own snippet both run before
 * the async script exists. Everything pushed to dataLayer is replayed
 * when gtag.js loads, so an event queued early is sent late rather than
 * lost. This shim is the same four lines the base tag writes, and
 * defining it twice is harmless.
 */
function gtagQueue(): (...args: unknown[]) => void {
  if (typeof window.gtag === "function") return window.gtag;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // The arguments object, not an array: gtag.js reads what Google's
    // own shim pushes, and the two are not interchangeable.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  return window.gtag;
}

function alreadyReported(reference: string): boolean {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const seen = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(seen) && seen.includes(reference);
  } catch {
    /*
     * Private mode, blocked storage, or something else wrote nonsense
     * here. Reporting twice is better than never reporting, and Google
     * de-duplicates on transaction_id anyway — this is the belt, that
     * is the braces.
     */
    return false;
  }
}

function remember(reference: string): void {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const seen = raw ? (JSON.parse(raw) as string[]) : [];
    const next = [...(Array.isArray(seen) ? seen : []), reference];
    // Only the recent ones; this list has no reason to grow forever.
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(next.slice(-50)),
    );
  } catch {
    // Not being able to remember is not a reason to fail a page.
  }
}

export function ReportAdsConversion({
  reference,
  valueCad,
}: {
  /** The order reference, e.g. ORD-7K2M9P. Google's transaction_id. */
  reference: string;
  /**
   * What the sale was worth, in CAD.
   *
   * Callers pass the order EXCLUDING tax. HST is collected and remitted,
   * so counting it as conversion value would overstate every return-on-
   * ad-spend figure by 13% — the client would be optimising spend
   * against money that was never his. Delivery is included, because that
   * is revenue. Change this with the client's accountant, not casually.
   */
  valueCad: number;
}) {
  React.useEffect(() => {
    if (!reference) return;
    if (typeof window === "undefined") return;
    /*
     * The base tag only renders in production, so in development there
     * is nothing to send to and queueing would just fill a dataLayer
     * nobody reads — and mark the order reported, so the same browser
     * would stay quiet about it afterwards.
     */
    if (process.env.NODE_ENV !== "production") return;
    if (alreadyReported(reference)) return;

    // Remember first. If the push throws, we have still recorded that
    // this order was attempted, which is the safer failure: a missed
    // conversion is a reporting gap, a duplicated one is a wrong number
    // someone makes a budget decision on.
    remember(reference);

    gtagQueue()("event", "conversion", {
      send_to: SEND_TO,
      value: Number(valueCad.toFixed(2)),
      currency: "CAD",
      transaction_id: reference,
    });
  }, [reference, valueCad]);

  return null;
}
