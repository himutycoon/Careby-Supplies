import type { Metadata } from "next";
import { ProductDetail } from "@/components/shop/product-detail";

export const metadata: Metadata = { title: "Product — CareBy Supplies" };

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <ProductDetail productId={id} />
    </div>
  );
}
