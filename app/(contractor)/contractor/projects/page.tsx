import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectsList } from "@/components/contractor/projects-list";

export const metadata: Metadata = { title: "Projects — CareBy Contractor" };

export default function ContractorProjectsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl">Projects</h1>
          <p className="mt-1 text-muted-foreground">
            Group orders, packages and drawings under a single job.
          </p>
        </div>
        <Button
          render={
            <Link href="/contractor/category-order">
              <Plus className="size-4" /> Start a project
            </Link>
          }
        />
      </div>
      <ProjectsList />
    </div>
  );
}
