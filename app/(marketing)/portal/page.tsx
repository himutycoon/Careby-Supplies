import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { PackageLookup } from "@/components/portal/package-lookup";

export const metadata: Metadata = {
  title: "Project Portal — CareBy Canada",
};

/**
 * Portal entry point. Customers normally arrive on a direct
 * /customer/package/[id] link from their contractor; this page lets them
 * find a package by id if they've lost the link.
 */
export default function PortalPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 lg:py-24">
      <h1 className="text-4xl">Find your project</h1>
      <p className="mt-2 text-muted-foreground">
        Enter the package ID your contractor sent you.
      </p>

      <div className="mt-8">
        <PackageLookup />
      </div>

      <div className="mt-10">
        <EmptyState
          icon="Headset"
          title="Lost your package ID?"
          description="Your contractor can resend the portal link, or our team can help."
          action={
            <Button
              variant="outline"
              render={<Link href="/contact?about=support">Contact support</Link>}
            />
          }
        />
      </div>
    </div>
  );
}
