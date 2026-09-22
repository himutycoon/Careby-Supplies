import type { Metadata } from "next";
import { PackageReview } from "@/components/contractor/package-review";

export const metadata: Metadata = {
  title: "Package — CareBy Contractor",
};

export default async function ContractorPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
      <PackageReview reference={id} />
    </div>
  );
}
