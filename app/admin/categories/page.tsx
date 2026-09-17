import type { Metadata } from "next";
import { CategoriesTable } from "@/components/admin/categories-table";

export const metadata: Metadata = { title: "Categories — CareBy Admin" };

export default function AdminCategoriesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl">Categories</h1>
        <p className="mt-1 text-muted-foreground">
          How the catalog is grouped for shoppers.
        </p>
      </div>
      <CategoriesTable />
    </div>
  );
}
