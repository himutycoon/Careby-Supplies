import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmissionCard } from "@/components/dashboard/submission-card";
import { OrdersList } from "@/components/shop/orders-list";
import { EmptyState } from "@/components/shared/empty-state";
import { EditorialImage } from "@/components/shared/editorial-image";
import { Icon } from "@/components/shared/icon";
import { createClient } from "@/lib/supabase/server";
import {
  countProjectsForCurrentUser,
  getRealSubmissionsForCurrentUser,
} from "@/lib/supabase/queries";
import { HOMEOWNER_NAV } from "@/data/navigation";
import { RecommendedProducts } from "@/components/dashboard/recommended-products";
import { RequestsList } from "@/components/dashboard/requests-list";
import { HomeownerProjects } from "@/components/dashboard/homeowner-projects";

export const metadata: Metadata = { title: "Home — CareBy Canada" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const name =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "there";

  const submissions = await getRealSubmissionsForCurrentUser();
  const projectCount = await countProjectsForCurrentUser();
  const actions = HOMEOWNER_NAV.filter((item) => item.href !== "/dashboard");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8">
        <h1 className="text-3xl">
          Hi, <span className="capitalize">{name}</span> 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          What can we help you with?
        </p>
      </div>

      {/* Primary paths — large, warm, visual. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon name={action.icon} className="size-6" />
            </span>
            <span className="min-w-0 flex-1 font-semibold">
              {action.label}
            </span>
            <ArrowRight
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>

      {/* Renovation submissions and projects (Supabase-backed) */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg">Your projects</h2>
        {submissions.length === 0 && projectCount === 0 ? (
          <EmptyState
            icon="Ruler"
            title="No projects yet"
            description="Start with a renovation estimate — upload a few photos and we'll take it from there."
            action={
              <Button
                render={
                  <Link href="/new">
                    Start a project <ArrowRight className="size-4" />
                  </Link>
                }
              />
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            {submissions.map((submission) => (
              <SubmissionCard key={submission.id} submission={submission} />
            ))}
          </div>
        )}

        {/* New Construction writes a project row rather than a submission,
            so the wizard's own output was invisible here. */}
        <HomeownerProjects className={submissions.length > 0 ? "mt-4" : ""} />
      </section>

      {/* Repair / project requests */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg">Your requests</h2>
        <RequestsList limit={4} />
      </section>

      {/* Material orders */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg">Recent orders</h2>
          <Link
            href="/orders"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        <OrdersList limit={3} />
      </section>

      {/* Premium banner */}
      <section className="mt-10">
        <div className="relative overflow-hidden rounded-2xl bg-ink p-8 text-ink-foreground sm:p-10">
          <div className="relative z-10 max-w-lg">
            <span className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
              Premium Package
            </span>
            <h2 className="mt-3 text-balance text-ink-foreground">
              Your dream home starts here
            </h2>
            <p className="mt-3 text-ink-foreground/70">
              Expert advice, architect support, permits and material
              selection — managed end to end.
            </p>
            <Button
              className="mt-5"
              render={
                <Link href="/premium">
                  Explore Premium <ArrowRight className="size-4" />
                </Link>
              }
            />
          </div>
          <div
            className="pointer-events-none absolute -right-20 -bottom-24 size-80 rounded-full bg-primary/15 blur-3xl"
            aria-hidden="true"
          />
        </div>
      </section>

      {/* Recommended products */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg">Recommended for you</h2>
          <Link
            href="/products"
            className="text-sm font-medium text-primary hover:underline"
          >
            Shop all
          </Link>
        </div>
        <RecommendedProducts count={3} />
      </section>

      {/* Expert support */}
      <section className="mt-10">
        <div className="flex flex-col items-start gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center">
          <EditorialImage
            tone="forest"
            alt="Talk to an expert"
            className="h-24 w-full shrink-0 sm:size-24"
          />
          <div className="flex-1">
            <h3 className="text-lg">Not sure where to start?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Talk to an advisor who knows local codes, pricing and what
              your project actually needs.
            </p>
          </div>
          <Button
            variant="outline"
            render={<Link href="/contact?about=consultation">Talk to an Expert</Link>}
          />
        </div>
      </section>
    </div>
  );
}
