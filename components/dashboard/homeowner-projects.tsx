"use client";

import { Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRowSkeleton } from "@/components/shared/skeleton";
import { ProjectStatusBadge } from "@/components/contractor/project-status-badge";
import { useAsyncData } from "@/lib/store/hooks";
import { getProjects } from "@/services/projects";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  repair: "Repair",
  renovation: "Renovation",
  new_construction: "New construction",
  package: "Package",
};

/**
 * Projects the homeowner owns, as opposed to renovation submissions.
 *
 * The New Construction wizard has always written a project row — that is
 * where the saved estimate lives — but the dashboard only ever listed
 * submissions, so finishing the wizard produced something the homeowner
 * could never see again. Contractors had /contractor/projects; homeowners
 * had nothing.
 *
 * Read-only on purpose: there is no homeowner project detail screen, and
 * inventing a dead link would be worse than showing the summary here.
 */
export function HomeownerProjects({
  limit,
  className,
}: {
  limit?: number;
  className?: string;
}) {
  const { data, loading, error, reload } = useAsyncData(getProjects);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: limit ?? 2 }).map((_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="AlertTriangle"
        title="Couldn't load your projects"
        description={error}
        action={<Button onClick={reload}>Try again</Button>}
      />
    );
  }

  const projects = data ?? [];
  const visible = limit ? projects.slice(0, limit) : projects;
  if (visible.length === 0) return null;

  return (
    <ul className={cn("flex flex-col gap-3", className)}>
      {visible.map((project) => (
        <li
          key={project.id}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{project.name}</p>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{TYPE_LABELS[project.type] ?? project.type}</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3" aria-hidden="true" />
                {formatDate(project.createdAt)}
              </span>
              {project.location ? (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3" aria-hidden="true" />
                  {project.location}
                </span>
              ) : null}
              {project.supportPackage ? (
                <span>{project.supportPackage} package</span>
              ) : null}
            </p>
          </div>
          <ProjectStatusBadge status={project.status} />
        </li>
      ))}
    </ul>
  );
}
