import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { LegalContent } from "@/components/shared/legal-content";
import { CONTACT_INFO } from "@/data/mock";

export const metadata: Metadata = {
  title: "Terms of Service — CareBy Supplies",
  description:
    "The terms you agree to when you buy materials or request a plan from CareBy Supplies.",
};

/*
 * The three things this page must get right, because the product makes
 * each of them easy to misread:
 *   1. An instant estimate is a material figure, not a quote.
 *   2. We supply material; we do not install it or build anything.
 *   3. Prices are set by our catalogue, never by what the browser sends.
 */
export default function TermsPage() {
  return (
    <>
      <PageHeader
        title="Terms of Service"
        subtitle="The agreement between you and CareBy Supplies when you use this site."
      />
      <LegalContent
        updatedAt="21 September 2026"
        sections={[
          {
            heading: "Agreeing to these terms",
            body: [
              `These terms are between you and CareBy Supplies, operating from ${CONTACT_INFO.address}. By creating an account, placing an order or submitting a project request, you agree to them. If you do not agree, please do not use the site.`,
              "If you are using the site for a business, you confirm you are authorised to accept these terms on its behalf.",
            ],
          },
          {
            heading: "What we provide",
            list: [
              "Building materials, tools and supplies for sale, delivered in the Greater Toronto Area or collected from us.",
              "Instant material estimates generated from the measurements and details you enter.",
              "Material lists and reports checked by hand, where you have requested one.",
              "Supply services, including material takeoffs from drawings, customer packages and scheduled call orders for contractors.",
            ],
          },
          {
            heading: "An estimate is a material figure, not a quote",
            body: [
              "The instant estimate prices materials only. It is produced by our rules from the dimensions, scope and selections you enter, and it excludes labour, equipment, permits, disposal and anything else a contractor charges for. It is not a quote, an offer, or a fixed price, and it cannot account for what we cannot see — the condition inside your walls, or how much of the old material can be reused.",
              "Quantities are indicative and must be confirmed on site before ordering, particularly for cut-to-size material. Do not rely on an estimate as the basis of a binding budget, a mortgage application or a contract with a third party. A firm price comes only from a written quote we have issued for a defined list.",
            ],
          },
          {
            heading: "We supply materials — we do not build",
            body: [
              "CareBy Supplies sells and delivers building materials. We do not install them, employ or provide trades, supervise work, or take on construction or project management of any kind. Anything on this site that describes a project is describing what to buy for it, not an offer to carry it out.",
              "Nothing on this site is a building permit, a code compliance review, a professional engineering opinion, or a home inspection. Confirming what your project needs, and arranging any permit or inspection, is the responsibility of you and your contractor.",
            ],
          },
          {
            heading: "Accounts",
            body: [
              "You are responsible for keeping your password confidential and for activity under your account. Tell us promptly if you believe it has been compromised.",
              "Trade pricing is available to verified contractor accounts. Applying for or using a contractor account without being a genuine trade business is a breach of these terms, and we may correct the pricing or close the account.",
            ],
          },
          {
            heading: "Prices, orders and payment",
            body: [
              "Prices are shown in Canadian dollars and exclude HST unless stated. HST is applied at checkout on the goods and on delivery, as Ontario requires.",
              "The price charged is always the price in our catalogue for your account type at the time the order is placed. Prices displayed in your browser are for information; if they disagree with our records, our records govern.",
              "Placing an order is an offer to buy. A contract forms when we confirm the order. We may decline or cancel an order — for example, where an item is out of stock, a price was listed in error, or we cannot deliver to the address — and if we have taken payment we will refund it in full.",
              "Delivery is charged as shown at checkout, with free delivery above the stated order value and no charge for collection.",
            ],
          },
          {
            heading: "Delivery and collection",
            body: [
              "Delivery dates given at checkout or afterwards are estimates. We will tell you if a date changes materially. If we cannot deliver within a reasonable time of the date promised, you may cancel the undelivered part of your order for a full refund.",
              "Someone must be available to receive a delivery at a site address, and the site must be safe and accessible for the vehicle. Please inspect goods on arrival and tell us about damage or shortages within 48 hours, so we can resolve it with the carrier.",
              "Risk in the goods passes to you on delivery or collection. Where we have not yet been paid in full, the goods remain ours until we have been.",
            ],
          },
          {
            heading: "Returns",
            body: [
              "Returns are covered by our Refund Policy, which forms part of these terms. Nothing in these terms limits the rights you have under the Ontario Consumer Protection Act, 2002, or any other law that cannot be excluded by agreement.",
            ],
          },
          {
            heading: "Materials, quantities and suitability",
            body: [
              "Material lists and takeoffs are prepared from the drawings and measurements you give us, and are a starting point rather than a guarantee of quantity. Trades normally allow for waste, cuts and site conditions. Please check quantities before ordering; we cannot accept responsibility for over- or under-ordering based on a takeoff.",
              "Product images, colours and specifications are indicative. Natural materials vary between batches, and screens render colour differently. Order a sample where an exact match matters.",
            ],
          },
          {
            heading: "Your content",
            body: [
              "You keep ownership of the photos, drawings and text you upload. You grant us permission to use them for the purpose you supplied them — preparing your estimate, plan, takeoff or order — and to keep them as described in our Privacy Policy.",
              "You confirm you have the right to share what you upload, and that it does not infringe anyone else's rights. We may remove content that is unlawful or that you were not entitled to provide.",
            ],
          },
          {
            heading: "Our content",
            body: [
              "The site, its design, text, and the reports and estimates we produce for you remain our intellectual property. You may use the report we prepare for your own project, including sharing it with your contractor, lender or municipality. You may not resell it, or copy the site's content for a competing service.",
            ],
          },
          {
            heading: "Acceptable use",
            list: [
              "Do not attempt to access accounts, orders or data that are not yours.",
              "Do not scrape, copy or republish the catalogue or pricing.",
              "Do not interfere with the site's operation or security.",
              "Do not submit false information, including in a contractor application.",
            ],
          },
          {
            heading: "Availability",
            body: [
              "We aim to keep the site available but do not guarantee uninterrupted service. We may change, suspend or withdraw features, and we may update the catalogue and prices at any time. Changes do not affect orders already confirmed.",
            ],
          },
          {
            heading: "Our responsibility to you",
            body: [
              "We are responsible for loss you suffer that is a foreseeable result of us breaking these terms or failing to use reasonable care. We are not responsible for loss that was not foreseeable, for business losses such as lost profit or lost opportunity, or for the work or conduct of a contractor you engage separately.",
              "Except where the law does not allow it, our total liability arising from an order is limited to the amount you paid for that order; and for a plan or report, to the amount you paid for it.",
              "Nothing here excludes liability for death or personal injury caused by our negligence, for fraud, or for anything else that cannot lawfully be excluded — including your rights under the Ontario Consumer Protection Act, 2002.",
            ],
          },
          {
            heading: "If something goes wrong",
            body: [
              `Please contact us first at ${CONTACT_INFO.email} or on WhatsApp. Most problems are resolved quickly and directly. These terms are governed by the laws of the Province of Ontario and the federal laws of Canada that apply there, and the courts of Ontario have jurisdiction.`,
            ],
          },
          {
            heading: "Changes to these terms",
            body: [
              "We may update these terms. The version in force for your order is the one published when you placed it. We will update the date at the top of this page when we make a change.",
            ],
          },
        ]}
      />
    </>
  );
}
