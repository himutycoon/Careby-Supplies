import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { LegalContent } from "@/components/shared/legal-content";
import { CONTACT_INFO } from "@/data/mock";

export const metadata: Metadata = {
  title: "Privacy Policy — CareBy Supplies",
  description:
    "How CareBy Supplies collects, uses, stores and shares personal information, and how to access or delete yours.",
};

/*
 * Written against what the code actually does, not a generic template:
 * the photo pipeline, the Supabase-hosted database, the trade-price role
 * on a profile and the Stripe hand-off are all real behaviours a reader
 * can verify. A policy that describes a different product is worse than
 * none, because it is a statement the business cannot stand behind.
 */
export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        title="Privacy Policy"
        subtitle="What we collect, why we collect it, and how to get it back or have it deleted."
      />
      <LegalContent
        updatedAt="21 September 2026"
        sections={[
          {
            heading: "Who we are",
            body: [
              `CareBy Supplies sells and delivers building materials in the Greater Toronto Area, from ${CONTACT_INFO.address}. We supply material; we do not carry out construction work. This policy explains how we handle personal information under Canada's Personal Information Protection and Electronic Documents Act (PIPEDA).`,
              "It applies to this website, the accounts and dashboards on it, and the orders and material requests placed through it.",
            ],
          },
          {
            heading: "Information you give us",
            list: [
              "Account details: your name, email address and password. Passwords are stored hashed by our authentication provider — we never see them.",
              "Order details: delivery address, contact phone, what you ordered and your delivery or pickup choice.",
              "Project details: room type and dimensions, scope, budget, wish list, written notes, and the municipality your property is in.",
              "Photographs you upload of the space you want worked on.",
              "Drawings and plans uploaded by contractors for material takeoffs.",
              "Anything you write to us through the contact form or WhatsApp.",
            ],
          },
          {
            heading: "Information we generate",
            list: [
              "Your estimate, report and material lists, produced from what you submitted.",
              "Your account role — homeowner, contractor or administrator — which determines the pricing you see and the screens you can reach.",
              "Order history, project status and message history tied to your account.",
              "Standard server logs, including IP address and timestamps, kept for security and troubleshooting.",
            ],
          },
          {
            heading: "How your photos are handled",
            body: [
              "Photos you upload are used to work out what material your project needs. Where automated analysis is enabled, an image may be sent to our AI provider to identify fixtures, finishes and visible issues. Quantities, prices and verdicts are never decided by the AI — those are computed by our own deterministic rules from the measurements you supply.",
              "Photos are stored so your advisor can check your material list and so you can reopen your report later. They are not used to train any third party's AI models, and they are not published or shared beyond the people working on your project.",
            ],
          },
          {
            heading: "Why we use it",
            body: [
              "We use personal information only for the purposes below. Where the law requires consent, submitting the relevant form is how that consent is given, and you can withdraw it at any time by contacting us.",
            ],
            list: [
              "To produce your estimate, plan, material list or quote.",
              "To take, fulfil and deliver your order, and to handle returns.",
              "To operate your account and show the correct pricing for your role.",
              "To reply to your enquiries and provide project support.",
              "To keep records we are required to keep, such as sales records for tax purposes.",
              "To send marketing email, only if you subscribed, with an unsubscribe link in every message.",
            ],
          },
          {
            heading: "Who we share it with",
            body: [
              "We do not sell your personal information, and we do not share it for anyone else's advertising.",
              "We use service providers to run the business. They may only process your information to provide their service to us:",
            ],
            list: [
              "Supabase — database, file storage and authentication.",
              "Anthropic — automated analysis of uploaded photos, where that feature is enabled.",
              "Stripe — payment processing. Card numbers are entered on Stripe's systems and never reach ours; we receive only the outcome and the last digits.",
              "Our web host, for serving the site and its logs.",
              "Delivery partners, who receive the address and contact details needed to deliver your order.",
            ],
            // Cross-border storage is the disclosure PIPEDA most often
            // catches Canadian sites missing.
          },
          {
            heading: "Where your information is stored",
            body: [
              "Some of our providers store and process data outside Canada, including in the United States. While it is there, it may be accessible to the courts and law enforcement of that country under its laws. By using CareBy Supplies you acknowledge this transfer. If you would prefer your project be handled without uploading photos, contact us and we will arrange an alternative.",
            ],
          },
          {
            heading: "How long we keep it",
            list: [
              "Account information: while your account is open, and then for a reasonable period after you close it.",
              "Orders and invoices: as long as tax and business record-keeping rules require, which is generally several years.",
              "Project submissions, photos and reports: while your account is open, so you can reopen them, unless you ask us to delete them sooner.",
              "Contact messages: while needed to resolve your enquiry and for a reasonable period afterwards.",
              "Marketing subscriptions: until you unsubscribe.",
            ],
          },
          {
            heading: "Your rights",
            body: [
              "You can ask us to do any of the following, free of charge in ordinary cases. We will respond within 30 days.",
            ],
            list: [
              "Tell you what personal information we hold about you and what we have done with it.",
              "Correct anything inaccurate.",
              "Delete your information, except where we are required to keep it — for example, a completed order's record.",
              "Send you a copy of the information you gave us.",
              "Withdraw consent, or unsubscribe from marketing.",
            ],
          },
          {
            heading: "How we protect it",
            body: [
              "Access to your data is enforced in our database itself, not only in the website: every request is checked against rules that restrict each account to its own records. Traffic to the site is encrypted in transit, and administrative access is limited to staff who need it.",
              "No system is perfectly secure. If a breach occurs that creates a real risk of significant harm to you, we will notify you and the Office of the Privacy Commissioner of Canada as required.",
            ],
          },
          {
            heading: "Cookies",
            body: [
              "We use cookies that are necessary for the site to work — keeping you signed in, remembering your cart and your light or dark theme preference. We do not use advertising or cross-site tracking cookies. Blocking necessary cookies will stop sign-in and checkout from working.",
            ],
          },
          {
            heading: "Children",
            body: [
              "This site is intended for adults. We do not knowingly collect personal information from children. If you believe a child has given us information, contact us and we will delete it.",
            ],
          },
          {
            heading: "Complaints",
            body: [
              `If you are unhappy with how we have handled your information, contact us first at ${CONTACT_INFO.email} and we will try to resolve it. You also have the right to complain to the Office of the Privacy Commissioner of Canada at priv.gc.ca.`,
            ],
          },
          {
            heading: "Changes to this policy",
            body: [
              "If we change this policy we will update the date at the top of this page. Where a change materially affects how we use information you have already given us, we will tell you directly.",
            ],
          },
        ]}
      />
    </>
  );
}
