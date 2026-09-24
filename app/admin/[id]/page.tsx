import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PhotoStrip } from "@/components/estimate/photo-strip";
import { FixtureCard } from "@/components/estimate/fixture-card";
import { FinishCard } from "@/components/estimate/finish-card";
import { IssueList } from "@/components/estimate/issue-list";
import { CostTable } from "@/components/estimate/cost-table";
import { SupplyNotes } from "@/components/estimate/supply-notes";
import { ReviewForm } from "@/components/admin/review-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCad, formatDate } from "@/lib/format";
import { notFound } from "next/navigation";
import { PROPERTY_TYPE_OPTIONS, ROOM_TYPE_OPTIONS } from "@/data/mock";
import { getRealSubmissionByIdAdmin } from "@/lib/supabase/admin-queries";

export const metadata: Metadata = { title: "Review Submission — CareBy Admin" };

export default async function AdminReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Reviewing a submission that doesn't exist would mean delivering a
  // plan against mock data, so this 404s instead.
  const submission = await getRealSubmissionByIdAdmin(id);
  if (!submission) notFound();

  const estimate = submission.estimate;
  const isPendingAnalysis = estimate.vision.confidence === 0;
  const roomLabel =
    ROOM_TYPE_OPTIONS.find((o) => o.value === estimate.vision.roomType)
      ?.label ?? estimate.vision.roomType;
  const propertyLabel =
    PROPERTY_TYPE_OPTIONS.find(
      (o) => o.value === submission.input.propertyType,
    )?.label ?? submission.input.propertyType;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back to queue
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {roomLabel} · {estimate.scopeLevel.replace("-", " ")} ·{" "}
            {formatCad(estimate.budgetCad)} budget
            {propertyLabel ? (
              <>
                {" "}
                · {propertyLabel}
                {submission?.input.isOwner === false ? " · Not owner" : ""}
              </>
            ) : null}
          </p>
          <h1 className="text-2xl font-bold">Submission {id}</h1>
          {submission ? (
            <p className="text-sm text-muted-foreground">
              Submitted {formatDate(submission.createdAt)}
            </p>
          ) : null}
        </div>
        {submission ? <StatusBadge status={submission.status} /> : null}
      </div>

      <div className="flex flex-col gap-8">
        <section>
          <h2 className="mb-3 text-lg font-semibold">Before photos</h2>
          <PhotoStrip count={submission?.input.photoUrls.length ?? 4} />
        </section>

        {isPendingAnalysis ? (
          <section className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            No AI photo analysis on file for this submission yet (missing
            Anthropic billing, or analysis failed) — review the before
            photos directly to build the plan.
          </section>
        ) : (
          <>
            <section>
              <h2 className="mb-3 text-lg font-semibold">
                AI analysis — detected fixtures
              </h2>
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

        <ReviewForm
          submissionId={id}
          alreadyDelivered={submission?.status === "delivered"}
        />
      </div>
    </div>
  );
}
