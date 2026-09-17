import type { ReportNarrative } from "@/lib/types";

const SECTIONS: { key: keyof ReportNarrative; title: string }[] = [
  { key: "summary", title: "Summary" },
  { key: "conditionOverview", title: "Condition overview" },
  { key: "scopeRationale", title: "Why this scope" },
  { key: "budgetGuidance", title: "Budget guidance" },
  { key: "nextSteps", title: "Next steps" },
];

export function NarrativeSection({
  narrative,
}: {
  narrative: ReportNarrative;
}) {
  return (
    <div className="flex flex-col gap-5">
      {SECTIONS.map((section) => (
        <div key={section.key}>
          <h3 className="mb-1.5 font-semibold">{section.title}</h3>
          <p className="text-muted-foreground">{narrative[section.key]}</p>
        </div>
      ))}
    </div>
  );
}
