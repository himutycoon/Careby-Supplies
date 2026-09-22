import type { Metadata } from "next";
import { PackageScopeBuilder } from "@/components/contractor/package-scope-builder";

export const metadata: Metadata = {
  title: "Create Package — CareBy Contractor",
};

export default function CreatePackagePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8">
        <h1 className="text-3xl">Create a customer package</h1>
        <p className="mt-1 text-muted-foreground">
          Start from a template, set the scope, and send one link with
          every decision your customer has to make.
        </p>
      </div>
      <PackageScopeBuilder />
    </div>
  );
}
