"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/admin/stat-card";
import { Icon } from "@/components/shared/icon";
import { EmptyState } from "@/components/shared/empty-state";
import { PanelSkeleton } from "@/components/shared/skeleton";
import { useAsyncData, useRealtimeRefresh } from "@/lib/store/hooks";
import { getAdminStats, type AdminStats } from "@/services/admin";
import { formatCad } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ActionItem {
  label: string;
  count: number;
  href: string;
  icon: string;
  /** Shown when the count is zero, so "nothing to do" still reads well. */
  clearLabel: string;
  urgent?: boolean;
}

function buildActions(data: AdminStats): ActionItem[] {
  return [
    {
      label: `${data.outOfStock} product${data.outOfStock === 1 ? "" : "s"} out of stock`,
      count: data.outOfStock,
      href: "/admin/products?stock=out-of-stock",
      icon: "Boxes",
      clearLabel: "Nothing out of stock",
      urgent: true,
    },
    {
      label: `${data.newOrders} order${data.newOrders === 1 ? "" : "s"} to confirm`,
      count: data.newOrders,
      href: "/admin/orders",
      icon: "Receipt",
      clearLabel: "No orders waiting",
      urgent: true,
    },
    {
      label: `${data.lowStock} product${data.lowStock === 1 ? "" : "s"} running low`,
      count: data.lowStock,
      href: "/admin/products?stock=low-stock",
      icon: "Boxes",
      clearLabel: "Stock levels healthy",
    },
    {
      label: `${data.pendingVerification} contractor${data.pendingVerification === 1 ? "" : "s"} to verify`,
      count: data.pendingVerification,
      href: "/admin/contractors",
      icon: "HardHat",
      clearLabel: "No contractors waiting",
    },
    {
      label: `${data.pendingServiceRequests} service request${data.pendingServiceRequests === 1 ? "" : "s"} to review`,
      count: data.pendingServiceRequests,
      href: "/admin/requests",
      icon: "ClipboardList",
      clearLabel: "No new requests",
    },
    {
      label: `${data.pendingCalls} call${data.pendingCalls === 1 ? "" : "s"} scheduled`,
      count: data.pendingCalls,
      href: "/admin/calls",
      icon: "Phone",
      clearLabel: "No calls booked",
    },
    {
      label: `${data.pendingPremium} premium enquir${data.pendingPremium === 1 ? "y" : "ies"}`,
      count: data.pendingPremium,
      href: "/admin/premium",
      icon: "Crown",
      clearLabel: "No premium enquiries",
    },
    {
      label: `${data.drawingsAwaiting} drawing${data.drawingsAwaiting === 1 ? "" : "s"} to process`,
      count: data.drawingsAwaiting,
      href: "/admin/drawings",
      icon: "FileUp",
      clearLabel: "No drawings waiting",
    },
  ];
}

/**
 * Admin overview, built around "what needs doing" rather than headline
 * counts. A number on its own ("3 pending requests") still leaves the
 * work of finding them, so every row here is a link to the screen that
 * clears it, and the list is ordered by urgency.
 */
export function AdminDashboard() {
  const { data, loading, error, reload } = useAsyncData(getAdminStats);

  // Orders and stock move these numbers most.
  useRealtimeRefresh("orders", reload);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <PanelSkeleton rows={4} />
        <PanelSkeleton rows={2} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        icon="AlertTriangle"
        title="Couldn't load the overview"
        description={
          error ??
          "If the latest migration hasn't been run yet, some of these tables won't exist."
        }
        action={<Button onClick={reload}>Try again</Button>}
      />
    );
  }

  const actions = buildActions(data);
  const todo = actions.filter((a) => a.count > 0);
  const allClear = todo.length === 0;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <section>
        <h2 className="mb-3 text-lg sm:mb-4">Needs your attention</h2>

        {allClear ? (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success/12 text-success">
              <CheckCircle2 className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-medium">You&apos;re all caught up</p>
              <p className="text-sm text-muted-foreground">
                No orders, requests or stock issues waiting.
              </p>
            </div>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {todo.map((action) => (
              <li key={action.href + action.label}>
                <Link
                  href={action.href}
                  className="press-sm flex items-center gap-3 px-3 py-3 hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:px-4"
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg sm:size-10",
                      action.urgent
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    <Icon name={action.icon} className="size-4 sm:size-5" />
                  </span>

                  <span className="min-w-0 flex-1 text-sm font-medium sm:text-base">
                    {action.label}
                  </span>

                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                      action.urgent
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    {action.count}
                  </span>
                  <ArrowRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg sm:mb-4">Business</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="Revenue"
            value={formatCad(data.revenue)}
            icon="Receipt"
            hint="Excludes cancelled orders"
          />
          <StatCard label="Orders" value={data.orders} icon="ShoppingCart" />
          <StatCard
            label="Active projects"
            value={data.activeProjects}
            icon="FolderKanban"
          />
          <StatCard
            label="Customers"
            value={data.totalUsers}
            icon="UserCheck"
            hint={`${data.homeowners} homeowners · ${data.contractors} contractors`}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg sm:mb-4">Jump to</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {[
            { label: "Add a product", href: "/admin/products", icon: "Boxes" },
            { label: "Categories", href: "/admin/categories", icon: "LayoutGrid" },
            { label: "Orders", href: "/admin/orders", icon: "Receipt" },
            { label: "Customers", href: "/admin/users", icon: "UserCheck" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="press flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-3 text-sm font-medium hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <Icon name={link.icon} className="size-4 shrink-0 text-primary" />
              <span className="truncate">{link.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
