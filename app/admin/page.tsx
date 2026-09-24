import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const metadata: Metadata = { title: "Admin — CareBy Supplies" };

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8">
        <h1 className="text-3xl">Platform overview</h1>
        <p className="mt-1 text-muted-foreground">
          Everything happening across CareBy right now.
        </p>
      </div>
      <AdminDashboard />
    </div>
  );
}
