import type { Metadata } from "next";
import { Boxes, FolderKanban, Phone, Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ContractorHero } from "@/components/contractor/contractor-hero";
import { ContractorTiles } from "@/components/contractor/contractor-tiles";
import { ContractorRail } from "@/components/contractor/contractor-rail";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { OrdersList } from "@/components/shop/orders-list";
import { ProjectsList } from "@/components/contractor/projects-list";
import { PackagesList } from "@/components/contractor/packages-list";
import { AppointmentsList } from "@/components/contractor/appointments-list";

export const metadata: Metadata = { title: "Dashboard — CareBy Contractor" };

/**
 * Contractor dashboard, built like the homeowner one.
 *
 * Three bands: greeting with the action a trade account opens the site
 * for, the five things they start here, then everything already running
 * — projects, packages, orders and booked calls — side by side rather
 * than stacked down a single column.
 *
 * One grid carries all of it so the phone order can differ from the
 * desktop layout: on a phone the help rail drops below the work in
 * progress, which is what a contractor opens this page to check.
 */
export default async function ContractorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const name =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "there";

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">
      <div className="grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-6">
        <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
          <ContractorHero name={name} />
          <ContractorTiles />
        </div>

        <div className="order-last xl:order-none">
          <ContractorRail />
        </div>

        {/* items-start so a short panel is not stretched to match the
            tallest column beside it. */}
        <div className="grid min-w-0 items-start gap-4 sm:gap-5 md:grid-cols-2 xl:col-span-2 xl:grid-cols-3">
          <DashboardPanel
            id="projects"
            icon={FolderKanban}
            title="Projects"
            href="/contractor/projects"
          >
            <ProjectsList limit={3} />
          </DashboardPanel>

          <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
            <DashboardPanel
              icon={Receipt}
              title="Recent orders"
              href="/contractor/orders"
            >
              <OrdersList limit={2} compact />
            </DashboardPanel>

            <DashboardPanel
              icon={Phone}
              title="Scheduled calls"
              href="/contractor/call-order"
              hrefLabel="Schedule"
            >
              <AppointmentsList limit={2} />
            </DashboardPanel>
          </div>

          <div className="min-w-0 md:col-span-2 xl:col-span-1">
            <DashboardPanel
              icon={Boxes}
              title="Customer packages"
              subtitle="Selection lists you have sent out."
              href="/contractor/packages"
            >
              <PackagesList limit={3} />
            </DashboardPanel>
          </div>
        </div>
      </div>

      {/*
        Payment used to read "Payment is not taken online". Stripe
        checkout exists now, so that sentence had become untrue — the
        remaining caveat is about figures, not about how you pay.
      */}
      <p className="mt-6 text-xs text-muted-foreground">
        Figures shown anywhere in the platform are indicative planning
        guidance, not a construction contract.
      </p>
    </div>
  );
}
