interface LegalSection {
  heading: string;
  body: string[];
}

export function LegalContent({
  updatedAt,
  sections,
}: {
  updatedAt: string;
  sections: LegalSection[];
}) {
  return (
    <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
      {/*
        These pages ship as a drafting template. The wording below has NOT
        been reviewed by a lawyer and must be replaced with CareBy's own
        reviewed terms before the site goes live — Ontario consumer
        protection and PIPEDA both apply here. The notice stays visible on
        purpose: it should be removed in the same change that puts real
        reviewed copy in, so it can't be forgotten.
      */}
      <div className="mb-8 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        This page is a draft awaiting legal review and is not yet binding.
        Last updated {updatedAt}.
      </div>

      <div className="flex flex-col gap-8">
        {sections.map((section) => (
          <div key={section.heading}>
            <h2 className="mb-3 text-xl font-semibold">{section.heading}</h2>
            <div className="flex flex-col gap-3">
              {section.body.map((paragraph, i) => (
                <p key={i} className="text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
