import type { Metadata } from "next";
import {
  CircleCheck,
  ClipboardList,
  FolderKanban,
  ShoppingCart,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  countProjectsForCurrentUser,
  getRealSubmissionsForCurrentUser,
} from "@/lib/supabase/queries";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { ServiceTiles } from "@/components/dashboard/service-tiles";
import { HelpRail } from "@/components/dashboard/help-rail";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { ActiveProjects } from "@/components/dashboard/active-projects";
import { RequestsList } from "@/components/dashboard/requests-list";
import { OrdersList } from "@/components/shop/orders-list";
import { RecommendedProducts } from "@/components/dashboard/recommended-products";

export const metadata: Metadata = { title: "Home — CareBy Supplies" };

/**
 * Homeowner dashboard.
 *
 * Three bands: a greeting with the one action most people came for, the
 * five ways to start something, and then everything already in motion —
 * projects, requests, orders and suggestions — side by side rather than
 * stacked, so a returning homeowner sees their state without scrolling.
 *
 * A single grid carries all of it so the phone order can differ from the
 * desktop layout: on a phone the help rail drops below the user's own
 * projects and orders, because those are what they came back to check.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ consultation?: string; ref?: string }>;
}) {
  // Stripe sends the customer back here after a paid package or session.
  // Until now nothing read the parameter, so the only confirmation they
  // got was Stripe's own emailed receipt.
  const { consultation, ref } = await searchParams;
  const justPaid = consultation === "paid";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const name =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "there";

  const [submissions, projectCount] = await Promise.all([
    getRealSubmissionsForCurrentUser(),
    countProjectsForCurrentUser(),
  ]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">
      {justPaid ? (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-success/40 bg-success/10 p-4 sm:mb-5">
          <CircleCheck
            className="mt-0.5 size-5 shrink-0 text-success"
            aria-hidden="true"
          />
          <div>
            <p className="font-medium">Payment received — thank you.</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              An advisor will be in touch within two business days
              {ref ? ` about ${ref}` : ""}. Your receipt is on its way by
              email, and the fee comes back as a discount code against your
              material order.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-6">
        <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
          <DashboardHero name={name} />
          <ServiceTiles />
        </div>

        <div className="order-last xl:order-none">
          <HelpRail />
        </div>

        {/* items-start: each panel is as tall as its content. Stretched to
            the tallest column, a one-project panel was mostly empty card. */}
        <div className="grid min-w-0 items-start gap-4 sm:gap-5 md:grid-cols-2 xl:col-span-2 xl:grid-cols-3">
          <DashboardPanel
            id="projects"
            icon={FolderKanban}
            title="Active projects"
            href="/new"
            hrefLabel="New estimate"
          >
            <ActiveProjects
              submissions={submissions}
              projectCount={projectCount}
            />
          </DashboardPanel>

          <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
            <DashboardPanel
              id="requests"
              icon={ClipboardList}
              title="Your requests"
            >
              <RequestsList limit={3} compact />
            </DashboardPanel>

            <DashboardPanel
              icon={ShoppingCart}
              title="Recent orders"
              href="/orders"
            >
              <OrdersList limit={2} compact />
            </DashboardPanel>
          </div>

          <div className="min-w-0 md:col-span-2 xl:col-span-1">
            <RecommendedProducts count={3} variant="list" />
          </div>
        </div>
      </div>
    </div>
  );
}
