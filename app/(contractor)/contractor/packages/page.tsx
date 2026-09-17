import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PackagesList } from "@/components/contractor/packages-list";

export const metadata: Metadata = {
  title: "Saved Packages — CareBy Contractor",
};

export default function SavedPackagesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl">Saved packages</h1>
          <p className="mt-1 text-muted-foreground">
            Material bundles you&apos;ve built for customers.
          </p>
        </div>
        <Button
          render={
            <Link href="/contractor/packages/new">
              <Plus className="size-4" /> Create package
            </Link>
          }
        />
      </div>
      <PackagesList />
    </div>
  );
}
