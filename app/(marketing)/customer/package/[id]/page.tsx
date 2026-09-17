import type { Metadata } from "next";
import { PackagePortal } from "@/components/portal/package-portal";

export const metadata: Metadata = {
  title: "Project Portal — CareBy Canada",
};

export default async function CustomerPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
      <PackagePortal packageId={id} />
    </div>
  );
}
