import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductsTable } from "@/components/admin/products-table";
import { ListRowSkeleton } from "@/components/shared/skeleton";

export const metadata: Metadata = { title: "Products — CareBy Admin" };

export default function AdminProductsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl">Inventory</h1>
        <p className="mt-1 text-muted-foreground">
          Stock counts, pricing and what&apos;s running low.
        </p>
      </div>

      {/* ProductsTable reads ?stock= to open pre-filtered from the
          dashboard, and useSearchParams needs a Suspense boundary or the
          whole page bails out of static prerendering. */}
      <Suspense
        fallback={
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <ListRowSkeleton key={i} />
            ))}
          </div>
        }
      >
        <ProductsTable />
      </Suspense>
    </div>
  );
}
