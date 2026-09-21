import Link from "next/link";
import {
  ArrowRight,
  Bath,
  CookingPot,
  Fence,
  Home,
  Layers,
  PencilRuler,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { HomeownerProjects } from "@/components/dashboard/homeowner-projects";
import { formatCad, formatDate } from "@/lib/format";
import { ROOM_TYPE_OPTIONS } from "@/data/mock";
import type { RoomType, Submission, SubmissionStatus } from "@/lib/types";

const ROOM_ICONS: Partial<Record<RoomType, LucideIcon>> = {
  bathroom: Bath,
  kitchen: CookingPot,
  basement: Layers,
  deck: Fence,
};

/*
 * Progress is the submission's real stage, not a percentage.
 *
 * The reference design shows "60%", but nothing records how far through
 * a plan the designer is — a number here would be invented. What is
 * recorded is which of three stages the submission has reached, so the
 * bar fills by stage and says so in words.
 */
const STAGES: Record<SubmissionStatus, { step: number; label: string }> = {
  draft: { step: 0, label: "Not submitted yet" },
  submitted: { step: 1, label: "Received — waiting for a designer" },
  "in-review": { step: 2, label: "Your plan is being prepared" },
  delivered: { step: 3, label: "Plan delivered" },
};
const TOTAL_STEPS = 3;

function SubmissionRow({ submission }: { submission: Submission }) {
  const room = submission.input.roomType;
  const roomLabel =
    ROOM_TYPE_OPTIONS.find((o) => o.value === room)?.label ?? room;
  const Icon = ROOM_ICONS[room] ?? Home;
  const stage = STAGES[submission.status];
  const isDelivered = submission.status === "delivered";
  const href = isDelivered
    ? `/report/${submission.id}`
    : `/estimate/${submission.id}`;

  return (
    <li>
      <Link
        href={href}
        className="group flex gap-3 rounded-xl border border-border p-3 transition-colors hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-medium">
              {roomLabel} ·{" "}
              <span className="capitalize">
                {submission.input.scopeLevel.replace("-", " ")}
              </span>
            </p>
            <StatusBadge status={submission.status} className="shrink-0" />
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDate(submission.createdAt)} · Budget{" "}
            {formatCad(submission.input.budgetCad)}
          </p>
          {submission.input.notes ? (
            <p className="mt-1 line-clamp-2 text-xs text-foreground/75">
              {submission.input.notes}
            </p>
          ) : null}

          <div className="mt-2.5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{stage.label}</span>
              <span className="tabular-nums">
                Step {stage.step} of {TOTAL_STEPS}
              </span>
            </div>
            <div
              className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={TOTAL_STEPS}
              aria-valuenow={stage.step}
              aria-label={stage.label}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${(stage.step / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}

export function ActiveProjects({
  submissions,
  projectCount,
  limit = 2,
}: {
  submissions: Submission[];
  projectCount: number;
  limit?: number;
}) {
  if (submissions.length === 0 && projectCount === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
        <PencilRuler
          className="size-6 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="text-sm font-medium">No projects yet</p>
        <p className="text-xs text-muted-foreground">
          Upload a few photos and we&apos;ll take it from there.
        </p>
        <Button
          size="sm"
          className="press mt-1"
          render={
            <Link href="/new">
              Start a project <ArrowRight className="size-3.5" />
            </Link>
          }
        />
      </div>
    );
  }

  const visible = submissions.slice(0, limit);

  return (
    <div className="flex flex-col gap-3">
      {visible.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {visible.map((submission) => (
            <SubmissionRow key={submission.id} submission={submission} />
          ))}
        </ul>
      ) : null}
      {/* New Construction writes a project row rather than a submission,
          so the wizard's own output was invisible here. */}
      <HomeownerProjects limit={limit} />
    </div>
  );
}
