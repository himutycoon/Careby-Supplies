import { Mail, MessageCircle } from "lucide-react";
import { CONTACT_INFO, WHATSAPP_URL } from "@/data/mock";

export interface LegalSection {
  heading: string;
  body?: string[];
  /** Bulleted points. Real policies enumerate; prose alone buries things. */
  list?: string[];
}

export function LegalContent({
  updatedAt,
  sections,
  /**
   * Shows the "not yet reviewed by a lawyer" banner.
   *
   * Defaults to true and is a single prop on purpose. The copy below is
   * substantive and written for an Ontario retailer, but it has not been
   * through a lawyer, and removing this banner is the act of claiming it
   * has. Flip it to false on all three pages in the same change that
   * records the review.
   */
  awaitingReview = true,
}: {
  updatedAt: string;
  sections: LegalSection[];
  awaitingReview?: boolean;
}) {
  return (
    <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
      {awaitingReview ? (
        <div className="mb-8 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
          <strong className="font-semibold">Pending legal review.</strong>{" "}
          These terms are written to reflect how CareBy actually operates,
          but they have not yet been reviewed by a lawyer. Ontario consumer
          protection law and PIPEDA both apply.
        </div>
      ) : null}

      <p className="mb-8 text-sm text-muted-foreground">
        Last updated {updatedAt}.
      </p>

      <div className="flex flex-col gap-8">
        {sections.map((section) => (
          <div key={section.heading}>
            <h2 className="mb-3 text-xl font-semibold">{section.heading}</h2>
            <div className="flex flex-col gap-3">
              {section.body?.map((paragraph, i) => (
                <p key={i} className="text-muted-foreground">
                  {paragraph}
                </p>
              ))}
              {section.list ? (
                <ul className="flex list-disc flex-col gap-2 pl-5 text-muted-foreground marker:text-primary">
                  {section.list.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/*
        Every one of these pages tells the reader to contact us, so the
        route to doing it belongs on the page rather than a link away.
        PIPEDA in particular expects a reachable contact for access,
        correction and complaint requests.
      */}
      <div className="mt-10 rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold">How to reach us</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          CareBy Supplies — {CONTACT_INFO.address}
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-6">
          <a
            href={`mailto:${CONTACT_INFO.email}`}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <Mail className="size-4 shrink-0" aria-hidden="true" />
            {CONTACT_INFO.email}
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
            WhatsApp {CONTACT_INFO.phone}
          </a>
        </div>
      </div>
    </section>
  );
}
