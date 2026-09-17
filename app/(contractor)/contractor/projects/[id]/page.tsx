import type { Metadata } from "next";
import { ProjectDetail } from "@/components/contractor/project-detail";

export const metadata: Metadata = { title: "Project — CareBy Contractor" };

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10">
      <ProjectDetail projectId={id} />
    </div>
  );
}
