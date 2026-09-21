import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { LegalContent } from "@/components/shared/legal-content";
import { CONTACT_INFO } from "@/data/mock";

export const metadata: Metadata = {
  title: "Refund & Returns Policy — CareBy Supplies",
  description:
    "How to return materials, what can't be returned, and how refunds are issued.",
};

/*
 * The windows and fees below are CareBy's own commercial choices, not
 * legal minimums — they are the numbers most GTA building suppliers run,
 * and they are the part of this page the business needs to confirm or
 * change. Everything framed as a right (cancelling before dispatch, goods
 * that arrive damaged, late delivery) is not negotiable downward.
 */
export default function RefundPage() {
  return (
    <>
      <PageHeader
        title="Refund & Returns Policy"
        subtitle="What can come back, by when, and how you get your money."
      />
      <LegalContent
        updatedAt="21 September 2026"
        sections={[
          {
            heading: "The short version",
            list: [
              "Unused materials in original packaging: 30 days for a refund.",
              "Damaged, faulty or wrong items: tell us within 48 hours and we cover it entirely.",
              "Cut, mixed, special-order and clearance items cannot be returned unless faulty.",
              "Refunds go back to the original payment method, normally within 5–10 business days of us receiving the goods.",
            ],
          },
          {
            heading: "Cancelling before dispatch",
            body: [
              "You can cancel an order at no cost any time before it has been dispatched or prepared for collection. Contact us with your order reference and we will refund it in full.",
              "Once an order is on a vehicle, it becomes a return rather than a cancellation.",
            ],
          },
          {
            heading: "Returning unused materials",
            body: [
              "Most stocked materials can be returned within 30 days of delivery or collection, provided they are unused, undamaged and in their original unopened packaging, with proof of purchase.",
              "Materials must be dry and stored properly. Lumber that has been left out in the rain, or bagged goods that have hardened, cannot be resold and cannot be accepted.",
            ],
          },
          {
            heading: "What cannot be returned",
            list: [
              "Products cut, mixed, tinted or otherwise made to your specification — including cut lumber and custom-tinted paint.",
              "Special-order items brought in specifically for you.",
              "Clearance and final-sale items, which are marked as such before you buy.",
              "Opened adhesives, sealants, and any product where the packaging seal is a safety or freshness barrier.",
              "Items returned without proof of purchase.",
            ],
            body: [
              "These exclusions do not apply if the item is faulty, damaged on arrival, or not what you ordered.",
            ],
          },
          {
            heading: "Damaged, faulty or incorrect items",
            body: [
              "Please check your order on arrival. If something is damaged, missing or not what you ordered, tell us within 48 hours with your order reference and a photo where relevant.",
              "We will replace it or refund it, whichever you prefer, and we cover collection and redelivery. You are never charged a restocking fee or return freight in these cases.",
              "A fault that appears later is still covered by the manufacturer's warranty and by your statutory rights. Contact us and we will help you pursue it.",
            ],
          },
          {
            heading: "Return costs",
            body: [
              "You can return goods to us at no charge by bringing them back yourself.",
              "If you would like us to collect a return that is not our error, we charge the actual cost of collection, quoted to you before we arrange it. Large or heavy orders — lumber, aggregate, drywall — may also carry a restocking fee of up to 15%, which we will tell you about before you commit to the return.",
              "Original delivery charges are refunded when the return is our error, and when you cancel a whole order before dispatch. For a partial return of a correctly supplied order, the original delivery charge is not refunded.",
            ],
          },
          {
            heading: "Plans, reports and services",
            body: [
              "The instant estimate is free and always will be.",
              "Where you have paid for a plan, report or takeoff, you can cancel for a full refund at any point before work on it begins. Once our team has started preparing it, we refund the portion not yet worked on.",
              "Once a completed plan or report has been delivered to you, it cannot be refunded, because it cannot be returned. If you believe what you received does not match what you paid for, contact us — we would rather fix it.",
            ],
          },
          {
            heading: "Late or undelivered orders",
            body: [
              "If we cannot deliver within a reasonable time of the date we promised, you may cancel the undelivered part of the order and receive a full refund of it, including its delivery charge.",
            ],
          },
          {
            heading: "How to request a refund",
            list: [
              `Email ${CONTACT_INFO.email} or message us on WhatsApp at ${CONTACT_INFO.phone}.`,
              "Include your order reference — it looks like ORD-XXXXXX and is on your confirmation.",
              "Tell us what you are returning and why, with a photo if the item is damaged.",
              "We will confirm whether it can be returned and arrange collection or give you the return address.",
            ],
          },
          {
            heading: "How refunds are paid",
            body: [
              "Refunds are issued to the original payment method. We process them once the returned goods reach us and have been checked, normally within 5–10 business days. How quickly the money appears afterwards depends on your bank or card issuer.",
              "We do not refund to a different card or account than the one used to pay.",
            ],
          },
          {
            heading: "Your statutory rights",
            body: [
              "This policy is offered in addition to your rights under the Ontario Consumer Protection Act, 2002 and other applicable law. Nothing here reduces those rights. Where this policy and the law differ, the law applies.",
            ],
          },
        ]}
      />
    </>
  );
}
