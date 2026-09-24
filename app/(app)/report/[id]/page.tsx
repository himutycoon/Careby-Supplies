import type { Metadata } from "next";
import { VerdictBanner } from "@/components/shared/verdict-banner";
import { DisclaimerBox } from "@/components/shared/disclaimer-box";
import { PhotoStrip } from "@/components/estimate/photo-strip";
import { FixtureCard } from "@/components/estimate/fixture-card";
import { FinishCard } from "@/components/estimate/finish-card";
import { IssueList } from "@/components/estimate/issue-list";
import { CostTable } from "@/components/estimate/cost-table";
import { SupplyNotes } from "@/components/estimate/supply-notes";
import { AfterGallery } from "@/components/report/after-gallery";
import { MaterialPalette } from "@/components/report/material-palette";
import { NarrativeSection } from "@/components/report/narrative-section";
import { DownloadPdfButton } from "@/components/report/download-pdf-button";
import { Card } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { formatCad } from "@/lib/format";
import { MATERIAL_PALETTE, ROOM_TYPE_OPTIONS } from "@/data/mock";
import { getRealReportById } from "@/lib/supabase/queries";

export const metadata: Metadata = { title: "Your Material Plan — CareBy Supplies" };

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // An unknown id 404s rather than falling back to a sample report.
  const report = await getRealReportById(id);
  if (!report) notFound();

  const { estimate } = report;
  const cost = report.deliveredPlan.adminAdjustedCost ?? estimate.cost;
  const isPendingAnalysis = estimate.vision.confidence === 0;
  const roomLabel =
    ROOM_TYPE_OPTIONS.find((o) => o.value === estimate.vision.roomType)
      ?.label ?? estimate.vision.roomType;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {roomLabel} · {estimate.scopeLevel.replace("-", " ")}
          </p>
          <h1 className="text-2xl font-bold">Your renovation report</h1>
        </div>
        <DownloadPdfButton submissionId={id} />
      </div>

      <div className="flex flex-col gap-8">
        <VerdictBanner
          verdict={estimate.verdict}
          subtext={`${formatCad(cost.totalLow)} – ${formatCad(cost.totalHigh)} vs. your ${formatCad(estimate.budgetCad)} budget`}
        />

        <Card className="p-5">
          <NarrativeSection narrative={report.narrative} />
        </Card>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Concept design</h2>
          <AfterGallery count={report.deliveredPlan.afterImageUrls.length} />
          <p className="mt-3 text-sm text-muted-foreground">
            {report.deliveredPlan.layoutDescription}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Material palette</h2>
          <MaterialPalette swatches={MATERIAL_PALETTE} />
        </section>

        <Card className="gap-2 p-5">
          <h2 className="text-lg font-semibold">Advisor notes</h2>
          <p className="text-sm text-muted-foreground">
            {report.deliveredPlan.planNotes}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            — {report.deliveredPlan.deliveredBy}
          </p>
        </Card>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Your original photos</h2>
          <PhotoStrip count={report.input.photoUrls.length} />
        </section>

        {isPendingAnalysis ? (
          <section className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            Your advisor reviewed the before photos directly for this list;
            itemised fixture and finish detection wasn&apos;t available for
            this submission.
          </section>
        ) : (
          <>
            <section>
              <h2 className="mb-3 text-lg font-semibold">Detected fixtures</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {estimate.vision.detectedFixtures.map((fixture) => (
                  <FixtureCard key={fixture.name} fixture={fixture} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold">Detected finishes</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {estimate.vision.detectedFinishes.map((finish) => (
                  <FinishCard key={finish.surface} finish={finish} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold">Detected issues</h2>
              <IssueList issues={estimate.vision.issues} />
            </section>
          </>
        )}

        <section>
          <h2 className="mb-3 text-lg font-semibold">Material list</h2>
          <CostTable cost={cost} />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">What we supply, what you arrange</h2>
          <SupplyNotes notes={estimate.supplyNotes} />
        </section>

        <DisclaimerBox />
      </div>
    </div>
  );
}
