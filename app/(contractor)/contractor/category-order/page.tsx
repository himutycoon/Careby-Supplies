import type { Metadata } from "next";
import { CategoryOrderFlow } from "@/components/contractor/category-order-flow";

export const metadata: Metadata = {
  title: "Category Order — CareBy Contractor",
};

export default function CategoryOrderPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
      <CategoryOrderFlow />
    </div>
  );
}
