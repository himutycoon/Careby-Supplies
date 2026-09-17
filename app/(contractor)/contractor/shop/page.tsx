import type { Metadata } from "next";
import { CatalogBrowser } from "@/components/shop/catalog-browser";

export const metadata: Metadata = { title: "Shop Products — CareBy Contractor" };

export default function ContractorShopPage() {
  return (
    <div>
      <div className="border-b border-border bg-background px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl">Building materials & supplies</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Trade pricing applied to your account. Bulk quantities and
            project assignment available at checkout.
          </p>
        </div>
      </div>
      <CatalogBrowser showContractorPrice />
    </div>
  );
}
