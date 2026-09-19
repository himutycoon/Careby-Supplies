"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { PanelSkeleton } from "@/components/shared/skeleton";
import { ProjectStatusBadge } from "@/components/contractor/project-status-badge";
import { useToast } from "@/components/shared/toast";
import { getProjectById, updateProjectStatus } from "@/services/projects";
import { getOrders } from "@/services/orders";
import { useAsyncData } from "@/lib/store/hooks";
import { OrderStatusBadge } from "@/components/shop/order-status-badge";
import { formatCad, formatDate } from "@/lib/format";
import type { Project, ProjectStatus } from "@/lib/types";

const STATUSES: ProjectStatus[] = [
  "planning",
  "in-progress",
  "materials-ready",
  "completed",
];

export function ProjectDetail({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const { data: orderData } = useAsyncData(getOrders);
  const orders = orderData ?? [];
  const [project, setProject] = React.useState<Project | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    let cancelled = false;
    getProjectById(projectId)
      .then((data) => {
        if (!cancelled) setProject(data);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (!loaded) {
    return (
      <div className="flex flex-col gap-4">
        <PanelSkeleton rows={2} />
        <PanelSkeleton rows={3} />
      </div>
    );
  }

  if (!project) {
    return (
      <EmptyState
        icon="FolderKanban"
        title="Project not found"
        description="This project doesn't exist, or it belongs to another account."
        action={
          <Button render={<Link href="/contractor/projects">All projects</Link>} />
        }
      />
    );
  }

  // Orders carrying a line assigned to this project.
  const linkedOrders = orders.filter((order) =>
    order.lines.some((line) => line.projectId === project.id),
  );

  function changeStatus(status: ProjectStatus) {
    startTransition(async () => {
      const result = await updateProjectStatus(project!.id, status);
      if (result.ok) {
        setProject(result.data);
        toast("Project status updated");
      } else {
        toast(result.error, "error");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary capitalize">
            {project.type.replace("-", " ")} · {project.subtype}
          </p>
          <h1 className="mt-1 text-3xl">{project.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5" aria-hidden="true" />
              {formatDate(project.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" aria-hidden="true" />
              {project.location}
            </span>
          </p>
        </div>
        <ProjectStatusBadge status={project.status} />
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-lg">Update status</h2>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((status) => (
            <Button
              key={status}
              size="sm"
              variant={project.status === status ? "default" : "outline"}
              disabled={isPending}
              onClick={() => changeStatus(status)}
              className="capitalize"
            >
              {status.replace("-", " ")}
            </Button>
          ))}
        </div>
      </section>

      {project.notes ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-2 text-lg">Notes</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {project.notes}
          </p>
        </section>
      ) : null}

      {project.supportPackage ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-2 text-lg">Support package</h2>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {project.supportPackage}
            </span>
            {project.supportPackagePriceCad
              ? ` · ${formatCad(project.supportPackagePriceCad)}`
              : ""}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Requested, not yet charged — an advisor confirms scope and
            price before any invoice.
          </p>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-lg">Linked orders</h2>
        {linkedOrders.length === 0 ? (
          <EmptyState
            icon="Receipt"
            title="No orders against this project yet"
            description="Assign materials to this project in your cart, then check out — the order appears here."
            action={
              <Button
                variant="outline"
                render={<Link href="/contractor/shop">Shop materials</Link>}
              />
            }
          />
        ) : (
          <ul className="flex flex-col gap-2.5">
            {linkedOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 transition-colors hover:border-primary/40"
                >
                  <span className="min-w-0 flex-1 font-medium">{order.id}</span>
                  <OrderStatusBadge status={order.status} />
                  <span className="font-semibold tabular-nums">
                    {formatCad(order.total)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div>
        <Button
          variant="outline"
          render={
            <Link href="/contractor/projects">
              <ArrowLeft className="size-4" /> All projects
            </Link>
          }
        />
      </div>
    </div>
  );
}
