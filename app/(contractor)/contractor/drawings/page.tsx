import type { Metadata } from "next";
import { DrawingUploadFlow } from "@/components/contractor/drawing-upload-flow";
import { DrawingsList } from "@/components/contractor/drawings-list";

export const metadata: Metadata = {
  title: "Upload Drawing — CareBy Contractor",
};

export default function DrawingUploadPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl">Drawing upload</h1>
        <p className="mt-1 text-muted-foreground">
          Send us a drawing and we&apos;ll come back with the materials it
          needs.
        </p>
      </div>

      <DrawingUploadFlow />

      <section className="mt-12">
        <h2 className="mb-4 text-xl">Your drawings</h2>
        <DrawingsList />
      </section>
    </div>
  );
}
