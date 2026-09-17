import type { Metadata } from "next";
import { PackageBuilder } from "@/components/contractor/package-builder";

export const metadata: Metadata = {
  title: "Create Package — CareBy Contractor",
};

export default function CreatePackagePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8">
        <h1 className="text-3xl">Create a customer package</h1>
        <p className="mt-1 text-muted-foreground">
          Bundle materials for a customer and give them their own portal
          login.
        </p>
      </div>
      <PackageBuilder />
    </div>
  );
}
