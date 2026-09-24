import type { Metadata } from "next";
import { Suspense } from "react";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { ContactForm } from "@/components/contact/contact-form";
import { CONTACT_INFO, WHATSAPP_URL } from "@/data/mock";

export const metadata: Metadata = { title: "Contact — CareBy Supplies" };

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Get in touch"
        subtitle="Questions about a product, a quantity, a price, or whether we deliver to you? We're happy to help."
      />

      <section className="mx-auto grid max-w-5xl gap-8 px-4 pb-20 sm:px-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          {/* ContactForm reads ?about= to prefill the subject, so it needs a
              boundary for this statically-rendered page. */}
          <Suspense fallback={<div className="h-96" />}>
            <ContactForm />
          </Suspense>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="gap-3 p-6">
            <h3 className="text-sm font-semibold">Contact details</h3>
            <a
              href={`mailto:${CONTACT_INFO.email}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Mail className="size-4" /> {CONTACT_INFO.email}
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="size-4" /> WhatsApp {CONTACT_INFO.phone}
            </a>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4" /> {CONTACT_INFO.address}
            </span>
          </Card>
          <Card className="gap-2 p-6">
            <h3 className="text-sm font-semibold">Response time</h3>
            <p className="text-sm text-muted-foreground">
              We typically reply within one business day. For an instant
              answer on cost, try the estimate widget on the home page
              instead.
            </p>
          </Card>
        </div>
      </section>
    </>
  );
}
