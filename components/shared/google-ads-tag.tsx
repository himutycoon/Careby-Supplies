import Script from "next/script";

/**
 * Google Ads tag (gtag.js).
 *
 * AW-, not G-: this is a Google Ads account, not Analytics. It does two
 * things — measures which ads led somewhere, and builds a remarketing
 * audience of people who visited.
 *
 * `next/script` rather than a raw <script> in the markup, because this
 * is the App Router: a script tag written into JSX is not guaranteed to
 * execute, and `afterInteractive` is what Google's own Next.js guidance
 * asks for. It loads once per session, not once per client-side route
 * change, which is what the snippet Google hands out assumes.
 *
 * ON THIS TAG ALONE, NOTHING IS A CONVERSION.
 * It reports page views. Attributing an ORDER to an ad needs a second
 * piece: a `gtag('event', 'conversion', ...)` fired on the confirmation
 * step with a conversion label, the order total and the order
 * reference. The label comes out of the Ads account and did not exist
 * when this was written. Until it does, this measures traffic and
 * audiences, not revenue — see components/shop/checkout-flow.tsx, which
 * is where that event belongs.
 */

/**
 * Overridable so a staging site can point somewhere else, with the
 * live id as the default — a public tag id is not a secret, it ships to
 * every browser that loads the page.
 */
const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "AW-18491257296";

export function GoogleAdsTag() {
  /*
   * Production only.
   *
   * Every `npm run dev` page load would otherwise land in the client's
   * Ads reporting as real traffic, and a remarketing audience built
   * partly from developers is an audience he pays to advertise to.
   */
  if (process.env.NODE_ENV !== "production" || !ADS_ID) return null;

  return (
    <>
      <Script
        id="google-ads-src"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`}
      />
      <Script id="google-ads-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${ADS_ID}');
        `}
      </Script>
    </>
  );
}
