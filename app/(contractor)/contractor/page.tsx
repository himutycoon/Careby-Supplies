import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Plus, ShoppingCart } from "lucide-react";
import { QuickActionGrid } from "@/components/dashboard/quick-action-grid";
import { OrdersList } from "@/components/shop/orders-list";
import { ProjectsList } from "@/components/contractor/projects-list";
import { PackagesList } from "@/components/contractor/packages-list";
import { AppointmentsList } from "@/components/contractor/appointments-list";
import { createClient } from "@/lib/supabase/server";
import { CONTRACTOR_NAV } from "@/data/navigation";

export const metadata: Metadata = { title: "Dashboard — CareBy Contractor" };

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const QUICK_ACTION_HREFS = [
  "/contractor/shop",
  "/contractor/call-order",
  "/contractor/packages/new",
  "/contractor/category-order",
  "/contractor/drawings",
];

export default async function ContractorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const name =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "there";

  const quickActions = CONTRACTOR_NAV.filter((item) =>
    QUICK_ACTION_HREFS.includes(item.href),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8">
        <h1 className="text-3xl">
          {greeting()}, <span className="capitalize">{name}</span>
        </h1>
        <p className="mt-1 text-muted-foreground">
          What are you working on today?
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/contractor/shop"
          className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <ShoppingCart className="size-6" aria-hidden="true" />
          </span>
          <span className="flex flex-col">
            <span className="font-semibold">Shop Products</span>
            <span className="text-sm text-muted-foreground">
              Browse materials at trade pricing
            </span>
          </span>
          <ArrowRight
            className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>

        <Link
          href="/contractor/category-order"
          className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Plus className="size-6" aria-hidden="true" />
          </span>
          <span className="flex flex-col">
            <span className="font-semibold">Start a Project</span>
            <span className="text-sm text-muted-foreground">
              Repair, renovation or new construction
            </span>
          </span>
          <ArrowRight
            className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg">Quick actions</h2>
        <QuickActionGrid items={quickActions} />
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg">Recent orders</h2>
            <Link
              href="/contractor/orders"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <OrdersList limit={3} />
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg">Recent projects</h2>
            <Link
              href="/contractor/projects"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <ProjectsList limit={3} />
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg">Saved packages</h2>
            <Link
              href="/contractor/packages"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <PackagesList limit={3} />
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg">Scheduled calls</h2>
            <Link
              href="/contractor/call-order"
              className="text-sm font-medium text-primary hover:underline"
            >
              Schedule
            </Link>
          </div>
          <AppointmentsList limit={3} />
        </section>
      </div>

      <p className="mt-10 text-xs text-muted-foreground">
        Figures shown anywhere in the platform are indicative planning
        guidance, not a construction contract. Payment is not taken
        online — an advisor confirms every order before it is invoiced.
      </p>
    </div>
  );
}
