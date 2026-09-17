"use client";

import Link from "next/link";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRowSkeleton } from "@/components/shared/skeleton";
import { ProjectStatusBadge } from "@/components/contractor/project-status-badge";
import { useAsyncData } from "@/lib/store/hooks";
import { getProjects } from "@/services/projects";
import { formatDate } from "@/lib/format";

export function ProjectsList({
  limit,
  basePath = "/contractor/projects",
}: {
  limit?: number;
  basePath?: string;
}) {
  const { data, loading, error, reload } = useAsyncData(getProjects);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: limit ?? 3 }).map((_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="AlertTriangle"
        title="Couldn't load projects"
        description={error}
        action={<Button onClick={reload}>Try again</Button>}
      />
    );
  }

  const projects = data ?? [];
  const visible = limit ? projects.slice(0, limit) : projects;

  if (visible.length === 0) {
    return (
      <EmptyState
        icon="FolderKanban"
        title="No projects yet"
        description="Start a project to keep materials, packages and drawings for a job in one place."
        action={
          <Button
            render={
              <Link href="/contractor/category-order">Start a project</Link>
            }
          />
        }
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {visible.map((project) => (
        <li key={project.id}>
          <Link
            href={`${basePath}/${project.id}`}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 transition-colors hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{project.name}</p>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3" aria-hidden="true" />
                  {formatDate(project.createdAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3" aria-hidden="true" />
                  {project.location}
                </span>
                {project.subtype ? (
                  <span className="capitalize">{project.subtype}</span>
                ) : null}
              </p>
            </div>
            <ProjectStatusBadge status={project.status} />
            <ArrowRight
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
