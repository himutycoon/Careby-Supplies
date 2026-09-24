import type { Metadata } from "next";
import { VerdictBanner } from "@/components/shared/verdict-banner";
import { DisclaimerBox } from "@/components/shared/disclaimer-box";
import { PhotoStrip } from "@/components/estimate/photo-strip";
import { FixtureCard } from "@/components/estimate/fixture-card";
import { FinishCard } from "@/components/estimate/finish-card";
import { IssueList } from "@/components/estimate/issue-list";
import { CostTable } from "@/components/estimate/cost-table";
import { SupplyNotes } from "@/components/estimate/supply-notes";
import { DeliveryStatusCard } from "@/components/estimate/delivery-status-card";
import { notFound } from "next/navigation";
import { formatCad } from "@/lib/format";
import { ROOM_TYPE_OPTIONS } from "@/data/mock";
import { getRealSubmissionById } from "@/lib/supabase/queries";

export const metadata: Metadata = { title: "Your Estimate — CareBy Supplies" };

export default async function EstimatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // No mock fallback: an unknown id must 404, not render a convincing
  // estimate for a submission that doesn't exist.
  const submission = await getRealSubmissionById(id);
  if (!submission) notFound();

  const estimate = submission.estimate;
  const photoCount = submission.input.photoUrls.length;
  const isPendingAnalysis = estimate.vision.confidence === 0;
  const roomLabel =
    ROOM_TYPE_OPTIONS.find((o) => o.value === estimate.vision.roomType)
      ?.label ?? estimate.vision.roomType;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <p className="text-sm font-medium text-muted-foreground">
          {roomLabel} · {estimate.scopeLevel.replace("-", " ")}
        </p>
        <h1 className="text-2xl font-bold">Your instant material estimate</h1>
      </div>

      <div className="flex flex-col gap-8">
        <VerdictBanner
          verdict={estimate.verdict}
          subtext={`${formatCad(estimate.cost.totalLow)} – ${formatCad(estimate.cost.totalHigh)} of materials vs. your ${formatCad(estimate.budgetCad)} budget`}
        />

        <section>
          <h2 className="mb-3 text-lg font-semibold">Your photos</h2>
          <PhotoStrip count={photoCount} />
        </section>

        {isPendingAnalysis ? (
          <section className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            Detailed fixture, finish and issue detection from your photos
            arrives with your full material plan within 48 hours. The
            quantities above come from your room size and scope alone.
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
          <CostTable cost={estimate.cost} />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">What we supply, what you arrange</h2>
          <SupplyNotes notes={estimate.supplyNotes} />
        </section>

        <DisclaimerBox />
        {submission.input.isOwner === false ? (
          <DisclaimerBox>
            You&apos;ve indicated you&apos;re not the property owner.
            Renovations typically require the property owner&apos;s written
            consent — make sure you have permission before proceeding.
          </DisclaimerBox>
        ) : null}
        <DeliveryStatusCard />
      </div>
    </div>
  );
}
